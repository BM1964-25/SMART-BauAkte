#!/usr/bin/env python3
import base64
import csv
import json
import hashlib
import hmac
import io
import mimetypes
import os
import re
import shutil
import smtplib
import subprocess
import sqlite3
import threading
import time
import uuid
from email.message import EmailMessage
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "bauakte.db"
UPLOAD_DIR = ROOT / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
FILE_STORAGE_DRIVER = os.environ.get("BAUAKTE_FILE_STORAGE", "local")
DB_DRIVER = os.environ.get("BAUAKTE_DB_DRIVER", "sqlite")
MAIL_DRIVER = os.environ.get("BAUAKTE_MAIL_DRIVER", "outbox")
MAIL_FROM = os.environ.get("BAUAKTE_MAIL_FROM", "BauAkte KI <noreply@bauakte.local>")
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587") or "587")
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_TLS = os.environ.get("SMTP_TLS", "true").lower() not in {"0", "false", "nein", "no"}
FILE_ENCRYPTION = os.environ.get("BAUAKTE_FILE_ENCRYPTION", "local-dev")
PASSWORD_ITERATIONS = int(os.environ.get("BAUAKTE_PASSWORD_ITERATIONS", "260000") or "260000")
SESSION_HOURS = int(os.environ.get("SESSION_HOURS", "10") or "10")
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() in {"1", "true", "ja", "yes"}
LOGIN_MAX_ATTEMPTS = int(os.environ.get("LOGIN_MAX_ATTEMPTS", "5") or "5")
LOGIN_LOCK_MINUTES = int(os.environ.get("LOGIN_LOCK_MINUTES", "15") or "15")
ESCALATION_INTERVAL_MINUTES = int(os.environ.get("BAUAKTE_ESCALATION_INTERVAL_MINUTES", "240") or "240")
DEMO_EMAIL = "anna@schneider-sohn.example"
DEMO_PASSWORD = "demo2026"
DEFAULT_TENANT_ID = "schneider-sohn"
DEFAULT_TENANT_NAME = "Schneider & Sohn GmbH"
OCR_QUEUE_LOCK = threading.Lock()
ESCALATION_LOCK = threading.Lock()
ESCALATION_SCHEDULER = {"last_run_at": None, "last_result": None, "interval_minutes": ESCALATION_INTERVAL_MINUTES}
OCR_WORKER_RUNNING = False
DEFAULT_EMAIL_TEMPLATES = {
    "deadline_reminder": {
        "label": "Frist-Erinnerung",
        "subject": "Frist-Erinnerung aus BauAkte KI",
        "body": "Offene Fristen und Wiedervorlagen:\n\n{items}\n\nAusgelöst durch: {actor}",
    },
    "task_reminder": {
        "label": "Aufgaben-Erinnerung",
        "subject": "Aufgaben-Erinnerung aus BauAkte KI",
        "body": "Offene kritische Aufgaben:\n\n{items}\n\nAusgelöst durch: {actor}",
    },
    "escalation": {
        "label": "Eskalation",
        "subject": "Eskalation aus BauAkte KI",
        "body": "{rule_name}\n\n{title}\n{detail}\n\nZielrolle: {target_role}\nAusgelöst durch: {actor}",
    },
}

DEFAULT_INVOICE_RULES = [
    ("rule-elektro", "Elektro", "3400", 19, "Material / Elektro"),
    ("rule-material", "Material", "3400", 19, "Materialeinkauf"),
    ("rule-lieferant", "Lieferant", "3400", 19, "Materialeinkauf"),
    ("rule-subunternehmer", "Subunternehmer", "3100", 19, "Fremdleistungen"),
    ("rule-fremdleistung", "Fremdleistung", "3100", 19, "Fremdleistungen"),
    ("rule-miete", "Miete", "4210", 19, "Miete / Geräte"),
    ("rule-geraete", "Geräte", "4210", 19, "Miete / Geräte"),
    ("rule-fahrt", "Fahrt", "4670", 19, "Fahrzeugkosten"),
    ("rule-versicherung", "Versicherung", "4360", 19, "Versicherung"),
]

PERMISSION_LABELS = {
    "backup.create": "Backups",
    "chat.ask": "KI-Assistent",
    "deadline.create": "Fristen",
    "document.archive": "Archivieren",
    "document.export": "Export",
    "document.restore": "Wiederherstellen",
    "document.search": "Suche",
    "document.update": "Dokumente bearbeiten",
    "document.upload": "Upload",
    "document.view": "Dokumente ansehen",
    "project.create": "Bauakten",
    "user.manage": "Admin",
}


def db():
    if DB_DRIVER != "sqlite":
        raise RuntimeError("Dieser lokale MVP-Server nutzt SQLite. Für Produktion ist ein PostgreSQL-Adapter vorbereitet, aber noch nicht verbunden.")
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


class LocalFileStorage:
    name = "local"

    def save(self, stored_name, content):
        target = UPLOAD_DIR / stored_name
        target.write_bytes(content)
        return target

    def path(self, stored_name):
        return UPLOAD_DIR / stored_name

    def exists(self, stored_name):
        return self.path(stored_name).exists()


class PreparedObjectStorage:
    name = "object-storage-prepared"

    def __init__(self):
        self.local = LocalFileStorage()

    def save(self, stored_name, content):
        return self.local.save(stored_name, content)

    def path(self, stored_name):
        return self.local.path(stored_name)

    def exists(self, stored_name):
        return self.local.exists(stored_name)


FILE_STORAGE = PreparedObjectStorage() if FILE_STORAGE_DRIVER != "local" else LocalFileStorage()


def now_ms():
    return int(time.time() * 1000)


def sha256_bytes(content):
    return hashlib.sha256(content).hexdigest()


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def slugify(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9äöüß]+", "-", value)
    return value.strip("-") or f"projekt-{now_ms()}"


def extract_due_from_text(text):
    lower = (text or "").lower()
    if re.search(r"\b(sofort|umgehend|heute)\b", lower):
        return "sofort"
    date_match = re.search(r"\b(\d{1,2}\.\d{1,2}\.(?:\d{2}|\d{4}))\b", lower)
    if date_match:
        return date_match.group(1)
    iso_match = re.search(r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b", lower)
    if iso_match:
        return f"{int(iso_match.group(3)):02d}.{int(iso_match.group(2)):02d}.{iso_match.group(1)}"
    days_match = re.search(r"(zahlungsziel|frist|fällig|faellig|bis)\D{0,30}(\d{1,3})\s*(tage|tag)", lower)
    if days_match:
        return f"{int(days_match.group(2))} Tage"
    return None


def suggested_action_for(inferred):
    doc_type = inferred["type"]
    if inferred["tone"] == "risk":
        if doc_type == "Mangel":
            return "Mangel sofort an Bauleitung geben"
        if doc_type == "Nachtrag":
            return "Nachtrag entscheiden und Frist setzen"
        return "Sofort Aufgabe an Bauleitung vergeben"
    if doc_type == "Rechnung":
        return "Rechnung prüfen und zur Zahlung freigeben"
    if doc_type == "Lieferschein":
        return "Lieferung mit Bestellung abgleichen"
    if doc_type == "Abnahme":
        return "Abnahmeunterlagen prüfen und freigeben"
    if doc_type == "Angebot":
        return "Angebot fachlich prüfen und entscheiden"
    if doc_type == "Plan":
        return "Planstand prüfen und ablegen"
    return "Fachlich prüfen und bestätigen"


def infer_document(filename, text=""):
    lower_name = filename.lower()
    lower = f"{lower_name} {(text or '').lower()}"
    rules = [
        ("Mangel", {"mangel", "schaden", "defekt", "reklamation", "nachbesserung"}, {"status": "klären", "due": "sofort", "tone": "risk", "confidence": 90}),
        ("Nachtrag", {"nachtrag", "mehrkosten", "zusatzleistung", "änderung", "aenderung"}, {"status": "offen", "due": "3 Tage", "tone": "risk", "confidence": 88}),
        ("Rechnung", {"rechnung", "zahlungsziel", "betrag", "netto", "brutto", "ust", "iban"}, {"status": "offen", "due": "14 Tage", "tone": "warn", "confidence": 92}),
        ("Lieferschein", {"lieferschein", "lieferung", "geliefert", "wareneingang"}, {"status": "prüfen", "due": "7 Tage", "tone": "warn", "confidence": 92}),
        ("Abnahme", {"abnahme", "abnahmeprotokoll", "protokoll", "fertigstellung"}, {"status": "offen", "due": "7 Tage", "tone": "warn", "confidence": 86}),
        ("Angebot", {"angebot", "bindefrist", "pauschalpreis"}, {"status": "offen", "due": "14 Tage", "tone": "warn", "confidence": 85}),
        ("Plan", {"plan", "ausführungsplan", "ausfuehrungsplan", "grundriss", "schnitt"}, {"status": "geprüft", "due": "keine", "tone": "ok", "confidence": 88}),
    ]
    best_type = "Dokument"
    best_score = 0
    best_values = {"status": "prüfen", "due": "keine", "tone": "warn", "confidence": 75}
    for doc_type, keywords, values in rules:
        score = sum(1 for keyword in keywords if keyword in lower)
        if doc_type == "Rechnung" and lower_name.startswith("re-"):
            score += 2
        if score > best_score:
            best_type = doc_type
            best_score = score
            best_values = values
    due = extract_due_from_text(lower) or best_values["due"]
    confidence = min(98, best_values["confidence"] + max(0, best_score - 1) * 2)
    inferred = {"type": best_type, **best_values, "due": due, "confidence": confidence}
    inferred["suggested_action"] = suggested_action_for(inferred)
    inferred["due_source"] = "Inhalt" if extract_due_from_text(lower) else "Regel"
    return inferred


def infer_project_id(con, tenant_id, filename, content_preview, fallback_project_id):
    if fallback_project_id and fallback_project_id != "auto":
        exists = con.execute(
            "select id from projects where id = ? and tenant_id = ?",
            (fallback_project_id, tenant_id),
        ).fetchone()
        if exists:
            return fallback_project_id, 100
    haystack = f"{filename} {content_preview or ''}".lower()
    best = None
    best_score = 0
    for project in con.execute("select id, name, customer, address from projects where tenant_id = ?", (tenant_id,)):
        score = 0
        for field in ("name", "customer", "address"):
            value = (project[field] or "").lower()
            words = [word for word in re.split(r"[^a-z0-9äöüß]+", value) if len(word) >= 4]
            score += sum(1 for word in words if word in haystack)
        if score > best_score:
            best = project["id"]
            best_score = score
    if best:
        return best, min(96, 70 + best_score * 8)
    fallback = con.execute(
        "select id from projects where tenant_id = ? order by created_at asc limit 1",
        (tenant_id,),
    ).fetchone()
    return (fallback["id"] if fallback else "lindenweg"), 45


def legacy_password_hash(password):
    return hashlib.sha256(f"bauakte-demo:{password}".encode("utf-8")).hexdigest()


def password_hash(password):
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        PASSWORD_ITERATIONS,
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(digest).decode("ascii"),
    )


def verify_password(stored_hash, password):
    if not stored_hash:
        return False
    if stored_hash.startswith("pbkdf2_sha256$"):
        try:
            _, iterations, salt_b64, digest_b64 = stored_hash.split("$", 3)
            salt = base64.b64decode(salt_b64.encode("ascii"))
            expected = base64.b64decode(digest_b64.encode("ascii"))
            actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations))
        except (ValueError, TypeError):
            return False
        return hmac.compare_digest(expected, actual)
    return hmac.compare_digest(stored_hash, legacy_password_hash(password))


def password_needs_rehash(stored_hash):
    if not stored_hash or not stored_hash.startswith("pbkdf2_sha256$"):
        return True
    try:
        return int(stored_hash.split("$", 3)[1]) < PASSWORD_ITERATIONS
    except (ValueError, IndexError):
        return True


def validate_new_password(password):
    if len(password or "") < 12:
        return "Das Passwort muss mindestens 12 Zeichen lang sein."
    if not re.search(r"[A-ZÄÖÜ]", password or ""):
        return "Das Passwort muss mindestens einen Großbuchstaben enthalten."
    if not re.search(r"[a-zäöüß]", password or ""):
        return "Das Passwort muss mindestens einen Kleinbuchstaben enthalten."
    if not re.search(r"\d", password or ""):
        return "Das Passwort muss mindestens eine Zahl enthalten."
    if not re.search(r"[^A-Za-zÄÖÜäöüß0-9]", password or ""):
        return "Das Passwort muss mindestens ein Sonderzeichen enthalten."
    return None


def generated_start_password():
    return f"Start-{str(uuid.uuid4())[:8]}-9!"


def code_hash(code):
    return hashlib.sha256(f"bauakte-mfa:{code}".encode("utf-8")).hexdigest()


def new_mfa_code():
    return str(100000 + (uuid.uuid4().int % 900000))


def create_session(con, user):
    session_id = str(uuid.uuid4())
    user_id = user["user_id"] if "user_id" in user.keys() else user["id"]
    con.execute("delete from sessions where expires_at <= ?", (now_ms(),))
    con.execute(
        "insert into sessions values (?, ?, ?, ?)",
        (session_id, user_id, now_ms(), now_ms() + 1000 * 60 * 60 * SESSION_HOURS),
    )
    return session_id


def session_cookie(session_id):
    secure = "; Secure" if COOKIE_SECURE else ""
    return f"bauakte_session={session_id}; HttpOnly; SameSite=Lax; Path=/; Max-Age={SESSION_HOURS * 3600}{secure}"


def clear_session_cookie():
    secure = "; Secure" if COOKIE_SECURE else ""
    return f"bauakte_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0{secure}"


def queue_email(con, tenant_id, recipient, subject, body, kind="system"):
    settings = mail_settings(con, tenant_id)
    mail_id = str(uuid.uuid4())
    con.execute(
        """
        insert into email_outbox
        (id, tenant_id, recipient, subject, body, status, kind, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            mail_id,
            tenant_id,
            recipient,
            subject,
            body,
            "gespeichert" if settings["driver"] == "outbox" else "wartet",
            kind,
            now_ms(),
        ),
    )
    return mail_id


def render_template(text, values):
    rendered = text or ""
    for key, value in values.items():
        rendered = rendered.replace("{" + key + "}", str(value))
    return rendered


def email_template(con, tenant_id, kind, default_subject, default_body):
    row = con.execute(
        "select subject, body from email_templates where tenant_id = ? and kind = ?",
        (tenant_id, kind),
    ).fetchone()
    if row:
        return row["subject"], row["body"]
    return default_subject, default_body


def mail_settings(con, tenant_id):
    row = con.execute("select * from mail_settings where tenant_id = ?", (tenant_id,)).fetchone()
    if row:
        settings = row_to_dict(row)
        settings["tls"] = bool(settings.get("tls"))
        return settings
    return {
        "driver": MAIL_DRIVER,
        "from_address": MAIL_FROM,
        "host": SMTP_HOST,
        "port": SMTP_PORT,
        "username": SMTP_USER,
        "password": SMTP_PASSWORD,
        "tls": SMTP_TLS,
    }


def mail_status(con=None, tenant_id=None):
    close = False
    if con is None:
        con = db()
        close = True
    try:
        settings = mail_settings(con, tenant_id or DEFAULT_TENANT_ID)
    finally:
        if close:
            con.close()
    configured = settings["driver"] == "smtp" and bool(settings["host"] and settings["from_address"])
    return {
        "driver": settings["driver"],
        "from": settings["from_address"],
        "configured": configured,
        "host": settings["host"] if settings["host"] else "nicht gesetzt",
        "port": settings["port"],
        "tls": settings["tls"],
        "username": settings.get("username") or "",
        "password_configured": bool(settings.get("password")),
        "message": "Echter Versand aktiv" if configured else "Lokaler E-Mail-Ausgang ohne echten Versand",
    }


def send_email_now(mail, settings):
    if settings["driver"] != "smtp":
        return False, "Mail-Treiber steht auf outbox. Es wurde nichts extern versendet."
    if not settings["host"]:
        return False, "SMTP_HOST fehlt."
    message = EmailMessage()
    message["From"] = settings["from_address"]
    message["To"] = mail["recipient"]
    message["Subject"] = mail["subject"]
    message.set_content(mail["body"])
    try:
        with smtplib.SMTP(settings["host"], int(settings["port"] or 587), timeout=12) as smtp:
            if settings["tls"]:
                smtp.starttls()
            if settings.get("username"):
                smtp.login(settings["username"], settings.get("password") or "")
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as error:
        return False, str(error)
    return True, "gesendet"


def log_delivery_event(con, tenant_id, mail_id, recipient, subject, status, message):
    con.execute(
        """
        insert into email_delivery_log
        (id, tenant_id, mail_id, recipient, subject, status, message, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            tenant_id,
            mail_id,
            recipient[:240],
            subject[:180],
            status,
            (message or "")[:800],
            now_ms(),
        ),
    )


def send_pending_emails(con, tenant_id, limit=10):
    settings = mail_settings(con, tenant_id)
    rows = [
        row_to_dict(row)
        for row in con.execute(
            """
            select * from email_outbox
            where tenant_id = ? and status in ('gespeichert', 'wartet', 'fehler')
            order by created_at asc
            limit ?
            """,
            (tenant_id, limit),
        )
    ]
    sent = 0
    failed = 0
    skipped = 0
    for mail in rows:
        ok, message = send_email_now(mail, settings)
        if ok:
            sent += 1
            con.execute(
                "update email_outbox set status = ?, error_message = null, attempts = attempts + 1, sent_at = ? where id = ?",
                ("gesendet", now_ms(), mail["id"]),
            )
            log_delivery_event(con, tenant_id, mail["id"], mail["recipient"], mail["subject"], "gesendet", message)
        else:
            if settings["driver"] != "smtp":
                skipped += 1
                event_status = "lokal gespeichert"
            else:
                failed += 1
                event_status = "fehler"
            con.execute(
                "update email_outbox set status = ?, error_message = ?, attempts = attempts + 1 where id = ?",
                ("gespeichert" if settings["driver"] != "smtp" else "fehler", message[:500], mail["id"]),
            )
            log_delivery_event(con, tenant_id, mail["id"], mail["recipient"], mail["subject"], event_status, message)
    return {"sent": sent, "failed": failed, "skipped": skipped, "total": len(rows), "mail": mail_status(con, tenant_id)}


def send_outbox_email(con, tenant_id, mail_id):
    settings = mail_settings(con, tenant_id)
    mail = con.execute(
        "select * from email_outbox where id = ? and tenant_id = ?",
        (mail_id, tenant_id),
    ).fetchone()
    if not mail:
        return None
    if mail["status"] == "gesendet":
        return {"sent": 0, "failed": 0, "skipped": 0, "total": 0, "already_sent": True, "mail": mail_status(con, tenant_id)}
    ok, message = send_email_now(row_to_dict(mail), settings)
    if ok:
        con.execute(
            "update email_outbox set status = ?, error_message = null, attempts = attempts + 1, sent_at = ? where id = ?",
            ("gesendet", now_ms(), mail_id),
        )
        log_delivery_event(con, tenant_id, mail_id, mail["recipient"], mail["subject"], "gesendet", message)
        return {"sent": 1, "failed": 0, "skipped": 0, "total": 1, "mail": mail_status(con, tenant_id)}
    status = "gespeichert" if settings["driver"] != "smtp" else "fehler"
    con.execute(
        "update email_outbox set status = ?, error_message = ?, attempts = attempts + 1 where id = ?",
        (status, message[:500], mail_id),
    )
    log_delivery_event(
        con,
        tenant_id,
        mail_id,
        mail["recipient"],
        mail["subject"],
        "lokal gespeichert" if settings["driver"] != "smtp" else "fehler",
        message,
    )
    return {
        "sent": 0,
        "failed": 0 if settings["driver"] != "smtp" else 1,
        "skipped": 1 if settings["driver"] != "smtp" else 0,
        "total": 1,
        "mail": mail_status(con, tenant_id),
    }


def create_document_from_email(con, tenant_id, email_row, actor_email):
    if email_row["status"] == "übernommen" and email_row["converted_document_id"]:
        return email_row["converted_document_id"]
    filename = email_row["attachment_name"] or f"{email_row['subject']}.txt"
    project_id = email_row["suggested_project_id"] or infer_project_id(con, tenant_id, filename, email_row["body"], "auto")[0]
    inferred = infer_document(filename, email_row["body"])
    analysis = {
        "engine": "email-import",
        **inferred,
        "project_id": project_id,
        "project_confidence": email_row["project_confidence"] or infer_project_id(con, tenant_id, filename, email_row["body"], "auto")[1],
    }
    document_id = str(uuid.uuid4())
    con.execute(
        """
        insert into documents
        (id, tenant_id, project_id, name, stored_name, mime, size, type, status, due, tone, confidence, source, ocr_text, ocr_engine, ocr_status, analysis_json, checksum_sha256, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            document_id,
            tenant_id,
            project_id,
            filename,
            None,
            "message/rfc822",
            len(email_row["body"] or ""),
            inferred["type"],
            inferred["status"],
            inferred["due"],
            inferred["tone"],
            inferred["confidence"],
            f"E-Mail von {email_row['sender']} · Betreff: {email_row['subject']}",
            email_row["body"],
            "email-import",
            "bereit",
            json.dumps(analysis, ensure_ascii=False),
            None,
            now_ms(),
        ),
    )
    con.execute(
        "update email_inbox set status = ?, converted_document_id = ? where id = ? and tenant_id = ?",
        ("übernommen", document_id, email_row["id"], tenant_id),
    )
    create_document_version(con, document_id, "email.import", actor_email, tenant_id)
    audit(con, "email.import", f"{actor_email} · {email_row['sender']} · {filename}", tenant_id)
    return document_id


def parse_due_label(value):
    text = (value or "").strip().lower()
    if not text or text == "ohne frist":
        return None
    today = time.localtime()
    midnight = time.mktime((today.tm_year, today.tm_mon, today.tm_mday, 0, 0, 0, 0, 0, -1))
    if text in {"heute", "sofort"}:
        return int(midnight * 1000)
    if text == "morgen":
        return int((midnight + 86400) * 1000)
    match = re.match(r"^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$", text)
    if not match:
        return None
    year = int(match.group(3))
    if year < 100:
        year += 2000
    return int(time.mktime((year, int(match.group(2)), int(match.group(1)), 0, 0, 0, 0, 0, -1)) * 1000)


def escalation_recipients(con, tenant_id, role, fallback_email):
    rows = [
        row["email"]
        for row in con.execute(
            "select email from users where tenant_id = ? and role = ? and is_active = 1 order by created_at asc",
            (tenant_id, role),
        )
    ]
    return rows or [fallback_email]


def escalation_candidates(con, tenant_id, fallback_email):
    now = now_ms()
    today = parse_due_label("Heute") or now
    rules = [
        row_to_dict(row)
        for row in con.execute(
            "select * from escalation_rules where tenant_id = ? and is_active = 1 order by created_at asc",
            (tenant_id,),
        )
    ]
    candidates = []
    for rule in rules:
        threshold_ms = int(rule.get("threshold_hours") or 0) * 3600 * 1000
        if rule["trigger_type"] == "task_critical_age":
            rows = [
                row_to_dict(row)
                for row in con.execute(
                """
                select document_tasks.*, documents.name as document_name, projects.name as project_name
                from document_tasks
                join documents on documents.id = document_tasks.document_id
                left join projects on projects.id = documents.project_id
                where document_tasks.tenant_id = ?
                  and document_tasks.status != 'erledigt'
                  and document_tasks.priority = 'kritisch'
                  and document_tasks.created_at <= ?
                order by document_tasks.created_at asc
                limit 20
                """,
                (tenant_id, now - threshold_ms),
                )
            ]
            for item in rows:
                candidates.append({
                    "key": f"{rule['id']}:task:{item['id']}",
                    "rule_id": rule["id"],
                    "rule_name": rule["name"],
                    "target_role": rule["target_role"],
                    "title": f"Kritische Aufgabe eskalieren: {item['action']}",
                    "detail": f"{item['document_name']} · {item.get('project_name') or 'ohne Bauakte'} · seit {round((now - item['created_at']) / 3600000)} Stunden offen",
                    "item_type": "Aufgabe",
                })
        elif rule["trigger_type"] == "task_overdue":
            rows = [
                row_to_dict(row)
                for row in con.execute(
                """
                select document_tasks.*, documents.name as document_name, projects.name as project_name
                from document_tasks
                join documents on documents.id = document_tasks.document_id
                left join projects on projects.id = documents.project_id
                where document_tasks.tenant_id = ?
                  and document_tasks.status != 'erledigt'
                  and document_tasks.due is not null
                order by document_tasks.created_at asc
                limit 80
                """,
                (tenant_id,),
                )
            ]
            for item in rows:
                due_at = parse_due_label(item["due"])
                if due_at is not None and due_at < today:
                    candidates.append({
                        "key": f"{rule['id']}:task:{item['id']}",
                        "rule_id": rule["id"],
                        "rule_name": rule["name"],
                        "target_role": rule["target_role"],
                        "title": f"Überfällige Aufgabe: {item['action']}",
                        "detail": f"{item['due']} · {item['document_name']} · {item.get('project_name') or 'ohne Bauakte'}",
                        "item_type": "Aufgabe",
                    })
        elif rule["trigger_type"] == "deadline_due":
            rows = [
                row_to_dict(row)
                for row in con.execute(
                """
                select deadlines.*, projects.name as project_name
                from deadlines
                left join projects on projects.id = deadlines.project_id
                where deadlines.tenant_id = ?
                order by deadlines.created_at desc
                limit 80
                """,
                (tenant_id,),
                )
            ]
            for item in rows:
                due_at = parse_due_label(item["date_label"])
                if due_at is not None and due_at <= now + threshold_ms:
                    candidates.append({
                        "key": f"{rule['id']}:deadline:{item['id']}",
                        "rule_id": rule["id"],
                        "rule_name": rule["name"],
                        "target_role": rule["target_role"],
                        "title": f"Frist eskalieren: {item['title']}",
                        "detail": f"{item['date_label']} · {item.get('project_name') or item.get('detail') or 'ohne Bauakte'}",
                        "item_type": "Frist",
                    })
    sent_keys = {
        row["escalation_key"]
        for row in con.execute(
            "select escalation_key from escalation_events where tenant_id = ?",
            (tenant_id,),
        )
    }
    return [item for item in candidates if item["key"] not in sent_keys]


def run_escalations_for_tenant(con, tenant_id, actor_email, source="manual"):
    queued = 0
    skipped = 0
    candidates = escalation_candidates(con, tenant_id, actor_email)
    for item in candidates:
        exists = con.execute(
            "select id from escalation_events where tenant_id = ? and escalation_key = ?",
            (tenant_id, item["key"]),
        ).fetchone()
        if exists:
            skipped += 1
            continue
        recipients = escalation_recipients(con, tenant_id, item["target_role"], actor_email)
        subject_template, body_template = email_template(
            con,
            tenant_id,
            "escalation",
            "Eskalation aus BauAkte KI",
            "{rule_name}\n\n{title}\n{detail}\n\nZielrolle: {target_role}\nAusgelöst durch: {actor}",
        )
        for recipient in recipients:
            values = {
                "rule_name": item["rule_name"],
                "title": item["title"],
                "detail": item["detail"],
                "target_role": item["target_role"],
                "actor": actor_email,
                "recipient": recipient,
            }
            queue_email(
                con,
                tenant_id,
                recipient,
                render_template(subject_template, values),
                render_template(body_template, values),
                "escalation",
            )
        con.execute(
            """
            insert into escalation_events
            (id, tenant_id, escalation_key, title, recipients, sent_at)
            values (?, ?, ?, ?, ?, ?)
            """,
            (str(uuid.uuid4()), tenant_id, item["key"], item["title"], ", ".join(recipients), now_ms()),
        )
        queued += 1
    audit(con, f"escalation.{source}", f"{actor_email} · {queued} neu · {skipped} bereits bekannt", tenant_id)
    return {"queued": queued, "skipped": skipped, "candidates": len(candidates)}


def run_scheduled_escalations_once():
    if not ESCALATION_LOCK.acquire(blocking=False):
        return {"queued": 0, "skipped": 0, "tenants": 0, "locked": True}
    try:
        total = {"queued": 0, "skipped": 0, "tenants": 0, "locked": False}
        with db() as con:
            tenants = [row_to_dict(row) for row in con.execute("select id, company_email from tenants where license_status != 'gekündigt'")]
            for tenant in tenants:
                fallback = tenant.get("company_email") or MAIL_FROM or DEMO_EMAIL
                result = run_escalations_for_tenant(con, tenant["id"], fallback, "scheduled")
                total["queued"] += result["queued"]
                total["skipped"] += result["skipped"]
                total["tenants"] += 1
        ESCALATION_SCHEDULER["last_run_at"] = now_ms()
        ESCALATION_SCHEDULER["last_result"] = total
        return total
    finally:
        ESCALATION_LOCK.release()


def current_escalation_interval():
    with db() as con:
        row = con.execute(
            "select min(escalation_interval_minutes) as interval from tenants where license_status != 'gekündigt' and escalation_interval_minutes > 0"
        ).fetchone()
    interval = row["interval"] if row and row["interval"] is not None else 0
    ESCALATION_SCHEDULER["interval_minutes"] = int(interval)
    return int(interval)


def escalation_scheduler_loop():
    time.sleep(3)
    last_run = 0
    while True:
        interval = current_escalation_interval()
        if interval <= 0:
            time.sleep(60)
            continue
        now_seconds = time.time()
        if now_seconds - last_run < max(60, interval * 60):
            time.sleep(60)
            continue
        try:
            run_scheduled_escalations_once()
            last_run = time.time()
        except Exception as error:
            ESCALATION_SCHEDULER["last_result"] = {"error": str(error)}
            print(f"[Eskalation] Hintergrundprüfung fehlgeschlagen: {error}")


def start_escalation_scheduler():
    worker = threading.Thread(target=escalation_scheduler_loop, name="bauakte-escalation-scheduler", daemon=True)
    worker.start()


def table_columns(con, table):
    return {row["name"] for row in con.execute(f"pragma table_info({table})")}


def ensure_column(con, table, column, definition):
    if column not in table_columns(con, table):
        con.execute(f"alter table {table} add column {column} {definition}")


def simulated_ocr_text(filename, doc_type):
    return (
        f"Simulierter OCR-Text aus {filename}. Dokumenttyp: {doc_type}. "
        "Enthält Projektbezug, Fristen, Betrag oder Mangelhinweis. "
        "In der Profiversion wird hier echter OCR-Volltext gespeichert."
    )


def run_command_text(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=12, check=False)
    except (OSError, subprocess.SubprocessError):
        return ""
    return result.stdout.strip() if result.returncode == 0 else ""


def extract_text_from_file(path, filename, doc_type):
    suffix = Path(filename).suffix.lower()
    mime = mimetypes.guess_type(filename)[0] or ""
    if mime.startswith("text/") or suffix in {".txt", ".csv", ".md"}:
        try:
            text = path.read_text(encoding="utf-8", errors="replace").strip()
        except OSError:
            text = ""
        return (text[:12000], "text") if text else (simulated_ocr_text(filename, doc_type), "simulation")
    if suffix == ".pdf" and shutil.which("pdftotext"):
        text = run_command_text(["pdftotext", "-layout", str(path), "-"])
        if text:
            return text[:12000], "pdftotext"
    if suffix in {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"} and shutil.which("tesseract"):
        text = run_command_text(["tesseract", str(path), "stdout", "-l", "deu+eng"])
        if text:
            return text[:12000], "tesseract"
    return simulated_ocr_text(filename, doc_type), "simulation"


def extract_text_from_upload(filename, content, doc_type, stored_path=None):
    mime = mimetypes.guess_type(filename)[0] or ""
    suffix = Path(filename).suffix.lower()
    if mime.startswith("text/") or suffix in {".txt", ".csv", ".md"}:
        text = content.decode("utf-8", "replace").strip()
        return (text[:12000], "text") if text else (simulated_ocr_text(filename, doc_type), "simulation")
    if stored_path:
        return extract_text_from_file(stored_path, filename, doc_type)
    return simulated_ocr_text(filename, doc_type), "simulation"


def snippet(text, terms):
    if not text:
        return ""
    lower = text.lower()
    positions = [lower.find(term) for term in terms if term and lower.find(term) >= 0]
    start = max(0, min(positions) - 80) if positions else 0
    excerpt = re.sub(r"\s+", " ", text[start:start + 260]).strip()
    return ("..." if start else "") + excerpt + ("..." if start + 260 < len(text) else "")


def page_excerpt(text, terms):
    pages = re.split(r"\f+", text or "")
    if not pages:
        pages = [text or ""]
    clean_terms = [term.lower() for term in terms if term]
    citations = []
    for index, page_text in enumerate(pages, start=1):
        lower = page_text.lower()
        if clean_terms and not any(term in lower for term in clean_terms):
            continue
        excerpt = snippet(page_text, clean_terms) or re.sub(r"\s+", " ", page_text[:240]).strip()
        if excerpt:
            citations.append({"page": index, "excerpt": excerpt})
        if len(citations) >= 3:
            break
    if not citations and text:
        citations.append({"page": 1, "excerpt": snippet(text, clean_terms) or re.sub(r"\s+", " ", text[:240]).strip()})
    return citations


def document_citations(doc, query=""):
    terms = [term for term in re.split(r"\W+", query.lower()) if len(term) > 2]
    citations = page_excerpt(doc.get("ocr_text", ""), terms)
    if not citations and doc.get("source"):
        citations = [{"page": 1, "excerpt": doc["source"]}]
    return citations


def storage_status():
    db_driver = DB_DRIVER
    file_storage = FILE_STORAGE_DRIVER
    encryption = FILE_ENCRYPTION
    return {
        "mode": "Produktion bereit" if db_driver != "sqlite" and file_storage != "local" else "Lokaler MVP-Betrieb",
        "database": db_driver,
        "files": file_storage,
        "file_adapter": FILE_STORAGE.name,
        "encryption": encryption,
        "database_path": str(DB_PATH),
        "upload_path": str(UPLOAD_DIR),
        "recommendations": [
            "Für Verkaufsversion PostgreSQL pro Mandant oder mit strikter Mandanten-ID verwenden.",
            "Dateien verschlüsselt in S3-kompatiblem Object Storage oder deutschem Cloudspeicher ablegen.",
            "Backups automatisieren, Wiederherstellung testen und Aufbewahrungsfristen dokumentieren.",
        ],
    }


def latest_backup_status():
    backup_dir = ROOT / "backups"
    backup_dir.mkdir(exist_ok=True)
    backups = sorted(backup_dir.glob("bauakte-backup-*.db"), key=lambda item: item.stat().st_mtime, reverse=True)
    if not backups:
        return {"status": "fehlt", "message": "Noch kein Backup vorhanden.", "backup": None}
    backup_path = backups[0]
    try:
        con = sqlite3.connect(backup_path)
        result = con.execute("pragma integrity_check").fetchone()[0]
        con.close()
    except sqlite3.DatabaseError as error:
        return {"status": "fehler", "message": str(error), "backup": backup_path.name}
    return {
        "status": "ok" if result == "ok" else "fehler",
        "message": "Backup ist lesbar und konsistent." if result == "ok" else result,
        "backup": backup_path.name,
        "size": backup_path.stat().st_size,
        "checked_at": now_ms(),
    }


def compliance_status(con, tenant_id):
    tenant = con.execute("select * from tenants where id = ?", (tenant_id,)).fetchone()
    backup = latest_backup_status()
    now = now_ms()
    audit_days = int((tenant["audit_retention_days"] if tenant and "audit_retention_days" in tenant.keys() else 1095) or 1095)
    mail_days = int((tenant["mail_retention_days"] if tenant and "mail_retention_days" in tenant.keys() else 365) or 365)
    audit_cutoff = now - audit_days * 24 * 60 * 60 * 1000
    mail_cutoff = now - mail_days * 24 * 60 * 60 * 1000
    user_rows = list(con.execute("select is_active, mfa_enabled, locked_until from users where tenant_id = ?", (tenant_id,)))
    active_users = [row for row in user_rows if row["is_active"]]
    mfa_enabled = sum(1 for row in active_users if row["mfa_enabled"])
    old_audit = con.execute(
        "select count(*) as value from audit_log where tenant_id = ? and created_at < ?",
        (tenant_id, audit_cutoff),
    ).fetchone()["value"]
    old_mail_logs = con.execute(
        "select count(*) as value from email_delivery_log where tenant_id = ? and created_at < ?",
        (tenant_id, mail_cutoff),
    ).fetchone()["value"]
    old_outbox = con.execute(
        """
        select count(*) as value
        from email_outbox
        where tenant_id = ? and created_at < ? and status in ('gesendet', 'gespeichert', 'fehler')
        """,
        (tenant_id, mail_cutoff),
    ).fetchone()["value"]
    archived_docs = con.execute(
        "select count(*) as value from documents where tenant_id = ? and archived_at is not null",
        (tenant_id,),
    ).fetchone()["value"]
    locked_users = sum(1 for row in user_rows if row["locked_until"] and row["locked_until"] > now)
    return {
        "backup": backup,
        "audit_retention_days": audit_days,
        "mail_retention_days": mail_days,
        "audit_entries": con.execute("select count(*) as value from audit_log where tenant_id = ?", (tenant_id,)).fetchone()["value"],
        "old_audit_entries": old_audit,
        "old_mail_entries": old_mail_logs + old_outbox,
        "archived_documents": archived_docs,
        "active_users": len(active_users),
        "mfa_enabled_users": mfa_enabled,
        "mfa_rate": round((mfa_enabled / len(active_users)) * 100) if active_users else 0,
        "locked_users": locked_users,
        "cookie_secure": COOKIE_SECURE,
        "session_hours": SESSION_HOURS,
        "login_lock": f"{LOGIN_MAX_ATTEMPTS} Fehlversuche / {LOGIN_LOCK_MINUTES} Minuten Sperre",
        "cleanup_available": old_audit + old_mail_logs + old_outbox,
    }


def document_integrity_status(con, tenant_id):
    rows = list(con.execute(
        "select id, name, stored_name, checksum_sha256 from documents where tenant_id = ? and stored_name is not null",
        (tenant_id,),
    ))
    missing_files = []
    checksum_missing = []
    checksum_failed = []
    for row in rows:
        try:
            path = FILE_STORAGE.path(row["stored_name"])
        except (TypeError, ValueError):
            missing_files.append(row["name"])
            continue
        if not path.exists():
            missing_files.append(row["name"])
            continue
        if not row["checksum_sha256"]:
            checksum_missing.append(row["name"])
            continue
        if sha256_file(path) != row["checksum_sha256"]:
            checksum_failed.append(row["name"])
    return {
        "stored_documents": len(rows),
        "missing_files": missing_files[:10],
        "checksum_missing": checksum_missing[:10],
        "checksum_failed": checksum_failed[:10],
        "missing_count": len(missing_files),
        "checksum_missing_count": len(checksum_missing),
        "checksum_failed_count": len(checksum_failed),
    }


def system_readiness(con, tenant_id):
    backup = latest_backup_status()
    mail = mail_status(con, tenant_id)
    compliance = compliance_status(con, tenant_id)
    integrity = document_integrity_status(con, tenant_id)
    required_tenant_tables = [
        "users", "projects", "documents", "deadlines", "chat_messages", "audit_log",
        "ocr_jobs", "document_versions", "document_notes", "document_tasks",
        "email_outbox", "email_inbox", "email_templates", "email_delivery_log",
        "notification_reads", "escalation_rules", "escalation_events",
    ]
    table_columns = {
        row["name"]: {column["name"] for column in con.execute(f"pragma table_info({row['name']})")}
        for row in con.execute("select name from sqlite_master where type = 'table'")
    }
    missing_tenant_id = [table for table in required_tenant_tables if "tenant_id" not in table_columns.get(table, set())]
    checks = [
        {
            "key": "database",
            "label": "Produktionsdatenbank",
            "status": "ok" if DB_DRIVER != "sqlite" else "warn",
            "value": DB_DRIVER,
            "detail": "PostgreSQL oder verwaltete SQL-Datenbank empfohlen." if DB_DRIVER == "sqlite" else "Produktionsdatenbank ist konfiguriert.",
        },
        {
            "key": "file_storage",
            "label": "Dateiablage",
            "status": "ok" if FILE_STORAGE_DRIVER != "local" else "warn",
            "value": FILE_STORAGE_DRIVER,
            "detail": "Für Kundenbetrieb Object Storage oder verschlüsselter Server-Speicher nutzen." if FILE_STORAGE_DRIVER == "local" else "Externer Speicheradapter ist vorbereitet.",
        },
        {
            "key": "encryption",
            "label": "Dateiverschlüsselung",
            "status": "ok" if FILE_ENCRYPTION not in {"", "local-dev", "none"} else "warn",
            "value": FILE_ENCRYPTION,
            "detail": "Für Verkaufsversion serverseitige Verschlüsselung aktivieren." if FILE_ENCRYPTION in {"", "local-dev", "none"} else "Verschlüsselungsmodus ist gesetzt.",
        },
        {
            "key": "backup",
            "label": "Backup-Prüfung",
            "status": "ok" if backup["status"] == "ok" else "risk",
            "value": backup.get("backup") or backup["status"],
            "detail": backup["message"],
        },
        {
            "key": "tenant_isolation",
            "label": "Mandantentrennung",
            "status": "ok" if not missing_tenant_id else "risk",
            "value": "aktiv" if not missing_tenant_id else f"{len(missing_tenant_id)} Tabelle(n)",
            "detail": "Alle fachlichen Tabellen besitzen tenant_id." if not missing_tenant_id else "Ohne tenant_id fehlt eine harte Datenabgrenzung: " + ", ".join(missing_tenant_id),
        },
        {
            "key": "integrity",
            "label": "Datei-Integrität",
            "status": "ok" if integrity["missing_count"] == 0 and integrity["checksum_failed_count"] == 0 and integrity["checksum_missing_count"] == 0 else "warn",
            "value": f"{integrity['stored_documents']} Datei(en)",
            "detail": f"{integrity['missing_count']} fehlen, {integrity['checksum_failed_count']} verändert, {integrity['checksum_missing_count']} ohne Prüfwert.",
        },
        {
            "key": "cookie_secure",
            "label": "Sitzungsschutz",
            "status": "ok" if COOKIE_SECURE else "warn",
            "value": "Secure Cookie" if COOKIE_SECURE else "lokaler Modus",
            "detail": "COOKIE_SECURE=true für HTTPS-Betrieb setzen." if not COOKIE_SECURE else "Cookies sind für HTTPS abgesichert.",
        },
        {
            "key": "mfa",
            "label": "Zwei-Faktor-Nutzung",
            "status": "ok" if compliance["mfa_rate"] >= 80 else "warn",
            "value": f"{compliance['mfa_rate']}%",
            "detail": f"{compliance['mfa_enabled_users']} von {compliance['active_users']} aktiven Benutzern nutzen 2FA.",
        },
        {
            "key": "mail",
            "label": "E-Mail-Versand",
            "status": "ok" if mail["configured"] else "warn",
            "value": mail["driver"],
            "detail": mail["message"],
        },
    ]
    score = round(sum(1 for item in checks if item["status"] == "ok") / len(checks) * 100)
    return {
        "score": score,
        "readiness": "verkaufsnah" if score >= 85 else "ausbaufähig" if score >= 60 else "lokaler MVP",
        "checks": checks,
        "integrity": integrity,
        "generated_at": now_ms(),
    }


def security_policy(con, tenant_id):
    tenant = con.execute("select admin_mfa_required from tenants where id = ?", (tenant_id,)).fetchone()
    admin_mfa_required = bool(tenant["admin_mfa_required"]) if tenant and "admin_mfa_required" in tenant.keys() else True
    admins = list(con.execute(
        "select id, name, email, mfa_enabled, is_active from users where tenant_id = ? and role = 'Geschäftsführung'",
        (tenant_id,),
    ))
    missing_admin_mfa = [row_to_dict(row) for row in admins if row["is_active"] and not row["mfa_enabled"]]
    return {
        "admin_mfa_required": admin_mfa_required,
        "admin_count": len([row for row in admins if row["is_active"]]),
        "admin_mfa_missing": missing_admin_mfa,
        "password_policy": {
            "min_length": 12,
            "uppercase": True,
            "lowercase": True,
            "number": True,
            "special": True,
            "iterations": PASSWORD_ITERATIONS,
        },
    }


PERMISSIONS = {
    "Geschäftsführung": {"project.create", "deadline.create", "document.upload", "document.export", "document.update", "document.archive", "document.restore", "chat.ask", "document.search", "document.view", "user.manage", "backup.create"},
    "Büro": {"project.create", "deadline.create", "document.upload", "chat.ask", "document.search", "document.view"},
    "Bauleitung": {"deadline.create", "document.upload", "document.update", "chat.ask", "document.search", "document.view"},
    "Steuerberater": {"document.export", "document.search", "document.view"},
}


def can(user, permission):
    return permission in PERMISSIONS.get(user.get("role", ""), set())


def tenant_id_for(user=None):
    return (user or {}).get("tenant_id") or DEFAULT_TENANT_ID


def decorate_document(row):
    doc = row_to_dict(row)
    try:
        analysis = json.loads(doc.get("analysis_json") or "{}")
    except json.JSONDecodeError:
        analysis = {}
    doc["analysis"] = analysis
    doc["project_confidence"] = analysis.get("project_confidence")
    doc["suggested_action"] = analysis.get("suggested_action")
    if doc.get("stored_name"):
        doc["preview_url"] = f"/uploads/{doc['stored_name']}"
    else:
        doc["preview_url"] = None
    doc["citations"] = document_citations(doc)
    return doc


def normalize_money(value):
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        return round(float(value), 2)
    cleaned = str(value).strip().replace(".", "").replace(",", ".")
    try:
        return round(float(cleaned), 2)
    except ValueError:
        return None


def normalize_rate(value):
    amount = normalize_money(value)
    if amount is None:
        return None
    return max(0, min(100, amount))


def clean_text(value, limit=180):
    return str(value or "").strip()[:limit]


def init_db():
    with db() as con:
        con.executescript(
            """
            create table if not exists users (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              name text not null,
              email text not null unique,
              role text not null,
              password_hash text,
              is_active integer not null default 1,
              mfa_enabled integer not null default 0,
              failed_login_count integer not null default 0,
              locked_until integer,
              last_login_at integer,
              created_at integer not null
            );
            create table if not exists sessions (
              id text primary key,
              user_id text not null references users(id),
              created_at integer not null,
              expires_at integer not null
            );
            create table if not exists mfa_challenges (
              id text primary key,
              user_id text not null references users(id),
              code_hash text not null,
              created_at integer not null,
              expires_at integer not null,
              used_at integer
            );
            create table if not exists projects (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              name text not null,
              customer text not null,
              address text,
              owner text,
              status text not null default 'laufend',
              created_at integer not null
            );
            create table if not exists documents (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              project_id text not null references projects(id),
              name text not null,
              stored_name text,
              mime text,
              size integer not null default 0,
              type text not null,
              status text not null,
              due text,
              tone text not null,
              confidence integer not null default 0,
              source text,
              ocr_text text,
              ocr_engine text,
              ocr_status text,
              analysis_json text,
              archived_at integer,
              archived_by text,
              checksum_sha256 text,
              reviewed_by text,
              reviewed_at integer,
              approved_by text,
              approved_at integer,
              payment_released_by text,
              payment_released_at integer,
              created_at integer not null
            );
            create table if not exists deadlines (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              project_id text references projects(id),
              date_label text not null,
              title text not null,
              detail text,
              tone text not null,
              created_at integer not null
            );
            create table if not exists chat_messages (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              role text not null,
              text text not null,
              created_at integer not null
            );
            create table if not exists audit_log (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              action text not null,
              detail text,
              created_at integer not null
            );
            create table if not exists ocr_jobs (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              document_id text not null references documents(id),
              status text not null,
              engine text,
              message text,
              created_at integer not null,
              started_at integer,
              finished_at integer
            );
            create table if not exists tenants (
              id text primary key,
              name text not null,
              plan text not null,
              company_email text,
              phone text,
              billing_address text,
              license_status text not null default 'aktiv',
              seat_limit integer not null default 10,
              data_region text not null default 'Deutschland',
              escalation_interval_minutes integer not null default 240,
              audit_retention_days integer not null default 1095,
              mail_retention_days integer not null default 365,
              admin_mfa_required integer not null default 1,
              created_at integer not null
            );
            create table if not exists document_versions (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              document_id text not null references documents(id),
              version_no integer not null,
              event text not null,
              actor text,
              snapshot_json text not null,
              created_at integer not null
            );
            create table if not exists document_notes (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              document_id text not null references documents(id),
              kind text not null,
              body text not null,
              actor text not null,
              created_at integer not null
            );
            create table if not exists document_tasks (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              document_id text not null references documents(id),
              assignee_id text references users(id),
              assignee_name text not null,
              action text not null,
              priority text not null default 'normal',
              due text,
              note text,
              status text not null default 'offen',
              created_by text not null,
              created_at integer not null,
              completed_at integer,
              completed_by text
            );
            create table if not exists invoice_fields (
              document_id text primary key references documents(id),
              tenant_id text not null default 'schneider-sohn',
              invoice_number text,
              creditor text,
              iban text,
              net_amount real,
              tax_amount real,
              gross_amount real,
              tax_rate real,
              invoice_date text,
              service_date text,
              booking_account text,
              cost_center text,
              payment_reference text,
              verified_by text,
              verified_at integer,
              updated_at integer not null
            );
            create table if not exists invoice_booking_rules (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              keyword text not null,
              booking_account text not null,
              tax_rate real not null default 19,
              cost_center text,
              label text,
              is_active integer not null default 1,
              created_at integer not null,
              updated_at integer not null
            );
            create table if not exists email_outbox (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              recipient text not null,
              subject text not null,
              body text not null,
              status text not null default 'gespeichert',
              kind text not null default 'system',
              created_at integer not null,
              sent_at integer,
              attempts integer not null default 0,
              error_message text
            );
            create table if not exists email_inbox (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              sender text not null,
              subject text not null,
              body text not null,
              attachment_name text,
              status text not null default 'neu',
              suggested_project_id text,
              project_confidence integer not null default 0,
              received_at integer not null,
              converted_document_id text
            );
            create table if not exists email_templates (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              kind text not null,
              label text not null,
              subject text not null,
              body text not null,
              updated_at integer not null,
              unique(tenant_id, kind)
            );
            create table if not exists email_delivery_log (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              mail_id text,
              recipient text not null,
              subject text not null,
              status text not null,
              message text,
              created_at integer not null
            );
            create table if not exists mail_settings (
              tenant_id text primary key,
              driver text not null default 'outbox',
              from_address text not null,
              host text,
              port integer not null default 587,
              username text,
              password text,
              tls integer not null default 1,
              updated_at integer not null
            );
            create table if not exists notification_reads (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              user_id text not null references users(id),
              notification_key text not null,
              read_at integer not null,
              unique(user_id, notification_key)
            );
            create table if not exists escalation_rules (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              name text not null,
              trigger_type text not null,
              threshold_hours integer not null default 24,
              target_role text not null default 'Geschäftsführung',
              is_active integer not null default 1,
              created_at integer not null
            );
            create table if not exists escalation_events (
              id text primary key,
              tenant_id text not null default 'schneider-sohn',
              escalation_key text not null,
              title text not null,
              recipients text not null,
              sent_at integer not null,
              unique(tenant_id, escalation_key)
            );
            """
        )
        ensure_column(con, "users", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "users", "password_hash", "text")
        ensure_column(con, "users", "is_active", "integer not null default 1")
        ensure_column(con, "users", "mfa_enabled", "integer not null default 0")
        ensure_column(con, "users", "failed_login_count", "integer not null default 0")
        ensure_column(con, "users", "locked_until", "integer")
        ensure_column(con, "users", "last_login_at", "integer")
        ensure_column(con, "projects", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "documents", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "documents", "ocr_text", "text")
        ensure_column(con, "documents", "ocr_engine", "text")
        ensure_column(con, "documents", "ocr_status", "text")
        ensure_column(con, "documents", "analysis_json", "text")
        ensure_column(con, "documents", "archived_at", "integer")
        ensure_column(con, "documents", "archived_by", "text")
        ensure_column(con, "documents", "checksum_sha256", "text")
        ensure_column(con, "documents", "reviewed_by", "text")
        ensure_column(con, "documents", "reviewed_at", "integer")
        ensure_column(con, "documents", "approved_by", "text")
        ensure_column(con, "documents", "approved_at", "integer")
        ensure_column(con, "documents", "payment_released_by", "text")
        ensure_column(con, "documents", "payment_released_at", "integer")
        ensure_column(con, "deadlines", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "chat_messages", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "audit_log", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "ocr_jobs", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "tenants", "company_email", "text")
        ensure_column(con, "tenants", "phone", "text")
        ensure_column(con, "tenants", "billing_address", "text")
        ensure_column(con, "tenants", "license_status", "text not null default 'aktiv'")
        ensure_column(con, "tenants", "seat_limit", "integer not null default 10")
        ensure_column(con, "tenants", "data_region", "text not null default 'Deutschland'")
        ensure_column(con, "tenants", "escalation_interval_minutes", f"integer not null default {ESCALATION_INTERVAL_MINUTES}")
        ensure_column(con, "tenants", "audit_retention_days", "integer not null default 1095")
        ensure_column(con, "tenants", "mail_retention_days", "integer not null default 365")
        ensure_column(con, "tenants", "admin_mfa_required", "integer not null default 1")
        ensure_column(con, "document_notes", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "document_tasks", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "document_tasks", "priority", "text not null default 'normal'")
        ensure_column(con, "document_tasks", "completed_at", "integer")
        ensure_column(con, "document_tasks", "completed_by", "text")
        ensure_column(con, "invoice_fields", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "invoice_fields", "invoice_number", "text")
        ensure_column(con, "invoice_fields", "creditor", "text")
        ensure_column(con, "invoice_fields", "iban", "text")
        ensure_column(con, "invoice_fields", "net_amount", "real")
        ensure_column(con, "invoice_fields", "tax_amount", "real")
        ensure_column(con, "invoice_fields", "gross_amount", "real")
        ensure_column(con, "invoice_fields", "tax_rate", "real")
        ensure_column(con, "invoice_fields", "invoice_date", "text")
        ensure_column(con, "invoice_fields", "service_date", "text")
        ensure_column(con, "invoice_fields", "booking_account", "text")
        ensure_column(con, "invoice_fields", "cost_center", "text")
        ensure_column(con, "invoice_fields", "payment_reference", "text")
        ensure_column(con, "invoice_fields", "verified_by", "text")
        ensure_column(con, "invoice_fields", "verified_at", "integer")
        ensure_column(con, "invoice_fields", "updated_at", "integer not null default 0")
        ensure_column(con, "invoice_booking_rules", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "invoice_booking_rules", "keyword", "text")
        ensure_column(con, "invoice_booking_rules", "booking_account", "text")
        ensure_column(con, "invoice_booking_rules", "tax_rate", "real not null default 19")
        ensure_column(con, "invoice_booking_rules", "cost_center", "text")
        ensure_column(con, "invoice_booking_rules", "label", "text")
        ensure_column(con, "invoice_booking_rules", "is_active", "integer not null default 1")
        ensure_column(con, "invoice_booking_rules", "created_at", "integer not null default 0")
        ensure_column(con, "invoice_booking_rules", "updated_at", "integer not null default 0")
        ensure_column(con, "email_outbox", "attempts", "integer not null default 0")
        ensure_column(con, "email_outbox", "error_message", "text")
        ensure_column(con, "email_inbox", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "email_inbox", "attachment_name", "text")
        ensure_column(con, "email_inbox", "suggested_project_id", "text")
        ensure_column(con, "email_inbox", "project_confidence", "integer not null default 0")
        ensure_column(con, "email_inbox", "converted_document_id", "text")
        ensure_column(con, "email_templates", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "email_delivery_log", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "email_delivery_log", "mail_id", "text")
        ensure_column(con, "email_delivery_log", "message", "text")
        ensure_column(con, "mail_settings", "driver", "text not null default 'outbox'")
        ensure_column(con, "mail_settings", "from_address", "text not null default 'BauAkte KI <noreply@bauakte.local>'")
        ensure_column(con, "mail_settings", "host", "text")
        ensure_column(con, "mail_settings", "port", "integer not null default 587")
        ensure_column(con, "mail_settings", "username", "text")
        ensure_column(con, "mail_settings", "password", "text")
        ensure_column(con, "mail_settings", "tls", "integer not null default 1")
        ensure_column(con, "mail_settings", "updated_at", "integer not null default 0")
        ensure_column(con, "notification_reads", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "escalation_rules", "tenant_id", "text not null default 'schneider-sohn'")
        ensure_column(con, "escalation_rules", "is_active", "integer not null default 1")
        ensure_column(con, "escalation_events", "tenant_id", "text not null default 'schneider-sohn'")
        con.execute(
            "insert or ignore into tenants (id, name, plan, created_at) values (?, ?, ?, ?)",
            (DEFAULT_TENANT_ID, DEFAULT_TENANT_NAME, "Profi Demo", now_ms()),
        )
        default_rules = [
            ("critical-24h", "Kritische Aufgaben nach 24 Stunden", "task_critical_age", 24, "Geschäftsführung"),
            ("deadline-72h", "Fristen 3 Tage vorher", "deadline_due", 72, "Bauleitung"),
            ("overdue-daily", "Überfällige Aufgaben sofort", "task_overdue", 0, "Geschäftsführung"),
        ]
        for rule_id, name, trigger_type, threshold_hours, target_role in default_rules:
            con.execute(
                """
                insert or ignore into escalation_rules
                (id, tenant_id, name, trigger_type, threshold_hours, target_role, is_active, created_at)
                values (?, ?, ?, ?, ?, ?, 1, ?)
                """,
                (rule_id, DEFAULT_TENANT_ID, name, trigger_type, threshold_hours, target_role, now_ms()),
            )
        for rule_id, keyword, booking_account, tax_rate, label in DEFAULT_INVOICE_RULES:
            con.execute(
                """
                insert or ignore into invoice_booking_rules
                (id, tenant_id, keyword, booking_account, tax_rate, cost_center, label, is_active, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                """,
                (rule_id, DEFAULT_TENANT_ID, keyword, booking_account, tax_rate, "", label, now_ms(), now_ms()),
            )
        for kind, template in DEFAULT_EMAIL_TEMPLATES.items():
            con.execute(
                """
                insert or ignore into email_templates
                (id, tenant_id, kind, label, subject, body, updated_at)
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    DEFAULT_TENANT_ID,
                    kind,
                    template["label"],
                    template["subject"],
                    template["body"],
                    now_ms(),
                ),
            )
        con.execute(
            """
            insert or ignore into mail_settings
            (tenant_id, driver, from_address, host, port, username, password, tls, updated_at)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (DEFAULT_TENANT_ID, MAIL_DRIVER, MAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, 1 if SMTP_TLS else 0, now_ms()),
        )

        con.execute(
            "update users set password_hash = ? where email = ? and (password_hash is null or password_hash = '')",
            (password_hash(DEMO_PASSWORD), DEMO_EMAIL),
        )
        con.execute(
            "update users set password_hash = ?, created_at = ? where typeof(created_at) = 'text'",
            (password_hash("start2026"), now_ms()),
        )
        for row in con.execute("select id, name, type, confidence, ocr_text, analysis_json from documents"):
            analysis = json.dumps({"type": row["type"], "confidence": row["confidence"], "engine": "simulation"}, ensure_ascii=False)
            con.execute(
                "update documents set ocr_text = coalesce(ocr_text, ?), ocr_engine = coalesce(ocr_engine, 'simulation'), ocr_status = coalesce(ocr_status, 'bereit'), analysis_json = coalesce(analysis_json, ?) where id = ?",
                (simulated_ocr_text(row["name"], row["type"]), analysis, row["id"]),
            )

        existing = con.execute("select count(*) as count from projects").fetchone()["count"]
        if existing:
            return

        user_id = str(uuid.uuid4())
        con.execute(
            "insert into users (id, tenant_id, name, email, role, password_hash, created_at) values (?, ?, ?, ?, ?, ?, ?)",
            (user_id, DEFAULT_TENANT_ID, "Anna Schneider", DEMO_EMAIL, "Geschäftsführung", password_hash(DEMO_PASSWORD), now_ms()),
        )

        projects = [
            ("lindenweg", "Mehrfamilienhaus Lindenweg", "Müller Bau GmbH", "Lindenweg 18, 70563 Stuttgart", "Anna Schneider"),
            ("kita", "Sanierung Kita Nord", "Stadtbau Amt Nord", "Kiefernstraße 7, 70191 Stuttgart", "Marc Weber"),
            ("hauptstrasse", "Hauptstraße 12", "Hausverwaltung Berger", "Hauptstraße 12, 71032 Böblingen", "Timo Klein"),
        ]
        for project in projects:
            con.execute(
                "insert into projects (id, tenant_id, name, customer, address, owner, created_at) values (?, ?, ?, ?, ?, ?, ?)",
                (project[0], DEFAULT_TENANT_ID, *project[1:], now_ms()),
            )

        seed_docs = [
            ("lindenweg", "RE-2026-184_Material-Elektro.pdf", "Rechnung", "geprüft", "06.06.2026", "ok", 92, 1880000),
            ("lindenweg", "Abnahmeprotokoll_Bauteil-B.pdf", "Abnahme", "offen", "29.05.2026", "warn", 84, 820000),
            ("lindenweg", "Foto_Mangel_Treppenhaus_03.jpg", "Mangel", "klären", "sofort", "risk", 88, 3200000),
            ("kita", "Angebot_2026-77_Malerarbeiten.pdf", "Angebot", "offen", "28.05.2026", "warn", 89, 1100000),
            ("kita", "Nachtrag_02_Trockenbau.pdf", "Nachtrag", "klären", "30.05.2026", "risk", 86, 780000),
            ("hauptstrasse", "Lieferschein_Heizkörper_4451.pdf", "Lieferschein", "offen", "29.05.2026", "warn", 94, 540000),
        ]
        for project_id, name, doc_type, status, due, tone, confidence, size in seed_docs:
            con.execute(
                """
                insert into documents
                (id, tenant_id, project_id, name, stored_name, mime, size, type, status, due, tone, confidence, source, ocr_text, ocr_engine, ocr_status, analysis_json, created_at)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()), DEFAULT_TENANT_ID, project_id, name, None, "application/pdf", size, doc_type,
                    status, due, tone, confidence, f"Quelle: {name} · Demo-Datensatz",
                    simulated_ocr_text(name, doc_type),
                    "simulation",
                    "bereit",
                    json.dumps({"engine": "simulation", "type": doc_type, "confidence": confidence}, ensure_ascii=False),
                    now_ms()
                ),
            )

        deadlines = [
            ("lindenweg", "Heute", "Mangel Treppenhaus klären", "Quelle: Foto_Mangel_Treppenhaus_03.jpg", "risk"),
            ("lindenweg", "29.05.2026", "Abnahmeprotokoll prüfen", "Bauteil B", "warn"),
            ("kita", "30.05.2026", "Nachtrag Trockenbau entscheiden", "Nachtrag 02", "risk"),
            ("hauptstrasse", "31.05.2026", "Rapport KW21 abschließen", "Montage", "ok"),
        ]
        for project_id, date_label, title, detail, tone in deadlines:
            con.execute(
                "insert into deadlines (id, tenant_id, project_id, date_label, title, detail, tone, created_at) values (?, ?, ?, ?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), DEFAULT_TENANT_ID, project_id, date_label, title, detail, tone, now_ms()),
            )

        con.execute(
            "insert into chat_messages (id, tenant_id, role, text, created_at) values (?, ?, ?, ?, ?)",
            (
                str(uuid.uuid4()), DEFAULT_TENANT_ID, "bot",
                "Willkommen. Ich kann Dokumente, Fristen und Bauakten durchsuchen und Antworten mit Quellen vorbereiten.",
                now_ms()
            ),
        )
        audit(con, "seed", "Demo-Datenbank initialisiert")


def audit(con, action, detail, tenant_id=DEFAULT_TENANT_ID):
    con.execute(
        "insert into audit_log (id, tenant_id, action, detail, created_at) values (?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), tenant_id, action, detail, now_ms()),
    )


def create_document_version(con, document_id, event, actor, tenant_id=DEFAULT_TENANT_ID):
    doc = con.execute(
        "select * from documents where id = ? and tenant_id = ?",
        (document_id, tenant_id),
    ).fetchone()
    if not doc:
        return
    version_no = con.execute(
        "select coalesce(max(version_no), 0) + 1 as next_version from document_versions where document_id = ? and tenant_id = ?",
        (document_id, tenant_id),
    ).fetchone()["next_version"]
    con.execute(
        """
        insert into document_versions
        (id, tenant_id, document_id, version_no, event, actor, snapshot_json, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            tenant_id,
            document_id,
            version_no,
            event,
            actor,
            json.dumps(row_to_dict(doc), ensure_ascii=False),
            now_ms(),
        ),
    )


def enqueue_ocr_job(document_id, reason, con=None, tenant_id=DEFAULT_TENANT_ID):
    close_after = con is None
    connection = con or db()
    try:
        connection.execute(
            "update documents set ocr_status = ? where id = ? and tenant_id = ?",
            ("wartet", document_id, tenant_id),
        )
        connection.execute(
            "insert into ocr_jobs (id, tenant_id, document_id, status, message, created_at) values (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), tenant_id, document_id, "wartet", reason, now_ms()),
        )
        if close_after:
            connection.commit()
    finally:
        if close_after:
            connection.close()
    if close_after:
        start_ocr_worker()


def start_ocr_worker():
    global OCR_WORKER_RUNNING
    with OCR_QUEUE_LOCK:
        if OCR_WORKER_RUNNING:
            return
        OCR_WORKER_RUNNING = True
    worker = threading.Thread(target=process_ocr_jobs, name="bauakte-ocr-worker", daemon=True)
    worker.start()


def process_ocr_jobs():
    global OCR_WORKER_RUNNING
    try:
        while True:
            with db() as con:
                job = con.execute(
                    "select * from ocr_jobs where status = ? order by created_at asc limit 1",
                    ("wartet",),
                ).fetchone()
                if not job:
                    break
                con.execute(
                    "update ocr_jobs set status = ?, started_at = ? where id = ?",
                    ("läuft", now_ms(), job["id"]),
                )
                con.execute(
                    "update documents set ocr_status = ? where id = ? and tenant_id = ?",
                    ("läuft", job["document_id"], job["tenant_id"]),
                )
                audit(con, "ocr.start", f"{job['document_id']} · {job['message'] or 'Warteschlange'}", job["tenant_id"])

            try:
                with db() as con:
                    doc = con.execute(
                        "select * from documents where id = ? and tenant_id = ?",
                        (job["document_id"], job["tenant_id"]),
                    ).fetchone()
                if not doc:
                    raise ValueError("Dokument nicht gefunden")
                path = FILE_STORAGE.path(doc["stored_name"]) if doc["stored_name"] else None
                if path and path.exists():
                    text, engine = extract_text_from_file(path, doc["name"], doc["type"])
                else:
                    text, engine = simulated_ocr_text(doc["name"], doc["type"]), "simulation"
                try:
                    current_analysis = json.loads(doc["analysis_json"] or "{}")
                except json.JSONDecodeError:
                    current_analysis = {}
                inferred = infer_document(doc["name"], text)
                current_analysis.update({"engine": engine, **inferred})
                analysis = json.dumps(
                    current_analysis,
                    ensure_ascii=False,
                )
                with db() as con:
                    con.execute(
                        """
                        update documents
                        set type = ?, status = ?, due = ?, tone = ?, confidence = ?,
                            ocr_text = ?, ocr_engine = ?, ocr_status = ?, analysis_json = ?
                        where id = ? and tenant_id = ?
                        """,
                        (
                            inferred["type"], inferred["status"], inferred["due"], inferred["tone"], inferred["confidence"],
                            text, engine, "bereit", analysis, job["document_id"], job["tenant_id"]
                        ),
                    )
                    create_document_version(con, job["document_id"], "ocr.finish", "OCR-Warteschlange", job["tenant_id"])
                    con.execute(
                        "update ocr_jobs set status = ?, engine = ?, finished_at = ? where id = ?",
                        ("fertig", engine, now_ms(), job["id"]),
                    )
                    audit(con, "ocr.finish", f"{doc['name']} · {engine}", job["tenant_id"])
            except Exception as error:
                with db() as con:
                    con.execute(
                        "update documents set ocr_status = ? where id = ? and tenant_id = ?",
                        ("fehler", job["document_id"], job["tenant_id"]),
                    )
                    con.execute(
                        "update ocr_jobs set status = ?, message = ?, finished_at = ? where id = ?",
                        ("fehler", str(error), now_ms(), job["id"]),
                    )
                    audit(con, "ocr.error", f"{job['document_id']} · {error}", job["tenant_id"])
    finally:
        with OCR_QUEUE_LOCK:
            OCR_WORKER_RUNNING = False


def row_to_dict(row):
    return dict(row)


def cookie_session_id(handler):
    cookie_header = handler.headers.get("Cookie", "")
    cookie = SimpleCookie(cookie_header)
    morsel = cookie.get("bauakte_session")
    return morsel.value if morsel else None


def current_user(handler):
    session_id = cookie_session_id(handler)
    if not session_id:
        return None
    with db() as con:
        row = con.execute(
            """
            select users.id, users.tenant_id, users.name, users.email, users.role, sessions.id as session_id,
                   tenants.name as tenant_name, tenants.plan as tenant_plan,
                   tenants.company_email as tenant_email, tenants.phone as tenant_phone,
                   tenants.billing_address as tenant_billing_address,
                   tenants.license_status as tenant_license_status,
                   tenants.seat_limit as tenant_seat_limit,
                   tenants.data_region as tenant_data_region
            from sessions
            join users on users.id = sessions.user_id
            left join tenants on tenants.id = users.tenant_id
            where sessions.id = ? and sessions.expires_at > ? and users.is_active = 1
            """,
            (session_id, now_ms()),
        ).fetchone()
        return row_to_dict(row) if row else None


def get_state(user=None):
    tenant_id = tenant_id_for(user)
    permissions = PERMISSIONS.get(user["role"] if user else "Geschäftsführung", set())
    can_manage = "user.manage" in permissions
    with db() as con:
        users = [row_to_dict(row) for row in con.execute("select id, name, email, role, is_active, mfa_enabled, failed_login_count, locked_until, last_login_at, created_at from users where tenant_id = ? order by created_at asc", (tenant_id,))] if can_manage else []
        team = [row_to_dict(row) for row in con.execute("select id, name, email, role from users where tenant_id = ? and is_active = 1 order by name asc", (tenant_id,))]
        session_count = con.execute(
            "select count(*) as count from sessions where user_id = ? and expires_at > ?",
            (user["id"], now_ms()),
        ).fetchone()["count"] if user else 0
        projects = [row_to_dict(row) for row in con.execute("select * from projects where tenant_id = ? order by created_at asc", (tenant_id,))]
        documents = [
            decorate_document(row)
            for row in con.execute(
                "select * from documents where tenant_id = ? and archived_at is null order by created_at desc",
                (tenant_id,),
            )
        ]
        invoice_field_rows = {
            row["document_id"]: row_to_dict(row)
            for row in con.execute("select * from invoice_fields where tenant_id = ?", (tenant_id,))
        }
        for doc in documents:
            doc["invoice_fields"] = invoice_field_rows.get(doc["id"])
        archived_documents = [
            decorate_document(row)
            for row in con.execute(
                "select * from documents where tenant_id = ? and archived_at is not null order by archived_at desc limit 20",
                (tenant_id,),
            )
        ] if can_manage else []
        deadlines = [row_to_dict(row) for row in con.execute("select * from deadlines where tenant_id = ? order by created_at desc", (tenant_id,))]
        note_rows = [
            row_to_dict(row)
            for row in con.execute(
                "select * from document_notes where tenant_id = ? order by created_at desc limit 80",
                (tenant_id,),
            )
        ]
        task_rows = [
            row_to_dict(row)
            for row in con.execute(
                "select * from document_tasks where tenant_id = ? order by created_at desc limit 120",
                (tenant_id,),
            )
        ]
        read_keys = [
            row["notification_key"]
            for row in con.execute(
                "select notification_key from notification_reads where tenant_id = ? and user_id = ? order by read_at desc limit 200",
                (tenant_id, user["id"]),
            )
        ] if user else []
        tenant_row = con.execute("select * from tenants where id = ?", (tenant_id,)).fetchone()
        chat = [row_to_dict(row) for row in con.execute("select role, text, created_at from chat_messages where tenant_id = ? order by created_at asc", (tenant_id,))]
        audit_rows = [row_to_dict(row) for row in con.execute("select action, detail, created_at from audit_log where tenant_id = ? order by created_at desc limit 20", (tenant_id,))] if can_manage else []
        ocr_jobs = [row_to_dict(row) for row in con.execute("select * from ocr_jobs where tenant_id = ? order by created_at desc limit 12", (tenant_id,))] if can_manage else []
        email_inbox_rows = [row_to_dict(row) for row in con.execute("select * from email_inbox where tenant_id = ? order by received_at desc limit 20", (tenant_id,))] if can_manage else []
        outbox_rows = [row_to_dict(row) for row in con.execute("select * from email_outbox where tenant_id = ? order by created_at desc limit 20", (tenant_id,))] if can_manage else []
        delivery_rows = [row_to_dict(row) for row in con.execute("select * from email_delivery_log where tenant_id = ? order by created_at desc limit 30", (tenant_id,))] if can_manage else []
        template_rows = [row_to_dict(row) for row in con.execute("select * from email_templates where tenant_id = ? order by kind asc", (tenant_id,))] if can_manage else []
        escalation_rules = [row_to_dict(row) for row in con.execute("select * from escalation_rules where tenant_id = ? order by created_at asc", (tenant_id,))] if can_manage else []
        invoice_booking_rules = [
            row_to_dict(row)
            for row in con.execute(
                "select * from invoice_booking_rules where tenant_id = ? order by is_active desc, keyword asc",
                (tenant_id,),
            )
        ]
        escalation_preview = escalation_candidates(con, tenant_id, user["email"] if user else DEMO_EMAIL)[:20] if can_manage else []
        tenant_escalation_interval = tenant_row["escalation_interval_minutes"] if tenant_row else ESCALATION_INTERVAL_MINUTES
        version_rows = [
            row_to_dict(row)
            for row in con.execute(
                """
                select document_versions.document_id, document_versions.version_no, document_versions.event,
                       document_versions.actor, document_versions.created_at, documents.name as document_name
                from document_versions
                join documents on documents.id = document_versions.document_id
                where document_versions.tenant_id = ?
                order by document_versions.created_at desc
                limit 30
                """,
                (tenant_id,),
            )
        ] if can_manage else []
        return {
            "user": {
                "id": user["id"] if user else "",
                "name": user["name"] if user else "Anna Schneider",
                "email": user["email"] if user else DEMO_EMAIL,
                "role": user["role"] if user else "Geschäftsführung",
                "tenant": (user or {}).get("tenant_name") or DEFAULT_TENANT_NAME,
                "tenant_id": tenant_id,
                "tenant_plan": (user or {}).get("tenant_plan") or "Profi Demo",
            },
            "tenant_profile": row_to_dict(tenant_row) if tenant_row else None,
            "projects": projects,
            "users": users,
            "team": team,
            "documents": documents,
            "archived_documents": archived_documents,
            "document_versions": version_rows,
            "document_notes": note_rows,
            "document_tasks": task_rows,
            "notification_reads": read_keys,
            "deadlines": deadlines,
            "chat": chat,
            "audit": audit_rows,
            "ocr_jobs": ocr_jobs,
            "email_inbox": email_inbox_rows,
            "email_outbox": outbox_rows,
            "email_delivery_log": delivery_rows,
            "email_templates": template_rows,
            "escalation_rules": escalation_rules,
            "invoice_booking_rules": invoice_booking_rules,
            "escalation_preview": escalation_preview,
            "storage": storage_status() if can_manage else None,
            "compliance": compliance_status(con, tenant_id) if can_manage else None,
            "system_check": system_readiness(con, tenant_id) if can_manage else None,
            "mail": mail_status(con, tenant_id) if can_manage else None,
            "escalation_scheduler": {
                "enabled": tenant_escalation_interval > 0,
                "interval_minutes": tenant_escalation_interval,
                "last_run_at": ESCALATION_SCHEDULER.get("last_run_at"),
                "last_result": ESCALATION_SCHEDULER.get("last_result"),
            } if can_manage else None,
            "security": {
                "session_hours": SESSION_HOURS,
                "cookie_secure": COOKIE_SECURE,
                "active_sessions": session_count,
                "max_login_attempts": LOGIN_MAX_ATTEMPTS,
                "lock_minutes": LOGIN_LOCK_MINUTES,
            },
            "security_policy": security_policy(con, tenant_id) if can_manage else None,
            "role_matrix": [
                {
                    "role": role,
                    "permissions": [
                        {"key": key, "label": PERMISSION_LABELS.get(key, key), "allowed": key in permissions}
                        for key in sorted(PERMISSION_LABELS)
                    ],
                }
                for role, permissions in PERMISSIONS.items()
            ] if can_manage else [],
            "permissions": sorted(permissions),
        }


def search_documents(query, user=None):
    tenant_id = tenant_id_for(user)
    terms = [term for term in re.split(r"\W+", query.lower()) if len(term) > 2]
    pattern = f"%{query.lower()}%"
    with db() as con:
        rows = con.execute(
            """
            select documents.*
            from documents
            left join projects on projects.id = documents.project_id
            where documents.tenant_id = ?
              and documents.archived_at is null
              and (
                lower(documents.name) like ?
                or lower(documents.type) like ?
                or lower(documents.status) like ?
                or lower(coalesce(documents.source, '')) like ?
                or lower(coalesce(documents.ocr_text, '')) like ?
                or lower(projects.name) like ?
                or lower(projects.customer) like ?
              )
            order by documents.created_at desc
            limit 25
            """,
            (tenant_id, pattern, pattern, pattern, pattern, pattern, pattern, pattern),
        )
        docs = []
        for row in rows:
            doc = decorate_document(row)
            doc["snippet"] = snippet(doc.get("ocr_text") or doc.get("source") or doc.get("name", ""), terms)
            doc["citations"] = document_citations(doc, query)
            docs.append(doc)
        return docs


def answer_from_sources(question, user=None):
    tenant_id = tenant_id_for(user)
    terms = [term for term in re.split(r"\W+", question.lower()) if len(term) > 3]
    rows = []
    with db() as con:
        if terms:
            clauses = " or ".join(["lower(documents.name || ' ' || documents.type || ' ' || coalesce(documents.ocr_text, '') || ' ' || coalesce(documents.source, '')) like ?" for _ in terms])
            params = [f"%{term}%" for term in terms]
            rows = [
                decorate_document(row)
                for row in con.execute(
                    f"select * from documents where tenant_id = ? and archived_at is null and ({clauses}) order by created_at desc limit 3",
                    [tenant_id, *params],
                )
            ]
        if not rows:
            rows = [
                decorate_document(row)
                for row in con.execute(
                    "select * from documents where tenant_id = ? and archived_at is null order by created_at desc limit 3",
                    (tenant_id,),
                )
            ]
    if not rows:
        return "Ich finde noch keine Dokumente, aus denen ich eine Quellenantwort ableiten kann."
    source_lines = []
    for doc in rows:
        citations = document_citations(doc, question)
        first_citation = citations[0] if citations else {"page": 1, "excerpt": "kein Textauszug"}
        source_lines.append(
            f"{doc['name']} ({doc['type']}, Status: {doc['status']}, Seite {first_citation['page']}, Fundstelle: {first_citation['excerpt']})"
        )
    return (
        "Ich habe passende Dokumente gefunden: "
        + "; ".join(source_lines)
        + ". Quellenbasis: gespeicherte Metadaten, OCR-Text und nachvollziehbare Fundstellen."
    )


def parse_multipart(handler, boundary):
    length = int(handler.headers.get("Content-Length", "0"))
    data = handler.rfile.read(length)
    marker = b"--" + boundary
    parts = {}
    files = []
    for section in data.split(marker):
        section = section.strip(b"\r\n")
        if not section or section == b"--":
            continue
        header_blob, _, body = section.partition(b"\r\n\r\n")
        headers = header_blob.decode("utf-8", "replace")
        body = body.rstrip(b"\r\n")
        disposition = next((line for line in headers.split("\r\n") if line.lower().startswith("content-disposition")), "")
        name_match = re.search(r'name="([^"]+)"', disposition)
        filename_match = re.search(r'filename="([^"]*)"', disposition)
        if not name_match:
            continue
        field_name = name_match.group(1)
        if filename_match and filename_match.group(1):
            files.append({"field": field_name, "filename": Path(filename_match.group(1)).name, "content": body})
        else:
            parts[field_name] = body.decode("utf-8", "replace")
    return parts, files


class Handler(BaseHTTPRequestHandler):
    server_version = "BauAkteKI/0.2"

    def require_user(self):
        user = current_user(self)
        if not user:
            self.error_json("Nicht angemeldet", HTTPStatus.UNAUTHORIZED)
            return None
        return user

    def require_permission(self, user, permission):
        if can(user, permission):
            return True
        self.error_json("Keine Berechtigung für diese Aktion", HTTPStatus.FORBIDDEN)
        return False

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/session":
            user = current_user(self)
            return self.json({"authenticated": bool(user), "user": user})
        if parsed.path == "/api/state":
            user = self.require_user()
            if not user:
                return
            return self.json(get_state(user))
        if parsed.path == "/api/search":
            user = self.require_user()
            if not user or not self.require_permission(user, "document.search"):
                return
            query = parse_qs(parsed.query).get("q", [""])[0].strip()
            return self.json({"query": query, "results": search_documents(query, user) if query else []})
        if parsed.path == "/api/export":
            user = self.require_user()
            if not user or not self.require_permission(user, "document.export"):
                return
            return self.json(get_state(user), filename="bauakte-ki-export.json")
        if parsed.path == "/api/audit/export":
            user = self.require_user()
            if not user or not self.require_permission(user, "user.manage"):
                return
            tenant_id = tenant_id_for(user)
            output = io.StringIO()
            writer = csv.writer(output, delimiter=";")
            writer.writerow(["Zeitpunkt", "Aktion", "Detail"])
            with db() as con:
                rows = con.execute(
                    "select action, detail, created_at from audit_log where tenant_id = ? order by created_at desc",
                    (tenant_id,),
                )
                for row in rows:
                    writer.writerow([
                        time.strftime("%d.%m.%Y %H:%M", time.localtime(row["created_at"] / 1000)),
                        row["action"],
                        row["detail"] or "",
                    ])
                audit(con, "audit.export", f"{user['email']} · CSV", tenant_id)
            return self.text(output.getvalue(), "text/csv; charset=utf-8", "bauakte-audit.csv")
        if parsed.path == "/api/backup":
            user = self.require_user()
            if not user or not self.require_permission(user, "backup.create"):
                return
            backup_dir = ROOT / "backups"
            backup_dir.mkdir(exist_ok=True)
            backup_path = backup_dir / f"bauakte-backup-{now_ms()}.db"
            backup_path.write_bytes(DB_PATH.read_bytes())
            with db() as con:
                audit(con, "backup.create", f"{user['email']} · {backup_path.name}", tenant_id_for(user))
            return self.json({"backup": str(backup_path), "name": backup_path.name, "verification": latest_backup_status()})
        if parsed.path == "/api/backup/verify":
            user = self.require_user()
            if not user or not self.require_permission(user, "backup.create"):
                return
            status = latest_backup_status()
            with db() as con:
                audit(con, "backup.verify", f"{user['email']} · {status.get('backup') or status['status']}", tenant_id_for(user))
            return self.json(status)
        if parsed.path == "/api/compliance/status":
            user = self.require_user()
            if not user or not self.require_permission(user, "user.manage"):
                return
            with db() as con:
                return self.json(compliance_status(con, tenant_id_for(user)))
        if parsed.path == "/api/system-check":
            user = self.require_user()
            if not user or not self.require_permission(user, "user.manage"):
                return
            with db() as con:
                result = system_readiness(con, tenant_id_for(user))
                audit(con, "system.check", f"{user['email']} · {result['score']}% · {result['readiness']}", tenant_id_for(user))
                return self.json(result)
        if parsed.path == "/api/storage":
            user = self.require_user()
            if not user or not self.require_permission(user, "user.manage"):
                return
            return self.json(storage_status())
        if parsed.path.startswith("/uploads/"):
            user = self.require_user()
            if not user or not self.require_permission(user, "document.view"):
                return
            stored_name = Path(parsed.path).name
            with db() as con:
                allowed = con.execute(
                    "select 1 from documents where stored_name = ? and tenant_id = ? and archived_at is null",
                    (stored_name, tenant_id_for(user)),
                ).fetchone()
            if not allowed:
                return self.error_json("Datei nicht gefunden", HTTPStatus.NOT_FOUND)
            return self.static_file(FILE_STORAGE.path(stored_name))
        path = "index.html" if parsed.path in ("/", "") else parsed.path.lstrip("/")
        return self.static_file(ROOT / path)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/login":
            payload = self.read_json()
            email = payload.get("email", "").strip().lower()
            password = payload.get("password", "")
            with db() as con:
                user = con.execute("select * from users where lower(email) = ?", (email,)).fetchone()
                locked = user and user["locked_until"] and user["locked_until"] > now_ms()
                valid = user and user["is_active"] and not locked and verify_password(user["password_hash"], password)
                if not valid:
                    if user and user["is_active"] and not locked:
                        failed_count = (user["failed_login_count"] or 0) + 1
                        locked_until = now_ms() + LOGIN_LOCK_MINUTES * 60 * 1000 if failed_count >= LOGIN_MAX_ATTEMPTS else None
                        con.execute(
                            "update users set failed_login_count = ?, locked_until = ? where id = ?",
                            (failed_count, locked_until, user["id"]),
                        )
                        if locked_until:
                            audit(con, "auth.locked", email, user["tenant_id"])
                    audit(con, "auth.failed", email)
                    message = "Zugang vorübergehend gesperrt. Bitte später erneut versuchen." if locked else "Login fehlgeschlagen"
                    return self.error_json(message, HTTPStatus.UNAUTHORIZED)
                if password_needs_rehash(user["password_hash"]):
                    con.execute("update users set password_hash = ? where id = ?", (password_hash(password), user["id"]))
                    audit(con, "auth.password_rehash", email, user["tenant_id"])
                con.execute(
                    "update users set failed_login_count = 0, locked_until = null, last_login_at = ? where id = ?",
                    (now_ms(), user["id"]),
                )
                tenant_policy = con.execute("select admin_mfa_required from tenants where id = ?", (user["tenant_id"],)).fetchone()
                admin_mfa_required = bool(tenant_policy["admin_mfa_required"]) if tenant_policy else True
                mfa_required = bool(user["mfa_enabled"]) or (admin_mfa_required and user["role"] == "Geschäftsführung")
                if mfa_required:
                    if not user["mfa_enabled"]:
                        con.execute("update users set mfa_enabled = 1 where id = ?", (user["id"],))
                        audit(con, "auth.mfa_enforced", email, user["tenant_id"])
                    challenge_id = str(uuid.uuid4())
                    code = new_mfa_code()
                    con.execute(
                        """
                        insert into mfa_challenges
                        (id, user_id, code_hash, created_at, expires_at)
                        values (?, ?, ?, ?, ?)
                        """,
                        (challenge_id, user["id"], code_hash(code), now_ms(), now_ms() + 1000 * 60 * 5),
                    )
                    queue_email(
                        con,
                        user["tenant_id"],
                        user["email"],
                        "Ihr Zwei-Faktor-Code für BauAkte KI",
                        f"Hallo {user['name']},\n\nIhr Anmeldecode lautet: {code}\n\nDer Code ist 5 Minuten gültig.\n\nAbsender: {MAIL_FROM}",
                        "mfa",
                    )
                    audit(con, "auth.mfa_required", email, user["tenant_id"])
                    return self.json({
                        "authenticated": False,
                        "requires_mfa": True,
                        "challenge_id": challenge_id,
                        "delivery": "E-Mail-Ausgang",
                        "demo_code": code
                    })
                session_id = create_session(con, user)
                audit(con, "auth.login", email, user["tenant_id"])
            return self.json(
                {"authenticated": True, "user": {"name": user["name"], "email": user["email"], "role": user["role"]}},
                cookie=session_cookie(session_id)
            )

        if parsed.path == "/api/login/mfa":
            payload = self.read_json()
            challenge_id = payload.get("challenge_id", "")
            code = payload.get("code", "").strip()
            with db() as con:
                challenge = con.execute(
                    """
                    select mfa_challenges.*, users.email, users.tenant_id, users.name, users.role, users.is_active
                    from mfa_challenges
                    join users on users.id = mfa_challenges.user_id
                    where mfa_challenges.id = ?
                    """,
                    (challenge_id,),
                ).fetchone()
                valid = (
                    challenge
                    and challenge["is_active"]
                    and not challenge["used_at"]
                    and challenge["expires_at"] > now_ms()
                    and hmac.compare_digest(challenge["code_hash"], code_hash(code))
                )
                if not valid:
                    audit(con, "auth.mfa_failed", challenge["email"] if challenge else challenge_id)
                    return self.error_json("Zwei-Faktor-Code ungültig", HTTPStatus.UNAUTHORIZED)
                con.execute("update mfa_challenges set used_at = ? where id = ?", (now_ms(), challenge_id))
                session_id = create_session(con, challenge)
                audit(con, "auth.login_mfa", challenge["email"], challenge["tenant_id"])
            return self.json(
                {"authenticated": True, "user": {"name": challenge["name"], "email": challenge["email"], "role": challenge["role"]}},
                cookie=session_cookie(session_id)
            )

        if parsed.path == "/api/logout":
            session_id = cookie_session_id(self)
            with db() as con:
                if session_id:
                    con.execute("delete from sessions where id = ?", (session_id,))
                audit(con, "auth.logout", session_id or "no-session")
            return self.json({"authenticated": False}, cookie=clear_session_cookie())

        user = self.require_user()
        if not user:
            return

        if parsed.path == "/api/session/logout-all":
            tenant_id = tenant_id_for(user)
            with db() as con:
                con.execute("delete from sessions where user_id = ?", (user["id"],))
                audit(con, "auth.logout_all", user["email"], tenant_id)
            return self.json({"authenticated": False}, cookie=clear_session_cookie())

        if parsed.path == "/api/tenant":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            seat_limit = max(1, min(500, int(payload.get("seat_limit") or 10)))
            try:
                escalation_interval = max(0, min(10080, int(payload.get("escalation_interval_minutes") or 0)))
            except (TypeError, ValueError):
                return self.error_json("Eskalationsintervall ungültig", HTTPStatus.BAD_REQUEST)
            license_status = payload.get("license_status", "aktiv")
            if license_status not in {"aktiv", "test", "pausiert", "gekündigt"}:
                return self.error_json("Unbekannter Lizenzstatus", HTTPStatus.BAD_REQUEST)
            with db() as con:
                con.execute(
                    """
                    update tenants
                    set name = ?, plan = ?, company_email = ?, phone = ?, billing_address = ?,
                        license_status = ?, seat_limit = ?, data_region = ?, escalation_interval_minutes = ?
                    where id = ?
                    """,
                    (
                        payload.get("name", "").strip() or DEFAULT_TENANT_NAME,
                        payload.get("plan", "").strip() or "Profi",
                        payload.get("company_email", "").strip(),
                        payload.get("phone", "").strip(),
                        payload.get("billing_address", "").strip(),
                        license_status,
                        seat_limit,
                        payload.get("data_region", "").strip() or "Deutschland",
                        escalation_interval,
                        tenant_id,
                    ),
                )
                audit(con, "tenant.update", f"{user['email']} · {payload.get('name', '')} · Eskalation alle {escalation_interval} Min.", tenant_id)
            ESCALATION_SCHEDULER["interval_minutes"] = escalation_interval
            return self.json(get_state(user))

        if parsed.path == "/api/compliance/settings":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            try:
                audit_days = max(30, min(3650, int(payload.get("audit_retention_days") or 1095)))
                mail_days = max(30, min(3650, int(payload.get("mail_retention_days") or 365)))
            except (TypeError, ValueError):
                return self.error_json("Aufbewahrungsfrist ungültig", HTTPStatus.BAD_REQUEST)
            with db() as con:
                con.execute(
                    "update tenants set audit_retention_days = ?, mail_retention_days = ? where id = ?",
                    (audit_days, mail_days, tenant_id),
                )
                audit(con, "compliance.settings", f"{user['email']} · Audit {audit_days} Tage · E-Mail {mail_days} Tage", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/security/policy":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            admin_mfa_required = 1 if payload.get("admin_mfa_required", True) else 0
            with db() as con:
                con.execute("update tenants set admin_mfa_required = ? where id = ?", (admin_mfa_required, tenant_id))
                if admin_mfa_required:
                    con.execute(
                        "update users set mfa_enabled = 1 where tenant_id = ? and role = 'Geschäftsführung' and is_active = 1",
                        (tenant_id,),
                    )
                audit(con, "security.policy", f"{user['email']} · Admin-2FA {'aktiv' if admin_mfa_required else 'aus'}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/compliance/cleanup":
            if not self.require_permission(user, "user.manage"):
                return
            tenant_id = tenant_id_for(user)
            with db() as con:
                tenant = con.execute("select * from tenants where id = ?", (tenant_id,)).fetchone()
                audit_days = int((tenant["audit_retention_days"] if tenant else 1095) or 1095)
                mail_days = int((tenant["mail_retention_days"] if tenant else 365) or 365)
                audit_cutoff = now_ms() - audit_days * 24 * 60 * 60 * 1000
                mail_cutoff = now_ms() - mail_days * 24 * 60 * 60 * 1000
                old_audit = con.execute(
                    "select count(*) as value from audit_log where tenant_id = ? and created_at < ?",
                    (tenant_id, audit_cutoff),
                ).fetchone()["value"]
                old_delivery = con.execute(
                    "select count(*) as value from email_delivery_log where tenant_id = ? and created_at < ?",
                    (tenant_id, mail_cutoff),
                ).fetchone()["value"]
                old_outbox = con.execute(
                    """
                    select count(*) as value
                    from email_outbox
                    where tenant_id = ? and created_at < ? and status in ('gesendet', 'gespeichert', 'fehler')
                    """,
                    (tenant_id, mail_cutoff),
                ).fetchone()["value"]
                con.execute("delete from audit_log where tenant_id = ? and created_at < ?", (tenant_id, audit_cutoff))
                con.execute("delete from email_delivery_log where tenant_id = ? and created_at < ?", (tenant_id, mail_cutoff))
                con.execute(
                    """
                    delete from email_outbox
                    where tenant_id = ? and created_at < ? and status in ('gesendet', 'gespeichert', 'fehler')
                    """,
                    (tenant_id, mail_cutoff),
                )
                con.execute("delete from notification_reads where tenant_id = ? and read_at < ?", (tenant_id, audit_cutoff))
                audit(con, "compliance.cleanup", f"{user['email']} · Audit {old_audit} · Mail {old_delivery + old_outbox}", tenant_id)
                cleanup_result = {"audit": old_audit, "mail": old_delivery + old_outbox}
            state = get_state(user)
            state["cleanup_result"] = cleanup_result
            return self.json(state)

        if parsed.path == "/api/system-check/repair-checksums":
            if not self.require_permission(user, "user.manage"):
                return
            tenant_id = tenant_id_for(user)
            repaired = 0
            missing = 0
            with db() as con:
                rows = list(con.execute(
                    """
                    select id, name, stored_name
                    from documents
                    where tenant_id = ? and stored_name is not null and (checksum_sha256 is null or checksum_sha256 = '')
                    """,
                    (tenant_id,),
                ))
                for row in rows:
                    path = FILE_STORAGE.path(row["stored_name"])
                    if not path.exists():
                        missing += 1
                        continue
                    con.execute(
                        "update documents set checksum_sha256 = ? where id = ? and tenant_id = ?",
                        (sha256_file(path), row["id"], tenant_id),
                    )
                    repaired += 1
                audit(con, "system.checksum_repair", f"{user['email']} · {repaired} ergänzt · {missing} fehlen", tenant_id)
            state = get_state(user)
            state["checksum_repair"] = {"repaired": repaired, "missing": missing}
            return self.json(state)

        if parsed.path == "/api/projects":
            if not self.require_permission(user, "project.create"):
                return
            payload = self.read_json()
            project_id = slugify(payload.get("name", ""))
            tenant_id = tenant_id_for(user)
            with db() as con:
                con.execute(
                    "insert into projects (id, tenant_id, name, customer, address, owner, created_at) values (?, ?, ?, ?, ?, ?, ?)",
                    (
                        project_id, tenant_id, payload.get("name", "").strip(), payload.get("customer", "").strip(),
                        payload.get("address", "").strip(), payload.get("owner", "Noch nicht zugewiesen"), now_ms()
                    ),
                )
                audit(con, "project.create", f"{user['email']} · {payload.get('name', '')}", tenant_id)
            return self.json(get_state(user), status=HTTPStatus.CREATED)

        if parsed.path == "/api/deadlines":
            if not self.require_permission(user, "deadline.create"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            with db() as con:
                con.execute(
                    "insert into deadlines (id, tenant_id, project_id, date_label, title, detail, tone, created_at) values (?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        str(uuid.uuid4()), tenant_id, payload.get("project_id"), payload.get("date_label", ""),
                        payload.get("title", ""), payload.get("detail", ""), payload.get("tone", "warn"), now_ms()
                    ),
                )
                audit(con, "deadline.create", f"{user['email']} · {payload.get('title', '')}", tenant_id)
            return self.json(get_state(user), status=HTTPStatus.CREATED)

        if parsed.path == "/api/deadlines/remind":
            if not self.require_permission(user, "deadline.create"):
                return
            tenant_id = tenant_id_for(user)
            with db() as con:
                rows = [
                    row_to_dict(row)
                    for row in con.execute(
                        """
                        select deadlines.*, projects.name as project_name
                        from deadlines
                        left join projects on projects.id = deadlines.project_id
                        where deadlines.tenant_id = ? and deadlines.tone in ('risk', 'warn')
                        order by deadlines.created_at desc
                        limit 12
                        """,
                        (tenant_id,),
                    )
                ]
                if not rows:
                    return self.json({**get_state(user), "reminders": 0})
                    lines = [
                        f"- {item['date_label']}: {item['title']} ({item.get('project_name') or item.get('detail') or 'ohne Projekt'})"
                        for item in rows
                    ]
                    subject, body = email_template(
                        con,
                        tenant_id,
                        "deadline_reminder",
                        "Frist-Erinnerung aus BauAkte KI",
                        "Offene Fristen und Wiedervorlagen:\n\n{items}\n\nAusgelöst durch: {actor}",
                    )
                    queue_email(
                        con,
                        tenant_id,
                        user["email"],
                        render_template(subject, {"items": "\n".join(lines), "actor": user["email"], "recipient": user["email"]}),
                        render_template(body, {"items": "\n".join(lines), "actor": user["email"], "recipient": user["email"]}),
                        "deadline_reminder",
                    )
                audit(con, "deadline.reminder", f"{user['email']} · {len(rows)} Fristen", tenant_id)
            return self.json({**get_state(user), "reminders": len(rows)})

        if parsed.path == "/api/tasks/remind":
            if not self.require_permission(user, "deadline.create"):
                return
            tenant_id = tenant_id_for(user)
            with db() as con:
                rows = [
                    row_to_dict(row)
                    for row in con.execute(
                        """
                        select document_tasks.*, documents.name as document_name, projects.name as project_name, users.email as assignee_email
                        from document_tasks
                        join documents on documents.id = document_tasks.document_id
                        left join projects on projects.id = documents.project_id
                        left join users on users.id = document_tasks.assignee_id
                        where document_tasks.tenant_id = ?
                          and document_tasks.status != 'erledigt'
                          and (
                            document_tasks.priority in ('kritisch', 'hoch')
                            or lower(document_tasks.due) in ('heute', 'sofort')
                          )
                        order by document_tasks.created_at desc
                        limit 20
                        """,
                        (tenant_id,),
                    )
                ]
                if not rows:
                    return self.json({**get_state(user), "task_reminders": 0})
                grouped = {}
                for item in rows:
                    recipient = item.get("assignee_email") or user["email"]
                    grouped.setdefault(recipient, []).append(item)
                for recipient, items in grouped.items():
                    lines = [
                        f"- {item['priority']}: {item['action']} bis {item.get('due') or 'ohne Frist'} · {item['document_name']} ({item.get('project_name') or 'ohne Bauakte'})"
                        for item in items
                    ]
                    subject, body = email_template(
                        con,
                        tenant_id,
                        "task_reminder",
                        "Aufgaben-Erinnerung aus BauAkte KI",
                        "Offene kritische Aufgaben:\n\n{items}\n\nAusgelöst durch: {actor}",
                    )
                    queue_email(
                        con,
                        tenant_id,
                        recipient,
                        render_template(subject, {"items": "\n".join(lines), "actor": user["email"], "recipient": recipient}),
                        render_template(body, {"items": "\n".join(lines), "actor": user["email"], "recipient": recipient}),
                        "task_reminder",
                    )
                audit(con, "task.reminder", f"{user['email']} · {len(rows)} Aufgaben · {len(grouped)} Empfänger", tenant_id)
            return self.json({**get_state(user), "task_reminders": len(rows)})

        if parsed.path == "/api/escalations/run":
            if not self.require_permission(user, "user.manage"):
                return
            tenant_id = tenant_id_for(user)
            with db() as con:
                result = run_escalations_for_tenant(con, tenant_id, user["email"], "run")
            return self.json({**get_state(user), "escalations_queued": result["queued"], "escalations_skipped": result["skipped"]})

        if parsed.path == "/api/escalations/rule":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            rule_id = (payload.get("id") or "").strip()
            target_role = payload.get("target_role", "Geschäftsführung")
            if target_role not in PERMISSIONS:
                return self.error_json("Unbekannte Zielrolle", HTTPStatus.BAD_REQUEST)
            try:
                threshold_hours = max(0, min(720, int(payload.get("threshold_hours") or 0)))
            except (TypeError, ValueError):
                return self.error_json("Schwellenwert ungültig", HTTPStatus.BAD_REQUEST)
            is_active = 1 if payload.get("is_active") else 0
            with db() as con:
                rule = con.execute(
                    "select * from escalation_rules where id = ? and tenant_id = ?",
                    (rule_id, tenant_id),
                ).fetchone()
                if not rule:
                    return self.error_json("Eskalationsregel nicht gefunden", HTTPStatus.NOT_FOUND)
                con.execute(
                    """
                    update escalation_rules
                    set threshold_hours = ?, target_role = ?, is_active = ?
                    where id = ? and tenant_id = ?
                    """,
                    (threshold_hours, target_role, is_active, rule_id, tenant_id),
                )
                audit(con, "escalation.rule", f"{user['email']} · {rule['name']} · {threshold_hours}h · {target_role} · {'aktiv' if is_active else 'pausiert'}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/email-template":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            kind = (payload.get("kind") or "").strip()
            subject = (payload.get("subject") or "").strip()
            body = (payload.get("body") or "").strip()
            if kind not in {"deadline_reminder", "task_reminder", "escalation"}:
                return self.error_json("Unbekannte Vorlage", HTTPStatus.BAD_REQUEST)
            if not subject or not body:
                return self.error_json("Betreff und Text sind erforderlich", HTTPStatus.BAD_REQUEST)
            with db() as con:
                row = con.execute(
                    "select id, label from email_templates where tenant_id = ? and kind = ?",
                    (tenant_id, kind),
                ).fetchone()
                if not row:
                    return self.error_json("Vorlage nicht gefunden", HTTPStatus.NOT_FOUND)
                con.execute(
                    "update email_templates set subject = ?, body = ?, updated_at = ? where id = ? and tenant_id = ?",
                    (subject[:180], body[:5000], now_ms(), row["id"], tenant_id),
                )
                audit(con, "email_template.update", f"{user['email']} · {row['label']}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/email-template/reset":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            kind = (payload.get("kind") or "").strip()
            template = DEFAULT_EMAIL_TEMPLATES.get(kind)
            if not template:
                return self.error_json("Unbekannte Vorlage", HTTPStatus.BAD_REQUEST)
            with db() as con:
                con.execute(
                    """
                    insert into email_templates
                    (id, tenant_id, kind, label, subject, body, updated_at)
                    values (?, ?, ?, ?, ?, ?, ?)
                    on conflict(tenant_id, kind) do update set
                      label = excluded.label,
                      subject = excluded.subject,
                      body = excluded.body,
                      updated_at = excluded.updated_at
                    """,
                    (
                        str(uuid.uuid4()),
                        tenant_id,
                        kind,
                        template["label"],
                        template["subject"],
                        template["body"],
                        now_ms(),
                    ),
                )
                audit(con, "email_template.reset", f"{user['email']} · {template['label']}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/notifications/read":
            payload = self.read_json()
            keys = payload.get("keys") or []
            if not isinstance(keys, list):
                return self.error_json("Ungültige Hinweise", HTTPStatus.BAD_REQUEST)
            clean_keys = [str(key)[:500] for key in keys if str(key).strip()]
            tenant_id = tenant_id_for(user)
            with db() as con:
                for key in clean_keys[:100]:
                    con.execute(
                        """
                        insert or ignore into notification_reads (id, tenant_id, user_id, notification_key, read_at)
                        values (?, ?, ?, ?, ?)
                        """,
                        (str(uuid.uuid4()), tenant_id, user["id"], key, now_ms()),
                    )
                if clean_keys:
                    audit(con, "notification.read", f"{user['email']} · {len(clean_keys)} Hinweise", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/outbox/update":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            mail_id = (payload.get("id") or "").strip()
            recipient = (payload.get("recipient") or "").strip()
            subject = (payload.get("subject") or "").strip()
            body = (payload.get("body") or "").strip()
            if not mail_id:
                return self.error_json("E-Mail fehlt", HTTPStatus.BAD_REQUEST)
            if "@" not in recipient or not subject or not body:
                return self.error_json("Empfänger, Betreff und Text sind erforderlich", HTTPStatus.BAD_REQUEST)
            with db() as con:
                mail = con.execute(
                    "select * from email_outbox where id = ? and tenant_id = ?",
                    (mail_id, tenant_id),
                ).fetchone()
                if not mail:
                    return self.error_json("E-Mail nicht gefunden", HTTPStatus.NOT_FOUND)
                if mail["status"] == "gesendet":
                    return self.error_json("Gesendete E-Mails können nicht bearbeitet werden", HTTPStatus.BAD_REQUEST)
                con.execute(
                    """
                    update email_outbox
                    set recipient = ?, subject = ?, body = ?, status = 'gespeichert', error_message = null
                    where id = ? and tenant_id = ?
                    """,
                    (recipient[:240], subject[:180], body[:8000], mail_id, tenant_id),
                )
                audit(con, "mail.update", f"{user['email']} · {recipient} · {subject[:80]}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/outbox/delete":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            mail_id = (payload.get("id") or "").strip()
            with db() as con:
                mail = con.execute(
                    "select * from email_outbox where id = ? and tenant_id = ?",
                    (mail_id, tenant_id),
                ).fetchone()
                if not mail:
                    return self.error_json("E-Mail nicht gefunden", HTTPStatus.NOT_FOUND)
                if mail["status"] == "gesendet":
                    return self.error_json("Gesendete E-Mails können nicht gelöscht werden", HTTPStatus.BAD_REQUEST)
                con.execute("delete from email_outbox where id = ? and tenant_id = ?", (mail_id, tenant_id))
                audit(con, "mail.delete", f"{user['email']} · {mail['recipient']} · {mail['subject'][:80]}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/outbox/send-one":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            mail_id = (payload.get("id") or "").strip()
            with db() as con:
                mail = con.execute(
                    "select recipient, subject from email_outbox where id = ? and tenant_id = ?",
                    (mail_id, tenant_id),
                ).fetchone()
                result = send_outbox_email(con, tenant_id, mail_id)
                if result is None:
                    return self.error_json("E-Mail nicht gefunden", HTTPStatus.NOT_FOUND)
                audit(
                    con,
                    "mail.send_one",
                    f"{user['email']} · {mail['recipient'] if mail else mail_id} · gesendet {result.get('sent', 0)} · fehler {result.get('failed', 0)} · lokal {result.get('skipped', 0)}",
                    tenant_id,
                )
            return self.json({**get_state(user), "mail_result": result})

        if parsed.path == "/api/mail-settings":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            driver = payload.get("driver", "outbox")
            if driver not in {"outbox", "smtp"}:
                return self.error_json("Unbekannter Mail-Treiber", HTTPStatus.BAD_REQUEST)
            try:
                port = max(1, min(65535, int(payload.get("port") or 587)))
            except (TypeError, ValueError):
                return self.error_json("SMTP-Port ungültig", HTTPStatus.BAD_REQUEST)
            from_address = (payload.get("from_address") or MAIL_FROM).strip()
            host = (payload.get("host") or "").strip()
            username = (payload.get("username") or "").strip()
            password = payload.get("password")
            tls = 1 if payload.get("tls") else 0
            if "@" not in from_address:
                return self.error_json("Absender muss eine gültige E-Mail-Adresse enthalten", HTTPStatus.BAD_REQUEST)
            if driver == "smtp" and not host:
                return self.error_json("Für echten SMTP-Versand ist ein SMTP-Server erforderlich", HTTPStatus.BAD_REQUEST)
            with db() as con:
                current = con.execute("select password from mail_settings where tenant_id = ?", (tenant_id,)).fetchone()
                stored_password = current["password"] if current else ""
                next_password = stored_password if password in (None, "") else str(password)
                con.execute(
                    """
                    insert into mail_settings
                    (tenant_id, driver, from_address, host, port, username, password, tls, updated_at)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    on conflict(tenant_id) do update set
                      driver = excluded.driver,
                      from_address = excluded.from_address,
                      host = excluded.host,
                      port = excluded.port,
                      username = excluded.username,
                      password = excluded.password,
                      tls = excluded.tls,
                      updated_at = excluded.updated_at
                    """,
                    (tenant_id, driver, from_address, host, port, username, next_password, tls, now_ms()),
                )
                audit(con, "mail.settings", f"{user['email']} · {driver} · {host or 'lokal'}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/mail-settings/test":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            recipient = (payload.get("recipient") or "").strip()
            if "@" not in recipient or len(recipient) > 240:
                return self.error_json("Gültige Test-E-Mail-Adresse erforderlich", HTTPStatus.BAD_REQUEST)
            with db() as con:
                tenant = con.execute("select name from tenants where id = ?", (tenant_id,)).fetchone()
                subject = "Testmail aus BauAkte KI"
                body = (
                    "Diese Testmail bestätigt den E-Mail-Ausgang von BauAkte KI.\n\n"
                    f"Mandant: {tenant['name'] if tenant else tenant_id}\n"
                    f"Ausgelöst durch: {user['email']}\n"
                    f"Zeitpunkt: {time.strftime('%d.%m.%Y %H:%M')}\n\n"
                    "Wenn diese Nachricht ankommt, ist der SMTP-Versand grundsätzlich erreichbar."
                )
                mail_id = queue_email(con, tenant_id, recipient, subject, body, "mail_test")
                result = send_outbox_email(con, tenant_id, mail_id)
                audit(
                    con,
                    "mail.test",
                    f"{user['email']} · {recipient} · gesendet {result.get('sent', 0)} · fehler {result.get('failed', 0)} · lokal {result.get('skipped', 0)}",
                    tenant_id,
                )
            return self.json({**get_state(user), "mail_result": result})

        if parsed.path == "/api/email-inbox/demo":
            if not self.require_permission(user, "document.upload"):
                return
            tenant_id = tenant_id_for(user)
            payload = self.read_json()
            subject = (payload.get("subject") or "Rechnung Lindenweg Materiallieferung").strip()
            sender = (payload.get("sender") or "lieferant@example.com").strip()
            attachment_name = (payload.get("attachment_name") or "Rechnung_Lindenweg_Material.pdf").strip()
            body = (payload.get("body") or "Sehr geehrte Damen und Herren,\n\nanbei die Rechnung zum Mehrfamilienhaus Lindenweg.\nZahlungsziel 14 Tage, fällig bis 20.06.2026.\n\nFreundliche Grüße").strip()
            with db() as con:
                project_id, project_confidence = infer_project_id(con, tenant_id, attachment_name, body, "auto")
                con.execute(
                    """
                    insert into email_inbox
                    (id, tenant_id, sender, subject, body, attachment_name, status, suggested_project_id, project_confidence, received_at)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (str(uuid.uuid4()), tenant_id, sender[:240], subject[:180], body[:8000], attachment_name[:240], "neu", project_id, project_confidence, now_ms()),
                )
                audit(con, "email_inbox.demo", f"{user['email']} · {sender} · {subject}", tenant_id)
            return self.json(get_state(user), status=HTTPStatus.CREATED)

        if parsed.path == "/api/email-inbox/convert":
            if not self.require_permission(user, "document.upload"):
                return
            payload = self.read_json()
            email_id = (payload.get("id") or "").strip()
            tenant_id = tenant_id_for(user)
            with db() as con:
                email_row = con.execute("select * from email_inbox where id = ? and tenant_id = ?", (email_id, tenant_id)).fetchone()
                if not email_row:
                    return self.error_json("E-Mail nicht gefunden", HTTPStatus.NOT_FOUND)
                document_id = create_document_from_email(con, tenant_id, email_row, user["email"])
            return self.json({**get_state(user), "converted_document_id": document_id}, status=HTTPStatus.CREATED)

        if parsed.path == "/api/profile/password":
            payload = self.read_json()
            current_password = payload.get("current_password", "")
            new_password = payload.get("new_password", "")
            confirm_password = payload.get("confirm_password", "")
            if new_password != confirm_password:
                return self.error_json("Passwortbestätigung stimmt nicht überein", HTTPStatus.BAD_REQUEST)
            validation_error = validate_new_password(new_password)
            if validation_error:
                return self.error_json(validation_error, HTTPStatus.BAD_REQUEST)
            tenant_id = tenant_id_for(user)
            with db() as con:
                target = con.execute("select * from users where id = ? and tenant_id = ?", (user["id"], tenant_id)).fetchone()
                if not target or not verify_password(target["password_hash"], current_password):
                    audit(con, "profile.password_failed", user["email"], tenant_id)
                    return self.error_json("Aktuelles Passwort ist falsch", HTTPStatus.UNAUTHORIZED)
                con.execute(
                    "update users set password_hash = ? where id = ? and tenant_id = ?",
                    (password_hash(new_password), user["id"], tenant_id),
                )
                audit(con, "profile.password_change", user["email"], tenant_id)
            return self.json({"ok": True, **get_state(user)})

        if parsed.path == "/api/outbox/send":
            if not self.require_permission(user, "user.manage"):
                return
            tenant_id = tenant_id_for(user)
            with db() as con:
                result = send_pending_emails(con, tenant_id)
                audit(con, "mail.send", f"{user['email']} · gesendet {result['sent']} · fehler {result['failed']} · lokal {result['skipped']}", tenant_id)
            return self.json({**get_state(user), "mail_result": result})

        if parsed.path == "/api/documents/status":
            if not self.require_permission(user, "document.update"):
                return
            payload = self.read_json()
            status = payload.get("status", "").strip()
            tone = payload.get("tone", "warn").strip()
            due = payload.get("due", "").strip()
            document_id = payload.get("id", "")
            tenant_id = tenant_id_for(user)
            if status not in {"offen", "prüfen", "geprüft", "klären", "freigegeben", "zur_zahlung", "bezahlt", "erledigt"}:
                return self.error_json("Unbekannter Status", HTTPStatus.BAD_REQUEST)
            with db() as con:
                create_document_version(con, document_id, "status.before", user["email"], tenant_id)
                extra = []
                params = [status, tone, due]
                if status == "geprüft":
                    extra.extend(["reviewed_by = ?", "reviewed_at = ?"])
                    params.extend([user["email"], now_ms()])
                if status == "freigegeben":
                    extra.extend(["approved_by = ?", "approved_at = ?"])
                    params.extend([user["email"], now_ms()])
                if status in {"zur_zahlung", "bezahlt"}:
                    extra.extend(["payment_released_by = ?", "payment_released_at = ?"])
                    params.extend([user["email"], now_ms()])
                params.extend([document_id, tenant_id])
                con.execute(
                    f"update documents set status = ?, tone = ?, due = ?{', ' + ', '.join(extra) if extra else ''} where id = ? and tenant_id = ?",
                    params,
                )
                create_document_version(con, document_id, "status.after", user["email"], tenant_id)
                audit(con, "document.update", f"{user['email']} · {document_id} · {status}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/documents/approval":
            if not self.require_permission(user, "document.update"):
                return
            payload = self.read_json()
            document_id = payload.get("id", "")
            action = payload.get("action", "")
            tenant_id = tenant_id_for(user)
            now = now_ms()
            actions = {
                "review": ("geprüft", "reviewed_by", "reviewed_at", "Prüfung"),
                "approve": ("freigegeben", "approved_by", "approved_at", "Freigabe"),
                "payment": ("zur_zahlung", "payment_released_by", "payment_released_at", "Zahlungsfreigabe"),
                "complete": ("erledigt", None, None, "Erledigung"),
            }
            if action not in actions:
                return self.error_json("Unbekannte Freigabeaktion", HTTPStatus.BAD_REQUEST)
            status, actor_column, at_column, note_kind = actions[action]
            with db() as con:
                doc = con.execute("select * from documents where id = ? and tenant_id = ?", (document_id, tenant_id)).fetchone()
                if not doc:
                    return self.error_json("Dokument nicht gefunden", HTTPStatus.NOT_FOUND)
                create_document_version(con, document_id, f"approval.{action}.before", user["email"], tenant_id)
                if actor_column:
                    con.execute(
                        f"update documents set status = ?, tone = ?, {actor_column} = ?, {at_column} = ? where id = ? and tenant_id = ?",
                        (status, "ok", user["email"], now, document_id, tenant_id),
                    )
                else:
                    con.execute(
                        "update documents set status = ?, tone = ? where id = ? and tenant_id = ?",
                        (status, "ok", document_id, tenant_id),
                    )
                four_eyes = "erfüllt" if action != "approve" or (doc["reviewed_by"] and doc["reviewed_by"] != user["email"]) else "offen"
                con.execute(
                    """
                    insert into document_notes (id, tenant_id, document_id, kind, body, actor, created_at)
                    values (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid.uuid4()), tenant_id, document_id, note_kind,
                        f"{note_kind} durch {user['email']} · Vier-Augen-Prüfung: {four_eyes}",
                        user["email"], now,
                    ),
                )
                create_document_version(con, document_id, f"approval.{action}.after", user["email"], tenant_id)
                audit(con, f"document.approval.{action}", f"{user['email']} · {doc['name']} · Vier-Augen {four_eyes}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/invoices/fields":
            if not self.require_permission(user, "document.update"):
                return
            payload = self.read_json()
            document_id = payload.get("id", "")
            tenant_id = tenant_id_for(user)
            now = now_ms()
            fields = {
                "invoice_number": clean_text(payload.get("invoice_number"), 80),
                "creditor": clean_text(payload.get("creditor"), 160),
                "iban": re.sub(r"\s+", "", clean_text(payload.get("iban"), 42)).upper(),
                "net_amount": normalize_money(payload.get("net_amount")),
                "tax_amount": normalize_money(payload.get("tax_amount")),
                "gross_amount": normalize_money(payload.get("gross_amount")),
                "tax_rate": normalize_rate(payload.get("tax_rate")),
                "invoice_date": clean_text(payload.get("invoice_date"), 20),
                "service_date": clean_text(payload.get("service_date"), 20),
                "booking_account": clean_text(payload.get("booking_account"), 40),
                "cost_center": clean_text(payload.get("cost_center"), 80),
                "payment_reference": clean_text(payload.get("payment_reference"), 180),
            }
            with db() as con:
                doc = con.execute("select * from documents where id = ? and tenant_id = ?", (document_id, tenant_id)).fetchone()
                if not doc:
                    return self.error_json("Dokument nicht gefunden", HTTPStatus.NOT_FOUND)
                create_document_version(con, document_id, "invoice.fields.before", user["email"], tenant_id)
                con.execute(
                    """
                    insert into invoice_fields
                    (document_id, tenant_id, invoice_number, creditor, iban, net_amount, tax_amount,
                     gross_amount, tax_rate, invoice_date, service_date, booking_account, cost_center,
                     payment_reference, verified_by, verified_at, updated_at)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    on conflict(document_id) do update set
                      invoice_number = excluded.invoice_number,
                      creditor = excluded.creditor,
                      iban = excluded.iban,
                      net_amount = excluded.net_amount,
                      tax_amount = excluded.tax_amount,
                      gross_amount = excluded.gross_amount,
                      tax_rate = excluded.tax_rate,
                      invoice_date = excluded.invoice_date,
                      service_date = excluded.service_date,
                      booking_account = excluded.booking_account,
                      cost_center = excluded.cost_center,
                      payment_reference = excluded.payment_reference,
                      verified_by = excluded.verified_by,
                      verified_at = excluded.verified_at,
                      updated_at = excluded.updated_at
                    """,
                    (
                        document_id, tenant_id, fields["invoice_number"], fields["creditor"], fields["iban"],
                        fields["net_amount"], fields["tax_amount"], fields["gross_amount"], fields["tax_rate"],
                        fields["invoice_date"], fields["service_date"], fields["booking_account"],
                        fields["cost_center"], fields["payment_reference"], user["email"], now, now,
                    ),
                )
                con.execute(
                    """
                    insert into document_notes (id, tenant_id, document_id, kind, body, actor, created_at)
                    values (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid.uuid4()), tenant_id, document_id, "Rechnungsdaten",
                        f"Rechnungsdaten geprüft: {fields['invoice_number'] or doc['name']} · Brutto {fields['gross_amount'] or 'offen'} · Konto {fields['booking_account'] or 'offen'}",
                        user["email"], now,
                    ),
                )
                create_document_version(con, document_id, "invoice.fields.after", user["email"], tenant_id)
                audit(con, "invoice.fields", f"{user['email']} · {doc['name']} · {fields['invoice_number']}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/invoice-rules":
            if not self.require_permission(user, "document.update"):
                return
            payload = self.read_json()
            tenant_id = tenant_id_for(user)
            keyword = clean_text(payload.get("keyword"), 80)
            booking_account = clean_text(payload.get("booking_account"), 60)
            if not keyword or not booking_account:
                return self.error_json("Stichwort und Buchungskonto erforderlich", HTTPStatus.BAD_REQUEST)
            rule_id = payload.get("id") or f"rule-{slugify(keyword)}-{str(uuid.uuid4())[:8]}"
            tax_rate = normalize_rate(payload.get("tax_rate")) or 19
            cost_center = clean_text(payload.get("cost_center"), 80)
            label = clean_text(payload.get("label"), 120) or keyword
            is_active = 1 if payload.get("is_active", True) else 0
            with db() as con:
                con.execute(
                    """
                    insert into invoice_booking_rules
                    (id, tenant_id, keyword, booking_account, tax_rate, cost_center, label, is_active, created_at, updated_at)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    on conflict(id) do update set
                      keyword = excluded.keyword,
                      booking_account = excluded.booking_account,
                      tax_rate = excluded.tax_rate,
                      cost_center = excluded.cost_center,
                      label = excluded.label,
                      is_active = excluded.is_active,
                      updated_at = excluded.updated_at
                    """,
                    (rule_id, tenant_id, keyword, booking_account, tax_rate, cost_center, label, is_active, now_ms(), now_ms()),
                )
                audit(con, "invoice.rule", f"{user['email']} · {keyword} → {booking_account}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/invoice-rules/delete":
            if not self.require_permission(user, "document.update"):
                return
            payload = self.read_json()
            rule_id = clean_text(payload.get("id"), 120)
            tenant_id = tenant_id_for(user)
            if not rule_id:
                return self.error_json("Regel fehlt", HTTPStatus.BAD_REQUEST)
            with db() as con:
                rule = con.execute("select * from invoice_booking_rules where id = ? and tenant_id = ?", (rule_id, tenant_id)).fetchone()
                if not rule:
                    return self.error_json("Regel nicht gefunden", HTTPStatus.NOT_FOUND)
                con.execute("delete from invoice_booking_rules where id = ? and tenant_id = ?", (rule_id, tenant_id))
                audit(con, "invoice.rule.delete", f"{user['email']} · {rule['keyword']} → {rule['booking_account']}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/documents/batch":
            if not self.require_permission(user, "document.update"):
                return
            payload = self.read_json()
            ids = [str(item) for item in payload.get("ids", []) if item]
            if not ids:
                return self.error_json("Keine Dokumente ausgewählt", HTTPStatus.BAD_REQUEST)
            ids = ids[:50]
            status = (payload.get("status") or "").strip()
            tone = (payload.get("tone") or "").strip()
            due = (payload.get("due") or "").strip()
            project_id = (payload.get("project_id") or "").strip()
            task_action = (payload.get("task_action") or "").strip()
            assignee_id = (payload.get("assignee_id") or "").strip()
            priority = (payload.get("priority") or "normal").strip()
            if status and status not in {"offen", "prüfen", "geprüft", "klären", "freigegeben", "zur_zahlung", "bezahlt", "erledigt", "archiviert"}:
                return self.error_json("Unbekannter Status", HTTPStatus.BAD_REQUEST)
            if tone and tone not in {"ok", "warn", "risk"}:
                return self.error_json("Unbekannte Bewertung", HTTPStatus.BAD_REQUEST)
            if task_action and task_action not in {"Prüfen", "Freigeben", "Klären", "Zahlen", "Archivieren"}:
                return self.error_json("Unbekannte Aufgabe", HTTPStatus.BAD_REQUEST)
            if priority not in {"kritisch", "hoch", "normal"}:
                return self.error_json("Unbekannte Priorität", HTTPStatus.BAD_REQUEST)
            tenant_id = tenant_id_for(user)
            updated = 0
            tasks_created = 0
            with db() as con:
                if project_id:
                    exists = con.execute("select id from projects where id = ? and tenant_id = ?", (project_id, tenant_id)).fetchone()
                    if not exists:
                        return self.error_json("Bauakte nicht gefunden", HTTPStatus.BAD_REQUEST)
                assignee = None
                if task_action:
                    assignee = con.execute(
                        "select id, name, email from users where id = ? and tenant_id = ? and is_active = 1",
                        (assignee_id, tenant_id),
                    ).fetchone()
                    if not assignee:
                        return self.error_json("Verantwortliche Person fehlt", HTTPStatus.BAD_REQUEST)
                for document_id in ids:
                    doc = con.execute("select * from documents where id = ? and tenant_id = ?", (document_id, tenant_id)).fetchone()
                    if not doc:
                        continue
                    create_document_version(con, document_id, "batch.before", user["email"], tenant_id)
                    next_project_id = project_id or doc["project_id"]
                    next_status = status or doc["status"]
                    next_tone = tone or doc["tone"]
                    next_due = due or doc["due"]
                    con.execute(
                        "update documents set project_id = ?, status = ?, tone = ?, due = ? where id = ? and tenant_id = ?",
                        (next_project_id, next_status, next_tone, next_due, document_id, tenant_id),
                    )
                    if task_action and assignee:
                        con.execute(
                            """
                            insert into document_tasks
                            (id, tenant_id, document_id, assignee_id, assignee_name, action, priority, due, note, status, created_by, created_at)
                            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (
                                str(uuid.uuid4()), tenant_id, document_id, assignee["id"], assignee["name"],
                                task_action, priority, next_due, "Aus Stapelverarbeitung im Eingangscenter", "offen", user["email"], now_ms()
                            ),
                        )
                        tasks_created += 1
                    create_document_version(con, document_id, "batch.after", user["email"], tenant_id)
                    updated += 1
                audit(con, "document.batch", f"{user['email']} · {updated} Dokument(e) · {tasks_created} Aufgabe(n)", tenant_id)
            state = get_state(user)
            state["batch_result"] = {"updated": updated, "tasks_created": tasks_created}
            return self.json(state)

        if parsed.path == "/api/documents/note":
            if not self.require_permission(user, "document.update"):
                return
            payload = self.read_json()
            document_id = payload.get("id", "")
            kind = (payload.get("kind") or "Prüfnotiz").strip()
            body = (payload.get("body") or "").strip()
            if kind not in {"Prüfnotiz", "Freigabe", "Rückfrage", "Ablehnung"}:
                return self.error_json("Unbekannter Notiztyp", HTTPStatus.BAD_REQUEST)
            if len(body) < 3:
                return self.error_json("Notiz zu kurz", HTTPStatus.BAD_REQUEST)
            tenant_id = tenant_id_for(user)
            with db() as con:
                doc = con.execute("select * from documents where id = ? and tenant_id = ?", (document_id, tenant_id)).fetchone()
                if not doc:
                    return self.error_json("Dokument nicht gefunden", HTTPStatus.NOT_FOUND)
                con.execute(
                    """
                    insert into document_notes (id, tenant_id, document_id, kind, body, actor, created_at)
                    values (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (str(uuid.uuid4()), tenant_id, document_id, kind, body, user["email"], now_ms()),
                )
                create_document_version(con, document_id, f"note.{kind.lower()}", user["email"], tenant_id)
                audit(con, "document.note", f"{user['email']} · {doc['name']} · {kind}", tenant_id)
            return self.json(get_state(user), status=HTTPStatus.CREATED)

        if parsed.path == "/api/documents/task":
            if not self.require_permission(user, "document.update"):
                return
            payload = self.read_json()
            document_id = payload.get("id", "")
            assignee_id = payload.get("assignee_id", "")
            action = (payload.get("action") or "Prüfen").strip()
            priority = (payload.get("priority") or "normal").strip()
            due = (payload.get("due") or "").strip()
            note = (payload.get("note") or "").strip()
            if action not in {"Prüfen", "Freigeben", "Klären", "Zahlen", "Archivieren"}:
                return self.error_json("Unbekannte Aufgabe", HTTPStatus.BAD_REQUEST)
            if priority not in {"kritisch", "hoch", "normal"}:
                return self.error_json("Unbekannte Priorität", HTTPStatus.BAD_REQUEST)
            tenant_id = tenant_id_for(user)
            with db() as con:
                doc = con.execute("select * from documents where id = ? and tenant_id = ?", (document_id, tenant_id)).fetchone()
                if not doc:
                    return self.error_json("Dokument nicht gefunden", HTTPStatus.NOT_FOUND)
                assignee = con.execute(
                    "select id, name, email from users where id = ? and tenant_id = ? and is_active = 1",
                    (assignee_id, tenant_id),
                ).fetchone()
                if not assignee:
                    return self.error_json("Verantwortliche Person nicht gefunden", HTTPStatus.BAD_REQUEST)
                con.execute(
                    """
                    insert into document_tasks
                    (id, tenant_id, document_id, assignee_id, assignee_name, action, priority, due, note, status, created_by, created_at)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid.uuid4()), tenant_id, document_id, assignee["id"],
                        assignee["name"], action, priority, due, note, "offen", user["email"], now_ms()
                    ),
                )
                create_document_version(con, document_id, f"task.{action.lower()}", user["email"], tenant_id)
                audit(con, "document.task", f"{user['email']} · {doc['name']} · {action} an {assignee['email']}", tenant_id)
            return self.json(get_state(user), status=HTTPStatus.CREATED)

        if parsed.path == "/api/documents/task/status":
            if not self.require_permission(user, "document.update"):
                return
            payload = self.read_json()
            task_id = payload.get("task_id", "")
            status = payload.get("status", "erledigt")
            if status not in {"offen", "erledigt"}:
                return self.error_json("Unbekannter Aufgabenstatus", HTTPStatus.BAD_REQUEST)
            tenant_id = tenant_id_for(user)
            with db() as con:
                task = con.execute("select * from document_tasks where id = ? and tenant_id = ?", (task_id, tenant_id)).fetchone()
                if not task:
                    return self.error_json("Aufgabe nicht gefunden", HTTPStatus.NOT_FOUND)
                con.execute(
                    "update document_tasks set status = ?, completed_at = ?, completed_by = ? where id = ? and tenant_id = ?",
                    (status, now_ms() if status == "erledigt" else None, user["email"] if status == "erledigt" else None, task_id, tenant_id),
                )
                create_document_version(con, task["document_id"], f"task.{status}", user["email"], tenant_id)
                audit(con, "document.task_status", f"{user['email']} · {task_id} · {status}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/documents/reprocess":
            if not self.require_permission(user, "document.update"):
                return
            payload = self.read_json()
            document_id = payload.get("id", "")
            tenant_id = tenant_id_for(user)
            with db() as con:
                doc = con.execute("select * from documents where id = ? and tenant_id = ?", (document_id, tenant_id)).fetchone()
                if not doc:
                    return self.error_json("Dokument nicht gefunden", HTTPStatus.NOT_FOUND)
                create_document_version(con, document_id, "ocr.queued", user["email"], tenant_id)
                enqueue_ocr_job(document_id, f"manuell durch {user['email']}", con, tenant_id)
                audit(con, "document.reprocess", f"{user['email']} · {doc['name']} · Warteschlange", tenant_id)
            start_ocr_worker()
            return self.json({**get_state(user), "queued": document_id})

        if parsed.path == "/api/documents/archive":
            if not self.require_permission(user, "document.archive"):
                return
            payload = self.read_json()
            document_id = payload.get("id", "")
            tenant_id = tenant_id_for(user)
            with db() as con:
                doc = con.execute("select * from documents where id = ? and tenant_id = ?", (document_id, tenant_id)).fetchone()
                if not doc:
                    return self.error_json("Dokument nicht gefunden", HTTPStatus.NOT_FOUND)
                create_document_version(con, document_id, "archive.before", user["email"], tenant_id)
                con.execute(
                    "update documents set archived_at = ?, archived_by = ? where id = ? and tenant_id = ?",
                    (now_ms(), user["email"], document_id, tenant_id),
                )
                create_document_version(con, document_id, "archive.after", user["email"], tenant_id)
                audit(con, "document.archive", f"{user['email']} · {doc['name']}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/documents/restore":
            if not self.require_permission(user, "document.restore"):
                return
            payload = self.read_json()
            document_id = payload.get("id", "")
            tenant_id = tenant_id_for(user)
            with db() as con:
                doc = con.execute("select * from documents where id = ? and tenant_id = ?", (document_id, tenant_id)).fetchone()
                if not doc:
                    return self.error_json("Dokument nicht gefunden", HTTPStatus.NOT_FOUND)
                create_document_version(con, document_id, "restore.before", user["email"], tenant_id)
                con.execute(
                    "update documents set archived_at = null, archived_by = null where id = ? and tenant_id = ?",
                    (document_id, tenant_id),
                )
                create_document_version(con, document_id, "restore.after", user["email"], tenant_id)
                audit(con, "document.restore", f"{user['email']} · {doc['name']}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/users/role":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            role = payload.get("role", "")
            if role not in PERMISSIONS:
                return self.error_json("Unbekannte Rolle", HTTPStatus.BAD_REQUEST)
            with db() as con:
                con.execute("update users set role = ? where id = ? and tenant_id = ?", (role, payload.get("id", ""), tenant_id_for(user)))
                audit(con, "user.role", f"{user['email']} · {payload.get('id', '')} · {role}", tenant_id_for(user))
            return self.json(get_state(user))

        if parsed.path == "/api/users/status":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            target_id = payload.get("id", "")
            is_active = 1 if payload.get("is_active") else 0
            tenant_id = tenant_id_for(user)
            if target_id == user["id"] and not is_active:
                return self.error_json("Eigener Zugang kann nicht deaktiviert werden", HTTPStatus.BAD_REQUEST)
            with db() as con:
                con.execute(
                    "update users set is_active = ? where id = ? and tenant_id = ?",
                    (is_active, target_id, tenant_id),
                )
                audit(con, "user.status", f"{user['email']} · {target_id} · {'aktiv' if is_active else 'gesperrt'}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/users/mfa":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            target_id = payload.get("id", "")
            enabled = 1 if payload.get("mfa_enabled") else 0
            tenant_id = tenant_id_for(user)
            with db() as con:
                target = con.execute("select email from users where id = ? and tenant_id = ?", (target_id, tenant_id)).fetchone()
                if not target:
                    return self.error_json("Benutzer nicht gefunden", HTTPStatus.NOT_FOUND)
                con.execute(
                    "update users set mfa_enabled = ? where id = ? and tenant_id = ?",
                    (enabled, target_id, tenant_id),
                )
                audit(con, "user.mfa", f"{user['email']} · {target['email']} · {'aktiv' if enabled else 'aus'}", tenant_id)
            return self.json(get_state(user))

        if parsed.path == "/api/users/reset-password":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            target_id = payload.get("id", "")
            new_password = payload.get("password") or generated_start_password()
            validation_error = validate_new_password(new_password)
            if validation_error:
                return self.error_json(validation_error, HTTPStatus.BAD_REQUEST)
            tenant_id = tenant_id_for(user)
            with db() as con:
                target = con.execute("select name, email from users where id = ? and tenant_id = ?", (target_id, tenant_id)).fetchone()
                if not target:
                    return self.error_json("Benutzer nicht gefunden", HTTPStatus.NOT_FOUND)
                con.execute(
                    "update users set password_hash = ? where id = ? and tenant_id = ?",
                    (password_hash(new_password), target_id, tenant_id),
                )
                queue_email(
                    con,
                    tenant_id,
                    target["email"],
                    "Neues Startpasswort für BauAkte KI",
                    f"Hallo {target['name']},\n\nIhr Passwort wurde zurückgesetzt.\n\nNeues Startpasswort: {new_password}\n\nBitte melden Sie sich an und ändern Sie das Passwort im nächsten Produktionsschritt.",
                    "password_reset",
                )
                audit(con, "user.password_reset", f"{user['email']} · {target['email']}", tenant_id)
            return self.json({**get_state(user), "initial_password": new_password})

        if parsed.path == "/api/users":
            if not self.require_permission(user, "user.manage"):
                return
            payload = self.read_json()
            role = payload.get("role", "Büro")
            if role not in PERMISSIONS:
                return self.error_json("Unbekannte Rolle", HTTPStatus.BAD_REQUEST)
            user_id = str(uuid.uuid4())
            initial_password = payload.get("password") or generated_start_password()
            validation_error = validate_new_password(initial_password)
            if validation_error:
                return self.error_json(validation_error, HTTPStatus.BAD_REQUEST)
            tenant_id = tenant_id_for(user)
            with db() as con:
                try:
                    con.execute(
                        "insert into users (id, tenant_id, name, email, role, password_hash, created_at) values (?, ?, ?, ?, ?, ?, ?)",
                        (
                            user_id,
                            tenant_id,
                            payload.get("name", "").strip(),
                            payload.get("email", "").strip().lower(),
                            role,
                            password_hash(initial_password),
                            now_ms(),
                        ),
                    )
                except sqlite3.IntegrityError:
                    return self.error_json("E-Mail existiert bereits", HTTPStatus.CONFLICT)
                queue_email(
                    con,
                    tenant_id,
                    payload.get("email", "").strip().lower(),
                    "Einladung zu BauAkte KI",
                    f"Hallo {payload.get('name', '').strip()},\n\nSie wurden zur BauAkte KI eingeladen.\n\nRolle: {role}\nStartpasswort: {initial_password}\n\nBitte melden Sie sich über die interne App-Adresse an.",
                    "invitation",
                )
                audit(con, "user.create", f"{user['email']} · {payload.get('email', '')} · {role}", tenant_id)
            return self.json({**get_state(user), "initial_password": initial_password}, status=HTTPStatus.CREATED)

        if parsed.path == "/api/chat":
            if not self.require_permission(user, "chat.ask"):
                return
            payload = self.read_json()
            question = payload.get("text", "").strip()
            tenant_id = tenant_id_for(user)
            answer = answer_from_sources(question, user)
            with db() as con:
                con.execute("insert into chat_messages (id, tenant_id, role, text, created_at) values (?, ?, ?, ?, ?)", (str(uuid.uuid4()), tenant_id, "user", question, now_ms()))
                con.execute("insert into chat_messages (id, tenant_id, role, text, created_at) values (?, ?, ?, ?, ?)", (str(uuid.uuid4()), tenant_id, "bot", answer, now_ms()))
                audit(con, "chat.ask", f"{user['email']} · {question}", tenant_id)
            return self.json(get_state(user), status=HTTPStatus.CREATED)

        if parsed.path == "/api/analyze":
            if not self.require_permission(user, "document.search"):
                return
            payload = self.read_json()
            filename = payload.get("filename", "Demo-Dokument.pdf")
            analysis = infer_document(filename, payload.get("text", ""))
            return self.json({"filename": filename, "analysis": analysis, "source": f"Quelle: {filename} · simulierte Analyse"})

        if parsed.path == "/api/upload":
            if not self.require_permission(user, "document.upload"):
                return
            content_type = self.headers.get("Content-Type", "")
            boundary_match = re.search(r"boundary=(.+)", content_type)
            if not boundary_match:
                return self.error_json("Multipart boundary fehlt", HTTPStatus.BAD_REQUEST)
            boundary = boundary_match.group(1).encode()
            fields, files = parse_multipart(self, boundary)
            project_id = fields.get("project_id") or "lindenweg"
            tenant_id = tenant_id_for(user)
            with db() as con:
                for file in files:
                    document_id = str(uuid.uuid4())
                    stored_name = f"{uuid.uuid4()}-{file['filename']}"
                    target = FILE_STORAGE.save(stored_name, file["content"])
                    content_preview = file["content"][:4000].decode("utf-8", "replace") if file["content"] else ""
                    inferred = infer_document(file["filename"], content_preview)
                    assigned_project_id, project_confidence = infer_project_id(con, tenant_id, file["filename"], content_preview, project_id)
                    analysis = {
                        "engine": "warteschlange",
                        **inferred,
                        "project_id": assigned_project_id,
                        "project_confidence": project_confidence,
                    }
                    con.execute(
                        """
                        insert into documents
                        (id, tenant_id, project_id, name, stored_name, mime, size, type, status, due, tone, confidence, source, ocr_text, ocr_engine, ocr_status, analysis_json, checksum_sha256, created_at)
                        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            document_id, tenant_id, assigned_project_id, file["filename"], stored_name,
                            mimetypes.guess_type(file["filename"])[0] or "application/octet-stream",
                            len(file["content"]), inferred["type"], inferred["status"], inferred["due"],
                            inferred["tone"], inferred["confidence"],
                            f"Quelle: {file['filename']} · Upload gespeichert unter uploads/{stored_name} · Bauakte-Vorschlag: {assigned_project_id} ({project_confidence}%)",
                            "OCR-Auftrag wurde angelegt. Der Volltext erscheint nach Abschluss der Warteschlange.",
                            "warteschlange",
                            "wartet",
                            json.dumps(analysis, ensure_ascii=False),
                            sha256_bytes(file["content"]),
                            now_ms()
                        ),
                    )
                    create_document_version(con, document_id, "upload.created", user["email"], tenant_id)
                    enqueue_ocr_job(document_id, f"Upload durch {user['email']}", con, tenant_id)
                    audit(con, "document.upload", f"{user['email']} · {file['filename']}", tenant_id)
            start_ocr_worker()
            return self.json(get_state(user), status=HTTPStatus.CREATED)

        return self.error_json("Route nicht gefunden", HTTPStatus.NOT_FOUND)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8") if length else "{}"
        return json.loads(raw or "{}")

    def static_file(self, path):
        path = Path(path).resolve()
        if not str(path).startswith(str(ROOT.resolve())) or not path.exists() or path.is_dir():
            return self.error_json("Datei nicht gefunden", HTTPStatus.NOT_FOUND)
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", f"{mime}; charset=utf-8" if mime.startswith("text/") or mime in ("application/javascript",) else mime)
        self.send_header("Content-Length", str(path.stat().st_size))
        self.end_headers()
        self.wfile.write(path.read_bytes())

    def json(self, payload, status=HTTPStatus.OK, filename=None, cookie=None):
        data = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def text(self, payload, content_type="text/plain; charset=utf-8", filename=None, status=HTTPStatus.OK):
        data = payload.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def error_json(self, message, status):
        return self.json({"error": message}, status=status)

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")


def main():
    init_db()
    start_escalation_scheduler()
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"BauAkte KI Server läuft auf http://127.0.0.1:{port}/")
    server.serve_forever()


if __name__ == "__main__":
    main()

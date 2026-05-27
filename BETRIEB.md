# BauAkte KI Betrieb

Lokaler Start:

```sh
python3 server.py
```

Demo-Zugang:

- E-Mail: `anna@schneider-sohn.example`
- Passwort: `demo2026`

Wichtige Pfade:

- Datenbank: `bauakte.db`
- Uploads: `uploads/`
- Backups: `backups/`

## Speicher-Konfiguration

Der lokale MVP läuft mit SQLite und lokalem Upload-Ordner. Die App zeigt diesen Status im Admin-Bereich unter `Produktionsspeicher`.

```sh
BAUAKTE_DB_DRIVER=sqlite
BAUAKTE_FILE_STORAGE=local
BAUAKTE_FILE_ENCRYPTION=local-dev
```

Für eine Verkaufsversion ist die Schnittstelle vorbereitet:

- `BAUAKTE_DB_DRIVER=postgres` für PostgreSQL-Anbindung.
- `BAUAKTE_FILE_STORAGE=s3` oder kompatibler Objektspeicher.
- `BAUAKTE_FILE_ENCRYPTION=kms` oder eigener Schlüsselservice.

Der aktuelle lokale Server blockiert absichtlich, wenn `BAUAKTE_DB_DRIVER` nicht `sqlite` ist. Damit wird verhindert, dass eine scheinbare Produktionskonfiguration ohne echten Datenbankadapter startet.

Nächste Produktionsschritte:

1. `APP_HOST`, `COOKIE_SECURE` und HTTPS korrekt setzen.
2. Passwort-Hashing bei Bedarf von PBKDF2 auf Argon2 oder bcrypt umstellen.
3. SQLite für SaaS-Betrieb durch PostgreSQL ersetzen.
4. Uploads in verschlüsselten Objektspeicher verschieben.
5. OCR-Engine konfigurieren.
6. KI-Engine mit Quellenprüfung anbinden.
7. Automatische Backups per Cron einrichten.

## Passwort-Sicherheit

Neue Passwörter werden mit eigenem Salt und PBKDF2-SHA256 gespeichert. Alte Demo-Hashes bleiben für bestehende lokale Daten kompatibel und werden nach erfolgreichem Login automatisch in das neue Format migriert.

```sh
BAUAKTE_PASSWORD_ITERATIONS=260000
```

Benutzer können ihr Passwort oben in der App über `Passwort ändern` selbst ändern. Neue Passwörter müssen mindestens 10 Zeichen haben und Buchstaben sowie Zahlen enthalten.

## Sitzungs-Sicherheit

Sitzungen laufen automatisch ab, Login-Fehlversuche werden gezählt und Benutzer werden nach mehreren falschen Versuchen vorübergehend gesperrt. Über `Passwort ändern` kann ein Benutzer zusätzlich `Alle Geräte abmelden` ausführen.

```sh
SESSION_HOURS=10
COOKIE_SECURE=true
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCK_MINUTES=15
```

Für lokalen HTTP-Betrieb bleibt `COOKIE_SECURE` ohne exportierte Umgebungsvariable deaktiviert. In der Verkaufsversion mit HTTPS sollte `COOKIE_SECURE=true` gesetzt werden.

## Mandanten und Lizenz

Im Admin-Bereich kann der aktuelle Mandant gepflegt werden: Firmenname, Tarif, Lizenzstatus, Sitzlimit, Rechnungsadresse und Datenregion. Alle Projekte, Dokumente, Fristen, Benutzer, Outbox-Einträge und Audit-Daten sind bereits über `tenant_id` getrennt.

Für die Verkaufsversion sind die nächsten Ausbauschritte:

1. Mandantenanlage durch Super-Admin oder Onboarding-Prozess.
2. Lizenzprüfung gegen Zahlungsanbieter oder Lizenzserver.
3. Harte Sitzlimit-Prüfung beim Anlegen neuer Benutzer.
4. Separate Datenräume je Mandant in PostgreSQL und Objektspeicher.

## E-Mail-Ausgang

Die App besitzt eine lokale Outbox für System-E-Mails. Dadurch lassen sich Einladungen, Passwort-Resets, Zwei-Faktor-Codes und Frist-Erinnerungen testen, ohne schon einen SMTP-Anbieter anzuschließen. Die Einträge erscheinen im Admin-Bereich unter `E-Mail-Ausgang`.

```sh
BAUAKTE_MAIL_DRIVER=outbox
BAUAKTE_MAIL_FROM="BauAkte KI <noreply@bauakte.local>"
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

Für eine Verkaufsversion wird `BAUAKTE_MAIL_DRIVER` durch einen echten SMTP- oder Microsoft-365-Adapter ersetzt. Die Outbox-Tabelle bleibt sinnvoll als Nachweis, Warteschlange und Fehlerprotokoll.

SMTP-Versand aktivieren:

```sh
BAUAKTE_MAIL_DRIVER=smtp
BAUAKTE_MAIL_FROM="BauAkte KI <noreply@deine-domain.de>"
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_TLS=true
SMTP_USER=noreply@deine-domain.de
SMTP_PASSWORD=app-passwort-oder-smtp-passwort
```

Danach Server neu starten und im Admin-Bereich `E-Mail-Ausgang senden` ausführen. Bei erfolgreicher Zustellung wechselt der Status auf `gesendet`; bei Problemen bleibt der Fehler im E-Mail-Protokoll sichtbar.

## OCR aktivieren

Die App erkennt lokal automatisch, ob OCR-Werkzeuge installiert sind:

- PDF-Text: `pdftotext`
- Bild-OCR: `tesseract`

Installation auf macOS:

```sh
brew install poppler tesseract tesseract-lang
```

Danach Server neu starten:

```sh
python3 server.py
```

Textdateien (`.txt`, `.csv`, `.md`) werden bereits ohne Zusatzwerkzeug echt extrahiert. PDFs und Bilder fallen ohne diese Tools auf die Simulation zurück, behalten aber denselben Datenfluss.

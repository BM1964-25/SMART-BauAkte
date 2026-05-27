# SMART BauAkte

SMART BauAkte ist ein lokaler Prototyp für einen professionellen Dokumentenmanager für Bau- und Handwerksbetriebe. Die Anwendung bündelt Bauakten, Dokumente, Rechnungen, Fristen, Aufgaben, E-Mail-Ablage, Freigaben, Audit-Protokoll, Mandantenverwaltung und KI-gestützte Dokumentenklassifizierung in einer Arbeitsoberfläche.

## Schnellstart aus GitHub

Voraussetzung: Python 3 ist installiert.

```sh
git clone https://github.com/BM1964-25/SMART-BauAkte.git
cd SMART-BauAkte
./start.sh
```

Danach im Browser öffnen:

```text
http://127.0.0.1:8000/
```

Demo-Zugang:

```text
E-Mail: anna@schneider-sohn.example
Passwort: demo2026
```

Beim Login wird ein Demo-MFA-Code angezeigt. Diesen Code in das MFA-Feld eintragen und anmelden.

## Was beim ersten Start passiert

Beim ersten Start erzeugt die App automatisch lokale Laufzeitdaten:

- `bauakte.db` als SQLite-Datenbank
- `uploads/` für hochgeladene Dokumente
- `backups/` für lokale Sicherungen

Diese Dateien werden absichtlich nicht in GitHub gespeichert. Sie enthalten Betriebsdaten, Uploads, Backups und später möglicherweise vertrauliche Kundendaten. Für einen sauberen Test aus GitHub erstellt die Anwendung deshalb selbst eine frische Demo-Datenbank mit Beispielprojekten, Dokumenten, Rechnungen, Fristen, E-Mail-Einträgen und Regeln.

## Demo zurücksetzen

Wenn die lokale Demo wieder im Ausgangszustand starten soll:

```sh
rm bauakte.db
./start.sh
```

Die Datenbank wird dann beim nächsten Start neu erzeugt.

## Wichtige Funktionen

- Bauakten für Projekte, Baustellen und Kunden
- Dokumentenablage mit Kategorien, Status, Fristen und Quellen
- Upload-Center mit OCR-/KI-Vorbereitung
- E-Mail-Eingang und E-Mail-Ausgang mit Vorlagen, Protokoll und SMTP-Vorbereitung
- Rechnungsmodul mit prüfbaren Rechnungsdaten
- Manuelle Korrektur von Rechnungsnummer, Kreditor, IBAN, Netto, Steuer, Brutto, Leistungsdatum und Buchungskonto
- Lernbare Buchungsregeln mit Treffer- und Konfliktanzeige
- Freigabeprozess für Prüfung, Zahlung und Abschluss
- Aufgaben, Notizen, Wiedervorlagen und Eskalationen
- Audit-Protokoll, Systemcheck, Backups und DSGVO-relevante Aufbewahrung
- Mandanten- und Lizenzdaten für eine spätere Verkaufsversion

## Beispiel-Upload

Im Ordner `sample-upload/` liegen Testdateien. Damit kann geprüft werden, wie Upload, OCR-Simulation, Klassifizierung, Rechnungsdaten und Bauaktenzuordnung zusammenspielen.

## Konfiguration

Die Datei `.env.example` zeigt die wichtigsten Einstellungen. Für lokale Tests ist keine eigene `.env` notwendig.

Für SMTP, Produktivspeicher, Cookie-Sicherheit oder spätere SaaS-Konfigurationen kann eine `.env` angelegt werden. Lokale Geheimnisse bleiben durch `.gitignore` aus GitHub heraus.

## Verkaufsversion

Der aktuelle Stand ist eine lokal testbare Profi-Demo. Für eine echte Verkaufsversion sind als nächste technische Ausbaustufen sinnvoll:

1. PostgreSQL statt SQLite für Mehrbenutzer- und SaaS-Betrieb.
2. Verschlüsselter Objektspeicher statt lokalem Upload-Ordner.
3. Echte OCR-Pipeline für PDF- und Bilddateien.
4. Angebundene KI mit Quellenprüfung, Datenschutzkonzept und Mandantentrennung.
5. Rollen- und Rechteprüfung je Aktion.
6. Automatische Backups mit Wiederherstellungstest.
7. Installationspaket, Cloud-Deployment oder gehostete SaaS-Variante.

Weitere Betriebsdetails stehen in [BETRIEB.md](BETRIEB.md).

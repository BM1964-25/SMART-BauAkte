# SMART BauAkte Demo-Testplan

Dieser Testplan ist für einen frischen GitHub-Clone gedacht.

## 1. App starten

```sh
./start.sh
```

Browser öffnen:

```text
http://127.0.0.1:8000/
```

## 2. Anmelden

Mit dem Demo-Zugang anmelden:

```text
anna@schneider-sohn.example
demo2026
```

Den angezeigten MFA-Code eintragen.

## 3. Dashboard prüfen

Im Dashboard kontrollieren:

- offene Fristen
- Dokumentenstatus
- Rechnungs- und Aufgabenhinweise
- Systemhinweise

Alternativ oben in der App `Demo führen` anklicken. Die App führt dann Schritt für Schritt durch Arbeitscockpit, Dokumenteneingang, Bauakte, Rechnungsprüfung und Produktreife.

## 4. Bauakten öffnen

Eine Baustelle öffnen, zum Beispiel `Mehrfamilienhaus Lindenweg`. Dort Dokumente, Fristen, Aufgaben und Notizen prüfen.

## 5. Dokument hochladen

Über den Upload-Bereich eine Datei aus `sample-upload/` hochladen. Danach prüfen, ob die App Kategorie, Projektbezug, Frist und Status vorbereitet.

## 6. Eingangscenter nutzen

Im Eingangscenter Dokumente stapelweise prüfen und übernehmen. Das ist der Arbeitsbereich für eingehende Büro- und Baustellendokumente.

## 7. Rechnung bearbeiten

In `Rechnungen` eine Rechnung öffnen und die erkannten Werte prüfen. Folgende Felder können manuell korrigiert werden:

- Rechnungsnummer
- Kreditor
- IBAN
- Netto
- Steuer
- Brutto
- Steuersatz
- Rechnungsdatum
- Leistungsdatum
- Buchungskonto
- Kostenstelle
- Verwendungszweck

## 8. Buchungsregel lernen

Bei einer korrigierten Rechnung eine Regel merken. Danach sieht man bei passenden Rechnungen Treffer, Beispiele und mögliche Konflikte.

## 9. E-Mail testen

Im E-Mail-Bereich den lokalen Ausgang prüfen. Ohne SMTP werden E-Mails in der lokalen Outbox gespeichert. Damit lassen sich Einladungen, MFA, Fristen und Systemnachrichten nachvollziehen.

## 10. Admin und Systemcheck prüfen

Im Admin-Bereich Systemcheck, Speicherstatus, Audit-Protokoll, Backup-Status, Mandantendaten, Lizenzdaten und E-Mail-Konfiguration prüfen.

## Erwartetes Ergebnis

Die App lässt sich aus GitHub starten, erzeugt selbst Demodaten und zeigt einen durchgängigen Arbeitsablauf vom Dokumenteingang bis zur geprüften Rechnung und Bauakte.

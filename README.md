# SchachNova

Neue Android-Schach-App, unabhängig vom bisherigen Schachprojekt.

## Entwicklungsplan
1. Klassisches Offline-Schach mit legalen Zügen, Uhr und Spielende.
2. Computergegner, Coach und Partieanalyse.
3. Weitere Schachvarianten.
4. Online-Partien, Einladung per Code/QR und ELO-Wertung.

## Releases und Backups
- Jede stabile Version erhält einen Git-Tag.
- APK, Quellcode und SHA-256-Prüfsummen werden bei Releases archiviert.
- Vor Änderungen bleibt die letzte stabile Version erhalten.
- Tests müssen vor der Freigabe erfolgreich sein.

Siehe [Backup-Regeln](docs/BACKUP_POLICY.md).

## Sicherheit
Keine Android-Signierschlüssel, Tokens oder Passwörter in diesem öffentlichen Repository speichern.

**Status:** Projektregeln vorhanden; noch keine spielbare Android-APK.


## Updates aus Verbesserungs-ZIP (2026-11-02)

- Moduswechsel ohne JavaScript-Shadowing-Fehler, auch für Varianten und Blindschach.
- Design-Einstellungen bleiben sichtbar, auch wenn der vorherige Spiel-Setup-Container verborgen wird.
- Sicherere WebView-Navigation, Android-Zurück mit Doppelbestätigung, bessere Touch-Fokusdarstellung.
- Android-Version 1.0.2 (versionCode 4); Tests in `scripts/run-tests.sh`.

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


## Lichess Neo Medienoptionen (1.0.3)

- Drei neue wählbare Brettgrafiken (Warm Wood, Neo Slate, Neo Brushed).
- Drei neue Figurenstile mit 12 Figuren (Warm Wood, Mochi, Mellow).
- Optionales Offline-Soundpaket mit 12 Effekten; Ausgangseinstellung bleibt lautlos.
- Statistischer Lichess-/Chess.com-Rating-Vergleich im Profil; **keine echte Online-Elo**.
- Vorherige SchachNova-Optik, Figuren, Modi und Nutzerdaten bleiben erhalten.
- Quellen und Lizenzen: [docs/THIRD_PARTY_ASSETS.md](docs/THIRD_PARTY_ASSETS.md).
- Neuer Regressionstest: `tests/neo-assets.test.cjs`; APK erst nach erfolgreichem CI als getestet kennzeichnen.


## Adaptives Eröffnungstraining (1.0.4)
- Wiederholungsplan für eigene Eröffnungszüge nach 1/3/7/14/30/60/120 Tagen (je nach Lernstand).
- Fehler und angeforderte Hinweise reduzieren den Lernfortschritt; korrekte Züge beim ersten Versuch verbessern ihn.
- Tägliches Ziel (5–50 Züge), Lernserie und fällige Aufgaben; lokale Speicherung ohne Konto.
- Favoriten als persönliches Repertoire, Eröffnungen nach fälligen Übungen priorisiert.
- Klassisches Spiel, Varianten, Coaches und bisherige Daten bleiben erhalten.
- Umsetzung inspiriert von [Lichess Neo](https://github.com/theophile-wallez/LichessNeo), MIT.

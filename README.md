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


## Koordinatentrainer (1.0.5)
- Zwei Offline-Modi: Lernen ohne Zeitdruck und 60-Sekunden-Challenge.
- Brett drehen, Koordinaten bei Bedarf einblenden, Treffer-/Fehlerzählung.
- Persönlicher 60-Sekunden-Bestwert wird lokal gespeichert, nur abgeschlossene Versuche zählen.
- Keine zusätzlichen Menüreiter: erreichbar über Training, Android-Zurück führt zum Training.

## Simultan-Verlässlichkeit (1.0.9)
- Simultan-Sitzung mit 5–20 Brettern lokal sichern und nach Neustart aus legalen Zügen wiederaufbauen.
- Fertige Bretter bleiben anklickbar; Bilanz aus Siegen, Niederlagen und Remis wird gezeigt.
- Brettwechsel optional deaktivierbar; Auswahl der Umwandlungsfigur über Tasten statt Texteingabe.
- Drei- und fünffache Stellungswiederholung, 50-/75-Züge-Regel sowie Materialremis im Simultan-Modus berücksichtigt.
- Ein gemeinsamer Stockfish-19-Worker bearbeitet Computerzüge aller Bretter nacheinander. Bei Engine-Ausfall schaltet der Simultan-Modus auf den ausgewiesenen lokalen Ersatzgegner um.
- Neue Regressionstests für Sitzungs-Wiederherstellung, beschädigte Speicherdaten und Engine-Warteschlange.
- **Wichtig:** Für die Nutzung der Stockfish-Engine muss die APK aus dem vollständigen GitHub-Actions-Build stammen, der die Engine-Dateien einbindet. Ein bestandener Quellcode-Test allein bestätigt nicht die Engine-Ausführung auf jedem Android-Gerät.

## Simultan-Leistung und Energiesparen (1.0.10)
- Die Simultan-Ansicht verwendet unveränderte Brettfelder und Brettkacheln wieder; sichtbare Inhalte werden selektiv aktualisiert, statt bei jedem Zug 64 neue Buttons anzulegen.
- Engine-Züge des aktuell gewählten Bretts können in der Warteschlange vorgezogen werden; weiterhin nur **ein** Stockfish-Worker gleichzeitig.
- Wenn die App in den Hintergrund wechselt oder der Simultan-Bildschirm geschlossen wird, werden Engine-Aufträge und Timers angehalten; beim Öffnen werden ausschließlich noch erforderliche Computerzüge neu gestartet.
- Ein ungenutzter Engine-Worker wird nach 15 Sekunden freigegeben, um Speicherressourcen zu schonen.
- Kein Vibrationsfeedback mehr für unsichtbare Bretter oder Hintergrundzüge.
- Veraltete asynchrone Antworten dürfen einen neu gestarteten Bot-Denkzustand nicht überschreiben.
- 20-Bretter-Stresstest, DOM-Reuse-Test und Lifecycle-Test in `tests/simultan-20-board.test.cjs` und `tests/simultan-performance.test.cjs`.
- **Messgrenze:** Die Tests bestätigen das Verhalten des Codes, nicht gemessene CPU-Last, FPS oder Akkulaufzeit auf realen Android-Geräten. Für eine solche Aussage sind Gerätemessungen notwendig.

# SchachNova 1.0.1 – Prüfung und Korrekturen

Ausgangspunkt: vom Nutzer bereitgestellte `SchachNova-verbessert.zip`, Archivstand 2026-11-01.

## Änderungen

- Stockfish 19: 14-Sekunden-Watchdog bei Initialisierung, Zugsuche und Analyse; fehlerhafte oder nicht reagierende Worker werden terminiert.
- Bei einem Engine-Ausfall wird ein lokaler, regelgeprüfter Ersatzgegner ausdrücklich als **Notfallmodus** angezeigt. Die Engine bleibt Standardgegner. Eine neue Partie versucht den regulären Engine-Start erneut.
- Fairy-Stockfish: Initialisierungsfehler des WASM-Workers werden unmittelbar erkannt, der kaputte Worker wird beendet. Der Notfallmodus wird auch in nachfolgenden Zügen beibehalten, statt bei unbereiter Engine stecken zu bleiben. Neue Partien versuchen Fairy erneut.
- Fairy-Suche speichert den tatsächlichen Startzeitpunkt für die gewünschte Zugverzögerung.
- Doppelter Coach-Handler im Bot-Transport entfernt; `live-coach.js` kontrolliert exklusiv den Coach. Computerzüge unterbrechen nicht mehr die Analyse des menschlichen Zugs.
- Der Eintrag zu Fünf-Schach ist jetzt als Variante mit lokalem Computergegner beschriftet; es wird **nicht** behauptet, dass dieser Gegner Fairy-Stockfish nutzt.
- APK-Version: `versionCode=3`, `versionName=1.0.1`; unveränderte `applicationId=at.schachnova.app`. Android-Updates erfordern dasselbe bisherige Signierzertifikat.
- Neuer Engine-Recovery-Test im Node.js-Testpaket.

## Tests

- Alle 17 Node.js-Testdateien aus `scripts/run-tests.sh` erfolgreich.
- JavaScript-Syntaxprüfung aller lokalen JS-Dateien in `app/src/main/assets` erfolgreich.
- Die neuen Tests simulieren den Standard-Stockfish-Ausfall, den Notfallzug, den erneuten Start nach einer neuen Partie, Fairy-WASM-Startfehler und die Fairy-UCI-Suche.

## Grenzen der Prüfung

- Kein Android-SDK/Gradle und keine Release-Signierschlüssel in der verfügbaren Laufzeit: es wurde **keine** APK gebaut oder signiert.
- Der App-Start auf einem echten Samsung- oder Android-Gerät, die WebView-Unterstützung der WASM-Binärdateien und das Zusammenspiel mit diesen Binärdateien konnten hier nicht praktisch geprüft werden.
- Die großen Stockfish- und Fairy-Stockfish-Binärdateien sind nicht Teil der ZIP. Die vorhandenen GitHub-Actions-Workflows laden sie beim Build und prüfen Lizenzdateien.
- Vor einem Release die CI-Builds (Debug und signierte Release) ausführen sowie Varianten, Zugregeln, Clock, Brettrotation, Coach und Update der alten installierten App auf dem Gerät testen.
- Das vorhandene GitHub-Repository `dmpcwien/SchachNova` hat bei mindestens `index.html` und `tests/variant-integration.test.cjs` einen anderen Dateistand als die hochgeladene ZIP. Daher nicht blind die ZIP über `main` entpacken oder das ganze Repository überschreiben: Änderungen anhand des mitgelieferten Patches sorgfältig zusammenführen.

## Build (mit vorhandenen GitHub-Workflows)

1. Änderungen mit der aktuellen `main`-Version zusammenführen, ohne andere Änderungen zu verwerfen.
2. GitHub Actions `Build SchachNova debug APK` zum Prüfen starten.
3. Für die updatefähige Release-APK müssen die vier vorhandenen Secrets `SCHACHNOVA_KEYSTORE_BASE64`, `SCHACHNOVA_STORE_PASSWORD`, `SCHACHNOVA_KEY_ALIAS` und `SCHACHNOVA_KEY_PASSWORD` korrekt auf den bisherigen Signierschlüssel zeigen.
4. GitHub Actions `Build SchachNova signed release APK` prüfen. Nur eine APK mit identischer Anwendungssignatur kann die bisher installierte Release-App ersetzen.

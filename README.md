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

**Status:** Android-App mit automatisierten Debug- und Release-Builds. Erfolgreiche GitHub Actions ersetzen keine Android-Geräteprüfung.


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

## Simultan-Leistungsprofile (1.0.11)
- Rechenzeit des gemeinsamen Stockfish-Workers in drei Profilen: **Sparsam**, **Ausgewogen** und **Stärker**. Das gewählte Profil ändert den pro Zug erlaubten Rechenaufwand, nicht die eingestellte Bot-Stärke (0–20).
- Sparsam: 120–280 ms Suchbudget pro Computerzug; Ausgewogen: 240–520 ms; Stärker: 420–980 ms. Das tatsächliche Laufzeitverhalten kann je nach Android-Gerät und Worker-Verzögerung abweichen.
- Die Engine nutzt auf ihrem Worker ein UCI-Hash-Limit von 16 MiB; weiterhin nur eine aktive Suche über alle Bretter.
- Neue Taste **Computer pausieren / fortsetzen**: Laufende und wartende Computerberechnungen werden gestoppt; nach Fortsetzung anhand des gesicherten Spielstands neu gestartet.
- Energieprofil und manuelle Pause werden in der bestehenden Simultan-Sitzung gespeichert; ältere gespeicherte Sitzungen laden kompatibel mit Standardeinstellung „Ausgewogen“.
- UI-Tasten mit mindestens 44 px Höhe, Regressionstests für Rechenzeitprofile und Pausenstatus.
- **Keine Behauptung einer bestimmten Akkueinsparung:** Das geringere Suchbudget ist im Code nachgewiesen, Akkumessungen müssen mit einer installierten APK auf einem echten Android-Gerät erfolgen.

## Simultan-Sicherungen, Schachuhren und Diagnose (1.0.12)

- Versioniertes JSON-Format; alte lokale v1-Sicherungen werden gelesen. Import prüft Zugfolge, 5–20 Bretter, 500 Halbzüge pro Brett, Dateigröße, Ergebnisse und Schachuhren, bevor Daten ersetzt werden.
- Native Android-Systemdateiauswahl für JSON-Sicherungsimport und Export, Wiederherstellung der vorherigen lokalen Sicherung.
- PGN-Export pro Brett und gesammelt für alle Bretter.
- Gegnerstärke zufällig pro Brett oder auf allen gleich; individuelle Stärke pro Brett bleibt einstellbar (0–20).
- Individuelle optionale Schachuhren mit Inkrement. Einstellungen vor dem ersten Zug, getrennte Zeiten für Weiß/Schwarz, Einfrieren im Hintergrund und bei Pause. Zeitüberschreitung beendet das Brett. Mehrere Bretter können gleichzeitig laufen.
- Auswertungsansicht: Ergebnisse, Gegnerstärke, Halbzüge, Trainingsvorschläge aus beobachtbaren Spielverläufen. **Keine vollständige Stockfish-Fehleranalyse**; taktische Muster sind Hinweise und keine bewiesenen Patzer.
- Kompakte, einklappbare Einstellungen und horizontal scrollbar angeordnete Tools für kleine Android-Bildschirme.
- Opt-in 10-Sekunden-Leistungsdiagnose für Bildraten-Callbacks und, soweit unterstützt, Android-Prozess-CPU-Zeit, Batteriestand und aktuellen Batteriestrom. **Keine verifizierte Akkulaufzeitmessung**; tatsächliche Vergleiche erfordern gleiche Bedingungen auf einem realen Gerät.
- Zusätzliche Tests in tests/simultan-session.test.cjs, tests/simultan-tools.test.cjs und bestehenden 20-Bretter-/Lifecycle-Tests.

## Simultan-Korrekturen und PGN-Metadaten (1.0.13)
- Ergebniskacheln zählen jetzt **alle** anerkannten Gewinnarten, insbesondere Siege und Niederlagen durch Zeitüberschreitung; die Bilanz stimmt mit der Sitzungsanalyse überein.
- Im manuell pausierten Simultan-Modus lassen sich keine Züge per Tippen, Ziehen oder durch noch offene Umwandlungsdialoge ausführen. So können Schachuhren und Inkremente während der Pause nicht unbeabsichtigt verändert werden.
- PGN-Dateien enthalten für Simultan-Partien die Brettnummer (Round), menschliche/Computer-Spielerfarben, ein vorhandenes Zeitkontroll-Tag und bei Zeitablauf den Beendigungsgrund. Klassische Einzelpartien behalten ihre bisherigen Standardfelder.
- PGN-Tag-Inhalte werden weiterhin maskiert und geprüft, um fehlerhafte Metadaten zu vermeiden.
- Neue Tests überprüfen Ergebnisse bei Matt und Zeitablauf, PGN-Metadaten sowie die Pausensperre zur Laufzeit.
- **Prüfgrenze:** GitHub Actions kontrolliert Syntax, Regressionen, Android-Build und Signatur. Bedienung und Akkulaufzeit bleiben auf einem echten Gerät zu prüfen.

## Simultan: Uhren und Engine-Warteschlange (1.0.14)
- Eine Zeitüberschreitung wird nun auch beim Pausieren oder Schließen korrekt als Ergebnis gespeichert, selbst wenn die letzte sichtbare Sekunde bereits vorüber ist.
- Bei Wiederaufnahme des Simultan-Modus werden Bretter mit aufgebrauchter Restzeit nicht erneut gestartet.
- Verliert das aktive Brett auf Zeit, kann der automatische Wechsel zum nächsten noch laufenden Brett erfolgen.
- Bei einem abgelaufenen Brett entfernt der gemeinsame Stockfish-Worker dessen wartende Engine-Aufträge aus der Warteschlange. Eine gerade laufende Suche wird per UCI-"stop" beendet; andere Bretter behalten ihre Aufträge.
- Pausierte Bretter zeigen ihren Zustand bereits in der Brettübersicht.
- Zusätzliche Regressionstests: `tests/simultan-expiry.test.cjs` und `tests/simultan-engine-cancel.test.cjs`. Die bestehenden Tests zu 20 Brettern, Datenwiederherstellung, Ergebnissen und Uhr bleiben erhalten.
- Die Tests prüfen Codepfade und simulierte Engine-Antworten. Reale Akkulaufzeit, Bildrate und Zuverlässigkeit unter mehrstündiger Last auf Android sind nicht gemessen.

## Coach-Gegner spielt wieder (1.0.15)
- In der Spielart **„Mit Coach gegen Computer“** spielt der Mensch Weiß, der Stockfish-Computergegner Schwarz. Der Live-Coach kommentiert parallel die Entscheidungen des Menschen; er ist nicht nur eine Anzeige ohne Gegnerzüge.
- Der Spielmodus setzt die Computerfarbe und den Coach-Modus **vor** dem Start/Reset einer Partie. Nach jedem eigenen Zug wird der Computergegner zusätzlich explizit zum Antworten angestoßen.
- Die UCI-Kommunikation für Computergegner **und** Live-Coach verarbeitet auch mehrzeilige Engine-Nachrichten mit Zeilenumbrüchen zuverlässig. Das behebt Start- und Bereitschaftsprobleme bei gebündelten Engine-Antworten.
- Während des Engine-Zugs zeigt die Oberfläche „Coach-Gegner überlegt · Stockfish offline“ an. Die Startauswahl beschreibt den Computergegner eindeutig.
- Schutz vor mehrfachen Suchaufträgen, solange der bereits berechnete Computerzug auf seine Anzeige wartet.
- Neuer Integrationstest `tests/live-coach-opponent.test.cjs`: simuliert eine echte Partie mit beiden Engine-Workern, prüft nach dem eigenen Zug den automatisch ausgeführten legalen Gegenzug und die separate Spielerzug-Analyse.
- Tests sind simulierte Offline-Engine-Abläufe. Die Android-Bedienung und realer Engine-Start auf einem Mobilgerät müssen zusätzlich geprüft werden.

## Coach: Farbwahl, ohne Zeit, automatische Züge (1.0.16)
- Der Coach-Modus bietet jetzt einen eigenen Farbwähler: Weiß (Spieler beginnt) oder Schwarz (Computer beginnt mit Weiß). Die Auswahl wird bei jedem Spielstart vor der Engine-Aktivierung übernommen.
- Die Anzeige richtet das Brett auf die eigene Farbe aus. Spielername, Figurenfarben und Schachuhr werden oben/unten passend zur aktuellen Brettausrichtung dargestellt – auch nach manuellem Drehen.
- Für Coach-Partien gilt beim Öffnen der Einstellungen standardmäßig „Ohne Zeit“; andere Zeitkontrollen lassen sich weiterhin manuell wählen. Bei unbegrenzter Zeit erscheint statt einer ablaufenden Uhr ein **∞**, und keine Partie endet wegen Zeitablauf.
- Der Live-Coach bewertet den menschlichen Zug erst nach dem Computerzug, damit zwei Stockfish-Worker nicht gleichzeitig die Android-Rechenleistung belasten. Der Coach kann so weiterhin Tipps nach einem Zug geben.
- Sollte der Computerzug trotz laufender Partie ausbleiben, wird nach begrenzter Wartezeit der regelkonforme lokale Ersatzgegner aktiviert. Normale Schachpartien ohne Coach behalten ihr bisheriges Zeit- und Engineverhalten.
- Stockfish-UCI-Ausgaben werden auch bei mehreren Zeilen pro Nachricht vollständig verarbeitet.
- Tests: `tests/coach-black-first.test.cjs` für automatischen ersten Weißzug und Notfallgegner; `tests/coach-colors-unlimited.test.cjs` für auswählbare Farben, Brett-/Uhrenzuordnung und unbegrenzte Zeit; aktualisierte Coach-Integration.
- **Einschränkung:** Simulierte Browser-/Engine-Tests ersetzen keine reale Prüfung der Android-Oberfläche und Speicherbelastung auf einem Smartphone.

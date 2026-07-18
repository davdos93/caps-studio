# CAPS Studio 0.9.0 Beta – Phase 5.4

## Testbibliothek, Golden Masters und automatische Regression

CAPS enthält jetzt zwölf feste Referenzfälle für häufige Familienthemen. Jeder Fall durchläuft automatisch:

1. psychologische Analyse und Buchplan
2. Story Treatment
3. vollständiges Manuskript
4. automatische Redaktion
5. Bilderbuchkomposition
6. Illustrationsdramaturgie
7. buchweite Konsistenzprüfung

Der Test vergleicht die aktuelle Ausgabe mit einem Golden Master und kontrolliert zusätzlich feste Qualitätsverträge. Eine Inhaltsänderung, eine verlorene Szene, eine verschobene Doppelseite, eine schwächere Qualitätskennzahl oder ein neuer Blocker führt zu einem fehlgeschlagenen Release Gate.

Im Repository steht außerdem `scripts/validate-release.js`. Es prüft JavaScript-Syntax, alle Engine-Tests, PDF, Druckvorstufe, Migrationen und die zwölf Golden Masters.

Build: `2026-07-17-0900-phase4`

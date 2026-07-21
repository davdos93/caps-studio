# Changelog

## [0.9.0-phase4.1] – 2026-07-18

- GitHub-Actions-Workflow `.github/workflows/quality-gate.yml`
- automatische Ausführung bei Push, Pull Request und manueller Anforderung
- Node.js 24
- `actions/checkout@v7`
- `actions/setup-node@v7`
- `actions/upload-artifact@v7`
- schreibgeschützte Repository-Berechtigung
- Abbruch veralteter paralleler Läufe
- GitHub-Job-Zusammenfassung
- Qualitätsberichte als 30-Tage-Artefakt
- Dependabot-Konfiguration für GitHub Actions
- Workflow-Vertrag in den lokalen Release-Validator aufgenommen

## [0.9.0-phase4] – 2026-07-17

- zwölf feste Referenzprojekte
- deterministische Manuskripterzeugung unabhängig von zufälligen IDs
- deterministische Golden-Master-Signaturen
- Qualitätsverträge für alle Produktionsstufen
- eigene Ansicht „Systemtests“
- Einzeltest und vollständiger Regressionstest
- Testprojekte können zur manuellen Prüfung geöffnet werden
- JSON-Regressionstestbericht
- lokaler und CI-fähiger Release-Validator
- automatischer GitHub-Quality-Gate-Workflow
- vorbereiteter GitHub-Pages- und Geräte-Smoke-Test nach dem Deployment

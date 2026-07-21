# CAPS Studio 0.9.0 Beta – Phase 5.4.1

[![CAPS Quality Gate](https://github.com/davdos93/caps-studio/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/davdos93/caps-studio/actions/workflows/quality-gate.yml)

## Automatisches GitHub Quality Gate

Der fehlende GitHub-Actions-Workflow ist jetzt enthalten. Bei jedem Push auf `main`, bei Pull Requests gegen `main` und bei manueller Ausführung prüft GitHub automatisch:

1. JavaScript-Syntax in `src`, `beta` und `stable`
2. zwölf Golden-Master-Referenzfälle
3. deterministische Ausgabe und Manipulationserkennung
4. buchweite Konsistenzprüfung
5. Produktionsworkflow und Versionsverlauf
6. PDF-Engine und Druckvorstufe
7. Anwendungsstart
8. den Workflow-Vertrag selbst

Der Workflow verwendet Node.js 24 und die aktuellen offiziellen Action-Hauptversionen. Nach dem Lauf steht unter **Actions → CAPS Quality Gate** eine Zusammenfassung bereit. Die Prüfberichte werden zusätzlich 30 Tage als Artefakt gespeichert.

Lokaler Aufruf:

```bash
node scripts/validate-release.js
```

Build: `2026-07-18-0900-phase4.1`

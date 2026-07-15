# Mitarbeit an CAPS Studio

## Entwicklungsprozess

Jede Änderung durchläuft:

1. Spezifikation
2. Entwicklung
3. internen Test
4. Beta
5. Stable-Freigabe

## Qualitätsregeln

- keine P0- oder P1-Fehler in Stable
- keine ungetesteten Kernfunktionen
- keine Speicherung großer Bilder in `localStorage`
- Bilder ausschließlich in IndexedDB
- alle Stable-Versionen müssen auf Chrome Desktop und Chrome iPhone geprüft werden
- jede Änderung erhält einen Eintrag im Changelog

## Commit-Nachrichten

Empfohlene Form:

```text
Typ: kurze Beschreibung
```

Beispiele:

```text
feat: Projektverwaltung ergänzt
fix: Bildspeicherung auf IndexedDB umgestellt
docs: Architekturhandbuch aktualisiert
test: Smoke-Test für Projektimport ergänzt
```

# CAPS Studio

CAPS Studio ist eine vollständig browserbasierte Produktionsumgebung für hochwertige KI-Kinderbücher.

## Aktueller Entwicklungsstand

**Sprint A.2.1 – CAPS Home / Guided Production**

Neu:

- zentrale CAPS-Home-Ansicht
- aktives Projekt und Produktionsreife
- eindeutige Karte „Nächster Schritt“
- Produktionsablauf als visuelle Timeline
- CAPS Coach
- letzte Aktivitäten
- erstes Health Center
- Quick Continue zur zuletzt bearbeiteten Seite
- mobile Browseroberfläche für Chrome auf dem Handy
- große Touchflächen und mobile Navigation

## Anwendung öffnen

1. ZIP vollständig entpacken.
2. `src/index.html` in Google Chrome öffnen.
3. Keine Installation erforderlich.

## Mobil

Die Oberfläche passt sich automatisch an kleine Bildschirme an. Für den mobilen Test kann Chrome DevTools oder ein echtes Smartphone verwendet werden.

## Datenhaltung

- Projektdaten: lokal im Browser
- Bilder: folgen in Sprint A.2.5 über IndexedDB
- Projektsicherung: `.caps.json`
- Projektbuch: PDF-Sprint


## GitHub Pages

Die Repository-Wurzel enthält eine Startseite für GitHub Pages.

- `/beta/` – aktuelle Testversion
- `/stable/` – zuletzt abgenommene Version

Veröffentlichungsquelle: `main` und `/ (root)`.

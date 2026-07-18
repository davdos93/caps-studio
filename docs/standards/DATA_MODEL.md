# CAPS-Datenmodell

## Projekt

- Projekt-ID
- Titel
- Thema
- Version
- Autor
- Status
- Erstellungsdatum
- Änderungsdatum

## Seite

- Seiten-ID
- Seitennummer
- Kategorie
- Szene
- Prompts
- Bildreferenz
- QA
- Status
- Änderungsverlauf

## Speicherung

- Projektdaten: IndexedDB oder kleine Metadaten in localStorage
- Bilder: ausschließlich IndexedDB
- Projekttransfer: `.caps` oder JSON-basierter Export
- Projektdokumentation: PDF-Projektbuch


## Layout schema 2.0

`layout.engine = narrative-layout` und `layout.spreads[]` enthalten Quellenblöcke, Seitenrolle, Rhythmuswerte, Umblätterstärke und Kompositionsmetadaten. Alte Layouts werden beim Öffnen über `CAPS_LayoutEngine.migrate()` in Schema 2.0 überführt.

# CAPS Studio 0.6.0 Beta

Dieses Paket enthält das vollständige Repository.

## Verbindliche Struktur

- `src/` – aktuelle Entwicklungsquelle 0.6.0 Beta
- `beta/` – veröffentlichte Beta 0.6.0, identisch mit `src/`
- `stable/` – zuletzt vollständig getestete Version
- `docs/` – Dokumentation
- `tests/` – Smoke-Tests
- `releases/` – Release-Unterlagen

## GitHub Pages

- Startseite: `/caps-studio/`
- Beta: `/caps-studio/beta/`
- Stable: `/caps-studio/stable/`

## Hinweis zum GitHub-Webupload

Der Webupload überschreibt gleichnamige Dateien, entfernt aber keine alten Dateien,
die in einem neuen Paket fehlen. Die aktiven Anwendungspfade `src/`, `beta/` und
`stable/` werden deshalb bei jedem Release vollständig mitgeliefert.

Die Beta-Website lädt ausschließlich Dateien innerhalb von `beta/`. Alte Dateien
außerhalb dieses Ordners können die Beta-Anwendung nicht beeinflussen.

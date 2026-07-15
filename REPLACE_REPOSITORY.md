# Repository mit CAPS Studio 0.6.1 aktualisieren

1. ZIP vollständig entpacken.
2. In GitHub `Add file → Upload files` öffnen.
3. Den gesamten Inhalt des entpackten Ordners hochladen.
4. Vorhandene Dateien überschreiben.
5. Commit-Nachricht:
   `release: CAPS Studio 0.6.1 Beta mit Cache-Buster`
6. Deployment abwarten.
7. Folgende Adresse öffnen:
   `/beta/VERSION.json`
8. Prüfen, dass dort steht:
   - `"version": "0.6.1"`
   - `"cacheBuster": "2026-07-15-061"`
9. Beta normal neu laden.

Die HTML-Dateien referenzieren CSS und JavaScript jetzt mit einer Build-Kennung,
zum Beispiel `app.css?v=2026-07-15-061`. Dadurch lädt der Browser bei jedem Release die
aktuellen Dateien.

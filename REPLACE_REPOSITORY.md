# Repository mit Version 0.6.0 aktualisieren

1. ZIP vollständig entpacken.
2. In GitHub `Add file → Upload files` öffnen.
3. Den gesamten Inhalt des entpackten Ordners hochladen.
4. Vorhandene Dateien überschreiben.
5. Commit-Nachricht:
   `release: CAPS Studio 0.6.0 Beta vollständiges Repository`
6. Deployment abwarten.
7. `/beta/VERSION.json` öffnen und Version `0.6.0` prüfen.
8. Beta im Inkognito-Fenster neu laden.

## Wichtig

Ein GitHub-Webupload kann alte Dateien nicht automatisch löschen. Das ist für diese
Struktur unproblematisch, weil die Beta ausschließlich aus dem vollständig
überschriebenen Ordner `beta/` geladen wird.

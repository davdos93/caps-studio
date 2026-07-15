(function () {
  "use strict";

  function createId(prefix) {
    const token = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return `${prefix}-${token}`;
  }

  function createPages(count) {
    return Array.from({ length: count }, (_, index) => ({
      id: createId("PAGE"),
      number: index + 1,
      title: `Seite ${index + 1}`,
      category: "unplanned",
      status: "planned",
      notes: "",
      sceneId: null,
      promptStatus: "open",
      imageAssetId: null,
      qaStatus: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  function createProject(input) {
    const now = new Date().toISOString();
    const pages = Math.max(1, Math.min(100, Number(input.pages) || 50));

    return {
      schemaVersion: "1.0",
      id: createId("CAPS"),
      title: String(input.title || "Unbenanntes Projekt").trim(),
      themeId: String(input.themeId || "dinosaurier"),
      themeName: String(input.themeName || "Dinosaurier"),
      audience: String(input.audience || "6–10 Jahre"),
      format: String(input.format || "DIN A4 Querformat"),
      style: String(input.style || "Premium detailreich"),
      status: "planning",
      version: 1,
      createdAt: now,
      updatedAt: now,
      pagesCount: pages,
      pagesData: createPages(pages),
      history: [{
        id: createId("HISTORY"),
        type: "project-created",
        text: "Projekt erstellt",
        createdAt: now
      }]
    };
  }

  function cloneProject(project) {
    const clone = JSON.parse(JSON.stringify(project));
    const now = new Date().toISOString();

    clone.id = createId("CAPS");
    clone.title = `${clone.title} – Kopie`;
    clone.version = 1;
    clone.createdAt = now;
    clone.updatedAt = now;
    clone.pagesData = clone.pagesData.map((page, index) => ({
      ...page,
      id: createId("PAGE"),
      number: index + 1,
      imageAssetId: null,
      createdAt: now,
      updatedAt: now
    }));
    clone.history = [{
      id: createId("HISTORY"),
      type: "project-duplicated",
      text: "Projekt dupliziert",
      createdAt: now
    }];

    return clone;
  }

  function renameProject(project, title) {
    const cleanTitle = String(title || "").trim();
    if (!cleanTitle) {
      throw new Error("Der Projekttitel darf nicht leer sein.");
    }

    const now = new Date().toISOString();

    return {
      ...project,
      title: cleanTitle,
      version: Number(project.version || 1) + 1,
      updatedAt: now,
      history: [
        ...(project.history || []),
        {
          id: createId("HISTORY"),
          type: "project-renamed",
          text: `Projekt umbenannt in „${cleanTitle}“`,
          createdAt: now
        }
      ]
    };
  }


  function updatePage(project, pageId, values) {
    const now = new Date().toISOString();
    let pageFound = false;

    const pagesData = project.pagesData.map(page => {
      if (page.id !== pageId) return page;
      pageFound = true;

      return {
        ...page,
        ...values,
        updatedAt: now
      };
    });

    if (!pageFound) {
      throw new Error("Die ausgewählte Seite wurde nicht gefunden.");
    }

    return {
      ...project,
      pagesData,
      version: Number(project.version || 1) + 1,
      updatedAt: now,
      history: [
        ...(project.history || []),
        {
          id: createId("HISTORY"),
          type: "page-updated",
          text: `Seite ${pagesData.find(page => page.id === pageId)?.number || ""} bearbeitet`,
          createdAt: now
        }
      ]
    };
  }

  function validateProject(project) {
    return Boolean(
      project &&
      typeof project === "object" &&
      typeof project.id === "string" &&
      typeof project.title === "string" &&
      Array.isArray(project.pagesData)
    );
  }

  window.CAPS_ProjectManager = {
    createProject,
    cloneProject,
    renameProject,
    updatePage,
    validateProject
  };
})();

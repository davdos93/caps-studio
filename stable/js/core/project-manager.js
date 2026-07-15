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
      lastOpenedAt: now,
      lastActivePageId: null,
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


  function touchProject(project, pageId) {
    const now = new Date().toISOString();
    return {
      ...project,
      lastOpenedAt: now,
      lastActivePageId: pageId || project.lastActivePageId || null
    };
  }

  function productionState(project) {
    const pages = project.pagesData || [];
    const total = Math.max(1, pages.length);
    const categorized = pages.filter(page => page.category && page.category !== "unplanned").length;
    const edited = pages.filter(page => page.notes || page.title !== `Seite ${page.number}`).length;
    const completed = pages.filter(page => page.status === "completed").length;

    const projectComplete = Boolean(project.title && project.themeId && project.audience && project.format);
    const storyboardProgress = Math.round((categorized / total) * 100);
    const editorialProgress = Math.round((edited / total) * 100);
    const completedProgress = Math.round((completed / total) * 100);

    const score = Math.round(
      (projectComplete ? 12 : 0) +
      storyboardProgress * 0.35 +
      editorialProgress * 0.18 +
      completedProgress * 0.10
    );

    let nextStep = {
      key: "storyboard",
      title: "Storyboard vorbereiten",
      text: "Öffne die Seiten und ordne ihnen Kategorien, Titel und Notizen zu.",
      action: "Projekt öffnen"
    };

    if (storyboardProgress >= 100) {
      nextStep = {
        key: "prompts",
        title: "Prompts erzeugen",
        text: "Das Storyboard ist vollständig. Die Prompt Engine folgt in einem späteren Sprint.",
        action: "Storyboard prüfen"
      };
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      projectComplete,
      storyboardProgress,
      editorialProgress,
      completedProgress,
      nextStep,
      stages: [
        { key: "project", label: "Projekt", done: projectComplete, current: !projectComplete },
        { key: "storyboard", label: "Storyboard", done: storyboardProgress >= 100, current: projectComplete && storyboardProgress < 100 },
        { key: "prompts", label: "Prompts", done: false, current: storyboardProgress >= 100 },
        { key: "images", label: "Bilder", done: false, current: false },
        { key: "qa", label: "QA", done: false, current: false },
        { key: "pdf", label: "Projektbuch", done: false, current: false },
        { key: "export", label: "Export", done: false, current: false }
      ]
    };
  }

  function healthState(project) {
    const supportsLocalStorage = (() => {
      try {
        const key = "__caps_test__";
        localStorage.setItem(key, "1");
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    })();

    return [
      { label: "Browser", status: "good", detail: navigator.userAgent.includes("Chrome") ? "Chrome erkannt" : "Browser verfügbar" },
      { label: "Lokale Speicherung", status: supportsLocalStorage ? "good" : "warn", detail: supportsLocalStorage ? "verfügbar" : "nicht verfügbar" },
      { label: "Projektmodell", status: project && Array.isArray(project.pagesData) ? "good" : "warn", detail: project ? "gültig" : "kein aktives Projekt" },
      { label: "Navigation", status: "good", detail: "verfügbar" },
      { label: "Scene Director", status: "off", detail: "noch nicht implementiert" },
      { label: "Prompt Engine", status: "off", detail: "noch nicht implementiert" },
      { label: "PDF Engine", status: "off", detail: "noch nicht implementiert" }
    ];
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
    touchProject,
    productionState,
    healthState,
    validateProject
  };
})();

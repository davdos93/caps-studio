(function () {
  "use strict";

  const Storage = window.CAPS_Storage;
  const Projects = window.CAPS_ProjectManager;
  const UI = window.CAPS_UI;

  let projectList = Storage.loadProjects();
  let currentView = "dashboard";
  let activeProjectId = null;
  let activePageId = null;

  function activeProject() {
    return projectList.find(project => project.id === activeProjectId) || null;
  }

  function activePage() {
    const project = activeProject();
    return project?.pagesData?.find(page => page.id === activePageId) || null;
  }

  function persist() {
    Storage.saveProjects(projectList);
  }

  function navigation(activeNavigation) {
    return `
      <nav class="nav">
        <div class="nav-item clickable ${activeNavigation === "projects" ? "active" : ""}">
          <button class="nav-button" id="navProjects">Projekte</button>
        </div>
        <div class="nav-item clickable ${activeNavigation === "project" ? "active" : ""}">
          <button class="nav-button" id="navProjectCore">Projektkern</button>
        </div>
        <div class="nav-item disabled">
          Scene Director <span class="coming-soon">Demnächst</span>
        </div>
        <div class="nav-item disabled">
          Prompts <span class="coming-soon">Demnächst</span>
        </div>
        <div class="nav-item disabled">
          Projektbuch <span class="coming-soon">PDF-Sprint</span>
        </div>
      </nav>
    `;
  }

  function shell(content, activeNavigation) {
    return `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-mark">C</div>
            <div>
              <strong>CAPS Studio</strong>
              <span>Sprint A.1.1</span>
            </div>
          </div>

          ${navigation(activeNavigation)}

          <div class="side-note">
            Vollständig im Browser.<br>
            Keine Installation.<br>
            Lokale Projektspeicherung.
          </div>
        </aside>

        <main class="main">${content}</main>
      </div>
    `;
  }

  function dashboardView() {
    const totalPages = projectList.reduce(
      (sum, project) => sum + Number(project.pagesCount || 0),
      0
    );

    const cards = projectList.length
      ? `<div class="project-grid">
          ${projectList.map(project => `
            <article class="project-card">
              <div class="project-cover">
                <strong>${UI.escapeHtml(project.themeName)}</strong>
                <span>${project.pagesCount} Seiten</span>
              </div>
              <div class="project-body">
                <h3>${UI.escapeHtml(project.title)}</h3>
                <div class="project-meta">
                  ${UI.escapeHtml(project.audience)} ·
                  ${UI.escapeHtml(project.format)} ·
                  Version ${project.version}
                </div>
                <div class="project-actions">
                  <button class="primary open-project" data-id="${project.id}">
                    Öffnen
                  </button>
                  <button class="secondary duplicate-project" data-id="${project.id}">
                    Duplizieren
                  </button>
                  <button class="danger delete-project" data-id="${project.id}">
                    Löschen
                  </button>
                </div>
              </div>
            </article>
          `).join("")}
        </div>`
      : `<div class="empty">
          <h2>Noch kein Projekt</h2>
          <p>Erstelle dein erstes CAPS-Buchprojekt.</p>
          <button class="primary" id="emptyCreateProject">Projekt erstellen</button>
        </div>`;

    return shell(`
      <header class="topbar">
        <div>
          <p class="eyebrow">SPRINT A.1.1</p>
          <h1>Projektverwaltung</h1>
          <p class="subtle">Projekt sichern, wiederherstellen und Seiten öffnen.</p>
        </div>

        <div class="actions">
          <button class="secondary" id="restoreProjectButton">
            Projekt wiederherstellen
          </button>
          <input hidden id="restoreProjectFile" type="file" accept=".json,.caps">
          <button class="primary" id="createProjectButton">Neues Projekt</button>
        </div>
      </header>

      <section class="stats">
        <div class="stat"><span>Projekte</span><strong>${projectList.length}</strong></div>
        <div class="stat"><span>Geplante Seiten</span><strong>${totalPages}</strong></div>
        <div class="stat"><span>Aktive Themes</span><strong>${new Set(projectList.map(project => project.themeId)).size}</strong></div>
        <div class="stat"><span>Speicherstatus</span><strong>lokal</strong></div>
      </section>

      <section class="panel">${cards}</section>
    `, "projects");
  }

  function createProjectView() {
    return shell(`
      <header class="topbar">
        <div>
          <button class="secondary" id="cancelCreateProject">Zurück</button>
          <h1>Neues Projekt</h1>
          <p class="subtle">Lege die grundlegenden Buchdaten fest.</p>
        </div>
      </header>

      <form class="panel" id="projectForm">
        <div class="form-grid">
          <label class="field wide">
            <span>Projekttitel</span>
            <input id="projectTitle" value="Dinosaurier Abenteuer" required>
          </label>

          <label class="field">
            <span>Thema</span>
            <select id="projectTheme">
              <option value="dinosaurier">Dinosaurier</option>
            </select>
          </label>

          <label class="field">
            <span>Zielgruppe</span>
            <select id="projectAudience">
              <option>4–6 Jahre</option>
              <option selected>6–10 Jahre</option>
              <option>8–12 Jahre</option>
            </select>
          </label>

          <label class="field">
            <span>Seitenzahl</span>
            <input id="projectPages" type="number" min="1" max="100" value="50">
          </label>

          <label class="field">
            <span>Format</span>
            <select id="projectFormat">
              <option selected>DIN A4 Querformat</option>
              <option>DIN A4 Hochformat</option>
            </select>
          </label>

          <label class="field wide">
            <span>Illustrationsstil</span>
            <select id="projectStyle">
              <option>Einfach</option>
              <option selected>Premium detailreich</option>
              <option>Sehr detailreich</option>
            </select>
          </label>
        </div>

        <div class="form-actions">
          <button type="button" class="secondary" id="cancelCreateProjectBottom">
            Abbrechen
          </button>
          <button class="primary">Projekt erstellen</button>
        </div>
      </form>
    `, "project");
  }

  function projectView() {
    const project = activeProject();

    if (!project) {
      currentView = "dashboard";
      return dashboardView();
    }

    return shell(`
      <header class="project-header">
        <div>
          <button class="secondary" id="backToDashboard">Dashboard</button>
          <p class="eyebrow">PROJEKT ${UI.escapeHtml(project.id.slice(0, 14))}</p>
          <h1>${UI.escapeHtml(project.title)}</h1>
          <p class="subtle">
            ${UI.escapeHtml(project.themeName)} ·
            ${UI.escapeHtml(project.audience)} ·
            ${UI.escapeHtml(project.format)}
          </p>
        </div>

        <div class="actions">
          <button class="secondary" id="renameProject">Umbenennen</button>
          <button class="secondary" id="backupProject">
            Projekt sichern (.caps.json)
          </button>
          <button
            class="secondary disabled-button"
            title="Wird im PDF-Sprint umgesetzt"
            disabled
          >
            Projektbuch als PDF
          </button>
        </div>
      </header>

      <div class="export-explanation">
        <div class="export-option">
          <strong>Projekt sichern (.caps.json)</strong>
          <span>
            Bearbeitbare Sicherung zum späteren Wiederherstellen in CAPS.
          </span>
        </div>
        <div class="export-option">
          <strong>Projektbuch als PDF</strong>
          <span>
            Buchähnliches Produktionsdokument. Umsetzung folgt im PDF-Sprint.
          </span>
        </div>
      </div>

      <section class="stats" style="margin-top:18px">
        <div class="stat"><span>Seiten</span><strong>${project.pagesCount}</strong></div>
        <div class="stat"><span>Version</span><strong>${project.version}</strong></div>
        <div class="stat"><span>Status</span><strong>${UI.escapeHtml(project.status)}</strong></div>
        <div class="stat"><span>Änderungen</span><strong>${project.history?.length || 0}</strong></div>
      </section>

      <section class="panel">
        <h2>Seiten</h2>
        <p class="subtle">
          Klicke auf eine Seite, um Titel, Kategorie, Status und Notizen zu bearbeiten.
        </p>

        <div class="page-list">
          ${project.pagesData.map(page => `
            <button
              class="page-card"
              data-page-id="${page.id}"
            >
              <strong>${UI.escapeHtml(page.title)}</strong>
              <span>Seite ${page.number}</span>
              <span>Kategorie: ${UI.escapeHtml(page.category)}</span>
              <span>Status: ${UI.escapeHtml(page.status)}</span>
            </button>
          `).join("")}
        </div>
      </section>
    `, "project");
  }

  function pageView() {
    const project = activeProject();
    const page = activePage();

    if (!project || !page) {
      currentView = "project";
      return projectView();
    }

    const completed = project.pagesData.filter(item => item.status === "completed").length;
    const inProgress = project.pagesData.filter(item => item.status === "in-progress").length;

    return shell(`
      <header class="project-header">
        <div>
          <button class="secondary" id="backToProject">Zurück zum Projekt</button>
          <p class="eyebrow">SEITE ${page.number} / ${project.pagesCount}</p>
          <h1>${UI.escapeHtml(page.title)}</h1>
          <p class="subtle">${UI.escapeHtml(project.title)}</p>
        </div>

        <div class="actions">
          <button class="secondary" id="previousPage">Vorherige Seite</button>
          <button class="secondary" id="nextPage">Nächste Seite</button>
        </div>
      </header>

      <div class="page-editor-grid">
        <form class="panel" id="pageForm">
          <h2>Seitendaten</h2>

          <div class="form-grid">
            <label class="field wide">
              <span>Seitentitel</span>
              <input id="pageTitle" value="${UI.escapeHtml(page.title)}" required>
            </label>

            <label class="field">
              <span>Kategorie</span>
              <select id="pageCategory">
                ${[
                  ["unplanned", "Noch nicht geplant"],
                  ["battle", "Kampf"],
                  ["peaceful", "Friedlich"],
                  ["adventure", "Abenteuer"],
                  ["air-water", "Luft/Wasser"],
                  ["special", "Spezialort"]
                ].map(([value, label]) => `
                  <option value="${value}" ${page.category === value ? "selected" : ""}>
                    ${label}
                  </option>
                `).join("")}
              </select>
            </label>

            <label class="field">
              <span>Status</span>
              <select id="pageStatus">
                ${[
                  ["planned", "Geplant"],
                  ["in-progress", "In Bearbeitung"],
                  ["completed", "Fertig"],
                  ["blocked", "Blockiert"]
                ].map(([value, label]) => `
                  <option value="${value}" ${page.status === value ? "selected" : ""}>
                    ${label}
                  </option>
                `).join("")}
              </select>
            </label>

            <label class="field wide">
              <span>Notizen</span>
              <textarea id="pageNotes" placeholder="Ideen, Änderungen oder Produktionshinweise">${UI.escapeHtml(page.notes || "")}</textarea>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="secondary" id="cancelPageEdit">
              Abbrechen
            </button>
            <button class="primary">Seite speichern</button>
          </div>
        </form>

        <aside class="panel page-editor-sidebar">
          <h2>Projektstatus</h2>
          <div class="page-status-list">
            <div><span>Seiten gesamt</span><strong>${project.pagesCount}</strong></div>
            <div><span>In Bearbeitung</span><strong>${inProgress}</strong></div>
            <div><span>Fertig</span><strong>${completed}</strong></div>
            <div><span>Projektversion</span><strong>${project.version}</strong></div>
          </div>

          <p class="subtle" style="margin-top:14px">
            Scene Director, Prompts, Bilder und QA werden in den nächsten Sprints ergänzt.
          </p>
        </aside>
      </div>
    `, "project");
  }

  function render() {
    const root = document.getElementById("app");

    if (currentView === "create") {
      root.innerHTML = createProjectView();
    } else if (currentView === "project") {
      root.innerHTML = projectView();
    } else if (currentView === "page") {
      root.innerHTML = pageView();
    } else {
      root.innerHTML = dashboardView();
    }

    bindEvents();
  }

  function goDashboard() {
    currentView = "dashboard";
    activePageId = null;
    render();
  }

  function goProject() {
    if (!activeProject()) {
      goDashboard();
      return;
    }
    currentView = "project";
    activePageId = null;
    render();
  }

  function bindEvents() {
    document.getElementById("navProjects")?.addEventListener("click", goDashboard);
    document.getElementById("navProjectCore")?.addEventListener("click", goProject);

    const create = () => {
      currentView = "create";
      activePageId = null;
      render();
    };

    document.getElementById("createProjectButton")?.addEventListener("click", create);
    document.getElementById("emptyCreateProject")?.addEventListener("click", create);

    const cancelCreate = () => {
      currentView = "dashboard";
      render();
    };

    document.getElementById("cancelCreateProject")?.addEventListener("click", cancelCreate);
    document.getElementById("cancelCreateProjectBottom")?.addEventListener("click", cancelCreate);

    document.getElementById("projectForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const project = Projects.createProject({
        title: document.getElementById("projectTitle").value,
        themeId: document.getElementById("projectTheme").value,
        themeName: "Dinosaurier",
        audience: document.getElementById("projectAudience").value,
        pages: document.getElementById("projectPages").value,
        format: document.getElementById("projectFormat").value,
        style: document.getElementById("projectStyle").value
      });

      projectList.unshift(project);
      persist();

      activeProjectId = project.id;
      currentView = "project";
      render();
      UI.toast("Projekt erstellt");
    });

    document.querySelectorAll(".open-project").forEach(button => {
      button.addEventListener("click", () => {
        activeProjectId = button.dataset.id;
        currentView = "project";
        activePageId = null;
        render();
      });
    });

    document.querySelectorAll(".duplicate-project").forEach(button => {
      button.addEventListener("click", () => {
        const original = projectList.find(project => project.id === button.dataset.id);
        if (!original) return;

        projectList.unshift(Projects.cloneProject(original));
        persist();
        render();
        UI.toast("Projekt dupliziert");
      });
    });

    document.querySelectorAll(".delete-project").forEach(button => {
      button.addEventListener("click", () => {
        const project = projectList.find(item => item.id === button.dataset.id);
        if (!project) return;

        if (!confirm(`Projekt „${project.title}“ wirklich löschen?`)) {
          return;
        }

        projectList = projectList.filter(item => item.id !== project.id);
        persist();
        render();
        UI.toast("Projekt gelöscht");
      });
    });

    document.getElementById("backToDashboard")?.addEventListener("click", goDashboard);

    document.getElementById("renameProject")?.addEventListener("click", () => {
      const project = activeProject();
      if (!project) return;

      const title = prompt("Neuer Projekttitel:", project.title);
      if (title === null) return;

      try {
        const updated = Projects.renameProject(project, title);
        projectList = projectList.map(item => item.id === updated.id ? updated : item);
        persist();
        render();
        UI.toast("Projekt umbenannt");
      } catch (error) {
        alert(error.message);
      }
    });

    document.getElementById("backupProject")?.addEventListener("click", () => {
      const project = activeProject();
      if (!project) return;

      const filename = `${project.title.replace(/[^a-z0-9äöüß]+/gi, "_")}.caps.json`;

      UI.downloadFile(
        filename,
        JSON.stringify(project, null, 2),
        "application/json"
      );

      UI.toast("Projektsicherung erstellt");
    });

    document.getElementById("restoreProjectButton")?.addEventListener("click", () => {
      document.getElementById("restoreProjectFile")?.click();
    });

    document.getElementById("restoreProjectFile")?.addEventListener("change", event => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const project = JSON.parse(reader.result);

          if (!Projects.validateProject(project)) {
            throw new Error("Ungültiges CAPS-Projektformat.");
          }

          const imported = Projects.cloneProject(project);
          imported.title = `${project.title} – Wiederhergestellt`;

          projectList.unshift(imported);
          persist();
          render();
          UI.toast("Projekt wiederhergestellt");
        } catch (error) {
          alert(`Wiederherstellung fehlgeschlagen: ${error.message}`);
        }
      };

      reader.readAsText(file);
      event.target.value = "";
    });

    document.querySelectorAll("[data-page-id]").forEach(button => {
      button.addEventListener("click", () => {
        activePageId = button.dataset.pageId;
        currentView = "page";
        render();
      });
    });

    document.getElementById("backToProject")?.addEventListener("click", goProject);
    document.getElementById("cancelPageEdit")?.addEventListener("click", goProject);

    document.getElementById("pageForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const project = activeProject();
      const page = activePage();
      if (!project || !page) return;

      const updated = Projects.updatePage(project, page.id, {
        title: document.getElementById("pageTitle").value.trim(),
        category: document.getElementById("pageCategory").value,
        status: document.getElementById("pageStatus").value,
        notes: document.getElementById("pageNotes").value
      });

      projectList = projectList.map(item => item.id === updated.id ? updated : item);
      persist();
      render();
      UI.toast("Seite gespeichert");
    });

    const movePage = direction => {
      const project = activeProject();
      const page = activePage();
      if (!project || !page) return;

      const index = project.pagesData.findIndex(item => item.id === page.id);
      const targetIndex = Math.max(
        0,
        Math.min(project.pagesData.length - 1, index + direction)
      );

      activePageId = project.pagesData[targetIndex].id;
      currentView = "page";
      render();
    };

    document.getElementById("previousPage")?.addEventListener("click", () => movePage(-1));
    document.getElementById("nextPage")?.addEventListener("click", () => movePage(1));
  }

  window.CAPS = {
    name: "CAPS Studio",
    version: "5.1.0-a1.1",
    sprint: "A.1.1"
  };

  render();
})();
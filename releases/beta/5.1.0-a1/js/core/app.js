(function () {
  "use strict";

  const Storage = window.CAPS_Storage;
  const Projects = window.CAPS_ProjectManager;
  const UI = window.CAPS_UI;

  let projectList = Storage.loadProjects();
  let currentView = "dashboard";
  let activeProjectId = null;

  function activeProject() {
    return projectList.find(project => project.id === activeProjectId) || null;
  }

  function persist() {
    Storage.saveProjects(projectList);
  }

  function shell(content, activeNavigation) {
    return `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-mark">C</div>
            <div>
              <strong>CAPS Studio</strong>
              <span>Sprint A.1</span>
            </div>
          </div>

          <nav class="nav">
            <div class="nav-item ${activeNavigation === "projects" ? "active" : ""}">
              Projekte
            </div>
            <div class="nav-item ${activeNavigation === "project" ? "active" : ""}">
              Projektkern
            </div>
            <div class="nav-item">Scene Director</div>
            <div class="nav-item">Prompts</div>
            <div class="nav-item">Projektbuch</div>
          </nav>

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
          <p class="eyebrow">SPRINT A.1</p>
          <h1>Projektverwaltung</h1>
          <p class="subtle">Stabiler Projektkern für CAPS Studio.</p>
        </div>

        <div class="actions">
          <button class="secondary" id="importProjectButton">Projekt importieren</button>
          <input hidden id="importProjectFile" type="file" accept=".json,.caps">
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
          <button class="secondary" id="exportProject">Projekt exportieren</button>
        </div>
      </header>

      <div class="notice">
        Sprint A.1 enthält den stabilen Projektkern. Scene Director, Prompts,
        Bilder und PDF-Projektbuch werden in den nächsten Sprints ergänzt.
      </div>

      <section class="stats">
        <div class="stat"><span>Seiten</span><strong>${project.pagesCount}</strong></div>
        <div class="stat"><span>Version</span><strong>${project.version}</strong></div>
        <div class="stat"><span>Status</span><strong>${UI.escapeHtml(project.status)}</strong></div>
        <div class="stat"><span>Änderungen</span><strong>${project.history?.length || 0}</strong></div>
      </section>

      <section class="panel">
        <h2>Seiten-Grundgerüst</h2>
        <p class="subtle">
          Die Seiten besitzen bereits eindeutige IDs und Statusfelder.
        </p>

        <div class="page-list">
          ${project.pagesData.map(page => `
            <article class="page-card">
              <strong>Seite ${page.number}</strong>
              <span>${UI.escapeHtml(page.id.slice(0, 18))}</span>
              <span>Status: ${UI.escapeHtml(page.status)}</span>
            </article>
          `).join("")}
        </div>
      </section>
    `, "project");
  }

  function render() {
    const root = document.getElementById("app");

    if (currentView === "create") {
      root.innerHTML = createProjectView();
    } else if (currentView === "project") {
      root.innerHTML = projectView();
    } else {
      root.innerHTML = dashboardView();
    }

    bindEvents();
  }

  function bindEvents() {
    const create = () => {
      currentView = "create";
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

    document.getElementById("backToDashboard")?.addEventListener("click", () => {
      currentView = "dashboard";
      render();
    });

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

    document.getElementById("exportProject")?.addEventListener("click", () => {
      const project = activeProject();
      if (!project) return;

      const filename = `${project.title.replace(/[^a-z0-9äöüß]+/gi, "_")}.caps.json`;

      UI.downloadFile(
        filename,
        JSON.stringify(project, null, 2),
        "application/json"
      );

      UI.toast("Projekt exportiert");
    });

    document.getElementById("importProjectButton")?.addEventListener("click", () => {
      document.getElementById("importProjectFile")?.click();
    });

    document.getElementById("importProjectFile")?.addEventListener("change", event => {
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
          imported.title = `${project.title} – Import`;

          projectList.unshift(imported);
          persist();
          render();
          UI.toast("Projekt importiert");
        } catch (error) {
          alert(`Import fehlgeschlagen: ${error.message}`);
        }
      };

      reader.readAsText(file);
      event.target.value = "";
    });
  }

  window.CAPS = {
    name: "CAPS Studio",
    version: "5.1.0-a1",
    sprint: "A.1"
  };

  render();
})();

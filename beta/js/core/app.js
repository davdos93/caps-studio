(function(){
  "use strict";

  const Storage=window.CAPS_Storage;
  const Projects=window.CAPS_ProjectManager;
  const UI=window.CAPS_UI;

  let projectList=Storage.loadProjects();
  let currentView="home";
  let activeProjectId=localStorage.getItem("caps-active-project-id")||projectList[0]?.id||null;
  let activePageId=null;

  function activeProject(){
    return projectList.find(project=>project.id===activeProjectId)||null;
  }

  function activePage(){
    const project=activeProject();
    return project?.pagesData?.find(page=>page.id===activePageId)||null;
  }

  function persist(){
    Storage.saveProjects(projectList);
    if(activeProjectId)localStorage.setItem("caps-active-project-id",activeProjectId);
  }

  function patchActiveProject(updated){
    projectList=projectList.map(project=>project.id===updated.id?updated:project);
    persist();
  }

  function navigation(active){
    return `<nav class="nav">
      <div class="nav-item clickable ${active==="home"?"active":""}"><button class="nav-button" id="navHome">CAPS Home</button></div>
      <div class="nav-item clickable ${active==="projects"?"active":""}"><button class="nav-button" id="navProjects">Projekte</button></div>
      <div class="nav-item clickable ${active==="project"?"active":""}"><button class="nav-button" id="navProject">Projektkern</button></div>
      <div class="nav-item disabled">Scene Director <span class="coming-soon">Demnächst</span></div>
      <div class="nav-item disabled">Prompts <span class="coming-soon">Demnächst</span></div>
      <div class="nav-item disabled">Projektbuch <span class="coming-soon">PDF-Sprint</span></div>
    </nav>`;
  }

  function mobileNav(active){
    return `<nav class="mobile-bottom-nav">
      <button id="mobileHome" class="${active==="home"?"active":""}"><strong>⌂</strong><span>Home</span></button>
      <button id="mobileProjects" class="${active==="projects"?"active":""}"><strong>▦</strong><span>Projekte</span></button>
      <button id="mobileProject" class="${active==="project"?"active":""}"><strong>▤</strong><span>Projekt</span></button>
      <button id="mobileHealth"><strong>✓</strong><span>System</span></button>
    </nav>`;
  }

  function shell(content,active){
    return `<div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">C</div><div><strong>CAPS Studio</strong><span>Guided Production</span></div></div>
        ${navigation(active)}
        <div class="side-note">Desktop & mobiler Browser.<br>Keine Installation.<br>Lokale Speicherung.</div>
      </aside>
      <main class="main">${content}</main>
      ${mobileNav(active)}
    </div>`;
  }

  function homeView(){
    const project=activeProject();

    if(!project){
      return shell(`
        <header class="topbar">
          <div><p class="eyebrow">CAPS HOME</p><h1>Willkommen bei CAPS</h1><p class="subtle">Ich begleite dich Schritt für Schritt zu deinem ersten Buch.</p></div>
          <button class="secondary" id="openHealth">System prüfen</button>
        </header>
        <section class="next-step-card">
          <p class="next-step-label">DEIN ERSTER SCHRITT</p>
          <h2>Ein Buchprojekt erstellen</h2>
          <p>Lege Titel, Thema, Zielgruppe, Format und Seitenzahl fest.</p>
          <button class="primary" id="homeCreateProject">Mein erstes Buch erstellen</button>
        </section>
      `,"home");
    }

    const state=Projects.productionState(project);
    const history=[...(project.history||[])].slice(-5).reverse();
    const lastPage=project.pagesData.find(page=>page.id===project.lastActivePageId);

    return shell(`
      <header class="topbar">
        <div><p class="eyebrow">CAPS HOME</p><h1>Willkommen zurück</h1><p class="subtle">Deine Produktionszentrale zeigt dir den nächsten sinnvollen Schritt.</p></div>
        <button class="secondary" id="openHealth">System prüfen</button>
      </header>

      <div class="home-grid">
        <div>
          <section class="hero-card">
            <div class="hero-top">
              <div><p class="eyebrow" style="color:#9bb7f6">AKTIVES PROJEKT</p><div class="hero-project"><h2>${UI.escapeHtml(project.title)}</h2><p class="subtle">${UI.escapeHtml(project.themeName)} · ${project.pagesCount} Seiten</p></div></div>
              <button class="health-button" id="heroHealth">● Systemstatus</button>
            </div>

            <div class="score-row">
              <div><div class="score-number">${state.score}%</div><div class="score-label">Produktionsreife</div></div>
              <div class="subtle">${state.storyboardProgress}% Storyboard</div>
            </div>
            <div class="progress"><span style="width:${state.score}%"></span></div>

            ${lastPage?`<div class="quick-continue"><strong>Zuletzt bearbeitet: Seite ${lastPage.number}</strong><span>${UI.escapeHtml(lastPage.title)}</span><button class="secondary" id="quickContinue">Dort weiterarbeiten</button></div>`:""}
          </section>

          <section class="next-step-card">
            <p class="next-step-label">NÄCHSTER SCHRITT</p>
            <h2>${UI.escapeHtml(state.nextStep.title)}</h2>
            <p>${UI.escapeHtml(state.nextStep.text)}</p>
            <button class="primary" id="nextStepButton">${UI.escapeHtml(state.nextStep.action)}</button>
          </section>

          <section class="panel" style="margin-top:16px">
            <h2>Produktionsablauf</h2>
            <p class="subtle">Du arbeitest Schritt für Schritt bis zum fertigen Projektbuch.</p>
            <div class="timeline">
              ${state.stages.map(stage=>`<div class="timeline-step ${stage.done?"done":stage.current?"current":"locked"}"><span>${stage.done?"✓":stage.current?"●":"○"}</span><strong>${stage.label}</strong></div>`).join("")}
            </div>
          </section>
        </div>

        <div>
          <section class="coach-card">
            <strong>CAPS Coach</strong>
            <p>${state.storyboardProgress===0
              ?"Beginne mit den ersten Seiten. Vergib Titel, Kategorie und Notizen. So entsteht Schritt für Schritt dein Storyboard."
              :state.storyboardProgress<100
              ?`Du hast bereits ${state.storyboardProgress}% des Storyboards kategorisiert. Arbeite als Nächstes an den noch offenen Seiten.`
              :"Dein Storyboard ist vollständig vorbereitet. Im nächsten Sprint folgt die automatische Szenenplanung."}</p>
          </section>

          <section class="panel" style="margin-top:16px">
            <h2>Letzte Aktivitäten</h2>
            <div class="activity-list">
              ${history.length?history.map(item=>`<div class="activity-item"><span>${UI.escapeHtml(item.text)}</span><span>${new Date(item.createdAt).toLocaleDateString("de-DE")}</span></div>`).join(""):'<p class="subtle">Noch keine Aktivitäten.</p>'}
            </div>
          </section>

          <section class="panel" style="margin-top:16px">
            <h2>Projektstatus</h2>
            <div class="project-list">
              <div class="project-row"><span>Projekt</span><span>${state.projectComplete?"vollständig":"offen"}</span></div>
              <div class="project-row"><span>Storyboard</span><span>${state.storyboardProgress}%</span></div>
              <div class="project-row"><span>Bearbeitete Seiten</span><span>${state.editorialProgress}%</span></div>
              <div class="project-row"><span>Fertige Seiten</span><span>${state.completedProgress}%</span></div>
            </div>
          </section>
        </div>
      </div>

      <div class="mobile-next-bar"><button class="primary" id="mobileNextStep">${UI.escapeHtml(state.nextStep.action)}</button></div>
    `,"home");
  }

  function projectsView(){
    const totalPages=projectList.reduce((sum,p)=>sum+Number(p.pagesCount||0),0);
    const cards=projectList.length?`<div class="project-grid">${projectList.map(project=>`
      <article class="project-card">
        <div class="project-cover"><strong>${UI.escapeHtml(project.themeName)}</strong><span>${project.pagesCount} Seiten</span></div>
        <div class="project-body">
          <h3>${UI.escapeHtml(project.title)}</h3>
          <div class="project-meta">${UI.escapeHtml(project.audience)} · ${UI.escapeHtml(project.format)} · Version ${project.version}</div>
          <div class="project-actions">
            <button class="primary open-project" data-id="${project.id}">Öffnen</button>
            <button class="secondary set-active-project" data-id="${project.id}">Als aktiv setzen</button>
            <button class="secondary duplicate-project" data-id="${project.id}">Duplizieren</button>
            <button class="danger delete-project" data-id="${project.id}">Löschen</button>
          </div>
        </div>
      </article>`).join("")}</div>`:
      `<div class="empty"><h2>Noch kein Projekt</h2><button class="primary" id="emptyCreateProject">Projekt erstellen</button></div>`;

    return shell(`
      <header class="topbar">
        <div><p class="eyebrow">PROJEKTE</p><h1>Projektverwaltung</h1><p class="subtle">Alle Buchprojekte an einem Ort.</p></div>
        <div class="actions"><button class="secondary" id="restoreProjectButton">Projekt wiederherstellen</button><input hidden id="restoreProjectFile" type="file" accept=".json,.caps"><button class="primary" id="createProjectButton">Neues Projekt</button></div>
      </header>
      <section class="stats">
        <div class="stat"><span>Projekte</span><strong>${projectList.length}</strong></div>
        <div class="stat"><span>Seiten</span><strong>${totalPages}</strong></div>
        <div class="stat"><span>Aktives Projekt</span><strong>${activeProject()?"1":"0"}</strong></div>
        <div class="stat"><span>Speicher</span><strong>lokal</strong></div>
      </section>
      <section class="panel">${cards}</section>
    `,"projects");
  }

  function createProjectView(){
    return shell(`
      <header class="topbar"><div><button class="secondary" id="cancelCreateProject">Zurück</button><h1>Neues Projekt</h1><p class="subtle">CAPS richtet dein Buchprojekt ein.</p></div></header>
      <form class="panel" id="projectForm">
        <div class="form-grid">
          <label class="field wide"><span>Projekttitel</span><input id="projectTitle" value="Dinosaurier Abenteuer" required></label>
          <label class="field"><span>Thema</span><select id="projectTheme"><option value="dinosaurier">Dinosaurier</option></select></label>
          <label class="field"><span>Zielgruppe</span><select id="projectAudience"><option>4–6 Jahre</option><option selected>6–10 Jahre</option><option>8–12 Jahre</option></select></label>
          <label class="field"><span>Seitenzahl</span><input id="projectPages" type="number" min="1" max="100" value="50"></label>
          <label class="field"><span>Format</span><select id="projectFormat"><option selected>DIN A4 Querformat</option><option>DIN A4 Hochformat</option></select></label>
          <label class="field wide"><span>Illustrationsstil</span><select id="projectStyle"><option>Einfach</option><option selected>Premium detailreich</option><option>Sehr detailreich</option></select></label>
        </div>
        <div class="form-actions"><button type="button" class="secondary" id="cancelCreateProjectBottom">Abbrechen</button><button class="primary">Projekt erstellen</button></div>
      </form>
    `,"projects");
  }

  function projectView(){
    const project=activeProject();
    if(!project){currentView="projects";return projectsView();}
    const state=Projects.productionState(project);

    return shell(`
      <header class="project-header">
        <div><button class="secondary" id="backHome">CAPS Home</button><p class="eyebrow">AKTIVES PROJEKT</p><h1>${UI.escapeHtml(project.title)}</h1><p class="subtle">${UI.escapeHtml(project.themeName)} · ${UI.escapeHtml(project.audience)} · ${UI.escapeHtml(project.format)}</p></div>
        <div class="actions"><button class="secondary" id="renameProject">Umbenennen</button><button class="secondary" id="backupProject">Projekt sichern</button><button class="secondary" id="openHealthProject">System prüfen</button></div>
      </header>

      <section class="stats">
        <div class="stat"><span>Produktionsreife</span><strong>${state.score}%</strong></div>
        <div class="stat"><span>Storyboard</span><strong>${state.storyboardProgress}%</strong></div>
        <div class="stat"><span>Version</span><strong>${project.version}</strong></div>
        <div class="stat"><span>Änderungen</span><strong>${project.history?.length||0}</strong></div>
      </section>

      <section class="panel">
        <h2>Seiten</h2>
        <p class="subtle">Öffne eine Seite und bearbeite Titel, Kategorie, Status und Notizen.</p>
        <div class="page-list">
          ${project.pagesData.map(page=>`<button class="page-card" data-page-id="${page.id}"><strong>${UI.escapeHtml(page.title)}</strong><span>Seite ${page.number}</span><span>Kategorie: ${UI.escapeHtml(page.category)}</span><span>Status: ${UI.escapeHtml(page.status)}</span></button>`).join("")}
        </div>
      </section>
    `,"project");
  }

  function pageView(){
    const project=activeProject();
    const page=activePage();
    if(!project||!page){currentView="project";return projectView();}

    return shell(`
      <header class="project-header">
        <div><button class="secondary" id="backProject">Zurück zum Projekt</button><p class="eyebrow">SEITE ${page.number} / ${project.pagesCount}</p><h1>${UI.escapeHtml(page.title)}</h1><p class="subtle">${UI.escapeHtml(project.title)}</p></div>
        <div class="actions"><button class="secondary" id="previousPage">Vorherige</button><button class="secondary" id="nextPage">Nächste</button></div>
      </header>

      <div class="page-editor-grid">
        <form class="panel" id="pageForm">
          <h2>Seitendaten</h2>
          <div class="form-grid">
            <label class="field wide"><span>Seitentitel</span><input id="pageTitle" value="${UI.escapeHtml(page.title)}" required></label>
            <label class="field"><span>Kategorie</span><select id="pageCategory">
              ${[["unplanned","Noch nicht geplant"],["battle","Kampf"],["peaceful","Friedlich"],["adventure","Abenteuer"],["air-water","Luft/Wasser"],["special","Spezialort"]].map(([v,l])=>`<option value="${v}" ${page.category===v?"selected":""}>${l}</option>`).join("")}
            </select></label>
            <label class="field"><span>Status</span><select id="pageStatus">
              ${[["planned","Geplant"],["in-progress","In Bearbeitung"],["completed","Fertig"],["blocked","Blockiert"]].map(([v,l])=>`<option value="${v}" ${page.status===v?"selected":""}>${l}</option>`).join("")}
            </select></label>
            <label class="field wide"><span>Notizen</span><textarea id="pageNotes">${UI.escapeHtml(page.notes||"")}</textarea></label>
          </div>
          <div class="form-actions"><button type="button" class="secondary" id="cancelPageEdit">Abbrechen</button><button class="primary">Seite speichern</button></div>
        </form>

        <aside class="panel page-editor-sidebar">
          <h2>CAPS Coach</h2>
          <p>Vergib zuerst eine passende Kategorie. Ergänze danach einen aussagekräftigen Titel und kurze Produktionsnotizen.</p>
          <button class="secondary" id="pageHealth">Seite prüfen</button>
        </aside>
      </div>
    `,"project");
  }

  function showHealth(){
    const project=activeProject();
    const checks=Projects.healthState(project);
    const modal=document.createElement("div");
    modal.className="modal-backdrop";
    modal.innerHTML=`<div class="modal">
      <div class="modal-head"><div><p class="eyebrow">HEALTH CENTER</p><h2>Systemprüfung</h2></div><button class="secondary" id="closeHealth">Schließen</button></div>
      <div class="modal-body"><div class="health-list">
        ${checks.map(item=>`<div class="health-item"><span><i class="health-dot ${item.status}"></i>${UI.escapeHtml(item.label)}</span><span>${UI.escapeHtml(item.detail)}</span></div>`).join("")}
      </div></div>
      <div class="modal-actions"><button class="primary" id="closeHealthBottom">Fertig</button></div>
    </div>`;
    document.body.appendChild(modal);
    const close=()=>modal.remove();
    document.getElementById("closeHealth").onclick=close;
    document.getElementById("closeHealthBottom").onclick=close;
  }

  function render(){
    const root=document.getElementById("app");
    root.innerHTML=currentView==="home"?homeView():currentView==="projects"?projectsView():currentView==="create"?createProjectView():currentView==="project"?projectView():pageView();
    bindEvents();
  }

  function goHome(){currentView="home";activePageId=null;render();}
  function goProjects(){currentView="projects";activePageId=null;render();}
  function goProject(){if(activeProject()){currentView="project";activePageId=null;render();}else goProjects();}

  function openProject(projectId){
    activeProjectId=projectId;
    const project=activeProject();
    if(project){
      patchActiveProject(Projects.touchProject(project,null));
      currentView="project";
      activePageId=null;
      render();
    }
  }

  function openPage(pageId){
    const project=activeProject();
    if(!project)return;
    activePageId=pageId;
    patchActiveProject(Projects.touchProject(project,pageId));
    currentView="page";
    render();
  }

  function executeNextStep(){
    const project=activeProject();
    if(!project){currentView="create";render();return;}
    const firstOpen=project.pagesData.find(page=>page.category==="unplanned")||project.pagesData[0];
    openPage(firstOpen.id);
  }

  function bindEvents(){
    document.getElementById("navHome")?.addEventListener("click",goHome);
    document.getElementById("navProjects")?.addEventListener("click",goProjects);
    document.getElementById("navProject")?.addEventListener("click",goProject);
    document.getElementById("mobileHome")?.addEventListener("click",goHome);
    document.getElementById("mobileProjects")?.addEventListener("click",goProjects);
    document.getElementById("mobileProject")?.addEventListener("click",goProject);
    document.getElementById("mobileHealth")?.addEventListener("click",showHealth);
    ["openHealth","heroHealth","openHealthProject","pageHealth"].forEach(id=>document.getElementById(id)?.addEventListener("click",showHealth));

    document.getElementById("homeCreateProject")?.addEventListener("click",()=>{currentView="create";render();});
    document.getElementById("createProjectButton")?.addEventListener("click",()=>{currentView="create";render();});
    document.getElementById("emptyCreateProject")?.addEventListener("click",()=>{currentView="create";render();});
    document.getElementById("cancelCreateProject")?.addEventListener("click",goProjects);
    document.getElementById("cancelCreateProjectBottom")?.addEventListener("click",goProjects);

    document.getElementById("nextStepButton")?.addEventListener("click",executeNextStep);
    document.getElementById("mobileNextStep")?.addEventListener("click",executeNextStep);
    document.getElementById("quickContinue")?.addEventListener("click",()=>{
      const project=activeProject();
      if(project?.lastActivePageId)openPage(project.lastActivePageId);
    });

    document.getElementById("projectForm")?.addEventListener("submit",event=>{
      event.preventDefault();
      const project=Projects.createProject({
        title:document.getElementById("projectTitle").value,
        themeId:document.getElementById("projectTheme").value,
        themeName:"Dinosaurier",
        audience:document.getElementById("projectAudience").value,
        pages:document.getElementById("projectPages").value,
        format:document.getElementById("projectFormat").value,
        style:document.getElementById("projectStyle").value
      });
      projectList.unshift(project);
      activeProjectId=project.id;
      persist();
      currentView="home";
      render();
      UI.toast("Projekt erstellt");
    });

    document.querySelectorAll(".open-project").forEach(button=>button.addEventListener("click",()=>openProject(button.dataset.id)));
    document.querySelectorAll(".set-active-project").forEach(button=>button.addEventListener("click",()=>{
      activeProjectId=button.dataset.id;persist();goHome();UI.toast("Aktives Projekt geändert");
    }));
    document.querySelectorAll(".duplicate-project").forEach(button=>button.addEventListener("click",()=>{
      const original=projectList.find(project=>project.id===button.dataset.id);
      if(!original)return;
      projectList.unshift(Projects.cloneProject(original));persist();render();UI.toast("Projekt dupliziert");
    }));
    document.querySelectorAll(".delete-project").forEach(button=>button.addEventListener("click",()=>{
      const project=projectList.find(item=>item.id===button.dataset.id);
      if(!project||!confirm(`Projekt „${project.title}“ wirklich löschen?`))return;
      projectList=projectList.filter(item=>item.id!==project.id);
      if(activeProjectId===project.id)activeProjectId=projectList[0]?.id||null;
      persist();render();UI.toast("Projekt gelöscht");
    }));

    document.getElementById("restoreProjectButton")?.addEventListener("click",()=>document.getElementById("restoreProjectFile").click());
    document.getElementById("restoreProjectFile")?.addEventListener("change",event=>{
      const file=event.target.files?.[0];if(!file)return;
      const reader=new FileReader();
      reader.onload=()=>{
        try{
          const project=JSON.parse(reader.result);
          if(!Projects.validateProject(project))throw new Error("Ungültiges CAPS-Projektformat.");
          const imported=Projects.cloneProject(project);
          imported.title=`${project.title} – Wiederhergestellt`;
          projectList.unshift(imported);persist();render();UI.toast("Projekt wiederhergestellt");
        }catch(error){alert(`Wiederherstellung fehlgeschlagen: ${error.message}`);}
      };
      reader.readAsText(file);event.target.value="";
    });

    document.getElementById("backHome")?.addEventListener("click",goHome);
    document.getElementById("renameProject")?.addEventListener("click",()=>{
      const project=activeProject();if(!project)return;
      const title=prompt("Neuer Projekttitel:",project.title);if(title===null)return;
      try{patchActiveProject(Projects.renameProject(project,title));render();UI.toast("Projekt umbenannt");}catch(error){alert(error.message);}
    });
    document.getElementById("backupProject")?.addEventListener("click",()=>{
      const project=activeProject();if(!project)return;
      UI.downloadFile(`${project.title.replace(/[^a-z0-9äöüß]+/gi,"_")}.caps.json`,JSON.stringify(project,null,2),"application/json");
      UI.toast("Projektsicherung erstellt");
    });

    document.querySelectorAll("[data-page-id]").forEach(button=>button.addEventListener("click",()=>openPage(button.dataset.pageId)));
    document.getElementById("backProject")?.addEventListener("click",goProject);
    document.getElementById("cancelPageEdit")?.addEventListener("click",goProject);

    document.getElementById("pageForm")?.addEventListener("submit",event=>{
      event.preventDefault();
      const project=activeProject(),page=activePage();if(!project||!page)return;
      const updated=Projects.updatePage(project,page.id,{
        title:document.getElementById("pageTitle").value.trim(),
        category:document.getElementById("pageCategory").value,
        status:document.getElementById("pageStatus").value,
        notes:document.getElementById("pageNotes").value
      });
      patchActiveProject(Projects.touchProject(updated,page.id));
      render();UI.toast("Seite gespeichert");
    });

    const movePage=direction=>{
      const project=activeProject(),page=activePage();if(!project||!page)return;
      const index=project.pagesData.findIndex(item=>item.id===page.id);
      const target=Math.max(0,Math.min(project.pagesData.length-1,index+direction));
      openPage(project.pagesData[target].id);
    };
    document.getElementById("previousPage")?.addEventListener("click",()=>movePage(-1));
    document.getElementById("nextPage")?.addEventListener("click",()=>movePage(1));
  }

  window.CAPS={name:"CAPS Studio",version:"5.1.0-a2.1",sprint:"A.2.1"};
  render();
})();
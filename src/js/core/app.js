(function(){
  "use strict";

  const Storage=window.CAPS_Storage;
  const Projects=window.CAPS_ProjectManager;
  const UI=window.CAPS_UI;
  const Universe=window.CAPS_Universe;
  const library=window.CAPS_CORE_LIBRARY||{categories:[],assets:[]};
  const packs=window.CAPS_UNIVERSE_PACKS||{packs:[]};

  let projectList=Storage.loadProjects();
  let activeProjectId=localStorage.getItem("caps-active-project-id")||projectList[0]?.id||null;
  let activePageId=null;
  let currentView="home";
  let projectTab="overview";

  const themeOptions=[
    {id:"dinosaurs",label:"Dinosaurier",icon:"🦖",pack:"dino-adventure"},
    {id:"animals",label:"Tiere",icon:"🐾"},
    {id:"rescue",label:"Feuerwehr & Rettung",icon:"🚒",pack:"rescue-city"},
    {id:"police",label:"Polizei",icon:"🚓",pack:"rescue-city"},
    {id:"construction",label:"Baustelle",icon:"🏗️"},
    {id:"farm",label:"Bauernhof",icon:"🚜",pack:"farm-life"},
    {id:"pirates",label:"Piraten",icon:"🏴‍☠️"},
    {id:"knights",label:"Ritter",icon:"🏰"},
    {id:"fairy",label:"Märchen",icon:"🧚",pack:"fairy-world"},
    {id:"mythical",label:"Fabelwesen",icon:"🐉",pack:"fairy-world"},
    {id:"space",label:"Weltraum",icon:"🚀",pack:"space-expedition"},
    {id:"vehicles",label:"Fahrzeuge",icon:"🚗"},
    {id:"robots",label:"Roboter",icon:"🤖"},
    {id:"custom",label:"Eigene Idee",icon:"✏️"}
  ];

  let wizard={
    step:1,
    title:"Mein neues Buch",
    subtitle:"",
    author:"",
    language:"Deutsch",
    audience:"6–10 Jahre",
    pages:50,
    format:"DIN A4 Querformat",
    style:"Premium detailreich",
    themes:[],
    customTheme:"",
    assetIds:[],
    customAssets:[]
  };
  let wizardSearch="";
  let wizardCategory="all";

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
  function categoryName(id){
    return library.categories.find(cat=>cat.id===id)?.name||id;
  }
  function allProjectAssets(project){
    const custom=project?.universe?.customAssets||[];
    const all=[...(library.assets||[]),...custom];
    const ids=new Set(project?.universe?.assetIds||[]);
    return all.filter(asset=>ids.has(asset.id));
  }

  function nav(active){
    return `<nav class="nav">
      <div class="nav-item clickable ${active==="home"?"active":""}"><button class="nav-button" id="navHome">Home</button></div>
      <div class="nav-item clickable ${active==="projects"?"active":""}"><button class="nav-button" id="navProjects">Meine Bücher</button></div>
      <div class="nav-item clickable ${active==="project"?"active":""}"><button class="nav-button" id="navProject">Aktuelles Buch</button></div>
      <div class="nav-item disabled">Storyboard <span class="coming-soon">Nächster Sprint</span></div>
      <div class="nav-item disabled">Szenen <span class="coming-soon">Demnächst</span></div>
      <div class="nav-item disabled">Bilder <span class="coming-soon">Demnächst</span></div>
      <div class="nav-item disabled">Projektbuch <span class="coming-soon">PDF</span></div>
    </nav>`;
  }
  function mobileNav(active){
    return `<nav class="mobile-bottom-nav">
      <button id="mobileHome" class="${active==="home"?"active":""}"><strong>⌂</strong><span>Home</span></button>
      <button id="mobileProjects" class="${active==="projects"?"active":""}"><strong>▦</strong><span>Bücher</span></button>
      <button id="mobileProject" class="${active==="project"?"active":""}"><strong>▤</strong><span>Projekt</span></button>
      <button id="mobileHealth"><strong>✓</strong><span>System</span></button>
    </nav>`;
  }
  function shell(content,active){
    return `<div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">C</div><div><strong>CAPS Studio</strong><span>Projektassistent</span></div></div>
        ${nav(active)}
        <div class="side-note">Alles wird im Projekt gesteuert.<br>Desktop & mobiler Browser.<br>Keine Installation.</div>
      </aside>
      <main class="main">${content}</main>
      ${mobileNav(active)}
    </div>`;
  }

  function homeView(){
    const project=activeProject();
    if(!project){
      return shell(`
        <header class="topbar"><div><p class="eyebrow">CAPS HOME</p><h1>Dein erstes Buch beginnt hier</h1><p class="subtle">CAPS führt dich verständlich durch alle Schritte.</p></div><button class="secondary" id="openHealth">System prüfen</button></header>
        <section class="next-step-card"><p class="next-step-label">ERSTER SCHRITT</p><h2>Ein Buchprojekt erstellen</h2><p>Wähle Thema, Figuren, Fabelwesen, Menschen, Fahrzeuge und Orte direkt im Projektassistenten.</p><button class="primary" id="startWizard">Mein erstes Buch erstellen</button></section>
      `,"home");
    }
    const state=Projects.productionState(project);
    const contentCount=(project.universe?.assetIds||[]).length;
    const lastPage=project.pagesData.find(page=>page.id===project.lastActivePageId);
    return shell(`
      <header class="topbar"><div><p class="eyebrow">CAPS HOME</p><h1>Willkommen zurück</h1><p class="subtle">Dein Buchprojekt ist der Mittelpunkt aller Funktionen.</p></div><button class="secondary" id="openHealth">System prüfen</button></header>
      <div class="home-grid">
        <div>
          <section class="hero-card">
            <div class="hero-top"><div><p class="eyebrow" style="color:#9bb7f6">AKTIVES BUCH</p><div class="hero-project"><h2>${UI.escapeHtml(project.title)}</h2><p class="subtle">${UI.escapeHtml((project.themes||[]).join(", ")||project.themeName)} · ${project.pagesCount} Seiten</p></div></div><button class="health-button" id="heroHealth">● Systemstatus</button></div>
            <div class="score-row"><div><div class="score-number">${state.score}%</div><div class="score-label">Produktionsreife</div></div><div class="subtle">${contentCount} Projektinhalte</div></div>
            <div class="progress"><span style="width:${state.score}%"></span></div>
            ${lastPage?`<div class="quick-continue"><strong>Zuletzt bearbeitet: Seite ${lastPage.number}</strong><span>${UI.escapeHtml(lastPage.title)}</span><button class="secondary" id="quickContinue">Weiterarbeiten</button></div>`:""}
          </section>
          <section class="next-step-card"><p class="next-step-label">NÄCHSTER SCHRITT</p><h2>Projektinhalte prüfen</h2><p>Stelle sicher, dass alle gewünschten Figuren, Tiere, Fabelwesen, Fahrzeuge und Orte vorhanden sind.</p><button class="primary" id="openProjectContents">Projektinhalte öffnen</button></section>
        </div>
        <div>
          <section class="coach-card"><strong>CAPS Coach</strong><p>${contentCount<5?"Füge einige Inhalte hinzu. Sie bilden später die Auswahl für dein Storyboard und die Bild-Prompts.":"Dein Projekt enthält bereits eine gute Auswahl. Als Nächstes entsteht daraus das Storyboard."}</p></section>
          <section class="panel" style="margin-top:16px"><h2>Projektstatus</h2><div class="project-list"><div class="project-row"><span>Themen</span><span>${(project.themes||[]).length}</span></div><div class="project-row"><span>Projektinhalte</span><span>${contentCount}</span></div><div class="project-row"><span>Seiten</span><span>${project.pagesCount}</span></div><div class="project-row"><span>Storyboard</span><span>${state.storyboardProgress}%</span></div></div></section>
        </div>
      </div>
    `,"home");
  }

  function projectsView(){
    const cards=projectList.length?`<div class="project-grid">${projectList.map(project=>`
      <article class="project-card"><div class="project-cover"><strong>${UI.escapeHtml((project.themes||[])[0]||project.themeName)}</strong><span>${project.pagesCount} Seiten</span></div><div class="project-body"><h3>${UI.escapeHtml(project.title)}</h3><div class="project-meta">${UI.escapeHtml(project.audience)} · ${(project.universe?.assetIds||[]).length} Inhalte</div><div class="project-actions"><button class="primary open-project" data-id="${project.id}">Öffnen</button><button class="secondary set-active" data-id="${project.id}">Aktiv setzen</button><button class="secondary duplicate-project" data-id="${project.id}">Duplizieren</button><button class="danger delete-project" data-id="${project.id}">Löschen</button></div></div></article>
    `).join("")}</div>`:`<div class="empty"><h2>Noch kein Buchprojekt</h2><button class="primary" id="emptyStartWizard">Buch erstellen</button></div>`;
    return shell(`
      <header class="topbar"><div><p class="eyebrow">MEINE BÜCHER</p><h1>Projektübersicht</h1><p class="subtle">Alle Inhalte werden innerhalb des jeweiligen Buchprojekts verwaltet.</p></div><div class="actions"><button class="secondary" id="restoreProjectButton">Projekt wiederherstellen</button><input hidden id="restoreProjectFile" type="file" accept=".json,.caps"><button class="primary" id="newWizard">Neues Buch</button></div></header>
      <section class="panel">${cards}</section>
    `,"projects");
  }

  function wizardSteps(){
    const labels=["Buch","Themen","Figuren","Orte & Fahrzeuge","Eigene Figuren","Prüfen"];
    return `<div class="wizard-progress">${labels.map((label,index)=>`<div class="${wizard.step>index+1?"done":wizard.step===index+1?"active":""}">${index+1}. ${label}</div>`).join("")}</div>`;
  }

  function themeCards(){
    return `<div class="theme-grid">${themeOptions.map(theme=>`<button type="button" class="theme-option ${wizard.themes.includes(theme.id)?"selected":""}" data-theme="${theme.id}"><span>${theme.icon}</span><strong>${theme.label}</strong></button>`).join("")}</div>`;
  }

  function suggestedAssetIds(){
    const ids=new Set();
    wizard.themes.forEach(themeId=>{
      const theme=themeOptions.find(item=>item.id===themeId);
      if(theme?.pack){
        const pack=packs.packs.find(item=>item.id===theme.pack);
        (pack?.assetIds||[]).forEach(id=>ids.add(id));
      }
    });
    const categoryByTheme={
      animals:"animals",vehicles:"vehicles",robots:"robots",mythical:"mythical",
      fairy:"mythical",dinosaurs:"dinosaurs",space:"aliens"
    };
    wizard.themes.forEach(themeId=>{
      const cat=categoryByTheme[themeId];
      if(cat)(library.assets||[]).filter(asset=>asset.category===cat).slice(0,18).forEach(asset=>ids.add(asset.id));
    });
    return ids;
  }

  function filteredWizardAssets(categories){
    const suggested=suggestedAssetIds();
    return (library.assets||[]).filter(asset=>{
      const catOk=categories.includes(asset.category);
      const filterOk=wizardCategory==="all"||asset.category===wizardCategory;
      const search=(asset.name+" "+(asset.description||"")).toLowerCase().includes(wizardSearch.toLowerCase());
      return catOk&&filterOk&&search;
    }).sort((a,b)=>(suggested.has(b.id)?1:0)-(suggested.has(a.id)?1:0));
  }

  function assetSelection(categories){
    const options=library.categories.filter(cat=>categories.includes(cat.id));
    const assets=filteredWizardAssets(categories);
    return `<div class="selection-toolbar"><input id="wizardSearch" placeholder="Inhalte durchsuchen" value="${UI.escapeHtml(wizardSearch)}"><select id="wizardCategory"><option value="all">Alle Kategorien</option>${options.map(cat=>`<option value="${cat.id}" ${wizardCategory===cat.id?"selected":""}>${UI.escapeHtml(cat.name)}</option>`).join("")}</select></div>
      <div class="selection-grid">${assets.map(asset=>`<button type="button" class="selection-card ${wizard.assetIds.includes(asset.id)?"selected":""}" data-asset="${asset.id}"><strong>${UI.escapeHtml(asset.name)}</strong><small>${UI.escapeHtml(categoryName(asset.category))}</small></button>`).join("")}</div>`;
  }

  function wizardView(){
    let body="";
    if(wizard.step===1){
      body=`<h2>Buchinformationen</h2><p class="subtle">Diese Angaben bilden die Grundlage deines Projekts.</p><div class="form-grid">
        <label class="field wide"><span>Titel</span><input id="wizTitle" value="${UI.escapeHtml(wizard.title)}"></label>
        <label class="field wide"><span>Untertitel (optional)</span><input id="wizSubtitle" value="${UI.escapeHtml(wizard.subtitle)}"></label>
        <label class="field"><span>Autor</span><input id="wizAuthor" value="${UI.escapeHtml(wizard.author)}"></label>
        <label class="field"><span>Sprache</span><select id="wizLanguage"><option>Deutsch</option><option>Englisch</option></select></label>
        <label class="field"><span>Zielgruppe</span><select id="wizAudience"><option>4–6 Jahre</option><option ${wizard.audience==="6–10 Jahre"?"selected":""}>6–10 Jahre</option><option>8–12 Jahre</option></select></label>
        <label class="field"><span>Seitenzahl</span><input id="wizPages" type="number" min="10" max="100" value="${wizard.pages}"></label>
        <label class="field"><span>Format</span><select id="wizFormat"><option>DIN A4 Querformat</option><option>DIN A4 Hochformat</option></select></label>
        <label class="field"><span>Stil</span><select id="wizStyle"><option>Einfach</option><option selected>Premium detailreich</option><option>Sehr detailreich</option></select></label>
      </div>`;
    }else if(wizard.step===2){
      body=`<h2>Worum geht es in deinem Buch?</h2><p class="subtle">Du kannst mehrere Themen kombinieren.</p>${themeCards()}${wizard.themes.includes("custom")?`<label class="field wide" style="margin-top:14px"><span>Eigene Idee</span><input id="wizCustomTheme" value="${UI.escapeHtml(wizard.customTheme)}" placeholder="z. B. Magische Dinosaurier in einer Zukunftsstadt"></label>`:""}`;
    }else if(wizard.step===3){
      body=`<h2>Welche Figuren sollen vorkommen?</h2><p class="subtle">Wähle Menschen, Dinosaurier, Tiere, Fabelwesen, Roboter, Aliens oder Monster.</p>${assetSelection(["humans","dinosaurs","animals","mythical","robots","aliens","monsters"])}`;
    }else if(wizard.step===4){
      body=`<h2>Orte, Fahrzeuge und Objekte</h2><p class="subtle">Diese Inhalte stehen später im Storyboard zur Auswahl.</p>${assetSelection(["vehicles","locations","objects"])}`;
    }else if(wizard.step===5){
      body=`<h2>Eigene Figuren ergänzen</h2><p class="subtle">Lege besondere Charaktere direkt für dieses Buch an.</p>
        <div class="form-grid">
          <label class="field"><span>Name</span><input id="customName" placeholder="z. B. Professor Max"></label>
          <label class="field"><span>Art/Kategorie</span><select id="customCategory">${library.categories.filter(cat=>["humans","dinosaurs","animals","mythical","robots","aliens","monsters","vehicles"].includes(cat.id)).map(cat=>`<option value="${cat.id}">${UI.escapeHtml(cat.name)}</option>`).join("")}</select></label>
          <label class="field wide"><span>Beschreibung</span><textarea id="customDescription" placeholder="Aussehen, Rolle, Kleidung und besondere Merkmale"></textarea></label>
        </div>
        <button type="button" class="secondary" id="addWizardCustom">Eigene Figur hinzufügen</button>
        <div class="custom-character-list">${wizard.customAssets.map(item=>`<div class="custom-character"><div><strong>${UI.escapeHtml(item.name)}</strong><div class="subtle">${UI.escapeHtml(categoryName(item.category))} · ${UI.escapeHtml(item.description)}</div></div><button type="button" class="danger remove-wizard-custom" data-id="${item.id}">Entfernen</button></div>`).join("")||'<p class="subtle" style="margin-top:12px">Eigene Figuren sind optional.</p>'}</div>`;
    }else{
      const selectedAssets=(library.assets||[]).filter(asset=>wizard.assetIds.includes(asset.id));
      const selectedThemes=themeOptions.filter(theme=>wizard.themes.includes(theme.id)).map(theme=>theme.label);
      if(wizard.customTheme)selectedThemes.push(wizard.customTheme);
      body=`<h2>Projekt prüfen</h2><p class="subtle">CAPS legt das Buch mit diesen Angaben und Inhalten an.</p>
        <div class="wizard-summary">
          <div class="summary-box"><strong>${UI.escapeHtml(wizard.title)}</strong><span>${UI.escapeHtml(wizard.subtitle||"Kein Untertitel")}</span></div>
          <div class="summary-box"><strong>${wizard.pages} Seiten</strong><span>${UI.escapeHtml(wizard.audience)} · ${UI.escapeHtml(wizard.format)}</span></div>
          <div class="summary-box"><strong>${selectedThemes.length} Themen</strong><span>${UI.escapeHtml(selectedThemes.join(", "))}</span></div>
          <div class="summary-box"><strong>${selectedAssets.length+wizard.customAssets.length} Inhalte</strong><span>${selectedAssets.length} Standard · ${wizard.customAssets.length} eigene</span></div>
        </div>
        <div class="wizard-note" style="margin-top:14px">Nach dem Erstellen kannst du alle Inhalte jederzeit unter <strong>Aktuelles Buch → Inhalte</strong> erweitern oder entfernen.</div>`;
    }
    return shell(`<div class="wizard-shell"><header class="topbar"><div><p class="eyebrow">NEUES BUCH</p><h1>Projektassistent</h1><p class="subtle">CAPS richtet dein Projekt Schritt für Schritt ein.</p></div><button class="secondary" id="cancelWizard">Abbrechen</button></header>${wizardSteps()}<section class="wizard-card">${body}<div class="wizard-footer"><button class="secondary" id="wizardBack" ${wizard.step===1?"disabled":""}>Zurück</button><button class="primary" id="wizardNext">${wizard.step===6?"Projekt erstellen":"Weiter"}</button></div></section></div>`,"projects");
  }

  function projectTabs(){
    return `<div class="project-tabs"><button class="secondary project-tab ${projectTab==="overview"?"active":""}" data-tab="overview">Übersicht</button><button class="secondary project-tab ${projectTab==="contents"?"active":""}" data-tab="contents">Inhalte</button><button class="secondary project-tab ${projectTab==="pages"?"active":""}" data-tab="pages">Seiten</button><button class="secondary project-tab ${projectTab==="settings"?"active":""}" data-tab="settings">Einstellungen</button></div>`;
  }

  function projectView(){
    const project=activeProject();
    if(!project){currentView="projects";return projectsView();}
    const assets=allProjectAssets(project);
    let content="";
    if(projectTab==="overview"){
      content=`<div class="wizard-summary"><div class="summary-box"><strong>${UI.escapeHtml(project.title)}</strong><span>${UI.escapeHtml(project.subtitle||"")}</span></div><div class="summary-box"><strong>${(project.themes||[]).length} Themen</strong><span>${UI.escapeHtml((project.themes||[]).join(", ")||project.themeName)}</span></div><div class="summary-box"><strong>${assets.length} Inhalte</strong><span>Figuren, Fahrzeuge, Orte und Objekte</span></div><div class="summary-box"><strong>${project.pagesCount} Seiten</strong><span>${UI.escapeHtml(project.audience)} · ${UI.escapeHtml(project.format)}</span></div></div><section class="next-step-card"><p class="next-step-label">NÄCHSTER SCHRITT</p><h2>Projektinhalte vervollständigen</h2><p>Prüfe, ob alle gewünschten Figuren und Schauplätze enthalten sind.</p><button class="primary" id="goContents">Inhalte öffnen</button></section>`;
    }else if(projectTab==="contents"){
      const groups=library.categories.map(cat=>({cat,items:assets.filter(asset=>asset.category===cat.id)})).filter(group=>group.items.length);
      content=`<div class="content-section-head"><div><h2>Projektinhalte</h2><p class="subtle">Nur diese Elemente werden später im Storyboard angeboten.</p></div><button class="primary" id="addProjectContent">Inhalte hinzufügen</button></div>${groups.map(group=>`<div class="content-section"><div class="content-section-head"><h3>${UI.escapeHtml(group.cat.name)}</h3><span class="content-count">${group.items.length}</span></div><div class="selection-grid">${group.items.map(asset=>`<article class="selection-card selected"><strong>${UI.escapeHtml(asset.name)}</strong><small>${asset.custom?"Eigene Figur":"Projektinhalt"}</small><button class="danger remove-project-content" data-id="${asset.id}" style="margin-top:8px">Entfernen</button></article>`).join("")}</div></div>`).join("")||'<div class="empty">Noch keine Inhalte ausgewählt.</div>'}`;
    }else if(projectTab==="pages"){
      content=`<h2>Seiten</h2><p class="subtle">Öffne eine Seite, um Titel, Kategorie, Status und Notizen zu bearbeiten.</p><div class="page-list">${project.pagesData.map(page=>`<button class="page-card" data-page-id="${page.id}"><strong>${UI.escapeHtml(page.title)}</strong><span>Seite ${page.number}</span><span>${UI.escapeHtml(page.category)}</span></button>`).join("")}</div>`;
    }else{
      content=`<h2>Projekteinstellungen</h2><div class="export-explanation"><div class="export-option"><strong>Projekt sichern</strong><span>Bearbeitbare Sicherungsdatei für CAPS.</span><button class="secondary" id="backupProject" style="margin-top:10px">.caps.json herunterladen</button></div><div class="export-option"><strong>Projektbuch als PDF</strong><span>Folgt im PDF-Sprint.</span><button class="secondary" disabled style="margin-top:10px">Noch nicht verfügbar</button></div></div><div class="actions" style="margin-top:16px"><button class="secondary" id="renameProject">Projekt umbenennen</button></div>`;
    }
    return shell(`<header class="project-header"><div><button class="secondary" id="backHome">CAPS Home</button><p class="eyebrow">AKTUELLES BUCH</p><h1>${UI.escapeHtml(project.title)}</h1><p class="subtle">${UI.escapeHtml((project.themes||[]).join(", ")||project.themeName)}</p></div><button class="secondary" id="openHealthProject">System prüfen</button></header>${projectTabs()}<section class="panel">${content}</section>`,"project");
  }

  function pageView(){
    const project=activeProject(),page=activePage();
    if(!project||!page){currentView="project";projectTab="pages";return projectView();}
    return shell(`<header class="project-header"><div><button class="secondary" id="backProject">Zurück zum Buch</button><p class="eyebrow">SEITE ${page.number} / ${project.pagesCount}</p><h1>${UI.escapeHtml(page.title)}</h1></div><div class="actions"><button class="secondary" id="previousPage">Vorherige</button><button class="secondary" id="nextPage">Nächste</button></div></header><form class="panel" id="pageForm"><div class="form-grid"><label class="field wide"><span>Seitentitel</span><input id="pageTitle" value="${UI.escapeHtml(page.title)}"></label><label class="field"><span>Kategorie</span><select id="pageCategory">${[["unplanned","Noch nicht geplant"],["battle","Kampf"],["peaceful","Friedlich"],["adventure","Abenteuer"],["air-water","Luft/Wasser"],["special","Spezialort"]].map(([v,l])=>`<option value="${v}" ${page.category===v?"selected":""}>${l}</option>`).join("")}</select></label><label class="field"><span>Status</span><select id="pageStatus">${[["planned","Geplant"],["in-progress","In Bearbeitung"],["completed","Fertig"],["blocked","Blockiert"]].map(([v,l])=>`<option value="${v}" ${page.status===v?"selected":""}>${l}</option>`).join("")}</select></label><label class="field wide"><span>Notizen</span><textarea id="pageNotes">${UI.escapeHtml(page.notes||"")}</textarea></label></div><div class="form-actions"><button type="button" class="secondary" id="cancelPage">Abbrechen</button><button class="primary">Seite speichern</button></div></form>`,"project");
  }

  function contentPicker(){
    const project=activeProject();
    const selected=new Set(project?.universe?.assetIds||[]);
    const available=(library.assets||[]).filter(asset=>{
      const catOk=wizardCategory==="all"||asset.category===wizardCategory;
      const search=asset.name.toLowerCase().includes(wizardSearch.toLowerCase());
      return catOk&&search;
    });
    const modal=document.createElement("div");
    modal.className="modal-backdrop";
    modal.innerHTML=`<div class="modal" style="width:min(900px,100%)"><div class="modal-head"><div><p class="eyebrow">PROJEKTINHALTE</p><h2>Inhalte hinzufügen</h2></div><button class="secondary" id="closePicker">Schließen</button></div><div class="modal-body"><div class="selection-toolbar"><input id="pickerSearch" placeholder="Suchen"><select id="pickerCategory"><option value="all">Alle Kategorien</option>${library.categories.map(cat=>`<option value="${cat.id}">${UI.escapeHtml(cat.name)}</option>`).join("")}</select></div><div class="selection-grid" id="pickerGrid">${available.map(asset=>`<button class="selection-card ${selected.has(asset.id)?"selected":""}" data-picker="${asset.id}"><strong>${UI.escapeHtml(asset.name)}</strong><small>${UI.escapeHtml(categoryName(asset.category))}</small></button>`).join("")}</div><hr><h3>Eigene Figur</h3><div class="form-grid"><label class="field"><span>Name</span><input id="pickerCustomName"></label><label class="field"><span>Kategorie</span><select id="pickerCustomCategory">${library.categories.map(cat=>`<option value="${cat.id}">${UI.escapeHtml(cat.name)}</option>`).join("")}</select></label><label class="field wide"><span>Beschreibung</span><textarea id="pickerCustomDescription"></textarea></label></div><button class="secondary" id="pickerAddCustom">Eigene Figur hinzufügen</button></div></div>`;
    document.body.appendChild(modal);
    const redraw=()=>{
      const q=document.getElementById("pickerSearch").value.toLowerCase();
      const cat=document.getElementById("pickerCategory").value;
      const ids=new Set(activeProject().universe?.assetIds||[]);
      document.getElementById("pickerGrid").innerHTML=(library.assets||[]).filter(asset=>(cat==="all"||asset.category===cat)&&asset.name.toLowerCase().includes(q)).map(asset=>`<button class="selection-card ${ids.has(asset.id)?"selected":""}" data-picker="${asset.id}"><strong>${UI.escapeHtml(asset.name)}</strong><small>${UI.escapeHtml(categoryName(asset.category))}</small></button>`).join("");
      document.querySelectorAll("[data-picker]").forEach(button=>button.onclick=()=>{
        const project=activeProject();
        const ids=new Set(project.universe?.assetIds||[]);
        const updated=ids.has(button.dataset.picker)?Universe.removeAsset(project,button.dataset.picker):Universe.addAsset(project,button.dataset.picker);
        patchActiveProject(updated);redraw();
      });
    };
    document.getElementById("closePicker").onclick=()=>{modal.remove();render();};
    document.getElementById("pickerSearch").oninput=redraw;
    document.getElementById("pickerCategory").onchange=redraw;
    document.getElementById("pickerAddCustom").onclick=()=>{
      const name=document.getElementById("pickerCustomName").value.trim();
      if(!name){alert("Bitte einen Namen eingeben.");return;}
      patchActiveProject(Universe.addCustomAsset(activeProject(),{name,category:document.getElementById("pickerCustomCategory").value,description:document.getElementById("pickerCustomDescription").value}));
      document.getElementById("pickerCustomName").value="";
      document.getElementById("pickerCustomDescription").value="";
      UI.toast("Eigene Figur hinzugefügt");
    };
    redraw();
  }

  function showHealth(){
    const checks=Projects.healthState(activeProject());
    const modal=document.createElement("div");
    modal.className="modal-backdrop";
    modal.innerHTML=`<div class="modal"><div class="modal-head"><div><p class="eyebrow">HEALTH CENTER</p><h2>Systemprüfung</h2></div><button class="secondary" id="closeHealth">Schließen</button></div><div class="modal-body"><div class="health-list">${checks.map(item=>`<div class="health-item"><span><i class="health-dot ${item.status}"></i>${UI.escapeHtml(item.label)}</span><span>${UI.escapeHtml(item.detail)}</span></div>`).join("")}</div></div></div>`;
    document.body.appendChild(modal);
    document.getElementById("closeHealth").onclick=()=>modal.remove();
  }

  function saveWizardFields(){
    const value=(id,fallback)=>document.getElementById(id)?.value??fallback;
    if(wizard.step===1){
      wizard.title=value("wizTitle",wizard.title).trim()||"Mein neues Buch";
      wizard.subtitle=value("wizSubtitle",wizard.subtitle);
      wizard.author=value("wizAuthor",wizard.author);
      wizard.language=value("wizLanguage",wizard.language);
      wizard.audience=value("wizAudience",wizard.audience);
      wizard.pages=Number(value("wizPages",wizard.pages));
      wizard.format=value("wizFormat",wizard.format);
      wizard.style=value("wizStyle",wizard.style);
    }
    if(wizard.step===2)wizard.customTheme=value("wizCustomTheme",wizard.customTheme);
  }

  function render(){
    const root=document.getElementById("app");
    root.innerHTML=currentView==="home"?homeView():currentView==="projects"?projectsView():currentView==="wizard"?wizardView():currentView==="project"?projectView():pageView();
    bind();
  }
  function goHome(){currentView="home";render();}
  function goProjects(){currentView="projects";render();}
  function goProject(){if(activeProject()){currentView="project";render();}else goProjects();}
  function startWizard(){wizard={step:1,title:"Mein neues Buch",subtitle:"",author:"",language:"Deutsch",audience:"6–10 Jahre",pages:50,format:"DIN A4 Querformat",style:"Premium detailreich",themes:[],customTheme:"",assetIds:[],customAssets:[]};wizardSearch="";wizardCategory="all";currentView="wizard";render();}
  function openPage(id){activePageId=id;const project=activeProject();patchActiveProject(Projects.touchProject(project,id));currentView="page";render();}

  function bind(){
    document.getElementById("navHome")?.addEventListener("click",goHome);
    document.getElementById("navProjects")?.addEventListener("click",goProjects);
    document.getElementById("navProject")?.addEventListener("click",goProject);
    document.getElementById("mobileHome")?.addEventListener("click",goHome);
    document.getElementById("mobileProjects")?.addEventListener("click",goProjects);
    document.getElementById("mobileProject")?.addEventListener("click",goProject);
    document.getElementById("mobileHealth")?.addEventListener("click",showHealth);
    ["openHealth","heroHealth","openHealthProject"].forEach(id=>document.getElementById(id)?.addEventListener("click",showHealth));

    ["startWizard","newWizard","emptyStartWizard"].forEach(id=>document.getElementById(id)?.addEventListener("click",startWizard));
    document.getElementById("cancelWizard")?.addEventListener("click",goProjects);

    document.querySelectorAll("[data-theme]").forEach(button=>button.addEventListener("click",()=>{
      const id=button.dataset.theme;
      wizard.themes=wizard.themes.includes(id)?wizard.themes.filter(x=>x!==id):[...wizard.themes,id];
      render();
    }));
    document.querySelectorAll("[data-asset]").forEach(button=>button.addEventListener("click",()=>{
      const id=button.dataset.asset;
      wizard.assetIds=wizard.assetIds.includes(id)?wizard.assetIds.filter(x=>x!==id):[...wizard.assetIds,id];
      render();
    }));
    document.getElementById("wizardSearch")?.addEventListener("input",event=>{wizardSearch=event.target.value;render();const input=document.getElementById("wizardSearch");if(input){input.focus();input.setSelectionRange(wizardSearch.length,wizardSearch.length);}});
    document.getElementById("wizardCategory")?.addEventListener("change",event=>{wizardCategory=event.target.value;render();});
    document.getElementById("addWizardCustom")?.addEventListener("click",()=>{
      const name=document.getElementById("customName").value.trim();
      if(!name){alert("Bitte einen Namen eingeben.");return;}
      wizard.customAssets.push({id:"custom-"+Date.now(),name,category:document.getElementById("customCategory").value,description:document.getElementById("customDescription").value,custom:true});
      render();
    });
    document.querySelectorAll(".remove-wizard-custom").forEach(button=>button.addEventListener("click",()=>{wizard.customAssets=wizard.customAssets.filter(item=>item.id!==button.dataset.id);render();}));

    document.getElementById("wizardBack")?.addEventListener("click",()=>{saveWizardFields();wizard.step=Math.max(1,wizard.step-1);wizardSearch="";wizardCategory="all";render();});
    document.getElementById("wizardNext")?.addEventListener("click",()=>{
      saveWizardFields();
      if(wizard.step===2&&wizard.themes.length===0){alert("Bitte mindestens ein Thema auswählen.");return;}
      if(wizard.step<6){
        if(wizard.step===2){
          const suggested=Array.from(suggestedAssetIds());
          wizard.assetIds=Array.from(new Set([...wizard.assetIds,...suggested]));
        }
        wizard.step++;wizardSearch="";wizardCategory="all";render();return;
      }
      const themeLabels=themeOptions.filter(theme=>wizard.themes.includes(theme.id)).map(theme=>theme.label);
      if(wizard.customTheme)themeLabels.push(wizard.customTheme);
      const project=Projects.createProject({
        title:wizard.title,subtitle:wizard.subtitle,author:wizard.author,language:wizard.language,
        audience:wizard.audience,pages:wizard.pages,format:wizard.format,style:wizard.style,
        themeId:wizard.themes[0]||"custom",themeName:themeLabels[0]||"Eigenes Thema",
        themes:themeLabels,customTheme:wizard.customTheme,
        universe:{assetIds:Array.from(new Set([...wizard.assetIds,...wizard.customAssets.map(item=>item.id)])),customAssets:wizard.customAssets,installedPackIds:[]}
      });
      projectList.unshift(project);activeProjectId=project.id;persist();projectTab="overview";currentView="project";render();UI.toast("Buchprojekt erstellt");
    });

    document.querySelectorAll(".open-project").forEach(button=>button.addEventListener("click",()=>{activeProjectId=button.dataset.id;persist();projectTab="overview";currentView="project";render();}));
    document.querySelectorAll(".set-active").forEach(button=>button.addEventListener("click",()=>{activeProjectId=button.dataset.id;persist();goHome();}));
    document.querySelectorAll(".duplicate-project").forEach(button=>button.addEventListener("click",()=>{const original=projectList.find(project=>project.id===button.dataset.id);if(original){projectList.unshift(Projects.cloneProject(original));persist();render();}}));
    document.querySelectorAll(".delete-project").forEach(button=>button.addEventListener("click",()=>{const project=projectList.find(item=>item.id===button.dataset.id);if(project&&confirm(`Projekt „${project.title}“ löschen?`)){projectList=projectList.filter(item=>item.id!==project.id);if(activeProjectId===project.id)activeProjectId=projectList[0]?.id||null;persist();render();}}));

    document.querySelectorAll(".project-tab").forEach(button=>button.addEventListener("click",()=>{projectTab=button.dataset.tab;render();}));
    document.getElementById("goContents")?.addEventListener("click",()=>{projectTab="contents";render();});
    document.getElementById("openProjectContents")?.addEventListener("click",()=>{projectTab="contents";currentView="project";render();});
    document.getElementById("addProjectContent")?.addEventListener("click",contentPicker);
    document.querySelectorAll(".remove-project-content").forEach(button=>button.addEventListener("click",()=>{patchActiveProject(Universe.removeAsset(activeProject(),button.dataset.id));render();}));
    document.querySelectorAll("[data-page-id]").forEach(button=>button.addEventListener("click",()=>openPage(button.dataset.pageId)));

    document.getElementById("backHome")?.addEventListener("click",goHome);
    document.getElementById("backProject")?.addEventListener("click",()=>{currentView="project";projectTab="pages";render();});
    document.getElementById("cancelPage")?.addEventListener("click",()=>{currentView="project";projectTab="pages";render();});
    document.getElementById("pageForm")?.addEventListener("submit",event=>{event.preventDefault();const project=activeProject(),page=activePage();const updated=Projects.updatePage(project,page.id,{title:document.getElementById("pageTitle").value,category:document.getElementById("pageCategory").value,status:document.getElementById("pageStatus").value,notes:document.getElementById("pageNotes").value});patchActiveProject(Projects.touchProject(updated,page.id));render();UI.toast("Seite gespeichert");});
    const move=direction=>{const project=activeProject(),page=activePage();const index=project.pagesData.findIndex(item=>item.id===page.id);openPage(project.pagesData[Math.max(0,Math.min(project.pagesData.length-1,index+direction))].id);};
    document.getElementById("previousPage")?.addEventListener("click",()=>move(-1));
    document.getElementById("nextPage")?.addEventListener("click",()=>move(1));

    document.getElementById("renameProject")?.addEventListener("click",()=>{const project=activeProject();const title=prompt("Neuer Projekttitel:",project.title);if(title!==null){patchActiveProject(Projects.renameProject(project,title));render();}});
    document.getElementById("backupProject")?.addEventListener("click",()=>{const project=activeProject();UI.downloadFile(`${project.title.replace(/[^a-z0-9äöüß]+/gi,"_")}.caps.json`,JSON.stringify(project,null,2),"application/json");});
    document.getElementById("restoreProjectButton")?.addEventListener("click",()=>document.getElementById("restoreProjectFile").click());
    document.getElementById("restoreProjectFile")?.addEventListener("change",event=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const project=JSON.parse(reader.result);if(!Projects.validateProject(project))throw new Error("Ungültiges Format");const imported=Projects.cloneProject(project);imported.title=project.title+" – Wiederhergestellt";projectList.unshift(imported);persist();render();}catch(error){alert("Wiederherstellung fehlgeschlagen: "+error.message);}};reader.readAsText(file);event.target.value="";});
    document.getElementById("quickContinue")?.addEventListener("click",()=>{const project=activeProject();if(project.lastActivePageId)openPage(project.lastActivePageId);});
  }

  window.CAPS={name:"CAPS Studio",version:"5.1.0-a2.2.1",sprint:"A.2.2.1"};
  render();
})();
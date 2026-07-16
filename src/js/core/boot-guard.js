(function(){
"use strict";

function showStartupError(message){
  const root=document.getElementById("app");
  if(!root)return;
  root.innerHTML=`
    <main style="max-width:760px;margin:40px auto;padding:20px;font-family:Arial,sans-serif">
      <section style="background:#fff;border:1px solid #dce2e9;border-radius:16px;padding:22px;box-shadow:0 8px 30px rgba(15,23,42,.08)">
        <p style="font-size:12px;font-weight:800;letter-spacing:.12em;color:#b45309">STARTSCHUTZ</p>
        <h1 style="margin:5px 0 10px">CAPS konnte nicht vollständig starten</h1>
        <p style="line-height:1.55;color:#667085">${String(message||"Unbekannter Fehler")}</p>
        <button id="capsRepairStorage" style="border:0;border-radius:10px;padding:12px 16px;background:#2f6fed;color:#fff;font-weight:800;cursor:pointer">Lokale Projektdaten reparieren</button>
      </section>
    </main>`;
  document.getElementById("capsRepairStorage")?.addEventListener("click",()=>{
    localStorage.removeItem("caps-active-project-id");
    location.reload();
  });
}

window.CAPS_showStartupError=showStartupError;
window.addEventListener("error",event=>{
  console.error("CAPS startup error:",event.error||event.message);
  showStartupError(event.error?.message||event.message);
});
window.addEventListener("unhandledrejection",event=>{
  console.error("CAPS unhandled rejection:",event.reason);
  showStartupError(event.reason?.message||String(event.reason));
});

try{
  const storageKey="caps-studio-projects-v5-1-a1";
  const raw=localStorage.getItem(storageKey);
  if(!raw)return;
  const projects=JSON.parse(raw);
  if(!Array.isArray(projects))return;

  const styleDefaults={
    name:"Warmherzige magische Kinderbuchillustration",
    technique:"Digitale Kinderbuchillustration",
    colorMode:"Farbe",
    detailLevel:"Mittel",
    colorIntensity:"Sanft",
    backgroundStyle:"Detailreicher Hintergrund",
    lighting:"Warmes, weiches Licht",
    lineStyle:"Weiche, klare Konturen",
    texture:"Leicht malerisch",
    description:"hochwertige Kinderbuchkunst, weiche Formen, klare Mimik, freundlich und altersgerecht",
    palette:"warme Gold-, Grün-, Blau- und Rottöne mit sanften Kontrasten",
    aspectRatio:"3:2"
  };
  const passportDefaults={
    skinTone:"hell bis mittel",
    bodyType:"altersgerecht und natürlich",
    height:"altersgerecht",
    hairColor:"",
    hairLength:"",
    hairstyle:"",
    eyeColor:"",
    top:"",
    bottom:"",
    shoes:"",
    accessories:"",
    appearanceDescription:"",
    definingFeatures:""
  };

  const characterDefaults={appearanceDescription:"",relationship:"",hairColor:"",hairLength:"",hairstyle:"",eyeColor:"",skinTone:"",bodyType:"",height:"",clothing:"",bottom:"",shoes:"",accessories:"",specialFeatures:""};
  projects.forEach(project=>{
    if(project.bookBrief?.characters)project.bookBrief.characters=project.bookBrief.characters.map(character=>({...characterDefaults,...character}));
    if(project.bookPlan?.characters)project.bookPlan.characters=project.bookPlan.characters.map(character=>({...characterDefaults,...character}));
    if(project.layout){
      project.layout.settings={pageFormat:"A4 Querformat",textPosition:"bottom",fontFamily:"Georgia",bodyFontSize:20,titleFontSize:30,showPageNumbers:true,author:"",...(project.layout.settings||{})};
      project.layout.spreads=Array.isArray(project.layout.spreads)?project.layout.spreads:[];
    }

    if(project.manuscript){
      project.manuscript.settings={readingLevel:"3–6 Jahre",voice:"Warm und abenteuerlich",dialogueLevel:"Ausgewogen",sceneLength:"Mittel",refrain:"Zusammen finden wir einen Weg.",...(project.manuscript.settings||{})};
      project.manuscript.scenes=Array.isArray(project.manuscript.scenes)?project.manuscript.scenes.map(scene=>({...scene,variation:Number(scene.variation)||0,history:Array.isArray(scene.history)?scene.history:[]})):[];
    }
    if(project.illustrations){
      project.illustrations.style={...styleDefaults,...(project.illustrations.style||{})};
      project.illustrations.characterPassports=(project.illustrations.characterPassports||[]).map(passport=>({
        ...passportDefaults,
        ...passport,
        hairColor:passport.hairColor||passport.hair||"",
        hairstyle:passport.hairstyle||passport.hair||"",
        eyeColor:passport.eyeColor||passport.eyes||"",
        top:passport.top||passport.clothes||""
      }));
      project.illustrations.items=Array.isArray(project.illustrations.items)?project.illustrations.items:[];
    }
  });

  localStorage.setItem(storageKey,JSON.stringify(projects));

  const activeId=localStorage.getItem("caps-active-project-id");
  const active=projects.find(project=>project.id===activeId);
  if(activeId&&(!active||!active.bookPlan)){
    const usable=projects.find(project=>project.bookPlan);
    if(usable)localStorage.setItem("caps-active-project-id",usable.id);
    else localStorage.removeItem("caps-active-project-id");
  }
}catch(error){
  console.warn("CAPS migration warning:",error);
}
})();
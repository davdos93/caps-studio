(function(){
"use strict";
const uid=p=>`${p}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const text=(v,f="")=>String(v??"").trim()||f;

function characterPassport(character,index){
  const presets=[
    {hair:"dunkelblondes, kurzes Haar",eyes:"braune Augen",clothes:"roter Hoodie, blaue Jeans, grüne Turnschuhe",feature:"runde Wangen, freundlicher Blick"},
    {hair:"hellbraunes, schulterlanges Haar",eyes:"große braune Augen",clothes:"gelbe Jacke, violette Hose, kleine rote Schuhe",feature:"klein, fröhlich, neugieriger Gesichtsausdruck"},
    {hair:"keine Haare",eyes:"große goldene Augen",clothes:"keine Kleidung",feature:"kleiner roter Drache, kurze Flügel, zwei kleine Hörner"}
  ];
  const preset=presets[index]||{hair:"charaktertypisches Aussehen",eyes:"ausdrucksstarke Augen",clothes:"gleichbleibende Kleidung",feature:text(character.description,"klar erkennbare Merkmale")};
  return {
    id:character.id,
    name:character.name,
    role:character.role,
    age:character.age,
    skinTone:text(character.skinTone,"hell bis mittel"),
    bodyType:text(character.bodyType,"altersgerecht und natürlich"),
    height:text(character.height,"altersgerecht"),
    hairColor:text(character.hairColor,preset.hair),
    hairLength:text(character.hairLength,"passend zur Figur"),
    hairstyle:text(character.hairstyle,preset.hair),
    eyeColor:text(character.eyeColor,preset.eyes),
    top:text(character.clothing||character.top,preset.clothes),
    bottom:text(character.bottom,"passend zur Figur"),
    shoes:text(character.shoes,"passend zur Figur"),
    accessories:text(character.accessories,""),
    hair:preset.hair,
    eyes:preset.eyes,
    clothes:preset.clothes,
    appearanceDescription:text(character.appearanceDescription,""),
    definingFeatures:text(character.specialFeatures||character.definingFeatures||character.description,preset.feature),
    consistencyRule:`${character.name} muss auf allen Bildern mit denselben Gesichtsmerkmalen, Farben und Kleidungsstücken erscheinen.`
  };
}

function buildPrompt(scene,plan,style,passports){
  const visible=passports.filter(p=>(scene.characters||[]).includes(p.name));
  const characterText=visible.map(p=>`${p.name}: ${p.age||p.role}, Haut: ${p.skinTone}, Körperbau: ${p.bodyType}, Größe: ${p.height}, Haarfarbe: ${p.hairColor}, Haarlänge: ${p.hairLength}, Frisur: ${p.hairstyle}, Augenfarbe: ${p.eyeColor}, Oberteil: ${p.top}, Unterteil: ${p.bottom}, Schuhe: ${p.shoes}, Accessoires: ${p.accessories||"keine"}, freie Aussehensbeschreibung: ${p.appearanceDescription||"keine zusätzliche Beschreibung"}, Merkmale: ${p.definingFeatures}`).join("; ");
  return [
    `Kinderbuchillustration als breite Doppelseite im Format 3:2.`,
    `Stil: ${style.name}. Technik: ${style.technique}. Farbmodus: ${style.colorMode}. Detailgrad: ${style.detailLevel}. Farbintensität: ${style.colorIntensity}. Hintergrund: ${style.backgroundStyle}. Licht: ${style.lighting}. Linien: ${style.lineStyle}. Textur: ${style.texture}. ${style.description}`,
    `Szene: ${scene.illustrationIdea}`,
    `Exakte Handlung der Szene: ${scene.fullText||scene.sceneText||scene.goal||""}`,
    `Zentrale Handlung: ${scene.goal||""}`,
    `Konflikt oder Wendepunkt: ${scene.conflict||""}`,
    `Ergebnis der Szene: ${scene.result||""}`,
    `Ort: ${scene.location}.`,
    `Figuren: ${characterText||"keine Hauptfigur sichtbar"}.`,
    `Handlung und Gefühl: ${scene.goal} ${scene.result}`,
    `Psychologische Funktion: ${scene.psychologicalFunction||"Die emotionale Entwicklung der Szene sichtbar machen"}.`,
    `Gefühlslage: ${scene.emotionalState||""}. Die Emotion durch Mimik, Körperhaltung, Abstand und Blickrichtung zeigen, nicht durch Symbole oder Text erklären.`,
    `Hilfreicher Handlungsschritt: ${scene.copingStrategy||""}. Unterstützende Figuren geben Sicherheit, übernehmen aber nicht die entscheidende Handlung.`,
    `Kamera: ${scene.camera||"Halbtotale auf Augenhöhe der Kinder"}.`,
    `Licht: ${scene.light||"warmes, weiches, freundliches Licht"}.`,
    `Farbwelt: ${style.palette}.`,
    `Komposition: Die Illustration muss die konkrete Handlung des Szenentextes präzise zeigen. Alle im Text handelnden Figuren, Objekte, Gesten, Blickrichtungen und räumlichen Beziehungen müssen korrekt dargestellt werden. Wichtige Gesichter frei sichtbar, ruhiger Bereich für späteren Buchtext, keine Schrift im Bild.`,
    `Konsistenz: alle Figuren exakt nach ihren Charakterpässen darstellen.`,
    `Vermeiden: Handlungen oder Gegenstände erfinden, Figuren weglassen, falsche Blickrichtungen, falsche Positionen, zusätzliche Gliedmaßen, vertauschte Kleidung, wechselnde Haarfarben, Text, Logos, Wasserzeichen, gruselige oder drastische Darstellung.`
  ].join("\n");
}

function generate(plan){
  const style={
    id:uid("STYLE"),
    name:"Warmherzige magische Kinderbuchillustration",
    technique:"Digitale Kinderbuchillustration",
    colorMode:"Farbe",
    detailLevel:"Mittel",
    colorIntensity:"Sanft",
    backgroundStyle:"Detailreicher Hintergrund",
    lighting:"Warmes, weiches Licht",
    lineStyle:"Weiche, klare Konturen",
    texture:"Leicht malerisch",
    description:"hochwertige digital gemalte Kinderbuchkunst, weiche Formen, klare Mimik, detailreich aber nicht überladen, freundlich und altersgerecht",
    palette:"warme Gold-, Grün-, Blau- und Rottöne mit sanften Kontrasten",
    aspectRatio:"3:2",
    consistencyRule:"Stil, Strichführung, Licht und Farbpalette bleiben im gesamten Buch unverändert."
  };
  const passports=(plan.characters||[]).map(characterPassport);
  const items=(plan.scenes||[]).map(scene=>({
    id:uid("ILL"),
    sceneId:scene.id,
    sceneNumber:scene.number,
    chapterNumber:scene.chapterNumber,
    title:scene.title,
    location:scene.location,
    characters:scene.characters||[],
    camera:"Halbtotale auf Augenhöhe der Kinder",
    light:"warmes, weiches Licht",
    mood:scene.messageMoment?"Geborgenheit und Zusammenhalt":"Staunen und kindgerechte Spannung",
    composition:"breite Doppelseite mit geschütztem Textbereich",
    prompt:"",
    negativePrompt:"Text, Logo, Wasserzeichen, zusätzliche Finger, zusätzliche Gliedmaßen, wechselnde Kleidung, inkonsistente Gesichter, Horror, Gewalt",
    status:"planned",
    imageData:null,
    imageName:"",
    approved:false,
    notes:""
  }));
  items.forEach(item=>{
    const scene=(plan.scenes||[]).find(s=>s.id===item.sceneId);
    item.prompt=buildPrompt(scene,plan,style,passports);
  });
  return {
    schemaVersion:"1.0",
    generatedAt:new Date().toISOString(),
    generator:"CAPS Illustration Engine 1.2 – handlungs- und emotionsgenaue Bildbriefs",
    style,
    characterPassports:passports,
    items,
    progress:0
  };
}

function recalc(project){
  const illustrations=project.illustrations;
  const total=illustrations.items.length||1;
  const approved=illustrations.items.filter(item=>item.approved).length;
  illustrations.progress=Math.round(approved/total*100);
  project.illustrationStatus=illustrations.progress===100?"approved":"draft";
  return project;
}

function enrichSceneFromManuscript(project,scene){
  const manuscriptScene=project.manuscript?.scenes?.find(item=>item.sceneId===scene.id);
  if(!manuscriptScene)return scene;
  return {...scene,fullText:manuscriptScene.text||"",sceneText:manuscriptScene.text||""};
}

function rebuildPrompts(project){
  const ill=project.illustrations;
  if(!ill)return project;
  ill.items.forEach(item=>{
    const baseScene=(project.bookPlan.scenes||[]).find(s=>s.id===item.sceneId);
    const scene=enrichSceneFromManuscript(project,baseScene);
    item.prompt=buildPrompt(scene,project.bookPlan,ill.style,ill.characterPassports);
  });
  return project;
}
window.CAPS_IllustrationEngine={generate,recalc,rebuildPrompts};
})();
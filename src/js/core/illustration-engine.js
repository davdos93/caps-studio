(function(){
"use strict";

const clean=value=>String(value??"").replace(/\r/g,"").trim();
const lower=value=>clean(value).toLocaleLowerCase("de-DE");
const words=value=>clean(value).split(/\s+/).filter(Boolean);
const wordCount=value=>words(value).length;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const uid=prefix=>`${prefix}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const deepClone=value=>JSON.parse(JSON.stringify(value));
const hash=value=>{let h=2166136261;for(const ch of clean(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
const sentenceList=value=>(clean(value).match(/[^.!?…]+(?:[.!?…]+[„“"'’)]*|$)/g)||[]).map(item=>item.trim()).filter(Boolean);

const PAGE_TYPES={
  opening:"Eröffnende Weltszene",everyday:"Figur im vertrauten Alltag",problem:"Emotionaler Problemmoment",
  departure:"Schwellen- und Aufbruchsszene",discovery:"Enthüllungsbild",relationship:"Beziehungsbild",
  setback:"Aktions- und Reaktionsbild",quiet:"Intime Ruhepassage",practice:"Handlungs- oder Übungsbild",
  danger:"Dynamische Spannungsszene",climax:"Vollflächiger Höhepunkt",return:"Rückweg und Entspannung",
  echo:"Gespiegelter Alltag",ending:"Ruhiges Schlussbild"
};

const SHOT_LABELS={
  "extreme-wide":"Sehr weite Totale","wide":"Totale","full":"Ganzkörperaufnahme","medium":"Halbtotale",
  "two-shot":"Zweieraufnahme","medium-close":"Nahe Halbaufnahme","close":"Nahaufnahme",
  "over-shoulder":"Über-die-Schulter","low-wide":"Dynamische Untersicht-Totale","top-down":"Sanfte Aufsicht"
};

const SHOT_BY_ROLE={
  opening:["wide","extreme-wide","medium"],everyday:["medium","full","wide"],problem:["medium-close","close","two-shot"],
  departure:["wide","over-shoulder","full"],discovery:["over-shoulder","wide","medium"],relationship:["two-shot","medium-close","medium"],
  setback:["full","medium","top-down"],quiet:["close","medium-close","two-shot"],practice:["medium","full","two-shot"],
  danger:["low-wide","full","wide"],climax:["low-wide","wide","full"],return:["wide","medium","over-shoulder"],
  echo:["medium","two-shot","full"],ending:["wide","two-shot","medium-close"]
};

const LIGHT_BY_ROLE={
  opening:"warmes, einladendes Morgen- oder Nachmittagslicht",everyday:"natürliches, vertrautes Alltagslicht",
  problem:"sanft gebündeltes Licht mit zurückhaltendem Kontrast",departure:"heller werdendes Licht in Bewegungsrichtung",
  discovery:"gerichtetes Licht, das die Entdeckung sichtbar macht",relationship:"weiches Licht auf Gesichtern und Händen",
  setback:"etwas kühleres Licht mit klaren Formen, ohne bedrohlich zu wirken",quiet:"ruhiges, diffuses Licht mit weichen Schatten",
  practice:"freundliches, klares Licht",danger:"spannungsvolles Licht mit sicheren, kindgerechten Kontrasten",
  climax:"leuchtendes, dramatisches Licht am entscheidenden Handlungsmoment",return:"warmes Licht mit abnehmender Spannung",
  echo:"vertrautes Licht, das den Anfang subtil spiegelt",ending:"goldenes, ruhiges Schlusslicht"
};

const PALETTE_BY_ROLE={
  opening:"offene, warme Grundpalette",everyday:"vertraute, harmonische Farben",problem:"leicht gedämpfte Farben mit warmem Halt",
  departure:"frischere Farben und ein heller Akzent in Bewegungsrichtung",discovery:"ein klarer neuer Farbakzent am Fund",
  relationship:"warme Hauttöne und verbindende Farbwiederholungen",setback:"etwas kühlere Zwischentöne bei erhaltenen Sicherheitsfarben",
  quiet:"sanfte, reduzierte Palette",practice:"ausgewogene, aktive Farbpalette",danger:"kräftigere Kontraste ohne düstere Härte",
  climax:"höchste Farbklarheit und stärkster Lichtakzent des Buches",return:"wärmer werdende Rückkehrfarben",
  echo:"Farben des Anfangs, nun ruhiger und sicherer",ending:"warme Abschlussfarben mit einem leisen Motivakzent"
};

const FLOW_BY_ROLE={
  opening:"von außen zur Hauptfigur und dann sanft nach rechts",everyday:"ruhige Bewegung von links nach rechts",problem:"Blickführung nach innen zur Hauptfigur",
  departure:"deutliche Bewegung von links nach rechts in Richtung Umblättern",discovery:"Blick der Figur führt nach rechts zur Entdeckung",
  relationship:"Blickführung zwischen den Figuren und zurück zur Mitte",setback:"kurze Gegenbewegung von rechts nach links als visueller Widerstand",
  quiet:"kreisförmige, ruhige Blickführung um Gesicht und Hände",practice:"klare Schrittfolge von links nach rechts",
  danger:"diagonale Bewegung nach rechts mit sicherem Gegenhalt",climax:"starke Diagonale zur entscheidenden Handlung und danach zum Seitenrand",
  return:"weite Bewegung zurück in eine vertraute Umgebung",echo:"gleiche Grundrichtung wie am Anfang, aber ruhiger",
  ending:"Blickführung nach innen; das Auge darf auf der Doppelseite zur Ruhe kommen"
};

function styleDefaults(input={}){
  return {
    id:input.id||uid("STYLE"),name:"Warmherzige magische Kinderbuchillustration",technique:"Digitale Kinderbuchillustration",
    colorMode:"Farbe",detailLevel:"Mittel",colorIntensity:"Sanft",backgroundStyle:"Detailreicher Hintergrund",
    lighting:"Warmes, weiches Licht",lineStyle:"Weiche, klare Konturen",texture:"Leicht malerisch",
    description:"hochwertige digital gemalte Kinderbuchkunst, weiche Formen, klare Mimik, detailreich aber nicht überladen, freundlich und altersgerecht",
    palette:"warme Gold-, Grün-, Blau- und Rottöne mit sanften Kontrasten",aspectRatio:"3:2",
    consistencyRule:"Stil, Strichführung, Licht und Farbpalette bleiben im gesamten Buch unverändert.",...input
  };
}

function characterPassport(character,index){
  const presets=[
    {hair:"dunkelblondes, kurzes Haar",eyes:"braune Augen",clothes:"roter Hoodie, blaue Jeans, grüne Turnschuhe",feature:"runde Wangen, freundlicher Blick"},
    {hair:"hellbraunes, schulterlanges Haar",eyes:"große braune Augen",clothes:"gelbe Jacke, violette Hose, kleine rote Schuhe",feature:"klein, fröhlich, neugieriger Gesichtsausdruck"},
    {hair:"keine Haare",eyes:"große goldene Augen",clothes:"keine Kleidung",feature:"kleiner roter Drache, kurze Flügel, zwei kleine Hörner"}
  ];
  const preset=presets[index]||{hair:"charaktertypisches Aussehen",eyes:"ausdrucksstarke Augen",clothes:"gleichbleibende Kleidung",feature:clean(character.description)||"klar erkennbare Merkmale"};
  const appearance=clean(character.appearanceDescription);
  return {
    id:character.id||uid("CHAR"),name:character.name||`Figur ${index+1}`,role:character.role||"Begleitfigur",age:character.age||"",
    skinTone:clean(character.skinTone)||"hell bis mittel",bodyType:clean(character.bodyType)||"altersgerecht und natürlich",height:clean(character.height)||"altersgerecht",
    hairColor:clean(character.hairColor)||preset.hair,hairLength:clean(character.hairLength)||"passend zur Figur",hairstyle:clean(character.hairstyle)||preset.hair,
    eyeColor:clean(character.eyeColor)||preset.eyes,top:clean(character.clothing||character.top)||preset.clothes,bottom:clean(character.bottom)||"passend zur Figur",
    shoes:clean(character.shoes)||"passend zur Figur",accessories:clean(character.accessories),hair:preset.hair,eyes:preset.eyes,clothes:preset.clothes,
    appearanceDescription:appearance,definingFeatures:clean(character.specialFeatures||character.definingFeatures||character.description)||preset.feature,
    consistencyRule:`${character.name||`Figur ${index+1}`} muss auf allen Bildern mit denselben Gesichtsmerkmalen, Farben, Proportionen und Kleidungsstücken erscheinen.`
  };
}

function ensureLayout(project){
  if(!project.manuscript)throw new Error("Für die Bilddramaturgie wird zuerst ein Manuskript benötigt.");
  if(!project.layout)CAPS_LayoutEngine.generate(project);
  else CAPS_LayoutEngine.migrate(project);
  return project.layout;
}

function count(text,pattern){return (lower(text).match(pattern)||[]).length;}

function sentenceAnalysis(text){
  const value=clean(text),l=lower(value);
  const action=count(value,/\b(lief|rannte|sprang|kletterte|stürzte|zog|öffnete|packte|folgte|eilte|schob|hob|griff|warf|drehte|drückte|hielt|nahm|stellte|schlich|trat|stieg|fing|entdeckte|zeigte|legte|reichte|fand)\b/g);
  const emotion=count(value,/\b(angst|ängstlich|traurig|wütend|mutig|zitterte|weinte|lachte|freute|hoffte|erschrak|erleichtert|stolz|unsicher|staunte|lächelte|vermisste|ruhig)\b/g);
  const sensory=count(value,/\b(roch|duftete|klang|hörte|fühlte|kalt|warm|rau|weich|hell|dunkel|glitzerte|raschelte|knisterte|leuchtete|schimmerte)\b/g);
  const reveal=count(value,/\b(entdeckte|bemerkte|sah|hörte|fand|hinter|unter|öffnete|zeigte|erschien|plötzlich)\b/g);
  const dialogue=(value.match(/[„“]/g)||[]).length/2;
  const concrete=count(value,/\b(hand|hände|tür|fenster|weg|stein|licht|baum|wasser|tasche|brief|karte|schlüssel|feder|laterne|kompass|muschel|drache|tier|seil|brücke|haus|wald|himmel)\b/g);
  const abstract=count(value,/\b(erkannte|verstand|wusste|bedeutete|entwicklung|gefühl|gedanke|eigenschaft|strategie|wichtig)\b/g);
  return {action,emotion,sensory,reveal,dialogue,concrete,abstract,words:wordCount(value),question:(value.match(/\?/g)||[]).length,exclamation:(value.match(/!/g)||[]).length};
}

function momentScore(text,role,layoutText,names){
  const a=sentenceAnalysis(text),l=lower(text);let score=8;
  score+=a.action*8+a.emotion*5+a.sensory*4+a.reveal*7+a.dialogue*3+a.concrete*3+a.exclamation*2+a.question;
  score-=a.abstract*7;if(a.words<4)score-=10;if(a.words>34)score-=Math.round((a.words-34)/3);
  if(names.some(name=>name&&l.includes(lower(name))))score+=7;
  if(!lower(layoutText).includes(l.slice(0,Math.min(35,l.length))))score+=5;
  if(role==="climax")score+=a.action*6+a.reveal*3;
  if(role==="relationship")score+=a.dialogue*5+a.emotion*3;
  if(role==="quiet")score+=a.sensory*4+a.emotion*2-a.action*2;
  if(role==="discovery")score+=a.reveal*6+a.sensory*2;
  if(role==="problem")score+=a.emotion*5;
  if(role==="departure"||role==="danger")score+=a.action*4;
  if(role==="ending")score+=a.emotion*3+a.sensory*3-a.exclamation*2;
  return score;
}

function chooseMoment(spread,plan){
  const names=(plan.characters||[]).map(character=>character.name).filter(Boolean);
  const candidates=sentenceList(spread.sourceText||spread.pictureBookText||spread.layoutText||spread.text);
  if(!candidates.length)return {text:clean(spread.layoutText||spread.text),score:0,reason:"zentraler Moment der Doppelseite",sourceIndex:0,complementary:false};
  const rows=candidates.map((text,index)=>({text,index,score:momentScore(text,spread.role,spread.layoutText||spread.text||"",names),analysis:sentenceAnalysis(text)})).sort((a,b)=>b.score-a.score);
  const best=rows[0];
  let reason="klar sichtbare Handlung";
  if(best.analysis.reveal>0)reason="stärkster Entdeckungs- oder Wendepunkt";
  else if(best.analysis.action>0&&best.analysis.emotion>0)reason="Handlung und Gefühl treffen im selben Moment zusammen";
  else if(best.analysis.dialogue>0)reason="Beziehung wird durch Blick, Haltung und Dialog sichtbar";
  else if(best.analysis.emotion>0)reason="stärkster emotional sichtbarer Moment";
  else if(best.analysis.sensory>0)reason="besonders bildhafte Sinneswahrnehmung";
  const token=lower(best.text).slice(0,Math.min(35,best.text.length));
  return {text:best.text,score:Math.max(0,Math.round(best.score)),reason,sourceIndex:best.index,complementary:!lower(spread.layoutText||spread.text||"").includes(token)};
}

function sourceScenes(project,spread){
  const ids=new Set(spread.sourceSceneIds||[]);
  return (project.bookPlan?.scenes||[]).filter(scene=>ids.has(scene.id)||scene.id===spread.sceneId);
}

function visibleCharacters(project,spread,moment){
  const planCharacters=project.bookPlan?.characters||[];
  const text=lower(`${moment.text} ${spread.sourceText||""}`);
  let visible=planCharacters.filter(character=>character.name&&text.includes(lower(character.name)));
  if(!visible.length){
    const named=new Set(sourceScenes(project,spread).flatMap(scene=>scene.characters||[]));
    visible=planCharacters.filter(character=>named.has(character.name));
  }
  if(!visible.length&&planCharacters[0])visible=[planCharacters[0]];
  return visible.map(character=>character.name);
}

function inferLocation(project,spread){
  const scenes=sourceScenes(project,spread),counts=new Map();
  scenes.forEach(scene=>{const location=clean(scene.location);if(location)counts.set(location,(counts.get(location)||0)+1)});
  return [...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||spread.sourceChapterTitles?.[0]||"Ort der Doppelseite";
}

function inferEmotion(text,role){
  const l=lower(text);
  if(/angst|ängstlich|zitterte|erschrak/.test(l))return "vorsichtige Angst, die im Gesicht und in einer angespannten Körperhaltung sichtbar ist";
  if(/traurig|weinte|vermisste/.test(l))return "leise Traurigkeit mit weichem, glaubwürdigem Ausdruck";
  if(/wütend|ärger|frust/.test(l))return "kindgerechter Ärger mit klarer Spannung in Schultern und Händen";
  if(/lachte|freute|stolz|erleichtert/.test(l))return "sichtbare Freude und Erleichterung ohne übertriebene Pose";
  if(/staunte|entdeckte|fand|bemerkte/.test(l))return "neugieriges Staunen mit offenem Blick";
  if(role==="climax")return "höchste Konzentration, Mut und entschlossene Aufmerksamkeit";
  if(role==="quiet"||role==="ending")return "Ruhe, Geborgenheit und ein natürliches Nachlassen der Spannung";
  if(role==="danger"||role==="setback")return "kindgerechte Anspannung mit erkennbarer Sicherheit und Handlungsfähigkeit";
  return "klare, natürliche und altersgerechte Gefühlslage";
}

function bodyLanguage(emotion,role){
  const l=lower(emotion);
  if(l.includes("angst"))return "Körper leicht zurückgenommen, Hände suchen Halt, Blick bleibt dennoch beim Geschehen";
  if(l.includes("traur"))return "Schultern weich gesenkt, Hände nah am Körper, Gesicht offen sichtbar";
  if(l.includes("ärger"))return "fester Stand, gespannte Hände, deutliche aber nicht aggressive Mimik";
  if(l.includes("freude")||l.includes("erleichter"))return "gelöste Schultern, offene Hände und ein glaubwürdiges Lächeln";
  if(role==="climax")return "stabiler Stand, aktive Hände und eine klare, selbst ausgeführte Entscheidung";
  if(role==="relationship")return "Figuren wenden Oberkörper und Blick einander zu; Nähe entsteht ohne starre Pose";
  return "Körperhaltung folgt der konkreten Handlung; Hände, Füße und Blickrichtung sind anatomisch nachvollziehbar";
}

function chooseShot(role,index,previousDirections=[]){
  const preferred=SHOT_BY_ROLE[role]||["medium","wide","close"];
  const recent=previousDirections.slice(-2).map(direction=>direction.shot);
  const available=preferred.filter(shot=>!recent.includes(shot));
  return (available.length?available:preferred)[index%Math.max(1,(available.length?available:preferred).length)];
}

function cameraAngle(role,shot){
  if(shot==="top-down")return "sanfte Aufsicht, ohne die Figur klein oder hilflos wirken zu lassen";
  if(shot==="low-wide"||role==="climax")return "leichte Untersicht auf Augenhöhe des Kindes, kraftvoll aber nicht heroisch überhöht";
  if(role==="danger")return "leicht dynamische Perspektive auf Augenhöhe der Kinder";
  if(shot==="over-shoulder")return "über die Schulter der Hauptfigur zur Entdeckung";
  return "auf Augenhöhe der Kinder";
}

function effectiveTextPosition(spread){
  return spread.textPosition&&spread.textPosition!=="inherit"?spread.textPosition:(spread.composition?.recommendedPosition||"bottom");
}

function spatialPlan(spread,role){
  const textPosition=effectiveTextPosition(spread);
  const textSafeZone=textPosition==="left"?"linkes Drittel":textPosition==="right"?"rechtes Drittel":"unteres Viertel";
  const subjectPlacement=textPosition==="left"?"Hauptfiguren im rechten und mittleren Bildbereich":textPosition==="right"?"Hauptfiguren im linken und mittleren Bildbereich":"Hauptfiguren im oberen und mittleren Bildbereich";
  const noTextZone="Gesichter, Hände, zentrale Handlung und Blickachsen niemals mit dem Textbereich überlagern";
  const depthPlan=role==="quiet"?"ruhiger Vordergrund, klare Figurenebene, weich vereinfachter Hintergrund":"ein rahmendes Vordergrundelement, klare Handlung in der Mittelebene und ein lesbarer, erzählender Hintergrund";
  return {textPosition,textSafeZone,subjectPlacement,noTextZone,depthPlan};
}

function gazePlan(role,characters,moment){
  const hero=characters[0]||"Hauptfigur";
  if(role==="relationship")return `${hero} und die wichtigste Begleitfigur sehen einander an; die Blicklinie bleibt innerhalb der Doppelseite`;
  if(role==="departure"||role==="discovery"||role==="danger"||role==="climax")return `${hero} blickt zur Handlung oder Entdeckung rechts im Bild und führt das Auge in Richtung Umblättern`;
  if(role==="problem")return `${hero}s Blick zeigt das Problem, während eine sichere Figur oder ein vertrauter Gegenstand als Gegenhalt sichtbar bleibt`;
  if(role==="ending")return `${hero} blickt zu einer vertrauten Figur oder zum wiederkehrenden Motiv; keine Blicklinie führt aus dem Buch hinaus`;
  return `Alle Figuren blicken nachvollziehbar zur handelnden Person, zum Gegenstand oder zueinander; ${moment.reason}`;
}

function continuityBridge(project,spread,index,characters){
  const motif=clean(project.bookPlan?.storyTreatment?.motif?.name||project.bookPlan?.treatment?.motif?.name);
  const previous=index>0?project.layout.spreads[index-1]:null;
  const parts=[];
  if(previous)parts.push(`Farben, Wetter, Tageszeit und Figurenpositionen nachvollziehbar aus Doppelseite ${index} weiterführen`);
  if(motif)parts.push(`${motif} nur zeigen, wenn es in diesem Abschnitt vorkommt; Form und Farbe im ganzen Buch unverändert halten`);
  if(characters.length)parts.push(`${characters.join(" und ")} mit identischen Proportionen, Kleidung und Erkennungsmerkmalen darstellen`);
  return parts.join(". ")||"Stil, Figuren und räumliche Logik aus der vorherigen Doppelseite fortführen";
}

function pagePriority(role,spread){
  if(role==="climax")return "höchste visuelle Priorität des gesamten Buches";
  if(["opening","danger","ending","discovery"].includes(role))return "hohe visuelle Priorität";
  if((spread.composition?.imageShare||60)>=75)return "hohe visuelle Priorität";
  return "ausgewogene visuelle Priorität";
}

function directionFor(project,spread,index,previousDirections=[]){
  const moment=chooseMoment(spread,project.bookPlan||{}),characters=visibleCharacters(project,spread,moment),role=spread.role||"everyday";
  const shot=chooseShot(role,index,previousDirections),spatial=spatialPlan(spread,role),emotion=inferEmotion(moment.text,role);
  const motif=clean(project.bookPlan?.storyTreatment?.motif?.name||project.bookPlan?.treatment?.motif?.name);
  return {
    pageType:PAGE_TYPES[role]||"Erzählende Doppelseite",shot,shotLabel:SHOT_LABELS[shot]||shot,cameraAngle:cameraAngle(role,shot),
    framing:shot==="close"?"Gesicht und Hände bilden den emotionalen Schwerpunkt":shot==="wide"||shot==="extreme-wide"||shot==="low-wide"?"Figuren bleiben klar lesbar, während der Ort erzählerisch mitwirkt":"Figuren und konkrete Handlung sind gemeinsam vollständig sichtbar",
    focalMoment:moment.text,focalReason:moment.reason,focalScore:moment.score,complementaryMoment:moment.complementary,
    focalPoint:`${characters[0]||"Hauptfigur"} im Moment: ${moment.text}`,characters,location:inferLocation(project,spread),
    subjectPlacement:spatial.subjectPlacement,visualFlow:FLOW_BY_ROLE[role]||"ruhige Blickführung von links nach rechts",
    gazeDirection:gazePlan(role,characters,moment),emotion,bodyLanguage:bodyLanguage(emotion,role),
    foreground:role==="quiet"?"ein weiches, unaufdringliches Rahmenelement":"ein passendes Objekt oder Umgebungselement als räumlicher Einstieg",
    midground:"Hauptfiguren und entscheidende Handlung klar getrennt und vollständig sichtbar",background:"Ort mit wenigen erzählenden Details, die den Text ergänzen statt ihn zu wiederholen",
    depthPlan:spatial.depthPlan,textPosition:spatial.textPosition,textSafeZone:spatial.textSafeZone,noTextZone:spatial.noTextZone,
    lighting:LIGHT_BY_ROLE[role]||"warmes, weiches Licht",paletteShift:PALETTE_BY_ROLE[role]||"harmonische Buchpalette",
    continuityBridge:continuityBridge(project,spread,index,characters),visualPriority:pagePriority(role,spread),
    recurringMotif:motif,manual:false
  };
}

function characterText(passports,names){
  const visible=passports.filter(passport=>names.includes(passport.name));
  return visible.map(p=>`${p.name}: ${p.age||p.role}, Haut ${p.skinTone}, Körperbau ${p.bodyType}, Größe ${p.height}, Haar ${p.hairColor}, ${p.hairLength}, Frisur ${p.hairstyle}, Augen ${p.eyeColor}, Oberteil ${p.top}, Unterteil ${p.bottom}, Schuhe ${p.shoes}, Accessoires ${p.accessories||"keine"}, freie Aussehensbeschreibung ${p.appearanceDescription||"keine"}, feste Merkmale ${p.definingFeatures}`).join("; ");
}

function buildPrompt(item,project,style,passports){
  const d=item.direction,spread=project.layout?.spreads?.find(entry=>entry.id===item.spreadId)||{};
  const companionText=clean(spread.layoutText||spread.text);
  return [
    `Kinderbuchillustration als breite Doppelseite im Format ${style.aspectRatio||"3:2"}.`,
    `Stil: ${style.name}. Technik: ${style.technique}. Farbmodus: ${style.colorMode}. Detailgrad: ${style.detailLevel}. Farbintensität: ${style.colorIntensity}. Hintergrund: ${style.backgroundStyle}. Linien: ${style.lineStyle}. Textur: ${style.texture}. ${style.description}`,
    `Bilddramaturgische Funktion: ${d.pageType}. ${d.visualPriority}.`,
    `Exakter zu illustrierender Moment: ${d.focalMoment}`,
    `Warum dieser Moment: ${d.focalReason}. Das Bild soll den Buchtext ergänzen und nicht bloß Satz für Satz wiederholen.`,
    `Begleitender Buchtext zur Abstimmung, nicht als Schrift im Bild: ${companionText}`,
    `Ort: ${d.location}. Sichtbare Figuren: ${characterText(passports,d.characters)||"keine Hauptfigur sichtbar"}.`,
    `Bildfokus: ${d.focalPoint}.`,
    `Kamera und Ausschnitt: ${d.shotLabel}; ${d.cameraAngle}; ${d.framing}.`,
    `Komposition: ${d.subjectPlacement}. Blickführung: ${d.visualFlow}. Blickrichtungen: ${d.gazeDirection}.`,
    `Raumtiefe: Vordergrund – ${d.foreground}. Mittelebene – ${d.midground}. Hintergrund – ${d.background}. ${d.depthPlan}.`,
    `Emotion: ${d.emotion}. Körperhaltung: ${d.bodyLanguage}. Gefühle ausschließlich durch Mimik, Hände, Haltung, Abstand und Blick zeigen, nicht durch Symbole oder erklärenden Text.`,
    `Licht: ${d.lighting}. Farbdramaturgie: ${d.paletteShift}. Grundpalette: ${style.palette}.`,
    `Textintegration: ${d.textSafeZone} als ruhigen, kontrastreichen Freiraum erhalten. ${d.noTextZone}. Keine Schrift im Bild.`,
    `Kontinuität: ${d.continuityBridge}. ${style.consistencyRule}`,
    `Handlungsgenauigkeit: Alle sichtbaren Hände, Füße, Gegenstände, Positionen, Größenverhältnisse und Blickachsen müssen zur Handlung passen. Unterstützende Figuren dürfen die entscheidende Handlung der Hauptfigur nicht übernehmen.`,
    `Vermeiden: Text, Buchstaben, Logos, Wasserzeichen, falsche Blickrichtungen, widersprüchliche Positionen, abgeschnittene wichtige Hände, zusätzliche Finger oder Gliedmaßen, vertauschte Kleidung, wechselnde Haarfarben, starre Posen, unpassende Symbolik, Horror, drastische Gewalt oder eine neue Handlung, die im Buch nicht vorkommt.`
  ].join("\n");
}

function itemFromSpread(project,spread,index,previousDirections,style,passports){
  const direction=directionFor(project,spread,index,previousDirections);
  const item={
    id:uid("ILL"),spreadId:spread.id,spreadNumber:spread.number,role:spread.role,roleLabel:spread.roleLabel,title:spread.title,
    sceneId:spread.sceneId||spread.sourceSceneIds?.[0]||null,sceneNumber:spread.sceneNumber||spread.number,chapterNumber:spread.chapterNumber||1,
    sourceBlockIds:[...(spread.sourceBlockIds||[])],sourceSceneIds:[...(spread.sourceSceneIds||[])],sourceHash:hash(spread.sourceText||spread.layoutText||spread.text),
    location:direction.location,characters:direction.characters,camera:direction.shotLabel,light:direction.lighting,mood:direction.emotion,
    composition:`${direction.subjectPlacement}; ${direction.textSafeZone} frei halten`,direction,prompt:"",
    negativePrompt:"Text, Buchstaben, Logo, Wasserzeichen, zusätzliche Finger, zusätzliche Gliedmaßen, inkonsistente Gesichter, wechselnde Kleidung, falsche Blickrichtung, Horror, drastische Gewalt",
    status:"planned",imageData:null,imageName:"",approved:false,notes:"",manualPrompt:false,manualDirection:false,generatedAt:new Date().toISOString()
  };
  item.prompt=buildPrompt(item,project,style,passports);return item;
}

function findPrevious(oldItems,spread,used){
  const candidates=(oldItems||[]).filter(item=>!used.has(item));
  let found=candidates.find(item=>item.spreadId===spread.id);
  if(!found&&spread.sourceBlockIds?.length)found=candidates.find(item=>item.sourceBlockIds?.join("|")===spread.sourceBlockIds.join("|"));
  if(!found){const ids=new Set(spread.sourceSceneIds||[]);found=candidates.find(item=>item.sceneId&&ids.has(item.sceneId)||item.sourceSceneIds?.some(id=>ids.has(id)));}
  if(!found)found=candidates.find(item=>item.spreadNumber===spread.number||item.sceneNumber===spread.number);
  if(found)used.add(found);return found||null;
}

function preserveItem(next,previous,sameSource){
  if(!previous)return next;
  if(previous.spreadId===next.spreadId||sameSource)next.id=previous.id||next.id;
  next.imageData=previous.imageData||null;next.imageName=previous.imageName||"";next.approved=Boolean(previous.approved&&previous.imageData);
  next.status=next.approved?"approved":next.imageData?"image-added":"planned";next.notes=previous.notes||"";
  if(sameSource&&previous.manualDirection&&previous.direction){
    next.direction={...next.direction,...deepClone(previous.direction),manual:true};next.manualDirection=true;
    next.location=next.direction.location||next.location;next.characters=next.direction.characters||next.characters;
  }
  if(sameSource&&previous.manualPrompt&&clean(previous.prompt)){next.prompt=previous.prompt;next.manualPrompt=true;}
  return next;
}

function quality(illustrations,project){
  const items=illustrations.items||[],spreads=project.layout?.spreads||[];
  if(!items.length)return {score:0,checks:[],cameraVariety:0,repeatedShots:0};
  const shots=items.map(item=>item.direction?.shot).filter(Boolean),cameraVariety=new Set(shots).size;
  let repeatedShots=0;for(let index=2;index<shots.length;index++)if(shots[index]===shots[index-1]&&shots[index]===shots[index-2])repeatedShots++;
  const climax=items.find(item=>item.role==="climax"),ending=items.find(item=>item.role==="ending");
  const checks=[
    {id:"spread-link",label:"Jede Doppelseite besitzt einen Bildauftrag",pass:items.length===spreads.length&&spreads.every(spread=>items.some(item=>item.spreadId===spread.id))},
    {id:"moment",label:"Stärkster Bildmoment gewählt",pass:items.every(item=>clean(item.direction?.focalMoment)&&Number(item.direction?.focalScore)>=0)},
    {id:"camera",label:"Abwechslungsreiche Kameraführung",pass:cameraVariety>=Math.min(5,Math.max(3,Math.ceil(items.length/5))),detail:`${cameraVariety} Einstellungen`},
    {id:"repeat",label:"Keine monotone Dreifach-Wiederholung",pass:repeatedShots===0,detail:`${repeatedShots} Wiederholungen`},
    {id:"gaze",label:"Blickrichtungen geplant",pass:items.every(item=>clean(item.direction?.gazeDirection))},
    {id:"space",label:"Textfreiraum und Figurenposition abgestimmt",pass:items.every(item=>clean(item.direction?.textSafeZone)&&clean(item.direction?.subjectPlacement))},
    {id:"depth",label:"Vorder-, Mittel- und Hintergrund geplant",pass:items.every(item=>clean(item.direction?.foreground)&&clean(item.direction?.midground)&&clean(item.direction?.background))},
    {id:"emotion",label:"Emotion und Körpersprache sichtbar",pass:items.every(item=>clean(item.direction?.emotion)&&clean(item.direction?.bodyLanguage))},
    {id:"continuity",label:"Visuelle Kontinuität beschrieben",pass:items.every(item=>clean(item.direction?.continuityBridge))},
    {id:"climax",label:"Höhepunkt erhält stärkste Bilddramaturgie",pass:Boolean(climax&&climax.direction?.pageType===PAGE_TYPES.climax&&["low-wide","wide","full"].includes(climax.direction?.shot))},
    {id:"ending",label:"Schlussbild lässt den Blick im Buch ruhen",pass:Boolean(ending&&lower(ending.direction?.visualFlow).includes("ruhe"))},
    {id:"prompts",label:"Prompts enthalten vollständige Regie",pass:items.every(item=>clean(item.prompt).length>800)}
  ];
  return {score:Math.round(checks.filter(check=>check.pass).length/checks.length*100),checks,cameraVariety,repeatedShots,complementaryMoments:items.filter(item=>item.direction?.complementaryMoment).length};
}

function visualArc(items){
  const sequence=items.map(item=>({spreadNumber:item.spreadNumber,role:item.role,pageType:item.direction.pageType,shot:item.direction.shot,shotLabel:item.direction.shotLabel,flow:item.direction.visualFlow,priority:item.direction.visualPriority}));
  return {sequence,cameraVariety:new Set(sequence.map(entry=>entry.shot)).size,pageTypeVariety:new Set(sequence.map(entry=>entry.pageType)).size};
}

function build(project,oldIllustrations=null,{preserveAssets=true,preserveManual=true}={}){
  const layout=ensureLayout(project),old=oldIllustrations||null,style=styleDefaults(old?.style||{});
  const passports=(old?.characterPassports?.length?old.characterPassports:(project.bookPlan?.characters||[]).map(characterPassport)).map((passport,index)=>({
    ...characterPassport((project.bookPlan?.characters||[])[index]||passport,index),...passport
  }));
  const previousDirections=[],used=new Set();
  const items=layout.spreads.map((spread,index)=>{
    let item=itemFromSpread(project,spread,index,previousDirections,style,passports);
    const previous=findPrevious(old?.items||[],spread,used),sameSource=Boolean(previous&&previous.sourceHash===item.sourceHash);
    if(previous&&preserveAssets)item=preserveItem(item,previous,sameSource&&preserveManual);
    if(item.manualDirection)item.prompt=item.manualPrompt?item.prompt:buildPrompt(item,project,style,passports);
    previousDirections.push(item.direction);spread.illustrationId=item.id;return item;
  });
  const migration=old&&old.schemaVersion!=="2.0"?{
    fromSchema:old.schemaVersion||"unknown",oldItemCount:(old.items||[]).length,preservedImages:items.filter(item=>item.imageData).length,migratedAt:new Date().toISOString()
  }:old?.phase3Migration||null;
  const result={
    schemaVersion:"2.0",dramaturgyVersion:"1.0",generatedAt:new Date().toISOString(),
    generator:"CAPS Illustration Dramaturgy Engine 1.0 – Phase 3",style,characterPassports:passports,items,progress:0,
    phase3Migration:migration,approved:false
  };
  result.visualArc=visualArc(items);result.quality=quality(result,project);return result;
}

function generate(project){
  project.illustrations=build(project,project.illustrations||null,{preserveAssets:true,preserveManual:true});return recalc(project);
}

function sync(project){
  if(!project.illustrations)return generate(project);
  project.illustrations=build(project,project.illustrations,{preserveAssets:true,preserveManual:true});project.illustrations.updatedAt=new Date().toISOString();return recalc(project);
}

function migrate(project){
  if(!project.illustrations)return generate(project);
  const layout=ensureLayout(project),valid=project.illustrations.schemaVersion==="2.0"&&project.illustrations.dramaturgyVersion==="1.0";
  const linked=valid&&layout.spreads.length===project.illustrations.items.length&&layout.spreads.every(spread=>project.illustrations.items.some(item=>item.spreadId===spread.id));
  if(linked){layout.spreads.forEach(spread=>{const item=project.illustrations.items.find(entry=>entry.spreadId===spread.id);spread.illustrationId=item?.id||null;});return recalc(project);}
  return sync(project);
}

function rebuildPrompts(project){
  const illustrations=project.illustrations;if(!illustrations)return project;
  illustrations.items.forEach(item=>{item.prompt=buildPrompt(item,project,illustrations.style,illustrations.characterPassports);item.manualPrompt=false;});return recalc(project);
}

function redesignItem(project,itemId){
  const illustrations=project.illustrations,item=illustrations?.items?.find(entry=>entry.id===itemId);if(!item)return project;
  const spread=project.layout?.spreads?.find(entry=>entry.id===item.spreadId);if(!spread)return project;
  const index=project.layout.spreads.indexOf(spread),previous=illustrations.items.slice(0,index).map(entry=>entry.direction);
  const nextDirection=directionFor(project,spread,index,previous);
  item.direction=nextDirection;item.location=nextDirection.location;item.characters=nextDirection.characters;item.camera=nextDirection.shotLabel;item.light=nextDirection.lighting;item.mood=nextDirection.emotion;
  item.composition=`${nextDirection.subjectPlacement}; ${nextDirection.textSafeZone} frei halten`;item.manualDirection=false;item.manualPrompt=false;
  item.prompt=buildPrompt(item,project,illustrations.style,illustrations.characterPassports);return recalc(project);
}

function updateItem(project,itemId,values={}){
  const illustrations=project.illustrations,item=illustrations?.items?.find(entry=>entry.id===itemId);if(!item)return project;
  const directionFields=["pageType","shot","cameraAngle","focalMoment","focalPoint","subjectPlacement","visualFlow","gazeDirection","emotion","bodyLanguage","textSafeZone","lighting","paletteShift","continuityBridge"];
  directionFields.forEach(field=>{if(values[field]!==undefined)item.direction[field]=clean(values[field]);});
  if(values.shot!==undefined)item.direction.shotLabel=SHOT_LABELS[values.shot]||values.shot;
  if(directionFields.some(field=>values[field]!==undefined)){item.direction.manual=true;item.manualDirection=true;item.camera=item.direction.shotLabel;item.light=item.direction.lighting;item.mood=item.direction.emotion;item.composition=`${item.direction.subjectPlacement}; ${item.direction.textSafeZone} frei halten`;}
  if(values.notes!==undefined)item.notes=clean(values.notes);
  if(values.prompt!==undefined){item.prompt=clean(values.prompt);item.manualPrompt=true;}
  else if(directionFields.some(field=>values[field]!==undefined)){item.prompt=buildPrompt(item,project,illustrations.style,illustrations.characterPassports);item.manualPrompt=false;}
  illustrations.approved=false;return recalc(project);
}

function regenerate(project,preserveImages=true){
  const old=project.illustrations;project.illustrations=build(project,old,{preserveAssets:preserveImages,preserveManual:false});return recalc(project);
}

function approveItem(project,itemId){
  const item=project.illustrations?.items?.find(entry=>entry.id===itemId);if(!item)return false;
  if(!item.imageData&&!item.approved)return false;item.approved=!item.approved;item.status=item.approved?"approved":item.imageData?"image-added":"planned";recalc(project);return item.approved;
}

function recalc(project){
  const illustrations=project.illustrations;if(!illustrations)return project;
  const total=illustrations.items.length||1,approved=illustrations.items.filter(item=>item.approved).length;
  illustrations.progress=Math.round(approved/total*100);illustrations.quality=quality(illustrations,project);illustrations.visualArc=visualArc(illustrations.items);
  project.illustrationStatus=illustrations.progress===100?"approved":"draft";
  if(project.layout)CAPS_LayoutEngine.recalc(project);return project;
}

window.CAPS_IllustrationEngine={generate,sync,migrate,recalc,rebuildPrompts,redesignItem,updateItem,regenerate,approveItem,quality,pageTypes:PAGE_TYPES,shotLabels:SHOT_LABELS};
})();
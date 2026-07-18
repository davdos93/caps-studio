(function(){
"use strict";

const now=()=>new Date().toISOString();
const clean=value=>String(value??"").replace(/\r/g,"").trim();
const lower=value=>clean(value).toLocaleLowerCase("de-DE");
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const words=value=>clean(value).split(/\s+/).filter(Boolean);
const unique=values=>[...new Set(values.filter(Boolean))];
const escapeRegExp=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const STOP=new Set("aber alle allem allen aller alles als also am an auch auf aus bei bin bis bist da damit dann das dass dein deine dem den der des die dies diese dieser dieses doch dort du durch ein eine einem einen einer eines er es etwas für gegen hat haben hier ich im in ist ja kann kein keine mit nach nicht noch nun nur oder ohne sehr sie sind so über um und uns unser unter vom von vor war waren was weil wenn werden wie wieder wir wird wo zu zum zur".split(" "));

const CATEGORY_LABELS={
 characters:"Figuren und Namen",
 appearance:"Alter, Aussehen und Kleidung",
 setting:"Orte und Zeit",
 causality:"Ursache und Wirkung",
 motifs:"Motive und Einlösungen",
 sequence:"Reihenfolge und Vollständigkeit",
 textImage:"Text und Bildregie",
 emotion:"Emotionale Entwicklung",
 ending:"Alltagstransfer und Schluss"
};
const SEVERITY_LABELS={blocker:"Blocker",warning:"Warnung",recommendation:"Empfehlung"};
const CATEGORY_ORDER=Object.keys(CATEGORY_LABELS);

function normalize(value){
 return lower(value).normalize("NFD").replace(/\p{Diacritic}/gu,"").replace(/[^a-z0-9äöüß]+/g," ").replace(/\s+/g," ").trim();
}
function tokens(value){
 return unique(normalize(value).split(" ").filter(token=>token.length>=4&&!STOP.has(token)));
}
function overlap(a,b){
 const left=new Set(tokens(a)),right=new Set(tokens(b));if(!left.size||!right.size)return 0;
 let common=0;left.forEach(token=>{if(right.has(token))common++;});
 return common/Math.max(1,Math.min(left.size,right.size));
}
function includesName(value,name){return new RegExp(`(^|[^\\p{L}])${escapeRegExp(name)}([^\\p{L}]|$)`,"iu").test(clean(value));}
function stable(value){
 if(value===null||value===undefined)return value;
 if(Array.isArray(value))return value.map(stable);
 if(typeof value!=="object")return value;
 return Object.keys(value).sort().reduce((result,key)=>{result[key]=stable(value[key]);return result;},{});
}
function hash(value){
 const text=JSON.stringify(stable(value));let h=2166136261;
 for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
 return (h>>>0).toString(16).padStart(8,"0");
}
function source(project){
 const plan=project.bookPlan||{},manuscript=project.manuscript||{},layout=project.layout||{},illustrations=project.illustrations||{};
 return {
   storyBible:plan.storyBible||null,
   treatment:plan.storyTreatment||null,
   characters:(plan.characters||[]).map(character=>({
     id:character.id,name:character.name,role:character.role,age:character.age,
     hairColor:character.hairColor,hairstyle:character.hairstyle,eyeColor:character.eyeColor,
     clothing:character.clothing,accessories:character.accessories,specialFeatures:character.specialFeatures
   })),
   chapters:(manuscript.bookChapters||[]).map(chapter=>({
     id:chapter.chapterId||chapter.id,title:chapter.title,
     paragraphs:(chapter.paragraphs||[]).map(paragraph=>({id:paragraph.id,text:paragraph.text,beatNumbers:paragraph.beatNumbers||[]})),
     text:chapter.text
   })),
   spreads:(layout.spreads||[]).map(spread=>({
     id:spread.id,number:spread.number,role:spread.role,sourceHash:spread.sourceHash||spread.composition?.sourceHash,
     sourceBlockIds:spread.sourceBlockIds||[],sourceChapterIds:spread.sourceChapterIds||[],
     sourceText:spread.sourceText,pictureBookText:spread.pictureBookText,layoutText:spread.layoutText||spread.text,
     illustrationId:spread.illustrationId,textPosition:spread.textPosition,composition:spread.composition
   })),
   passports:(illustrations.characterPassports||[]).map(passport=>({
     id:passport.id,name:passport.name,age:passport.age,hairColor:passport.hairColor,hairstyle:passport.hairstyle,
     eyeColor:passport.eyeColor,top:passport.top,bottom:passport.bottom,shoes:passport.shoes,
     accessories:passport.accessories,appearanceDescription:passport.appearanceDescription,
     definingFeatures:passport.definingFeatures
   })),
   directions:(illustrations.items||[]).map(item=>({
     id:item.id,spreadId:item.spreadId,sourceHash:item.sourceHash,characters:item.characters||[],
     location:item.location,direction:item.direction,prompt:item.prompt,manualPrompt:item.manualPrompt,
     manualDirection:item.manualDirection,approved:item.approved,imageName:item.imageName
   }))
 };
}
function fingerprint(project){return hash(source(project));}
function idFor(code,location,evidence){return `CONS-${code}-${hash([location,evidence]).slice(0,8)}`;}
function finding(code,severity,category,title,detail,{location="",stage="consistency",suggestion="",evidence=""}={}){
 return {id:idFor(code,location,evidence),code,severity,category,title,detail,location,stage,suggestion,evidence,acknowledged:false};
}
function textOf(project){
 const chapters=project.manuscript?.bookChapters||[];
 return chapters.map(chapter=>clean(chapter.text)||chapter.paragraphs?.map(p=>p.text).join("\n\n")||"").join("\n\n");
}
function paragraphIndex(project){
 const map=new Map(),ordered=[];
 (project.manuscript?.bookChapters||[]).forEach((chapter,chapterIndex)=>{
   const paragraphs=chapter.paragraphs?.length?chapter.paragraphs:clean(chapter.text).split(/\n\s*\n/).map((text,index)=>({id:`AUTO-${chapterIndex}-${index}`,text,beatNumbers:chapter.sourceBeatNumbers||[]}));
   paragraphs.forEach((paragraph,paragraphIndex)=>{
     const row={id:paragraph.id,chapterId:chapter.chapterId||chapter.id,chapterIndex,paragraphIndex,text:paragraph.text,beatNumbers:paragraph.beatNumbers||[]};
     map.set(row.id,ordered.length);ordered.push(row);
   });
 });
 return {map,ordered};
}
function itemForSpread(project,spread){
 const items=project.illustrations?.items||[];
 return items.find(item=>item.id===spread.illustrationId)||items.find(item=>item.spreadId===spread.id)||null;
}
function add(result,item){if(item)result.push(item);}

function checkCharacters(project,result){
 const planCharacters=project.bookPlan?.characters||[],names=planCharacters.map(character=>clean(character.name)).filter(Boolean);
 const normalized=names.map(normalize);
 normalized.forEach((name,index)=>{
   if(normalized.indexOf(name)!==index)add(result,finding("duplicate-character","blocker","characters","Figurenname ist doppelt vergeben",`Der Name „${names[index]}“ ist mehrfach im Buchplan vorhanden.`,{location:"Buchplan",stage:"plan",suggestion:"Jeder zentralen Figur einen eindeutigen Namen geben.",evidence:names[index]}));
 });
 const manuscript=textOf(project),chapters=project.manuscript?.bookChapters||[],opening=chapters.slice(0,Math.max(1,Math.ceil(chapters.length*.25))).map(ch=>ch.text).join(" "),ending=chapters.slice(Math.max(0,Math.floor(chapters.length*.75))).map(ch=>ch.text).join(" ");
 const protagonist=planCharacters[0]?.name||project.bookPlan?.storyTreatment?.protagonist?.name||"";
 if(protagonist&&!includesName(opening,protagonist))add(result,finding("protagonist-opening","blocker","characters","Hauptfigur fehlt am Anfang",`${protagonist} wird im ersten Buchviertel nicht eindeutig verankert.`,{location:"Anfang",stage:"manuscript",suggestion:"Die Hauptfigur früh mit Namen und sichtbarer Handlung einführen.",evidence:protagonist}));
 if(protagonist&&!includesName(ending,protagonist))add(result,finding("protagonist-ending","blocker","characters","Hauptfigur fehlt am Schluss",`${protagonist} handelt im letzten Buchviertel nicht mehr eindeutig.`,{location:"Schluss",stage:"manuscript",suggestion:"Die Veränderung der Hauptfigur im Schlussbild konkret zeigen.",evidence:protagonist}));
 (project.bookPlan?.storyTreatment?.characterArcs||[]).forEach(arc=>{
   if(!clean(arc.name)||includesName(manuscript,arc.name))return;
   const severe=normalize(arc.role).includes("haupt")||normalize(arc.role).includes("beziehung");
   add(result,finding("missing-arc-character",severe?"blocker":"warning","characters","Figur aus dem Geschichtenentwurf fehlt",`${arc.name} besitzt einen Figurenbogen, erscheint aber nicht im Manuskript.`,{location:arc.role||"Figurenbogen",stage:"manuscript",suggestion:"Die Figur sichtbar einführen oder den ungenutzten Figurenbogen entfernen.",evidence:arc.name}));
 });
 const known=new Set(names.map(normalize));
 (project.illustrations?.items||[]).forEach((item,index)=>{
   (item.characters||[]).forEach(name=>{
     if(!known.has(normalize(name)))add(result,finding("unknown-image-character","blocker","characters","Unbekannte Figur in der Bildregie",`„${name}“ ist auf Doppelseite ${item.spreadNumber||index+1} eingeplant, aber nicht im Buchplan definiert.`,{location:`Doppelseite ${item.spreadNumber||index+1}`,stage:"illustrations",suggestion:"Figur im Buchplan anlegen oder aus der Bildregie entfernen.",evidence:name}));
   });
   (item.characters||[]).forEach(name=>{
     if(clean(item.prompt)&&!includesName(item.prompt,name))add(result,finding("character-missing-prompt","warning","characters","Sichtbare Figur fehlt im Illustrationsprompt",`${name} ist der Doppelseite zugeordnet, wird im Prompt aber nicht eindeutig genannt.`,{location:`Doppelseite ${item.spreadNumber||index+1}`,stage:"illustrations",suggestion:"Name und Charakterpass im Prompt ergänzen.",evidence:name}));
   });
 });
}

function mismatch(a,b){return clean(a)&&clean(b)&&overlap(a,b)===0;}
function checkAppearance(project,result){
 const characters=project.bookPlan?.characters||[],passports=project.illustrations?.characterPassports||[];
 characters.forEach(character=>{
   const passport=passports.find(item=>normalize(item.name)===normalize(character.name))||passports.find(item=>item.id&&character.id&&item.id===character.id);
   if(!passport){add(result,finding("missing-passport","blocker","appearance","Charakterpass fehlt",`Für ${character.name} existiert kein visueller Charakterpass.`,{location:character.name,stage:"illustrations",suggestion:"Charakterpass erzeugen und vor weiteren Bildern freigeben.",evidence:character.name}));return;}
   const comparisons=[
     ["age","Alter",character.age,passport.age],
     ["hair","Haarfarbe",character.hairColor,passport.hairColor],
     ["eyes","Augenfarbe",character.eyeColor,passport.eyeColor],
     ["clothes","Kleidung",character.clothing,passport.top],
     ["accessories","Accessoires",character.accessories,passport.accessories]
   ];
   comparisons.forEach(([field,label,planned,visual])=>{
     if(mismatch(planned,visual))add(result,finding(`appearance-${field}`,"warning","appearance",`${label} widerspricht dem Buchplan`,`${character.name}: Im Buchplan steht „${clean(planned)}“, im Charakterpass „${clean(visual)}“.`,{location:character.name,stage:"illustrations",suggestion:"Buchplan und Charakterpass auf dieselbe verbindliche Beschreibung bringen.",evidence:`${planned}|${visual}`}));
   });
   const required=[character.hairColor,character.eyeColor,character.clothing,character.specialFeatures].filter(value=>tokens(value).length);
   const characterPrompts=(project.illustrations?.items||[]).filter(item=>(item.characters||[]).some(name=>normalize(name)===normalize(character.name))).map(item=>item.prompt).join(" ");
   required.forEach(value=>{
     if(characterPrompts&&overlap(value,characterPrompts)===0)add(result,finding("appearance-omitted","recommendation","appearance","Festes Merkmal wird in Bildaufträgen nicht wiederholt",`${character.name}: „${clean(value)}“ ist festgelegt, findet sich aber in den zugehörigen Prompts nicht verlässlich wieder.`,{location:character.name,stage:"illustrations",suggestion:"Das feste Merkmal in jedem Prompt über den Charakterpass referenzieren.",evidence:value}));
   });
 });
}

function checkSetting(project,result){
 const night=/\b(nacht|mitternacht|mondlicht|sternenklar|dunkle nacht)\b/i,day=/\b(morgen|vormittag|mittag|sonniger tag|tageslicht)\b/i;
 (project.layout?.spreads||[]).forEach((spread,index)=>{
   const text=[spread.sourceText,spread.layoutText,spread.pictureBookText].join(" "),item=itemForSpread(project,spread),direction=[item?.direction?.lighting,item?.direction?.location,item?.location].join(" ");
   if(night.test(text)&&day.test(direction))add(result,finding("night-day-image","blocker","setting","Tageszeit widerspricht der Bildregie",`Der Text spielt nachts, die Bildregie beschreibt jedoch Tages- oder Morgenlicht.`,{location:`Doppelseite ${spread.number||index+1}`,stage:"illustrations",suggestion:"Licht und Tageszeit an den Text angleichen.",evidence:`${text.slice(0,120)}|${direction}`}));
   if(day.test(text)&&night.test(direction))add(result,finding("day-night-image","blocker","setting","Tageszeit widerspricht der Bildregie",`Der Text spielt am Tag, die Bildregie beschreibt jedoch Nachtlicht.`,{location:`Doppelseite ${spread.number||index+1}`,stage:"illustrations",suggestion:"Licht und Tageszeit an den Text angleichen.",evidence:`${text.slice(0,120)}|${direction}`}));
   if(night.test(text)&&day.test(text))add(result,finding("mixed-time-spread","warning","setting","Mehrere Tageszeiten auf einer Doppelseite",`Die Passage enthält zugleich deutliche Tages- und Nachtmarker.`,{location:`Doppelseite ${spread.number||index+1}`,stage:"layout",suggestion:"Zeitwechsel sichtbar markieren oder auf zwei Doppelseiten verteilen.",evidence:text.slice(0,220)}));
   const location=clean(item?.direction?.location||item?.location);
   const generic=/vertrauter|alltagsort|passender ort|derselbe ort|umgebung/i.test(location);
   if(location&&!generic&&overlap(location,text)<.18)add(result,finding("location-image-text","warning","setting","Bildort ist im Text nicht nachvollziehbar",`Die Bildregie nennt „${location}“, während die zugehörige Passage kaum gemeinsame Ortsmerkmale enthält.`,{location:`Doppelseite ${spread.number||index+1}`,stage:"illustrations",suggestion:"Ort im Text oder in der Bildregie eindeutig angleichen.",evidence:`${location}|${text.slice(0,180)}`}));
 });
}

function checkCausality(project,result){
 const beats=project.bookPlan?.storyTreatment?.beats||[],paragraphs=paragraphIndex(project).ordered;
 const represented=new Set(paragraphs.flatMap(paragraph=>paragraph.beatNumbers||[]).map(Number));
 beats.forEach((beat,index)=>{
   ["because","decision","therefore"].forEach(field=>{
     if(!clean(beat[field]))add(result,finding(`beat-${field}`,"blocker","causality","Kausaler Handlungsschritt ist unvollständig",`Handlungsschritt ${beat.number||index+1} „${beat.title||""}“ besitzt kein Feld ${field==="because"?"WEIL":field==="decision"?"ENTSCHEIDET":"DESHALB"}.`,{location:`Handlungsschritt ${beat.number||index+1}`,stage:"plan",suggestion:"Ursache, Entscheidung und konkrete Folge ergänzen.",evidence:field}));
   });
   if(!represented.has(Number(beat.number||index+1)))add(result,finding("beat-not-in-manuscript","blocker","causality","Handlungsschritt fehlt im Manuskript",`Der Treatment-Schritt ${beat.number||index+1} „${beat.title||""}“ ist keinem Manuskriptabsatz zugeordnet.`,{location:`Handlungsschritt ${beat.number||index+1}`,stage:"manuscript",suggestion:"Schritt literarisch ausspielen oder Treatment bewusst überarbeiten.",evidence:beat.id||beat.title}));
   if(index>0&&clean(beats[index-1].therefore)&&clean(beat.because)&&overlap(beats[index-1].therefore,beat.because)<.34)add(result,finding("weak-causal-bridge","warning","causality","Kausale Verbindung zwischen Handlungsschritten ist schwach",`Die Folge aus Schritt ${index} führt sprachlich und inhaltlich nicht klar zur Ursache von Schritt ${index+1}.`,{location:`Schritt ${index} → ${index+1}`,stage:"plan",suggestion:"Die Folge des vorigen Schritts als konkrete Ursache des nächsten formulieren.",evidence:`${beats[index-1].therefore}|${beat.because}`}));
 });
 const climax=(project.layout?.spreads||[]).find(spread=>spread.role==="climax"),protagonist=project.bookPlan?.characters?.[0]?.name||project.bookPlan?.storyTreatment?.protagonist?.name;
 if(climax&&protagonist&&!includesName([climax.sourceText,climax.layoutText].join(" "),protagonist))add(result,finding("protagonist-missing-climax","blocker","causality","Hauptfigur führt den Höhepunkt nicht sichtbar aus",`${protagonist} ist in der als Höhepunkt markierten Doppelseite nicht eindeutig verankert.`,{location:`Doppelseite ${climax.number||""}`,stage:"layout",suggestion:"Die vorbereitete entscheidende Handlung der Hauptfigur konkret ausspielen.",evidence:protagonist}));
}

function checkMotifs(project,result){
 const motif=project.bookPlan?.storyTreatment?.motif||{},name=clean(motif.name||project.bookPlan?.storyBible?.motif);
 if(!name)return;
 const chapters=project.manuscript?.bookChapters||[],third=Math.max(1,Math.ceil(chapters.length/3));
 const early=chapters.slice(0,third).map(ch=>ch.text).join(" "),middle=chapters.slice(third,third*2).map(ch=>ch.text).join(" "),late=chapters.slice(third*2).map(ch=>ch.text).join(" ");
 if(overlap(name,early)<.34)add(result,finding("motif-setup","warning","motifs","Wiederkehrendes Motiv wird nicht klar vorbereitet",`„${name}“ ist im ersten Buchdrittel nicht zuverlässig erkennbar.`,{location:"Erstes Buchdrittel",stage:"manuscript",suggestion:"Motiv früh konkret zeigen, ohne seine ganze Bedeutung zu erklären.",evidence:name}));
 if(overlap(name,middle)<.34)add(result,finding("motif-development","warning","motifs","Motiv entwickelt sich im Mittelteil kaum",`„${name}“ verschwindet im mittleren Buchdrittel.`,{location:"Mittleres Buchdrittel",stage:"manuscript",suggestion:"Regel, Veränderung oder Missverständnis des Motivs sichtbar weiterentwickeln.",evidence:name}));
 if(overlap(name,late)<.34)add(result,finding("motif-payoff","blocker","motifs","Vorbereitetes Motiv wird nicht eingelöst",`„${name}“ erscheint im letzten Buchdrittel nicht als erkennbare Einlösung.`,{location:"Letztes Buchdrittel",stage:"manuscript",suggestion:"Die vorbereitete Funktion des Motivs im Höhepunkt oder Schluss konkret erfüllen.",evidence:name}));
 (project.illustrations?.items||[]).forEach((item,index)=>{
   const sourceText=project.layout?.spreads?.find(spread=>spread.id===item.spreadId)?.sourceText||"";
   if(overlap(name,sourceText)>=.34&&overlap(name,item.direction?.recurringMotif||item.direction?.continuityBridge||"")<.2)add(result,finding("motif-visual-continuity","recommendation","motifs","Motiv fehlt in der visuellen Kontinuität",`Die Passage nennt „${name}“, die Bildregie führt das Motiv aber nicht eindeutig weiter.`,{location:`Doppelseite ${item.spreadNumber||index+1}`,stage:"illustrations",suggestion:"Form, Farbe und Zustand des Motivs in der Bildregie festhalten.",evidence:name}));
 });
}

function checkSequence(project,result){
 const index=paragraphIndex(project),spreads=project.layout?.spreads||[],seen=new Map(),sequence=[];
 spreads.forEach((spread,spreadIndex)=>{
   const number=Number(spread.number||spreadIndex+1);
   if(number!==spreadIndex+1)add(result,finding("spread-number","warning","sequence","Doppelseiten sind nicht lückenlos nummeriert",`An Position ${spreadIndex+1} steht die Nummer ${number}.`,{location:`Doppelseite ${number}`,stage:"layout",suggestion:"Doppelseiten nach der aktuellen Reihenfolge neu nummerieren.",evidence:String(number)}));
   (spread.sourceBlockIds||[]).forEach(blockId=>{
     if(!index.map.has(blockId))add(result,finding("unknown-source-block","blocker","sequence","Layout verweist auf einen unbekannten Manuskriptabsatz",`Die Quelle ${blockId} existiert im aktuellen Manuskript nicht.`,{location:`Doppelseite ${number}`,stage:"layout",suggestion:"Layout aus dem aktuellen Manuskript neu synchronisieren.",evidence:blockId}));
     else sequence.push({position:index.map.get(blockId),blockId,spread:number});
     if(seen.has(blockId))add(result,finding("duplicate-source-block","blocker","sequence","Manuskriptabsatz wird mehrfach verwendet",`Der Absatz ${blockId} erscheint auf Doppelseite ${seen.get(blockId)} und ${number}.`,{location:`Doppelseite ${number}`,stage:"layout",suggestion:"Doppelung entfernen oder Seitenkomposition neu berechnen.",evidence:blockId}));
     else seen.set(blockId,number);
   });
 });
 const missing=index.ordered.filter(paragraph=>!seen.has(paragraph.id));
 if(missing.length)add(result,finding("missing-source-blocks","blocker","sequence","Manuskriptabsätze fehlen im Bilderbuchlayout",`${missing.length} Absätze wurden keiner Doppelseite zugeordnet.`,{location:"Gesamtbuch",stage:"layout",suggestion:"Bilderbuchkomposition aus dem aktuellen Manuskript neu erzeugen.",evidence:missing.slice(0,8).map(item=>item.id).join("|")}));
 for(let i=1;i<sequence.length;i++)if(sequence[i].position<sequence[i-1].position){
   add(result,finding("reversed-source-order","blocker","sequence","Handlungsreihenfolge wurde im Layout vertauscht",`Quelle ${sequence[i].blockId} folgt im Manuskript früher, steht aber nach einer späteren Passage.`,{location:`Doppelseite ${sequence[i].spread}`,stage:"layout",suggestion:"Quellabsätze in Manuskriptreihenfolge neu verteilen.",evidence:`${sequence[i-1].blockId}|${sequence[i].blockId}`}));break;
 }
 const items=project.illustrations?.items||[],bySpread=new Map();
 items.forEach(item=>{const list=bySpread.get(item.spreadId)||[];list.push(item);bySpread.set(item.spreadId,list);});
 spreads.forEach((spread,index)=>{
   const linked=bySpread.get(spread.id)||[];
   if(linked.length===0)add(result,finding("missing-image-direction","blocker","sequence","Doppelseite besitzt keinen Bildauftrag",`Für Doppelseite ${spread.number||index+1} fehlt die Illustrationsregie.`,{location:`Doppelseite ${spread.number||index+1}`,stage:"illustrations",suggestion:"Bilddramaturgie mit dem aktuellen Layout synchronisieren.",evidence:spread.id}));
   if(linked.length>1)add(result,finding("duplicate-image-direction","blocker","sequence","Mehrere Bildaufträge sind derselben Doppelseite zugeordnet",`Doppelseite ${spread.number||index+1} besitzt ${linked.length} Bildaufträge.`,{location:`Doppelseite ${spread.number||index+1}`,stage:"illustrations",suggestion:"Doppelte Bildaufträge entfernen und neu synchronisieren.",evidence:linked.map(item=>item.id).join("|")}));
 });
}

function checkTextImage(project,result){
 (project.layout?.spreads||[]).forEach((spread,index)=>{
   const item=itemForSpread(project,spread),number=spread.number||index+1,text=[spread.sourceText,spread.pictureBookText,spread.layoutText].join(" ");
   if(!item)return;
   const spreadHash=clean(spread.sourceHash||spread.composition?.sourceHash),itemHash=clean(item.sourceHash);
   if(spreadHash&&itemHash&&spreadHash!==itemHash)add(result,finding("stale-image-source","blocker","textImage","Bildauftrag basiert auf einer älteren Textfassung",`Quellfingerabdruck von Doppelseite ${number} und Illustrationsauftrag stimmt nicht überein.`,{location:`Doppelseite ${number}`,stage:"illustrations",suggestion:"Illustrationsregie aus dem aktuellen Layout neu synchronisieren.",evidence:`${spreadHash}|${itemHash}`}));
   if(spread.illustrationId&&item.id!==spread.illustrationId)add(result,finding("wrong-image-link","blocker","textImage","Doppelseite verweist auf den falschen Bildauftrag",`Gespeicherte Illustrations-ID und tatsächlich zugeordneter Auftrag stimmen nicht überein.`,{location:`Doppelseite ${number}`,stage:"layout",suggestion:"Layout und Bilddramaturgie neu synchronisieren.",evidence:`${spread.illustrationId}|${item.id}`}));
   const mentioned=(project.bookPlan?.characters||[]).map(character=>character.name).filter(name=>includesName(text,name));
   mentioned.forEach(name=>{
     if(!(item.characters||[]).some(value=>normalize(value)===normalize(name)))add(result,finding("missing-visible-character","warning","textImage","Im Text handelnde Figur fehlt in der Bildregie",`${name} handelt auf Doppelseite ${number}, ist aber nicht als sichtbare Figur eingeplant.`,{location:`Doppelseite ${number}`,stage:"illustrations",suggestion:"Bewusst entscheiden: Figur sichtbar ergänzen oder Bildmoment so wählen, dass ihr Fehlen nachvollziehbar ist.",evidence:name}));
   });
   const focal=clean(item.direction?.focalMoment);
   if(focal&&overlap(focal,spread.sourceText||text)<.3&&!item.manualDirection)add(result,finding("focal-not-in-source","warning","textImage","Gewählter Bildmoment ist in der Textquelle nicht klar verankert",`Der Bildfokus „${focal.slice(0,150)}${focal.length>150?"…":""}“ lässt sich in der Passage kaum wiederfinden.`,{location:`Doppelseite ${number}`,stage:"illustrations",suggestion:"Einen konkreten Satz oder ergänzenden Moment aus derselben Handlung wählen.",evidence:focal}));
   const safe=normalize(item.direction?.textSafeZone),placement=normalize(item.direction?.subjectPlacement);
   for(const side of ["links","rechts","oben","unten","mitte"]){
     if(safe.includes(side)&&placement.includes(side))add(result,finding("text-over-subject","blocker","textImage","Textfreiraum und Hauptmotiv überlagern sich",`Textfreiraum und Figurenposition liegen beide im Bereich „${side}“.`,{location:`Doppelseite ${number}`,stage:"illustrations",suggestion:"Hauptmotiv aus dem Textfreiraum verschieben oder Textzone ändern.",evidence:`${safe}|${placement}`})); 
   }
   if(/\bohne (mama|papa|mutter|vater)\b/i.test(text)){
     const absent=text.match(/\bohne (mama|papa|mutter|vater)\b/i)?.[1];
     if((item.characters||[]).some(name=>normalize(name).includes(normalize(absent))))add(result,finding("absent-character-shown","warning","textImage","Als abwesend beschriebene Figur ist im Bild eingeplant",`Der Text betont „ohne ${absent}“, die Figur ist dennoch als sichtbar markiert.`,{location:`Doppelseite ${number}`,stage:"illustrations",suggestion:"Figur entfernen oder ihre Anwesenheit erzählerisch erklären.",evidence:absent}));
   }
 });
}

function checkEmotion(project,result){
 const chapters=project.manuscript?.bookChapters||[],text=textOf(project),ending=chapters.slice(Math.max(0,chapters.length-2)).map(ch=>ch.text).join(" ");
 const profile=project.bookPlan?.storyBible?.psychologicalProfile||{},protagonist=project.bookPlan?.characters?.[0]?.name||"";
 const miracle=/\b(keine angst mehr|angst war weg|nie wieder traurig|wut war verschwunden|für immer mutig|problem war verschwunden|alles war plötzlich gut)\b/i;
 const match=ending.match(miracle);
 if(match)add(result,finding("miracle-resolution","blocker","emotion","Gefühl oder Problem verschwindet als Wunderlösung",`Der Schluss behauptet „${match[0]}“, statt eine realistische neue Handlung zu zeigen.`,{location:"Schluss",stage:"manuscript",suggestion:"Gefühl darf noch vorhanden sein; zeigen, was die Hauptfigur nun anders tun kann.",evidence:match[0]}));
 const early=chapters.slice(0,Math.max(1,Math.ceil(chapters.length*.3))).map(ch=>ch.text).join(" ");
 if(clean(profile.currentReaction)&&overlap(profile.currentReaction,early)<.12)add(result,finding("reaction-not-grounded","warning","emotion","Ausgangsreaktion ist am Anfang nur schwach sichtbar",`Die geschilderte Reaktion „${profile.currentReaction}“ wird im ersten Drittel kaum konkret gespiegelt.`,{location:"Anfang",stage:"manuscript",suggestion:"Körper, Worte und unmittelbare Folge der Ausgangssituation sichtbar erzählen.",evidence:profile.currentReaction}));
 const success=[profile.realisticSuccess,profile.desiredDevelopment,project.bookPlan?.storyTreatment?.protagonist?.transformation].filter(Boolean).join(" ");
 if(success&&overlap(success,ending)<.12)add(result,finding("transformation-not-shown","warning","emotion","Vorbereitete Entwicklung ist im Schluss nicht klar sichtbar",`Die realistische Veränderung der Hauptfigur lässt sich im letzten Teil nur schwach erkennen.`,{location:"Schluss",stage:"manuscript",suggestion:"Eine konkrete Entscheidung oder Handlung zeigen, die am Anfang noch nicht möglich war.",evidence:success.slice(0,200)}));
 const climax=(project.layout?.spreads||[]).find(spread=>spread.role==="climax");
 if(climax&&protagonist){
   const climaxText=[climax.sourceText,climax.layoutText].join(" ");
   const action=/\b(ging|trat|hielt|nahm|öffnete|sagte|legte|reichte|zog|entschied|hob|drückte|stellte|rief|wagte|blieb)\b/i;
   if(includesName(climaxText,protagonist)&&!action.test(climaxText))add(result,finding("passive-climax","warning","emotion","Hauptfigur bleibt im Höhepunkt zu passiv",`${protagonist} ist anwesend, führt aber keine klar erkennbare entscheidende Handlung aus.`,{location:`Doppelseite ${climax.number||""}`,stage:"layout",suggestion:"Eine sichtbare, selbstgewählte Handlung der Hauptfigur formulieren.",evidence:climaxText.slice(0,220)}));
 }
}

function checkEnding(project,result){
 const plan=project.bookPlan||{},chapters=project.manuscript?.bookChapters||[],ending=chapters.slice(Math.max(0,chapters.length-2)).map(ch=>ch.text).join(" ");
 const concrete=plan.storyBible?.psychologicalProfile?.concreteSituation||plan.storyBible?.intakeContext?.concreteSituation||project.bookBrief?.concreteSituation||"";
 const anchor=tokens(concrete).filter(token=>token.length>5);
 if(anchor.length&&!anchor.some(token=>normalize(ending).includes(token)))add(result,finding("missing-everyday-echo","blocker","ending","Alltagstransfer fehlt im Schluss",`Der Schluss kehrt nicht erkennbar zu einer ähnlichen Alltagssituation wie „${concrete}“ zurück.`,{location:"Letzte Kapitel",stage:"manuscript",suggestion:"Die neue Fähigkeit in einer kleinen, vertrauten Alltagssituation erproben lassen.",evidence:concrete}));
 const roles=(project.layout?.spreads||[]).slice(-3).map(spread=>spread.role);
 if(!roles.some(role=>["echo","return","ending"].includes(role)))add(result,finding("missing-ending-role","warning","ending","Layout besitzt keinen klaren Rückkehr- oder Schlussabschnitt",`Die letzten Doppelseiten sind nicht als Heimkehr, Alltag danach oder Schlussbild gekennzeichnet.`,{location:"Letzte Doppelseiten",stage:"layout",suggestion:"Schlussrhythmus neu berechnen oder Seitenrollen korrigieren.",evidence:roles.join("|")}));
 const message=clean(plan.storyBible?.coreMessage);
 if(message&&normalize(ending).includes(normalize(message)))add(result,finding("message-stated","recommendation","ending","Kernbotschaft wird wörtlich erklärt",`Die pädagogische Aussage erscheint im Schluss nahezu als Lehrsatz.`,{location:"Schluss",stage:"manuscript",suggestion:"Botschaft durch Handlung, Beziehung und Schlussbild spürbar machen, statt sie auszusprechen.",evidence:message}));
}

function calculate(findings){
 const counts={blocker:0,warning:0,recommendation:0};
 findings.forEach(item=>counts[item.severity]=(counts[item.severity]||0)+1);
 const categories=CATEGORY_ORDER.map(id=>{
   const items=findings.filter(item=>item.category===id),penalty=items.reduce((sum,item)=>sum+(item.severity==="blocker"?20:item.severity==="warning"?8:3),0);
   return {id,label:CATEGORY_LABELS[id],score:Math.max(0,100-penalty),blockers:items.filter(item=>item.severity==="blocker").length,warnings:items.filter(item=>item.severity==="warning").length,recommendations:items.filter(item=>item.severity==="recommendation").length,total:items.length};
 });
 const weighted=categories.reduce((sum,category)=>sum+category.score,0)/Math.max(1,categories.length);
 const score=Math.max(0,Math.round(weighted-counts.blocker*2));
 return {counts,categories,score,ready:counts.blocker===0&&score>=78};
}

function run(project){
 if(!project?.bookPlan)throw new Error("Für die Konsistenzprüfung wird zuerst ein Buchplan benötigt.");
 const previous=project.consistencyReport||{},acknowledged=new Set(previous.acknowledgedFindingIds||[]);
 const findings=[];
 if(!project.manuscript?.bookChapters?.length)add(findings,finding("missing-manuscript","blocker","sequence","Gesamtmanuskript fehlt","Ohne vollständiges Manuskript kann das Buch nicht konsistent geprüft werden.",{location:"Projekt",stage:"manuscript",suggestion:"Zuerst das Gesamtmanuskript erzeugen."}));
 if(!project.layout?.spreads?.length)add(findings,finding("missing-layout","blocker","sequence","Bilderbuchkomposition fehlt","Es existieren keine Doppelseiten für die buchweite Prüfung.",{location:"Projekt",stage:"layout",suggestion:"Bilderbuchkomposition erzeugen."}));
 if(!project.illustrations?.items?.length)add(findings,finding("missing-directions","blocker","textImage","Illustrationsregie fehlt","Text-Bild-Konsistenz kann ohne Bildaufträge nicht geprüft werden.",{location:"Projekt",stage:"illustrations",suggestion:"Illustrationsdramaturgie erzeugen."}));
 checkCharacters(project,findings);checkAppearance(project,findings);checkSetting(project,findings);checkCausality(project,findings);checkMotifs(project,findings);checkSequence(project,findings);checkTextImage(project,findings);checkEmotion(project,findings);checkEnding(project,findings);
 findings.forEach(item=>item.acknowledged=acknowledged.has(item.id)&&item.severity!=="blocker");
 const metrics=calculate(findings),sourceFingerprint=fingerprint(project);
 project.consistencyReport={
   schemaVersion:"1.0",engine:"book-wide-consistency",generatedAt:now(),sourceFingerprint,
   score:metrics.score,ready:metrics.ready,approved:false,approvedAt:null,stale:false,
   counts:metrics.counts,categories:metrics.categories,findings,
   acknowledgedFindingIds:findings.filter(item=>item.acknowledged).map(item=>item.id),
   scope:{characters:true,appearance:true,setting:true,causality:true,motifs:true,sequence:true,textImageMetadata:true,emotion:true,ending:true,pixelAnalysis:false}
 };
 return project.consistencyReport;
}
function isStale(project){
 const report=project?.consistencyReport;if(!report)return true;
 const stale=report.sourceFingerprint!==fingerprint(project);report.stale=stale;
 if(stale&&report.approved){report.approved=false;report.approvedAt=null;}
 return stale;
}
function approve(project){
 const report=project?.consistencyReport;if(!report||isStale(project)||!report.ready)return false;
 report.approved=!report.approved;report.approvedAt=report.approved?now():null;return report.approved;
}
function acknowledge(project,id){
 const report=project?.consistencyReport;if(!report||isStale(project))return false;
 const item=report.findings.find(entry=>entry.id===id);if(!item||item.severity==="blocker")return false;
 item.acknowledged=!item.acknowledged;
 report.acknowledgedFindingIds=report.findings.filter(entry=>entry.acknowledged).map(entry=>entry.id);
 report.approved=false;report.approvedAt=null;return item.acknowledged;
}
function invalidate(project){
 if(project?.consistencyReport){project.consistencyReport.stale=true;project.consistencyReport.approved=false;project.consistencyReport.approvedAt=null;}
 return project?.consistencyReport||null;
}
function download(project){
 const report=project?.consistencyReport;if(!report)throw new Error("Noch kein Konsistenzbericht vorhanden.");
 const payload={product:"CAPS Studio",version:"0.9.0",phase:"5.3",book:project.title||project.bookPlan?.storyBible?.title||"",report};
 const bytes=new TextEncoder().encode(JSON.stringify(payload,null,2)),blob=new Blob([bytes],{type:"application/json"});
 const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`${clean(project.title||"CAPS-Buch").replace(/[^a-z0-9äöüß]+/gi,"-")}-Konsistenzbericht.json`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),500);
 return link.download;
}

window.CAPS_ConsistencyEngine={run,isStale,approve,acknowledge,invalidate,download,fingerprint,categoryLabels:{...CATEGORY_LABELS},severityLabels:{...SEVERITY_LABELS},categoryOrder:[...CATEGORY_ORDER]};
})();
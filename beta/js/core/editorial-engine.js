(function(){
"use strict";

const clean=value=>String(value??"").replace(/\r/g,"").trim();
const words=value=>clean(value).split(/\s+/).filter(Boolean);
const wordCount=value=>words(value).length;
const paragraphs=value=>clean(value).split(/\n\s*\n/).map(part=>part.trim()).filter(Boolean);
const sentences=value=>(clean(value).match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)||[]).map(item=>item.trim()).filter(Boolean);
const lower=value=>clean(value).toLocaleLowerCase("de-DE");
const uniq=items=>[...new Set(items.filter(Boolean))];
const escapeRegExp=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const now=()=>new Date().toISOString();

const abstractWords=[
  "psychologisch","bewältigungsstrategie","entwicklungsziel","selbstwirksamkeit",
  "handlungsspielraum","emotionale regulation","intervention","treatment","story beat",
  "pädagogische wirkung","innere entwicklung","emotionale bedürfnisse"
];

const shamingPatterns=[
  /stell dich nicht so an/gi,/du musst nur mutig sein/gi,/sei doch brav/gi,
  /dafür bist du zu groß/gi,/hör auf zu weinen/gi,/es gibt keinen grund.*angst/gi,
  /wenn du lieb bist/gi,/du bist selbst schuld/gi
];

const fillerPhrases=[
  "für einen moment","ein wenig","plötzlich","irgendwie","ganz plötzlich",
  "dann","auf einmal","sah sich um","hob den blick","atmete tief ein"
];

function phraseMap(textValue,size=4){
  const tokens=lower(textValue).replace(/[„“"'(),;:!?….\-]/g," ").split(/\s+/).filter(token=>token.length>1);
  const map=new Map();
  for(let i=0;i<=tokens.length-size;i++){
    const phrase=tokens.slice(i,i+size).join(" ");
    if(/\b(und|oder|aber|dann|dass|weil)\b/.test(phrase)&&new Set(tokens.slice(i,i+size)).size<3)continue;
    map.set(phrase,(map.get(phrase)||0)+1);
  }
  return map;
}

function sentenceStartMap(textValue){
  const map=new Map();
  sentences(textValue).forEach(sentence=>{
    const start=lower(sentence).replace(/[„“"']/g,"").split(/\s+/).slice(0,3).join(" ");
    if(start)map.set(start,(map.get(start)||0)+1);
  });
  return map;
}

function dialogueRatio(textValue){
  const count=(textValue.match(/[„“]/g)||[]).length/2;
  return Math.min(1,count/Math.max(1,paragraphs(textValue).length));
}

function issue(category,severity,chapterId,message,example="",suggestion="",autoFix=false){
  return {id:`ED-${category}-${Math.random().toString(16).slice(2)}`,category,severity,chapterId,message,example,suggestion,autoFix};
}

function chapterAudit(chapter,index,allChapters,plan,settings){
  const textValue=clean(chapter.text),sents=sentences(textValue),paras=paragraphs(textValue);
  const hero=plan.characters?.[0]?.name||"";
  const previous=index?clean(allChapters[index-1].text):"";
  const next=index<allChapters.length-1?clean(allChapters[index+1].text):"";
  const maxSentence=settings?.readingLevel==="3–6 Jahre"?18:23;
  const issues=[];
  const long=sents.filter(sentence=>wordCount(sentence)>maxSentence+5);
  if(long.length){
    issues.push(issue("sprache","mittel",chapter.chapterId,
      `${long.length} sehr lange Sätze bremsen den Vorlesefluss.`,
      long[0],`Sätze auf höchstens etwa ${maxSentence} Wörter kürzen.`,true));
  }
  const abstract=abstractWords.filter(word=>lower(textValue).includes(word));
  if(abstract.length){
    issues.push(issue("sprache","hoch",chapter.chapterId,
      "Im Buchtext stehen abstrakte Planungs- oder Fachwörter.",
      abstract.join(", "),"Die Aussage als sichtbare Handlung, Gefühl oder Dialog erzählen.",true));
  }
  if(paras.some(paragraph=>wordCount(paragraph)>115)){
    const example=paras.find(paragraph=>wordCount(paragraph)>115);
    issues.push(issue("vorlesen","mittel",chapter.chapterId,
      "Ein Absatz ist für gemeinsames Vorlesen sehr dicht.",
      example?.slice(0,180)+"…","An einem natürlichen Handlungsmoment teilen.",true));
  }
  const starts=[...sentenceStartMap(textValue)].filter(([,count])=>count>=4);
  if(starts.length){
    issues.push(issue("stil","mittel",chapter.chapterId,
      "Mehrere Sätze beginnen gleich.",
      starts.map(([start,count])=>`„${start}“ (${count}×)`).join(", "),
      "Satzbau und Blickrichtung variieren.",true));
  }
  const filler=fillerPhrases.map(phrase=>[phrase,(lower(textValue).match(new RegExp(escapeRegExp(phrase),"g"))||[]).length]).filter(([,count])=>count>=3);
  if(filler.length){
    issues.push(issue("stil","niedrig",chapter.chapterId,
      "Einige Füllformulierungen wiederholen sich auffällig.",
      filler.map(([phrase,count])=>`„${phrase}“ (${count}×)`).join(", "),
      "Wiederholungen durch konkrete Handlungen oder direkte Übergänge ersetzen.",true));
  }
  shamingPatterns.forEach(pattern=>{
    const match=textValue.match(pattern);
    if(match)issues.push(issue("wirkung","hoch",chapter.chapterId,
      "Eine Formulierung könnte das Gefühl des Kindes beschämen oder verkleinern.",
      match[0],"Gefühl anerkennen und zugleich eine sichere Grenze oder Möglichkeit zeigen.",false));
  });
  if(/plötzlich (?:war|waren).{0,45}(?:weg|verschwunden|gelöst|gut)/i.test(textValue)){
    issues.push(issue("wirkung","hoch",chapter.chapterId,
      "Eine Schwierigkeit scheint ohne nachvollziehbare Handlung zu verschwinden.",
      textValue.match(/plötzlich (?:war|waren).{0,80}[.!?]/i)?.[0]||"",
      "Den Erfolg aus Übung, Beziehung und einer Entscheidung der Hauptfigur entstehen lassen.",false));
  }
  if(index===0){
    const opening=textValue.slice(0,900);
    if(hero&&!opening.includes(hero))issues.push(issue("dramaturgie","hoch",chapter.chapterId,
      "Die Hauptfigur wird am Anfang nicht klar eingeführt.","","Mit Name, konkreter Tätigkeit und einem kleinen Wunsch beginnen.",false));
    if(!/\b(baute|spielte|malte|suchte|packte|stand|saß|lief|legte|hielt|öffnete|zählte|hörte|sammelte|zog)\b/i.test(opening)){
      issues.push(issue("dramaturgie","hoch",chapter.chapterId,
        "Der Anfang startet eher mit Erklärung als mit einer sichtbaren Handlung.",
        opening.slice(0,180)+"…","Die Hauptfigur zuerst etwas Konkretes tun lassen.",false));
    }
  }else{
    const previousTerms=uniq(words(previous).filter(word=>word.length>7).map(lower)).slice(-40);
    const overlap=previousTerms.some(term=>lower(textValue.slice(0,500)).includes(term));
    if(!overlap&&!/\b(danach|deshalb|darum|noch|wieder|seitdem|am nächsten|auf dem weg)\b/i.test(textValue.slice(0,450))){
      issues.push(issue("dramaturgie","mittel",chapter.chapterId,
        "Der Kapitelanfang schließt nur schwach an das vorige Kapitel an.",
        textValue.slice(0,170)+"…","Eine konkrete Folge, einen Gegenstand oder ein offenes Gefühl aus dem vorigen Kapitel aufnehmen.",false));
    }
  }
  if(index<allChapters.length-1&&!/[!?…]$/.test(textValue)&&!/\bdoch|aber|bis|als plötzlich|noch bevor\b/i.test(textValue.slice(-220))){
    issues.push(issue("dramaturgie","niedrig",chapter.chapterId,
      "Das Kapitel endet ohne deutlichen Zug in den nächsten Abschnitt.",
      textValue.slice(-170),"Mit einer offenen Handlung, Frage oder neuen Folge enden.",false));
  }
  const names=(plan.characters||[]).map(character=>character.name).filter(Boolean);
  const present=names.filter(name=>textValue.includes(name));
  if(index>0&&present.length===0){
    issues.push(issue("figuren","hoch",chapter.chapterId,
      "Keine zentrale Figur ist im Kapitel namentlich verankert.",
      textValue.slice(0,170)+"…","Mindestens eine handelnde Figur klar benennen.",false));
  }
  if(dialogueRatio(textValue)===0&&wordCount(textValue)>170){
    issues.push(issue("figuren","niedrig",chapter.chapterId,
      "Das Kapitel enthält keinen direkten Dialog.",
      "","An einer passenden Stelle eine kurze, charakteristische Äußerung einsetzen.",false));
  }
  if(next&&textValue.slice(-350).trim()===next.slice(0,350).trim()){
    issues.push(issue("stil","hoch",chapter.chapterId,
      "Ein Textabschnitt wird im nächsten Kapitel wiederholt.",
      textValue.slice(-180),"Doppelung entfernen und nur die neue Folge erzählen.",true));
  }
  return issues;
}

function globalAudit(manuscript,plan){
  const full=clean(manuscript.fullText||manuscript.bookChapters.map(chapter=>chapter.text).join("\n\n"));
  const chapters=manuscript.bookChapters||[];
  const issues=[];
  const phrases=[...phraseMap(full,5)].filter(([,count])=>count>=3).sort((a,b)=>b[1]-a[1]).slice(0,10);
  if(phrases.length){
    issues.push(issue("stil","mittel",null,
      "Im Gesamtbuch wiederholen sich mehrere längere Wortfolgen.",
      phrases.map(([phrase,count])=>`„${phrase}“ (${count}×)`).join("; "),
      "Die späteren Wiederholungen umformulieren oder durch konkrete neue Beobachtungen ersetzen.",true));
  }
  const duplicateParas=new Map();
  paragraphs(full).forEach(paragraph=>{
    const key=lower(paragraph).replace(/\s+/g," ");
    if(key.length>45)duplicateParas.set(key,(duplicateParas.get(key)||0)+1);
  });
  const duplicates=[...duplicateParas].filter(([,count])=>count>1);
  if(duplicates.length){
    issues.push(issue("stil","hoch",null,
      `${duplicates.length} Absätze kommen wortgleich mehrfach vor.`,
      duplicates[0][0].slice(0,180)+"…","Spätere Doppelungen entfernen.",true));
  }
  const treatment=plan.storyTreatment||{};
  const finalText=clean(chapters.at(-1)?.text);
  const concrete=clean(plan.storyBible?.psychologicalProfile?.concreteSituation);
  const anchor=words(concrete).find(word=>word.length>7);
  if(anchor&&!lower(finalText).includes(lower(anchor))){
    issues.push(issue("dramaturgie","mittel",chapters.at(-1)?.chapterId||null,
      "Das Ende kehrt nicht deutlich genug zu einer ähnlichen Alltagssituation zurück.",
      finalText.slice(-220),"Das neue Verhalten in einer kleinen, vertrauten Situation zeigen.",false));
  }
  const climaxTerms=words(treatment.climax?.decisiveAction||treatment.climax?.result||"").filter(word=>word.length>7);
  const lateText=chapters.slice(-2).map(chapter=>chapter.text).join(" ");
  if(climaxTerms.length&&!climaxTerms.some(term=>lower(lateText).includes(lower(term)))){
    issues.push(issue("dramaturgie","hoch",chapters.at(-2)?.chapterId||null,
      "Der vorbereitete Höhepunkt ist im letzten Buchdrittel nicht klar wiederzuerkennen.",
      "","Die entscheidende Handlung aus dem Geschichtenentwurf konkret ausspielen.",false));
  }
  const hero=plan.characters?.[0]?.name;
  const opening=clean(chapters[0]?.text),ending=finalText;
  if(hero&&(!opening.includes(hero)||!ending.includes(hero))){
    issues.push(issue("figuren","hoch",null,
      "Die Hauptfigur rahmt Anfang und Ende nicht zuverlässig.",
      "","Die Hauptfigur sowohl im Einstieg als auch im Alltagstransfer klar handeln lassen.",false));
  }
  return issues;
}

function categoryScore(issues,category){
  const relevant=issues.filter(item=>item.category===category);
  const penalty=relevant.reduce((sum,item)=>sum+(item.severity==="hoch"?18:item.severity==="mittel"?10:5),0);
  return Math.max(0,100-penalty);
}

function run(manuscript,plan){
  const chapters=manuscript.bookChapters||[];
  const issues=chapters.flatMap((chapter,index)=>chapterAudit(chapter,index,chapters,plan,manuscript.settings||{})).concat(globalAudit(manuscript,plan));
  const categories=[
    ["dramaturgie","Dramaturgie"],
    ["figuren","Figuren und Kontinuität"],
    ["sprache","Kinderbuchsprache"],
    ["stil","Stil und Wiederholungen"],
    ["vorlesen","Vorleserhythmus"],
    ["wirkung","Pädagogische Wirkung"]
  ].map(([id,label])=>({id,label,score:categoryScore(issues,id),issueCount:issues.filter(item=>item.category===id).length}));
  const score=Math.round(categories.reduce((sum,item)=>sum+item.score,0)/categories.length);
  const high=issues.filter(item=>item.severity==="hoch").length;
  const medium=issues.filter(item=>item.severity==="mittel").length;
  const report={
    schemaVersion:"1.0",generatedAt:now(),score,categories,issues,
    summary:{high,medium,low:issues.length-high-medium,autoFixable:issues.filter(item=>item.autoFix).length},
    approved:false,
    readyForLayout:score>=82&&high===0
  };
  manuscript.editorialReport=report;
  manuscript.editorialStatus="reviewed";
  return report;
}

function normalizeTypography(textValue){
  return clean(textValue)
    .replace(/[ \t]+/g," ")
    .replace(/ +([,.;:!?])/g,"$1")
    .replace(/([,.;:!?])([A-Za-zÄÖÜäöüß])/g,"$1 $2")
    .replace(/\n[ \t]+/g,"\n")
    .replace(/\n{3,}/g,"\n\n")
    .replace(/\b([\p{L}]+)\s+\1\b/giu,"$1")
    .replace(/\.{3,}/g,"…")
    .trim();
}

function replaceAbstract(textValue){
  const replacements=[
    [/\bBewältigungsstrategie\b/gi,"ein hilfreicher Schritt"],
    [/\bEntwicklungsziel\b/gi,"das, was sich verändern durfte"],
    [/\bSelbstwirksamkeit\b/gi,"das Gefühl, selbst etwas tun zu können"],
    [/\bHandlungsspielraum\b/gi,"mehr Möglichkeiten"],
    [/\bemotionale Regulation\b/gi,"wieder ruhiger werden"],
    [/\bpsychologisch(?:e|en|er|es)?\b/gi,"innerlich"],
    [/\bpädagogische Wirkung\b/gi,"das, was die Geschichte im Herzen zurückließ"],
    [/\bIntervention\b/gi,"Hilfe"],
    [/\bTreatment\b/gi,"Geschichtenplan"],
    [/\bStory Beat\b/gi,"Handlungsschritt"]
  ];
  return replacements.reduce((value,[pattern,replacement])=>value.replace(pattern,replacement),textValue);
}

function splitLongSentences(textValue,maxWords){
  return sentences(textValue).map(sentence=>{
    if(wordCount(sentence)<=maxWords+5)return sentence;
    const candidates=[", und ",", aber ",", denn ",", weil ",", während "];
    for(const separator of candidates){
      const index=sentence.indexOf(separator);
      if(index>35&&index<sentence.length-28){
        const left=sentence.slice(0,index).trim().replace(/[,;:]$/,"");
        let right=sentence.slice(index+separator.length).trim().replace(/[.!?…]$/,"");
        right=right.charAt(0).toUpperCase()+right.slice(1);
        return `${left}. ${right}.`;
      }
    }
    return sentence;
  }).join(" ");
}

function varyFillers(textValue){
  const alternatives={
    "Für einen Moment":["Kurz","Einen Herzschlag lang","Da"],
    "Plötzlich":["Da","Ohne Vorwarnung","Im nächsten Augenblick"],
    "Dann":["Daraufhin","Als Nächstes","Nun"],
    "Ein wenig":["leicht","etwas",""]
  };
  let value=textValue;
  Object.entries(alternatives).forEach(([phrase,replacements])=>{
    let count=0;
    value=value.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`,"g"),match=>{
      count++;
      if(count<=2)return match;
      return replacements[(count-3)%replacements.length];
    });
  });
  return value.replace(/  +/g," ");
}

function removeDuplicateParagraphs(textValue){
  const seen=new Set();
  return paragraphs(textValue).filter(paragraph=>{
    const key=lower(paragraph).replace(/\s+/g," ");
    if(key.length<45)return true;
    if(seen.has(key))return false;
    seen.add(key);return true;
  }).join("\n\n");
}

function applySafeEdits(manuscript,plan){
  manuscript.editorialHistory=manuscript.editorialHistory||[];
  manuscript.editorialHistory.push({
    changedAt:now(),
    chapters:(manuscript.bookChapters||[]).map(chapter=>({chapterId:chapter.chapterId,text:chapter.text,revision:chapter.revision||1})),
    report:manuscript.editorialReport||null
  });
  const max=manuscript.settings?.readingLevel==="3–6 Jahre"?18:23;
  (manuscript.bookChapters||[]).forEach(chapter=>{
    let value=chapter.text;
    value=normalizeTypography(value);
    value=replaceAbstract(value);
    value=removeDuplicateParagraphs(value);
    value=varyFillers(value);
    value=paragraphs(value).map(paragraph=>splitLongSentences(paragraph,max)).join("\n\n");
    chapter.text=normalizeTypography(value);
    chapter.paragraphs=paragraphs(chapter.text).map((text,index)=>({
      id:chapter.paragraphs?.[index]?.id||`PAR-${chapter.chapterId}-${index}`,
      text,
      beatNumbers:chapter.paragraphs?.[index]?.beatNumbers||chapter.sourceBeatNumbers||[],
      kind:"editorial"
    }));
    chapter.revision=(chapter.revision||1)+1;
    chapter.wordCount=wordCount(chapter.text);
  });
  manuscript.scenes=CAPS_ManuscriptEngine.deriveScenes
    ?CAPS_ManuscriptEngine.deriveScenes(plan,manuscript.bookChapters,manuscript.scenes)
    :manuscript.scenes;
  CAPS_ManuscriptEngine.recalc(manuscript,plan);
  const report=run(manuscript,plan);
  manuscript.editorialStatus="corrected";
  report.appliedAt=now();
  return report;
}

function approve(manuscript){
  if(!manuscript.editorialReport)return false;
  manuscript.editorialReport.approved=!manuscript.editorialReport.approved;
  manuscript.editorialStatus=manuscript.editorialReport.approved?"approved":"reviewed";
  return manuscript.editorialReport.approved;
}

function invalidate(manuscript){
  if(!manuscript)return manuscript;
  manuscript.editorialReport=null;
  manuscript.editorialStatus="open";
  return manuscript;
}

window.CAPS_EditorialEngine={run,applySafeEdits,approve,invalidate};
})();
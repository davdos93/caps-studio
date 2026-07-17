const fs=require("fs"),vm=require("vm");
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},window:{}};sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ["src/js/core/story-treatment-engine.js","src/js/core/book-engine.js","src/js/core/manuscript-engine.js","src/js/core/layout-engine.js"]){vm.runInContext(fs.readFileSync(file,"utf8"),sandbox,{filename:file});}
const intake={childAge:"5 Jahre",problemTopic:"Angst beim Abschied",concreteSituation:"An der Kindergartentür hält Mira Papa fest.",currentReaction:"Mira weint und fragt, ob Papa zurückkommt.",childFeelings:["Angst"],interests:["Tiere"],characters:[{name:"Mira",age:"5 Jahre"}]};
const plan=sandbox.CAPS_BookEngine.generate(intake);const manuscript=sandbox.CAPS_ManuscriptEngine.generate(plan);const project={title:plan.storyBible.title,subtitle:plan.storyBible.subtitle,audience:"5 Jahre",bookPlan:plan,manuscript,illustrations:null,layout:null};
const estimate=sandbox.CAPS_LayoutEngine.preview(project);sandbox.CAPS_LayoutEngine.generate(project);const layout=project.layout;
if(layout.schemaVersion!=="2.0"||layout.engine!=="narrative-layout")throw new Error("Layoutschema fehlt");
if(layout.spreads.length<12||layout.spreads.length>24)throw new Error("Doppelseitenzahl außerhalb 12–24");
for(const role of ["opening","problem","climax","ending"]){if(!layout.spreads.some(s=>s.role===role))throw new Error("Rolle fehlt: "+role);}
if(!layout.spreads.every(s=>Array.isArray(s.sourceBlockIds)&&s.rhythm&&s.composition&&Number.isFinite(s.pageTurnStrength)))throw new Error("Metadaten fehlen");
if(!layout.quality||layout.quality.checks.length!==7)throw new Error("Qualitätsprüfung fehlt");
const old={schemaVersion:"1.0",generator:"Legacy",settings:{fontFamily:"Arial"},cover:{title:"Alt",subtitle:"",author:"Test"},spreads:[{id:"OLD",sceneId:"X",text:"Alt",textEdited:true}]};project.layout=old;sandbox.CAPS_LayoutEngine.migrate(project);
if(project.layout.schemaVersion!=="2.0"||!project.layout.migration?.legacySnapshot)throw new Error("Migration fehlgeschlagen");
if(project.layout.settings.fontFamily!=="Arial"||project.layout.cover.author!=="Test")throw new Error("Layoutoptionen nicht migriert");
const short=JSON.parse(JSON.stringify(project));short.layout=null;short.manuscript.bookChapters=short.manuscript.bookChapters.slice(0,2);short.manuscript.scenes=short.manuscript.scenes.filter(s=>s.chapterNumber<=2);sandbox.CAPS_LayoutEngine.generate(short);
const long=JSON.parse(JSON.stringify(project));long.layout=null;long.manuscript.bookChapters=long.manuscript.bookChapters.concat(JSON.parse(JSON.stringify(long.manuscript.bookChapters)));long.manuscript.bookChapters.forEach((c,i)=>{c.chapterId=c.chapterId+"-"+i;c.id=c.chapterId;});sandbox.CAPS_LayoutEngine.generate(long);
if(short.layout.spreads.length!==12)throw new Error("Mindestwert nicht eingehalten");if(long.layout.spreads.length<layout.spreads.length)throw new Error("Dynamiktest fehlgeschlagen");
console.log(JSON.stringify({estimate:estimate.targetSpreadCount,spreads:layout.spreads.length,pages:layout.pageCount,quality:layout.quality.score,roles:[...new Set(layout.spreads.map(s=>s.role))].length,short:short.layout.spreads.length,long:long.layout.spreads.length,migrated:true},null,2));
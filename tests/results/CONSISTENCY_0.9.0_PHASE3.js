
const fs=require("fs"),vm=require("vm");
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},window:{},Blob:function(){},URL:{createObjectURL(){return ""},revokeObjectURL(){}},TextEncoder};
sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ["story-treatment-engine.js","book-engine.js","manuscript-engine.js","editorial-engine.js","layout-engine.js","illustration-engine.js","consistency-engine.js"]){
 vm.runInContext(fs.readFileSync("src/js/core/"+file,"utf8"),sandbox,{filename:file});
}
const intake={childAge:"5 Jahre",problemTopic:"Angst beim Abschied",concreteSituation:"An der Kindergartentür hält Mira Papa fest.",currentReaction:"Mira weint und fragt, ob Papa zurückkommt.",childFeelings:["Angst"],interests:["Tiere"],characters:[{name:"Mira",age:"5 Jahre",hairColor:"braun",clothing:"gelbe Jacke"},{name:"Papa",age:"35 Jahre",clothing:"blaue Jacke"}]};
const project={id:"P1",title:"Miras Buch",bookPlan:sandbox.CAPS_BookEngine.generate(intake)};
project.manuscript=sandbox.CAPS_ManuscriptEngine.generate(project.bookPlan);
sandbox.CAPS_EditorialEngine.run(project.manuscript,project.bookPlan);
project.manuscript.editorialReport.approved=true;
sandbox.CAPS_LayoutEngine.generate(project);
sandbox.CAPS_IllustrationEngine.generate(project);
const baseline=sandbox.CAPS_ConsistencyEngine.run(project);
if(baseline.categories.length!==9)throw new Error("Neun Kategorien fehlen");
if(baseline.counts.blocker!==0)throw new Error("Generiertes Referenzbuch besitzt unerwartete Blocker: "+baseline.findings.filter(x=>x.severity==="blocker").map(x=>x.code).join(","));
if(!sandbox.CAPS_ConsistencyEngine.approve(project))throw new Error("Quality Gate konnte nicht freigegeben werden");
const first=project.illustrations.items[0],last=project.manuscript.bookChapters.at(-1);
first.characters.push("Geisterfigur");
first.sourceHash="veraltet";
last.text+=" Keine Angst mehr. Alles war plötzlich gut.";
const broken=sandbox.CAPS_ConsistencyEngine.run(project);
for(const code of ["unknown-image-character","stale-image-source","miracle-resolution"])if(!broken.findings.some(item=>item.code===code))throw new Error("Fehler nicht erkannt: "+code);
const warning=broken.findings.find(item=>item.severity==="warning"||item.severity==="recommendation");
if(warning&&!sandbox.CAPS_ConsistencyEngine.acknowledge(project,warning.id))throw new Error("Kenntnisnahme fehlgeschlagen");
project.manuscript.bookChapters[0].text+=" Eine neue Änderung.";
if(!sandbox.CAPS_ConsistencyEngine.isStale(project))throw new Error("Veralteter Bericht nicht erkannt");
console.log(JSON.stringify({baselineScore:baseline.score,baselineBlockers:baseline.counts.blocker,brokenBlockers:broken.counts.blocker,findings:broken.findings.length,categories:broken.categories.length,stale:project.consistencyReport.stale},null,2));


const fs=require("fs"),vm=require("vm");
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},window:{}};
sandbox.window=sandbox;
vm.createContext(sandbox);
for(const file of ["src/js/core/story-treatment-engine.js","src/js/core/book-engine.js","src/js/core/manuscript-engine.js","src/js/core/editorial-engine.js"]){
 vm.runInContext(fs.readFileSync(file,"utf8"),sandbox,{filename:file});
}
const intake={childAge:"5 Jahre",problemTopic:"Angst beim Abschied",concreteSituation:"An der Kindergartentür hält Mira Papa fest.",currentReaction:"Mira weint und fragt, ob Papa zurückkommt.",childFeelings:["Angst"],interests:["Tiere"],characters:[{name:"Mira",age:"5 Jahre"}]};
const plan=sandbox.CAPS_BookEngine.generate(intake);
const ms=sandbox.CAPS_ManuscriptEngine.generate(plan);
ms.bookChapters[0].text+="\n\nFür einen Moment war es plötzlich plötzlich ganz still. Bewältigungsstrategie Bewältigungsstrategie.";
sandbox.CAPS_ManuscriptEngine.recalc(ms,plan);
const before=sandbox.CAPS_EditorialEngine.run(ms,plan);
if(!before.categories||before.categories.length!==6)throw new Error("Kategorien fehlen");
if(!before.issues.some(item=>item.autoFix))throw new Error("Keine automatische Korrektur erkannt");
sandbox.CAPS_EditorialEngine.applySafeEdits(ms,plan);
if(/Bewältigungsstrategie|plötzlich plötzlich/i.test(ms.bookChapters[0].text))throw new Error("Sichere Korrektur fehlgeschlagen");
if(!ms.editorialReport)throw new Error("Erneute Prüfung fehlt");
console.log(JSON.stringify({chapters:ms.bookChapters.length,before:before.score,after:ms.editorialReport.score,issues:ms.editorialReport.issues.length,categories:ms.editorialReport.categories.length},null,2));

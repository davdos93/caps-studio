
const fs=require("fs"),vm=require("vm");
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},window:{}};
vm.createContext(sandbox);
for(const file of ["src/js/core/book-engine.js","src/js/core/manuscript-engine.js","src/js/core/illustration-engine.js"]){
  vm.runInContext(fs.readFileSync(file,"utf8"),sandbox,{filename:file});
}
const intake={
 childAge:"5 Jahre",
 problemTopic:"Mein Kind hat große Angst beim Abschied im Kindergarten.",
 concreteSituation:"An der Tür klammert es sich an mich und möchte wieder mit nach Hause.",
 currentReaction:"Es weint, hält mich fest und fragt immer wieder, ob ich wirklich zurückkomme.",
 childFeelings:[],
 interests:["Tiere"],
 safePeople:"Papa und der Stoffhase",
 storyWorldChoice:"CAPS soll entscheiden",
 storyDistance:"CAPS soll entscheiden",
 avoidContent:"",
 sensitiveWords:"",
 additionalContext:"",
 bookStyle:["warmherzig"],
 characters:[{name:"Mira",age:"5 Jahre",appearanceDescription:"lockige dunkle Haare und ein grüner Pullover"}]
};
const analysis=sandbox.window.CAPS_BookEngine.analyze(intake);
for(const key of ["emotionalNeed","desiredDevelopment","copingStrategy","supportiveResponse","realisticSuccess","parentMessage"]){
  if(!analysis.profile[key]||analysis.profile[key].length<20)throw new Error("Automatische Ableitung fehlt: "+key);
}
if(!/Trennung/.test(analysis.category))throw new Error("Thema wurde nicht erkannt: "+analysis.category);
const plan=sandbox.window.CAPS_BookEngine.generate(intake);
if(!plan.storyBible.title||plan.storyBible.title==="Unbenanntes Buch")throw new Error("Titel nicht automatisch erzeugt");
if(plan.characters.length<3)throw new Error("Begleitfiguren wurden nicht ergänzt");
if(!plan.scenes.every(scene=>scene.copingStrategy&&scene.psychologicalFunction))throw new Error("Analyse fehlt in Szenen");
const manuscript=sandbox.window.CAPS_ManuscriptEngine.generate(plan);
if(!manuscript.scenes.every(scene=>scene.text.includes("Mira")))throw new Error("Hauptfigur fehlt im Manuskript");
const illustrations=sandbox.window.CAPS_IllustrationEngine.generate(plan);
const project={bookPlan:plan,manuscript,illustrations};
sandbox.window.CAPS_IllustrationEngine.rebuildPrompts(project);
if(!illustrations.items.every(item=>item.prompt.includes("Psychologische Funktion")))throw new Error("Analyse fehlt in Bildprompts");
console.log(JSON.stringify({
 category:analysis.category,
 title:plan.storyBible.title,
 pages:plan.scenes.length*2,
 characters:plan.characters.length,
 scenes:plan.scenes.length,
 manuscriptQuality:manuscript.qualityScore
},null,2));

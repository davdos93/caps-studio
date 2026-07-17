const fs=require("fs"),vm=require("vm");
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},window:{}};vm.createContext(sandbox);
for(const file of ["src/js/core/story-treatment-engine.js","src/js/core/book-engine.js","src/js/core/manuscript-engine.js","src/js/core/illustration-engine.js"]){vm.runInContext(fs.readFileSync(file,"utf8"),sandbox,{filename:file});}
const intake={childAge:"5 Jahre",problemTopic:"Angst beim Abschied im Kindergarten",concreteSituation:"Mira klammert sich an der Tür an ihren Vater und möchte wieder mit nach Hause.",currentReaction:"Mira weint, hält Papa fest und fragt immer wieder, ob er zurückkommt.",childFeelings:["Angst","Unsicherheit"],interests:["Tiere"],safePeople:"Papa und der Stoffhase",storyWorldChoice:"CAPS soll entscheiden",storyDistance:"CAPS soll entscheiden",bookStyle:["warmherzig"],characters:[{name:"Mira",age:"5 Jahre",strengths:["beobachtet genau"],appearanceDescription:"lockige dunkle Haare und grüner Pullover"}]};
const plan=sandbox.window.CAPS_BookEngine.generate(intake);const ms=sandbox.window.CAPS_ManuscriptEngine.generate(plan);
if(ms.schemaVersion!=="5.0")throw new Error("Schema 5.0 fehlt");
if(ms.bookChapters.length!==plan.chapters.length)throw new Error("Kapitelzahl falsch");
if(!ms.fullText.includes("Kapitel 1:"))throw new Error("Gesamtmanuskript fehlt");
if(!ms.bookChapters[0].text.includes("Mira"))throw new Error("Hauptfigur fehlt am Anfang");
if(!ms.bookChapters[0].text.includes("Kindergarten")&&!ms.bookChapters[0].text.includes("Tür"))throw new Error("Alltagssituation fehlt am Anfang");
if(ms.fullText.match(/psychologisch|Bewältigungsstrategie|Entwicklungsziel|Treatment|Beat/i))throw new Error("Planungssprache im Buchtext");
const beats=new Set(ms.bookChapters.flatMap(ch=>ch.sourceBeatNumbers));if(beats.size<13)throw new Error("Treatment nicht vollständig verarbeitet");
if(ms.scenes.length!==plan.scenes.length||ms.scenes.some(scene=>!scene.text))throw new Error("Abschnittsableitung fehlgeschlagen");
const before=ms.bookChapters[2].revision;sandbox.window.CAPS_ManuscriptEngine.rewriteChapter(plan,ms,ms.bookChapters[2].chapterId,"vivid");if(ms.bookChapters[2].revision<=before)throw new Error("Kapitelrewrite fehlgeschlagen");
sandbox.window.CAPS_ManuscriptEngine.updateChapter(ms,plan,ms.bookChapters[0].chapterId,ms.bookChapters[0].text+"\n\nMira legte die Hand auf den Stoffhasen.");if(!ms.fullText.includes("Stoffhasen"))throw new Error("Kapiteländerung nicht synchronisiert");
const illustrations=sandbox.window.CAPS_IllustrationEngine.generate(plan);const project={bookPlan:plan,manuscript:ms,illustrations};sandbox.window.CAPS_IllustrationEngine.rebuildPrompts(project);if(!illustrations.items.every(item=>item.prompt))throw new Error("Illustrationssync fehlt");
console.log(JSON.stringify({chapters:ms.bookChapters.length,scenes:ms.scenes.length,words:ms.wordCount,bookQuality:ms.bookQuality.score,treatmentBeats:beats.size},null,2));
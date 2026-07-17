
const fs=require("fs"),vm=require("vm");
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},window:{}};
vm.createContext(sandbox);
for(const f of ["src/js/core/story-treatment-engine.js","src/js/core/book-engine.js"]){vm.runInContext(fs.readFileSync(f,"utf8"),sandbox,{filename:f})}
const input={childAge:"5 Jahre",problemTopic:"Angst beim Abschied im Kindergarten",concreteSituation:"Mira hält sich an Papas Jacke fest, weint und möchte wieder nach Hause.",currentReaction:"Mira klammert sich fest und fragt immer wieder, ob Papa wirklich zurückkommt.",childFeelings:["Angst","Unsicherheit"],interests:["Tiere","Wald"],safePeople:"Papa und der Stoffhase",storyWorldChoice:"CAPS soll entscheiden",bookStyle:["warmherzig"],characters:[{name:"Mira",age:"5 Jahre",strengths:["beobachtet genau"],appearanceDescription:"dunkle Locken und grüner Pullover"}]};
const plan=sandbox.window.CAPS_BookEngine.generate(input),t=plan.storyTreatment;
if(!t||t.beats.length!==14)throw new Error("Treatment fehlt");
if(t.qualityReport.score<90)throw new Error("Treatmentqualität zu niedrig: "+t.qualityReport.score);
if(!t.beats.slice(1).every((b,i)=>b.because===t.beats[i].consequence))throw new Error("Kausalkette unterbrochen");
if(!plan.scenes.every(s=>s.treatmentBeatId&&s.causality?.because&&s.decision))throw new Error("Szenen nicht aus Treatment erzeugt");
if(!/wegen|zuvor|verbunden/.test(t.climax.logic))throw new Error("Höhepunkt nicht vorbereitet");
if(!t.ending.everydayEcho)throw new Error("Alltagsecho fehlt");
console.log(JSON.stringify({treatmentScore:t.qualityReport.score,beats:t.beats.length,chapters:plan.chapters.length,scenes:plan.scenes.length,causalLinks:t.beats.length-1,characterArcs:t.characterArcs.length},null,2));

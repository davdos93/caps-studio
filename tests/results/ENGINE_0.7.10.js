
const fs=require("fs"),vm=require("vm");
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},window:{}};
vm.createContext(sandbox);
for(const file of ["src/js/core/book-engine.js","src/js/core/manuscript-engine.js"]){vm.runInContext(fs.readFileSync(file,"utf8"),sandbox,{filename:file});}
const intake={childAge:"6 Jahre",problemTopic:"Mein Kind hat Angst vor Fehlern und gibt sofort auf.",concreteSituation:"Beim Malen oder Bauen hört es auf, sobald etwas nicht genau gelingt.",currentReaction:"Es zerknüllt das Bild, sagt ich kann das nicht und möchte, dass ein Erwachsener es übernimmt.",childFeelings:["Frust","Unsicherheit"],interests:["Weltraum"],bookStyle:["warmherzig","spannend"],characters:[{name:"Noa",age:"6 Jahre",strengths:["neugierig"],appearanceDescription:"kurze Locken, gelber Pullover"}]};
const plan=sandbox.window.CAPS_BookEngine.generate(intake);
const ms=sandbox.window.CAPS_ManuscriptEngine.generate(plan);
if(ms.generator!=="CAPS Coherent Narrative Writer 3.0")throw new Error("Falscher Generator");
if(ms.scenes.length<16)throw new Error("Zu wenige Szenen");
const all=ms.scenes.map(s=>s.text).join("\n");
if(/die moral|die botschaft war|plötzlich war alles gut|musste nur mutig sein/i.test(all))throw new Error("Belehrende Schablone");
if(ms.scenes.some(s=>s.text.split(/\n\s*\n/).length<5))throw new Error("Zu wenige Absätze");
if(ms.scenes.some(s=>s.text.split(/\n\s*\n/).some(p=>p.trim().split(/\s+/).length<12)))throw new Error("Abgehackte Kurzabsätze");
if(ms.scenes.slice(1).some(s=>!s.quality.continuity))throw new Error("Kontinuität fehlt");
if(ms.scenes.some(s=>!s.quality.paragraphCohesion))throw new Error("Absatzkohärenz fehlt");
if(ms.scenes.some(s=>!s.quality.naturalDialogue))throw new Error("Dialog fehlt");
const motif=new Set(ms.scenes.map(s=>s.narrativeMeta.motif));
if(motif.size!==1)throw new Error("Motiv inkonsistent");
const unique=new Set(ms.scenes.map(s=>s.text));
if(unique.size!==ms.scenes.length)throw new Error("Doppelte Szenen");
const avg=Math.round(ms.scenes.reduce((sum,s)=>sum+s.wordCount,0)/ms.scenes.length);
if(avg<180)throw new Error("Zu kurze Szenen: "+avg);
console.log(JSON.stringify({scenes:ms.scenes.length,averageWords:avg,quality:ms.qualityScore,motif:[...motif][0],unique:unique.size,continuity:ms.scenes.slice(1).every(s=>s.quality.continuity)},null,2));

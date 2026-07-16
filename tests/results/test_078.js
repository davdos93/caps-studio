
const fs=require("fs"),vm=require("vm");
const sandbox={
  console,
  crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},
  window:{}
};
vm.createContext(sandbox);
for(const file of ["src/js/core/book-engine.js","src/js/core/manuscript-engine.js","src/js/core/illustration-engine.js"]){
  vm.runInContext(fs.readFileSync(file,"utf8"),sandbox,{filename:file});
}
const brief={
 title:"Mira und die leise Tür",subtitle:"Ein Abenteuer über Trennung und Wiedersehen",
 childAge:"5 Jahre",pages:40,
 problemTopic:"Angst vor der Trennung am Morgen",
 concreteSituation:"Mira klammert sich beim Abschied vor dem Kindergarten an ihren Vater und fürchtet, dass er nicht zurückkommt.",
 triggerSituations:["Abschied an der Tür","Viele fremde Stimmen"],
 currentReaction:"Mira hält sich fest, weint und möchte sofort wieder nach Hause.",
 childFeelings:["Angst","Unsicherheit"],emotionalNeed:"Verlässlichkeit, Orientierung und eine sichere Verbindung.",
 previousAttempts:"Schnelles Ablenken hilft nur kurz.",
 desiredDevelopment:"Mira findet ein eigenes Abschiedsritual und wagt einen kleinen Schritt in den Raum.",
 copingStrategy:"Gefühl benennen, drei ruhige Atemzüge nehmen, das Abschiedszeichen berühren und zur vertrauten Bezugsperson gehen.",
 supportiveResponse:"Der Vater bleibt ruhig, benennt die Rückkehr konkret und übergibt Mira aufmerksam an die vertraute Erzieherin.",
 realisticSuccess:"Mira ist noch traurig, kann sich aber verabschieden und später selbst ins Spiel finden.",
 parentMessage:"Abschied bedeutet nicht, verlassen zu werden.",
 storyDistance:"Ausgewogen – erkennbar, aber als eigenständiges Abenteuer",
 avoidContent:"Keine Beschämung und kein heimliches Weggehen.",
 characters:[
  {name:"Mira",role:"Hauptfigur",age:"5 Jahre",strengths:["fantasievoll"],challenge:"fürchtet Trennung",development:"findet ein eigenes Ritual",description:"beobachtet genau",relationship:"Tochter von Papa",appearanceDescription:"lockige schwarze Haare, grüner Pullover"},
  {name:"Nilo",role:"Begleiter",age:"jung",strengths:["geduldig"],challenge:"",development:"",description:"kleiner Nachtfalter",relationship:"bleibt an Miras Seite",appearanceDescription:"blauer Falter"}
 ],
 worldType:"verwunschener Garten",worldName:"Garten der leisen Türen",
 locations:["Zuhause","Gartentor","Moosweg","Leuchthaus","Türensaal","Zuhause"],
 adventureType:"die verschwundene Rückkehrglocke finden",
 bookStyle:["warmherzig"],interests:["Tiere"],secondaryMessages:[]
};
const plan=sandbox.window.CAPS_BookEngine.generate(brief);
if(plan.storyBible.psychologicalProfile.topic!==brief.problemTopic)throw new Error("Thema fehlt");
if(!plan.scenes.every(s=>s.psychologicalFunction&&s.copingStrategy))throw new Error("Szenenwirkung fehlt");
const manuscript=sandbox.window.CAPS_ManuscriptEngine.generate(plan);
if(manuscript.scenes.length!==plan.scenes.length)throw new Error("Szenenzahl falsch");
if(!manuscript.scenes.every(s=>s.text.includes("Mira")))throw new Error("Hauptfigur fehlt");
if(manuscript.scenes.some(s=>/Elias|Lia|Flammenzahn/.test(s.text)))throw new Error("Feste Beispielhandlung vorhanden");
const unique=new Set(manuscript.scenes.map(s=>s.text));
if(unique.size!==manuscript.scenes.length)throw new Error("Doppelte Szenen");
const avg=manuscript.scenes.reduce((n,s)=>n+s.wordCount,0)/manuscript.scenes.length;
if(avg<130)throw new Error("Texte zu kurz: "+avg);
const illustrations=sandbox.window.CAPS_IllustrationEngine.generate(plan);
const project={bookPlan:plan,manuscript,illustrations};
sandbox.window.CAPS_IllustrationEngine.rebuildPrompts(project);
if(!illustrations.items[0].prompt.includes("Psychologische Funktion"))throw new Error("Bildwirkung fehlt");
console.log(JSON.stringify({scenes:plan.scenes.length,averageWords:Math.round(avg),quality:manuscript.qualityScore,unique:unique.size},null,2));

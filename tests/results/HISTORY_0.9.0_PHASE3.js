
const fs=require("fs"),vm=require("vm");
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},window:{}};
sandbox.window=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("src/js/core/history-engine.js","utf8"),sandbox,{filename:"history-engine.js"});
const p={id:"P3",title:"Historie",version:1,bookPlan:{storyTreatment:{beats:[]}},consistencyReport:{score:91,counts:{blocker:0,warning:2,recommendation:1},approved:true,findings:[{id:"A"}]}};
sandbox.CAPS_HistoryEngine.createInitial(p);
const checkpoint=sandbox.CAPS_HistoryEngine.capture(p,{label:"Mit Konsistenz",kind:"manual",force:true});
p.consistencyReport={score:44,counts:{blocker:3,warning:4,recommendation:0},approved:false,findings:[{id:"B"}]};
sandbox.CAPS_HistoryEngine.capture(p,{label:"Geändert",force:true});
const comparison=sandbox.CAPS_HistoryEngine.compare(p,checkpoint.id,"current","consistency");
if(!comparison.sections[0].changed)throw new Error("Konsistenzvergleich erkennt Änderung nicht");
sandbox.CAPS_HistoryEngine.restore(p,checkpoint.id,"consistency");
if(p.consistencyReport.score!==91||!p.consistencyReport.approved)throw new Error("Konsistenzbericht nicht wiederhergestellt");
if(!sandbox.CAPS_HistoryEngine.stageOrder.includes("consistency"))throw new Error("Konsistenzstufe fehlt");
console.log(JSON.stringify({stages:sandbox.CAPS_HistoryEngine.stageOrder.length,checkpoints:sandbox.CAPS_HistoryEngine.stats(p).checkpoints,restoredScore:p.consistencyReport.score,comparisonChanges:comparison.totalChanges},null,2));

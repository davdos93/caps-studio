
const fs=require("fs"),vm=require("vm");
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},window:{},Blob:function(){},URL:{createObjectURL(){return ""},revokeObjectURL(){}},TextEncoder};
sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ["story-treatment-engine.js","book-engine.js","manuscript-engine.js","editorial-engine.js","layout-engine.js","illustration-engine.js","consistency-engine.js","workflow-engine.js"]){
 vm.runInContext(fs.readFileSync("src/js/core/"+file,"utf8"),sandbox,{filename:file});
}
const intake={childAge:"5 Jahre",problemTopic:"Angst beim Abschied",concreteSituation:"An der Kindergartentür hält Mira Papa fest.",currentReaction:"Mira weint und fragt, ob Papa zurückkommt.",childFeelings:["Angst"],interests:["Tiere"],characters:[{name:"Mira",age:"5 Jahre",hairColor:"braun",clothing:"gelbe Jacke"},{name:"Papa",age:"35 Jahre",clothing:"blaue Jacke"}]};
const p={id:"P2",title:"Workflow-Test",bookBrief:intake,bookPlan:sandbox.CAPS_BookEngine.generate(intake),planStatus:"approved"};
p.bookPlan.approvals={treatment:true};
p.manuscript=sandbox.CAPS_ManuscriptEngine.generate(p.bookPlan);p.manuscriptStatus="approved";
sandbox.CAPS_EditorialEngine.run(p.manuscript,p.bookPlan);p.manuscript.editorialReport.approved=true;
sandbox.CAPS_LayoutEngine.generate(p);p.layout.approved=true;
sandbox.CAPS_IllustrationEngine.generate(p);
p.illustrations.items.forEach(item=>{item.imageData="data:image/png;base64,AAAA"+item.id;item.imageName=item.id+".png";item.imageWidth=3000;item.imageHeight=2000;item.approved=true;});
sandbox.CAPS_IllustrationEngine.recalc(p);p.workflow={manualApprovals:{direction:true},records:{},events:[],finalApproval:{approved:false,snapshot:null,approvedAt:null}};
sandbox.CAPS_ConsistencyEngine.run(p);if(!sandbox.CAPS_ConsistencyEngine.approve(p))throw new Error("Konsistenzfreigabe fehlgeschlagen");
p.printProduction={settings:{bleedMm:3},preflight:{score:100,blockers:0,warnings:0,ready:true,stale:false,fingerprint:"x",checks:[]}};
let wf=sandbox.CAPS_WorkflowEngine.sync(p,{source:"test"});
if(sandbox.CAPS_WorkflowEngine.stageOrder.length!==9)throw new Error("Workflow besitzt nicht neun Stufen");
if(wf.stages.consistency.status!=="approved")throw new Error("Konsistenzstufe nicht freigegeben: "+wf.stages.consistency.status);
if(wf.blockers.some(item=>item.stage==="consistency"))throw new Error("Unerwarteter Konsistenzblocker");
p.manuscript.bookChapters[0].text+=" Änderung nach Freigabe.";
wf=sandbox.CAPS_WorkflowEngine.sync(p,{source:"change"});
if(wf.stages.consistency.status!=="stale")throw new Error("Konsistenz wurde nicht veraltet");
if(!wf.blockers.some(item=>item.stage==="consistency"))throw new Error("Veraltete Konsistenz blockiert Export nicht");
console.log(JSON.stringify({stages:sandbox.CAPS_WorkflowEngine.stageOrder.length,score:wf.score,consistencyStatus:wf.stages.consistency.status,blockers:wf.blockers.length,finalApprovalInvalidated:!wf.finalApproval.approved},null,2));

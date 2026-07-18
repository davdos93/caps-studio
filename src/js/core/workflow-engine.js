(function(){
"use strict";

const now=()=>new Date().toISOString();
const clean=value=>String(value??"").replace(/\r/g,"").trim();
const deepClone=value=>JSON.parse(JSON.stringify(value??null));
const STAGE_ORDER=["intake","treatment","manuscript","editorial","layout","direction","images","consistency","print"];
const STAGES={
 intake:{label:"Elternangaben",short:"Angaben",dependencies:[],view:"plan",description:"Ausgangssituation, Gefühle, Interessen und Schutzgrenzen"},
 treatment:{label:"Geschichtenentwurf",short:"Entwurf",dependencies:["intake"],view:"plan",description:"Dramaturgischer und pädagogischer Geschichtenplan"},
 manuscript:{label:"Gesamtmanuskript",short:"Text",dependencies:["treatment"],view:"manuscript",description:"Zusammenhängende literarische Buchfassung"},
 editorial:{label:"Redaktion",short:"Redaktion",dependencies:["manuscript"],view:"manuscript",description:"Dramaturgie, Sprache, Figuren und pädagogische Wirkung"},
 layout:{label:"Bilderbuchkomposition",short:"Layout",dependencies:["editorial"],view:"layout",description:"Doppelseiten, Umblätterpunkte und Layouttext"},
 direction:{label:"Illustrationsregie",short:"Bildregie",dependencies:["layout"],view:"illustrations",description:"Bildmomente, Kamera, Licht und visuelle Kontinuität"},
 images:{label:"Illustrationen",short:"Bilder",dependencies:["direction"],view:"illustrations",description:"Hochgeladene und freigegebene Bilder"},
 consistency:{label:"Buchweite Konsistenz",short:"Qualitätscheck",dependencies:["treatment","manuscript","editorial","layout","direction"],view:"consistency",description:"Figuren, Handlung, Motive, Reihenfolge, Text-Bild-Bezug und Schluss"},
 print:{label:"Druckproduktion",short:"Druck",dependencies:["layout","images","consistency"],view:"layout",description:"Druckprüfung, Innenblock und Umschlag"}
};
const STATUS_LABELS={open:"offen",draft:"in Bearbeitung",reviewed:"geprüft",approved:"freigegeben",stale:"veraltet",blocked:"blockiert"};
const STATUS_PROGRESS={open:.08,draft:.48,reviewed:.78,approved:1,stale:.22,blocked:0};

function stable(value){
 if(value===null||value===undefined)return value;
 if(Array.isArray(value))return value.map(stable);
 if(typeof value!=="object")return value;
 return Object.keys(value).sort().reduce((result,key)=>{result[key]=stable(value[key]);return result;},{});
}
function hash(value){
 const text=JSON.stringify(stable(value));let h=2166136261;
 for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
 return (h>>>0).toString(16).padStart(8,"0");
}
function imageSignature(data){
 if(!data)return "";const value=String(data),length=value.length;
 return `${length}:${value.slice(0,32)}:${value.slice(Math.max(0,length-32))}`;
}
function sourceFor(project,key){
 const plan=project.bookPlan||{},manuscript=project.manuscript||{},illustrations=project.illustrations||{},layout=project.layout||{},production=project.printProduction||{};
 if(key==="intake")return {bookBrief:project.bookBrief||null,intake:plan.storyBible?.intakeContext||null};
 if(key==="treatment")return {generatedAt:plan.generatedAt||null,storyBible:plan.storyBible||null,storyTreatment:plan.storyTreatment||null,characters:plan.characters||[],worlds:plan.worlds||[],chapters:plan.chapters||[],scenes:plan.scenes||[]};
 if(key==="manuscript")return {generatedAt:manuscript.generatedAt||null,settings:manuscript.settings||null,chapters:(manuscript.bookChapters||[]).map(chapter=>({id:chapter.chapterId||chapter.id,title:chapter.title,text:chapter.text,revision:chapter.revision||1}))};
 if(key==="editorial"){const report=manuscript.editorialReport;if(!report)return null;return {generatedAt:report.generatedAt||null,score:report.score,categories:report.categories,issues:report.issues?.map(item=>({category:item.category,severity:item.severity,chapterId:item.chapterId,message:item.message,suggestion:item.suggestion,autoFix:item.autoFix}))};}
 if(key==="layout")return {generatedAt:layout.generatedAt||null,schemaVersion:layout.schemaVersion,compositionVersion:layout.compositionVersion,settings:layout.settings,cover:layout.cover,spreads:(layout.spreads||[]).map(spread=>({id:spread.id,sourceHash:spread.sourceHash,sourceBlockIds:spread.sourceBlockIds,title:spread.title,pictureBookText:spread.pictureBookText,layoutText:spread.layoutText||spread.text,textPosition:spread.textPosition,composition:spread.composition}))};
 if(key==="direction")return {generatedAt:illustrations.generatedAt||null,style:illustrations.style,passports:illustrations.characterPassports,items:(illustrations.items||[]).map(item=>({id:item.id,spreadId:item.spreadId,sourceHash:item.sourceHash,direction:item.direction,prompt:item.prompt,notes:item.notes,manualDirection:item.manualDirection,manualPrompt:item.manualPrompt}))};
 if(key==="images")return (illustrations.items||[]).map(item=>({id:item.id,spreadId:item.spreadId,name:item.imageName||"",width:item.imageWidth||0,height:item.imageHeight||0,mime:item.imageMime||"",data:imageSignature(item.imageData)}));
 if(key==="consistency"){const report=project.consistencyReport;if(!report)return null;return {generatedAt:report.generatedAt,sourceFingerprint:report.sourceFingerprint,score:report.score,ready:report.ready,approved:report.approved,counts:report.counts,acknowledgedFindingIds:report.acknowledgedFindingIds,findings:(report.findings||[]).map(item=>({id:item.id,code:item.code,severity:item.severity,category:item.category,title:item.title,location:item.location,acknowledged:item.acknowledged}))};}
 if(key==="print")return {settings:production.settings||null,preflight:production.preflight?{generatedAt:production.preflight.generatedAt,score:production.preflight.score,blockers:production.preflight.blockers,warnings:production.preflight.warnings,ready:production.preflight.ready,stale:production.preflight.stale,fingerprint:production.preflight.fingerprint,checks:production.preflight.checks?.map(check=>({id:check.id,severity:check.severity,pass:check.pass,detail:check.detail}))}:null};
 return null;
}
function present(project,key){
 if(key==="intake")return Boolean(project.bookBrief||project.bookPlan?.storyBible?.intakeContext);
 if(key==="treatment")return Boolean(project.bookPlan?.storyTreatment);
 if(key==="manuscript")return Boolean(project.manuscript?.bookChapters?.length);
 if(key==="editorial")return Boolean(project.manuscript?.editorialReport);
 if(key==="layout")return Boolean(project.layout?.spreads?.length);
 if(key==="direction")return Boolean(project.illustrations?.items?.length);
 if(key==="images")return Boolean(project.illustrations?.items?.some(item=>item.imageData));
 if(key==="consistency")return Boolean(project.consistencyReport);
 if(key==="print")return Boolean(project.printProduction?.settings||project.printProduction?.preflight);
 return false;
}
function rawApproved(project,key){
 if(key==="treatment")return Boolean(project.bookPlan?.approvals?.treatment);
 if(key==="manuscript")return project.manuscriptStatus==="approved"||Boolean(project.manuscript?.progress===100);
 if(key==="editorial")return Boolean(project.manuscript?.editorialReport?.approved);
 if(key==="layout")return Boolean(project.layout?.approved);
 if(key==="direction")return Boolean(project.workflow?.manualApprovals?.direction);
 if(key==="images")return project.illustrationStatus==="approved"||Boolean(project.illustrations?.progress===100);
 if(key==="consistency")return Boolean(project.consistencyReport?.approved&&!window.CAPS_ConsistencyEngine?.isStale(project));
 if(key==="print")return Boolean(project.workflow?.finalApproval?.approved);
 return false;
}
function reviewed(project,key){
 if(key==="intake")return present(project,key);
 if(key==="treatment")return Number(project.bookPlan?.storyTreatment?.qualityReport?.score||0)>=85;
 if(key==="manuscript")return Number(project.manuscript?.bookQuality?.score||project.manuscript?.qualityScore||0)>=78;
 if(key==="editorial")return Boolean(project.manuscript?.editorialReport);
 if(key==="layout")return Number(project.layout?.quality?.score||project.layout?.compositionStats?.score||0)>=75;
 if(key==="direction")return Number(project.illustrations?.quality?.score||0)>=75;
 if(key==="images")return Number(project.illustrations?.progress||0)>=100;
 if(key==="consistency")return Boolean(project.consistencyReport&&!window.CAPS_ConsistencyEngine?.isStale(project));
 if(key==="print")return Boolean(project.printProduction?.preflight&&!project.printProduction.preflight.stale&&project.printProduction.preflight.ready);
 return false;
}
function stageDetail(project,key){
 if(key==="intake")return project.bookBrief?.concreteSituation||project.bookPlan?.storyBible?.psychologicalProfile?.concreteSituation||"Angaben vorhanden";
 if(key==="treatment")return `${project.bookPlan?.storyTreatment?.beats?.length||0} Handlungsschritte · ${project.bookPlan?.storyTreatment?.qualityReport?.score||0}%`;
 if(key==="manuscript")return `${project.manuscript?.bookChapters?.length||0} Kapitel · ${project.manuscript?.wordCount||0} Wörter`;
 if(key==="editorial")return project.manuscript?.editorialReport?`${project.manuscript.editorialReport.score||0}% · ${project.manuscript.editorialReport.summary?.high||0} schwere Hinweise`:"noch nicht geprüft";
 if(key==="layout")return `${project.layout?.spreads?.length||0} Doppelseiten · ${project.layout?.quality?.score||project.layout?.compositionStats?.score||0}%`;
 if(key==="direction")return `${project.illustrations?.items?.length||0} Bildaufträge · ${project.illustrations?.quality?.score||0}%`;
 if(key==="images"){const items=project.illustrations?.items||[],withImage=items.filter(item=>item.imageData).length,approved=items.filter(item=>item.approved).length;return `${withImage}/${items.length} vorhanden · ${approved} freigegeben`;}
 if(key==="consistency"){const report=project.consistencyReport;return report?`${report.score||0}% · ${report.counts?.blocker||0} Blocker · ${report.counts?.warning||0} Warnungen`:"Prüfung offen";}
 if(key==="print"){const report=project.printProduction?.preflight;return report?`${report.score||0}% · ${report.blockers||0} Blocker · ${report.warnings||0} Warnungen`:"Druckprüfung offen";}
 return "";
}
function ensure(project){
 if(!project)return null;
 const existing=project.workflow||{};
 project.workflow={schemaVersion:"1.0",engine:"production-workflow",createdAt:existing.createdAt||now(),updatedAt:existing.updatedAt||now(),records:existing.records||{},events:existing.events||[],manualApprovals:existing.manualApprovals||{},finalApproval:existing.finalApproval||{approved:false,snapshot:null,approvedAt:null},migration:existing.migration||null};
 if(!existing.schemaVersion){project.workflow.migration={fromProjectSchema:project.schemaVersion||"unknown",migratedAt:now(),preservedManualContent:true};}
 return project.workflow;
}
function addEvent(workflow,event){
 workflow.events.push({id:`WF-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`,at:now(),...event});
 if(workflow.events.length>120)workflow.events=workflow.events.slice(-120);
}
function sync(project,{source="automatic"}={}){
 const workflow=ensure(project);let changed=false;
 STAGE_ORDER.forEach(key=>{
   const config=STAGES[key],has=present(project,key),payload=has?sourceFor(project,key):null,current=has?hash(payload):null;
   const record=workflow.records[key]||{revision:0,fingerprint:null,present:false,dependencyRevisions:{},rawApproved:false,approvedFingerprint:null,changedAt:null,source:null};
   const dependencyRevisions=Object.fromEntries(config.dependencies.map(dep=>[dep,workflow.records[dep]?.revision||0]));
   if(record.present!==has||record.fingerprint!==current){
     record.revision=Math.max(0,Number(record.revision)||0)+1;record.present=has;record.fingerprint=current;record.changedAt=now();record.source=source;record.dependencyRevisions=dependencyRevisions;changed=true;
     addEvent(workflow,{type:has?"stage-revision":"stage-removed",stage:key,revision:record.revision,text:has?`${config.label} auf Revision ${record.revision} aktualisiert`:`${config.label} entfernt`,source});
   }
   const approved=rawApproved(project,key);
   if(approved&&!record.rawApproved){record.approvedFingerprint=current;record.approvedAt=now();record.approvalDependencyRevisions=dependencyRevisions;changed=true;addEvent(workflow,{type:"stage-approved",stage:key,revision:record.revision,text:`${config.label} freigegeben`,source});}
   if(!approved&&record.rawApproved){record.approvedFingerprint=null;record.approvedAt=null;changed=true;addEvent(workflow,{type:"stage-unapproved",stage:key,revision:record.revision,text:`Freigabe für ${config.label} aufgehoben`,source});}
   record.rawApproved=approved;workflow.records[key]=record;
 });
 const stages={};
 STAGE_ORDER.forEach(key=>{
   const config=STAGES[key],record=workflow.records[key],has=record.present;
   const missingDependencies=config.dependencies.filter(dep=>!workflow.records[dep]?.present);
   const revisionMismatches=config.dependencies.filter(dep=>record.dependencyRevisions?.[dep]!==workflow.records[dep]?.revision);
   const staleDependencyStates=config.dependencies.filter(dep=>["stale","blocked","open"].includes(stages[dep]?.status));
   const staleDependencies=[...new Set([...revisionMismatches,...staleDependencyStates])];
   const ownApprovalStale=Boolean(record.rawApproved&&record.approvedFingerprint&&record.approvedFingerprint!==record.fingerprint);
   const reasons=[];let status="open";
   if(!has){
     if(missingDependencies.length){status="blocked";reasons.push(`Benötigt zuerst: ${missingDependencies.map(dep=>STAGES[dep].label).join(", ")}`);}
     else status="open";
   }else if(staleDependencies.length||ownApprovalStale){
     status="stale";
     if(staleDependencies.length)reasons.push(`Vorgängerstufe geändert: ${staleDependencies.map(dep=>STAGES[dep].label).join(", ")}`);
     if(ownApprovalStale)reasons.push("Inhalt wurde nach der Freigabe verändert");
   }else if(key==="consistency"&&project.consistencyReport?.counts?.blocker>0){
     status="blocked";reasons.push(`${project.consistencyReport.counts.blocker} Blocker in der buchweiten Konsistenzprüfung`);
   }else if(key==="print"&&project.printProduction?.preflight?.blockers>0){
     status="blocked";reasons.push(`${project.printProduction.preflight.blockers} Blocker in der Druckprüfung`);
   }else if(record.rawApproved)status="approved";
   else if(reviewed(project,key))status="reviewed";
   else status="draft";
   stages[key]={key,label:config.label,short:config.short,description:config.description,view:config.view,status,statusLabel:STATUS_LABELS[status],revision:record.revision,changedAt:record.changedAt,source:record.source,detail:stageDetail(project,key),dependencies:config.dependencies,staleDependencies,missingDependencies,reasons,approvedAt:record.approvedAt};
 });
 const blockers=computeExportBlockers(project,stages);
 const snapshot=workflow.finalApproval?.snapshot||{};
 const approvalOutdated=Boolean(workflow.finalApproval?.approved&&(STAGE_ORDER.some(key=>snapshot[key]!==workflow.records[key]?.revision)||blockers.length));
 if(approvalOutdated){workflow.finalApproval.approved=false;workflow.finalApproval.invalidatedAt=now();changed=true;addEvent(workflow,{type:"final-approval-invalidated",stage:"print",text:"Produktionsfreigabe wegen einer Änderung aufgehoben",source:"dependency-change"});stages.print.status=stages.print.status==="approved"?"stale":stages.print.status;stages.print.statusLabel=STATUS_LABELS[stages.print.status];}
 const score=Math.round(STAGE_ORDER.reduce((sum,key)=>sum+(STATUS_PROGRESS[stages[key].status]||0),0)/STAGE_ORDER.length*100);
 const nextAction=findNext(stages);
 workflow.updatedAt=now();workflow.score=score;workflow.stages=stages;workflow.blockers=blockers;workflow.nextAction=nextAction;workflow.changed=changed;
 return workflow;
}
function computeExportBlockers(project,stages){
 const blockers=[];
 const required=["manuscript","editorial","layout","direction","images","consistency"];
 required.forEach(key=>{
   const stage=stages[key];
   if(!stage)return;
   if(stage.status==="stale")blockers.push({id:`stale-${key}`,stage:key,label:`${stage.label} ist veraltet`,detail:stage.reasons.join(" · ")||"Nach einer Änderung noch nicht aktualisiert"});
   if(stage.status==="blocked"||stage.status==="open")blockers.push({id:`missing-${key}`,stage:key,label:`${stage.label} fehlt oder ist blockiert`,detail:stage.reasons.join(" · ")||"Stufe noch nicht abgeschlossen"});
 });
 const consistency=stages.consistency;if(consistency&&consistency.status!=="approved")blockers.push({id:"consistency-approval",stage:"consistency",label:"Buchweite Konsistenz ist nicht freigegeben",detail:consistency.reasons.join(" · ")||"Prüfung ausführen, Blocker beheben und Quality Gate freigeben"});
 const items=project.illustrations?.items||[];
 const missing=items.length?items.filter(item=>!item.imageData).length:0;
 if(missing)blockers.push({id:"missing-images",stage:"images",label:`${missing} Illustrationen fehlen`,detail:"Alle Doppelseiten benötigen ein Bild"});
 if(!project.layout?.spreads?.length)blockers.push({id:"missing-layout",stage:"layout",label:"Kein druckbares Layout vorhanden",detail:"Bilderbuchkomposition zuerst erzeugen"});
 return blockers.filter((item,index,array)=>array.findIndex(other=>other.id===item.id)===index);
}
function exportBlockers(project){const workflow=sync(project);return workflow.blockers||[];}
function findNext(stages){
 for(const key of STAGE_ORDER){const stage=stages[key];if(["stale","open","draft","blocked"].includes(stage.status)){if(stage.status==="blocked"&&stage.missingDependencies.length){const dependency=stages[stage.missingDependencies[0]];return {...dependency,reason:`${stage.label} wartet auf ${dependency.label}`};}return {...stage,reason:stage.reasons[0]||stage.description};}}
 return {...stages.print,reason:"Alle Produktionsstufen sind geprüft"};
}
function setManualApproval(project,key,value){
 const workflow=ensure(project);if(!["direction"].includes(key))return false;
 workflow.manualApprovals[key]=Boolean(value);sync(project,{source:"production-dashboard"});return workflow.manualApprovals[key];
}
function canFinalApprove(project){
 const workflow=sync(project),preflight=project.printProduction?.preflight;
 return workflow.blockers.length===0&&Boolean(preflight&&!preflight.stale&&preflight.ready);
}
function toggleFinalApproval(project){
 const workflow=sync(project,{source:"production-dashboard"});
 if(workflow.finalApproval.approved){workflow.finalApproval={approved:false,snapshot:null,approvedAt:null};addEvent(workflow,{type:"final-approval-removed",stage:"print",text:"Produktionsfreigabe aufgehoben",source:"production-dashboard"});sync(project,{source:"production-dashboard"});return false;}
 if(!canFinalApprove(project))return false;
 workflow.finalApproval={approved:true,approvedAt:now(),snapshot:Object.fromEntries(STAGE_ORDER.map(key=>[key,workflow.records[key]?.revision||0]))};addEvent(workflow,{type:"final-approved",stage:"print",text:"Gesamte Buchproduktion freigegeben",source:"production-dashboard"});sync(project,{source:"production-dashboard"});return true;
}
function actionFor(project){return sync(project).nextAction;}
function statusLabels(){return {...STATUS_LABELS};}
function configs(){return deepClone(STAGES);}

window.CAPS_WorkflowEngine={ensure,sync,exportBlockers,setManualApproval,canFinalApprove,toggleFinalApproval,actionFor,statusLabels,configs,stageOrder:[...STAGE_ORDER]};
})();
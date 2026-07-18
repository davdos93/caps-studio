(function(){
"use strict";

const now=()=>new Date().toISOString();
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const clean=value=>String(value??"").replace(/\r/g,"").trim();
const wordCount=value=>clean(value).split(/\s+/).filter(Boolean).length;
const STAGE_ORDER=["meta","intake","treatment","manuscript","editorial","layout","direction","images","consistency","print"];
const STAGE_LABELS={meta:"Projekt",intake:"Elternangaben",treatment:"Geschichtenentwurf",manuscript:"Gesamtmanuskript",editorial:"Redaktion",layout:"Bilderbuchkomposition",direction:"Illustrationsregie",images:"Illustrationen",consistency:"Buchweite Konsistenz",print:"Druckproduktion"};
const MAX_CHECKPOINTS=36;
const MAX_INLINE_ASSET_CHARS=260000;
const MAX_ASSET_VAULT_CHARS=850000;

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
 return `${length}:${hash(value.slice(0,500)+value.slice(Math.max(0,length-500)))}`;
}
function ensure(project){
 if(!project)return null;
 const existing=project.versionHistory||{};
 project.versionHistory={
   schemaVersion:"1.0",engine:"caps-version-history",createdAt:existing.createdAt||now(),updatedAt:existing.updatedAt||now(),
   checkpoints:Array.isArray(existing.checkpoints)?existing.checkpoints:[],objects:existing.objects&&typeof existing.objects==="object"?existing.objects:{},
   assets:existing.assets&&typeof existing.assets==="object"?existing.assets:{},settings:{maxCheckpoints:MAX_CHECKPOINTS,...(existing.settings||{})},
   migration:existing.migration||null
 };
 if(!existing.schemaVersion)project.versionHistory.migration={migratedAt:now(),from:"none",automaticInitialCheckpoint:true};
 return project.versionHistory;
}
function currentAssetChars(history){return Object.values(history.assets||{}).reduce((sum,asset)=>sum+String(asset.data||"").length,0);}
function storeAsset(history,data,meta={}){
 if(!data)return null;
 const signature=imageSignature(data);
 if(history.assets[signature])return signature;
 const length=String(data).length;
 if(length>MAX_INLINE_ASSET_CHARS||currentAssetChars(history)+length>MAX_ASSET_VAULT_CHARS)return null;
 history.assets[signature]={signature,data:String(data),name:meta.name||"",mime:meta.mime||"",createdAt:now(),chars:length};
 return signature;
}
function imageFields(item,history,storeAssets=true){
 const data=item?.imageData||null,signature=imageSignature(data);
 const assetRef=storeAssets?storeAsset(history,data,{name:item?.imageName,mime:item?.imageMime}):null;
 return {id:item?.id||null,spreadId:item?.spreadId||null,hadImage:Boolean(data),signature,assetRef,imageName:item?.imageName||"",imageWidth:item?.imageWidth||0,imageHeight:item?.imageHeight||0,imageMime:item?.imageMime||"",approved:Boolean(item?.approved),status:item?.status||"planned"};
}
function withoutImageFields(item){
 const result=clone(item||{});
 ["imageData","imageName","imageWidth","imageHeight","imageMime","approved"].forEach(key=>delete result[key]);
 return result;
}
function manuscriptWithoutEditorial(manuscript){
 if(!manuscript)return null;const result=clone(manuscript);
 delete result.editorialReport;delete result.editorialStatus;delete result.editorialHistory;
 return result;
}
function snapshot(project,stage,history,{storeAssets=true}={}){
 if(stage==="meta")return {title:project.title||"",subtitle:project.subtitle||"",author:project.author||"",language:project.language||"Deutsch",audience:project.audience||"",format:project.format||"",style:project.style||"",status:project.status||"planning",pagesCount:project.pagesCount||0};
 if(stage==="intake")return {bookBrief:clone(project.bookBrief||null)};
 if(stage==="treatment")return {bookPlan:clone(project.bookPlan||null),planStatus:project.planStatus||"open"};
 if(stage==="manuscript")return {manuscript:manuscriptWithoutEditorial(project.manuscript),manuscriptStatus:project.manuscriptStatus||"open"};
 if(stage==="editorial")return {report:clone(project.manuscript?.editorialReport||null),status:project.manuscript?.editorialStatus||project.manuscript?.editorialReport?.approved?"approved":"open"};
 if(stage==="layout")return {layout:clone(project.layout||null),layoutStatus:project.layoutStatus||"open"};
 if(stage==="direction"){
   const illustrations=project.illustrations?clone(project.illustrations):null;
   if(illustrations){illustrations.items=(illustrations.items||[]).map(withoutImageFields);delete illustrations.progress;}
   return {illustrations,manualApproval:Boolean(project.workflow?.manualApprovals?.direction)};
 }
 if(stage==="images")return {illustrationStatus:project.illustrationStatus||"open",progress:project.illustrations?.progress||0,items:(project.illustrations?.items||[]).map(item=>imageFields(item,history,storeAssets))};
 if(stage==="consistency")return {report:clone(project.consistencyReport||null)};
 if(stage==="print")return {printProduction:clone(project.printProduction||null)};
 return null;
}
function storeObject(history,stage,data){
 const ref=`${stage}-${hash(data)}`;
 if(!history.objects[ref])history.objects[ref]={stage,data:clone(data),createdAt:now(),chars:JSON.stringify(data).length};
 return ref;
}
function refsFor(project,history,{storeAssets=true}={}){
 return Object.fromEntries(STAGE_ORDER.map(stage=>[stage,storeObject(history,stage,snapshot(project,stage,history,{storeAssets}))]));
}
function latest(history){return history.checkpoints[history.checkpoints.length-1]||null;}
function capture(project,{label="",source="automatic",kind="automatic",note="",force=false}={}){
 const history=ensure(project),refs=refsFor(project,history,{storeAssets:true}),previous=latest(history);
 const changedStages=STAGE_ORDER.filter(stage=>!previous||previous.refs?.[stage]!==refs[stage]);
 if(!force&&!changedStages.length)return null;
 const checkpoint={
   id:`CP-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`,at:now(),kind,source,
   label:clean(label)||defaultLabel(kind,changedStages),note:clean(note),refs,changedStages,
   workflowRevisions:Object.fromEntries(Object.entries(project.workflow?.records||{}).map(([key,record])=>[key,record.revision||0])),
   projectVersion:Number(project.version||1)
 };
 history.checkpoints.push(checkpoint);history.updatedAt=now();compact(project);
 return checkpoint;
}
function defaultLabel(kind,changed){
 if(kind==="initial")return "Ausgangsstand";
 if(kind==="manual")return "Manuelle Sicherung";
 if(kind==="pre-restore")return "Sicherung vor Wiederherstellung";
 if(kind==="restore")return "Wiederhergestellte Fassung";
 const labels=changed.slice(0,3).map(stage=>STAGE_LABELS[stage]);
 return labels.length?`${labels.join(", ")} aktualisiert`:"Projekt aktualisiert";
}
function checkpointById(project,id){
 const history=ensure(project);return history.checkpoints.find(item=>item.id===id)||null;
}
function dataForRef(history,ref){return ref?clone(history.objects?.[ref]?.data):null;}
function dataFor(project,checkpointId,stage){
 const history=ensure(project);
 if(checkpointId==="current")return snapshot(project,stage,history,{storeAssets:false});
 const checkpoint=checkpointById(project,checkpointId);return dataForRef(history,checkpoint?.refs?.[stage]);
}
function labelFor(project,id){if(id==="current")return "Aktueller Stand";return checkpointById(project,id)?.label||"Unbekannte Fassung";}
function summarize(stage,data){
 if(stage==="meta")return `${data?.title||"Ohne Titel"} · ${data?.audience||"Zielgruppe offen"}`;
 if(stage==="intake")return data?.bookBrief?.concreteSituation||data?.bookBrief?.problemTopic||"Keine Elternangaben";
 if(stage==="treatment")return `${data?.bookPlan?.storyTreatment?.beats?.length||0} Handlungsschritte · ${data?.bookPlan?.chapters?.length||0} Kapitel`;
 if(stage==="manuscript"){
   const chapters=data?.manuscript?.bookChapters||[],text=chapters.map(chapter=>chapter.text||"").join(" ");
   return `${chapters.length} Kapitel · ${wordCount(text)} Wörter`;
 }
 if(stage==="editorial")return data?.report?`${data.report.score||0}% · ${data.report.issues?.length||0} Hinweise`:"Keine Redaktion";
 if(stage==="layout")return `${data?.layout?.spreads?.length||0} Doppelseiten · ${data?.layout?.quality?.score||data?.layout?.compositionStats?.score||0}%`;
 if(stage==="direction")return `${data?.illustrations?.items?.length||0} Bildaufträge · ${data?.illustrations?.quality?.score||0}%`;
 if(stage==="images"){const items=data?.items||[];return `${items.filter(item=>item.hadImage).length}/${items.length} Bilder · ${items.filter(item=>item.approved).length} freigegeben`;}
 if(stage==="consistency")return data?.report?`${data.report.score||0}% · ${data.report.counts?.blocker||0} Blocker · ${data.report.counts?.warning||0} Warnungen`:"Keine Konsistenzprüfung";
 if(stage==="print")return data?.printProduction?.preflight?`${data.printProduction.preflight.score||0}% · ${data.printProduction.preflight.blockers||0} Blocker`:"Keine Druckprüfung";
 return "";
}
function displayValue(value){
 if(value===undefined)return "–";if(value===null)return "leer";
 if(typeof value==="boolean")return value?"ja":"nein";
 if(typeof value==="string"){
   const text=clean(value);if(text.length>180)return `${wordCount(text)} Wörter · „${text.slice(0,150)}…“`;
   return text||"leer";
 }
 if(Array.isArray(value))return `${value.length} Einträge`;
 if(typeof value==="object")return `${Object.keys(value).length} Felder`;
 return String(value);
}
function diff(a,b,path="",changes=[],limit=60){
 if(changes.length>=limit)return changes;
 if(JSON.stringify(stable(a))===JSON.stringify(stable(b)))return changes;
 const aObj=a&&typeof a==="object",bObj=b&&typeof b==="object";
 if(aObj&&bObj&&!Array.isArray(a)&&!Array.isArray(b)){
   [...new Set([...Object.keys(a),...Object.keys(b)])].sort().forEach(key=>{if(changes.length<limit)diff(a[key],b[key],path?`${path}.${key}`:key,changes,limit);});
   return changes;
 }
 if(Array.isArray(a)&&Array.isArray(b)){
   if(a.length!==b.length)changes.push({path:path||"Liste",before:`${a.length} Einträge`,after:`${b.length} Einträge`});
   const max=Math.min(Math.max(a.length,b.length),12);
   for(let i=0;i<max&&changes.length<limit;i++)diff(a[i],b[i],`${path}[${i+1}]`,changes,limit);
   return changes;
 }
 changes.push({path:path||"Wert",before:displayValue(a),after:displayValue(b)});return changes;
}
function compare(project,aId,bId,stage="all"){
 const stages=stage==="all"?STAGE_ORDER:[stage];
 const sections=stages.map(key=>{
   const before=dataFor(project,aId,key),after=dataFor(project,bId,key),changes=diff(before,after);
   return {stage:key,label:STAGE_LABELS[key],changed:changes.length>0,beforeSummary:summarize(key,before),afterSummary:summarize(key,after),changes};
 });
 return {aId,bId,aLabel:labelFor(project,aId),bLabel:labelFor(project,bId),stage,sections,changedStages:sections.filter(section=>section.changed).length,totalChanges:sections.reduce((sum,section)=>sum+section.changes.length,0)};
}
function imageMatch(items,snapshotItem){return items.find(item=>item.id===snapshotItem.id)||items.find(item=>item.spreadId&&item.spreadId===snapshotItem.spreadId);}
function mergeDirectionWithCurrentImages(direction,current){
 if(!direction)return null;const result=clone(direction),currentItems=current?.items||[];
 result.items=(result.items||[]).map(item=>{
   const existing=imageMatch(currentItems,item)||{};
   return {...item,imageData:existing.imageData||null,imageName:existing.imageName||"",imageWidth:existing.imageWidth||0,imageHeight:existing.imageHeight||0,imageMime:existing.imageMime||"",approved:Boolean(existing.approved),status:existing.status||item.status||"planned"};
 });
 return result;
}
function applyStage(project,stage,data,history,{full=false}={}){
 const warnings=[];
 if(stage==="meta"&&data)Object.assign(project,clone(data));
 if(stage==="intake")project.bookBrief=clone(data?.bookBrief||null);
 if(stage==="treatment"){project.bookPlan=clone(data?.bookPlan||null);project.planStatus=data?.planStatus||"open";}
 if(stage==="manuscript"){
   const currentReport=clone(project.manuscript?.editorialReport||null),currentStatus=project.manuscript?.editorialStatus,currentHistory=clone(project.manuscript?.editorialHistory||null);
   project.manuscript=clone(data?.manuscript||null);project.manuscriptStatus=data?.manuscriptStatus||"open";
   if(!full&&project.manuscript){project.manuscript.editorialReport=currentReport;project.manuscript.editorialStatus=currentStatus;if(currentHistory)project.manuscript.editorialHistory=currentHistory;}
 }
 if(stage==="editorial"){
   if(!project.manuscript&&data?.report)warnings.push("Redaktion konnte ohne Manuskript nicht vollständig wiederhergestellt werden.");
   if(project.manuscript){project.manuscript.editorialReport=clone(data?.report||null);project.manuscript.editorialStatus=data?.status||"open";}
 }
 if(stage==="layout"){project.layout=clone(data?.layout||null);project.layoutStatus=data?.layoutStatus||"open";}
 if(stage==="direction"){
   const current=project.illustrations;project.illustrations=mergeDirectionWithCurrentImages(data?.illustrations||null,current);
   if(project.workflow){project.workflow.manualApprovals=project.workflow.manualApprovals||{};project.workflow.manualApprovals.direction=Boolean(data?.manualApproval);}
 }
 if(stage==="images"){
   project.illustrationStatus=data?.illustrationStatus||"open";
   const currentItems=project.illustrations?.items||[];
   (data?.items||[]).forEach(saved=>{
     const item=imageMatch(currentItems,saved);if(!item)return;
     if(!saved.hadImage){item.imageData=null;item.imageName="";item.imageWidth=0;item.imageHeight=0;item.imageMime="";item.approved=false;item.status="planned";return;}
     const asset=saved.assetRef?history.assets?.[saved.assetRef]:null;
     const currentSignature=imageSignature(item.imageData);
     if(asset?.data)item.imageData=asset.data;
     else if(currentSignature!==saved.signature)warnings.push(`Historische Bilddatei für ${saved.imageName||saved.spreadId||"eine Doppelseite"} war zu groß für den Versionsspeicher; das aktuelle Bild blieb erhalten.`);
     item.imageName=saved.imageName||item.imageName||"";item.imageWidth=saved.imageWidth||item.imageWidth||0;item.imageHeight=saved.imageHeight||item.imageHeight||0;item.imageMime=saved.imageMime||item.imageMime||"";item.approved=Boolean(saved.approved);item.status=saved.status||item.status||"image-added";
   });
   if(project.illustrations)project.illustrations.progress=data?.progress||project.illustrations.progress||0;
 }
 if(stage==="consistency")project.consistencyReport=clone(data?.report||null);
 if(stage==="print")project.printProduction=clone(data?.printProduction||null);
 return warnings;
}
function restore(project,checkpointId,stage="all"){
 const history=ensure(project),checkpoint=checkpointById(project,checkpointId);
 if(!checkpoint)throw new Error("Die ausgewählte Fassung wurde nicht gefunden.");
 capture(project,{label:"Sicherung vor Wiederherstellung",source:"version-history",kind:"pre-restore",note:`Vor ${checkpoint.label}`,force:true});
 const stages=stage==="all"?STAGE_ORDER:[stage],warnings=[];
 stages.forEach(key=>warnings.push(...applyStage(project,key,dataForRef(history,checkpoint.refs?.[key]),history,{full:stage==="all"})));
 project.version=Number(project.version||1)+1;project.updatedAt=now();
 if(project.workflow?.finalApproval)project.workflow.finalApproval={approved:false,snapshot:null,approvedAt:null,invalidatedAt:now()};
 const restored=capture(project,{label:stage==="all"?`Projekt aus „${checkpoint.label}“ wiederhergestellt`:`${STAGE_LABELS[stage]} aus „${checkpoint.label}“ wiederhergestellt`,source:"version-history",kind:"restore",note:warnings.join(" "),force:true});
 return {checkpoint:restored,warnings};
}
function removeCheckpoint(project,id){
 const history=ensure(project),index=history.checkpoints.findIndex(item=>item.id===id);
 if(index<0)return false;history.checkpoints.splice(index,1);compact(project);return true;
}
function compact(project){
 const history=ensure(project),max=Math.max(8,Number(history.settings.maxCheckpoints)||MAX_CHECKPOINTS);
 if(history.checkpoints.length>max)history.checkpoints=history.checkpoints.slice(-max);
 const objectRefs=new Set(history.checkpoints.flatMap(checkpoint=>Object.values(checkpoint.refs||{})).filter(Boolean));
 Object.keys(history.objects).forEach(ref=>{if(!objectRefs.has(ref))delete history.objects[ref];});
 const assetRefs=new Set();Object.values(history.objects).forEach(object=>{if(object.stage==="images")(object.data?.items||[]).forEach(item=>{if(item.assetRef)assetRefs.add(item.assetRef);});});
 Object.keys(history.assets).forEach(ref=>{if(!assetRefs.has(ref))delete history.assets[ref];});
 history.updatedAt=now();return history;
}
function compactAll(projects){(projects||[]).forEach(project=>{if(project?.versionHistory)compact(project);});return projects;}
function stats(project){
 const history=ensure(project),json=JSON.stringify(history),checkpoints=history.checkpoints;
 return {checkpoints:checkpoints.length,objects:Object.keys(history.objects).length,assets:Object.keys(history.assets).length,estimatedBytes:json.length*2,oldestAt:checkpoints[0]?.at||null,newestAt:checkpoints.at(-1)?.at||null,maxCheckpoints:history.settings.maxCheckpoints||MAX_CHECKPOINTS};
}
function list(project){return [...ensure(project).checkpoints].reverse().map(checkpoint=>({...checkpoint,stageLabels:checkpoint.changedStages.map(stage=>STAGE_LABELS[stage]||stage)}));}
function createInitial(project){const history=ensure(project);if(history.checkpoints.length)return null;return capture(project,{label:"Ausgangsstand",source:"phase-5.2-migration",kind:"initial",force:true});}

window.CAPS_HistoryEngine={ensure,capture,createInitial,list,stats,compare,restore,removeCheckpoint,compact,compactAll,checkpointById,stageOrder:[...STAGE_ORDER],stageLabels:{...STAGE_LABELS}};
})();
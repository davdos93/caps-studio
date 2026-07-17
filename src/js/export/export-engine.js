(function(){
"use strict";
const PDF=CAPS_PDFEngine;
const clean=value=>String(value??"").replace(/\r/g,"").trim();
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const now=()=>new Date().toISOString();

function defaults(project={}){return {
  schemaVersion:"1.0",engine:"print-production",trimPreset:project.layout?.settings?.pageFormat?.includes("Quadratisch")?"square":"a5",
  bleedMm:3,slugMm:5,safeMarginMm:10,outputDpi:300,jpegQuality:.9,cropMarks:false,showTrimBox:false,
  binding:"perfect",paperCaliperMm:.1,minBodyFontPt:10,showSpreadTitles:false,showPageNumbers:Boolean(project.layout?.settings?.showPageNumbers),
  showSpineText:true,paperTint:"#fffdf9",textColor:"#172033",publisher:"",isbn:"",backCoverText:"",author:project.layout?.cover?.author||"",
  preflight:null,updatedAt:now()
};}

function fingerprint(project){
  const layout=project.layout||{},illustrations=project.illustrations?.items||[];
  return [layout.generatedAt,layout.updatedAt,layout.approved,layout.spreads?.length,layout.spreads?.map(s=>`${s.id}:${s.wordCount}:${s.textEdited?1:0}`).join("|"),illustrations.map(i=>`${i.id}:${i.imageName||""}:${i.imageWidth||0}x${i.imageHeight||0}:${i.approved?1:0}`).join("|")].join("::");
}

function ensure(project){
  const existing=project.printProduction||{},settings={...defaults(project),...(existing.settings||existing)};
  project.printProduction={schemaVersion:"1.0",engine:"print-production",settings,preflight:existing.preflight||null,history:existing.history||[]};
  const current=fingerprint(project);if(project.printProduction.preflight&&project.printProduction.preflight.fingerprint!==current)project.printProduction.preflight.stale=true;
  return project.printProduction;
}

function updateSettings(project,values={}){const production=ensure(project);production.settings={...production.settings,...values,updatedAt:now()};if(production.preflight)production.preflight.stale=true;return production;}
function invalidate(project){const production=ensure(project);if(production.preflight)production.preflight.stale=true;return production;}

function item(severity,id,label,pass,detail=""){return {severity,id,label,pass,detail};}
function imageItems(project){return (project.layout?.spreads||[]).map(spread=>({spread,item:project.illustrations?.items?.find(entry=>entry.id===spread.illustrationId)||project.illustrations?.items?.find(entry=>entry.spreadId===spread.id)||null}));}

function quickPreflight(project){
  const production=ensure(project),settings=production.settings,layout=project.layout,checks=[];
  checks.push(item("blocker","layout","Bilderbuch-Layout vorhanden",Boolean(layout?.spreads?.length),layout?.spreads?.length?`${layout.spreads.length} Doppelseiten`:"Layout fehlt"));
  checks.push(item("warning","layout-approval","Layout redaktionell freigegeben",Boolean(layout?.approved),layout?.approved?"freigegeben":"noch nicht freigegeben"));
  checks.push(item("warning","editorial","Manuskriptredaktion freigegeben",Boolean(project.manuscript?.editorialReport?.approved),project.manuscript?.editorialReport?.approved?"freigegeben":"noch nicht freigegeben"));
  const images=imageItems(project),missing=images.filter(entry=>!entry.item?.imageData).length,unapproved=images.filter(entry=>entry.item?.imageData&&!entry.item?.approved).length;
  checks.push(item("blocker","images","Alle Doppelseiten illustriert",missing===0,`${missing} fehlend`));
  checks.push(item("warning","image-approval","Alle Bilder freigegeben",unapproved===0,`${unapproved} nicht freigegeben`));
  const empty=(layout?.spreads||[]).filter(spread=>!clean(spread.layoutText||spread.text)).length;checks.push(item("blocker","text","Kein leerer Layouttext",empty===0,`${empty} leer`));
  const crowded=(layout?.spreads||[]).filter(spread=>(spread.wordCount||0)>(spread.composition?.maxWords||125)).length;checks.push(item("warning","density","Textdichte innerhalb der Kompositionsgrenzen",crowded===0,`${crowded} überfüllt`));
  checks.push(item("blocker","title","Cover-Titel vorhanden",Boolean(clean(layout?.cover?.title||project.title)),""));
  checks.push(item("blocker","bleed","Mindestens 3 mm Beschnitt",Number(settings.bleedMm)>=3,`${settings.bleedMm} mm`));
  const pageCount=PDF.interiorPageCount(project);checks.push(item("info","signatures","Innenblock durch vier teilbar",pageCount%4===0,`${pageCount} Seiten`));
  const spine=PDF.spineWidth(project,settings);checks.push(item("warning","spine","Buchrücken für Text breit genug",settings.binding==="saddle"||spine>=4.5,settings.binding==="saddle"?"Klammerheftung ohne Rücken":`${spine.toFixed(2)} mm`));
  return summarize(checks,{pageCount,spineWidthMm:spine,format:PDF.resolveFormat(project,settings)});
}

function summarize(checks,extra={}){
  const blockers=checks.filter(check=>check.severity==="blocker"&&!check.pass).length,warnings=checks.filter(check=>check.severity==="warning"&&!check.pass).length;
  const weighted=checks.reduce((sum,check)=>sum+(check.pass?(check.severity==="blocker"?14:check.severity==="warning"?8:3):0),0),possible=checks.reduce((sum,check)=>sum+(check.severity==="blocker"?14:check.severity==="warning"?8:3),0);
  return {generatedAt:now(),checks,blockers,warnings,score:possible?Math.round(weighted/possible*100):0,ready:blockers===0,...extra};
}

function inspectDataImage(dataUrl){
  if(typeof Image==="undefined")return Promise.resolve(null);
  return new Promise(resolve=>{const image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>resolve(null);image.src=dataUrl;});
}

async function preflight(project,{refreshImages=true}={}){
  const production=ensure(project),settings=production.settings,report=quickPreflight(project),checks=report.checks.filter(check=>!['image-resolution'].includes(check.id)),format=PDF.resolveFormat(project,settings),requiredW=format.pageWidthMm*2/25.4,requiredH=format.pageHeightMm/25.4;let low=0,veryLow=0,unknown=0;
  for(const {item:illustration} of imageItems(project)){
    if(!illustration?.imageData)continue;let width=Number(illustration.imageWidth)||0,height=Number(illustration.imageHeight)||0;
    if((!width||!height)&&refreshImages){const info=await inspectDataImage(illustration.imageData);if(info){width=info.width;height=info.height;illustration.imageWidth=width;illustration.imageHeight=height;}}
    if(!width||!height){unknown++;continue}const dpi=Math.min(width/requiredW,height/requiredH);illustration.effectivePrintDpi=Math.round(dpi);if(dpi<120)veryLow++;else if(dpi<200)low++;
  }
  checks.push(item("blocker","image-resolution","Keine Illustration unter 120 dpi",veryLow===0,`${veryLow} kritisch`));
  checks.push(item("warning","image-quality","Illustrationen erreichen möglichst 200 dpi",low===0,`${low} zwischen 120 und 199 dpi${unknown?` · ${unknown} unbekannt`:""}`));
  const reportFull=summarize(checks,{pageCount:PDF.interiorPageCount(project),spineWidthMm:PDF.spineWidth(project,settings),format,fingerprint:fingerprint(project),stale:false});production.preflight=reportFull;production.history.push({type:"preflight",at:now(),score:reportFull.score,blockers:reportFull.blockers,warnings:reportFull.warnings});return reportFull;
}

function activeReport(project){const production=ensure(project);return production.preflight&&!production.preflight.stale?production.preflight:quickPreflight(project);}
function assertReady(project,allowBlockers=false){const report=activeReport(project);if(!allowBlockers&&report.blockers)throw new Error(`Die Druckprüfung enthält ${report.blockers} Blocker. Bitte zuerst die markierten Punkte beheben.`);return report;}

async function exportInterior(project,{proof=false,onProgress=()=>{}}={}){
  const production=ensure(project),settings={...production.settings};assertReady(project,proof);if(proof){settings.outputDpi=Math.min(160,settings.outputDpi);settings.cropMarks=true;settings.showTrimBox=true;settings.jpegQuality=.78;}
  const result=await PDF.createInterior(project,settings,onProgress);PDF.downloadBytes(result.bytes,proof?result.filename.replace(/\.pdf$/,"-PROOF.pdf"):result.filename);production.history.push({type:proof?"proof":"interior",at:now(),pages:result.pageCount,filename:result.filename});return result;
}

async function exportCover(project,{proof=false,onProgress=()=>{}}={}){
  const production=ensure(project),settings={...production.settings};assertReady(project,proof);if(proof){settings.outputDpi=Math.min(160,settings.outputDpi);settings.cropMarks=true;settings.showTrimBox=true;settings.jpegQuality=.8;}
  const result=await PDF.createCover(project,settings,onProgress);PDF.downloadBytes(result.bytes,proof?result.filename.replace(/\.pdf$/,"-PROOF.pdf"):result.filename);production.history.push({type:proof?"cover-proof":"cover",at:now(),spineWidthMm:result.spineWidthMm,filename:result.filename});return result;
}

function downloadPreflight(project){const report=activeReport(project),production=ensure(project),payload={product:"CAPS Studio",version:"0.8.3",book:project.layout?.cover?.title||project.title,settings:production.settings,report};const bytes=new TextEncoder().encode(JSON.stringify(payload,null,2)),filename=`${PDF.fileSafe(project.layout?.cover?.title||project.title)}-Druckpruefung.json`;PDF.downloadBytes(bytes,filename,"application/json");return filename;}

window.CAPS_ExportEngine={defaults,ensure,updateSettings,invalidate,quickPreflight,preflight,activeReport,exportInterior,exportCover,downloadPreflight,fingerprint};
})();
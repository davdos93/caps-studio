const fs=require("fs"),vm=require("vm");
const sandbox={console,TextEncoder,Uint8Array,Date,Buffer,window:{},Blob,URL:{},setTimeout};sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ["src/js/export/pdf-engine.js","src/js/export/export-engine.js"])vm.runInContext(fs.readFileSync(file,"utf8"),sandbox,{filename:file});
const spreads=Array.from({length:16},(_,i)=>({id:`S${i}`,number:i+1,layoutText:"Ein kurzer, gut lesbarer Bilderbuchtext.",text:"Ein kurzer, gut lesbarer Bilderbuchtext.",wordCount:6,composition:{maxWords:80}}));
const illustrations=spreads.map((s,i)=>({id:`I${i}`,spreadId:s.id,imageData:"data:image/jpeg;base64,abc",imageWidth:3600,imageHeight:2500,approved:true}));spreads.forEach((s,i)=>s.illustrationId=illustrations[i].id);
const project={title:"Testbuch",layout:{approved:true,settings:{pageFormat:"A4 Querformat",showPageNumbers:false},cover:{title:"Testbuch",author:"Autor"},spreads},manuscript:{editorialReport:{approved:true}},illustrations:{items:illustrations}};
const report=sandbox.CAPS_ExportEngine.quickPreflight(project);if(report.blockers!==0)throw new Error(`Unerwartete Blocker: ${report.blockers}`);if(report.pageCount%4!==0)throw new Error("Signatur nicht durch vier teilbar");if(report.spineWidthMm<=0)throw new Error("Rückenbreite fehlt");
project.illustrations.items[0].imageData="";const broken=sandbox.CAPS_ExportEngine.quickPreflight(project);if(!broken.blockers)throw new Error("Fehlendes Bild nicht erkannt");
console.log(JSON.stringify({score:report.score,pages:report.pageCount,spine:report.spineWidthMm,blockersAfterMissing:broken.blockers},null,2));

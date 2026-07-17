const fs=require("fs"),vm=require("vm");
const sandbox={console,TextEncoder,Uint8Array,Date,Buffer,window:{},Blob,URL:{},setTimeout};sandbox.window=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("src/js/export/pdf-engine.js","utf8"),sandbox,{filename:"pdf-engine.js"});
const jpeg=fs.readFileSync("tests/fixtures/phase4-sample.jpg");
const page={bytes:new Uint8Array(jpeg),width:1200,height:800,pageWidthMm:148.5,pageHeightMm:210};
const bytes=sandbox.CAPS_PDFEngine.buildPdfFromJpegs([page,page],{title:"CAPS Phase 4 Test",version:"0.8.3"});
fs.writeFileSync("tests/results/SAMPLE_0.8.3_PHASE4.pdf",Buffer.from(bytes));
const text=Buffer.from(bytes).toString("latin1");if(!text.startsWith("%PDF-1.4")||!text.includes("%%EOF"))throw new Error("PDF-Struktur fehlt");if((text.match(/\/Type \/Page\b/g)||[]).length!==2)throw new Error("Seitenzahl falsch");
console.log(JSON.stringify({bytes:bytes.length,pages:2,header:text.slice(0,8),eof:text.includes("%%EOF")},null,2));

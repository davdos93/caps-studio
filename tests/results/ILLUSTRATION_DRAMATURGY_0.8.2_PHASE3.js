
const fs=require("fs"),vm=require("vm");
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},window:{}};sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ["src/js/core/story-treatment-engine.js","src/js/core/book-engine.js","src/js/core/manuscript-engine.js","src/js/core/layout-engine.js","src/js/core/illustration-engine.js"]){vm.runInContext(fs.readFileSync(file,"utf8"),sandbox,{filename:file});}
const intake={childAge:"5 Jahre",problemTopic:"Angst beim Abschied",concreteSituation:"An der Kindergartentür hält Mira Papa fest.",currentReaction:"Mira weint und fragt, ob Papa zurückkommt.",childFeelings:["Angst"],interests:["Tiere"],characters:[{name:"Mira",age:"5 Jahre",appearanceDescription:"braune Locken, rote Jacke"},{name:"Papa",relationship:"Vater"}]};
const plan=sandbox.CAPS_BookEngine.generate(intake),manuscript=sandbox.CAPS_ManuscriptEngine.generate(plan);const project={title:plan.title,bookPlan:plan,manuscript,layout:null,illustrations:null};
sandbox.CAPS_IllustrationEngine.generate(project);
const ill=project.illustrations,layout=project.layout;
if(ill.schemaVersion!=="2.0"||ill.dramaturgyVersion!=="1.0")throw new Error("Phase-3-Schema fehlt");
if(ill.items.length!==layout.spreads.length)throw new Error("Nicht genau ein Bildauftrag pro Doppelseite");
if(!layout.spreads.every(spread=>ill.items.some(item=>item.id===spread.illustrationId&&item.spreadId===spread.id)))throw new Error("Doppelseitenverknüpfung fehlt");
if(!ill.items.every(item=>item.direction?.focalMoment&&item.direction?.shot&&item.direction?.gazeDirection&&item.direction?.textSafeZone))throw new Error("Bildregie unvollständig");
if(!ill.items.every(item=>item.prompt.length>800&&item.prompt.includes("Bilddramaturgische Funktion")))throw new Error("Regieprompt unvollständig");
let triples=0;for(let i=2;i<ill.items.length;i++)if(ill.items[i].direction.shot===ill.items[i-1].direction.shot&&ill.items[i].direction.shot===ill.items[i-2].direction.shot)triples++;
if(triples)throw new Error("Dreifache Kamera-Wiederholung");
const climax=ill.items.find(item=>item.role==="climax");if(!climax||climax.direction.pageType!==sandbox.CAPS_IllustrationEngine.pageTypes.climax)throw new Error("Höhepunkt nicht inszeniert");
const first=ill.items[0];first.imageData="data:image/png;base64,AA";first.imageName="test.png";first.approved=true;first.status="approved";sandbox.CAPS_IllustrationEngine.recalc(project);
const legacy={schemaVersion:"1.0",style:ill.style,characterPassports:ill.characterPassports,items:[{id:"LEGACY",sceneId:first.sceneId,sceneNumber:first.spreadNumber,imageData:first.imageData,imageName:first.imageName,approved:true,status:"approved",prompt:"legacy"}]};project.illustrations=legacy;sandbox.CAPS_IllustrationEngine.migrate(project);
if(!project.illustrations.items.some(item=>item.imageData===first.imageData))throw new Error("Migration hat Bild verloren");
const migrated=project.illustrations.items.find(item=>item.imageData);sandbox.CAPS_IllustrationEngine.updateItem(project,migrated.id,{shot:"close",focalMoment:"Mira hält die rote Jacke fest.",notes:"manuell"});
if(!migrated.manualDirection||migrated.direction.shot!=="close"||!migrated.prompt.includes("Mira hält"))throw new Error("Manuelle Bildregie fehlgeschlagen");
console.log(JSON.stringify({spreads:layout.spreads.length,items:project.illustrations.items.length,quality:project.illustrations.quality.score,cameraVariety:project.illustrations.quality.cameraVariety,preservedImages:project.illustrations.items.filter(item=>item.imageData).length,climaxShot:project.illustrations.items.find(item=>item.role==="climax")?.direction.shot},null,2));

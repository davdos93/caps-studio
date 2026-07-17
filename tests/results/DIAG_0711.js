const fs=require('fs'),vm=require('vm');
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+Date.now()},window:{}};vm.createContext(sandbox);
for(const f of ['src/js/core/book-engine.js','src/js/core/manuscript-engine.js'])vm.runInContext(fs.readFileSync(f,'utf8'),sandbox,{filename:f});
const intake={childAge:'5 Jahre',problemTopic:'Mein Kind hat große Angst beim Abschied im Kindergarten.',concreteSituation:'An der Tür klammert es sich an mich und möchte wieder mit nach Hause.',currentReaction:'Es weint, hält mich fest und fragt immer wieder, ob ich zurückkomme.',childFeelings:['Angst','Unsicherheit'],interests:['Tiere'],safePeople:'Papa und der Stoffhase',storyWorldChoice:'CAPS soll entscheiden',bookStyle:['warmherzig'],characters:[{name:'Mira',age:'5 Jahre',appearanceDescription:'lockige dunkle Haare und grüner Pullover'}]};
const plan=sandbox.window.CAPS_BookEngine.generate(intake);const ms=sandbox.window.CAPS_ManuscriptEngine.generate(plan);
console.log('quality',ms.qualityScore);
ms.scenes.forEach((s,i)=>{if(!s.quality.childLanguage||!s.quality.concreteSituation)console.log(i+1,s.quality,s.text.slice(0,180).replace(/\n/g,' '));});
console.log('\nFIRST\n',ms.scenes[0].text);

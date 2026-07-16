(function(){
"use strict";
const uid=p=>`${p}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const arr=v=>Array.isArray(v)?v.filter(Boolean):[];
const txt=(v,f="")=>String(v??"").trim()||f;
function generate(input){
 const b={...input,pages:Number(input.pages)||32,characters:arr(input.characters),feelings:arr(input.feelings),learningGoals:arr(input.learningGoals),qualityGoals:arr(input.qualityGoals),locations:arr(input.locations)};
 const chars=(b.characters.length?b.characters:[{name:"Hauptfigur",role:"Hauptfigur",age:b.childAge,strengths:["neugierig"],challenge:"muss eine Herausforderung überwinden",development:"lernt, Hilfe anzunehmen",description:"",appearanceDescription:"",relationship:""}]).map(c=>({id:uid("CHAR"),appearanceDescription:"",relationship:"",hairColor:"",hairstyle:"",eyeColor:"",clothing:"",accessories:"",specialFeatures:"",...c,strengths:arr(c.strengths)}));
 const relationshipText=chars.map(c=>txt(c.relationship)?`${c.name}: ${txt(c.relationship)}`:"").filter(Boolean).join(" ");
 const characterFoundation=chars.map(c=>[c.name,txt(c.description),txt(c.appearanceDescription),txt(c.relationship)].filter(Boolean).join(" – ")).join(" | ");
 const world={id:uid("WORLD"),name:txt(b.worldName,"Abenteuerwelt"),type:txt(b.worldType,"fantastische Welt"),locations:b.locations.length?b.locations:["Vertrauter Ausgangsort","Geheimnisvoller Übergang","Prüfungsort","Sicherer Zielort"],rules:[b.magic?"Magie ist möglich.":"Die Welt folgt vertrauten Regeln.","Konflikte bleiben kindgerecht.","Jede Umgebung unterstützt Botschaft oder Lernziel."]};
 const chapterCount=b.pages<=24?6:b.pages<=36?8:b.pages<=52?10:12;
 const beats=[
 ["Die vertraute Welt",`${chars[0].name} und die wichtigsten Beziehungen werden vorgestellt. ${relationshipText}`,"Ein ungewöhnlicher Hinweis kündigt das Abenteuer an."],
 ["Der Ruf zum Abenteuer",`Ein Problem entsteht, das zur Botschaft „${txt(b.coreMessage,"Gemeinsam sind wir stärker")}“ passt.`,"Die Figuren brechen gemeinsam auf."],
 ["Die erste Prüfung","Das Team entdeckt seine unterschiedlichen Stärken.","Ein erster Erfolg zeigt, dass Zusammenarbeit funktioniert."],
 ["Die Welt wird größer",`Die Besonderheiten von ${world.name} werden sichtbar.`,"Ein neuer Hinweis führt tiefer ins Abenteuer."],
 ["Ein Rückschlag","Ein Fehler oder Missverständnis bringt die Figuren kurz auseinander.","Sie erkennen, dass niemand alles allein schaffen muss."],
 ["Neue Zuversicht","Die Figuren verbinden ihre Fähigkeiten.","Der Weg zum Finale wird sichtbar."],
 ["Die größte Prüfung",`Der zentrale Konflikt des ${txt(b.adventureType,"Abenteuers")} wird gemeinsam gelöst.`,"Die Kernbotschaft wird durch Handlung bewiesen."],
 ["Das warme Ende",`Die Geschichte endet ${txt(b.endingFeeling,"glücklich und geborgen")}.`,"Ein Schlussbild zeigt, wie alle gewachsen sind."]
 ];
 while(beats.length<chapterCount) beats.splice(beats.length-2,0,["Eine weitere Entdeckung","Eine neue Umgebung bringt Wissen und einen Team-Moment.","Ein Hinweis führt zum nächsten Abschnitt."]);
 const chapters=beats.slice(0,chapterCount).map((x,i)=>({id:uid("CHAPTER"),number:i+1,title:x[0],purpose:x[1],endingHook:x[2],status:"draft"}));
 const desired=Math.max(chapters.length*2,Math.round(b.pages/2)),scenes=[];
 chapters.forEach((ch,ci)=>{
  const count=Math.max(2,Math.round((desired-scenes.length)/(chapters.length-ci)));
  for(let i=0;i<count&&scenes.length<desired;i++){
   const p=scenes.length*2+1;
   scenes.push({id:uid("SCENE"),number:scenes.length+1,chapterId:ch.id,chapterNumber:ch.number,title:i?`${ch.title} – Teil ${i+1}`:ch.title,pages:[p,p+1],location:world.locations[(ci+i)%world.locations.length],characters:chars.slice(0,3).map(c=>c.name),goal:i?"Die Handlung sichtbar weiterführen.":ch.purpose,conflict:i===count-1?ch.endingHook:"Eine kleine altersgerechte Herausforderung.",result:i===count-1?"Neugier auf den nächsten Abschnitt.":"Die Figuren gewinnen Erkenntnis oder Vertrauen.",messageMoment:ci%2===0?b.coreMessage:"",illustrationIdea:`Lebendige Doppelseite in ${world.name}; Fokus auf ${chars.slice(0,3).map(c=>c.name).join(", ")}.`,textStatus:"open",imageStatus:"open"});
  }
 });
 const checks=[
  ["Kernbotschaft vorhanden",!!txt(b.coreMessage),txt(b.coreMessage)||"Kernbotschaft fehlt.",15],
  ["Zielalter definiert",!!txt(b.childAge||b.audience),txt(b.childAge||b.audience)||"Zielalter fehlt.",10],
  ["Mindestens zwei tragende Figuren",chars.length>=2,chars.length>=2?`${chars.length} Figuren geplant.`:"Eine zweite Figur würde Beziehungen stärken.",15],
  ["Anfang, Mittelteil und Schluss",chapters.length>=6,`${chapters.length} Kapitel bilden den Bogen.`,15],
  ["Bildideen vorhanden",scenes.every(s=>s.illustrationIdea),`${scenes.length} Szenen besitzen Bildideen.`,10],
  ["Gefühlsziele vorhanden",b.feelings.length>0,b.feelings.join(", ")||"Gefühlsziele fehlen.",10],
  ["Lernziel berücksichtigt",true,b.learningGoals.length?b.learningGoals.join(", "):"Emotionale Entwicklung steht im Fokus.",10],
  ["Altersgerechter Umfang",b.pages>=16&&b.pages<=64,`${b.pages} Seiten sind plausibel.`,15]
 ].map(x=>({id:uid("QA"),label:x[0],passed:x[1],detail:x[2],weight:x[3]}));
 const total=checks.reduce((s,c)=>s+c.weight,0),achieved=checks.filter(c=>c.passed).reduce((s,c)=>s+c.weight,0);
 return {schemaVersion:"1.0",generatedAt:new Date().toISOString(),generator:"CAPS Book Engine 1.0 MVP – regelbasiert",brief:b,storyBible:{id:uid("BIBLE"),title:b.title,subtitle:b.subtitle,characterFoundation,logline:`${chars.map(c=>c.name).join(", ")} erleben ein ${txt(b.adventureType,"Abenteuer")}, das zeigt: ${txt(b.coreMessage,"Gemeinsam sind wir stärker")}.`,purpose:b.purpose,audience:b.childAge||b.audience,coreMessage:b.coreMessage,secondaryMessages:arr(b.secondaryMessages),desiredFeelings:b.feelings,learningGoals:b.learningGoals,tone:arr(b.bookStyle),beginning:chapters[0].purpose,middle:chapters[Math.floor(chapters.length/2)].purpose,ending:chapters.at(-1).purpose,approvalStatus:"draft"},characters:chars,worlds:[world],chapters,scenes,qualityReport:{score:Math.round(achieved/total*100),status:achieved/total>=.85?"good":"review",checks,recommendations:checks.filter(c=>!c.passed).map(c=>c.detail)},approvals:{storyBible:false,characters:false,worlds:false,chapters:false,scenes:false,quality:false}};
}
window.CAPS_BookEngine={generate};
})();
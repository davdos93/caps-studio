(function(){
"use strict";
const uid=p=>`${p}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const clean=v=>String(v??"").replace(/\s+/g," ").trim();
const list=v=>Array.isArray(v)?v.filter(Boolean):[];
const wc=v=>clean(v)?clean(v).split(/\s+/).length:0;
const sentence=v=>{const x=clean(v);return !x?"":/[.!?…]$/.test(x)?x:x+"."};
const pick=(values,seed=0)=>values[Math.abs(seed)%values.length];
const hash=value=>[...String(value)].reduce((n,ch)=>((n<<5)-n+ch.charCodeAt(0))|0,0);
const placeholder=v=>/Handlung sichtbar|kleine altersgerechte Herausforderung|Neugier auf den nächsten|Figuren gewinnen Erkenntnis|Botschaft.*passt|Abschnitt|Teil \d+|werden vorgestellt|Beziehungen|Schlussbild|zeigt, wie|Bogen|Kernbotschaft|durch Handlung bewiesen|Besonderheiten.*werden sichtbar/i.test(clean(v));
const useful=v=>clean(v)&&!placeholder(v)?clean(v):"";

function defaults(plan){
 const audience=clean(plan?.storyBible?.audience||plan?.brief?.childAge||"3–8 Jahre");
 return {readingLevel:/3|4|5/.test(audience)?"3–6 Jahre":"6–9 Jahre",voice:"Warm und abenteuerlich",dialogueLevel:"Ausgewogen",sceneLength:"Mittel",refrain:"Zusammen finden wir einen Weg."};
}
function characters(plan,scene){
 const named=list(scene?.characters);
 const all=list(plan?.characters);
 const selected=(named.length?named.map(name=>all.find(c=>c.name===name)||{name}):all).filter(Boolean);
 return {all,hero:selected[0]||all[0]||{name:"die Hauptfigur"},partner:selected[1]||all[1]||selected[0]||{name:"der Freund"},companion:selected[2]||all[2]||selected[1]||{name:"der Begleiter"}};
}
function worldObject(plan){
 const world=plan?.worlds?.[0]||{};
 const name=clean(world.name||plan?.brief?.worldName||"Abenteuerwelt");
 if(/drache/i.test(name))return "Feuerkristall";
 if(/meer|wasser|ozean/i.test(name))return "Perlenlicht";
 if(/weltraum|stern|planet/i.test(name))return "Sternenkern";
 if(/wald|fee|zauber/i.test(name))return "Herzlicht";
 return "Leuchtstein";
}
function sensory(location,seed){
 const x=clean(location).toLowerCase();
 if(/waldhaus|hütte|haus/.test(x))return pick(["Durch das offene Fenster roch es nach Holz, Tee und feuchtem Moos","Auf dem Dach trommelten leise Tropfen, während draußen die Tannen rauschten","Sonnenflecken wanderten über den Holzboden und ließen Staubkörner funkeln"],seed);
 if(/wasserfall|fluss|bach/.test(x))return pick(["Der Wasserfall rauschte so laut, dass die Steine unter ihren Schuhen zu summen schienen","Silberne Tropfen schwebten in der Luft und kühlten ihre Wangen","Zwischen den Felsen glitzerte das Wasser wie ein Vorhang aus Glas"],seed);
 if(/kristall|höhle/.test(x))return pick(["Blaue Lichtsplitter tanzten über die Höhlenwände","Jeder Schritt weckte ein leises Echo zwischen den Kristallen","Die Luft war kühl, und aus den Spalten schimmerte violettes Licht"],seed);
 if(/zauberwald|wald/.test(x))return pick(["Die Blätter flüsterten, obwohl kein Wind ging","Moos leuchtete unter ihren Füßen wie kleine grüne Sterne","Zwischen den Stämmen schwebten goldene Pollen durch die Luft"],seed);
 if(/see/.test(x))return pick(["Der See lag glatt da, doch tief unten zogen Lichtkringel vorbei","Ein warmer Wind strich über das Wasser und trug den Duft von Minze heran","Auf der Oberfläche spiegelten sich Wolken, die wie schlafende Drachen aussahen"],seed);
 if(/himmel|tal|berg/.test(x))return pick(["Der Wind zupfte an ihren Kleidern und trieb weiße Wolken durch das Tal","Weit unter ihnen glitzerten Wege wie silberne Fäden","Die Luft war klar, und jeder Laut schien bis zu den Bergen zu tragen"],seed);
 return pick(["Die Umgebung war voller kleiner Geräusche, die man erst bemerkte, wenn man ganz still wurde","Ein ungewöhnlicher Lichtschein lag über dem Weg","Alles sah vertraut aus und zugleich ein wenig verzaubert"],seed);
}
function scaledBeat(index,total){return total<=1?0:Math.round(index/(total-1)*24)}
function beat(plan,scene,index,total,c){
 const b=scaledBeat(index,total),hero=c.hero.name,partner=c.partner.name,companion=c.companion.name,item=worldObject(plan),place=clean(scene.location||plan?.worlds?.[0]?.name||"dem Weg");
 const beats=[
  {action:`${hero} ordnete gerade die letzten Dinge, während ${partner} jedes Geräusch vor dem Fenster untersuchte`,problem:`Da hörten beide ein leises Klingen, das nicht zum Haus gehörte`,solution:`Sie sahen einander an und beschlossen, der Sache gemeinsam nachzugehen`,hook:`Das Klingen kam aus Richtung des alten Weges`},
  {action:`Vor ${place} entdeckte ${partner} einen winzigen Lichtpunkt zwischen Blättern und Steinen`,problem:`Sobald ${hero} danach griff, huschte das Licht ein Stück weiter`,solution:`Statt es festzuhalten, folgten sie ihm vorsichtig`,hook:`Im Boden erschien eine Spur aus goldenen Punkten`},
  {action:`Die Lichtspur führte tiefer nach ${place}`,problem:`An einer Weggabelung verschwand sie plötzlich`,solution:`${partner} bemerkte einen einzelnen funkelnden Tropfen auf der richtigen Seite`,hook:`Hinter den Bäumen wurde das Klingen lauter`},
  {action:`Zwischen zwei Felsen fanden sie einen Eingang, den vorher keiner von ihnen gesehen hatte`,problem:`Ein Vorhang aus Wasser versperrte den Weg`,solution:`${hero} nahm ${partner} an die Hand, und beide traten gleichzeitig hindurch`,hook:`Hinter dem Wasser wartete kein nasser Fels, sondern ein leuchtender Pfad`},
  {action:`Auf der anderen Seite öffnete sich eine fremde, wunderschöne Welt`,problem:`Der Rückweg hinter ihnen wurde durchsichtig und verschwand`,solution:`${hero} atmete tief ein; ${partner} zeigte auf frische kleine Spuren`,hook:`Die Spuren endeten bei einem zitternden Schatten`},
  {action:`Der Schatten gehörte zu ${companion}, der sich hinter einem Stein versteckt hatte`,problem:`${companion} erschrak und wollte davonlaufen`,solution:`${partner} setzte sich mit Abstand auf den Boden und sprach ganz ruhig`,hook:`Schließlich erzählte ${companion}, warum er Hilfe brauchte`},
  {action:`${companion} berichtete, dass der ${item} verschwunden war und die Welt langsam ihr Licht verlor`,problem:`Allein hatte ${companion} jede Spur verloren`,solution:`${hero} versprach zu helfen, doch ${partner} bestand darauf, ebenfalls mitzuentscheiden`,hook:`Eine eingeritzte Karte zeigte den ersten Prüfungsort`},
  {action:`Die drei verglichen die Karte mit der Umgebung und planten ihren Weg`,problem:`Zwei Pfade sahen genau gleich aus`,solution:`${partner} entdeckte auf einem Stein dasselbe Zeichen wie auf der Karte`,hook:`Der richtige Pfad führte nach ${place}`},
  {action:`In ${place} wartete ein Tor aus Stein mit drei drehbaren Symbolen`,problem:`Bei jeder falschen Drehung rückten die Symbole wieder an ihren Anfang`,solution:`${hero} prüfte die Formen, ${partner} hörte auf die Töne und ${companion} hielt das Licht`,hook:`Beim dritten Versuch öffnete sich ein schmaler Spalt`},
  {action:`Durch den Spalt war nur ein Teil des nächsten Hinweises zu sehen`,problem:`${hero} war zu groß, um hineinzuschauen`,solution:`${partner} legte sich auf den Bauch und las die Zeichen von unten nach oben`,hook:`Der Hinweis nannte einen Ort, an dem Schatten rückwärts fallen`},
  {action:`Sie folgten dem Hinweis durch ${place}`,problem:`Die Schatten zeigten in verschiedene Richtungen`,solution:`${companion} bemerkte, dass nur ein Schatten nicht zum Licht passte`,hook:`Unter diesem Schatten lag ein kleiner Schlüssel`},
  {action:`Der Schlüssel passte zu einer schmalen Brücke, die vor ihnen aus dem Nebel wuchs`,problem:`Die Bretter schwankten, und zwischen ihnen fehlte ein Stück`,solution:`Sie banden ihre Sachen zusammen und bewegten sich Schritt für Schritt`,hook:`In der Mitte begann die Brücke stärker zu zittern`},
  {action:`${hero} wollte das fehlende Stück allein überspringen und danach die anderen herüberziehen`,problem:`Der Rucksack blieb an einer Kante hängen, und ${hero} verlor das Gleichgewicht`,solution:`${partner} rief sofort einen Hinweis, während ${companion} den Gurt festhielt`,hook:`Zum ersten Mal musste ${hero} die Hilfe der beiden annehmen`},
  {action:`Gemeinsam zogen sie ${hero} zurück auf ein sicheres Brett`,problem:`Der Weg vor ihnen war trotzdem noch unterbrochen`,solution:`${partner} fand unter der Brücke eine kleine Klappe mit einem Hebel`,hook:`Der Hebel war zu schwergängig für eine Person`},
  {action:`Alle drei legten Hände, Pfoten und Krallen an den Hebel`,problem:`Er bewegte sich zunächst keinen Fingerbreit`,solution:`Sie zählten bis drei und drückten im selben Augenblick`,hook:`Mit einem tiefen Knacken schob sich das fehlende Brückenstück hervor`},
  {action:`Hinter der Brücke lag ein neuer Hinweis in einer Schale aus Glas`,problem:`Die Schrift erschien nur, wenn die Schale warm wurde`,solution:`${companion} versuchte eine kleine Flamme, doch nur ein Rauchkringel kam heraus`,hook:`${companion} senkte beschämt den Kopf`},
  {action:`${companion} wollte die Schale wegschieben und behauptete, er könne es eben nicht`,problem:`Ohne Wärme blieb der Hinweis unsichtbar`,solution:`${hero} erinnerte daran, dass eine kleine Flamme genügen könnte, und ${partner} schirmte die Schale mit beiden Händen vor dem Wind ab`,hook:`Ein winziger Funke blieb diesmal bestehen`},
  {action:`Der Funke wuchs nicht groß, aber er wärmte das Glas genau genug`,problem:`Die Zeichen leuchteten nur wenige Sekunden`,solution:`${partner} merkte sich die Reihenfolge, während ${hero} sie mit dem Finger in den Staub schrieb`,hook:`Die Zeichen führten zum letzten Tor`},
  {action:`Am letzten Tor standen drei Vertiefungen nebeneinander`,problem:`Keine der gefundenen Spuren passte allein hinein`,solution:`Sie legten Schlüssel, Karte und die abgeschriebene Zeichenfolge zusammen`,hook:`Die Vertiefungen begannen im gleichen Rhythmus zu leuchten`},
  {action:`Das Tor öffnete sich zu einer Kammer, in deren Mitte der ${item} schwebte`,problem:`Ein Ring aus kaltem Wind hielt alle auf Abstand`,solution:`${hero} suchte Schutz, ${partner} beobachtete die Pausen im Wind und ${companion} bereitete seinen kleinen Funken vor`,hook:`Für einen kurzen Moment wurde der Weg frei`},
  {action:`Auf ${partner}s Zeichen liefen sie gleichzeitig los`,problem:`Der Wind kehrte früher zurück als erwartet`,solution:`${hero} schützte ${partner}, ${partner} griff nach dem ${item}, und ${companion} löste mit seinem Funken den letzten Verschluss`,hook:`Der ${item} landete sicher in ihren Händen`},
  {action:`Als sie den ${item} an seinen Platz zurückbrachten, breitete sich Licht durch ${place} aus`,problem:`Ein letzter dunkler Riss blieb bestehen`,solution:`Alle drei legten ihre Hände und Pfote auf den Stein und dachten an das, was sie gemeinsam geschafft hatten`,hook:`Der Riss schloss sich mit einem warmen goldenen Leuchten`},
  {action:`Die Bewohner der Welt kamen aus ihren Verstecken und begrüßten die drei`,problem:`${companion} glaubte noch immer, sein kleiner Funke sei kaum etwas wert`,solution:`${partner} zeigte auf das wiedergekehrte Licht und sagte, ohne genau diesen Funken wären sie nicht angekommen`,hook:`${companion} lächelte zum ersten Mal ohne Zweifel`},
  {action:`Am verborgenen Eingang mussten ${hero} und ${partner} Abschied nehmen`,problem:`Niemand wusste, ob sich der Weg noch einmal öffnen würde`,solution:`${companion} schenkte ihnen eine kleine Schuppe, die warm wurde, sobald ein Freund an sie dachte`,hook:`Dann rauschte der Wasserfall wieder wie ein ganz gewöhnlicher Wasserfall`},
  {action:`Zurück am Ausgangsort legten ${hero} und ${partner} die warme Schuppe zwischen sich`,problem:`Das Abenteuer fühlte sich beinahe wie ein Traum an`,solution:`Als die Schuppe kurz golden aufleuchtete, wussten beide, dass es wirklich geschehen war`,hook:`${hero} wusste nun, dass Beschützen nicht bedeutet, alles allein zu tun`}
 ];
 return beats[b]||beats.at(-1);
}
function characterLine(character,kind,seed){
 const name=character.name,challenge=clean(character.challenge),strengths=list(character.strengths).join(", ");
 if(kind==="observe")return pick([`„Wartet“, sagte ${name}. „Da stimmt etwas nicht.“`,`„Schaut mal genau hin“, flüsterte ${name}. „Dort ist noch etwas.“`,`„Ich glaube, ich habe eine Spur gefunden“, sagte ${name}.`],seed);
 if(kind==="doubt")return pick([`„Was, wenn ich es nicht schaffe?“, fragte ${name}.`,`„Vielleicht bin ich dafür noch nicht gut genug“, murmelte ${name}.`,`„Mein Mut fühlt sich gerade ziemlich klein an“, sagte ${name}.`],seed);
 if(kind==="plan")return pick([`„Wir probieren es nicht nacheinander, sondern zusammen“, sagte ${name}.`,`„Jeder übernimmt den Teil, den er am besten kann“, schlug ${name} vor.`,`„Erst schauen, dann handeln“, sagte ${name}. „Und keiner bleibt allein.“`],seed);
 return pick([`„Los“, sagte ${name}. „Wir finden einen Weg.“`,`„Ich bin dabei“, sagte ${name}.`,`„Zusammen ist es weniger schwer“, sagte ${name}.`],seed);
}
function paragraphParts(plan,scene,index,total,settings,variation,mode){
 const c=characters(plan,scene),b=beat(plan,scene,index,total,c),seed=hash(scene.id||scene.title||index)+variation*17;
 const location=clean(scene.location||plan?.worlds?.[0]?.name||"dem Weg");
 const exact=[useful(scene.goal),useful(scene.conflict),useful(scene.result)].filter(Boolean);
 const intro=`${sensory(location,seed)}. ${sentence(b.action)}`;
 const dialogueKind=scaledBeat(index,total)===9?"observe":scaledBeat(index,total)===16?"doubt":scaledBeat(index,total)>=18&&scaledBeat(index,total)<=21?"plan":"go";
 const firstDialogue=characterLine(scaledBeat(index,total)===9?c.partner:scaledBeat(index,total)===16?c.companion:c.hero,dialogueKind,seed+2);
 const action=`${sentence(b.problem)} ${sentence(b.solution)}`;
 const exactText=exact.length?`${exact.map(sentence).join(" ")}`:"";
 const close=sentence(b.hook);
 const visual=mode==="vivid"?`${sensory(location,seed+7)}. Man konnte jede Bewegung deutlich sehen.`:"";
 const secondDialogue=mode==="dialogue"?characterLine(c.partner,"observe",seed+5):"";
 const warm=mode==="warm"?`${c.hero.name} bemerkte, wie viel leichter der nächste Schritt wurde, sobald niemand mehr beweisen musste, alles allein zu können.`:"";
 const exciting=mode==="exciting"?`Dann ging alles schnell. Ein Geräusch. Ein Blick. Noch ein Schritt – und plötzlich mussten sie handeln.`:"";
 return {intro,firstDialogue,action,exactText,visual,secondDialogue,warm,exciting,close,c};
}
function writeScene(plan,scene,index,total,settings={},variation=0,mode="balanced"){
 const cfg={...defaults(plan),...settings};
 const p=paragraphParts(plan,scene,index,total,cfg,variation,mode);
 let blocks=[p.intro,p.firstDialogue,p.action,p.exactText,p.visual,p.secondDialogue,p.warm,p.exciting,p.close].filter(Boolean);
 if(mode==="concise"||cfg.sceneLength==="Kurz")blocks=[p.intro,p.action,p.close];
 if(cfg.dialogueLevel==="Wenig")blocks=blocks.filter(x=>!/^„/.test(x));
 if(cfg.dialogueLevel==="Viel"&&mode!=="concise")blocks.splice(3,0,characterLine(p.c.partner,"observe",hash(scene.id)+variation+11));
 let text=blocks.join("\n\n");
 if(cfg.readingLevel==="3–6 Jahre")text=text.replace(/; /g,". ");
 return text.replace(/\.{2,}/g,".").trim();
}
function quality(text,scene){
 const sentences=clean(text).split(/(?<=[.!?])\s+/).filter(Boolean),count=wc(text),average=sentences.length?count/sentences.length:0;
 const hasDialogue=/„[^“]+“/.test(text),hasConcrete=/\b(ging|lief|griff|zeigte|öffnete|legte|zog|drückte|fand|hörte|sah|nahm|folgte|hielt|sprang|leuchtete)\b/i.test(text),hasTemplate=/Handlung sichtbar|kleine altersgerechte Herausforderung|Dabei wurde ihnen klar|Noch wussten sie nicht/i.test(text);
 const starts=sentences.map(s=>s.split(/\s+/).slice(0,2).join(" ").toLowerCase()),unique=new Set(starts).size/Math.max(1,starts.length);
 const flags={ageAppropriate:average<=16,dialogue:hasDialogue,concreteAction:hasConcrete,noTemplatePhrases:!hasTemplate,variedSentences:unique>=.65,illustrationReady:Boolean(scene?.illustrationIdea||hasConcrete)};
 const score=Math.round(Object.values(flags).filter(Boolean).length/Object.keys(flags).length*100);
 return {...flags,score,averageSentenceWords:Math.round(average*10)/10};
}
function generate(plan,settings){
 const cfg={...defaults(plan),...(settings||{})},source=list(plan.scenes);
 const scenes=source.map((scene,index)=>{const text=writeScene(plan,scene,index,source.length,cfg,0,"balanced");return{id:uid("MS"),sceneId:scene.id,chapterId:scene.chapterId,chapterNumber:scene.chapterNumber,sceneNumber:scene.number,title:scene.title,text,status:"draft",wordCount:wc(text),revision:1,variation:0,history:[],quality:quality(text,scene)}});
 return{schemaVersion:"1.1",generatedAt:new Date().toISOString(),generator:"CAPS Manuscript Engine 1.1 – szenischer Qualitätsgenerator",settings:cfg,chapters:list(plan.chapters).map(c=>({id:c.id,number:c.number,title:c.title,status:"draft"})),scenes,progress:0,qualityScore:scenes.length?Math.round(scenes.reduce((n,s)=>n+s.quality.score,0)/scenes.length):0};
}
function upgrade(manuscript,plan){
 if(!manuscript)return manuscript;
 manuscript.settings={...defaults(plan),...(manuscript.settings||{})};
 manuscript.schemaVersion="1.1";
 manuscript.scenes=list(manuscript.scenes).map(s=>({...s,variation:Number(s.variation)||0,history:list(s.history),quality:quality(s.text,(plan.scenes||[]).find(x=>x.id===s.sceneId))}));
 return recalc(manuscript,plan);
}
function rewrite(plan,manuscript,sceneId,mode="balanced"){
 upgrade(manuscript,plan);
 const target=manuscript.scenes.find(s=>s.id===sceneId),index=manuscript.scenes.indexOf(target),source=(plan.scenes||[]).find(s=>s.id===target?.sceneId);
 if(!target||!source)return manuscript;
 target.history.push({revision:target.revision,text:target.text,changedAt:new Date().toISOString(),mode});
 target.revision=(target.revision||1)+1;target.variation=(target.variation||0)+1;target.text=writeScene(plan,source,index,manuscript.scenes.length,manuscript.settings,target.variation,mode);target.status="in-progress";
 return recalc(manuscript,plan);
}
function recalc(manuscript,plan){
 const n=manuscript.scenes.length||1;manuscript.progress=Math.round(manuscript.scenes.filter(s=>s.status==="approved").length/n*100);
 manuscript.scenes.forEach(s=>{s.wordCount=wc(s.text);s.quality=quality(s.text,(plan?.scenes||[]).find(x=>x.id===s.sceneId))});
 manuscript.qualityScore=manuscript.scenes.length?Math.round(manuscript.scenes.reduce((sum,s)=>sum+s.quality.score,0)/manuscript.scenes.length):0;
 return manuscript;
}
window.CAPS_ManuscriptEngine={generate,upgrade,rewrite,recalc,quality,defaults};
})();
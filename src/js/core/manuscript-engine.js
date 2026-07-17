(function(){
"use strict";

const uid=prefix=>`${prefix}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const clean=(value,fallback="")=>String(value??"").replace(/\s+/g," ").trim()||fallback;
const list=value=>Array.isArray(value)?value.map(item=>clean(item)).filter(Boolean):String(value??"").split(/[,\n]/).map(item=>clean(item)).filter(Boolean);
const wordCount=value=>clean(value).split(/\s+/).filter(Boolean).length;
const paragraphs=value=>String(value??"").split(/\n\s*\n/).map(item=>clean(item)).filter(Boolean);
const sentenceList=value=>clean(value).split(/(?<=[.!?…])\s+/).filter(Boolean);
const hash=value=>[...String(value??"")].reduce((sum,char)=>((sum<<5)-sum)+char.charCodeAt(0)|0,0);
const pick=(items,seed)=>items[Math.abs(seed)%items.length];
const sentence=value=>{const v=clean(value);if(!v)return "";const s=v.charAt(0).toUpperCase()+v.slice(1);return /[.!?…]$/.test(s)?s:`${s}.`};
const lower=value=>{const v=clean(value);return v?v.charAt(0).toLowerCase()+v.slice(1):""};
const unique=values=>values.filter((value,index,array)=>value&&array.indexOf(value)===index);

function defaults(plan){
  const age=Number(String(plan?.characters?.[0]?.age||"").match(/\d+/)?.[0]||5);
  return {
    readingLevel:age<=6?"3–6 Jahre":"6–9 Jahre",
    voice:"Warm und literarisch",
    perspective:"Personale Erzählweise",
    dialogueLevel:"Ausgewogen",
    sceneLength:"Mittel",
    literaryDepth:"Hoch",
    themeDelivery:"Durch Entscheidungen und Konsequenzen",
    refrain:""
  };
}

function context(plan){
  const characters=plan.characters||[];
  const hero=characters[0]||{name:"die Hauptfigur",strengths:[]};
  const ally=characters[1]||hero;
  const guide=characters[2]||ally;
  const treatment=plan.storyTreatment||{};
  const profile=plan.storyBible?.psychologicalProfile||{};
  const brief=plan.bookBrief||{};
  const world=plan.worlds?.[0]||{name:"der Welt der Geschichte",locations:[]};
  return {plan,characters,hero,ally,guide,treatment,profile,brief,world};
}

function motifTerms(name){
  const source=clean(name,"ein kleines Wegzeichen");
  const key=source.toLowerCase();
  if(key.includes("rückkehrlicht"))return {first:"ein kleines Rückkehrlicht",def:"das Rückkehrlicht",dat:"dem Rückkehrlicht",pron:"es"};
  if(key.includes("sturmfeder"))return {first:"eine rotgoldene Sturmfeder",def:"die Sturmfeder",dat:"der Sturmfeder",pron:"sie"};
  if(key.includes("weglaterne")||key.includes("laterne"))return {first:"eine kleine Weglaterne",def:"die Weglaterne",dat:"der Weglaterne",pron:"sie"};
  if(key.includes("kompass"))return {first:"ein zweifarbiger Kompass",def:"der Kompass",dat:"dem Kompass",pron:"er"};
  if(key.includes("schlüssel"))return {first:"ein Ring aus ungleichen Schlüsseln",def:"der Schlüsselring",dat:"dem Schlüsselring",pron:"er"};
  if(key.includes("klangschale"))return {first:"eine Schale mit vielen Tönen",def:"die Klangschale",dat:"der Klangschale",pron:"sie"};
  if(key.includes("erinnerungslicht"))return {first:"ein warmes Erinnerungslicht",def:"das Erinnerungslicht",dat:"dem Erinnerungslicht",pron:"es"};
  if(key.includes("muschel"))return {first:"eine Muschel mit einem ruhigen Klang",def:"die Muschel",dat:"der Muschel",pron:"sie"};
  if(key.includes("karte"))return {first:"eine Karte mit alten und neuen Wegen",def:"die Karte",dat:"der Karte",pron:"sie"};
  return {first:source,def:"das kleine Wegzeichen",dat:"dem kleinen Wegzeichen",pron:"es"};
}

function safePerson(ctx){
  const value=clean(ctx.brief.safePeople);
  if(!value)return "eine vertraute Person";
  return value.split(/[,;]|\bund\b/i).map(item=>clean(item)).filter(Boolean)[0]||"eine vertraute Person";
}

function interestAction(ctx){
  const source=list(ctx.brief.interests).join(" ").toLowerCase();
  const H=ctx.hero.name;
  if(/tier|hund|katze|pferd/.test(source))return `${H} stellte Tierfiguren in einer langen Reihe auf und gab jeder einen eigenen Platz.`;
  if(/weltraum|planet|rakete|stern/.test(source))return `${H} baute aus Kartons eine Raumstation und malte kleine Sterne an die Fenster.`;
  if(/dinosaur/.test(source))return `${H} legte Dinosaurierfiguren auf eine selbst gezeichnete Karte und suchte einen Weg durch das Farnland.`;
  if(/drache/.test(source))return `${H} zeichnete ein Drachennest auf ein großes Blatt und fügte eine Wolkenbrücke nach der anderen hinzu.`;
  if(/meer|ozean|fisch|delfin/.test(source))return `${H} ordnete Muscheln zu einem Unterwasserweg und ließ eine kleine Figur durch die Wellen schwimmen.`;
  if(/bagger|auto|zug|fahrzeug/.test(source))return `${H} baute eine Straße aus Klötzen und schob die Fahrzeuge ganz langsam über jede Kurve.`;
  if(/fee|zauber|einhorn/.test(source))return `${H} legte bunte Steine zu einem geheimen Zauberweg und bestimmte genau, wo er beginnen sollte.`;
  if(/fußball|ball|sport/.test(source))return `${H} rollte einen Ball zwischen zwei Stuhlbeinen hindurch und zählte jeden Treffer leise mit.`;
  return `${H} war mit einer Sache beschäftigt, die volle Aufmerksamkeit brauchte, und wollte sie unbedingt zu Ende bringen.`;
}

function childFeeling(ctx){
  const feelings=list(ctx.profile.feelings);
  return feelings[0]||"Unsicherheit";
}

function bodyMoment(ctx,seed){
  const H=ctx.hero.name;
  return pick([
    `${H}s Finger wurden fest. Im Bauch zog sich etwas zusammen, obwohl ringsum alles aussah wie vorher.`,
    `${H} spürte das Gefühl zuerst in den Schultern. Sie rückten so hoch, als könnten sie die Ohren beschützen.`,
    `Der Atem saß plötzlich weit oben. ${H} wollte gleichzeitig bleiben, fortlaufen und genau wissen, was als Nächstes geschah.`,
    `${H}s Blick sprang hin und her. Das Gefühl war nicht zu sehen, aber es machte Hände, Füße und Gedanken sehr schnell.`
  ],seed);
}

function strategySteps(ctx){
  const source=clean(ctx.profile.copingStrategy).toLowerCase();
  const steps=[];
  if(/gefühl|benennen|wahrnehmen/.test(source))steps.push("sagen, was gerade im Bauch, in den Händen oder im Kopf los ist");
  if(/atmen|atem/.test(source))steps.push("einmal langsam ein- und wieder ausatmen");
  if(/abstand/.test(source))steps.push("einen Abstand wählen, der sich noch sicher anfühlt");
  if(/anker|zeichen|gegenstand|ritual/.test(source))steps.push("den vertrauten Gegenstand oder das vereinbarte Zeichen berühren");
  if(/schauen|beobacht/.test(source))steps.push("erst genau hinschauen, bevor etwas getan wird");
  if(/zuhör/.test(source))steps.push("die andere Person bis zum Ende anhören");
  if(/hilfe|unterstütz/.test(source))steps.push("genau sagen, welche Hilfe gebraucht wird");
  if(/klein|nächsten schritt|überschaubar/.test(source))steps.push("den kleinsten machbaren Schritt auswählen");
  if(/grenze|stopp/.test(source))steps.push("klar Stopp sagen und Hände und Füße sicher halten");
  const fallback=["kurz anhalten","schauen, was gerade wirklich passiert","den kleinsten nächsten Schritt selbst wählen"];
  return unique(steps.concat(fallback)).slice(0,3);
}

function voiceLine(character,kind,ctx,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name;
  const lines={
    allySupport:[
      `„Ich bleibe hier“, sagte ${A}. „Du musst nicht alles auf einmal schaffen.“`,
      `„Sag mir, was ich tun soll – und was nicht“, sagte ${A}.`,
      `„Ich kann warten“, sagte ${A}. „Du gibst das Zeichen.“`
    ],
    heroDoubt:[
      `„Ich weiß noch nicht, ob ich das kann“, sagte ${H}.`,
      `„Das Gefühl ist noch da“, flüsterte ${H}.`,
      `„Nicht alles“, sagte ${H}. „Aber vielleicht den ersten Teil.“`
    ],
    guide:[
      `„Ein Weg muss nicht ganz sichtbar sein“, sagte ${G}. „Der nächste sichere Schritt reicht.“`,
      `„Ich kann euch die Regel zeigen“, sagte ${G}. „Entscheiden müsst ihr selbst.“`,
      `„Hilfe ist gut“, sagte ${G}. „Aber sie soll zu der Person passen, die sie bekommt.“`
    ],
    repair:[
      `„Ich habe dich nicht ausreden lassen“, sagte ${H}. „Das war nicht fair.“`,
      `„Ich dachte, ich müsste alles allein schaffen“, sagte ${H}. „Dabei habe ich dich weggeschoben.“`,
      `„Zeigst du mir noch einmal, was du gesehen hast?“, fragte ${H}.`
    ]
  };
  return pick(lines[kind]||lines.heroDoubt,seed);
}

function makeParagraph(textValue,beats,kind){
  return {id:uid("PAR"),text:clean(textValue),beatNumbers:unique((beats||[]).filter(Boolean)),kind};
}

function chapterOne(ctx,motif,seed){
  const H=ctx.hero.name,person=safePerson(ctx),concrete=sentence(ctx.profile.concreteSituation),reaction=sentence(ctx.profile.currentReaction);
  const ps=[];
  ps.push(makeParagraph(`${interestAction(ctx)} Heute sollte es besonders gut werden. ${H} rückte noch ein Teil zurecht, lehnte sich zurück und lächelte.`,[1],"opening"));
  ps.push(makeParagraph(`Dann kam der Augenblick, der sich in letzter Zeit oft schwer angefühlt hatte. ${concrete} ${bodyMoment(ctx,seed)} ${reaction}`,[1,2],"problem"));
  ps.push(makeParagraph(`${person} ging nicht einfach darüber hinweg. Die vertraute Person blieb in der Nähe und sprach ruhig. Doch ${H} konnte die Worte kaum festhalten. Das Gefühl war schneller und schob alles andere an den Rand.`,[2],"relationship"));
  ps.push(makeParagraph(`${H} versuchte, die Situation mit der bekannten Reaktion zu beenden. Für einen kurzen Moment schien das zu helfen. Dann merkte ${H}, dass etwas Wichtiges offen geblieben war. Der Platz fühlte sich stiller an als zuvor.`,[2],"consequence"));
  ps.push(makeParagraph(`Neben der Sache, mit der ${H} eben gespielt hatte, lag plötzlich ${motif.first}. Es war vorher ganz sicher nicht dort gewesen. ${H} berührte ${motif.def} nur mit einer Fingerspitze. Darin glomm ein winziger Punkt auf und wanderte langsam bis zum Rand.`,[2,3],"inciting"));
  ps.push(makeParagraph(`Aus dem Licht kam ein leises Klopfen. Einmal. Zweimal. Dann öffnete sich mitten im Zimmer eine schmale Spur, die aussah, als führe sie gleichzeitig sehr weit weg und genau dorthin, wo die offene Frage wartete. ${H} zog die Hand zurück – aber ${motif.def} leuchtete weiter.`,[3],"hook"));
  return ps;
}

function chapterTwo(ctx,motif,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name,W=ctx.world.name,quest=clean(ctx.treatment?.protagonist?.externalWant||ctx.brief.adventureType||"einen wichtigen Auftrag zu erfüllen");
  const ps=[];
  ps.push(makeParagraph(`Die schmale Spur blieb offen. Dahinter lag ${W}: erst nur ein Stück Himmel, dann ein Weg, der sich zwischen unbekannten Formen verlor. Am Rand wartete ${A}. ${A} sah erleichtert aus, aber auch so, als wäre die Zeit knapp.`,[3],"entry"));
  ps.push(makeParagraph(`„Ich brauche Hilfe“, sagte ${A}. Dann erklärte ${A}, was geschehen war. ${sentence(quest)} Ohne den fehlenden Teil konnten die Bewohner der Welt ihren Weg nicht beenden.`,[3],"quest"));
  ps.push(makeParagraph(`${H} stellte viele Fragen. Wo begann der Weg? Konnte man zurück? Was geschah, wenn es zu schwer wurde? ${A} beantwortete jede Frage, auch die doppelt gestellten. Erst danach sah ${H} wieder zu ${motif.dat}.`,[3],"choice"));
  ps.push(makeParagraph(`${voiceLine(null,"heroDoubt",ctx,seed)} ${voiceLine(null,"allySupport",ctx,seed+1)} ${H} dachte an den stillen Platz im Zimmer. Umkehren hätte das Gefühl kurz kleiner gemacht. Gelöst wäre trotzdem nichts gewesen.`,[3,4],"dialogue"));
  ps.push(makeParagraph(`Hinter der ersten Biegung saß ${G} auf einem niedrigen Stein. ${G} erklärte nur eine Regel: ${sentence(ctx.treatment?.motif?.rule)} Der Rückweg blieb sichtbar. Niemand zog ${H} nach vorn.`,[4],"rule"));
  ps.push(makeParagraph(`${H} legte die Hand um ${motif.def}. „Ich versuche den ersten Abschnitt“, sagte ${H}. Mehr musste noch nicht entschieden werden. Gemeinsam gingen sie über die Schwelle.`,[4],"chapterEnd"));
  return ps;
}

function chapterThree(ctx,motif,seed){
  const H=ctx.hero.name,A=ctx.ally.name,strength=clean(ctx.hero.strengths?.[0],"genaues Hinsehen");
  const ps=[];
  ps.push(makeParagraph(`Der erste Weg verlangte etwas, das ${H} gut konnte: ${lower(strength)}. Zwischen den Steinen lagen feine Zeichen, die nur sichtbar wurden, wenn niemand zu schnell darübertrat. ${H} entdeckte das erste, dann das zweite und schließlich eine ganze Reihe.`,[5],"strength"));
  ps.push(makeParagraph(`${A} ging ein Stück seitlich und beobachtete den Rand. „Da bewegt sich etwas“, sagte ${A}. ${H} nickte, war aber schon beim nächsten Zeichen. Der frühe Erfolg fühlte sich so gut an, dass es schwerfiel, langsamer zu werden.`,[5],"setup"));
  ps.push(makeParagraph(`An der zweiten Prüfung reichte genaues Hinsehen allein nicht mehr. Der Weg wurde schmal, und ${motif.def} begann unruhig zu flackern. ${bodyMoment(ctx,seed)} Das alte Gefühl kannte nur eine schnelle Antwort.`,[6],"pressure"));
  ps.push(makeParagraph(`${H} handelte, bevor ${A} den Satz beenden konnte. Für einen Moment bewegte sich der Weg. Dann kippte ein Teil zur Seite, und die nächste Markierung verschwand. ${motif.def} wurde dunkel.`,[6],"mistake"));
  ps.push(makeParagraph(`„Ich wollte dir etwas zeigen“, sagte ${A}. Die Stimme war nicht laut. Gerade deshalb hörte ${H}, wie verletzt sie klang. ${H} wollte erklären, dass alles nur helfen sollte. Doch die Erklärung machte den verschwundenen Weg nicht wieder sichtbar.`,[6],"relationshipBreak"));
  ps.push(makeParagraph(`Sie erreichten noch einen geschützten Felsvorsprung. Dort mussten sie anhalten. Hinter ihnen lag der Weg, den sie geschafft hatten. Vor ihnen war nur Nebel. Zwischen ${H} und ${A} blieb ein Satz stehen, den noch niemand gesagt hatte.`,[6,7],"hook"));
  return ps;
}

function chapterFour(ctx,motif,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name;
  const ps=[];
  ps.push(makeParagraph(`Auf dem Felsvorsprung war es still genug, um den eigenen Atem zu hören. ${H} setzte sich. Niemand verlangte eine schnelle Lösung. ${G} stellte ${motif.def} zwischen die Figuren, obwohl es kaum noch leuchtete.`,[7],"pause"));
  ps.push(makeParagraph(`${A} erzählte, was am Rand des Weges zu sehen gewesen war: ein kleines Zeichen, das immer dann erschien, wenn zwei verschiedene Spuren zusammenpassten. ${H} hatte nur die eigene Spur verfolgt.`,[7,8],"allyObservation"));
  ps.push(makeParagraph(`${voiceLine(null,"repair",ctx,seed)} ${A} antwortete nicht sofort. Dann rückte ${A} ein wenig näher und zeigte mit dem Finger auf die dunkle Fläche von ${motif.def}.`,[8],"repair"));
  ps.push(makeParagraph(`„Ich möchte nicht nur hinterherlaufen“, sagte ${A}. „Und ich möchte auch nicht alles für dich machen.“ ${H} verstand, dass beides gleichzeitig stimmen konnte. Hilfe musste nicht bedeuten, dass jemand die Aufgabe wegnahm.`,[8],"relationshipTruth"));
  ps.push(makeParagraph(`${voiceLine(null,"guide",ctx,seed+1)} Gemeinsam vereinbarten sie ein sichtbares Zeichen: eine offene Hand. Wer sie zeigte, brauchte einen Moment zum Schauen, Atmen oder Fragen.`,[8],"newRule"));
  ps.push(makeParagraph(`Als ${H} ${motif.def} wieder aufhob, erschien darin ein ruhiger Lichtpunkt. Er zeigte nicht den ganzen Weg. Nur drei Schritte bis zu einem Ort, an dem sie einen neuen Plan machen konnten. Das war genug.`,[8,9],"hook"));
  return ps;
}

function chapterFive(ctx,motif,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name,steps=strategySteps(ctx);
  const ps=[];
  ps.push(makeParagraph(`Der neue Plan passte auf drei kleine Steine. Auf den ersten malte ${G}: „${steps[0]}“. Auf den zweiten: „${steps[1]}“. Auf den dritten: „${steps[2]}“. ${H} legte sie in die richtige Reihenfolge.`,[9],"plan"));
  ps.push(makeParagraph(`${A} bekam eine eigene Aufgabe: beobachten und nur dann sprechen, wenn das vereinbarte Zeichen kam. ${G} sollte den sicheren Rand zeigen. Die Entscheidung in der Mitte blieb bei ${H}.`,[9],"roles"));
  ps.push(makeParagraph(`Sie übten an einer kleinen Stelle, an der kaum etwas schiefgehen konnte. Trotzdem meldete sich das Gefühl. ${bodyMoment(ctx,seed)} ${H} zeigte die offene Hand. Niemand drängte.`,[10],"practiceStart"));
  ps.push(makeParagraph(`${voiceLine(null,"allySupport",ctx,seed+1)} ${H} ging die drei Schritte durch. Erst langsam, dann noch einmal. Beim letzten Schritt bewegte sich ein kleines Wegstück und blieb fest.`,[10],"practice"));
  ps.push(makeParagraph(`Es war kein großer Sieg. Der Weg zum Zentrum lag noch weit vor ihnen. Aber ${H} wusste nun, dass der neue Ablauf nicht nur eine gute Idee war. Er hatte wirklich etwas verändert.`,[10],"earnedSuccess"));
  ps.push(makeParagraph(`${motif.def.charAt(0).toUpperCase()+motif.def.slice(1)} leuchtete ruhig. In seinem Licht erschien dieselbe kleine Randmarkierung, die ${A} schon vorher gesehen hatte. Diesmal blieben alle stehen und sahen gemeinsam hin.`,[10,11],"payoffSetup"));
  return ps;
}

function chapterSix(ctx,motif,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name;
  const ps=[];
  ps.push(makeParagraph(`Vor dem Zentrum der Welt wurde der Weg breiter – und zugleich schwieriger. Geräusche kamen aus mehreren Richtungen. Markierungen verschwanden, sobald man ihnen zu lange nachsah. Alles fühlte sich an, als müsse es sofort entschieden werden.`,[11],"newPressure"));
  ps.push(makeParagraph(`Das alte Muster war schneller als der neue Plan. ${H} machte einen hastigen Schritt. Der Boden gab nach, und sie verloren einen Teil des Weges. Doch diesmal bemerkte ${H} früher, was geschehen war.`,[11],"setback"));
  ps.push(makeParagraph(`${H} hob die offene Hand. Der Atem ging noch schnell. „Ich bin wieder losgegangen, bevor ich geschaut habe“, sagte ${H}. Niemand nannte das einen Beweis dafür, dass der neue Weg nicht funktionierte.`,[11],"recognition"));
  ps.push(makeParagraph(`${A} zeigte auf die Randmarkierung. ${G} blieb am sicheren Ende des Weges. ${voiceLine(null,"guide",ctx,seed)} ${H} sagte genau, welche Hilfe gebraucht wurde – und welche nicht.`,[12],"helpBoundary"));
  ps.push(makeParagraph(`Nun lagen alle Teile bereit: die Stärke von ${H}, die Beobachtung von ${A}, die sichere Grenze von ${G} und die drei kleinen Schritte. Keiner davon konnte den anderen ersetzen.`,[12],"climaxSetup"));
  ps.push(makeParagraph(`Hinter einer letzten Biegung begann ${motif.def} so hell zu leuchten, dass ihre Schatten lang über den Boden fielen. Dort wartete die entscheidende Stelle. Diesmal gingen sie nicht weiter, bevor jeder seine Aufgabe kannte.`,[12,13],"hook"));
  return ps;
}

function chapterSeven(ctx,motif,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name,steps=strategySteps(ctx),quest=clean(ctx.brief.adventureType||ctx.treatment?.protagonist?.externalWant||"den Auftrag zu erfüllen");
  const ps=[];
  ps.push(makeParagraph(`Im Zentrum der Prüfung war sofort zu erkennen, warum vorher nichts genügt hatte. Der letzte Weg reagierte auf jede hastige Bewegung. Sobald jemand alles gleichzeitig lösen wollte, zog er sich zusammen.`,[13],"climaxProblem"));
  ps.push(makeParagraph(`${H} spürte das alte Gefühl deutlich. Es war nicht verschwunden. ${bodyMoment(ctx,seed)} Doch diesmal wusste ${H}, dass ein Gefühl mitkommen durfte, ohne die Entscheidung zu treffen.`,[13],"climaxFeeling"));
  ps.push(makeParagraph(`„${steps[0]}", sagte ${H} leise. Dann folgte: „${steps[1]}.“ ${A} zeigte die Beobachtung am Rand. ${G} hielt den sicheren Bereich frei und blieb dort.`,[13],"climaxSequence"));
  ps.push(makeParagraph(`${H} nannte die eine Hilfe, die jetzt gebraucht wurde. Danach führte ${H} den letzten Schritt selbst aus. ${motif.def.charAt(0).toUpperCase()+motif.def.slice(1)} reagierte nicht mit einem Knall. Das Licht wurde ruhig, klar und breitete sich genau entlang der verbundenen Spuren aus.`,[13],"decisiveAction"));
  ps.push(makeParagraph(`Der Weg öffnete sich. Damit konnten sie ${lower(quest)}. Es geschah nicht, weil plötzlich alles leicht war. Es geschah, weil jede frühe Beobachtung, jeder Fehler und jede neue Vereinbarung an der richtigen Stelle gebraucht wurde.`,[13],"resolution"));
  ps.push(makeParagraph(`${A} lachte zuerst. ${G} setzte sich einfach auf den Boden. ${H} blieb einen Moment stehen und sah zurück auf den Weg. Der schwierigste Schritt war nicht der größte gewesen. Es war der Schritt, bei dem ${H} anders entschieden hatte.`,[13],"afterClimax"));
  return ps;
}

function chapterEight(ctx,motif,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name,person=safePerson(ctx),concrete=sentence(ctx.profile.concreteSituation),steps=strategySteps(ctx);
  const ps=[];
  ps.push(makeParagraph(`Auf dem Rückweg erzählten sie nicht von Mut oder großen Eigenschaften. Sie nannten konkrete Dinge: wann ${H} angehalten hatte, was ${A} entdeckt hatte und wie ${G} den sicheren Rand gehalten hatte.`,[14],"debrief"));
  ps.push(makeParagraph(`${A} verabschiedete sich an der Schwelle. ${motif.def.charAt(0).toUpperCase()+motif.def.slice(1)} blieb bei ${H}, aber sein Licht wurde klein. Es war keine Zauberlösung. Es erinnerte nur an die Schritte, die bereits wirklich gelungen waren.`,[14],"return"));
  ps.push(makeParagraph(`Im Zimmer stand alles noch an seinem Platz. ${person} war da. ${H} legte ${motif.def} neben die Sache vom Anfang und erzählte nur so viel, wie gerade in Worte passte.`,[14],"home"));
  ps.push(makeParagraph(`Einige Zeit später kam eine ähnliche Situation. ${concrete} Das alte Gefühl tauchte sofort auf. Es war vertraut und noch immer unangenehm.`,[14],"echo"));
  ps.push(makeParagraph(`${H} hielt kurz an. Dann begann ${H} mit dem ersten kleinen Schritt: ${steps[0]}. Danach folgte der zweite. Nicht alles gelang sofort. Doch diesmal konnte ${H} sagen, welche Hilfe nötig war.`,[14],"transfer"));
  ps.push(makeParagraph(`${person} blieb verlässlich in der Nähe. ${H} machte den nächsten Schritt selbst. Das Gefühl ging nicht ganz fort. Aber es füllte nicht mehr den ganzen Raum. Und als ${H} später an ${motif.def} dachte, war da nicht nur die Erinnerung an die schwierige Stelle, sondern auch an den Weg hindurch.`,[14],"ending"));
  return ps;
}

function writeChapter(plan,chapter,index,settings,variation=0){
  const ctx=context(plan),motif=motifTerms(ctx.treatment?.motif?.name),seed=hash(`${chapter.id}|${variation}|${settings.voice}`);
  const writers=[chapterOne,chapterTwo,chapterThree,chapterFour,chapterFive,chapterSix,chapterSeven,chapterEight];
  let paras=(writers[index]||chapterEight)(ctx,motif,seed);
  if(settings.voice==="Ruhig und poetisch")paras=paras.map((p,i)=>i%3===1?{...p,text:`${p.text} Für einen Augenblick schien die Welt langsamer zu atmen.`}:p);
  if(settings.voice==="Lebendig und humorvoll")paras=paras.map((p,i)=>i===1&&index>0?{...p,text:`${p.text} Sogar ein kleiner Stein am Weg sah aus, als hätte er dazu eine Meinung.`}:p);
  if(settings.voice==="Spannend und direkt")paras=paras.map((p,i)=>i===paras.length-2?{...p,text:`${p.text} Dann bewegte sich etwas direkt vor ihnen.`}:p);
  if(settings.dialogueLevel==="Viel")paras.splice(Math.max(2,paras.length-1),0,makeParagraph(`${voiceLine(null,"heroDoubt",ctx,seed+30)} ${voiceLine(null,"allySupport",ctx,seed+31)}`,chapter.beatStart?[chapter.beatStart]:[],"extraDialogue"));
  if(settings.dialogueLevel==="Wenig")paras=paras.map(p=>({...p,text:p.text.replace(/„[^“]+“[, ]*(sagte|fragte|flüsterte)?[^.]*\.?/g,"").replace(/\s+/g," ").trim()})).filter(p=>p.text);
  if(settings.sceneLength==="Kurz")paras=paras.filter((p,i)=>i===0||i===paras.length-1||i%2===0);
  if(settings.sceneLength==="Ausführlich"){
    const extra=makeParagraph(`${ctx.hero.name} nahm sich Zeit, die Veränderung genau anzusehen. Was eben nur wie ein Hindernis gewirkt hatte, zeigte nun auch, welche Entscheidung als Nächstes möglich war.`,chapter.beatEnd?[chapter.beatEnd]:[],"reflection");
    paras.splice(Math.max(2,paras.length-1),0,extra);
  }
  if(settings.refrain&&[1,4,7].includes(index))paras.splice(paras.length-1,0,makeParagraph(sentence(settings.refrain),chapter.beatEnd?[chapter.beatEnd]:[],"refrain"));
  const textValue=paras.map(p=>p.text).join("\n\n");
  return {
    id:chapter.id,chapterId:chapter.id,number:chapter.number,title:chapter.title,
    text:textValue,paragraphs:paras,wordCount:wordCount(textValue),revision:1,variation,
    sourceBeatNumbers:unique(paras.flatMap(p=>p.beatNumbers)),
    openingFact:paras[0]?.text||"",closingFact:paras.at(-1)?.text||""
  };
}

function balancedGroups(items,count){
  if(count<=1)return [items];
  const groups=Array.from({length:count},()=>[]);
  const total=items.reduce((sum,item)=>sum+wordCount(item.text),0);
  const target=Math.max(1,total/count);
  let group=0,current=0;
  items.forEach((item,index)=>{
    const remainingItems=items.length-index;
    const remainingGroups=count-group;
    if(group<count-1&&current>=target&&remainingItems>=remainingGroups){group++;current=0}
    groups[group].push(item);current+=wordCount(item.text);
  });
  for(let i=0;i<groups.length;i++){
    if(!groups[i].length){
      const donor=groups.findIndex(g=>g.length>1);
      if(donor>=0)groups[i].push(groups[donor].pop());
    }
  }
  return groups;
}

function influence(plan,scene){
  const ctx=context(plan);
  const focus=(plan.characters||[]).find(character=>character.name===scene.focusCharacter)||ctx.hero;
  return {
    focusCharacter:focus.name,
    focusChallenge:clean(focus.challenge,ctx.profile.topic),
    focusDevelopment:clean(focus.development,ctx.profile.desiredDevelopment),
    relationship:clean(focus.relationship||ctx.ally.relationship),
    themeAction:clean(scene.copingStrategy||ctx.profile.copingStrategy),
    consequence:clean(scene.result),
    psychologicalFunction:clean(scene.psychologicalFunction),
    childFeeling:clean(scene.emotionalState),
    desiredSkill:clean(ctx.profile.desiredDevelopment)
  };
}

function deriveScenes(plan,bookChapters,existingScenes=[]){
  const result=[];
  (plan.chapters||[]).forEach(chapter=>{
    const source=bookChapters.find(item=>item.chapterId===chapter.id);
    const planScenes=(plan.scenes||[]).filter(scene=>scene.chapterId===chapter.id);
    const groups=balancedGroups(source?.paragraphs||[],Math.max(1,planScenes.length));
    planScenes.forEach((planScene,index)=>{
      const old=existingScenes.find(item=>item.sceneId===planScene.id);
      const group=groups[index]||[];
      const textValue=group.map(item=>item.text).join("\n\n");
      result.push({
        id:old?.id||uid("MS"),sceneId:planScene.id,chapterId:chapter.id,chapterNumber:chapter.number,
        sceneNumber:planScene.number,title:planScene.title,text:textValue,wordCount:wordCount(textValue),
        status:old?.status||"draft",revision:old?.revision||1,variation:old?.variation||0,history:old?.history||[],
        influence:influence(plan,planScene),sourceParagraphIds:group.map(item=>item.id),
        narrativeMeta:{
          chapterTitle:chapter.title,sourceBeatNumbers:unique(group.flatMap(item=>item.beatNumbers)),
          location:planScene.location||"",consequence:planScene.result||"",hook:planScene.endingHook||"",
          carry:source?.closingFact||"",chapterStart:index===0
        },quality:null
      });
    });
  });
  return result;
}

function composeFullText(manuscript){
  return (manuscript.bookChapters||[]).map(chapter=>`Kapitel ${chapter.number}: ${chapter.title}\n\n${chapter.text}`).join("\n\n\n");
}

function bookQuality(manuscript,plan){
  const ctx=context(plan),full=composeFullText(manuscript),lowerFull=full.toLowerCase();
  const chapterTexts=(manuscript.bookChapters||[]).map(chapter=>chapter.text);
  const startsWithEveryday=chapterTexts[0]?.includes(ctx.hero.name)&&chapterTexts[0]?.includes(clean(ctx.profile.concreteSituation).split(/\s+/).find(word=>word.length>6)||ctx.hero.name);
  const banned=/\b(psychologisch|bewältigungsstrategie|entwicklungsziel|selbstwirksamkeit|handlungsspielraum|die hauptfigur|die botschaft|die moral|intervention|emotionales bedürfnis|treatment|beat)\b/i;
  const motif=motifTerms(ctx.treatment?.motif?.name).def.toLowerCase();
  const dialogueCount=(full.match(/[„“]/g)||[]).length/2;
  const repeatedParagraphs=chapterTexts.flatMap(paragraphs).filter((p,i,a)=>a.indexOf(p)!==i).length;
  const checks=[
    {label:"Klarer Anfang im Alltag",passed:Boolean(startsWithEveryday),detail:"Hauptfigur, Interesse und konkrete Situation erscheinen vor dem Abenteuer."},
    {label:"Vollständiger Geschichtenbogen",passed:(manuscript.bookChapters||[]).length===(plan.chapters||[]).length&&full.includes("Kapitel 1")===false,detail:`${manuscript.bookChapters?.length||0} zusammenhängende Kapitel.`},
    {label:"Treatment vollständig verarbeitet",passed:new Set((manuscript.bookChapters||[]).flatMap(ch=>ch.sourceBeatNumbers)).size>=13,detail:"Anfang, Fehlversuch, Reparatur, Übung, Rückschlag, Höhepunkt und Alltagsecho sind enthalten."},
    {label:"Wiederkehrendes Motiv",passed:lowerFull.split(motif).length-1>=5,detail:`${ctx.treatment?.motif?.name||"Motiv"} kehrt mit derselben Funktion wieder.`},
    {label:"Natürliche Dialogverteilung",passed:dialogueCount>=8,detail:`${Math.round(dialogueCount)} Dialogwechsel im Gesamtbuch.`},
    {label:"Keine Planungssprache",passed:!banned.test(full),detail:"Fach- und Planungsbegriffe erscheinen nicht im Buchtext."},
    {label:"Keine doppelten Absätze",passed:repeatedParagraphs===0,detail:`${repeatedParagraphs} doppelte Absätze.`},
    {label:"Alltagstransfer",passed:chapterTexts.at(-1)?.includes(clean(ctx.profile.concreteSituation).split(/\s+/).find(word=>word.length>6)||ctx.hero.name),detail:"Das Ende kehrt in eine ähnliche konkrete Alltagssituation zurück."}
  ];
  return {score:Math.round(checks.filter(check=>check.passed).length/checks.length*100),checks};
}

function sceneQuality(scene,plan,index,previous){
  const value=clean(scene.text),paras=paragraphs(scene.text),sentences=sentenceList(value),count=wordCount(value),ctx=context(plan);
  const avg=sentences.length?count/sentences.length:99;
  const banned=/\b(psychologisch|bewältigungsstrategie|entwicklungsziel|selbstwirksamkeit|handlungsspielraum|die hauptfigur|die botschaft|die moral|intervention|emotionales bedürfnis|treatment|beat)\b/i;
  const dialogue=(value.match(/[„“]/g)||[]).length>=2;
  const starts=sentences.map(item=>item.split(/\s+/).slice(0,2).join(" ").toLowerCase());
  const varied=new Set(starts).size>=Math.max(3,Math.floor(sentences.length*.5));
  return {
    score:Math.round([count>=55,paras.length>=1,!banned.test(value),avg<=24,varied,index===0||Boolean(previous),Boolean(scene.narrativeMeta?.sourceBeatNumbers?.length)].filter(Boolean).length/7*100),
    ageAppropriate:!banned.test(value)&&avg<=24,detailed:count>=55,narrativeFlow:index===0||Boolean(previous),
    contextInfluence:value.includes(ctx.hero.name),themeInAction:!banned.test(value),noTemplatePhrases:!banned.test(value),
    variedSentences:varied,continuity:index===0||Boolean(previous),paragraphCohesion:paras.length>=1,
    naturalDialogue:dialogue,psychologicalFit:Boolean(scene.influence?.psychologicalFunction),coherent:Boolean(scene.narrativeMeta?.consequence),
    clearBeginning:index>0||value.includes(ctx.hero.name),childLanguage:!banned.test(value)&&avg<=24,concreteSituation:Boolean(scene.narrativeMeta?.location)
  };
}

function recalc(manuscript,plan){
  manuscript.scenes.forEach((scene,index)=>{
    scene.wordCount=wordCount(scene.text);
    scene.quality=sceneQuality(scene,plan,index,manuscript.scenes[index-1]||null);
  });
  manuscript.bookChapters.forEach(chapter=>{chapter.wordCount=wordCount(chapter.text)});
  manuscript.fullText=composeFullText(manuscript);
  manuscript.wordCount=wordCount(manuscript.fullText);
  manuscript.bookQuality=bookQuality(manuscript,plan);
  const sceneAverage=manuscript.scenes.length?manuscript.scenes.reduce((sum,scene)=>sum+(scene.quality?.score||0),0)/manuscript.scenes.length:0;
  manuscript.qualityScore=Math.round((sceneAverage+manuscript.bookQuality.score*2)/3);
  const total=manuscript.scenes.length||1;
  manuscript.progress=Math.round(manuscript.scenes.filter(scene=>scene.status==="approved").length/total*100);
  manuscript.updatedAt=new Date().toISOString();
  return manuscript;
}

function generate(plan,settings){
  const cfg={...defaults(plan),...(settings||{})};
  const chapters=(plan.chapters||[]).map(chapter=>({...chapter}));
  const bookChapters=chapters.map((chapter,index)=>writeChapter(plan,chapter,index,cfg,0));
  const scenes=deriveScenes(plan,bookChapters,[]);
  const manuscript={
    schemaVersion:"5.0",generatedAt:new Date().toISOString(),generator:"CAPS Whole Book Writer 5.0",
    settings:cfg,chapters,bookChapters,scenes,fullText:"",wordCount:0,progress:0,qualityScore:0,
    continuityLedger:{
      openingSituation:clean(plan.storyTreatment?.openingSituation),
      storyQuestion:clean(plan.storyTreatment?.storyQuestion),
      motifRule:clean(plan.storyTreatment?.motif?.rule),
      characterArcs:(plan.storyTreatment?.characterArcs||[]).map(arc=>({name:arc.name,openingState:arc.openingState,finalState:arc.finalState})),
      unresolvedThreads:[]
    }
  };
  return recalc(manuscript,plan);
}

function replaceChapter(manuscript,plan,chapterId,newChapter){
  const index=manuscript.bookChapters.findIndex(chapter=>chapter.chapterId===chapterId);
  if(index<0)return manuscript;
  manuscript.bookChapters[index]=newChapter;
  manuscript.scenes=deriveScenes(plan,manuscript.bookChapters,manuscript.scenes);
  return recalc(manuscript,plan);
}

function updateChapter(manuscript,plan,chapterId,textValue){
  const chapter=manuscript.bookChapters.find(item=>item.chapterId===chapterId);
  if(!chapter)return manuscript;
  const oldText=chapter.text;
  chapter.history=chapter.history||[];
  chapter.history.push({revision:chapter.revision||1,text:oldText,changedAt:new Date().toISOString(),mode:"manual"});
  chapter.revision=(chapter.revision||1)+1;
  chapter.text=String(textValue??"").trim();
  chapter.paragraphs=paragraphs(chapter.text).map((text,index)=>({id:chapter.paragraphs?.[index]?.id||uid("PAR"),text,beatNumbers:chapter.paragraphs?.[index]?.beatNumbers||chapter.sourceBeatNumbers||[],kind:"manual"}));
  manuscript.scenes=deriveScenes(plan,manuscript.bookChapters,manuscript.scenes);
  return recalc(manuscript,plan);
}

function updateScene(manuscript,plan,sceneId,textValue){
  const scene=manuscript.scenes.find(item=>item.id===sceneId);
  if(!scene)return manuscript;
  scene.history=scene.history||[];
  scene.history.push({revision:scene.revision||1,text:scene.text,changedAt:new Date().toISOString(),mode:"manual"});
  scene.revision=(scene.revision||1)+1;
  scene.text=String(textValue??"").trim();
  const chapterScenes=manuscript.scenes.filter(item=>item.chapterId===scene.chapterId).sort((a,b)=>a.sceneNumber-b.sceneNumber);
  const chapter=manuscript.bookChapters.find(item=>item.chapterId===scene.chapterId);
  if(chapter){
    chapter.text=chapterScenes.map(item=>item.text).join("\n\n");
    chapter.paragraphs=paragraphs(chapter.text).map((text,index)=>({id:uid("PAR"),text,beatNumbers:chapter.sourceBeatNumbers||[],kind:"sceneEdit"}));
    chapter.revision=(chapter.revision||1)+1;
  }
  return recalc(manuscript,plan);
}

function rewriteChapter(plan,manuscript,chapterId,mode="literary"){
  const index=(plan.chapters||[]).findIndex(chapter=>chapter.id===chapterId);
  if(index<0)return manuscript;
  const current=manuscript.bookChapters.find(chapter=>chapter.chapterId===chapterId);
  const settings={...manuscript.settings};
  if(mode==="dialogue")settings.dialogueLevel="Viel";
  if(mode==="vivid")settings.voice="Ruhig und poetisch";
  if(mode==="concise")settings.sceneLength="Kurz";
  if(mode==="deep")settings.sceneLength="Ausführlich";
  if(mode==="exciting")settings.voice="Spannend und direkt";
  const rewritten=writeChapter(plan,plan.chapters[index],index,settings,(current?.variation||0)+1);
  rewritten.history=[...(current?.history||[]),{revision:current?.revision||1,text:current?.text||"",changedAt:new Date().toISOString(),mode}];
  rewritten.revision=(current?.revision||1)+1;
  return replaceChapter(manuscript,plan,chapterId,rewritten);
}

function rewrite(plan,manuscript,sceneId,mode="literary"){
  const scene=manuscript.scenes.find(item=>item.id===sceneId);
  return scene?rewriteChapter(plan,manuscript,scene.chapterId,mode):manuscript;
}

function upgrade(manuscript,plan){
  manuscript.settings={...defaults(plan),...(manuscript.settings||{})};
  manuscript.chapters=Array.isArray(manuscript.chapters)?manuscript.chapters:(plan.chapters||[]).map(chapter=>({...chapter}));
  manuscript.scenes=Array.isArray(manuscript.scenes)?manuscript.scenes:[];
  if(!Array.isArray(manuscript.bookChapters)||!manuscript.bookChapters.length){
    manuscript.bookChapters=manuscript.chapters.map(chapter=>{
      const source=manuscript.scenes.filter(scene=>scene.chapterId===chapter.id).sort((a,b)=>a.sceneNumber-b.sceneNumber);
      const textValue=source.map(scene=>scene.text).join("\n\n");
      return {id:chapter.id,chapterId:chapter.id,number:chapter.number,title:chapter.title,text:textValue,paragraphs:paragraphs(textValue).map(text=>({id:uid("PAR"),text,beatNumbers:[],kind:"legacy"})),wordCount:wordCount(textValue),revision:1,variation:0,sourceBeatNumbers:[]};
    });
  }
  manuscript.schemaVersion=manuscript.schemaVersion||"legacy";
  manuscript.continuityLedger=manuscript.continuityLedger||{openingSituation:clean(plan.storyTreatment?.openingSituation),storyQuestion:clean(plan.storyTreatment?.storyQuestion),motifRule:clean(plan.storyTreatment?.motif?.rule),characterArcs:[],unresolvedThreads:[]};
  manuscript.scenes=deriveScenes(plan,manuscript.bookChapters,manuscript.scenes);
  return recalc(manuscript,plan);
}

window.CAPS_ManuscriptEngine={defaults,generate,rewrite,rewriteChapter,recalc,upgrade,updateChapter,updateScene,composeFullText,deriveScenes};
})();
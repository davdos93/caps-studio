(function(){
"use strict";

const uid=prefix=>`${prefix}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const text=(value,fallback="")=>String(value??"").replace(/\s+/g," ").trim()||fallback;
const list=value=>Array.isArray(value)?value.map(item=>text(item)).filter(Boolean):String(value??"").split(/[,\n]/).map(item=>text(item)).filter(Boolean);
const words=value=>text(value).split(/\s+/).filter(Boolean).length;
const paragraphs=value=>String(value??"").split(/\n\s*\n/).map(item=>text(item)).filter(Boolean);
const hash=value=>[...String(value??"")].reduce((sum,char)=>((sum<<5)-sum)+char.charCodeAt(0)|0,0);
const pick=(items,seed)=>items[Math.abs(seed)%items.length];
const cap=value=>{const clean=text(value);return clean?clean.charAt(0).toUpperCase()+clean.slice(1):""};
const lower=value=>{const clean=text(value);return clean?clean.charAt(0).toLowerCase()+clean.slice(1):""};
const sentence=value=>{const clean=cap(value);return !clean?"":/[.!?…]$/.test(clean)?clean:`${clean}.`};
const unique=values=>values.filter((value,index,array)=>value&&array.indexOf(value)===index);
const normalizedPhase=(index,total)=>Math.round(index*24/Math.max(1,total-1));

function defaults(plan){
  const age=text(plan?.characters?.[0]?.age||plan?.storyBible?.audience);
  return {
    readingLevel:/3|4|5/.test(age)?"3–6 Jahre":"6–9 Jahre",
    voice:"Warm und literarisch",
    perspective:"Personale Erzählweise",
    dialogueLevel:"Ausgewogen",
    sceneLength:"Ausführlich",
    literaryDepth:"Hoch",
    themeDelivery:"Durch Entscheidungen und Konsequenzen",
    refrain:"",
    continuity:"Stark",
    paragraphRhythm:"Abwechslungsreich"
  };
}

function context(plan){
  const characters=plan.characters||[];
  const hero=characters[0]||{name:"die Hauptfigur",strengths:[],challenge:"",development:"",description:"",relationship:""};
  const ally=characters[1]||hero;
  const guide=characters[2]||ally;
  const profile=plan.storyBible?.psychologicalProfile||{};
  const analysis=plan.storyBible?.backgroundAnalysis||{};
  const world=plan.worlds?.[0]||{name:"der Welt der Geschichte",locations:[]};
  const bible=plan.storyBible||{};
  return {characters,hero,ally,guide,profile,analysis,world,bible};
}

function motifFor(ctx){
  const source=`${ctx.analysis.category||""} ${ctx.profile.topic||""}`.toLowerCase();
  if(/trennung|abschied|übergang/.test(source))return {name:"Rückkehrlicht",object:"eine kleine Laterne mit einem ruhigen Licht",signal:"ein Licht, das im gleichen Rhythmus heller und dunkler wurde",obstacle:"eine Reihe von Türen, die sich nur öffneten, wenn man den nächsten Übergang kannte",safe:"eine Bank unter einem silbernen Baum",climax:"das Rückkehrlicht durch die letzte Tür tragen",sound:"ein leises Glöckchen"};
  if(/wut|starke gefühle|frust/.test(source))return {name:"Sturmfeder",object:"eine rotgoldene Feder, die bei starker Anspannung vibrierte",signal:"warme Funken, die über den Boden liefen",obstacle:"ein Wind, der auf hastige Bewegungen mit noch stärkeren Böen antwortete",safe:"eine windstille Mulde zwischen hohen Gräsern",climax:"den Sturm umlenken, ohne ihn einzusperren",sound:"ein tiefes Rauschen"};
  if(/angst|vermeidung/.test(source))return {name:"Wegstein",object:"ein glatter Stein mit einer schmalen leuchtenden Linie",signal:"eine Spur aus matten Punkten",obstacle:"ein Tor, das aus der Ferne größer wirkte als aus der Nähe",safe:"eine geschützte Nische im Felsen",climax:"den Wegstein selbst bis über die Schwelle tragen",sound:"ein fernes Klopfen"};
  if(/geschwister|eifersucht|teilen/.test(source))return {name:"Sternenkompass",object:"ein Kompass aus zwei verschiedenfarbigen Hälften",signal:"zwei Lichtstrahlen, die nie allein denselben Weg fanden",obstacle:"ein Pfad, der sich teilte, sobald eine Figur allein bestimmen wollte",safe:"eine runde Insel mit zwei gleich großen Sitzsteinen",climax:"beide Kompasshälften gleichzeitig ausrichten",sound:"zwei Töne, die erst zusammen eine Melodie ergaben"};
  if(/selbstvertrauen|fehler|leistungsdruck/.test(source))return {name:"unperfekter Schlüssel",object:"ein schiefer kleiner Schlüssel mit sichtbaren Kerben",signal:"ein Schloss, das auf keinen glatten Schlüssel reagierte",obstacle:"eine Werkstatt, in der jeder Fehlversuch eine neue Spur hinterließ",safe:"ein Tisch voller angefangener Dinge",climax:"die Kerben mehrerer Versuche zu einem passenden Schlüssel verbinden",sound:"ein helles Klicken"};
  if(/ausgrenzung|soziale unsicherheit/.test(source))return {name:"Platzlied",object:"eine kleine Klangschale mit mehreren unterschiedlichen Tönen",signal:"ein einzelner Ton, der zwischen den Häusern verloren ging",obstacle:"ein Platz, auf dem nur die lautesten Stimmen gehört wurden",safe:"eine ruhige Seitengasse mit offenen Fenstern",climax:"die fehlenden Stimmen hörbar machen, ohne sie gleich klingen zu lassen",sound:"eine unfertige Melodie"};
  if(/trauer|verlust|vermissen/.test(source))return {name:"Erinnerungslicht",object:"ein warmes Licht in einem durchsichtigen Stein",signal:"kleine Lichter, die an vertrauten Orten stehen blieben",obstacle:"ein Nebel, der Wege verdeckte, aber Erinnerungen nicht auslöschte",safe:"ein Garten mit stillen Leuchtblumen",climax:"jedem Licht einen eigenen Platz geben",sound:"ein ruhiger, vertrauter Klang"};
  if(/schlafen|nächtliche sicherheit/.test(source))return {name:"Ruheklang",object:"eine kleine Muschel, in der ein langsamer Ton wohnte",signal:"ein Klang, der immer leiser wurde, ohne zu verschwinden",obstacle:"ein Weg, der bei jedem neuen Gedanken eine zusätzliche Kurve bildete",safe:"eine weiche Lichtung unter dunklem Himmel",climax:"die verstreuten Ruheklänge in die richtige Reihenfolge bringen",sound:"ein langsames Summen"};
  if(/veränderung|neue situation/.test(source))return {name:"Wanderkarte",object:"eine Karte, auf der alte und neue Wege gleichzeitig sichtbar waren",signal:"eine Linie, die sich weiterzeichnete, sobald jemand stehen blieb und genau hinsah",obstacle:"Kreuzungen ohne fertige Wegweiser",safe:"ein kleiner Platz, an dem Vertrautes abgelegt und wieder mitgenommen werden konnte",climax:"eine eigene Verbindung zwischen altem und neuem Weg einzeichnen",sound:"das Rascheln von Papier"};
  return {name:"leises Zeichen",object:"ein kleines Zeichen, das auf ehrliche Entscheidungen reagierte",signal:"ein schwaches Leuchten am Rand des Weges",obstacle:"ein Pfad, der auf Hast mit neuen Umwegen antwortete",safe:"ein geschützter Platz mit weitem Blick",climax:"das Zeichen durch die letzte Prüfung tragen",sound:"ein kaum hörbarer heller Ton"};
}

function characterVoice(character,role){
  const strengths=list(character?.strengths);
  const description=text(character?.description).toLowerCase();
  if(/lustig|humor|witz/.test(description)||strengths.some(value=>/lustig|witzig|fröhlich/.test(value.toLowerCase())))return "humorous";
  if(/ruhig|geduldig|aufmerksam/.test(description)||strengths.some(value=>/ruhig|geduldig|aufmerksam/.test(value.toLowerCase())))return "calm";
  if(/mutig|direkt|entschlossen/.test(description)||strengths.some(value=>/mutig|direkt|entschlossen/.test(value.toLowerCase())))return "direct";
  return role;
}

function sensory(location,motif,seed,voice){
  const openings=[
    `In ${location} roch die Luft nach feuchtem Holz und kaltem Stein. Zwischen den Geräuschen lag ${motif.sound}, so fein, dass man still werden musste, um es nicht zu verlieren.`,
    `Das Licht über ${location} war unruhig. Es glitt über den Boden, blieb an kleinen Unebenheiten hängen und ließ ${motif.object} für einen Moment heller erscheinen.`,
    `${location} wirkte aus der Nähe anders als aus der Ferne. Der Weg war schmaler, die Schatten weicher, und irgendwo bewegte sich etwas im gleichen Takt wie ${motif.sound}.`,
    `Unter den Füßen wechselte der Boden von fest zu federnd. Aus ${location} kam ein Geruch nach Erde, Blättern und etwas Neuem, das noch keinen Namen hatte.`,
    `Über ${location} stand eine eigenartige Stille. Sie war nicht leer; in ihr lagen das Rascheln kleiner Bewegungen und ${motif.sound}.`
  ];
  let paragraph=pick(openings,seed);
  if(voice==="Ruhig und poetisch")paragraph+=` Die Welt schien für einen Atemzug zu warten, als gäbe sie den Figuren Zeit, in ihr anzukommen.`;
  if(voice==="Lebendig und humorvoll")paragraph+=` Selbst ein krummer Stein am Rand sah aus, als wolle er gleich ungefragt einen Rat geben.`;
  if(voice==="Spannend und direkt")paragraph+=` Dann brach ein kurzer Laut durch die Ruhe, und alle Köpfe fuhren herum.`;
  return paragraph;
}

function bodyMoment(ctx,phase,seed){
  const H=ctx.hero.name;
  const feelings=list(ctx.profile.feelings);
  const feeling=feelings.length?pick(feelings,seed):text(ctx.profile.topic,"Unsicherheit");
  const moments=[
    `${H} bemerkte das Gefühl zuerst an den Händen. Die Finger wollten sich festhalten, obwohl noch gar nicht klar war, woran.`,
    `Unter ${H}s Rippen wurde der Atem kleiner. Das Gefühl war nicht plötzlich gekommen; es hatte sich leise mit jedem Schritt aufgebaut.`,
    `${H}s Schultern zogen sich nach oben, und der Blick suchte sofort nach dem schnellsten Rückweg.`,
    `Im Bauch entstand ein Knoten, der bei jedem neuen Geräusch ein wenig fester wurde.`,
    `${H} hörte die anderen sprechen, doch die Worte kamen nur noch einzeln an, weil das Gefühl so viel Platz einnahm.`
  ];
  const ending=phase<8?` ${feeling} fühlte sich in diesem Augenblick größer an als die Aufgabe selbst.`:` ${H} kannte dieses Zeichen inzwischen und wusste, dass es eine Information war, kein Befehl.`;
  return pick(moments,seed)+ending;
}

function concreteBeat(phase,ctx,motif,scene,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name;
  const beats={
    0:`${H} beschäftigte sich mit einer vertrauten Kleinigkeit, während ${A} auf eine andere Weise an dieselbe Sache heranging. Als ${motif.signal} auftauchte, bemerkten beide es fast gleichzeitig – aber aus verschiedenen Gründen.`,
    1:`Das Signal führte zu ${motif.object}. Es lag nicht einfach da, sondern reagierte auf die Nähe der Figuren, als prüfe es, wer wirklich hinsah.`,
    2:`Bevor jemand losging, legte ${H} fest, was mitgenommen werden sollte. ${A} ergänzte etwas, das ${H} beinahe übersehen hätte, und dadurch wurde aus einem hastigen Aufbruch ein gemeinsamer Plan.`,
    3:`Am Übergang nach ${ctx.world.name} blieb ${H} stehen. Der Rückweg war sichtbar, der neue Weg ebenfalls; gerade deshalb musste die Entscheidung wirklich von ${H} kommen.`,
    4:`${G} zeigte keine fertige Lösung. Stattdessen ließ ${G} ${motif.object} nahe an ${motif.obstacle} kommen, sodass die Regel der Welt durch ihre Wirkung verständlich wurde.`,
    5:`${H} versuchte, das Hindernis mit Tempo und Entschlossenheit zu überwinden. Zunächst schien es zu funktionieren, doch ${motif.obstacle} antwortete auf die Hast und veränderte den Weg.`,
    6:`Der misslungene Versuch hatte eine konkrete Folge: Ein Teil des Weges schloss sich, und ${A} verlor für einen Moment den sicheren Stand. ${H} griff ein, aber die Gruppe kam nicht weiter.`,
    7:`Sie erreichten ${motif.safe}. Dort musste niemand sofort entscheiden. ${H} konnte das Gefühl wahrnehmen, ohne gleichzeitig gegen das nächste Hindernis anzukämpfen.`,
    8:`${A} erzählte, was aus der eigenen Position sichtbar gewesen war. Erst als ${H} nicht mehr nach einer schnellen Antwort suchte, passten die Beobachtungen der beiden zusammen.`,
    9:`Die Gruppe verwandelte die hilfreiche Idee in einen sichtbaren Ablauf: erst anhalten, dann prüfen, dann nur den nächsten Teil des Weges wählen. ${motif.object} diente dabei als Erinnerung, nicht als Zauberlösung.`,
    10:`Bei einer kleineren Prüfung setzte ${H} den neuen Ablauf zum ersten Mal selbst ein. Das Hindernis blieb bestehen, doch seine Wirkung veränderte sich, weil ${H} nicht mehr blind darauf reagierte.`,
    11:`Kurz darauf wurde der Weg schwieriger. Ein unerwartetes Geräusch, eine engere Stelle und die Müdigkeit reichten aus, damit die alte Reaktion schneller zurückkehrte als gedacht.`,
    12:`${H} und ${A} stritten nicht darüber, wer ein guter oder schlechter Mensch war. Sie stritten darüber, was gerade geschehen war, wer sich übergangen gefühlt hatte und welche Hilfe tatsächlich gebraucht wurde.`,
    13:`Der neue Plan bekam klare Aufgaben. ${H} übernahm den Teil, der wirklich zur eigenen Entwicklung gehörte; ${A} und ${G} sicherten den Raum, ohne den entscheidenden Schritt vorwegzunehmen.`,
    14:`Bevor sie die große Prüfung erreichten, probierten sie den Ablauf an einer kleinen Stelle. Ein Fehler blieb folgenlos genug, um daraus zu lernen, und wichtig genug, um nicht übergangen zu werden.`,
    15:`Als ${H} auf ${motif.object} sah, wurde etwas deutlich: Die eigene Stärke war nicht verschwunden. Sie zeigte sich nur anders, sobald Kontrolle, Hilfe und Vertrauen nicht mehr dasselbe bedeuteten.`,
    16:`Vor ihnen lag nun ${motif.obstacle} in seiner schwierigsten Form. Der Weg verlangte Aufmerksamkeit, Geduld und eine Entscheidung, die niemand außer ${H} treffen konnte.`,
    17:`${A} und ${G} stellten sich so auf, dass ${H} weder allein noch eingekreist war. Jede Figur nannte genau, welche Hilfe sie geben konnte – und welche nicht.`,
    18:`${H} wartete, bis das erste Drängen etwas leiser wurde. Dann begann ${H} mit dem vereinbarten Ablauf und entschied erst danach, wie weit der nächste Schritt reichen sollte.`,
    19:`Nun griffen die Aufgaben ineinander. ${A} hielt die Richtung, ${G} beobachtete die Veränderung des Hindernisses, und ${H} führte ${motif.object} dorthin, wo es gebraucht wurde.`,
    20:`Im entscheidenden Augenblick musste ${H} ${motif.climax}. Die Lösung entstand nicht durch einen plötzlichen Einfall, sondern aus allem, was die Gruppe zuvor beobachtet, verworfen und geübt hatte.`,
    21:`Als die Bewegung endete, blieb die Gruppe zunächst still. Der Körper brauchte länger als das Hindernis, um zu begreifen, dass die Gefahr vorüber war.`,
    22:`Der Erfolg wurde an konkreten Dingen sichtbar: Der Weg war offen, ${motif.object} hatte seinen Platz gefunden, und jede Figur konnte benennen, welchen eigenen Beitrag sie geleistet hatte.`,
    23:`Auf dem Rückweg wirkte ${ctx.world.name} vertrauter, aber nicht kleiner. ${H} nahm ${motif.object} nicht als Trophäe mit, sondern ein schlichtes Zeichen, das an den erprobten Ablauf erinnerte.`,
    24:`Im Alltag tauchte eine kleine Variante der ursprünglichen Situation auf. Das alte Gefühl meldete sich, doch diesmal erkannte ${H} es früh genug, um selbst eine andere Handlung zu wählen.`
  };
  return beats[phase]||beats[24];
}

function naturalDialogue(phase,ctx,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name;
  const allyVoice=characterVoice(ctx.ally,"ally");
  const guideVoice=characterVoice(ctx.guide,"guide");
  const pools={
    early:[
      `„Ich will erst wissen, was dahinter ist“, sagte ${H}. ${A} strich mit einem Finger über den Rand des Zeichens. „Dann schauen wir. Schauen ist noch nicht dasselbe wie hineingehen.“`,
      `${A} bemerkte ${H}s festen Griff. „Soll ich näher kommen oder lieber hier warten?“ ${H} brauchte einen Moment. „Näher. Aber nicht ziehen.“`,
      `„Vielleicht müssen wir gar nicht sofort entscheiden“, meinte ${G}. ${H} sah noch einmal zum Weg. „Nur den ersten Teil?“ – „Nur den, den du wirklich sehen kannst.“`
    ],
    validation:[
      `„Es ist noch da“, sagte ${H} und legte eine Hand an den Bauch. ${A} nickte. „Dann tun wir nicht so, als wäre es weg. Wir machen den Plan so, dass es mitkommen darf.“`,
      `${G} setzte sich auf Augenhöhe. „Was ist gerade schwer: der ganze Weg oder der nächste Schritt?“ ${H} sah hin. „Der ganze Weg in meinem Kopf.“ – „Dann brauchen wir im Moment nur einen kleinen Teil davon.“`,
      `„Ich möchte nicht, dass ihr es für mich macht“, sagte ${H}. „Aber ich will auch nicht allein sein.“ ${A} rückte ein Stück näher. „Das sind zwei verschiedene Dinge. Beides kann gehen.“`
    ],
    conflict:[
      `„Du hast gar nicht gewartet“, sagte ${A}. Die Stimme war nicht laut, aber sie zitterte. ${H} wollte widersprechen und merkte dabei, dass die Antwort schon fertig war, bevor ${A} ausgesprochen hatte.`,
      `„Ich dachte, ich helfe“, sagte ${A}. ${H} schüttelte den Kopf. „Du hast entschieden, bevor ich sagen konnte, was ich brauche.“ Einen Moment lang sagte niemand etwas.`,
      `„So kommen wir nicht weiter“, sagte ${H}. ${G} antwortete ruhig: „Das stimmt. Aber wir müssen zuerst verstehen, woran es lag – nicht, wer schuld ist.“`
    ],
    planning:[
      `„Du hältst den Weg frei“, sagte ${H} zu ${A}. „Und du sagst mir, wenn sich das Zeichen verändert“, wandte sich ${H} an ${G}. „Den Schritt mache ich selbst.“`,
      `${A} zählte die Aufgaben an den Fingern ab. „Eine nach der anderen.“ ${H} ergänzte: „Und wenn ich Stopp sage, bleiben wir stehen. Nicht weil wir aufgeben, sondern weil wir prüfen.“`,
      `„Welche Hilfe passt?“, fragte ${G}. ${H} sah von einer Figur zur anderen. „Bleibt sichtbar. Sagt mir, was ihr beobachtet. Aber lasst mich entscheiden.“`
    ],
    climax:[
      `„Jetzt nicht schneller“, sagte ${H}, mehr zu sich selbst als zu den anderen. ${A} antwortete nur: „Wir sind hier.“ Das reichte.`,
      `${G} hob die Hand, sagte aber nichts. ${H} sah das Zeichen, spürte das alte Drängen und entschied trotzdem: „Erst prüfen. Dann handeln.“`,
      `„Ich habe noch Angst“, sagte ${H}. Die Worte klangen nicht wie ein Geständnis. „Und ich gehe trotzdem bis zu dem Punkt, den ich gewählt habe.“`
    ],
    ending:[
      `„Ist es jetzt für immer leicht?“, fragte ${A}. ${H} dachte nach. „Nein. Aber ich weiß eher, was ich tun kann, wenn es wieder schwer wird.“`,
      `${G} wollte gerade loben, doch ${H} war schneller. „Ich weiß, was mein Teil war“, sagte ${H}. „Und ich weiß auch, was euer Teil war.“`,
      `„Das Gefühl war wieder da“, sagte ${H} später. ${A} lächelte. „Ja. Und diesmal war auch dein Plan da.“`
    ]
  };
  let pool=phase<6?pools.early:phase<10?pools.validation:phase<14?pools.conflict:phase<18?pools.planning:phase<22?pools.climax:pools.ending;
  let dialogue=pick(pool,seed);
  if(allyVoice==="humorous"&&phase<18)dialogue+=` ${A} verzog den Mund. „Und falls der Weg wieder Unsinn macht, darf ich ihm wenigstens eine sehr ernste Grimasse zeigen.“`;
  if(guideVoice==="calm"&&phase>=7&&phase<=18)dialogue+=` ${G} ließ danach genug Stille, damit die Antwort nicht nur schnell, sondern ehrlich werden konnte.`;
  return dialogue;
}

function causalConflict(phase,ctx,motif,scene,seed){
  const H=ctx.hero.name,A=ctx.ally.name;
  const conflict=text(scene.conflict);
  const reaction=text(ctx.profile.currentReaction,"die Situation schnell zu kontrollieren oder zu vermeiden");
  const variants=[
    `Weil ${H} sofort handeln wollte, blieb keine Zeit, ${A}s Beobachtung zu prüfen. Genau dadurch entstand das Problem, das der schnelle Versuch eigentlich verhindern sollte.`,
    `Das Hindernis war nicht nur äußerlich. Sobald ${H} versuchte, ${lower(reaction)}, wurde der Blick enger, und ein wichtiger Teil der Umgebung verschwand aus der Aufmerksamkeit.`,
    `Zunächst sah es aus, als läge die Schwierigkeit nur im Weg. Doch als ${A} auf ein übersehenes Detail zeigte, wurde klar, dass auch die Art der Entscheidung den Verlauf veränderte.`,
    `Je stärker ${H} gegen das Gefühl ankämpfte, desto weniger Kraft blieb für die eigentliche Aufgabe. Erst dadurch bekam ${motif.obstacle} die Oberhand.`
  ];
  let paragraph=pick(variants,seed);
  if(conflict)paragraph+=` ${sentence(conflict)}`;
  return paragraph;
}

function strategyInAction(phase,ctx,motif,seed){
  const H=ctx.hero.name;
  const strategy=text(ctx.profile.copingStrategy,"innehalten, die Situation prüfen und einen kleinen nächsten Schritt wählen");
  const fragments=unique(strategy.split(/,| und | danach | dann /i).map(item=>text(item)).filter(item=>item.length>4));
  const chosen=fragments.length?pick(fragments,seed):"einen kleinen nächsten Schritt wählen";
  const variants=[
    `${H} machte aus der großen Aufgabe etwas Überschaubares. Zuerst blieb ${H} stehen, dann richtete sich die Aufmerksamkeit auf ${lower(chosen)}. Erst danach fiel die Entscheidung über die Bewegung.`,
    `Der neue Ablauf war unscheinbar, aber genau darin lag seine Stärke: ${sentence(chosen)} ${H} prüfte, was sich verändert hatte, bevor der nächste Teil begann.`,
    `${H} versuchte nicht, das Gefühl fortzuschicken. Stattdessen bekam es einen Platz neben der Aufgabe, während ${H} ${lower(chosen)} konnte.`,
    `Diesmal lag zwischen Reiz und Reaktion ein kleiner Zwischenraum. ${H} nutzte ihn, um ${lower(chosen)}, und dadurch wurde aus einem Reflex eine eigene Wahl.`
  ];
  if(phase<8)return "";
  return pick(variants,seed);
}

function consequence(phase,ctx,motif,scene,seed){
  const H=ctx.hero.name,A=ctx.ally.name;
  const result=text(scene.result);
  const variants=[
    `Die Wirkung zeigte sich nicht in einem großen Zauber, sondern in der nächsten konkreten Veränderung: Der Weg blieb offen, ${motif.object} wurde ruhiger, und ${H} konnte ${A} wieder deutlich ansehen.`,
    `Nichts war plötzlich mühelos. Doch weil ${H} anders gehandelt hatte, musste die Gruppe nicht an denselben Ausgangspunkt zurückkehren.`,
    `Der Erfolg gehörte nicht nur dem Ergebnis. Er lag auch darin, dass ${H} die Entscheidung bemerkt, ausgesprochen und selbst ausgeführt hatte.`,
    `Die anderen lobten nicht einfach den Mut. Sie benannten, was sie gesehen hatten: das Innehalten, die klare Bitte und den Schritt, der wirklich von ${H} gekommen war.`
  ];
  let paragraph=pick(variants,seed);
  if(result)paragraph+=` ${sentence(result)}`;
  return paragraph;
}

function continuityOpening(previousMeta,scene,ctx,motif,seed,isChapterStart){
  const H=ctx.hero.name;
  if(!previousMeta){
    return `${H} hätte später nicht sagen können, wann der gewöhnliche Tag seine Richtung änderte. Am Anfang gab es nur eine vertraute Beschäftigung, die Nähe der anderen und ${motif.signal}, das für einen Moment nicht zu allem Übrigen passte.`;
  }
  const carried=text(previousMeta.carry,`die Folge der letzten Entscheidung`);
  const openings=[
    `${carried} ging mit ihnen weiter, als sie ${scene.location} erreichten. Niemand musste erklären, warum die Gruppe langsamer ging als zuvor; man hörte es an den Schritten.`,
    `Der Weg nach ${scene.location} begann mit dem, was die vorige Szene hinterlassen hatte: ${lower(carried)}. ${H} trug diese Erfahrung nicht wie eine Antwort, sondern wie eine noch offene Frage.`,
    `Als ${scene.location} vor ihnen auftauchte, war ${lower(carried)} noch nicht abgeschlossen. Gerade deshalb sah ${H} die neue Situation anders an als zu Beginn des Abenteuers.`,
    `Sie verließen den vorherigen Ort, aber nicht seine Wirkung. ${cap(carried)} bestimmte, worauf ${H} diesmal zuerst achtete.`
  ];
  let opening=pick(openings,seed);
  if(isChapterStart)opening+=` Ein neues Kapitel des Weges begann, doch es begann nicht bei null.`;
  return opening;
}

function closingHook(phase,nextScene,ctx,motif,seed){
  const H=ctx.hero.name;
  if(!nextScene){
    return `Später tauchte das vertraute Gefühl in einer kleinen Alltagssituation wieder auf. ${H} erkannte es, wartete einen Atemzug und wählte selbst, was als Nächstes geschehen sollte. Das Problem war nicht aus der Welt verschwunden; aber ${H} war ihm nicht mehr auf dieselbe Weise ausgeliefert.`;
  }
  const hooks=[
    `Bevor jemand den Erfolg ganz verstehen konnte, veränderte sich ${motif.object}. Sein Licht wies nicht zurück, sondern weiter – nach ${nextScene.location}.`,
    `Aus Richtung ${nextScene.location} kam ${motif.sound}. Diesmal hörte ${H} darin nicht nur eine Warnung, sondern auch eine Frage.`,
    `Am Rand des Weges erschien ein neues Zeichen. Es passte zu dem, was sie gerade gelernt hatten, und stellte es zugleich auf eine schwierigere Probe.`,
    `${H} wollte gerade etwas sagen, als der Boden vor ihnen eine neue Linie zeichnete. Sie führte direkt nach ${nextScene.location}.`,
    `Der Weg blieb nur wenige Atemzüge ruhig. Dann zeigte sich, dass die nächste Prüfung nicht größer, aber persönlicher werden würde.`
  ];
  return pick(hooks,seed);
}

function targetParagraphCount(settings,mode){
  if(mode==="concise"||settings.sceneLength==="Kurz")return 5;
  if(settings.sceneLength==="Mittel")return 6;
  return settings.literaryDepth==="Hoch"?8:7;
}

function assembleScene(plan,planScene,index,total,settings,variation,mode,previousMeta,nextPlanScene,chapterStart){
  const ctx=context(plan),motif=motifFor(ctx),phase=normalizedPhase(index,total);
  const seed=hash(`${planScene.id}|${variation}|${mode}|${settings.voice}`);
  const blocks=[];
  blocks.push(continuityOpening(previousMeta,planScene,ctx,motif,seed,chapterStart));
  blocks.push(`${sensory(planScene.location,motif,seed+1,settings.voice)} ${concreteBeat(phase,ctx,motif,planScene,seed+2)}`);
  if([1,3,5,7,11,16,18,20,24].includes(phase)||mode==="deep")blocks.push(bodyMoment(ctx,phase,seed+3));
  if(phase>=4&&phase<=20)blocks.push(causalConflict(phase,ctx,motif,planScene,seed+4));
  if(settings.dialogueLevel!=="Wenig"||[2,7,8,12,13,17,18,22,24].includes(phase))blocks.push(naturalDialogue(phase,ctx,seed+5));
  const strategy=strategyInAction(phase,ctx,motif,seed+6);
  if(strategy)blocks.push(strategy);
  blocks.push(consequence(phase,ctx,motif,planScene,seed+7));
  blocks.push(closingHook(phase,nextPlanScene,ctx,motif,seed+8));

  if(mode==="dialogue")blocks.splice(Math.min(4,blocks.length-1),0,naturalDialogue(Math.min(24,phase+1),ctx,seed+30));
  if(mode==="vivid")blocks.splice(2,0,`${sensory(planScene.location,motif,seed+31,"Ruhig und poetisch")} ${ctx.hero.name} nahm die Einzelheiten nicht als Dekoration wahr; sie beeinflussten, welchen Weg die Hauptfigur für sicher, möglich oder zu groß hielt.`);
  if(mode==="deep")blocks.splice(blocks.length-1,0,`${ctx.hero.name} verstand die Veränderung noch nicht vollständig. Aber der Unterschied zwischen einem Gefühl, das gesehen wurde, und einem Gefühl, das alles bestimmen musste, war nun körperlich spürbar.`);
  if(mode==="exciting")blocks.splice(Math.min(4,blocks.length-1),0,`Noch bevor der Plan ganz ausgesprochen war, setzte sich das Hindernis in Bewegung. Der sichere Abstand schrumpfte, und jede Figur musste entscheiden, ob sie in das alte Muster zurückfiel oder bei der vereinbarten Aufgabe blieb.`);
  if(settings.dialogueLevel==="Viel"&&mode!=="dialogue")blocks.splice(Math.min(5,blocks.length-1),0,naturalDialogue(Math.max(0,phase-1),ctx,seed+32));
  if(settings.refrain&&[4,9,14,19,24].includes(phase))blocks.splice(blocks.length-1,0,sentence(settings.refrain));

  let wanted=targetParagraphCount(settings,mode);
  let selected=blocks.filter(Boolean);
  if(selected.length>wanted){
    const keep=[selected[0],selected[1]];
    const middle=selected.slice(2,-2);
    const step=Math.max(1,Math.ceil(middle.length/Math.max(1,wanted-4)));
    for(let i=0;i<middle.length&&keep.length<wanted-2;i+=step)keep.push(middle[i]);
    keep.push(selected.at(-2),selected.at(-1));
    selected=keep;
  }
  return {
    text:selected.join("\n\n"),
    meta:{
      phase,motif:motif.name,
      carry:phase>=20?`der bewusste Erfolg aus „${planScene.title}“`:phase>=10?`die erprobte Veränderung aus „${planScene.title}“`:`die unmittelbare Folge von „${planScene.title}“`,
      openingAnchor:previousMeta?.carry||"Beginn der Geschichte",
      consequence:text(planScene.result),
      unresolved:nextPlanScene?nextPlanScene.title:"Alltagstransfer",
      chapterStart:Boolean(chapterStart)
    }
  };
}

function influence(plan,planScene){
  const ctx=context(plan);
  const focus=(plan.characters||[]).find(character=>character.name===planScene.focusCharacter)||ctx.hero;
  return {
    focusCharacter:focus.name,
    focusChallenge:text(focus.challenge,ctx.profile.topic),
    focusDevelopment:text(focus.development,ctx.profile.desiredDevelopment),
    relationship:text(focus.relationship||ctx.ally.relationship,`${ctx.ally.name} unterstützt, ohne die Lösung zu übernehmen.`),
    themeAction:text(planScene.copingStrategy||ctx.profile.copingStrategy),
    consequence:text(planScene.result),
    psychologicalFunction:text(planScene.psychologicalFunction),
    childFeeling:text(planScene.emotionalState),
    desiredSkill:text(ctx.profile.desiredDevelopment)
  };
}

function sentenceStarts(value){
  return text(value).split(/(?<=[.!?])\s+/).map(item=>item.split(/\s+/).slice(0,3).join(" ").toLowerCase()).filter(Boolean);
}

function quality(scene,plan,previousScene=null){
  const raw=String(scene.text??"");
  const value=text(raw),count=words(value),paras=paragraphs(raw),starts=sentenceStarts(value);
  const uniqueStarts=new Set(starts).size;
  const connectors=(value.match(/\b(weil|deshalb|dadurch|während|obwohl|doch|sodass|bevor|erst als|gerade deshalb)\b/gi)||[]).length;
  const dialogue=(value.match(/„/g)||[]).length>=2;
  const ctx=context(plan);
  const contextTerms=[ctx.hero.name,scene.influence?.focusCharacter,scene.narrativeMeta?.motif].filter(Boolean);
  const contextInfluence=contextTerms.every(term=>value.toLowerCase().includes(String(term).toLowerCase()));
  const paragraphLengths=paras.map(words);
  const lengthVariation=new Set(paragraphLengths.map(n=>Math.round(n/15))).size>=2;
  const noBadPatterns=!/(plötzlich war alles gut|musste nur mutig sein|es fühlte sich .* an\.\s*es fühlte sich|dann sagte .* dann sagte|die botschaft war|die moral)/i.test(value);
  const continuity=!previousScene||Boolean(scene.narrativeMeta?.openingAnchor)&&value.toLowerCase().includes(text(scene.narrativeMeta.openingAnchor).split(/\s+/).slice(-2).join(" ").toLowerCase())||/ging mit ihnen weiter|nicht bei null|verließen den vorherigen ort|vorige szene|letzte entscheidung/i.test(value);
  const causalFlow=connectors>=1||Number(scene.narrativeMeta?.phase)<4||Number(scene.narrativeMeta?.phase)>22;
  const scoreParts=[count>=150,paras.length>=5,uniqueStarts>=Math.max(7,Math.floor(starts.length*.65)),causalFlow,dialogue,contextInfluence,lengthVariation,noBadPatterns,Boolean(scene.influence?.psychologicalFunction),Boolean(scene.narrativeMeta?.consequence),continuity];
  return {
    score:Math.round(scoreParts.filter(Boolean).length/scoreParts.length*100),
    ageAppropriate:!(/\b(dementsprechend|nichtsdestotrotz|infolgedessen|psychologisch|intervention)\b/i.test(value)),
    detailed:count>=150,
    narrativeFlow:causalFlow&&paras.length>=5,
    contextInfluence,
    themeInAction:Boolean(scene.influence?.themeAction)&&!(/die botschaft|die moral/i.test(value)),
    noTemplatePhrases:noBadPatterns,
    variedSentences:uniqueStarts>=Math.max(7,Math.floor(starts.length*.65)),
    psychologicalFit:Boolean(scene.influence?.psychologicalFunction),
    coherent:Boolean(scene.narrativeMeta?.consequence),
    continuity,
    paragraphCohesion:lengthVariation&&paras.length>=5,
    naturalDialogue:dialogue
  };
}

function recalc(manuscript,plan){
  manuscript.scenes.forEach((scene,index)=>{
    scene.wordCount=words(scene.text);
    scene.quality=quality(scene,plan,manuscript.scenes[index-1]||null);
  });
  const total=manuscript.scenes.length||1;
  manuscript.progress=Math.round(manuscript.scenes.filter(scene=>scene.status==="approved").length/total*100);
  manuscript.qualityScore=Math.round(manuscript.scenes.reduce((sum,scene)=>sum+(scene.quality?.score||0),0)/total);
  manuscript.updatedAt=new Date().toISOString();
  return manuscript;
}

function generate(plan,settings){
  const cfg={...defaults(plan),...(settings||{})};
  const chapters=(plan.chapters||[]).map(chapter=>({...chapter}));
  const planScenes=plan.scenes||[];
  const scenes=[];
  let previousMeta=null,previousChapter=null;
  planScenes.forEach((planScene,index)=>{
    const chapterStart=previousChapter!==planScene.chapterId;
    const generated=assembleScene(plan,planScene,index,planScenes.length,cfg,0,"literary",previousMeta,planScenes[index+1]||null,chapterStart);
    scenes.push({
      id:uid("MS"),sceneId:planScene.id,chapterId:planScene.chapterId,chapterNumber:planScene.chapterNumber,
      sceneNumber:planScene.number,title:planScene.title,text:generated.text,wordCount:words(generated.text),
      status:"draft",revision:1,variation:0,history:[],influence:influence(plan,planScene),narrativeMeta:generated.meta,quality:null
    });
    previousMeta=generated.meta;previousChapter=planScene.chapterId;
  });
  const manuscript={schemaVersion:"3.0",generatedAt:new Date().toISOString(),generator:"CAPS Coherent Narrative Writer 3.0",settings:cfg,chapters,scenes,progress:0,qualityScore:0};
  return recalc(manuscript,plan);
}

function regenerateAt(plan,manuscript,index,mode){
  const scene=manuscript.scenes[index];
  const planScenes=plan.scenes||[];
  const planIndex=planScenes.findIndex(item=>item.id===scene.sceneId);
  const planScene=planScenes[planIndex];
  if(!planScene)return;
  const previousMeta=index>0?manuscript.scenes[index-1].narrativeMeta:null;
  const previousChapter=index>0?manuscript.scenes[index-1].chapterId:null;
  const chapterStart=previousChapter!==scene.chapterId;
  const generated=assembleScene(plan,planScene,planIndex,planScenes.length,manuscript.settings,(scene.variation||0)+1,mode,previousMeta,planScenes[planIndex+1]||null,chapterStart);
  scene.history=scene.history||[];
  scene.history.push({revision:scene.revision,text:scene.text,changedAt:new Date().toISOString(),mode});
  scene.variation=(scene.variation||0)+1;scene.revision=(scene.revision||1)+1;
  scene.text=generated.text;scene.narrativeMeta=generated.meta;scene.influence=influence(plan,planScene);
}

function rewrite(plan,manuscript,sceneId,mode="literary"){
  const index=manuscript.scenes.findIndex(scene=>scene.id===sceneId);
  if(index<0)return manuscript;
  regenerateAt(plan,manuscript,index,mode);
  if(index+1<manuscript.scenes.length){
    const next=manuscript.scenes[index+1];
    next.narrativeMeta={...(next.narrativeMeta||{}),openingAnchor:manuscript.scenes[index].narrativeMeta?.carry||next.narrativeMeta?.openingAnchor};
  }
  return recalc(manuscript,plan);
}

function rewriteChapter(plan,manuscript,chapterId,mode="literary"){
  manuscript.scenes.forEach((scene,index)=>{if(scene.chapterId===chapterId)regenerateAt(plan,manuscript,index,mode)});
  return recalc(manuscript,plan);
}

function upgrade(manuscript,plan){
  manuscript.settings={...defaults(plan),...(manuscript.settings||{})};
  manuscript.chapters=Array.isArray(manuscript.chapters)?manuscript.chapters:(plan.chapters||[]).map(chapter=>({...chapter}));
  manuscript.scenes=Array.isArray(manuscript.scenes)?manuscript.scenes:[];
  manuscript.scenes.forEach((scene,index)=>{
    const planScene=(plan.scenes||[]).find(item=>item.id===scene.sceneId)||{};
    scene.history=Array.isArray(scene.history)?scene.history:[];
    scene.revision=Number(scene.revision)||1;scene.variation=Number(scene.variation)||0;scene.status=scene.status||"draft";
    scene.influence={...influence(plan,planScene),...(scene.influence||{})};
    scene.narrativeMeta=scene.narrativeMeta||{
      phase:normalizedPhase(index,manuscript.scenes.length),motif:motifFor(context(plan)).name,
      carry:`die Folge von „${scene.title}“`,openingAnchor:index?`die Folge von „${manuscript.scenes[index-1].title}“`:"Beginn der Geschichte",
      consequence:text(planScene.result),unresolved:manuscript.scenes[index+1]?.title||"Alltagstransfer"
    };
  });
  manuscript.schemaVersion=manuscript.schemaVersion||"3.0";
  return recalc(manuscript,plan);
}

window.CAPS_ManuscriptEngine={defaults,generate,rewrite,rewriteChapter,recalc,upgrade};
})();
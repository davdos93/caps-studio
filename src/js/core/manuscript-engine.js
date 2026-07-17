(function(){
"use strict";

const uid=p=>`${p}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const clean=(v,f="")=>String(v??"").replace(/\s+/g," ").trim()||f;
const list=v=>Array.isArray(v)?v.map(x=>clean(x)).filter(Boolean):String(v??"").split(/[,\n]/).map(x=>clean(x)).filter(Boolean);
const wordCount=v=>clean(v).split(/\s+/).filter(Boolean).length;
const paragraphs=v=>String(v??"").split(/\n\s*\n/).map(x=>clean(x)).filter(Boolean);
const sentenceList=v=>clean(v).split(/(?<=[.!?…])\s+/).filter(Boolean);
const hash=v=>[...String(v??"")].reduce((s,c)=>((s<<5)-s)+c.charCodeAt(0)|0,0);
const pick=(arr,seed)=>arr[Math.abs(seed)%arr.length];
const phaseOf=(index,total)=>{
  const maps={
    16:[0,1,2,3,5,6,7,8,9,10,12,13,14,16,20,24],
    20:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18,20,24],
    24:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,24],
    25:Array.from({length:25},(_,i)=>i)
  };
  return maps[total]?.[index]??Math.round(index*24/Math.max(1,total-1));
};

function defaults(plan){
  const age=clean(plan?.characters?.[0]?.age||plan?.storyBible?.intakeContext?.childAge);
  return {
    readingLevel:/\b(3|4|5)\b/.test(age)?"3–6 Jahre":"6–9 Jahre",
    voice:"Warm und literarisch",
    perspective:"Personale Erzählweise",
    dialogueLevel:"Ausgewogen",
    sceneLength:"Ausführlich",
    literaryDepth:"Hoch",
    themeDelivery:"Durch Entscheidungen und Konsequenzen",
    refrain:"",
    openingStyle:"Direkter kindlicher Einstieg",
    languageStyle:"Natürliches Kinderbuchdeutsch"
  };
}

function context(plan){
  const characters=plan.characters||[];
  const hero=characters[0]||{name:"Mika",description:"",strengths:[]};
  const ally=characters[1]||{name:"Lumi",description:"",strengths:[]};
  const guide=characters[2]||ally;
  const bible=plan.storyBible||{};
  const profile=bible.psychologicalProfile||{};
  const analysis=bible.backgroundAnalysis||{};
  const intake=bible.intakeContext||{};
  const world=plan.worlds?.[0]||{name:"der geheimnisvollen Welt",locations:[]};
  return {plan,characters,hero,ally,guide,bible,profile,analysis,intake,world};
}

function category(ctx){
  const source=`${ctx.analysis.category||""} ${ctx.profile.topic||""}`.toLowerCase();
  if(/trennung|abschied|übergang/.test(source))return "separation";
  if(/wut|starke gefühle|frust/.test(source))return "anger";
  if(/angst|vermeidung/.test(source))return "fear";
  if(/geschwister|eifersucht|teilen/.test(source))return "siblings";
  if(/selbstvertrauen|fehler|leistungsdruck/.test(source))return "confidence";
  if(/ausgrenzung|soziale unsicherheit/.test(source))return "exclusion";
  if(/trauer|verlust|vermissen/.test(source))return "grief";
  if(/schlafen|nächtliche sicherheit/.test(source))return "sleep";
  if(/veränderung|neue situation/.test(source))return "change";
  return "generic";
}

function motifFor(ctx){
  const key=category(ctx);
  const motifs={
    separation:{name:"Rückkehrlicht",intro:"eine kleine Laterne mit milchigem Glas",nom:"die kleine Laterne",acc:"die kleine Laterne",dat:"der kleinen Laterne",gen:"der kleinen Laterne",sound:"ein helles Glöckchen",rule:"Das Licht blieb ruhig, wenn jeder wusste, wo der andere wartete.",safe:"auf einer Bank unter einem silbernen Baum",climax:"die Laterne durch die letzte Tür tragen"},
    anger:{name:"Sturmfeder",intro:"eine rotgoldene Feder",nom:"die Sturmfeder",acc:"die Sturmfeder",dat:"der Sturmfeder",gen:"der Sturmfeder",sound:"ein tiefes Rauschen",rule:"Die Feder wirbelte stärker, wenn jemand hastig nach ihr griff.",safe:"in einer windstillen Mulde im Gras",climax:"den Wind um die Felsen herumlenken"},
    fear:{name:"Wegstein",intro:"einen glatten Stein mit einer leuchtenden Linie",nom:"der Wegstein",acc:"den Wegstein",dat:"dem Wegstein",gen:"des Wegsteins",sound:"ein leises Klopfen",rule:"Die Linie wuchs nur bis zu dem Schritt, den man wirklich sehen konnte.",safe:"in einer geschützten Felsennische",climax:"den Stein bis über die letzte Schwelle tragen"},
    siblings:{name:"Sternenkompass",intro:"einen Kompass aus zwei verschiedenfarbigen Hälften",nom:"der Sternenkompass",acc:"den Sternenkompass",dat:"dem Sternenkompass",gen:"des Sternenkompasses",sound:"zwei helle Töne",rule:"Die Nadel zeigte nur dann nach vorn, wenn beide Hälften Platz bekamen.",safe:"auf einer runden Insel mit zwei Sitzsteinen",climax:"beide Hälften gleichzeitig ausrichten"},
    confidence:{name:"krummer Schlüssel",intro:"einen kleinen Schlüssel mit drei sichtbaren Kerben",nom:"der krumme Schlüssel",acc:"den krummen Schlüssel",dat:"dem krummen Schlüssel",gen:"des krummen Schlüssels",sound:"ein helles Klicken",rule:"Jede Kerbe passte zu einem Versuch, der zuerst schiefgegangen war.",safe:"an einem Werktisch voller angefangener Dinge",climax:"aus mehreren Versuchen den passenden Schlüssel bauen"},
    exclusion:{name:"Platzlied",intro:"eine kleine Klangschale mit vielen Tönen",nom:"die Klangschale",acc:"die Klangschale",dat:"der Klangschale",gen:"der Klangschale",sound:"eine unfertige Melodie",rule:"Kein Ton musste lauter werden, damit die anderen ihn hören konnten.",safe:"in einer ruhigen Gasse mit offenen Fenstern",climax:"die fehlenden Töne zurück auf den Platz bringen"},
    grief:{name:"Erinnerungslicht",intro:"einen warmen Lichtstein",nom:"der Lichtstein",acc:"den Lichtstein",dat:"dem Lichtstein",gen:"des Lichtsteins",sound:"ein vertrautes Summen",rule:"Das Licht wurde nicht kleiner, wenn man eine Erinnerung teilte.",safe:"in einem Garten mit stillen Leuchtblumen",climax:"jedem Licht einen eigenen Platz geben"},
    sleep:{name:"Ruheklang",intro:"eine kleine Muschel mit einem langsamen Ton",nom:"die Ruhe-Muschel",acc:"die Ruhe-Muschel",dat:"der Ruhe-Muschel",gen:"der Ruhe-Muschel",sound:"ein leises Summen",rule:"Der Ton wurde ruhiger, wenn die Schritte immer in derselben Reihenfolge kamen.",safe:"auf einer weichen Lichtung unter dunklem Himmel",climax:"die verstreuten Klänge in die richtige Reihenfolge bringen"},
    change:{name:"Wanderkarte",intro:"eine Karte mit alten und neuen Wegen",nom:"die Wanderkarte",acc:"die Wanderkarte",dat:"der Wanderkarte",gen:"der Wanderkarte",sound:"das Rascheln von Papier",rule:"Neue Linien erschienen erst, wenn jemand stehen blieb und genau hinsah.",safe:"auf einem kleinen Platz für vertraute Dinge",climax:"einen eigenen Weg zwischen Alt und Neu einzeichnen"},
    generic:{name:"leises Zeichen",intro:"ein kleines Zeichen aus warmem Stein",nom:"das leise Zeichen",acc:"das leise Zeichen",dat:"dem leisen Zeichen",gen:"des leisen Zeichens",sound:"ein feiner heller Ton",rule:"Das Zeichen reagierte auf kleine ehrliche Schritte.",safe:"an einem geschützten Platz mit weitem Blick",climax:"das Zeichen sicher durch die letzte Prüfung tragen"}
  };
  return motifs[key]||motifs.generic;
}

function anchorFor(ctx){
  const source=clean(ctx.intake.safePeople||ctx.bible.safePeople).toLowerCase();
  if(/stoffhase|kuschelhase|hase/.test(source))return {nom:"der Stoffhase",acc:"den Stoffhasen"};
  if(/teddy|bär/.test(source))return {nom:"der kleine Teddy",acc:"den kleinen Teddy"};
  if(/puppe/.test(source))return {nom:"die Lieblingspuppe",acc:"die Lieblingspuppe"};
  if(/decke/.test(source))return {nom:"die weiche Decke",acc:"die weiche Decke"};
  if(/kissen/.test(source))return {nom:"das Lieblingskissen",acc:"das Lieblingskissen"};
  return {nom:"der kleine Stoffstern",acc:"den kleinen Stoffstern"};
}

function activityFor(ctx){
  const source=list(ctx.bible.interests||ctx.intake.interests).join(" ").toLowerCase();
  if(/dinosaur/.test(source))return "stellte Holzdinosaurier in einer langen Reihe auf";
  if(/weltraum|planet|rakete/.test(source))return "malte Planeten auf runde Pappstücke";
  if(/tier|hund|katze|pferd/.test(source))return "baute aus Klötzen ein Haus für die Tierfiguren";
  if(/bagger|auto|fahrzeug/.test(source))return "baute eine Garage mit einer besonders breiten Rampe";
  if(/fee|zauber|magie/.test(source))return "faltete kleine Papiersterne";
  if(/fußball/.test(source))return "rollte einen weichen Ball zwischen zwei Bauklotztoren hin und her";
  return "baute auf dem Teppich einen Turm aus bunten Klötzen";
}

function placeForPhase(phase,ctx){
  const W=clean(ctx.world.name,"der Fantasiewelt");
  const places={0:"zu Hause",1:"im vertrauten Zimmer",2:"vor der Tür",3:`am Eingang der Welt „${W}“`,4:`auf einer hellen Lichtung in der Welt „${W}“`,5:"an den Wackelsteinen",6:"am Rand des Nebels",7:motifFor(ctx).safe,8:"unter dem silbernen Baum",9:"am ersten Prüfstein",10:"auf der kleinen Brücke",11:"vor dem Wirrweg",12:"am geteilten Pfad",13:"auf einer ruhigen Lichtung",14:"an einem Kartentisch aus Stein",15:"auf dem Übungsweg",16:"vor dem großen Tor",17:"am Rand des großen Tores",18:"vor der ersten Lichtwand",19:"mitten im Tor",20:"vor der letzten Lichtwand",21:"hinter dem geöffneten Tor",22:"auf dem Rückweg",23:"wieder zu Hause",24:"in einer vertrauten Alltagssituation"};
  return places[phase]||`in der Welt „${W}“`;
}

function themeLanguage(ctx){
  const H=ctx.hero.name,A=ctx.ally.name,key=category(ctx),anchor=anchorFor(ctx);
  const data={
    separation:{
      opening:`Aus dem Nebenraum kam ein Geräusch. ${H} hielt mitten in der Bewegung an und rief: „Bist du noch da?“ Erst als eine vertraute Stimme antwortete, ging es weiter. ${anchor.nom.charAt(0).toUpperCase()+anchor.nom.slice(1)} lag dabei ganz nah am Knie.`,
      body:`Die Hände von ${H} wurden fest. Im Bauch zog es, als hätte jemand dort einen Knoten gemacht.`,
      oldMove:`${H} rückte sofort dicht an ${A} heran und griff nach dem Ärmel.`,
      smallMove:`${H} drückte ${anchor.acc} einmal an die Brust, sah nach dem vereinbarten Treffpunkt und setzte nur einen Fuß über die Markierung.`,
      support:`„Ich bleibe dort, wo wir es abgesprochen haben“, sagte ${A}. „Du kannst mich sehen. Und du entscheidest über den nächsten Schritt.“`,
      final:`Vor der vertrauten Tür kam das Ziehen im Bauch wieder. ${H} drückte ${anchor.acc}, fragte noch einmal nach dem Wiedersehen und ging dann bis zu dem Platz, den ${H} selbst gewählt hatte.`
    },
    anger:{
      opening:`Ein Klotz rutschte weg. Der ganze Turm fiel um. ${H} stieß die restlichen Klötze mit beiden Händen zur Seite. „Blöder Turm!“, rief ${H}. Die Wangen waren heiß, und die Finger hatten sich zu Fäusten gemacht.`,
      body:`Hitze stieg in das Gesicht von ${H}. Die Arme wollten schneller sein als der Kopf.`,
      oldMove:`${H} griff hastig nach dem nächsten Ding und wollte es mit Kraft an die richtige Stelle zwingen.`,
      smallMove:`${H} öffnete die Hände, stampfte dreimal fest in den weichen Boden und blies die Luft langsam aus. Erst dann wurde wieder angefasst, was wirklich gebraucht wurde.`,
      support:`„Ich lasse nicht zu, dass jemand verletzt wird“, sagte ${A} ruhig. „Ich bleibe hier. Wenn deine Hände wieder bereit sind, planen wir weiter.“`,
      final:`Später fiel noch einmal etwas um. Die Hitze kam sofort. ${H} öffnete die Hände, stampfte auf den Boden und sagte: „Ich bin wütend. Ich brauche kurz Platz.“`
    },
    fear:{
      opening:`Am Rand des Zimmers blieb ${H} stehen. Ein dunkler Schatten lag unter dem Schrank, obwohl dort nur eine Tasche stand. ${H} wusste das – und trotzdem wollten die Füße nicht näher.`,
      body:`Die Knie von ${H} fühlten sich weich an. Der Blick blieb an dem schwierigsten Punkt hängen.`,
      oldMove:`${H} wollte sich umdrehen, bevor überhaupt zu sehen war, wie groß das Hindernis wirklich war.`,
      smallMove:`${H} blieb in sicherem Abstand stehen, schaute genau hin und wählte den nächsten sichtbaren Stein. Nur bis dorthin ging der Schritt.`,
      support:`„Wir müssen nicht bis zum Ende schauen“, sagte ${A}. „Nur bis zu dem Punkt, den du heute prüfen möchtest.“`,
      final:`Als die bekannte Unsicherheit wieder auftauchte, blieb ${H} erst stehen. Dann wurde genau hingeschaut. Der nächste kleine Schritt war nicht leicht, aber er war selbst gewählt.`
    },
    siblings:{
      opening:`${H} und ${A} griffen im selben Moment nach demselben Teil. „Ich hatte es zuerst!“, sagte ${H}. ${A} zog zurück. Für einen Augenblick war das Spiel nicht mehr wichtig; wichtig war nur noch, wer gewinnen würde.`,
      body:`Im Bauch von ${H} wurde es eng. Alles fühlte sich an, als müsste sofort entschieden werden, wem etwas gehörte.`,
      oldMove:`${H} wollte allein bestimmen und hörte nur halb, was ${A} sagte.`,
      smallMove:`${H} sagte zuerst, was gebraucht wurde. Danach hörte ${H} zu, bis ${A} fertig war. Erst dann legten beide ihre Teile nebeneinander.`,
      support:`„Es muss keinen Gewinner geben“, sagte ${A}. „Aber beide müssen sagen dürfen, was wichtig ist.“`,
      final:`Beim nächsten kleinen Streit hielt ${H} das Teil noch fest, sagte aber: „Ich will es auch. Sag erst du, was du damit machen möchtest.“`
    },
    confidence:{
      opening:`Auf dem Blatt von ${H} war eine Linie krumm geworden. Sofort wurde die Hand darübergelegt. „Das ist falsch“, murmelte ${H} und wollte das Blatt wegschieben.`,
      body:`Der Hals von ${H} wurde eng. Ein kleiner Fehler sah plötzlich so groß aus wie die ganze Aufgabe.`,
      oldMove:`${H} wollte aufhören, bevor jemand sehen konnte, dass es nicht gleich gelungen war.`,
      smallMove:`${H} betrachtete nur einen Teil der Aufgabe, probierte eine neue Möglichkeit und ließ die erste Spur sichtbar.`,
      support:`„Ich mache es nicht für dich“, sagte ${A}. „Aber ich kann mit dir schauen, was schon funktioniert.“`,
      final:`Als später wieder etwas schiefging, schob ${H} es nicht weg. „Das ist mein erster Versuch“, sagte ${H}. „Jetzt sehe ich, was ich als Nächstes ändern kann.“`
    },
    exclusion:{
      opening:`Andere Stimmen kamen aus der Spielecke. ${H} blieb am Rand stehen und tat so, als wäre etwas auf dem Boden besonders interessant. Hineinzugehen fühlte sich schwerer an, als einfach weiterzusehen.`,
      body:`Der Blick von ${H} sank nach unten. Die Worte im Kopf wurden klein, obwohl das Bedürfnis dazuzugehören groß war.`,
      oldMove:`${H} wollte entweder ganz verschwinden oder so laut werden, dass niemand übersehen konnte, wie weh es tat.`,
      smallMove:`${H} benannte klar, was passiert war, ging aus der verletzenden Situation heraus und suchte die verlässliche Person, die zuhören konnte.`,
      support:`„Ich glaube dir“, sagte ${A}. „Du musst das nicht allein lösen. Wir sorgen zuerst dafür, dass du sicher bist.“`,
      final:`Später stand ${H} wieder am Rand einer Gruppe. Diesmal wurde nicht so getan, als wäre alles egal. ${H} ging zu einer sicheren Person und sagte, was gebraucht wurde.`
    },
    grief:{
      opening:`${H} hielt einen vertrauten Gegenstand in beiden Händen. Manchmal brachte er eine schöne Erinnerung. Manchmal machte genau dieselbe Erinnerung das Vermissen besonders groß.`,
      body:`Die Brust von ${H} fühlte sich schwer an. Tränen und ein kleines Lächeln wollten gleichzeitig kommen.`,
      oldMove:`${H} wollte die Erinnerung festhalten, als könnte dadurch alles wieder genauso werden wie früher.`,
      smallMove:`${H} erzählte eine konkrete Erinnerung, legte ein Licht an einen selbst gewählten Platz und blieb dabei nicht allein.`,
      support:`„Du darfst dieselbe Frage noch einmal stellen“, sagte ${A}. „Und du darfst traurig sein oder spielen. Beides gehört zu dir.“`,
      final:`Am Ende war das Vermissen nicht verschwunden. Doch ${H} wusste nun, wo die Erinnerung einen Platz hatte und mit wem darüber gesprochen werden konnte.`
    },
    sleep:{
      opening:`Im Bett von ${H} war alles still. Gerade deshalb klang jedes kleine Geräusch besonders groß. ${H} zog die Decke höher und zählte die Lichtstreifen unter der Tür.`,
      body:`Die Augen von ${H} waren müde, aber im Kopf liefen die Gedanken weiter.`,
      oldMove:`${H} wollte noch eine Frage, noch ein Licht und noch einen neuen Grund finden, wach zu bleiben.`,
      smallMove:`${H} folgte derselben kleinen Reihenfolge: hinlegen, den vertrauten Gegenstand berühren, langsam ausatmen und dem nächsten ruhigen Ton lauschen.`,
      support:`„Der Ablauf bleibt gleich“, sagte ${A}. „Ich bin erreichbar. Jetzt kommt nur der nächste ruhige Schritt.“`,
      final:`In einer späteren Nacht war der Kopf wieder voll. ${H} begann mit dem ersten vertrauten Schritt. Schlaf kam nicht auf Befehl, aber die Ruhe fand den Weg zurück.`
    },
    change:{
      opening:`Um ${H} herum standen Kisten. Manche Dinge waren schon eingepackt, andere lagen noch an ihrem alten Platz. ${H} suchte immer wieder nach dem, was gestern noch selbstverständlich gewesen war.`,
      body:`Im Bauch von ${H} mischten sich Neugier und Traurigkeit. Beides war gleichzeitig da.`,
      oldMove:`${H} wollte, dass alles Neue sofort wieder genauso aussah wie vorher.`,
      smallMove:`${H} nahm etwas Vertrautes mit, erkundete nur einen kleinen neuen Bereich und bestimmte selbst, wo dort der erste eigene Platz sein sollte.`,
      support:`„Du musst das Alte nicht vergessen, um etwas Neues kennenzulernen“, sagte ${A}.`,
      final:`Am neuen Ort war noch vieles fremd. Doch ${H} stellte das vertraute Ding an den selbst gewählten Platz. Von dort aus begann die nächste kleine Entdeckung.`
    },
    generic:{
      opening:`Etwas Kleines ging nicht so, wie ${H} es geplant hatte. Sofort wollte ${H} aufhören oder alles auf einmal ändern.`,
      body:`Im Bauch von ${H} wurde es eng, und die Gedanken drängelten durcheinander.`,
      oldMove:`${H} wollte die schwierige Situation schnell beenden, bevor sie noch größer werden konnte.`,
      smallMove:`${H} blieb kurz stehen, schaute genau hin und wählte nur den nächsten machbaren Schritt.`,
      support:`„Du musst noch nicht alles wissen“, sagte ${A}. „Wir bleiben hier, während du den nächsten Schritt aussuchst.“`,
      final:`Als die Schwierigkeit später wiederkam, erkannte ${H} sie früher. Das machte sie nicht klein, aber den nächsten Schritt sichtbar.`
    }
  };
  return data[key]||data.generic;
}

function sensory(place,motif,seed,voice){
  const start=place.charAt(0).toUpperCase()+place.slice(1);
  const base=[
    `${start} roch es nach feuchter Erde und Holz. Zwischen den Blättern erklang ${motif.sound}.`,
    `${start} lag das Licht in breiten Streifen auf dem Boden. Darin funkelte ${motif.nom}.`,
    `${start} war der Weg schmal. Unter jedem Schritt knirschte etwas anderes.`,
    `${start} bewegten sich helle Schatten über den Boden. Ganz in der Nähe war ${motif.sound} zu hören.`,
    `${start} war es still genug, um kleine Dinge zu bemerken: einen Käfer, eine Spur im Staub und das Leuchten ${motif.gen}.`
  ];
  let value=pick(base,seed);
  if(voice==="Ruhig und poetisch")value+=" Die Welt schien einen Atemzug lang zu warten.";
  if(voice==="Lebendig und humorvoll")value+=" Ein krummer Stein am Rand sah aus, als hätte er dazu eine wichtige Meinung.";
  if(voice==="Spannend und direkt")value+=" Dann knackte es direkt hinter ihnen.";
  return value;
}

function eventFor(phase,ctx,motif,scene){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name,O=motif.nom,OA=motif.acc,OG=motif.gen,W=clean(ctx.world.name,"der Fantasiewelt");
  const events={
    0:{action:`Unter einem Möbelstück blinkte etwas. ${H} zog ${motif.intro} hervor. Der Gegenstand war warm, obwohl kein Licht darauf fiel.`,obstacle:`Als ${H} ihn anhob, erschien auf dem Boden eine dünne leuchtende Spur. Sie führte bis zur Tür und endete dort.`,outcome:`${A} entdeckte auf der Rückseite ein Zeichen, das zum Eingang der Welt „${W}“ passte.`,hook:`Noch bevor sie wussten, was es bedeutete, erklang ${motif.sound} ein zweites Mal.`,carry:`${O.charAt(0).toUpperCase()+O.slice(1)} war aufgetaucht und hatte den ersten Weg gezeigt.`},
    1:{action:`Auf der Oberfläche ${OG} erschienen drei winzige Bilder: ein Tor, ein verschlungener Weg und ein dunkler Punkt in der Mitte.`,obstacle:`Das letzte Bild wurde schwächer. Jedes Mal, wenn ${H} zu schnell darüberwischte, verschwand es ganz.`,outcome:`${A} hielt die Hände still. Nun blieb das Bild sichtbar und zeigte zum geheimnisvollen Tor.`,hook:`Dort wartete ein Eingang, den vorher niemand gesehen hatte.`,carry:`Das Bild auf ${motif.dat} hatte den Weg zum Tor gezeigt.`},
    2:{action:`${H} packte nur das ein, was wirklich gebraucht wurde. ${A} nahm Wasser, und ${G} band eine dünne Schnur um ${OA}, damit nichts verloren ging.`,obstacle:`Direkt vor dem Aufbruch wurde die leuchtende Spur schwach. Sie reichte nur bis zum ersten Stein.`,outcome:`${H} versprach nicht den ganzen Weg. Der erste Stein genügte für den Anfang.`,hook:`Als ein Fuß den Stein berührte, öffnete sich das Tor einen Spalt.`,carry:`${H} hatte sich für den ersten überschaubaren Schritt entschieden.`},
    3:{action:`Hinter dem Tor begann die Welt „${W}“. Die Luft war kühler, und der Rückweg blieb als heller Rahmen sichtbar.`,obstacle:`Hinter dem Eingang lagen Platten, die bei hastigen Schritten wackelten.`,outcome:`Die Gruppe ging einzeln. Nach jeder Platte warteten alle, bis der Boden wieder ruhig war.`,hook:`Auf der anderen Seite stand ${G} und hielt ein Schild ohne Schrift hoch.`,carry:`Die Gruppe hatte die erste Schwelle langsam überquert.`},
    4:{action:`${G} legte ${OA} auf einen flachen Stein. Erst leuchtete der Gegenstand wild, dann ganz ruhig.`,obstacle:`Niemand verstand, warum sich das Licht verändert hatte.`,outcome:`${G} zeigte es noch einmal: ${motif.rule}`,hook:`Vor ihnen teilte sich der Weg in drei Richtungen. Nur eine davon blieb hell.`,carry:`Die erste Regel ${OG} war sichtbar geworden.`},
    5:{action:`Der helle Weg führte über bewegliche Steine. ${H} wollte die Reihe schnell hinter sich bringen.`,obstacle:`Beim zweiten hastigen Schritt kippte ein Stein. ${O.charAt(0).toUpperCase()+O.slice(1)} wurde dunkel, und der nächste Stein verschwand im Nebel.`,outcome:`${A} schaffte es zurück auf festen Boden. Niemand war verletzt, aber der Weg war geschlossen.`,hook:`Aus dem Nebel kam ${motif.sound}, diesmal langsam und weit entfernt.`,carry:`Der schnelle Versuch hatte den Weg geschlossen.`},
    6:{action:`${H} probierte es noch einmal – zuerst kräftiger, dann noch schneller.`,obstacle:`Mit jedem Versuch wurden die Steine unruhiger. ${A} konnte den eigenen Hinweis nicht zu Ende sagen.`,outcome:`Am Ende saßen alle wieder am Anfang der Reihe. Das Licht ${OG} war nur noch so groß wie eine Erbse.`,hook:`${G} deutete auf einen Seitenpfad.`,carry:`Das Licht war fast erloschen, und die Gruppe brauchte eine Pause.`},
    7:{action:`Hier war der Wind still. ${H} setzte sich, ohne etwas lösen zu müssen.`,obstacle:`Das schwierige Gefühl war trotzdem noch da. Es ließ sich nicht einfach wegschicken.`,outcome:`${A} blieb in der Nähe. Nach einer Weile wurde der Atem von ${H} ruhiger, und ${O} leuchtete wieder ein wenig.`,hook:`Im ruhigen Licht entdeckte ${A} eine feine Markierung am Rand.`,carry:`Die Pause hatte wieder Platz zum Schauen geschaffen.`},
    8:{action:`${A} fuhr mit einem Finger über die Markierung. Sie bestand aus kleinen Zeichen, die wie einzelne Schritte aussahen.`,obstacle:`${H} wollte sofort wissen, welches Zeichen zum Ziel führte. Doch die Reihe begann immer wieder von vorn.`,outcome:`Erst als beide jedes Zeichen nacheinander betrachteten, blieb die Reihenfolge bestehen.`,hook:`Das erste Zeichen zeigte zu einem einzigen niedrigen Stein.`,carry:`${A} hatte entdeckt, dass die Zeichen nur nacheinander gelesen werden konnten.`},
    9:{action:`Der niedrige Stein war kaum höher als eine Stufe. Trotzdem wartete ${H}, bis der eigene Körper bereit war.`,obstacle:`Kurz vor dem Schritt meldete sich das alte Drängen wieder: zurück oder schnell darüber.`,outcome:`${H} wählte nur diesen einen Stein. Als beide Füße darauf standen, erklang ein heller Ton.`,hook:`Im Nebel erschien ein zweiter Stein.`,carry:`Der erste selbst gewählte Schritt hatte einen neuen Stein sichtbar gemacht.`},
    10:{action:`Stein für Stein entstand eine kleine Brücke. ${H} gab das Tempo an, ${A} beobachtete das Licht und ${G} sicherte den Rückweg.`,obstacle:`Die Brücke blieb schmal, und nicht jeder Schritt fühlte sich gleich leicht an.`,outcome:`Am anderen Ufer leuchtete ${O} erstmals ruhig und gleichmäßig.`,hook:`Dann bebte der Boden. Weiter vorn öffnete sich eine größere Prüfung.`,carry:`Die Gruppe hatte mit klaren Aufgaben die erste Brücke überquert.`},
    11:{action:`Vor ihnen bewegten sich mehrere Wege gleichzeitig. Jeder sah für einen Moment richtig aus.`,obstacle:`${H} versuchte, alle Möglichkeiten auf einmal im Blick zu behalten. Das Licht sprang unruhig hin und her.`,outcome:`Die Gruppe kam nur wenige Meter weiter und verlor dabei die Markierung zum Rückweg.`,hook:`${A} zeigte auf einen schmalen Pfad, den ${H} übersehen hatte.`,carry:`Zu viele Wege hatten die Gruppe durcheinandergebracht.`},
    12:{action:`${A} wollte den schmalen Pfad prüfen. ${H} griff bereits nach ${OA} und bestimmte eine andere Richtung.`,obstacle:`Beide redeten gleichzeitig. Das Licht teilte sich in zwei schwache Strahlen, die nirgendwo ankamen.`,outcome:`${A} setzte sich ein Stück entfernt. ${H} blieb mit ${motif.dat} allein stehen.`,hook:`Zum ersten Mal war nicht der Weg das größte Hindernis, sondern der Abstand zwischen ihnen.`,carry:`Der Streit hatte die Gruppe getrennt und das Licht geteilt.`},
    13:{action:`${H} ging zu ${A}, ohne ${OA} mitzunehmen. Zuerst wurde nur gesagt, was passiert war.`,obstacle:`Eine Entschuldigung machte den Ärger nicht sofort weg. ${A} brauchte Zeit, um die eigene Sicht zu Ende zu erzählen.`,outcome:`Danach legten beide fest, wie sie einander stoppen konnten, bevor wieder jemand allein entschied.`,hook:`Als sie gemeinsam zurückkehrten, verbanden sich die beiden Lichtstrahlen.`,carry:`${H} und ${A} hatten den Streit repariert und eine neue Abmachung getroffen.`},
    14:{action:`Auf dem Boden zeichneten sie einen Plan. ${H} übernahm den nächsten Schritt, ${A} achtete auf übersehene Zeichen und ${G} hielt den sicheren Weg offen.`,obstacle:`Der Plan war langsamer als der erste Versuch. Niemand durfte die Aufgabe der anderen übernehmen.`,outcome:`Jede Figur sprach die eigene Aufgabe einmal laut aus. ${O.charAt(0).toUpperCase()+O.slice(1)} antwortete mit einem klaren Ton.`,hook:`Hinter der nächsten Biegung wartete eine kleine Stelle zum Üben.`,carry:`Die Gruppe hatte einen Plan, in dem jede Aufgabe einen Platz hatte.`},
    15:{action:`Die Übungsstelle bestand aus drei kurzen Wegen. Einer war leicht, einer eng und einer voller Geräusche.`,obstacle:`Beim zweiten Weg vergaß ${H} einen Teil der Abmachung. Diesmal bemerkte es ${H} selbst.`,outcome:`Sie begannen nicht ganz von vorn. Sie verbesserten nur den vergessenen Schritt und machten weiter.`,hook:`Am Ende zeigte ${O} direkt zum Zentrum der Welt „${W}“.`,carry:`Die Gruppe hatte einen Fehler verbessert, ohne alles abzubrechen.`},
    16:{action:`Im Zentrum stand ein Tor aus bewegtem Licht, Wind und Schatten. Dahinter lag das Ziel ihrer Reise.`,obstacle:`Alles daran erinnerte gleichzeitig an die bisherigen schwierigen Stellen.`,outcome:`${H} bemerkte die ersten Zeichen im eigenen Körper, bevor die Füße losliefen.`,hook:`Noch war das Tor geschlossen. Doch ${O} wartete ruhig in den Händen von ${H}.`,carry:`Die Gruppe stand vor der größten Prüfung, und ${H} hatte die Warnzeichen früh bemerkt.`},
    17:{action:`${A} und ${G} stellten sich an die vereinbarten Plätze. Niemand griff nach ${OA}.`,obstacle:`Das Tor wurde lauter. Es wäre leicht gewesen, ${H} die Entscheidung abzunehmen.`,outcome:`${A} sagte nur den verabredeten Satz. Dann blieb genug Stille für die Antwort von ${H}.`,hook:`${H} hob den Blick und zeigte auf den ersten Teil des Tores.`,carry:`Die anderen hatten Sicherheit gegeben, ohne den Schritt zu übernehmen.`},
    18:{action:`${H} begann mit dem kleinen Ablauf, den die Gruppe geübt hatte.`,obstacle:`Das alte Drängen kam zurück. Es war laut und vertraut.`,outcome:`Trotzdem blieb zwischen Drängen und Bewegung ein kurzer Moment. In diesem Moment wählte ${H} selbst.`,hook:`Der erste Teil des Tores wurde durchsichtig.`,carry:`${H} hatte trotz des alten Drängens eine eigene Entscheidung getroffen.`},
    19:{action:`Nun setzte jede Figur die eigene Aufgabe um. ${A} rief die Zeichen, ${G} hielt den Rückweg offen und ${H} trug ${OA} weiter.`,obstacle:`Als ein Zeichen ausblieb, mussten alle warten, statt die Lücke hastig zu füllen.`,outcome:`Die Pause rettete den Plan. Das fehlende Zeichen erschien, und das Tor öffnete sich weiter.`,hook:`Nur der letzte Schritt fehlte noch.`,carry:`Das Team hatte eine schwierige Lücke gemeinsam ausgehalten.`},
    20:{action:`Vor dem letzten Teil des Tores nahm jede Figur den vereinbarten Platz ein. ${A} achtete auf die Zeichen, ${G} hielt den Rückweg offen, und ${H} bereitete sich darauf vor, ${motif.climax}.`,obstacle:`Das Hindernis reagierte ein letztes Mal auf die alte Gewohnheit und wurde größer.`,outcome:`${H} nutzte den geübten kleinen Schritt und führte die entscheidende Handlung selbst aus. Das Licht breitete sich durch das ganze Tor aus.`,hook:`Der Lärm verstummte. Zum ersten Mal war nur der ruhige Ton ${OG} zu hören.`,carry:`Die entscheidende Handlung hatte das Tor geöffnet.`},
    21:{action:`Hinter dem Tor setzten sich alle auf den warmen Boden. Niemand musste sofort erzählen, wie mutig alles gewesen war.`,obstacle:`${H} konnte noch kaum glauben, dass der letzte Schritt wirklich gelungen war.`,outcome:`${A} nannte genau, was zu sehen gewesen war: das Warten, die klare Bitte und die selbst ausgeführte Bewegung.`,hook:`${O.charAt(0).toUpperCase()+O.slice(1)} zeigte nun nicht weiter nach vorn, sondern zurück zum Ausgang.`,carry:`Die Gruppe hatte den Erfolg ruhig betrachtet und verstanden.`},
    22:{action:`Auf dem Rückweg waren die Orte dieselben, doch die Gruppe ging anders durch sie hindurch.`,obstacle:`An einer kleinen Stelle tauchte das alte Problem noch einmal auf.`,outcome:`Diesmal brauchte es weniger Worte. ${H} bemerkte es, nutzte den bekannten Ablauf und ging weiter.`,hook:`Hinter dem letzten Tor wartete wieder der vertraute Raum.`,carry:`Der neue Ablauf hatte auch auf dem Rückweg getragen.`},
    23:{action:`Als sie nach Hause kamen, lag alles noch dort, wo das Abenteuer begonnen hatte.`,obstacle:`Für einen Moment wirkte die Reise so unwirklich, als könnte sie gleich verschwinden.`,outcome:`Doch ${O} blieb als kleines Zeichen zurück. ${H} legte den Gegenstand an einen selbst gewählten Platz.`,hook:`Schon bald kam eine Alltagssituation, die sich vertraut schwierig anfühlte.`,carry:`Das Abenteuer war beendet, aber ein kleines Zeichen war geblieben.`},
    24:{action:`Zu Hause lag ${motif.nom} wieder an seinem festen Platz. Als die bekannte Situation kam, erkannte ${H} sie früher.`,obstacle:`Das alte Gefühl war noch da und wollte den schnellsten Weg bestimmen.`,outcome:`${H} nutzte den eigenen kleinen Schritt. Nicht alles wurde leicht, aber das Handeln gehörte nun wieder ${H}.`,hook:`${O.charAt(0).toUpperCase()+O.slice(1)} leuchtete einmal auf und wurde dann ruhig.`,carry:`${H} hatte den neuen Schritt in den Alltag mitgenommen.`}
  };
  return events[phase]||events[24];
}

function openingParagraph(ctx,theme){
  const H=ctx.hero.name;
  return `${H} ${activityFor(ctx)}. ${theme.opening}`;
}

function continuationParagraph(previous,place,ctx,motif,seed,chapterStart){
  const H=ctx.hero.name;
  if(place==="im vertrauten Zimmer")return `${previous.carry} ${H} kniete noch immer auf dem Teppich und hielt ${motif.acc} vorsichtig zwischen beiden Händen.`;
  if(place==="in einer vertrauten Alltagssituation")return `${previous.carry} Durch das nun offene Tor kehrten ${H} und die anderen nach Hause zurück. Einige Zeit später kam die vertraute schwierige Situation wieder.`;
  const options=[
    `${previous.carry} Als sie ${place} ankamen, hielt ${H} ${motif.acc} vorsichtig fest.`,
    `Auf dem Weg sprach zunächst niemand. ${previous.carry} ${place.charAt(0).toUpperCase()+place.slice(1)} blieben alle stehen.`,
    `${previous.carry} ${place.charAt(0).toUpperCase()+place.slice(1)} sah ${H} deshalb zuerst auf den Boden und dann zu den anderen.`,
    `Sie ließen den letzten Ort hinter sich. Was dort geschehen war, zeigte sich noch immer am Licht ${motif.gen}.`
  ];
  let value=pick(options,seed);
  if(chapterStart)value+=" Der Weg ging weiter, aber nicht wieder von vorn.";
  return value;
}

function dialogueFor(phase,ctx,theme,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name;
  const lines={
    0:`„Was ist das?“, fragte ${H}. ${A} beugte sich näher. „Ich weiß es nicht. Aber wir können es uns in Ruhe ansehen.“`,
    1:`„Die Bilder bewegen sich“, sagte ${H}. „Dann halten wir erst einmal still“, antwortete ${A}.`,
    2:`„Nur bis zum ersten Stein“, sagte ${H}. ${A} nickte. „Und dort entscheiden wir neu.“`,
    3:`„Ich kann den Eingang noch sehen“, sagte ${H}. „Gut“, antwortete ${A}. „Dann weißt du, wo wir zurückkommen.“`,
    4:`${G} zeigte auf das ruhige Licht. „Seht genau hin. Es wird nicht heller, wenn ihr schneller seid.“`,
    5:`„Ich kann das schnell!“, rief ${H}. Im selben Moment wackelte der Stein. ${A} streckte die Arme aus. „Langsam!“`,
    6:`„Noch einmal“, sagte ${H}. ${A} schüttelte den Kopf. „Erst eine Pause. Das Licht ist fast weg.“`,
    7:`${theme.support} ${H} rückte ein kleines Stück näher, ohne sofort aufzustehen.`,
    8:`„Hier sind kleine Zeichen“, sagte ${A}. ${H} sah hin. „Eins nach dem anderen?“ – „Genau.“`,
    9:`„Nur dieser Stein“, sagte ${H}. ${A} blieb am Rand. „Ich warte hier.“`,
    10:`„Wir sind drüben!“, rief ${A}. ${H} lächelte. „Weil wir nicht alle dasselbe gemacht haben.“`,
    11:`„Es sind zu viele Wege“, sagte ${H}. ${G} zeigte auf den Boden. „Dann wählen wir nicht alle. Nur einen zum Prüfen.“`,
    12:`„Du hast nicht gewartet“, sagte ${A}. ${H} wollte widersprechen. Dann blieb der erste Satz unausgesprochen.`,
    13:`„Ich wollte entscheiden, bevor ich Angst bekomme“, sagte ${H}. ${A} sah auf. „Dann sag mir das. Aber hör auch meinen Hinweis an.“`,
    14:`„Du achtest auf die Zeichen“, sagte ${H} zu ${A}. „Und ich mache den nächsten Schritt selbst.“`,
    15:`„Ich habe einen Teil vergessen“, sagte ${H}. ${G} nickte. „Dann verbessern wir genau diesen Teil.“`,
    16:`„Das Tor ist riesig“, flüsterte ${H}. ${A} stellte sich an den vereinbarten Platz. „Wir brauchen trotzdem nur den ersten Teil.“`,
    17:`${theme.support} ${H} atmete aus und zeigte auf die erste Lichtwand.`,
    18:`„Ich bin bereit für den ersten Teil“, sagte ${H}. „Nicht für alles. Nur dafür.“`,
    19:`„Warten!“, rief ${A}. Alle hielten an. Einen Augenblick später erschien das fehlende Zeichen.`,
    20:`„Jetzt“, sagte ${H}. Das Wort war nicht laut. Trotzdem hörten es alle.`,
    21:`„Was habe ich anders gemacht?“, fragte ${H}. ${A} zählte auf: „Du hast gewartet, gefragt und deinen Schritt selbst gemacht.“`,
    22:`„Da ist es wieder“, sagte ${H}. ${G} nickte. „Und was kommt jetzt?“ – „Mein erster kleiner Schritt.“`,
    23:`„War das alles wirklich da?“, fragte ${H}. ${A} zeigte auf das ruhige Licht. „Das hier ist jedenfalls mitgekommen.“`,
    24:`„Es ist noch schwer“, sagte ${H}. ${A} nickte. „Ja. Und du weißt, was du zuerst tun kannst.“`
  };
  return lines[phase]||lines[24];
}

function childReflection(phase,ctx,theme,motif,seed){
  const H=ctx.hero.name,A=ctx.ally.name;
  if(phase===0)return `${theme.body} ${theme.oldMove}`;
  if(phase<=2)return `${theme.body} ${H} sah erst zur Tür und dann zu ${A}.`;
  if(phase<=4)return `${H} merkte, dass die Füße schneller werden wollten. Noch blieb ${H} stehen.`;
  if(phase<=6)return `${theme.body} ${theme.oldMove}`;
  if(phase===7)return `${H} musste gerade nichts beweisen. Das machte den Atem langsam wieder größer.`;
  if(phase<=10)return `${H} erinnerte sich an den kleinen Erfolg davor. Er war nicht riesig, aber er war wirklich passiert.`;
  if(phase<=13)return `${H} sah zu ${A}. Der Streit tat anders weh als das Hindernis, aber er brauchte genauso viel Aufmerksamkeit.`;
  if(phase<=17)return `${H} ging den Plan im Kopf durch. Jede Figur hatte nur eine Aufgabe, und keine musste allein alles schaffen.`;
  if(phase<=20)return `${theme.body} Diesmal blieb ${H} trotzdem beim vereinbarten ersten Schritt.`;
  return `${H} spürte noch die Anstrengung in Armen und Beinen. Gleichzeitig war da ein ruhiger Stolz.`;
}

function strategyParagraph(phase,ctx,theme,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name;
  const lines={
    0:`${A} blieb nah genug, um erreichbar zu sein, und weit genug weg, damit ${H} selbst schauen konnte.`,
    1:`${H} legte beide Hände neben den Gegenstand. Erst als nichts mehr wackelte, betrachteten sie das nächste Bild.`,
    2:`${H} zeigte auf den ersten Stein. Mehr musste noch niemand versprechen.`,
    3:`Nach jeder Platte sah ${H} kurz zurück. Der helle Eingang blieb sichtbar.`,
    4:`${G} ließ sie die Regel selbst ausprobieren. Niemand bekam eine fertige Antwort.`,
    5:`Der schnelle Versuch wurde nicht sofort wiederholt. Erst prüften sie, ob alle sicher standen.`,
    6:`${A} führte die Gruppe zu einem ruhigen Platz. Dort durfte das Problem einen Moment ungelöst bleiben.`,
    7:`${A} blieb einfach sitzen. Nach und nach konnte ${H} wieder sehen, hören und nachdenken.`,
    8:`Sie lasen die Zeichen mit dem Finger: eins, Pause, zwei, Pause.`,
    9:`${theme.smallMove}`,10:`${H} wiederholte dieselbe Reihenfolge auf jedem Stein. ${A} griff nicht ein.`,
    11:`${H} wählte einen einzigen Weg zum Prüfen. Die anderen Möglichkeiten durften warten.`,
    12:`Niemand löste den Streit während des Redens. Zuerst hörten beide Sätze bis zum Ende.`,
    13:`${H} sagte, was gebraucht wurde. Danach durfte ${A} die eigene Sicht erklären.`,
    14:`Die Aufgaben wurden so verteilt, dass jede Figur etwas Eigenes beitragen konnte.`,
    15:`Als ein Schritt fehlte, verbesserten sie nur diesen Schritt.`,
    16:`${H} suchte nicht das ganze Tor ab. Der Blick blieb auf dem ersten Abschnitt.`,
    17:`${A} und ${G} hielten ihre Plätze. Der entscheidende Schritt blieb bei ${H}.`,
    18:`${theme.smallMove}`,19:`Jede Figur wartete auf das eigene Zeichen. So blieb der Plan zusammen.`,
    20:`${theme.smallMove} Danach führte ${H} die letzte Handlung selbst aus.`,
    21:`Die anderen nannten keine großen Eigenschaften. Sie sagten nur, was sie wirklich gesehen hatten.`,
    22:`Auf dem Rückweg brauchte ${H} weniger Hilfe, aber noch immer einen klaren Anfang.`,
    23:`${H} legte den Gegenstand an einen festen Platz, an dem er später wiederzufinden war.`,
    24:theme.final
  };
  return lines[phase]||theme.final;
}

function closingParagraph(event,nextScene,ctx,motif,seed){
  const H=ctx.hero.name;
  const end=`${event.outcome} ${event.hook}`;
  if(!nextScene)return end;
  return pick([
    `${end} Ein neuer Lichtpunkt erschien ein Stück weiter vorn.`,
    `${end} ${H} hob den Blick. Der Weg war noch nicht zu Ende.`,
    `${end} Im Licht ${motif.gen} wurde die nächste Spur sichtbar.`,
    `${end} Diesmal ging niemand los, bevor alle bereit waren.`
  ],seed);
}

function assemble(plan,scene,index,total,settings,variation,mode,previous,next,chapterStart){
  const ctx=context(plan),motif=motifFor(ctx),theme=themeLanguage(ctx),phase=phaseOf(index,total),place=placeForPhase(phase,ctx),seed=hash(`${scene.id}|${variation}|${mode}`),event=eventFor(phase,ctx,motif,scene);
  let blocks=[];
  blocks.push(index===0?openingParagraph(ctx,theme):continuationParagraph(previous,place,ctx,motif,seed,chapterStart));
  blocks.push(phase===0||phase>=23?event.action:`${sensory(place,motif,seed+1,settings.voice)} ${event.action}`);
  blocks.push(dialogueFor(phase,ctx,theme,seed+2));
  blocks.push(`${event.obstacle} ${childReflection(phase,ctx,theme,motif,seed+3)}`);
  blocks.push(strategyParagraph(phase,ctx,theme,seed+4));
  blocks.push(closingParagraph(event,next,ctx,motif,seed+5));

    if(mode==="dialogue")blocks.splice(4,0,dialogueFor(Math.min(24,phase+1),ctx,theme,seed+20));
  if(mode==="vivid")blocks.splice(2,0,`${sensory(place,motif,seed+21,"Ruhig und poetisch")} ${ctx.hero.name} sah, wie sich das Licht auf den eigenen Schuhen bewegte.`);
  if(mode==="deep")blocks.splice(5,0,`${ctx.hero.name} musste das Erlebnis noch nicht in Worte fassen. Es reichte, dass der Unterschied im nächsten Handgriff sichtbar wurde.`);
  if(mode==="exciting")blocks.splice(4,0,`Noch bevor alle bereit waren, setzte sich das Hindernis in Bewegung. ${ctx.hero.name} musste schnell entscheiden, ob der geübte Ablauf trotzdem bleiben durfte.`);
  if(settings.dialogueLevel==="Viel"&&mode!=="dialogue")blocks.splice(4,0,dialogueFor(Math.max(0,phase-1),ctx,theme,seed+22));
  if(settings.dialogueLevel==="Wenig")blocks=blocks.filter((_,i)=>i!==2);
  if(settings.refrain&&[4,9,14,19,24].includes(phase))blocks.splice(blocks.length-1,0,clean(settings.refrain).replace(/[.!?]?$/,"."));
  if(mode==="concise"||settings.sceneLength==="Kurz")blocks=[blocks[0],blocks[1],blocks[3],blocks.at(-1)];
  else if(settings.sceneLength==="Mittel"&&blocks.length>5)blocks=blocks.slice(0,5).concat(blocks.at(-1));

  return {text:blocks.filter(Boolean).join("\n\n"),meta:{phase,motif:motif.name,carry:event.carry,chapterStart:Boolean(chapterStart),location:place,consequence:event.outcome,hook:event.hook}};
}

function influence(plan,scene){
  const ctx=context(plan);
  const focus=(plan.characters||[]).find(c=>c.name===scene.focusCharacter)||ctx.hero;
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

function quality(scene,plan,index,previous=null){
  const value=clean(scene.text),paras=paragraphs(scene.text),sentences=sentenceList(value),count=wordCount(value),ctx=context(plan);
  const avg=sentences.length?count/sentences.length:99;
  const banned=/\b(psychologisch|bewältigungsstrategie|entwicklungsziel|selbstwirksamkeit|reiz und reaktion|handlungsspielraum|die hauptfigur|die botschaft|die moral|intervention|emotionales bedürfnis)\b/i;
  const concrete=/\b(ging|lief|griff|legte|stellte|hob|setzte|sah|hörte|öffnete|schloss|trug|zeigte|wartete|atmete|drückte)\b/i.test(value);
  const dialogue=(value.match(/[„“]/g)||[]).length>=2;
  const clearBeginning=index>0||value.startsWith(ctx.hero.name)&&dialogue&&value.includes(motifFor(ctx).nom);
  const childLanguage=!banned.test(value)&&avg<=22;
  const situationGrounded=concrete&&Boolean(scene.narrativeMeta?.location)&&!banned.test(value);
  const continuity=index===0||Boolean(previous&&scene.narrativeMeta?.carry&&paras[0]);
  const paragraphCohesion=paras.length>=4&&paras.every(p=>sentenceList(p).length>=1);
  const variedStarts=new Set(sentences.map(s=>s.split(/\s+/).slice(0,2).join(" ").toLowerCase())).size>=Math.max(5,Math.floor(sentences.length*.55));
  const noLoosePlanningWords=!/konkrete bewältigungsstrategie|psychologische funktion|gewünschte entwicklung|realistischer erfolg/i.test(value);
  const scoreParts=[count>=120,paras.length>=4,clearBeginning,childLanguage,situationGrounded,continuity,paragraphCohesion,dialogue,variedStarts,noLoosePlanningWords];
  return {
    score:Math.round(scoreParts.filter(Boolean).length/scoreParts.length*100),
    ageAppropriate:childLanguage,
    detailed:count>=120,
    narrativeFlow:continuity&&paragraphCohesion,
    contextInfluence:value.includes(ctx.hero.name)&&(value.includes(scene.narrativeMeta?.motif||motifFor(ctx).name)||value.includes(motifFor(ctx).nom)),
    themeInAction:noLoosePlanningWords,
    noTemplatePhrases:!banned.test(value),
    variedSentences:variedStarts,
    continuity,
    paragraphCohesion,
    naturalDialogue:dialogue,
    psychologicalFit:Boolean(scene.influence?.psychologicalFunction),
    coherent:Boolean(scene.narrativeMeta?.consequence),
    clearBeginning,
    childLanguage,
    concreteSituation:situationGrounded,
    averageSentenceWords:Math.round(avg*10)/10
  };
}

function recalc(manuscript,plan){
  manuscript.scenes.forEach((scene,index)=>{
    scene.wordCount=wordCount(scene.text);
    scene.quality=quality(scene,plan,index,manuscript.scenes[index-1]||null);
  });
  const total=manuscript.scenes.length||1;
  manuscript.progress=Math.round(manuscript.scenes.filter(s=>s.status==="approved").length/total*100);
  manuscript.qualityScore=Math.round(manuscript.scenes.reduce((sum,s)=>sum+(s.quality?.score||0),0)/total);
  manuscript.updatedAt=new Date().toISOString();
  return manuscript;
}

function generate(plan,settings){
  const cfg={...defaults(plan),...(settings||{})},planScenes=plan.scenes||[],chapters=(plan.chapters||[]).map(c=>({...c})),scenes=[];
  let previous=null,previousChapter=null;
  planScenes.forEach((scene,index)=>{
    const chapterStart=previousChapter!==scene.chapterId;
    const generated=assemble(plan,scene,index,planScenes.length,cfg,0,"literary",previous,planScenes[index+1]||null,chapterStart);
    scenes.push({id:uid("MS"),sceneId:scene.id,chapterId:scene.chapterId,chapterNumber:scene.chapterNumber,sceneNumber:scene.number,title:scene.title,text:generated.text,wordCount:wordCount(generated.text),status:"draft",revision:1,variation:0,history:[],influence:influence(plan,scene),narrativeMeta:generated.meta,quality:null});
    previous=generated.meta;previousChapter=scene.chapterId;
  });
  return recalc({schemaVersion:"4.0",generatedAt:new Date().toISOString(),generator:"CAPS Children's Book Narrative Writer 4.0",settings:cfg,chapters,scenes,progress:0,qualityScore:0},plan);
}

function regenerateAt(plan,manuscript,index,mode){
  const scene=manuscript.scenes[index],planScenes=plan.scenes||[],planIndex=planScenes.findIndex(s=>s.id===scene.sceneId);
  if(planIndex<0)return;
  const previous=index>0?manuscript.scenes[index-1].narrativeMeta:null;
  const chapterStart=index===0||manuscript.scenes[index-1].chapterId!==scene.chapterId;
  const generated=assemble(plan,planScenes[planIndex],planIndex,planScenes.length,manuscript.settings,(scene.variation||0)+1,mode,previous,planScenes[planIndex+1]||null,chapterStart);
  scene.history=scene.history||[];
  scene.history.push({revision:scene.revision,text:scene.text,changedAt:new Date().toISOString(),mode});
  scene.variation=(scene.variation||0)+1;scene.revision=(scene.revision||1)+1;scene.text=generated.text;scene.narrativeMeta=generated.meta;scene.influence=influence(plan,planScenes[planIndex]);
}

function rewrite(plan,manuscript,sceneId,mode="literary"){
  const index=manuscript.scenes.findIndex(s=>s.id===sceneId);
  if(index<0)return manuscript;
  regenerateAt(plan,manuscript,index,mode);
  return recalc(manuscript,plan);
}

function rewriteChapter(plan,manuscript,chapterId,mode="literary"){
  manuscript.scenes.forEach((s,index)=>{if(s.chapterId===chapterId)regenerateAt(plan,manuscript,index,mode)});
  return recalc(manuscript,plan);
}

function upgrade(manuscript,plan){
  manuscript.settings={...defaults(plan),...(manuscript.settings||{})};
  manuscript.chapters=Array.isArray(manuscript.chapters)?manuscript.chapters:(plan.chapters||[]).map(c=>({...c}));
  manuscript.scenes=Array.isArray(manuscript.scenes)?manuscript.scenes:[];
  manuscript.scenes.forEach((scene,index)=>{
    const planScene=(plan.scenes||[]).find(s=>s.id===scene.sceneId)||{};
    scene.history=Array.isArray(scene.history)?scene.history:[];scene.revision=Number(scene.revision)||1;scene.variation=Number(scene.variation)||0;scene.status=scene.status||"draft";
    scene.influence={...influence(plan,planScene),...(scene.influence||{})};
    scene.narrativeMeta=scene.narrativeMeta||{phase:phaseOf(index,manuscript.scenes.length),motif:motifFor(context(plan)).name,carry:`Die Szene „${scene.title}“ hatte eine sichtbare Folge.`,chapterStart:index===0,location:planScene.location||"",consequence:planScene.result||"",hook:""};
  });
  return recalc(manuscript,plan);
}

window.CAPS_ManuscriptEngine={defaults,generate,rewrite,rewriteChapter,recalc,upgrade};
})();
(function(){
"use strict";

const uid=prefix=>`${prefix}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const text=(value,fallback="")=>String(value??"").replace(/\s+/g," ").trim()||fallback;
const list=value=>Array.isArray(value)?value.map(item=>text(item)).filter(Boolean):String(value??"").split(/[,\n]/).map(item=>text(item)).filter(Boolean);
const unique=values=>values.filter((value,index,array)=>value&&array.indexOf(value)===index);
const lower=value=>{const clean=text(value);return clean?clean.charAt(0).toLowerCase()+clean.slice(1):""};

function categoryKey(analysis,profile){
  const source=`${analysis?.category||""} ${profile?.category||""} ${profile?.topic||""}`.toLowerCase();
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

const categorySeeds={
  separation:{
    misbelief:"Wenn eine vertraute Person kurz nicht sichtbar ist, könnte die Verbindung verloren gehen.",
    cost:"Die Hauptfigur kann den nächsten Schritt kaum wahrnehmen, weil die ganze Aufmerksamkeit beim Festhalten bleibt.",
    motif:"ein kleines Rückkehrlicht",rule:"Das Licht bleibt ruhig, wenn ein Abschied klar ist und ein Wiedersehen einen verlässlichen Platz bekommt.",
    outerStakes:"Ohne das Rückkehrlicht finden die Bewohner der Welt ihre vertrauten Wege zueinander nicht mehr.",
    climax:"die letzte Tür selbst öffnen, während die vertraute Begleitfigur am vereinbarten Ort wartet",
    returnEcho:"In einer späteren kleinen Trennung ist das Gefühl noch da, doch die Hauptfigur nutzt den verabredeten Anker und beginnt den nächsten Schritt selbst."
  },
  anger:{
    misbelief:"Nur eine sofortige, starke Reaktion kann zeigen, wie groß das Gefühl ist.",
    cost:"Der schnelle Ausbruch schützt kurz, erschreckt aber andere und macht die eigentliche Lösung schwerer.",
    motif:"eine rotgoldene Sturmfeder",rule:"Die Feder folgt dem Wind, ohne dass der Wind eingesperrt werden muss.",
    outerStakes:"Der Sturm trennt die Wege der Welt voneinander und wird mit jedem hastigen Gegenschlag stärker.",
    climax:"den Sturm sicher umleiten, nachdem die ersten Körpersignale erkannt und eine klare Grenze ausgesprochen wurden",
    returnEcho:"Als die Wut später wieder anklopft, schützt die Hauptfigur zuerst Hände, Füße und andere Menschen und entscheidet dann, was gesagt werden muss."
  },
  fear:{
    misbelief:"Sicher ist nur, wer der schwierigen Situation vollständig ausweicht.",
    cost:"Das Ausweichen bringt schnelle Erleichterung, lässt den befürchteten Ort aber immer größer erscheinen.",
    motif:"eine kleine Weglaterne",rule:"Die Laterne zeigt nie den ganzen Weg, sondern nur den nächsten wirklich sichtbaren Schritt.",
    outerStakes:"Der sichere Pfad verschwindet, wenn niemand mehr nah genug herangeht, um seine Markierungen zu sehen.",
    climax:"den selbst gewählten letzten Abstand überbrücken, ohne dass die Begleitfiguren ziehen oder drängen",
    returnEcho:"Beim nächsten schwierigen Augenblick prüft die Hauptfigur erst den sicheren Abstand und wählt danach selbst, wie nah der nächste Schritt sein darf."
  },
  siblings:{
    misbelief:"Damit das eigene Bedürfnis zählt, muss die Hauptfigur gewinnen oder allein bestimmen.",
    cost:"Je stärker eine Figur festhält, desto weniger können die unterschiedlichen Stärken zusammenwirken.",
    motif:"ein Kompass aus zwei verschiedenfarbigen Hälften",rule:"Der Kompass zeigt nur dann eine Richtung, wenn beide Hälften sichtbar bleiben.",
    outerStakes:"Die Wege der Welt driften auseinander, solange eine Hälfte des Kompasses die andere überdeckt.",
    climax:"beide Hälften gleichzeitig ausrichten, nachdem jede Figur ihr Bedürfnis und ihre Aufgabe klar benannt hat",
    returnEcho:"Beim nächsten kleinen Streit hält die Hauptfigur kurz inne, sagt das eigene Bedürfnis und hört die andere Seite bis zum Ende an."
  },
  confidence:{
    misbelief:"Ein Fehler zeigt, dass die Hauptfigur etwas nicht kann oder nicht gut genug ist.",
    cost:"Wer nur ein perfektes Ergebnis zulässt, beendet Versuche, bevor Erfahrung entstehen kann.",
    motif:"ein Ring aus unvollkommenen Schlüsseln",rule:"Jede sichtbare Kerbe bewahrt eine Information aus einem Versuch.",
    outerStakes:"Das große Tor bleibt geschlossen, solange alle Schlüssel glatt und scheinbar fehlerlos gemacht werden.",
    climax:"die Spuren mehrerer Versuche verbinden und den selbst gebauten Schlüssel benutzen",
    returnEcho:"Als später etwas misslingt, wird der erste Versuch nicht versteckt, sondern als Hinweis für den nächsten betrachtet."
  },
  exclusion:{
    misbelief:"Zugehörigkeit entsteht nur, wenn die Hauptfigur sich kleiner macht oder jeden verletzenden Umgang aushält.",
    cost:"Das Schweigen schützt kurz vor Aufmerksamkeit, lässt aber die Verletzung und die unfairen Regeln bestehen.",
    motif:"eine Klangschale mit vielen unterschiedlichen Tönen",rule:"Kein Ton muss lauter oder kleiner werden, damit das gemeinsame Lied vollständig ist.",
    outerStakes:"Der zentrale Platz verstummt, weil einzelne Stimmen verdrängt und sichere Grenzen nicht geschützt werden.",
    climax:"die verletzende Situation klar benennen, Schutz aktivieren und den eigenen Ton an einem sicheren Platz hörbar machen",
    returnEcho:"In einer späteren Gruppe sucht die Hauptfigur nicht um jeden Preis Zustimmung, sondern eine sichere Person und eine respektvolle Verbindung."
  },
  grief:{
    misbelief:"Weiterleben oder Freude könnten bedeuten, die vermisste Person oder das Verlorene zu vergessen.",
    cost:"Der Versuch, jede Erinnerung unverändert festzuhalten, macht keinen Platz für unterschiedliche Gefühle und neue Augenblicke.",
    motif:"ein warmes Erinnerungslicht",rule:"Das Licht wird nicht kleiner, wenn eine Erinnerung geteilt oder an einen eigenen Platz gestellt wird.",
    outerStakes:"Die Erinnerungslichter verirren sich, solange jedes von ihnen an denselben früheren Ort zurückkehren soll.",
    climax:"jedem Licht einen passenden Platz geben und eine wichtige Erinnerung in eigenen Worten bewahren",
    returnEcho:"Das Vermissen bleibt, doch die Hauptfigur kennt ein Ritual, einen sicheren Menschen und einen Platz für Erinnerung und neue Freude."
  },
  sleep:{
    misbelief:"Ruhe ist nur möglich, wenn alle Gedanken verschwinden und immer neue Sicherheiten hinzukommen.",
    cost:"Jede zusätzliche Bedingung macht den Übergang länger und lässt den Körper wacher werden.",
    motif:"eine Muschel mit einem langsamen Ruheklang",rule:"Der Klang findet zurück, wenn die vertrauten Schritte in derselben einfachen Reihenfolge geschehen.",
    outerStakes:"Die Nachtklänge geraten durcheinander, sodass kein Bewohner der Welt den Weg in die Ruhe findet.",
    climax:"die vertraute Reihenfolge selbst beginnen, während Gedanken und Geräusche noch vorhanden sein dürfen",
    returnEcho:"In einer späteren unruhigen Nacht beginnt die Hauptfigur den ersten vertrauten Schritt, ohne Schlaf erzwingen zu müssen."
  },
  change:{
    misbelief:"Etwas Neues kann nur sicher sein, wenn es sofort genauso wird wie das Vertraute.",
    cost:"Das Festhalten bewahrt Wichtiges, verhindert aber, dass die Hauptfigur im Neuen einen eigenen Platz gestaltet.",
    motif:"eine Karte mit alten und neuen Wegen",rule:"Neue Linien erscheinen erst, wenn Vertrautes benannt und ein neuer Ort in kleinen Teilen erkundet wird.",
    outerStakes:"Die Wege der Welt bleiben voneinander getrennt, solange alte und neue Orte nicht auf derselben Karte stehen dürfen.",
    climax:"eine eigene Verbindung zwischen einem bewahrten alten Ort und einem selbst gewählten neuen Platz einzeichnen",
    returnEcho:"Im neuen Alltag ist noch nicht alles vertraut, aber die Hauptfigur kennt einen eigenen Platz und trägt Wichtiges aus dem Alten weiter."
  },
  generic:{
    misbelief:"Die schwierige Situation lässt sich nur vermeiden oder vollständig kontrollieren.",
    cost:"Die bekannte Reaktion schützt kurz, nimmt der Hauptfigur aber die Möglichkeit, einen eigenen nächsten Schritt zu entdecken.",
    motif:"ein kleines warmes Wegzeichen",rule:"Das Zeichen reagiert auf ehrliche, überschaubare Entscheidungen statt auf perfekte Lösungen.",
    outerStakes:"Der Weg durch die Welt bleibt verborgen, solange alle versuchen, das Problem mit einem einzigen großen Schritt zu lösen.",
    climax:"den entscheidenden kleinen Schritt selbst ausführen und passende Hilfe gezielt annehmen",
    returnEcho:"In einer späteren Alltagssituation erkennt die Hauptfigur das Gefühl früher und wählt den nächsten Schritt in eigenem Tempo."
  }
};

function interestFlavor(brief,world){
  const source=list(brief?.interests).join(" ").toLowerCase();
  if(/weltraum|planet|rakete|stern/.test(source))return {opening:"baut eine kleine Raumstation",helper:"ein neugieriger Sternenfuchs",mechanism:"schwebende Sternenpfade",detail:"leuchtende Planetenringe"};
  if(/dinosaur/.test(source))return {opening:"ordnet Dinosaurierfiguren zu einer Expedition",helper:"ein junger Langhals",mechanism:"Spuren im uralten Tal",detail:"Farnwälder und versteinerte Fußabdrücke"};
  if(/drache/.test(source))return {opening:"zeichnet eine Karte für ein Drachennest",helper:"ein kleiner Wolkendrache",mechanism:"Inseln über den Wolken",detail:"glimmende Schuppen und weiche Wolkenbrücken"};
  if(/meer|ozean|fisch|delfin/.test(source))return {opening:"legt Muscheln zu einem Unterwasserweg",helper:"eine junge Meeresschildkröte",mechanism:"Strömungen und Lichtspuren",detail:"Korallenbögen und wandernde Lichtfische"};
  if(/bagger|baustelle|fahrzeug|auto/.test(source))return {opening:"baut aus Klötzen eine breite Brücke",helper:"ein kleiner gelber Werkstattwagen",mechanism:"bewegliche Brücken und Zahnradwege",detail:"freundliche Maschinen und farbige Baustellenlichter"};
  if(/tier|hund|katze|pferd|wald/.test(source))return {opening:"baut für Tierfiguren einen sicheren Platz",helper:"ein aufmerksames Waldtier",mechanism:"Waldpfade, Gerüche und Spuren",detail:"weiche Mooswege und hohe Blätterdächer"};
  if(/fee|zauber|magie/.test(source))return {opening:"faltet kleine Papiersterne",helper:"eine vorwitzige Lichtfee",mechanism:"Zauberpfade, die auf Entscheidungen reagieren",detail:"schwebende Samenlichter und gläserne Blätter"};
  if(/fußball|sport|ball/.test(source))return {opening:"rollt einen Ball durch selbst gebaute Tore",helper:"ein flinkes kleines Teamtier",mechanism:"bewegliche Spielfelder und Klangtore",detail:"bunte Bänder und federnde Wege"};
  return {opening:"baut auf dem Boden einen eigenen kleinen Ort",helper:"eine unverwechselbare junge Fantasiefigur",mechanism:`die Wege von ${text(world?.name,"der Fantasiewelt")}`,detail:"klare kindliche Formen und ein wiederkehrendes Lichtzeichen"};
}

function characterArcs(characters,profile,seed){
  const hero=characters[0],ally=characters[1],guide=characters[2];
  const heroStrength=text(hero?.strengths?.[0],"Aufmerksamkeit");
  return [
    {
      characterId:hero?.id,name:hero?.name,role:"Hauptfigur",
      openingState:`${hero?.name} nutzt ${lower(heroStrength)} oft erfolgreich, gerät in der schwierigen Situation aber in die Annahme: ${seed.misbelief}`,
      externalWant:`${hero?.name} möchte den äußeren Auftrag erfüllen und dabei Sicherheit oder Kontrolle behalten.`,
      innerNeed:profile.emotionalNeed,
      blindSpot:seed.cost,
      decisiveChoices:["Den Auftrag freiwillig annehmen","Die Folge des alten Musters anerkennen","Den neuen kleinen Schritt selbst wählen","Die entscheidende Handlung im Höhepunkt ausführen"],
      finalState:profile.desiredDevelopment
    },
    {
      characterId:ally?.id,name:ally?.name,role:"Beziehungsfigur",
      openingState:`${ally?.name} möchte helfen, weiß aber noch nicht immer, wann Nähe stärkt und wann Hilfe zu viel übernimmt.`,
      externalWant:`${ally?.name} möchte, dass die Gruppe sicher zusammenbleibt und das äußere Ziel erreicht.`,
      innerNeed:"Zuhören, die eigene Sicht ausdrücken und der Hauptfigur echte Entscheidungsmöglichkeiten lassen.",
      blindSpot:"Zu schnelles Trösten oder Eingreifen kann die Selbstwirksamkeit der Hauptfigur verkleinern.",
      decisiveChoices:["Eine Beobachtung aussprechen","Nach dem ersten Fehlschlag ehrlich reagieren","Beim Höhepunkt den Raum sichern, ohne zu übernehmen"],
      finalState:`${ally?.name} wird zu einer glaubwürdigen Unterstützung, die Verbindung und Eigenständigkeit gleichzeitig ermöglicht.`
    },
    {
      characterId:guide?.id,name:guide?.name,role:"Wegweiserfigur",
      openingState:`${guide?.name} kennt die Regeln der Welt, aber nicht die fertige Lösung für ${hero?.name}.`,
      externalWant:"Die Regeln der Welt schützen und die Gruppe bis zur entscheidenden Prüfung begleiten.",
      innerNeed:"Fragen und Grenzen so einsetzen, dass die Figuren selbst verstehen und handeln.",
      blindSpot:"Eine Erklärung ist noch keine Erfahrung.",
      decisiveChoices:["Nur eine Regel zeigen","Nach dem Rückschlag einen sicheren Rahmen anbieten","Im Höhepunkt bewusst nicht eingreifen"],
      finalState:`${guide?.name} bestätigt konkrete Entscheidungen statt pauschal Mut oder Gehorsam zu loben.`
    }
  ].filter(arc=>arc.name);
}

function makeBeats(ctx,seed,flavor){
  const {brief,characters,profile,world,quest}=ctx;
  const H=characters[0].name,A=characters[1].name,G=characters[2].name,W=world.name,M=seed.motif;
  const concrete=text(profile.concreteSituation,brief.concreteSituation);
  const reaction=text(profile.currentReaction,"Die vertraute Reaktion übernimmt schnell.");
  const support=text(profile.supportiveResponse);
  const strategy=text(profile.copingStrategy);
  const beats=[
    {
      title:"Ein ganz gewöhnlicher Anfang",act:"I",function:"Hauptfigur, Alltag, Wunsch und Beziehung konkret einführen",
      location:"Ein vertrauter Alltagsort",emotion:"vertraut mit einer kleinen Spannung darunter",
      event:`${H} ${flavor.opening}. Dabei wird eine kleine Eigenheit oder Stärke sichtbar, bevor die von den Eltern geschilderte Situation beginnt: ${concrete}`,
      decision:`${H} versucht zunächst, den vertrauten Alltag so fortzusetzen, als ließe sich das unangenehme Gefühl übergehen.`,
      consequence:`Die Reaktion bleibt ungelöst und verändert spürbar die Nähe zwischen ${H} und ${A}.`,
      relationshipShift:`${A} bemerkt mehr, als ${H} im Moment sagen kann.`,
      setup:`Die Stärke von ${H}, ein sicherer Bezugspunkt und ein kleiner Gegenstand aus dem Alltag werden eingeführt.`,
      payoff:"Die Stärke und der sichere Bezugspunkt werden im Höhepunkt auf neue Weise gebraucht.",
      visual:`Konkrete Alltagsszene mit ${H}, ${A} und dem persönlichen Interesse; die schwierige Situation ist in Handlung und Körperhaltung sichtbar.`
    },
    {
      title:"Das Gefühl übernimmt kurz",act:"I",function:"Das Thema ohne Erklärung durch eine konkrete Folge zeigen",
      location:"Derselbe vertraute Ort",emotion:text(profile.feelings?.[0],"angespannt"),
      event:`Die Situation wird einen Schritt schwieriger. ${reaction}`,
      decision:`${H} wählt die bisher vertraute Reaktion, weil sie sofort Sicherheit oder Kontrolle verspricht.`,
      consequence:seed.cost,
      relationshipShift:`${A} reagiert nicht mit Beschämung, ist aber ehrlich davon betroffen, was gerade zwischen ihnen geschieht.`,
      setup:`Ein äußerlich kleines Problem bleibt offen und wird später zum Eingang des Abenteuers.`,
      payoff:"Die Alltagssituation kehrt im Ende in kleiner Form wieder.",
      visual:`Nah an der Hauptfigur: Gesicht, Hände, Abstand zu ${A} und ein konkreter Gegenstand zeigen, was passiert.`
    },
    {
      title:"Der Auftrag wächst aus dem Problem",act:"I",function:"Auslösendes Ereignis organisch mit dem Alltagsthema verbinden",
      location:`Der Übergang nach ${W}`,emotion:"überrascht und vorsichtig neugierig",
      event:`Gerade weil die Alltagssituation ungelöst bleibt, reagiert ${M}: In der vertrauten Umgebung erscheint ein Zugang nach ${W}. Dort braucht ${flavor.helper} Hilfe bei der Aufgabe, ${quest}.`,
      decision:`${H} darf fragen, beobachten und selbst entscheiden, ob der Auftrag angenommen wird.`,
      consequence:`Mit dem freiwilligen Ja entsteht ein klares äußeres Ziel; zugleich wird die vertraute Reaktion mit in das Abenteuer genommen.`,
      relationshipShift:`${A} verspricht Begleitung, aber nicht, jede schwierige Stelle zu lösen.`,
      setup:`${M} und seine Regel werden angedeutet, aber noch nicht vollständig verstanden.`,
      payoff:`Die wirkliche Regel des Motivs entscheidet später den Höhepunkt.`,
      visual:`Der magische Übergang entsteht aus einem Gegenstand oder Detail der Alltagsszene, nicht zufällig aus dem Nichts.`
    },
    {
      title:"Die Schwelle und die Regeln",act:"I",function:"Warum Umkehren die innere und äußere Aufgabe nicht löst",
      location:`Am Eingang von ${W}`,emotion:"Staunen und vorsichtige Anspannung",
      event:`${G} zeigt nur die erste Regel: ${seed.rule} Die Gruppe erfährt außerdem: ${seed.outerStakes}`,
      decision:`${H} entscheidet, den ersten überschaubaren Abschnitt selbst zu versuchen.`,
      consequence:`Der Rückweg bleibt grundsätzlich sicher, doch bloßes Umkehren würde den begonnenen Auftrag und die offene Beziehungssituation unverändert lassen.`,
      relationshipShift:`Die Gruppe vereinbart, wie Hilfe angeboten und angenommen wird.`,
      setup:"Die Grenze zwischen hilfreicher Begleitung und Übernahme wird festgelegt.",
      payoff:"Im Höhepunkt halten die anderen genau diese Grenze ein.",
      visual:`Die Figuren stehen an einer klaren Schwelle; Rückweg und neuer Weg sind beide sichtbar, sodass die Entscheidung freiwillig wirkt.`
    },
    {
      title:"Die Stärke trägt ein Stück",act:"IIA",function:"Ersten Fortschritt aus einer echten Stärke der Hauptfigur entstehen lassen",
      location:`Auf den ersten Wegen von ${W}`,emotion:"wach und zuversichtlich",
      event:`Eine erste Aufgabe nutzt ${text(characters[0].strengths?.[0],"die besondere Aufmerksamkeit")} von ${H}. ${flavor.mechanism} reagieren sichtbar darauf.`,
      decision:`${H} übernimmt einen klaren Teil der Aufgabe und lässt ${A} einen anderen Teil beobachten.`,
      consequence:`Die Gruppe kommt voran. Der frühe Erfolg verführt ${H} jedoch zu glauben, dass dieselbe Stärke allein für jede Prüfung genügt.`,
      relationshipShift:`${A} erlebt, dass ein eigener Beitrag willkommen sein kann, aber noch nicht wirklich gleichwertig ist.`,
      setup:`Eine kleine Beobachtung von ${A} bleibt zunächst ungenutzt.`,
      payoff:`Genau diese Beobachtung wird im Höhepunkt unverzichtbar.`,
      visual:`Dynamische Handlung mit klar verteilten Aufgaben; ${flavor.detail}.`
    },
    {
      title:"Der alte Weg wird zu eng",act:"IIA",function:"Bisheriges Muster aktiv und nachvollziehbar scheitern lassen",
      location:"An einer zweiten, deutlich schwierigeren Prüfung",emotion:"entschlossen, dann zunehmend überfordert",
      event:`Die nächste Aufgabe ähnelt dem Alltagsthema stärker. ${H} versucht, sie mit der bisherigen Reaktion zu lösen: ${reaction}`,
      decision:`Warnzeichen und die Beobachtung von ${A} werden übergangen, weil eine schnelle Lösung sicherer erscheint.`,
      consequence:`Der Versuch verschlechtert die äußere Lage und beschädigt zugleich Vertrauen oder Zusammenarbeit. Das Scheitern ist eine direkte Folge der Entscheidung, kein Zufall.`,
      relationshipShift:`${A} fühlt sich nicht gehört; ${H} fühlt sich allein verantwortlich.`,
      setup:`${M} reagiert unruhig und zeigt, dass seine Regel missverstanden wurde.`,
      payoff:`Beim zweiten Versuch wird dieselbe Regel bewusst anders angewendet.`,
      visual:`Eine klare Ursache-Wirkungs-Szene: Die konkrete Handlung von ${H} verändert Weg, Motiv und Abstand der Figuren sichtbar.`
    },
    {
      title:"Die Folge darf weh tun",act:"IIB",function:"Konsequenz erleben, ohne Schuld oder Moralpredigt",
      location:"Ein geschützter Ruheort nach dem Fehlschlag",emotion:"enttäuscht, traurig oder beschämt",
      event:`Die Gruppe muss anhalten. Das äußere Ziel ist weiter entfernt, und zwischen ${H} und ${A} ist etwas offen geblieben.`,
      decision:`Statt sofort weiterzumachen, bleibt ${H} bei der unangenehmen Folge und hört, wie ${A} die Situation erlebt hat.`,
      consequence:`Das Gefühl wird nicht beseitigt, aber es bekommt Sprache, Zeit und einen sicheren Rahmen.`,
      relationshipShift:`Zum ersten Mal wird nicht nur über die Aufgabe, sondern über das Miteinander gesprochen.`,
      setup:`${G} stellt eine Frage, die keine fertige Antwort enthält.`,
      payoff:`${H} formuliert später selbst, welche Hilfe wirklich gebraucht wird.`,
      visual:`Ruhige Szene auf Augenhöhe: Abstand, Blickkontakt und kleine Gesten zeigen Verletzung und beginnende Reparatur.`
    },
    {
      title:"Die andere Sicht verändert die Geschichte",act:"IIB",function:"Beziehungsreparatur und innere Erkenntnis verbinden",
      location:"Am geschützten Ruheort",emotion:"verletzlich, dann vorsichtig erleichtert",
      event:`${A} erzählt die bisher übersehene Beobachtung. ${H} erkennt: ${seed.misbelief} war verständlich, aber nicht die einzige mögliche Deutung.`,
      decision:`${H} entschuldigt sich für die konkrete Handlung und bittet ${A}, die Beobachtung noch einmal vollständig zu zeigen.`,
      consequence:`Die Beziehung wird nicht durch eine schnelle Entschuldigung repariert, sondern durch Zuhören und eine neue Vereinbarung.`,
      relationshipShift:`${A} wird von einer Hilfsfigur zu einer Figur mit eigener Stimme und unverzichtbarem Wissen.`,
      setup:`Die Gruppe benennt ein sichtbares Zeichen, an dem sie künftig innehalten will.`,
      payoff:`Dieses Zeichen erscheint unmittelbar vor dem Höhepunkt.`,
      visual:`Zuerst getrennte Körperrichtungen, danach gemeinsames Betrachten desselben kleinen Details.`
    },
    {
      title:"Ein Plan, der zu allen passt",act:"IIB",function:"Psychologische Strategie in konkrete Abenteuerhandlung übersetzen",
      location:"An einem Ort, an dem der Weg neu geordnet werden kann",emotion:"konzentriert und hoffnungsvoll",
      event:`Die Gruppe übersetzt die hilfreiche Strategie in eine konkrete Reihenfolge: ${strategy}`,
      decision:`${H} bestimmt selbst, welcher Schritt zuerst machbar ist und welche Unterstützung von ${A} und ${G} gebraucht wird.`,
      consequence:`Der Plan wird langsamer, aber nachvollziehbar. Jede Figur erhält eine Aufgabe, die zu ihrer Stärke passt.`,
      relationshipShift:`Hilfe wird verhandelbar: anbieten, annehmen, ablehnen und später erneut fragen.`,
      setup:`Der neue Ablauf wird an einer kleinen ungefährlichen Stelle vorbereitet.`,
      payoff:`Die Reihenfolge bleibt im Höhepunkt dieselbe, obwohl die Belastung größer ist.`,
      visual:`Die Figuren ordnen konkrete Gegenstände, Wege oder Zeichen; jede Aufgabe ist bildlich unterscheidbar.`
    },
    {
      title:"Der kleine Beweis",act:"IIB",function:"Selbstwirksamkeit vor dem Höhepunkt glaubwürdig aufbauen",
      location:"Eine kleine Übungsprüfung",emotion:"angespannt, dann überrascht und stolz",
      event:`${H} erprobt den neuen Ablauf in einer überschaubaren Situation. Das Gefühl bleibt vorhanden, aber die Aufgabe ist klein genug für eine echte eigene Entscheidung.`,
      decision:`${H} nutzt den ersten Schritt und fordert nur die zuvor vereinbarte Hilfe an.`,
      consequence:`Ein begrenzter Erfolg entsteht. Er löst nicht die ganze Reise, beweist aber, dass ein anderer Weg möglich ist.`,
      relationshipShift:`${A} benennt konkret, was ${H} selbst getan hat, statt pauschal Mut zu loben.`,
      setup:`${M} zeigt erstmals ruhig die Richtung zum Zentrum der Welt.`,
      payoff:`Im Höhepunkt erkennt ${H} dieselbe ruhige Reaktion wieder.`,
      visual:`Kleine sichtbare Aufgabe, glaubwürdige Erleichterung und kein übertriebener Triumph.`
    },
    {
      title:"Als es noch einmal schwerer wird",act:"IIC",function:"Rückfall normalisieren und den neuen Weg belastbar machen",
      location:"Vor dem Zentrum der großen Prüfung",emotion:"frustriert und verunsichert",
      event:`Die neue Situation bündelt mehrere Auslöser. Unter Druck kehrt die alte Reaktion kurz zurück.`,
      decision:`${H} bricht den Versuch ab oder handelt zu schnell; diesmal wird das Muster jedoch früher erkannt.`,
      consequence:`Die Gruppe verliert Zeit oder einen Teil des Weges, aber nicht alles Gelernte. Der Rückschritt wird zu Information statt zum Beweis des Scheiterns.`,
      relationshipShift:`${A} und ${G} halten die vereinbarten Grenzen, auch wenn Eingreifen schneller wäre.`,
      setup:`Das früh vereinbarte Innehaltezeichen taucht wieder auf.`,
      payoff:`${H} nutzt das Zeichen im nächsten Beat selbstständig.`,
      visual:`Größere Prüfung, alte Körperreaktion und sichtbares Innehaltezeichen; ein früher Erfolg bleibt im Bild vorhanden.`
    },
    {
      title:"Alles läuft in einer Entscheidung zusammen",act:"III",function:"Höhepunkt kausal vorbereiten",
      location:"Direkt vor der entscheidenden Stelle",emotion:"angespannt, aber orientiert",
      event:`Die äußeren Regeln, die Beobachtung von ${A}, die Grenze von ${G}, die Stärke von ${H} und der neue Ablauf werden gleichzeitig gebraucht.`,
      decision:`${H} sagt selbst, welche Hilfe jetzt nötig ist, und welche Handlung allein ausgeführt werden soll.`,
      consequence:`Die Gruppe erreicht den letzten Abschnitt. Niemand kann die entscheidende Wahl stellvertretend treffen.`,
      relationshipShift:`Vertrauen zeigt sich als konkrete Arbeitsteilung, nicht als bloße Aussage.`,
      setup:`Alle frühen Setups – Stärke, Beobachtung, Motivregel und sicherer Bezugspunkt – sind sichtbar bereit.`,
      payoff:"Der Höhepunkt kann nur funktionieren, weil diese Elemente zuvor erlebt und verändert wurden.",
      visual:`Klare räumliche Rollen: ${H} im Zentrum der Entscheidung, ${A} und ${G} sichern unterschiedliche Bereiche.`
    },
    {
      title:"Die entscheidende Handlung",act:"III",function:"Äußere Lösung aus innerer Entwicklung und Beziehung entstehen lassen",
      location:"Im Zentrum der großen Prüfung",emotion:"mutig trotz weiterhin spürbarer Unsicherheit",
      event:`Die letzte Prüfung aktiviert das alte Muster ein letztes Mal. Gleichzeitig zeigt ${M}, dass seine wirkliche Regel verstanden wurde.`,
      decision:`${H} entscheidet sich, ${seed.climax}. Dabei werden die Stärke von ${H}, die Beobachtung von ${A} und die Grenze von ${G} verbunden.`,
      consequence:`Der äußere Auftrag gelingt gerade wegen der neuen Handlungsweise. Keine Wunderfigur und kein Zufall löst den Konflikt.`,
      relationshipShift:`Die Figuren erleben sich als Team, ohne ihre unterschiedlichen Aufgaben und Bedürfnisse zu verlieren.`,
      setup:"Der im Anfang eingeführte sichere Bezugspunkt wird als innere oder äußere Erinnerung genutzt.",
      payoff:`${M} erfüllt die im ersten Akt vorbereitete Funktion vollständig.`,
      visual:`Die entscheidende Handlung ist auf einen Blick verständlich; Ursache und Wirkung sind im selben Bild sichtbar.`
    },
    {
      title:"Zurück – aber nicht wieder am Anfang",act:"III",function:"Nachklang, realistische Auflösung und Alltagstransfer",
      location:"Rückweg und vertrauter Alltag",emotion:"erleichtert, warm und ehrlich",
      event:`Nach dem Erfolg benennen die Figuren konkrete Entscheidungen und ruhen sich aus. Danach kehren sie in die Alltagssituation des Anfangs zurück.`,
      decision:`${H} bewahrt ${M} als Erinnerung, nicht als magische Lösung, und entscheidet selbst, was beim nächsten Mal ausprobiert werden soll.`,
      consequence:`${profile.realisticSuccess} ${seed.returnEcho}`,
      relationshipShift:`${H} und ${A} erkennen frühere Warnzeichen und können Verbindung reparieren, ohne dass das Problem für immer verschwunden sein muss.`,
      setup:`Die konkrete Alltagssituation und der Gegenstand aus Beat 1 kehren wieder.`,
      payoff:`Der Unterschied wird nicht erklärt, sondern in einer kleineren neuen Handlung sichtbar.`,
      visual:`Echo des Anfangs mit ähnlichem Ort und Gegenstand, aber veränderter Handlung, Körperhaltung und Beziehung.`
    }
  ];
  beats.forEach((beat,index)=>{
    beat.id=uid("BEAT");beat.number=index+1;
    beat.because=index===0?`Die Geschichte beginnt in einer konkreten Alltagssituation von ${H}.`:beats[index-1].consequence;
    beat.therefore=beat.consequence;
    beat.nextQuestion=index===beats.length-1?"Wie zeigt sich die Veränderung später im Alltag?":`Welche Entscheidung folgt aus „${beat.consequence}“?`;
  });
  return beats;
}

function quality(treatment){
  const beats=treatment.beats||[];
  const decisions=beats.filter(beat=>text(beat.decision).length>20).length;
  const causal=beats.slice(1).every((beat,index)=>beat.because===beats[index].consequence);
  const checks=[
    {label:"Konkreter Anfang",passed:text(treatment.openingSituation).length>40,detail:treatment.openingSituation},
    {label:"Eigenes Ziel der Hauptfigur",passed:text(treatment.protagonist.externalWant).length>30,detail:treatment.protagonist.externalWant},
    {label:"Auslöser wächst aus dem Thema",passed:text(treatment.incitingIncident).length>40,detail:treatment.incitingIncident},
    {label:"Durchgehende Ursache und Wirkung",passed:causal,detail:`${Math.max(0,beats.length-1)} Übergänge mit WEIL/DESHALB-Verknüpfung`},
    {label:"Entscheidungen statt Zufälle",passed:decisions>=10,detail:`${decisions} klare Figurenentscheidungen`},
    {label:"Erster Versuch hat eine Folge",passed:beats.some(beat=>/alte Weg|bisherige Reaktion|vertraute Reaktion/i.test(`${beat.title} ${beat.event}`)),detail:"Das bisherige Muster scheitert nachvollziehbar."},
    {label:"Beziehung verändert die Handlung",passed:beats.filter(beat=>text(beat.relationshipShift).length>25).length>=10,detail:"Beziehungsentwicklung ist in den Beats verankert."},
    {label:"Setups werden bezahlt",passed:beats.every(beat=>text(beat.setup)&&text(beat.payoff)),detail:"Motiv, Beobachtung, Stärke und Grenzen besitzen Vorbereitung und Auszahlung."},
    {label:"Vorbereiteter Höhepunkt",passed:/wegen|gerade|verbunden|zuvor/i.test(treatment.climax.logic),detail:treatment.climax.logic},
    {label:"Realistisches Ende",passed:text(treatment.ending.everydayEcho).length>40,detail:treatment.ending.everydayEcho}
  ];
  return {score:Math.round(checks.filter(check=>check.passed).length/checks.length*100),checks};
}

function generate(input){
  const brief=input?.brief||{};
  const analysis=input?.analysis||{};
  const characters=input?.characters||[];
  const profile=input?.profile||analysis.profile||{};
  const world=input?.world||{name:text(analysis?.story?.world,"der Fantasiewelt"),locations:[]};
  const quest=text(input?.quest||analysis?.story?.quest,"einen wichtigen Auftrag zu erfüllen");
  const hero=characters[0]||{name:"Hauptfigur",strengths:[]};
  const ally=characters[1]||hero;
  const guide=characters[2]||ally;
  const seed=categorySeeds[categoryKey(analysis,profile)]||categorySeeds.generic;
  const flavor=interestFlavor(brief,world);
  const ctx={brief,analysis,characters:[hero,ally,guide],profile,world,quest};
  const beats=makeBeats(ctx,seed,flavor);
  const treatment={
    schemaVersion:"1.0",
    generatedAt:new Date().toISOString(),
    generator:"CAPS Story Treatment Engine 1.0",
    premise:`${hero.name} wird aus einer vertrauten Alltagssituation in ${world.name} geführt, um ${quest}. Der äußere Auftrag kann nur gelingen, wenn die bisherige Reaktion eine sichtbare Folge hat, Beziehungen repariert werden und ${hero.name} einen eigenen neuen Handlungsschritt entwickelt.`,
    openingSituation:beats[0].event,
    storyQuestion:`Kann ${hero.name} ${quest}, ohne dass die vertraute Reaktion erneut die Handlung und die Beziehung zu ${ally.name} bestimmt?`,
    protagonist:{
      name:hero.name,
      externalWant:`${hero.name} möchte ${quest} und dabei die eigene Sicherheit sowie die Verbindung zu ${ally.name} bewahren.`,
      internalNeed:text(profile.emotionalNeed,"Sicherheit, Verständnis und eigener Handlungsspielraum."),
      falseBelief:seed.misbelief,
      strength:text(hero.strengths?.[0],"Aufmerksamkeit"),
      blindSpot:seed.cost,
      transformation:text(profile.desiredDevelopment)
    },
    incitingIncident:beats[2].event,
    stakes:{external:seed.outerStakes,emotional:`Wenn ${hero.name} nur am bisherigen Muster festhält, bleibt ${seed.cost.toLowerCase()}`,relationship:`Die Beziehung zu ${ally.name} wird enger oder ehrlicher, wenn beide Bedürfnisse und Aufgaben sichtbar werden.`},
    cannotTurnBack:`${hero.name} könnte körperlich umkehren, erkennt aber, dass weder der äußere Auftrag noch die offene Alltagssituation dadurch gelöst wären. Die Fortsetzung bleibt eine freiwillige Entscheidung.`,
    motif:{name:seed.motif,rule:seed.rule,setup:beats[2].setup,development:beats[5].setup,payoff:beats[12].payoff},
    characterArcs:characterArcs([hero,ally,guide],profile,seed),
    beats,
    climax:{action:beats[12].decision,logic:`Der Höhepunkt gelingt wegen der zuvor aufgebauten Stärke, der Beobachtung von ${ally.name}, der klaren Unterstützungsgrenze und des geübten kleinen Schrittes – nicht durch Zufall oder Rettung von außen.`,result:beats[12].consequence},
    ending:{resolution:beats[13].consequence,everydayEcho:seed.returnEcho,emotionalAftertaste:text(profile.parentMessage,"Du bist mit deinem Gefühl nicht allein und kannst einen eigenen nächsten Schritt finden.")},
    continuityFacts:[
      `${seed.motif} folgt immer derselben Regel: ${seed.rule}`,
      `${hero.name} trifft die entscheidenden Wahlen selbst.`,
      `${ally.name} besitzt eine Beobachtung oder Fähigkeit, die im Höhepunkt unverzichtbar wird.`,
      `${guide.name} erklärt Regeln, löst aber keine Prüfung stellvertretend.`,
      "Das schwierige Gefühl darf bis zum Ende wiederkehren und wird nicht magisch entfernt.",
      "Jede Verschlechterung und Verbesserung entsteht aus einer sichtbaren Handlung."
    ]
  };
  treatment.qualityReport=quality(treatment);
  return treatment;
}

function allocateScenes(total,beatCount){
  const counts=Array.from({length:beatCount},()=>1);
  const priority=[12,5,8,10,4,7,6,11,2,3,9,13,1,0];
  let remaining=Math.max(0,total-beatCount),round=0;
  while(remaining>0){
    const index=priority[round%priority.length];
    if(index<beatCount&&counts[index]<3){counts[index]++;remaining--}
    round++;
    if(round>200)break;
  }
  return counts;
}

function sceneParts(beat,count){
  if(count===1)return [{title:beat.title,goal:beat.event,conflict:`Die Entscheidung ist schwierig, weil ${lower(beat.because)}`,decision:beat.decision,result:beat.consequence,hook:beat.nextQuestion,segment:"vollständig"}];
  if(count===2)return [
    {title:beat.title,goal:beat.event,conflict:`Die Lage entsteht, weil ${lower(beat.because)}`,decision:"Die Figuren müssen zunächst verstehen, was sich verändert hat.",result:`Die Entscheidung wird unausweichlich: ${beat.decision}`,hook:"Wie wird die Figur tatsächlich handeln?",segment:"Aufbau"},
    {title:`${beat.title} – die Folge`,goal:beat.decision,conflict:"Der vertraute oder einfachere Weg bleibt verlockend.",decision:beat.decision,result:beat.consequence,hook:beat.nextQuestion,segment:"Entscheidung und Folge"}
  ];
  return [
    {title:beat.title,goal:beat.event,conflict:`Die Lage entsteht, weil ${lower(beat.because)}`,decision:"Die Figuren beobachten und ordnen die neue Lage.",result:"Der Druck auf die nächste Entscheidung wächst.",hook:"Welche Wahl ist jetzt möglich?",segment:"Aufbau"},
    {title:`${beat.title} – unter Druck`,goal:`Die Figuren versuchen, die Situation zu bewältigen, während ${lower(beat.event)}`,conflict:"Der einfachste Weg würde das bisherige Muster wiederholen.",decision:beat.decision,result:"Die Entscheidung verändert die äußere Lage sofort.",hook:"Welche Folge hat diese Wahl?",segment:"Entscheidung"},
    {title:`${beat.title} – was daraus folgt`,goal:"Die Figuren müssen mit der entstandenen Folge weiterhandeln.",conflict:"Die Folge kann nicht zurückgenommen, sondern nur verstanden und beantwortet werden.",decision:"Die Figuren nehmen die Konsequenz an und richten den nächsten Schritt danach aus.",result:beat.consequence,hook:beat.nextQuestion,segment:"Konsequenz"}
  ];
}

function chapterDefinitions(treatment){
  const motif=treatment.motif.name;
  return [
    {title:"Bevor etwas Besonderes geschah",beatStart:1,beatEnd:2,purpose:"Hauptfigur, Alltag, Beziehung und das konkrete Problem einführen"},
    {title:`Der Auftrag von ${motif}`,beatStart:3,beatEnd:4,purpose:"Auslöser, äußeres Ziel, freiwillige Entscheidung und Regeln der Welt"},
    {title:"Der erste Weg",beatStart:5,beatEnd:6,purpose:"Stärke zeigen und das alte Muster mit einer natürlichen Folge scheitern lassen"},
    {title:"Was zwischen ihnen geschah",beatStart:7,beatEnd:8,purpose:"Gefühl, Konsequenz, Beziehungskonflikt und ehrliche Reparatur"},
    {title:"Ein anderer Plan",beatStart:9,beatEnd:10,purpose:"Neue Strategie konkret planen und in kleiner Form erproben"},
    {title:"Als es wieder schwer wurde",beatStart:11,beatEnd:12,purpose:"Rückschritt, Vorbereitung des Höhepunkts und selbstbestimmte Hilfe"},
    {title:"Die entscheidende Handlung",beatStart:13,beatEnd:13,purpose:"Äußere Aufgabe durch die vorbereitete innere und relationale Veränderung lösen"},
    {title:"Nicht wieder am Anfang",beatStart:14,beatEnd:14,purpose:"Nachklang, Rückkehr und realistischer Alltagstransfer"}
  ];
}

function toPlan(treatment,totalScenes=20){
  const beats=treatment.beats||[];
  const sceneCount=Math.max(beats.length,Math.min(25,Number(totalScenes)||20));
  const allocations=allocateScenes(sceneCount,beats.length);
  const chapterDefs=chapterDefinitions(treatment);
  const chapters=chapterDefs.map((definition,index)=>({id:uid("CH"),number:index+1,title:definition.title,purpose:definition.purpose,endingHook:"",sceneIds:[],beatStart:definition.beatStart,beatEnd:definition.beatEnd}));
  const scenes=[];
  beats.forEach((beat,beatIndex)=>{
    const chapter=chapters.find(item=>beat.number>=item.beatStart&&beat.number<=item.beatEnd)||chapters[chapters.length-1];
    const parts=sceneParts(beat,allocations[beatIndex]);
    parts.forEach((part,partIndex)=>{
      const number=scenes.length+1;
      const scene={
        id:uid("SCENE"),number,chapterId:chapter.id,chapterNumber:chapter.number,
        title:part.title,pages:[number*2-1,number*2],location:beat.location,
        characters:unique(treatment.characterArcs.map(arc=>arc.name)),focusCharacter:beat.number===8?treatment.characterArcs[1]?.name:treatment.protagonist.name,
        emotionalState:beat.emotion,psychologicalFunction:beat.function,
        goal:part.goal,conflict:part.conflict,decision:part.decision,result:part.result,
        copingStrategy:treatment.protagonist.transformation,supportiveResponse:treatment.characterArcs[1]?.finalState||"",
        illustrationIdea:beat.visual,messageMoment:beat.number>=7,
        storyPurpose:`${beat.function}. Diese Szene ist Teil ${partIndex+1} von ${parts.length} des Treatmentschritts ${beat.number}.`,
        endingHook:part.hook,treatmentBeatId:beat.id,treatmentBeatNumber:beat.number,treatmentSegment:part.segment,
        causality:{because:beat.because,therefore:beat.therefore},
        continuityIn:beat.because,continuityOut:part.result,setup:beat.setup,payoff:beat.payoff,relationshipShift:beat.relationshipShift
      };
      scenes.push(scene);chapter.sceneIds.push(scene.id);chapter.endingHook=part.hook;
    });
  });
  return {chapters,scenes};
}

window.CAPS_StoryTreatmentEngine={generate,toPlan,quality};
})();
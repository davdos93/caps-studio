(function(){
"use strict";

const uid=prefix=>`${prefix}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const text=(value,fallback="")=>String(value??"").trim()||fallback;
const list=value=>Array.isArray(value)?value.map(x=>String(x).trim()).filter(Boolean):String(value??"").split(/[\n,]/).map(x=>x.trim()).filter(Boolean);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const Treatment=window.CAPS_StoryTreatmentEngine;

function normalizeCharacter(character,index,childAge){
  return {
    id:character.id||uid("CHAR"),
    name:text(character.name,index===0?"Hauptfigur":`Figur ${index+1}`),
    role:text(character.role,index===0?"Hauptfigur":"Begleitfigur"),
    age:text(character.age,childAge),
    strengths:list(character.strengths),
    challenge:text(character.challenge),
    development:text(character.development),
    description:text(character.description),
    relationship:text(character.relationship),
    appearanceDescription:text(character.appearanceDescription),
    hairColor:text(character.hairColor),
    hairstyle:text(character.hairstyle),
    eyeColor:text(character.eyeColor),
    clothing:text(character.clothing),
    accessories:text(character.accessories),
    specialFeatures:text(character.specialFeatures)
  };
}

const keywordScore=(source,patterns)=>patterns.reduce((score,pattern)=>score+(source.includes(pattern)?1:0),0);
const numberFromAge=value=>{
  const match=String(value??"").match(/\d+/);
  return match?Number(match[0]):5;
};
const topicProfiles=[
  {
    id:"separation",label:"Trennung und Übergänge",
    patterns:["trennung","abschied","kindergarten","kita","schule","mama geht","papa geht","allein bleiben","abgeben","übergang"],
    feelings:["Angst","Unsicherheit","Sehnsucht"],
    reaction:"Das Kind sucht sofort Nähe, möchte die Situation verlassen oder braucht wiederholt die Sicherheit, dass die vertraute Person zurückkommt.",
    need:"Verlässlichkeit, Orientierung und eine spürbare Verbindung zu einer vertrauten Person.",
    development:"Die Hauptfigur erlebt, dass Abschied und Verbindung gleichzeitig möglich sind, und findet einen eigenen kleinen Übergangsschritt.",
    strategy:"Das Gefühl wahrnehmen, einen vertrauten Anker nutzen, den nächsten Ablauf kennen und sich einer sicheren Bezugsperson zuwenden.",
    support:"Die Begleitfigur bleibt ruhig, benennt klar, was als Nächstes geschieht, verabschiedet sich verlässlich und verschwindet nicht heimlich.",
    success:"Das schwierige Gefühl ist noch vorhanden, aber die Hauptfigur kann den Übergang mit einem selbstgewählten Ritual bewältigen und später wieder Verbindung aufnehmen.",
    message:"Auch wenn jemand kurz nicht sichtbar ist, bleibt die Verbindung bestehen und Wiedersehen ist verlässlich.",
    title:"{H} und das Licht, das wiederkehrt",
    world:"Der Garten der leisen Türen",
    worldType:"Magisches Übergangsabenteuer",
    quest:"das verschwundene Rückkehrlicht wiederzufinden"
  },
  {
    id:"anger",label:"Wut und starke Gefühle",
    patterns:["wut","wütend","ausrasten","schlagen","beißen","treten","schreien","frust","toben","explodiert"],
    feelings:["Wut","Frust","Überforderung"],
    reaction:"Das Gefühl wird sehr schnell groß; das Kind wird laut, körperlich oder kann in diesem Moment kaum noch zuhören.",
    need:"Sicherheit, körperliche Entlastung und die Erfahrung, dass starke Gefühle erlaubt sind, ohne andere zu verletzen.",
    development:"Die Hauptfigur erkennt frühe Körpersignale und entdeckt mehrere sichere Möglichkeiten, bevor die Wut alles bestimmt.",
    strategy:"Kurz Abstand schaffen, den Körper sicher entladen, das Gefühl benennen und erst danach eine kleine Entscheidung treffen.",
    support:"Die Begleitfigur schützt alle Beteiligten ruhig, setzt eine klare Grenze gegen Verletzungen und bleibt emotional erreichbar.",
    success:"Die Wut verschwindet nicht für immer, aber die Hauptfigur bemerkt sie früher und kann eine sichere Handlung wählen.",
    message:"Wut darf da sein; sie muss nicht entscheiden, was Hände, Füße oder Worte tun.",
    title:"{H} und der Sturm im Funkenwald",
    world:"Der Funkenwald",
    worldType:"Magisches Naturabenteuer",
    quest:"den wilden Sturmsee zu durchqueren, ohne den Sturm einzusperren"
  },
  {
    id:"fear",label:"Angst und Vermeidung",
    patterns:["angst","fürcht","furcht","dunkel","monster","arzt","zahnarzt","hund","gewitter","traut sich nicht","vermeidet"],
    feelings:["Angst","Unsicherheit","Anspannung"],
    reaction:"Das Kind möchte der Situation ausweichen, sucht schnelle Sicherheit oder stellt wiederholt Fragen, bevor es einen Schritt wagt.",
    need:"Schutz, Vorhersagbarkeit und die Freiheit, sich einer Herausforderung in kleinen Schritten zu nähern.",
    development:"Die Hauptfigur lernt, dass Mut nicht Angstfreiheit bedeutet, sondern eine selbstgewählte Bewegung trotz eines spürbaren Gefühls.",
    strategy:"Gefahr und Gefühl unterscheiden, einen sicheren Abstand wählen, beobachten und den kleinsten machbaren Schritt selbst bestimmen.",
    support:"Die Begleitfigur nimmt die Angst ernst, drängt nicht und hilft, die Situation in überschaubare Schritte zu teilen.",
    success:"Die Hauptfigur muss nicht alles schaffen, kann aber einen vorher unmöglichen kleinen Schritt selbst ausführen.",
    message:"Angst darf mitkommen, während du in deinem Tempo entscheidest, wie nah du dich heranwagst.",
    title:"{H} und der Weg hinter dem leisen Tor",
    world:"Das Tal hinter dem leisen Tor",
    worldType:"Fantasievolles Entdeckungsabenteuer",
    quest:"den verlorenen Wegweiser durch das Tal zurückzubringen"
  },
  {
    id:"siblings",label:"Geschwister, Eifersucht und Teilen",
    patterns:["geschwister","bruder","schwester","eifersucht","baby","teilen","streit","wegnehmen","bevorzugt","aufmerksamkeit"],
    feelings:["Eifersucht","Wut","Traurigkeit","Wunsch nach Zugehörigkeit"],
    reaction:"Das Kind versucht Aufmerksamkeit, Besitz oder Kontrolle zu sichern und erlebt die Bedürfnisse des anderen schnell als Konkurrenz.",
    need:"Zugehörigkeit, eigene ungeteilte Aufmerksamkeit und die Erfahrung, dass Unterschiede keinen Verlust von Liebe bedeuten.",
    development:"Die Hauptfigur lernt, eigene Bedürfnisse auszudrücken, Grenzen zu achten und Zusammenarbeit nicht mit Selbstaufgabe zu verwechseln.",
    strategy:"Das eigene Bedürfnis benennen, eine klare Grenze oder Bitte formulieren und danach eine faire gemeinsame Lösung suchen.",
    support:"Die Begleitfigur vergleicht die Kinder nicht, hört beide Seiten und sorgt dafür, dass jedes Bedürfnis sichtbar werden darf.",
    success:"Der Konflikt kommt erneut vor, doch die Figuren können ihn früher benennen und ohne Gewinner oder Verlierer reparieren.",
    message:"Liebe und Zugehörigkeit werden nicht kleiner, wenn mehrere Menschen wichtig sind.",
    title:"{H} und das geteilte Sternenlicht",
    world:"Die Inseln des geteilten Lichts",
    worldType:"Magisches Teamabenteuer",
    quest:"die getrennten Hälften des Sternenkompasses wieder zusammenzuführen"
  },
  {
    id:"confidence",label:"Selbstvertrauen, Fehler und Leistungsdruck",
    patterns:["fehler","perfekt","versagen","kann nicht","schüchtern","selbstvertrauen","leistung","aufgeben","traut","schafft es nicht","ausgelacht"],
    feelings:["Unsicherheit","Scham","Frust"],
    reaction:"Das Kind vermeidet den Versuch, gibt schnell auf oder möchte etwas nur tun, wenn ein perfektes Ergebnis sicher scheint.",
    need:"Annahme unabhängig von Leistung und Erfahrungen, in denen Üben, Fehler und Hilfe selbstverständlich dazugehören.",
    development:"Die Hauptfigur trennt den eigenen Wert vom Ergebnis und erlebt Fortschritt als Folge von Versuchen statt Perfektion.",
    strategy:"Die Aufgabe verkleinern, einen Versuch als Experiment betrachten, hilfreiche Rückmeldung annehmen und den nächsten Schritt wählen.",
    support:"Die Begleitfigur lobt konkrete Anstrengung und Beobachtung, übernimmt die Aufgabe aber nicht und bewertet keinen Fehler als Versagen.",
    success:"Die Hauptfigur erreicht kein perfektes Ergebnis, kann aber sichtbar weiterarbeiten und den eigenen Fortschritt erkennen.",
    message:"Dein Wert hängt nicht davon ab, ob etwas sofort gelingt.",
    title:"{H} und die sieben unperfekten Schlüssel",
    world:"Die Werkstatt der wandernden Schlüssel",
    worldType:"Erfinderisches Rätselabenteuer",
    quest:"sieben unperfekte Schlüssel so zu verbinden, dass sich das große Tor öffnet"
  },
  {
    id:"exclusion",label:"Ausgrenzung und soziale Unsicherheit",
    patterns:["mobb","ausgeschlossen","gehänselt","ärgern","auslachen","keine freunde","darf nicht mitspielen","ignoriert"],
    feelings:["Traurigkeit","Scham","Wut","Unsicherheit"],
    reaction:"Das Kind zieht sich zurück, passt sich stark an oder reagiert heftig, um den sozialen Schmerz schnell zu beenden.",
    need:"Schutz, glaubwürdige Verbündete und die Erfahrung, dass Zugehörigkeit nicht durch Selbstverleugnung verdient werden muss.",
    development:"Die Hauptfigur erkennt unfairen Umgang, sucht Unterstützung und findet Beziehungen, in denen Grenzen und Eigenarten respektiert werden.",
    strategy:"Die Situation klar benennen, Abstand zu verletzendem Verhalten schaffen und eine verlässliche erwachsene oder freundschaftliche Hilfe aktivieren.",
    support:"Die Begleitfigur glaubt der Hauptfigur, relativiert die Erfahrung nicht und sorgt für Schutz und konkrete Unterstützung.",
    success:"Nicht jede Figur wird zum Freund; die Hauptfigur gewinnt jedoch Schutz, Sprache für das Erlebte und eine echte Verbindung.",
    message:"Du musst dich nicht kleiner machen, um dazugehören zu dürfen.",
    title:"{H} und das verstummte Platzlied",
    world:"Die Stadt der vielen Stimmen",
    worldType:"Soziales Fantasieabenteuer",
    quest:"das verstummte Platzlied wieder hörbar zu machen"
  },
  {
    id:"grief",label:"Trauer, Verlust und Vermissen",
    patterns:["tod","gestorben","verstorben","verlust","trau","vermiss","abschied für immer","beerdigung"],
    feelings:["Traurigkeit","Sehnsucht","Verwirrung"],
    reaction:"Das Kind stellt wiederholt Fragen, sucht die vermisste Person oder wechselt zwischen Traurigkeit, Spiel und scheinbarer Unberührtheit.",
    need:"Ehrliche, altersgerechte Orientierung und die Erlaubnis, auf unterschiedliche Weise zu erinnern und zu trauern.",
    development:"Die Hauptfigur entdeckt, dass Erinnerung und Weiterleben nebeneinander bestehen können, ohne die verlorene Beziehung zu löschen.",
    strategy:"Gefühle und Fragen ausdrücken, Erinnerungen teilen, ein persönliches Ritual finden und sichere Menschen einbeziehen.",
    support:"Die Begleitfigur antwortet ehrlich und einfach, hält wiederholte Fragen aus und erlaubt sowohl Traurigkeit als auch Freude.",
    success:"Der Verlust wird nicht rückgängig gemacht; die Hauptfigur findet jedoch einen tragfähigen Platz für Erinnerung und Verbindung.",
    message:"Vermissen darf wehtun, und Liebe kann in Erinnerungen weiter einen Platz haben.",
    title:"{H} und die Lichter der Erinnerung",
    world:"Der Garten der Erinnerungslichter",
    worldType:"Ruhiges poetisches Abenteuer",
    quest:"verirrte Erinnerungslichter sicher zu ihren Plätzen zu begleiten"
  },
  {
    id:"sleep",label:"Schlafen und nächtliche Sicherheit",
    patterns:["schlafen","einschlafen","bett","nacht","nachts","albtraum","allein im zimmer","durchschlafen"],
    feelings:["Unsicherheit","Angst","Unruhe"],
    reaction:"Das Kind versucht, den Übergang in den Schlaf hinauszuzögern, ruft wiederholt oder braucht viele neue Sicherheiten.",
    need:"Ein verlässlicher Ablauf, körperliche Beruhigung und die Erfahrung, dass Nähe auch während des Schlafens erreichbar bleibt.",
    development:"Die Hauptfigur baut aus vertrauten Signalen einen eigenen Weg vom Wachsein in die Ruhe.",
    strategy:"Den Ablauf vorhersehbar machen, den Körper beruhigen, einen vertrauten Anker nutzen und Gedanken ziehen lassen, ohne sie bekämpfen zu müssen.",
    support:"Die Begleitfigur bleibt freundlich und verlässlich, hält den vereinbarten Ablauf und vermeidet Drohungen oder immer neue Bedingungen.",
    success:"Nicht jede Nacht ist sofort leicht; die Hauptfigur kann jedoch einen Teil des Einschlafwegs zunehmend selbst übernehmen.",
    message:"Ruhe muss nicht erzwungen werden; sie kann Schritt für Schritt entstehen.",
    title:"{H} und der Weg zur ruhigen Nacht",
    world:"Das Land zwischen Wachsein und Traum",
    worldType:"Sanftes Nachtabenteuer",
    quest:"die verschwundenen Ruheklänge wieder an ihren Platz zu bringen"
  },
  {
    id:"change",label:"Veränderungen und neue Situationen",
    patterns:["umzug","wechsel","veränder","neu in","neue schule","neuer kindergarten","neues zuhause","veränderung"],
    feelings:["Unsicherheit","Traurigkeit","Neugier"],
    reaction:"Das Kind hält stark am Vertrauten fest, lehnt Neues zunächst ab oder fragt immer wieder nach dem alten Zustand.",
    need:"Vorhersagbarkeit, Abschied vom Vertrauten und die Möglichkeit, Neues schrittweise mitzugestalten.",
    development:"Die Hauptfigur bewahrt wichtige Verbindungen und entdeckt zugleich eigene Gestaltungsmöglichkeiten in der neuen Situation.",
    strategy:"Vertrautes benennen und mitnehmen, den neuen Ort in kleinen Teilen erkunden und eigene Entscheidungen darin verankern.",
    support:"Die Begleitfigur beschönigt die Veränderung nicht, gibt Orientierung und lässt Trauer über das Alte neben Neugier auf das Neue bestehen.",
    success:"Nicht alles Neue fühlt sich sofort wie Zuhause an, aber die Hauptfigur schafft einen ersten eigenen vertrauten Platz.",
    message:"Etwas Neues darf fremd sein, während Vertrautes in dir und bei anderen weiterbesteht.",
    title:"{H} und die Karte der neuen Wege",
    world:"Das Land der wandernden Wege",
    worldType:"Entdeckungsabenteuer",
    quest:"eine Karte zu zeichnen, auf der alte und neue Wege miteinander verbunden sind"
  },
  {
    id:"generic",label:"Emotionales Alltagsthema",
    patterns:[],
    feelings:["Unsicherheit","Frust","Hoffnung"],
    reaction:"Das Kind versucht, die schwierige Situation schnell zu vermeiden, zu kontrollieren oder durch bekannte Reaktionen zu beenden.",
    need:"Verständnis, Sicherheit und die Erfahrung, selbst einen kleinen wirksamen Schritt wählen zu können.",
    development:"Die Hauptfigur versteht das eigene Gefühl besser und entwickelt einen realistischen neuen Handlungsschritt.",
    strategy:"Innehalten, das Gefühl wahrnehmen, die Situation in kleine Teile zerlegen und passende Unterstützung nutzen.",
    support:"Die Begleitfigur nimmt das Erleben ernst, fragt statt zu bestimmen und lässt die Hauptfigur den entscheidenden Schritt selbst ausführen.",
    success:"Das Thema ist nicht vollständig verschwunden, aber die Hauptfigur erlebt mehr Orientierung, Verbindung und Handlungsspielraum.",
    message:"Du bist mit deinem Gefühl nicht allein und kannst deinen nächsten Schritt in deinem Tempo finden.",
    title:"{H} und der Weg hinter der leisen Tür",
    world:"Der Garten hinter der leisen Tür",
    worldType:"Warmherziges Fantasieabenteuer",
    quest:"ein verlorenes Zeichen zurückzubringen, das nur auf kleine ehrliche Schritte reagiert"
  }
];

function inferTopicProfile(brief){
  const source=[
    brief.problemTopic,brief.concreteSituation,brief.currentReaction,
    brief.additionalContext,(brief.childFeelings||[]).join(" ")
  ].join(" ").toLowerCase();
  let best=topicProfiles.at(-1),bestScore=0;
  topicProfiles.slice(0,-1).forEach(profile=>{
    const score=keywordScore(source,profile.patterns);
    if(score>bestScore){best=profile;bestScore=score}
  });
  return {...best,confidence:bestScore>1?"hoch":bestScore===1?"mittel":"allgemein"};
}

function chooseStoryWorld(brief,profile,heroName){
  const preference=text(brief.storyWorldChoice);
  const interests=list(brief.interests);
  const interestSource=interests.join(" ").toLowerCase();
  let world=profile.world,worldType=profile.worldType,quest=profile.quest;
  if(preference.includes("Tier")){
    world="Der Wald der vielen Pfade";worldType="Tiergeschichte";
  }else if(preference.includes("Alltag")){
    world="Eine vertraute Alltagswelt mit einem außergewöhnlichen Geheimnis";worldType="Alltagsnahes Abenteuer";
  }else if(preference.includes("Weltraum")||/weltraum|planet|rakete/.test(interestSource)){
    world="Die Sternenstation der kleinen Wege";worldType="Weltraumabenteuer";
  }else if(preference.includes("Dinosaur")||/dinosaur/.test(interestSource)){
    world="Das Tal der sanften Riesen";worldType="Dinosaurierabenteuer";
  }else if(/drache/.test(interestSource)){
    world="Die Inseln über den Wolken";worldType="Drachenabenteuer";
  }else if(/meer|fisch|ozean/.test(interestSource)){
    world="Die Bucht der wandernden Lichter";worldType="Unterwasserabenteuer";
  }
  const title=profile.title.replace("{H}",heroName);
  return {
    title,
    subtitle:`Eine Geschichte über ${profile.label.toLowerCase()}`,
    world,
    worldType,
    quest,
    locations:[
      "Ein vertrauter Ausgangsort",
      `Der Eingang zu ${world}`,
      "Ein Ort der ersten Beobachtung",
      "Ein geschützter Ruheplatz",
      "Ein Weg mit einer überschaubaren Prüfung",
      "Der Ort des ersten eigenen Erfolgs",
      "Das Zentrum der großen Prüfung",
      "Der vertraute Rückkehrort"
    ]
  };
}

function analyze(input){
  const brief={...input};
  brief.childFeelings=list(input.childFeelings);
  brief.triggerSituations=list(input.triggerSituations);
  brief.interests=list(input.interests);
  const profileSource=inferTopicProfile(brief);
  const heroName=text(input.characters?.[0]?.name||input.mainCharacterName,"Hauptfigur");
  const selectedFeelings=brief.childFeelings.length?brief.childFeelings:profileSource.feelings;
  const userAvoid=text(brief.avoidContent);
  const safety="Keine Beschämung, keine Drohung, keine Schuldzuweisung und keine plötzliche Wunderlösung.";
  const profile={
    topic:text(brief.problemTopic,"Ein wichtiges Alltagsthema"),
    concreteSituation:text(brief.concreteSituation,"Die von den Eltern beschriebene Alltagssituation."),
    triggers:brief.triggerSituations.length?brief.triggerSituations:[text(brief.concreteSituation)].filter(Boolean),
    currentReaction:text(brief.currentReaction,profileSource.reaction),
    feelings:selectedFeelings,
    emotionalNeed:profileSource.need,
    previousAttempts:"",
    desiredDevelopment:profileSource.development,
    copingStrategy:profileSource.strategy,
    supportiveResponse:profileSource.support,
    realisticSuccess:profileSource.success,
    storyDistance:text(brief.storyDistance,"Ausgewogen – das Thema ist erkennbar, wird aber in eine eigenständige Geschichte übertragen."),
    avoidContent:[safety,userAvoid].filter(Boolean).join(" "),
    sensitiveWords:text(brief.sensitiveWords),
    parentMessage:profileSource.message,
    category:profileSource.label,
    confidence:profileSource.confidence,
    analysisReason:`Die Ableitung beruht auf der geschilderten Situation, der beobachteten Reaktion, dem Alter und den ausgewählten Gefühlen. Sie ist keine Diagnose.`
  };
  const story=chooseStoryWorld(brief,profileSource,heroName);
  const age=numberFromAge(brief.childAge);
  const pages=age<=4?32:age<=6?40:48;
  return {
    category:profileSource.label,
    confidence:profileSource.confidence,
    profile,
    story,
    pages,
    purpose:`Eine eigenständige, spannende Geschichte über ${profile.topic}, die das Gefühl ernst nimmt und eine realistische Entwicklung durch Handlung erfahrbar macht.`,
    coreMessage:profile.parentMessage,
    secondaryMessages:[
      "Gefühle dürfen wahrgenommen werden, ohne die ganze Handlung zu bestimmen.",
      "Unterstützung stärkt Selbstwirksamkeit, wenn sie nicht alles übernimmt."
    ]
  };
}

function psychologicalProfile(brief){
  return analyze(brief).profile;
}
function phaseBlueprints(ctx){
  const {hero,ally,guide,profile,world,quest}=ctx;
  const H=hero.name,A=ally.name,G=guide.name,W=world.name;
  return [
    {
      title:"Ein vertrauter Anfang",
      function:"Sicherheit und Identifikation aufbauen",
      emotion:"vertraut und geborgen",
      goal:`${H} wird in einer glaubwürdigen Alltagssituation mit eigenen Stärken, Beziehungen und kleinen Gewohnheiten vorgestellt.`,
      conflict:`Erste feine Anzeichen von „${profile.topic}“ sind spürbar, ohne dass die Geschichte das Thema erklärt.`,
      result:`Die Lesenden verstehen, was ${H} wichtig ist und bei wem sich die Hauptfigur sicher fühlt.`,
      image:`${H} und ${A} in einer warmen, vertrauten Umgebung; ihre Beziehung ist durch Blickkontakt und Körperhaltung sichtbar.`
    },
    {
      title:"Das erste Zeichen",
      function:"Den äußeren Abenteuerimpuls mit dem inneren Thema verbinden",
      emotion:"neugierig mit einem ersten Ziehen im Bauch",
      goal:`Ein ungewöhnlicher Hinweis eröffnet ${quest} und spricht genau die Situation an, die ${H} sonst verunsichert.`,
      conflict:`${H}s bekannte Reaktion – ${profile.currentReaction} – meldet sich sofort.`,
      result:`Die Neugier ist stärker als der Wunsch, alles beim Alten zu lassen.`,
      image:`Der ungewöhnliche Hinweis erscheint; ${H} reagiert körperlich sichtbar, während ${A} etwas Entscheidendes bemerkt.`
    },
    {
      title:"Die Entscheidung",
      function:"Freiwilligkeit und Selbstwirksamkeit sichern",
      emotion:"unsicher, aber nicht allein",
      goal:`${H} darf selbst entscheiden, ob und wie der erste Schritt beginnt.`,
      conflict:`Der Wunsch nach Sicherheit steht dem Wunsch entgegen, ${quest} nicht unbeantwortet zu lassen.`,
      result:`${H} wählt einen kleinen, überschaubaren Schritt statt einer großen mutigen Geste.`,
      image:`${H} trifft eine sichtbare Entscheidung; ${A} bleibt unterstützend in der Nähe, ohne zu ziehen oder zu drängen.`
    },
    {
      title:"Über die Schwelle",
      function:"Geschützte Distanz zum Alltagsthema schaffen",
      emotion:"Staunen und vorsichtige Spannung",
      goal:`Die Figuren betreten ${W}; die Fantasiewelt spiegelt Gefühle und Beziehungen, ohne den Alltag nur nachzuerzählen.`,
      conflict:`Die neue Umgebung macht alte Unsicherheiten deutlicher.`,
      result:`Eine Regel der Welt zeigt: Weiter kommt nur, wer genau wahrnimmt und nicht gegen das eigene Gefühl ankämpft.`,
      image:`Die Figuren überschreiten gemeinsam eine klare Schwelle in ${W}; vorne Staunen, im Hintergrund der sichere Rückweg.`
    },
    {
      title:"Eine Welt mit eigenen Regeln",
      function:"Gefühle externalisieren und verstehbar machen",
      emotion:"fasziniert und wachsam",
      goal:`${G} oder die Welt selbst zeigt, wie ${profile.topic} in Bildern, Geräuschen oder Hindernissen sichtbar wird.`,
      conflict:`${H} möchte das Problem schnell lösen und übersieht dabei eine wichtige Beobachtung von ${A}.`,
      result:`Der erste Hinweis entsteht aus genauer Wahrnehmung statt aus Stärke oder Tempo.`,
      image:`${G} erklärt keine Lektion, sondern zeigt ein rätselhaftes Phänomen; ${A} entdeckt ein kleines Detail.`
    },
    {
      title:"Der gewohnte Versuch",
      function:"Die bisherige Bewältigungsstrategie wertfrei zeigen",
      emotion:"angespannt und entschlossen",
      goal:`${H} versucht die erste Prüfung so zu lösen, wie schwierige Situationen bisher meist bewältigt wurden.`,
      conflict:`${profile.currentReaction}`,
      result:`Der Versuch schützt kurzfristig, führt aber nicht zum eigentlichen Ziel.`,
      image:`${H} handelt aktiv, doch Haltung und Umgebung zeigen, dass der gewohnte Versuch nur teilweise hilft.`
    },
    {
      title:"Was dabei verloren geht",
      function:"Natürliche Konsequenz statt Belehrung",
      emotion:"enttäuscht und verletzlich",
      goal:`Die Figuren erleben die nachvollziehbare Folge des ersten Versuchs.`,
      conflict:`${A} oder ${G} fühlt sich übergangen, während ${H} sich für das Scheitern verantwortlich macht.`,
      result:`Das Problem wird nicht moralisch bewertet; sichtbar wird nur, was die bisherige Reaktion kostet.`,
      image:`Räumlicher Abstand zwischen den Figuren, ein misslungener Weg und klare, kindgerechte Gesichtsausdrücke.`
    },
    {
      title:"Ein Gefühl bekommt Platz",
      function:"Emotionale Validierung",
      emotion:text(profile.feelings[0],"unsicher und angespannt"),
      goal:`${H} bemerkt, wie sich das Gefühl im Körper und in Gedanken zeigt.`,
      conflict:`Das Gefühl will weggeschoben werden, weil es den nächsten Schritt scheinbar schwerer macht.`,
      result:`${profile.supportiveResponse}`,
      image:`Naher, ruhiger Moment: ${H}s Gefühl ist in Mimik und Körperhaltung sichtbar; ${A} bleibt auf Augenhöhe.`
    },
    {
      title:"Zuhören verändert den Plan",
      function:"Beziehung als Ressource aktivieren",
      emotion:"vorsichtig erleichtert",
      goal:`${H} hört ${A} oder ${G} bis zum Ende zu und entdeckt eine Perspektive, die vorher fehlte.`,
      conflict:`Alte Rollen und Erwartungen machen echtes Zuhören ungewohnt.`,
      result:`Die Gruppe entwickelt einen Plan, in dem jede Figur eine passende Aufgabe erhält.`,
      image:`Die Figuren planen gemeinsam; verschiedene Hände, Blicke oder Hinweise greifen sichtbar ineinander.`
    },
    {
      title:"Der kleinste mögliche Schritt",
      function:"Konkrete Bewältigungsstrategie einführen",
      emotion:"konzentriert und hoffnungsvoll",
      goal:`Die Figuren übersetzen „${profile.copingStrategy}“ in eine sichtbare Handlung innerhalb des Abenteuers.`,
      conflict:`Der Schritt wirkt zunächst zu klein, um gegen das große Hindernis zu helfen.`,
      result:`Gerade seine Überschaubarkeit macht ihn möglich.`,
      image:`${H} führt einen kleinen, klar erkennbaren Handlungsschritt aus; die anderen geben Raum und Sicherheit.`
    },
    {
      title:"Ein erster eigener Erfolg",
      function:"Selbstwirksamkeit erfahrbar machen",
      emotion:"überrascht und stolz",
      goal:`${H} wendet den neuen Schritt selbst an.`,
      conflict:`Die Situation bleibt schwierig und fordert Geduld.`,
      result:`Ein Teil des Weges öffnet sich, weil ${H} nicht perfekt sein muss, sondern handlungsfähig bleibt.`,
      image:`Ein kleiner Erfolg wird sichtbar; Freude bleibt glaubwürdig und nicht übertrieben.`
    },
    {
      title:"Nicht jeder Erfolg bleibt",
      function:"Rückfälle normalisieren",
      emotion:"frustriert und verunsichert",
      goal:`Eine stärkere Variante des Hindernisses taucht auf.`,
      conflict:`Unter Druck kehrt ${H} kurz zur alten Reaktion zurück.`,
      result:`Der Rückschritt löscht den ersten Erfolg nicht aus.`,
      image:`Das Hindernis ist größer; ${H} gerät ins alte Muster, während ein früheres Erfolgssymbol sichtbar bleibt.`
    },
    {
      title:"Ein Streit ohne Schuldige",
      function:"Beziehungskonflikt reparierbar machen",
      emotion:"ärgerlich und traurig",
      goal:`Die Figuren benennen, was beim Rückschritt zwischen ihnen passiert ist.`,
      conflict:`Jede Figur sieht zunächst nur den eigenen Schmerz.`,
      result:`Eine ehrliche Entschuldigung und eine klare Grenze schaffen wieder Verbindung.`,
      image:`Zunächst abgewandte Körper, dann ein vorsichtiger Blickkontakt; keine beschämende oder dominante Haltung.`
    },
    {
      title:"Der Plan wird verändert",
      function:"Flexibilität und gemeinsames Problemlösen",
      emotion:"ruhiger und klarer",
      goal:`Die Gruppe passt den Plan an ${H}s tatsächliche Bedürfnisse und Fähigkeiten an.`,
      conflict:`Der neue Weg ist langsamer und verlangt Vertrauen.`,
      result:`Alle stimmen einer Lösung zu, die niemanden übergeht.`,
      image:`Gemeinsames Neuordnen von Werkzeugen, Wegen oder Zeichen; jede Figur trägt sichtbar etwas bei.`
    },
    {
      title:"Üben, solange es noch leicht ist",
      function:"Strategie festigen",
      emotion:"spielerisch und aufmerksam",
      goal:`Die neue Strategie wird in einer kleineren, sicheren Situation wiederholt.`,
      conflict:`Ungeduld verführt dazu, den Zwischenschritt auszulassen.`,
      result:`Wiederholung macht den Ablauf vertrauter.`,
      image:`Eine kleine Probe in sicherer Umgebung, mit konzentrierten und zugleich entspannten Gesichtern.`
    },
    {
      title:"Die eigene Stärke neu sehen",
      function:"Identität erweitern",
      emotion:"nachdenklich und zuversichtlich",
      goal:`${H} erkennt, dass Stärke nicht nur in der bisherigen Rolle liegt.`,
      conflict:`Ein alter Glaubenssatz über sich selbst passt nicht mehr ganz zur neuen Erfahrung.`,
      result:`${profile.desiredDevelopment}`,
      image:`Ruhiger Spiegel- oder Lichtmoment, in dem ${H} sich nicht äußerlich verändert, aber anders aufrecht steht.`
    },
    {
      title:"Die große Prüfung beginnt",
      function:"Transfer unter höherer Belastung",
      emotion:"angespannt, aber vorbereitet",
      goal:`Das zentrale Hindernis von ${quest} wird sichtbar.`,
      conflict:`Alle bisherigen Auslöser bündeln sich in einer kindgerechten, spannenden Situation.`,
      result:`${H} erkennt die Signale früh genug, um bewusst zu wählen.`,
      image:`Das große Hindernis dominiert die Szene; die Figuren bleiben als Team klar erkennbar.`
    },
    {
      title:"Hilfe, die nicht übernimmt",
      function:"Unterstützung ohne Entmündigung",
      emotion:"gehalten und selbstbestimmt",
      goal:`${A} und ${G} bieten genau die Hilfe an, die ${H} zuvor als hilfreich beschrieben hat.`,
      conflict:`Sie müssen aushalten, nicht sofort selbst die Lösung auszuführen.`,
      result:`${H} behält die Führung über den eigenen nächsten Schritt.`,
      image:`Die Begleitfiguren sichern den Raum, während ${H} im Zentrum selbst handelt.`
    },
    {
      title:"Der bewusste Augenblick",
      function:"Neue Wahl sichtbar machen",
      emotion:"mutig trotz spürbarer Unsicherheit",
      goal:`${H} hält inne und nutzt ${profile.copingStrategy}.`,
      conflict:`Das alte Muster wäre schneller und vertrauter.`,
      result:`Die bewusste Wahl verändert den Verlauf der Prüfung.`,
      image:`Ein klarer Augenblick des Innehaltens; Umgebung in Bewegung, ${H} fokussiert und nicht übermenschlich.`
    },
    {
      title:"Jede Stärke hat ihren Platz",
      function:"Beziehungen und Kompetenzen integrieren",
      emotion:"verbunden und konzentriert",
      goal:`${H}, ${A} und ${G} verbinden unterschiedliche Fähigkeiten.`,
      conflict:`Der Plan funktioniert nur, wenn niemand die Aufgabe der anderen übernimmt.`,
      result:`Das Team kommt weiter, weil Unterschiede nicht beseitigt, sondern genutzt werden.`,
      image:`Dynamische Teamhandlung mit verschiedenen Aufgaben, Blickrichtungen und Ebenen; keine statische Aufstellung.`
    },
    {
      title:"Der Höhepunkt",
      function:"Pädagogisches Ziel durch Handlung beweisen",
      emotion:"intensiv, sicher und entschlossen",
      goal:`Die Figuren lösen den Kernkonflikt von ${quest} mit der erarbeiteten Strategie.`,
      conflict:`Ein letzter Moment verlangt, dass ${H} die neue Fähigkeit selbstständig einsetzt.`,
      result:`Der Erfolg entsteht aus Handlung, Beziehung und Übung – nicht aus einer plötzlichen Wunderlösung.`,
      image:`Höhepunkt mit klarer Ursache und Wirkung; die entscheidende Handlung von ${H} ist sofort erkennbar.`
    },
    {
      title:"Nach dem Sturm",
      function:"Erregung regulieren und Erfahrung einordnen",
      emotion:"erleichtert und erschöpft",
      goal:`Die Figuren kommen zur Ruhe und nehmen wahr, was sich verändert hat.`,
      conflict:`${H} kann den eigenen Anteil zunächst kaum glauben.`,
      result:`Die anderen benennen konkrete Beobachtungen statt pauschalem Lob.`,
      image:`Ruhiger Nachklang, körperliche Entspannung und ein sichtbares Ergebnis des Abenteuers.`
    },
    {
      title:"Ein Erfolg mit offenen Rändern",
      function:"Realistische Wirksamkeit",
      emotion:"stolz und ehrlich",
      goal:`Die Gruppe feiert, ohne zu behaupten, dass schwierige Gefühle nie wiederkommen.`,
      conflict:`Der Wunsch nach einem perfekten Ende trifft auf die Wirklichkeit.`,
      result:`${profile.realisticSuccess}`,
      image:`Freude und Geborgenheit, während ein kleines Zeichen zeigt, dass weiteres Üben zum Leben dazugehört.`
    },
    {
      title:"Der Weg nach Hause",
      function:"Erfahrung in den Alltag zurückführen",
      emotion:"warm und ruhig",
      goal:`Die Figuren kehren aus ${W} zurück und tragen eine konkrete Erinnerung an ihre neue Erfahrung mit.`,
      conflict:`Im vertrauten Umfeld fühlt sich vieles wieder gewöhnlich an.`,
      result:`Ein Symbol, Satz oder gemeinsames Ritual hält den neuen Handlungsschritt erreichbar.`,
      image:`Rückkehr über die Schwelle; vertrauter Ort und ein kleines sichtbares Erinnerungssymbol.`
    },
    {
      title:"Beim nächsten Mal",
      function:"Nachhaltiger Alltagstransfer",
      emotion:"geborgen und hoffnungsvoll",
      goal:`Eine kleine Alltagssituation erinnert an das ursprüngliche Thema.`,
      conflict:`Das alte Gefühl taucht erneut auf, jedoch in bewältigbarer Stärke.`,
      result:`${H} nutzt einen eigenen kleinen Schritt und erlebt: ${profile.parentMessage}`,
      image:`Eine konkrete Alltagssituation nach dem Abenteuer; das Gefühl ist sichtbar, ebenso der neue selbstgewählte Umgang damit.`
    }
  ];
}

function systemCharacter(role,index,brief,analysis){
  const names=["Lumi","Momo","Nilo","Kiki","Taro","Fina","Mika","Pico"];
  const name=names[Math.abs([...analysis.profile.topic].reduce((sum,char)=>sum+char.charCodeAt(0),0)+index*7)%names.length];
  if(role==="guide"){
    return {
      name,role:"Ruhige Wegweiserfigur",age:"alterslos",strengths:["aufmerksam","geduldig"],
      challenge:"darf die Lösung nicht vorwegnehmen",
      development:"lernt, der Hauptfigur genau die passende Hilfe zu geben",
      description:"Eine warmherzige Figur, die Fragen stellt, Orientierung gibt und die entscheidende Handlung bei der Hauptfigur lässt.",
      relationship:`Gibt ${text(brief.characters?.[0]?.name,"der Hauptfigur")} Sicherheit, ohne Entscheidungen abzunehmen.`,
      appearanceDescription:"freundliche, unverwechselbare Fantasiefigur mit ruhiger Mimik und weichen Formen"
    };
  }
  return {
    name,role:"Begleitfigur und Freund",age:"jung",strengths:["neugierig","loyal"],
    challenge:"möchte manchmal zu schnell helfen",
    development:"lernt, zuzuhören und gemeinsam kleine Schritte zu planen",
    description:"Eine lebendige Begleitfigur, die Humor und Beziehung in das Abenteuer bringt.",
    relationship:`Bleibt an der Seite von ${text(brief.characters?.[0]?.name,"der Hauptfigur")} und unterstützt, ohne alles zu übernehmen.`,
    appearanceDescription:"kleine freundliche Fantasiefigur mit klarer Silhouette und ausdrucksstarkem Gesicht"
  };
}

function storyPhaseIndex(index,total){
  const maps={
    16:[0,1,2,3,5,6,7,8,9,10,12,13,14,16,20,24],
    20:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18,20,24],
    24:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,24],
    25:Array.from({length:25},(_,i)=>i)
  };
  return maps[total]?.[index]??Math.round(index*24/Math.max(1,total-1));
}

function generate(input){
  const brief={...input};
  brief.characters=Array.isArray(input.characters)?input.characters.filter(character=>character&&Object.values(character).some(value=>Array.isArray(value)?value.length:String(value??"").trim())):[];
  brief.feelings=list(input.feelings);
  brief.learningGoals=list(input.learningGoals);
  brief.qualityGoals=list(input.qualityGoals);
  brief.locations=list(input.locations);
  brief.interests=list(input.interests);
  brief.bookStyle=list(input.bookStyle);
  brief.secondaryMessages=list(input.secondaryMessages);
  brief.childFeelings=list(input.childFeelings);
  brief.triggerSituations=list(input.triggerSituations);

  const analysis=analyze(brief);
  brief.pages=clamp(Number(input.pages)||analysis.pages,24,60);
  brief.title=text(input.title,analysis.story.title);
  brief.subtitle=text(input.subtitle,analysis.story.subtitle);
  brief.purpose=text(input.purpose,analysis.purpose);
  brief.coreMessage=text(input.coreMessage,analysis.coreMessage);
  brief.secondaryMessages=brief.secondaryMessages.length?brief.secondaryMessages:analysis.secondaryMessages;
  brief.worldName=text(input.worldName,analysis.story.world);
  brief.worldType=text(input.worldType,analysis.story.worldType);
  brief.locations=brief.locations.length?brief.locations:analysis.story.locations;
  brief.adventureType=text(input.adventureType,analysis.story.quest);
  brief.bookStyle=brief.bookStyle.length?brief.bookStyle:["warmherzig","spannend","altersgerecht"];

  const rawCharacters=brief.characters.length?brief.characters:[{
    name:text(input.mainCharacterName,"Hauptfigur"),role:"Hauptfigur",age:text(brief.childAge),
    strengths:list(input.childStrengths),challenge:analysis.profile.topic,
    development:analysis.profile.desiredDevelopment,
    description:text(input.childDescription,"Ein Kind mit eigenen Stärken, Vorlieben und einer nachvollziehbaren schwierigen Situation."),
    appearanceDescription:text(input.mainCharacterAppearance),relationship:text(input.safePeople)
  }];
  while(rawCharacters.length<3)rawCharacters.push(systemCharacter(rawCharacters.length===1?"ally":"guide",rawCharacters.length,brief,analysis));
  const characters=rawCharacters.map((character,index)=>{
    const normalized=normalizeCharacter(character,index,brief.childAge);
    if(index===0){
      normalized.challenge=text(normalized.challenge,analysis.profile.topic);
      normalized.development=text(normalized.development,analysis.profile.desiredDevelopment);
      normalized.description=text(normalized.description,"Eine glaubwürdige Hauptfigur mit eigenen Stärken, Vorlieben und Unsicherheiten.");
    }
    return normalized;
  });

  const hero=characters[0];
  const ally=characters[1];
  const guide=characters[2];
  const profile=analysis.profile;
  const world={
    id:uid("WORLD"),
    name:brief.worldName,
    type:brief.worldType,
    locations:brief.locations,
    rules:[
      "Gefühle werden ernst genommen und niemals beschämt.",
      "Unterstützung hilft der Hauptfigur, übernimmt aber nicht ihre Entwicklung.",
      "Der Konflikt bleibt kindgerecht und endet ohne Drohung oder Erniedrigung.",
      "Die Botschaft wird durch Entscheidungen, Folgen und Beziehungen vermittelt."
    ]
  };
  const quest=brief.adventureType;
  const ctx={brief,characters,hero,ally,guide,profile,world,quest};
  if(!Treatment)throw new Error("Story Treatment Engine fehlt.");
  const storyTreatment=Treatment.generate({brief,analysis,characters,profile,world,quest});
  const sceneCount=clamp(Math.round(brief.pages/2),16,25);
  const structure=Treatment.toPlan(storyTreatment,sceneCount);
  const chapters=structure.chapters;
  const scenes=structure.scenes;

  const checks=[
    {label:"Konkretes Thema",passed:profile.topic.length>8,detail:profile.topic},
    {label:"Konkrete Alltagssituation",passed:profile.concreteSituation.length>15,detail:profile.concreteSituation},
    {label:"Gefühle und Bedürfnisse",passed:profile.feelings.length>0&&profile.emotionalNeed.length>10,detail:`${profile.feelings.join(", ")} · ${profile.emotionalNeed}`},
    {label:"Realistisches Entwicklungsziel",passed:profile.desiredDevelopment.length>15,detail:profile.desiredDevelopment},
    {label:"Konkrete Bewältigungsstrategie",passed:profile.copingStrategy.length>15,detail:profile.copingStrategy},
    {label:"Unterstützung ohne Übernahme",passed:profile.supportiveResponse.length>15,detail:profile.supportiveResponse},
    {label:"Kindgerechte Schutzgrenzen",passed:profile.avoidContent.length>5,detail:profile.avoidContent},
    {label:"Vollständiger Geschichtenentwurf",passed:storyTreatment.qualityReport.score>=90,detail:`Treatment ${storyTreatment.qualityReport.score}% · ${storyTreatment.beats.length} kausal verbundene Handlungsschritte`},
    {label:"Vollständiger Geschichtenbogen",passed:scenes.length>=16,detail:`${chapters.length} Kapitel und ${scenes.length} Szenen`}
  ];
  const score=Math.round(checks.filter(check=>check.passed).length/checks.length*100);

  return {
    schemaVersion:"2.1",
    generatedAt:new Date().toISOString(),
    generator:"CAPS Parent Intake Analyzer & Story Treatment Planner 1.2",
    storyBible:{
      title:brief.title,
      subtitle:brief.subtitle,
      purpose:brief.purpose,
      coreMessage:brief.coreMessage,
      secondaryMessages:brief.secondaryMessages,
      logline:`Als ${hero.name} in ${world.name} durch ${quest} herausgefordert wird, reicht die vertraute Reaktion nicht mehr aus. Mit ${ally.name} entdeckt ${hero.name} einen eigenen, realistischen neuen Schritt.`,
      emotionalPromise:`Das Kind wird mit dem schwierigen Gefühl nicht allein gelassen und erlebt glaubwürdig, wie Sicherheit, Beziehung und eigenes Handeln zusammenwirken.`,
      psychologicalProfile:profile,
      backgroundAnalysis:{category:analysis.category,confidence:analysis.confidence,reason:profile.analysisReason,storyConcept:analysis.story},
      intakeContext:{childAge:brief.childAge,concreteSituation:brief.concreteSituation,currentReaction:brief.currentReaction,safePeople:brief.safePeople,interests:brief.interests,childFeelings:brief.childFeelings,storyWorldChoice:brief.storyWorldChoice,additionalContext:brief.additionalContext},
      interests:brief.interests,
      tone:brief.bookStyle,
      storyDistance:profile.storyDistance,
      safetyBoundaries:profile.avoidContent,
      motif:text(brief.interests[0],"ein wiederkehrendes kleines Zeichen")
    },
    characters,
    worlds:[world],
    storyTreatment,
    chapters,
    scenes,
    qualityReport:{score,checks},
    approvals:{storyBible:false,impact:false,treatment:false,characters:false,worlds:false,chapters:false,scenes:false,quality:false}
  };
}

function upgradePlan(plan,brief={}){
  if(!plan)return plan;
  plan.approvals={storyBible:false,impact:false,treatment:false,characters:false,worlds:false,chapters:false,scenes:false,quality:false,...(plan.approvals||{})};
  if(plan.storyTreatment)return plan;
  const storyBible=plan.storyBible||{},profile=storyBible.psychologicalProfile||{};
  const analysis={category:storyBible.backgroundAnalysis?.category||profile.category||"Emotionales Alltagsthema",profile,story:storyBible.backgroundAnalysis?.storyConcept||{}};
  const world=plan.worlds?.[0]||{name:"der Fantasiewelt",locations:[]};
  const quest=brief.adventureType||analysis.story?.quest||storyBible.logline||"einen wichtigen Auftrag zu erfüllen";
  plan.storyTreatment=Treatment.generate({brief:{...storyBible.intakeContext,...brief,interests:storyBible.interests||brief.interests},analysis,characters:plan.characters||[],profile,world,quest});
  return plan;
}
function rebuildTreatment(plan,brief={}){
  const merged={...brief,title:plan?.storyBible?.title||brief.title,subtitle:plan?.storyBible?.subtitle||brief.subtitle};
  return generate(merged);
}
window.CAPS_BookEngine={analyze,generate,upgradePlan,rebuildTreatment};
})();
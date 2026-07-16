(function(){
"use strict";

const uid=prefix=>`${prefix}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const text=(value,fallback="")=>String(value??"").trim()||fallback;
const list=value=>Array.isArray(value)?value.map(x=>String(x).trim()).filter(Boolean):String(value??"").split(/[\n,]/).map(x=>x.trim()).filter(Boolean);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

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

function psychologicalProfile(brief){
  return {
    topic:text(brief.problemTopic,"Ein wichtiges Alltagsthema"),
    concreteSituation:text(brief.concreteSituation,"Eine konkrete Situation fordert das Kind emotional heraus."),
    triggers:list(brief.triggerSituations),
    currentReaction:text(brief.currentReaction,"Das Kind reagiert mit Anspannung und versucht, die Situation schnell zu kontrollieren oder zu vermeiden."),
    feelings:list(brief.childFeelings),
    emotionalNeed:text(brief.emotionalNeed,"Sicherheit, Verständnis und das Gefühl, handlungsfähig zu sein."),
    previousAttempts:text(brief.previousAttempts),
    desiredDevelopment:text(brief.desiredDevelopment,"Das Kind entdeckt einen kleinen, realistischen neuen Handlungsschritt."),
    copingStrategy:text(brief.copingStrategy,"Anhalten, das Gefühl wahrnehmen, Unterstützung annehmen und einen kleinen nächsten Schritt wählen."),
    supportiveResponse:text(brief.supportiveResponse,"Eine vertraute Person bleibt ruhig, nimmt das Gefühl ernst und löst die Aufgabe nicht anstelle des Kindes."),
    realisticSuccess:text(brief.realisticSuccess,"Die schwierige Situation ist nicht vollständig verschwunden, aber das Kind erlebt sich sicherer und handlungsfähiger."),
    storyDistance:text(brief.storyDistance,"Ausgewogen – das Thema ist erkennbar, wird aber in eine eigenständige Geschichte übertragen."),
    avoidContent:text(brief.avoidContent,"Keine Beschämung, keine Drohungen und keine einfache Wunderlösung."),
    sensitiveWords:text(brief.sensitiveWords),
    parentMessage:text(brief.parentMessage,"Du bist mit deinem Gefühl nicht allein und darfst deinen eigenen nächsten Schritt finden.")
  };
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

function generate(input){
  const brief={...input};
  brief.pages=clamp(Number(input.pages)||40,24,60);
  brief.characters=list(input.characters).length?input.characters:[];
  brief.feelings=list(input.feelings);
  brief.learningGoals=list(input.learningGoals);
  brief.qualityGoals=list(input.qualityGoals);
  brief.locations=list(input.locations);
  brief.interests=list(input.interests);
  brief.bookStyle=list(input.bookStyle);
  brief.secondaryMessages=list(input.secondaryMessages);
  brief.childFeelings=list(input.childFeelings);
  brief.triggerSituations=list(input.triggerSituations);

  const characters=(brief.characters.length?brief.characters:[{
    name:"Hauptfigur",role:"Hauptfigur",age:text(brief.childAge,"5 Jahre"),
    strengths:["neugierig"],challenge:text(brief.problemTopic),development:text(brief.desiredDevelopment),
    description:"Ein Kind mit nachvollziehbaren Stärken, Wünschen und Unsicherheiten.",
    appearanceDescription:"",relationship:""
  }]).map((character,index)=>normalizeCharacter(character,index,brief.childAge));

  const hero=characters[0];
  const ally=characters[1]||characters[0];
  const guide=characters[2]||ally;
  const profile=psychologicalProfile(brief);
  const world={
    id:uid("WORLD"),
    name:text(brief.worldName,"Die Welt der Geschichte"),
    type:text(brief.worldType,"Eine fantasievolle Welt mit vertrauten emotionalen Regeln"),
    locations:brief.locations.length?brief.locations:["Ein vertrauter Ausgangsort","Ein geheimnisvoller Übergang","Ein Ort der ersten Prüfung","Ein geschützter Ruheort","Der Ort der großen Prüfung","Der vertraute Rückkehrort"],
    rules:[
      "Gefühle werden ernst genommen und niemals beschämt.",
      "Unterstützung hilft der Hauptfigur, übernimmt aber nicht ihre Entwicklung.",
      "Der Konflikt bleibt kindgerecht und endet ohne Drohung oder Erniedrigung.",
      "Die Botschaft wird durch Entscheidungen, Folgen und Beziehungen vermittelt."
    ]
  };
  const quest=text(brief.adventureType,"ein Abenteuer, das nur durch Wahrnehmen, Üben und Zusammenarbeit gelöst werden kann");
  const ctx={brief,characters,hero,ally,guide,profile,world,quest};
  const phases=phaseBlueprints(ctx);
  const sceneCount=clamp(Math.round(brief.pages/2),16,25);
  const chapterCount=clamp(Math.ceil(sceneCount/2.7),6,10);
  const chapterTitles=[
    "Bevor alles begann","Das ungewöhnliche Zeichen","Hinter der vertrauten Welt",
    "Der erste Versuch","Eine andere Art von Mut","Der Weg wird schwieriger",
    "Was wirklich hilft","Die größte Prüfung","Ein Erfolg, der bleiben darf","Beim nächsten Mal"
  ];
  const chapters=Array.from({length:chapterCount},(_,index)=>({
    id:uid("CH"),
    number:index+1,
    title:chapterTitles[index]||`Kapitel ${index+1}`,
    purpose:"",
    endingHook:"",
    sceneIds:[]
  }));

  const scenes=Array.from({length:sceneCount},(_,index)=>{
    const phaseIndex=Math.round(index*(phases.length-1)/Math.max(1,sceneCount-1));
    const phase=phases[phaseIndex];
    const chapterIndex=Math.min(chapterCount-1,Math.floor(index*chapterCount/sceneCount));
    const chapter=chapters[chapterIndex];
    const locationIndex=Math.min(world.locations.length-1,Math.floor(index*world.locations.length/sceneCount));
    const location=world.locations[locationIndex];
    const focus=index<3?hero:index%5===3?ally:index%7===5?guide:hero;
    const visible=[hero.name,ally.name,guide.name].filter((name,pos,array)=>name&&array.indexOf(name)===pos);
    const scene={
      id:uid("SCENE"),
      number:index+1,
      chapterId:chapter.id,
      chapterNumber:chapter.number,
      title:phase.title,
      pages:[index*2+1,index*2+2],
      location,
      characters:visible,
      focusCharacter:focus.name,
      emotionalState:phase.emotion,
      psychologicalFunction:phase.function,
      goal:phase.goal,
      conflict:phase.conflict,
      result:phase.result,
      copingStrategy:profile.copingStrategy,
      supportiveResponse:profile.supportiveResponse,
      illustrationIdea:phase.image,
      messageMoment:index>=Math.floor(sceneCount*.55),
      storyPurpose:`${phase.function}. Die äußere Handlung von „${quest}“ und das innere Thema „${profile.topic}“ entwickeln sich gemeinsam.`,
      endingHook:index===sceneCount-1?"Die neue Erfahrung zeigt sich in einer kleinen Alltagssituation.":phases[Math.min(phases.length-1,phaseIndex+1)].title
    };
    chapter.sceneIds.push(scene.id);
    return scene;
  });

  chapters.forEach(chapter=>{
    const chapterScenes=scenes.filter(scene=>scene.chapterId===chapter.id);
    chapter.purpose=chapterScenes.map(scene=>scene.psychologicalFunction).filter((value,index,array)=>array.indexOf(value)===index).join(" · ");
    chapter.endingHook=chapterScenes.at(-1)?.endingHook||"";
  });

  const checks=[
    {label:"Konkretes Thema",passed:profile.topic.length>8,detail:profile.topic},
    {label:"Konkrete Alltagssituation",passed:profile.concreteSituation.length>15,detail:profile.concreteSituation},
    {label:"Gefühle und Bedürfnisse",passed:profile.feelings.length>0&&profile.emotionalNeed.length>10,detail:`${profile.feelings.join(", ")} · ${profile.emotionalNeed}`},
    {label:"Realistisches Entwicklungsziel",passed:profile.desiredDevelopment.length>15,detail:profile.desiredDevelopment},
    {label:"Konkrete Bewältigungsstrategie",passed:profile.copingStrategy.length>15,detail:profile.copingStrategy},
    {label:"Unterstützung ohne Übernahme",passed:profile.supportiveResponse.length>15,detail:profile.supportiveResponse},
    {label:"Kindgerechte Schutzgrenzen",passed:profile.avoidContent.length>5,detail:profile.avoidContent},
    {label:"Vollständiger Geschichtenbogen",passed:scenes.length>=16,detail:`${chapters.length} Kapitel und ${scenes.length} Szenen`}
  ];
  const score=Math.round(checks.filter(check=>check.passed).length/checks.length*100);

  return {
    schemaVersion:"2.0",
    generatedAt:new Date().toISOString(),
    generator:"CAPS Psychological Story Planner 1.0",
    storyBible:{
      title:text(brief.title,"Unbenanntes Buch"),
      subtitle:text(brief.subtitle),
      purpose:text(brief.purpose,`Eine eigenständige Geschichte über ${profile.topic}, die emotional stärkt, ohne zu belehren.`),
      coreMessage:text(brief.coreMessage,profile.parentMessage),
      secondaryMessages:brief.secondaryMessages,
      logline:`Als ${hero.name} in ${world.name} durch ${quest} herausgefordert wird, reicht die vertraute Reaktion nicht mehr aus. Mit ${ally.name} entdeckt ${hero.name} einen eigenen, realistischen neuen Schritt.`,
      emotionalPromise:`Das Kind wird mit dem schwierigen Gefühl nicht allein gelassen und erlebt glaubwürdig, wie Sicherheit, Beziehung und eigenes Handeln zusammenwirken.`,
      psychologicalProfile:profile,
      interests:brief.interests,
      tone:brief.bookStyle,
      storyDistance:profile.storyDistance,
      safetyBoundaries:profile.avoidContent,
      motif:text(brief.interests[0],"ein wiederkehrendes kleines Zeichen")
    },
    characters,
    worlds:[world],
    chapters,
    scenes,
    qualityReport:{score,checks},
    approvals:{storyBible:false,impact:false,characters:false,worlds:false,chapters:false,scenes:false,quality:false}
  };
}

window.CAPS_BookEngine={generate};
})();
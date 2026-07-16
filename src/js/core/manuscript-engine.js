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
const first=v=>list(v)[0]||"";
const lower=v=>clean(v).toLowerCase();

function defaults(plan){
 const audience=clean(plan?.storyBible?.audience||plan?.brief?.childAge||"3–8 Jahre");
 return {
  readingLevel:/3|4|5/.test(audience)?"3–6 Jahre":"6–9 Jahre",
  voice:"Warm und literarisch",
  dialogueLevel:"Ausgewogen",
  sceneLength:"Ausführlich",
  perspective:"Personale Erzählweise",
  literaryDepth:"Hoch",
  themeDelivery:"Durch Entscheidungen und Konsequenzen",
  continuity:"Streng",
  refrain:""
 };
}
function normalizedCharacter(character,index){
 const c=character||{};
 return {
  ...c,
  name:clean(c.name||`Figur ${index+1}`),
  role:clean(c.role||"Begleitfigur"),
  age:clean(c.age),
  strengths:list(c.strengths),
  challenge:clean(c.challenge),
  development:clean(c.development),
  description:clean(c.description),
  relationship:clean(c.relationship),
  appearanceDescription:clean(c.appearanceDescription),
  hairColor:clean(c.hairColor),hairstyle:clean(c.hairstyle),eyeColor:clean(c.eyeColor),clothing:clean(c.clothing),accessories:clean(c.accessories),specialFeatures:clean(c.specialFeatures)
 };
}
function storyContext(plan){
 const brief=plan?.brief||{},bible=plan?.storyBible||{},world=plan?.worlds?.[0]||{};
 const characters=list(plan?.characters).map(normalizedCharacter);
 return {
  title:clean(bible.title||brief.title||"Das Abenteuer"),
  purpose:clean(bible.purpose||brief.purpose),
  coreMessage:clean(bible.coreMessage||brief.coreMessage||"Gemeinsam ist man stärker."),
  secondaryMessages:list(bible.secondaryMessages||brief.secondaryMessages),
  feelings:list(bible.desiredFeelings||brief.feelings),
  learningGoals:list(bible.learningGoals||brief.learningGoals),
  tone:list(bible.tone||brief.bookStyle),
  interests:list(brief.interests),
  adventureType:clean(brief.adventureType||"Abenteuer"),
  endingFeeling:clean(brief.endingFeeling||"glücklich und geborgen"),
  worldName:clean(world.name||brief.worldName||"Abenteuerwelt"),
  worldType:clean(world.type||brief.worldType||"fantastische Welt"),
  locations:list(world.locations||brief.locations),
  characters,
  hero:characters[0]||normalizedCharacter({name:"die Hauptfigur"},0),
  partner:characters[1]||characters[0]||normalizedCharacter({name:"der Freund"},1),
  companion:characters[2]||characters[1]||characters[0]||normalizedCharacter({name:"der Begleiter"},2)
 };
}
function questObject(ctx){
 const x=lower(`${ctx.worldName} ${ctx.worldType} ${ctx.adventureType}`);
 if(/drache|feuer/.test(x))return "Herzfeuer";
 if(/meer|wasser|ozean/.test(x))return "Perlenlicht";
 if(/stern|weltraum|planet/.test(x))return "Sternenkern";
 if(/wald|fee|zauber/.test(x))return "Herzlicht";
 return "Leuchtstein";
}
function danger(ctx){
 const x=lower(`${ctx.worldName} ${ctx.worldType}`);
 if(/drache|feuer/.test(x))return "ein kalter Schattenwind, der Farben und Wärme aus der Drachenwelt zog";
 if(/meer|wasser/.test(x))return "eine lautlose Strömung, die das Licht unter der Wasseroberfläche verschluckte";
 if(/stern|weltraum/.test(x))return "ein grauer Nebel, der die Sternenwege verblassen ließ";
 return "ein stiller Schatten, der die vertrauten Wege unkenntlich machte";
}
function locationAt(ctx,index,total){
 const locations=ctx.locations.length?ctx.locations:["vertrauter Ausgangsort","geheimer Übergang","Prüfungsort","sicherer Zielort"];
 const stage=stageFor(index,total),home=locations[0],threshold=locations[1]||locations[0],firstRealm=locations[2]||ctx.worldName,middle=locations[3]||firstRealm,late=locations[4]||locations.at(-1),finalPlace=locations[5]||locations.at(-1);
 if(stage<=2)return home;
 if(stage===3||stage===23)return threshold;
 if(stage<=6)return firstRealm;
 if(stage<=10)return middle;
 if(stage<=14)return late;
 if(stage<=21)return finalPlace;
 if(stage===22)return ctx.worldName;
 return home;
}
function sensory(location,seed,mood=""){
 const x=lower(location),extra=lower(mood);
 let choices;
 if(/waldhaus|hütte|haus/.test(x))choices=["Durch das offene Fenster roch es nach Holz, Tee und feuchtem Moos","Auf dem Dach trommelten leise Tropfen, während die Tannen vor dem Fenster rauschten","Sonnenflecken wanderten über den Holzboden und ließen Staubkörner funkeln"];
 else if(/wasserfall|fluss|bach/.test(x))choices=["Der Wasserfall rauschte so laut, dass die Steine unter ihren Schuhen zu summen schienen","Silberne Tropfen schwebten in der Luft und kühlten ihre Wangen","Zwischen den Felsen glitzerte das Wasser wie ein Vorhang aus Glas"];
 else if(/see/.test(x))choices=["Der See lag glatt da, doch tief unten zogen Lichtkringel vorbei","Ein warmer Wind strich über das Wasser und trug den Duft von Minze heran","Auf der Oberfläche spiegelten sich Wolken, die wie schlafende Drachen aussahen"];
 else if(/kristall|höhle/.test(x))choices=["Blaue Lichtsplitter tanzten über die Höhlenwände","Jeder Schritt weckte ein leises Echo zwischen den Kristallen","Die Luft war kühl, und aus den Spalten schimmerte violettes Licht"];
 else if(/wald/.test(x))choices=["Die Blätter flüsterten, obwohl kein Wind ging","Moos leuchtete unter ihren Füßen wie kleine grüne Sterne","Zwischen den Stämmen schwebten goldene Pollen durch die Luft"];
 else if(/himmel|tal|berg/.test(x))choices=["Der Wind zupfte an ihren Kleidern und trieb weiße Wolken durch das Tal","Weit unter ihnen glitzerten Wege wie silberne Fäden","Die Luft war klar, und jeder Laut schien bis zu den Bergen zu tragen"];
 else choices=["Die Umgebung war voller kleiner Geräusche, die man erst bemerkte, wenn man ganz still wurde","Ein ungewöhnlicher Lichtschein lag über dem Weg","Alles sah vertraut aus und zugleich ein wenig verzaubert"];
 const base=pick(choices,seed);
 if(/spannung|angst|unruh/.test(extra))return `${base}. Irgendwo knackte etwas, das nicht zum Wind gehörte`;
 if(/geborgen|freude|hoffnung/.test(extra))return `${base}, und für einen Moment fühlte sich die Welt freundlich und weit an`;
 return base;
}
function appearanceCue(c){
 const parts=[c.appearanceDescription,c.specialFeatures,c.clothing,c.accessories].filter(Boolean);
 return clean(parts.join(", "));
}
function trait(c){return clean(first(c.strengths)||c.description||c.role||"aufmerksam");}
function shortChallenge(c){return clean(c.challenge||"zweifelt manchmal an sich");}
function stageFor(index,total){return total<=1?0:Math.round(index/(total-1)*24)}
function blueprint(ctx,index,total){
 const s=stageFor(index,total),h=ctx.hero.name,p=ctx.partner.name,c=ctx.companion.name,o=questObject(ctx),d=danger(ctx);
 const stages=[
  {focus:h,action:`${h} kümmerte sich um die letzten Dinge, während ${p} etwas bemerkte, das alle anderen übersahen`,obstacle:"Ein leises Klingen passte zu keinem Geräusch des Hauses",choice:`${h} wollte zuerst allein nachsehen, nahm ${p} dann aber mit`,result:"Vor der Tür glitzerte eine Spur, die eben noch nicht dort gewesen war",hook:"Die Spur führte zum alten Weg"},
  {focus:p,action:`${p} folgte den winzigen Lichtpunkten und entdeckte zwischen Wurzeln einen fremden Abdruck`,obstacle:`${h} hielt ihn zunächst für bedeutungslos`,choice:`${p} blieb ruhig und zeigte, dass jeder Lichtpunkt genau im selben Abstand lag`,result:"Aus zufälligem Glitzern wurde eine lesbare Spur",hook:"Hinter den Bäumen antwortete ein zweites Klingen"},
  {focus:h,action:`Die Spur führte tiefer in Richtung des verborgenen Übergangs`,obstacle:"An einer Weggabelung verschwand sie unter nassem Laub",choice:`${h} suchte nach vorne, ${p} dagegen kniete sich hin und prüfte die Unterseite der Blätter`,result:`${p} fand dort silbernen Staub`,hook:"Der Staub endete an einer Felswand"},
  {focus:h,action:`Zwischen den Felsen fanden sie einen Durchgang, den keiner von beiden kannte`,obstacle:"Ein Vorhang aus Wasser versperrte den Weg und machte jedes Wort unverständlich",choice:`${h} reichte ${p} die Hand, wartete auf ihr Nicken und ging nicht vor ihr hindurch`,result:"Hinter dem Wasser lag kein nasser Fels, sondern ein leuchtender Pfad",hook:`Der Weg führte nach ${ctx.worldName}`},
  {focus:p,action:`Die fremde Welt öffnete sich vor ihnen mit Farben, Geräuschen und Gerüchen, die es zu Hause nicht gab`,obstacle:"Der Rückweg wurde durchsichtig und verschwand",choice:`${p} entdeckte frische Spuren und verhinderte, dass Angst die Richtung bestimmte`,result:"Sie folgten den Spuren statt dem verschwundenen Ausgang",hook:"Die Spuren endeten bei einem zitternden Schatten"},
  {focus:c,action:`Der Schatten gehörte zu ${c}`,obstacle:`${c} erschrak vor den Fremden und wollte davonlaufen`,choice:`${p} blieb auf Abstand, während ${h} seine Stimme leiser machte`,result:`${c} fasste genug Vertrauen, um stehen zu bleiben`,hook:`Dann erzählte ${c}, was in ${ctx.worldName} geschehen war`},
  {focus:c,action:`${c} berichtete vom verschwundenen ${o} und davon, dass ${d}`,obstacle:`${c} hatte allein jede Spur verloren`,choice:`${h} versprach Hilfe, doch ${p} bestand darauf, dass alle gemeinsam entscheiden`,result:"Aus einer Rettung wurde eine gemeinsame Aufgabe",hook:"Eine eingeritzte Karte zeigte den ersten Prüfungsort"},
  {focus:h,action:"Die drei legten Karte, Beobachtungen und Erinnerungen nebeneinander",obstacle:"Zwei Wege sahen gleich richtig aus",choice:`${h} ordnete die Hinweise, ${p} achtete auf kleine Unterschiede und ${c} kannte die Geräusche der Welt`,result:"Erst die Verbindung ihrer Kenntnisse ergab eine Richtung",hook:"Der gewählte Weg führte zu einem Tor aus Stein"},
  {focus:h,action:"Am Tor drehten sich drei Symbole, jedes mit einem anderen Ton",obstacle:"Nach jedem Fehler sprangen alle Zeichen zurück",choice:`${h} prüfte die Reihenfolge, ${p} hörte auf die Töne und ${c} hielt das Licht ruhig`,result:"Beim dritten gemeinsamen Versuch öffnete sich ein schmaler Spalt",hook:"Der nächste Hinweis lag zu tief für einen Erwachsenenblick"},
  {focus:p,action:`${p} legte sich flach auf den Boden und sah als Einzige durch den schmalen Spalt`,obstacle:`${h} wollte erklären, was sie suchen sollte, obwohl er selbst nichts sehen konnte`,choice:`${p} bat ihn, kurz still zu sein, und beschrieb Zeichen, Farben und Abstände ganz genau`,result:`Ihr Blick machte aus dem unlesbaren Rätsel einen Weg`,hook:"Der Hinweis nannte einen Ort, an dem Schatten rückwärts fielen"},
  {focus:c,action:"Die Schatten zeigten in verschiedene Richtungen",obstacle:"Jede Spur schien sich bei jedem Schritt zu verändern",choice:`${c} bemerkte, dass nur ein Schatten nicht zum Licht passte`,result:"Unter diesem Schatten lag ein kleiner Schlüssel",hook:"Der Schlüssel begann in der Nähe einer Nebelbrücke warm zu werden"},
  {focus:h,action:"Die Brücke wuchs erst aus dem Nebel, als der Schlüssel ihr Schloss berührte",obstacle:"Zwischen den schwankenden Brettern fehlte ein ganzes Stück",choice:"Sie banden Rucksäcke und Hände mit einem Seil zusammen",result:"Langsam erreichten sie die Mitte",hook:"Dort begann die Brücke stärker zu zittern"},
  {focus:h,action:`${h} wollte das fehlende Stück allein überspringen und die anderen danach herüberziehen`,obstacle:`Genau dieser Entschluss brachte ihn aus dem Gleichgewicht`,choice:`Als ${p} einen sicheren Griff entdeckte und ${c} das Seil spannte, musste ${h} ihre Hilfe annehmen`,result:`Er kam zurück auf das Brett, aber sein Stolz blieb einen Moment im Nebel hängen`,hook:"Unter der Brücke klapperte eine verborgene Klappe"},
  {focus:p,action:`${p} entdeckte unter dem Rand einen Hebel, den ${h} im Vorbeigehen übersehen hatte`,obstacle:"Der Hebel war zu schwer für eine Person",choice:`${h} fragte diesmal nicht, wer es allein schaffen könne, sondern wo jeder am besten anpackte`,result:"Sie fanden drei passende Griffstellen",hook:"Auf ein gemeinsames Zeichen mussten alle gleichzeitig drücken"},
  {focus:"team",action:"Hände, Pfoten und Krallen lagen am selben Hebel",obstacle:"Zuerst bewegte er sich keinen Fingerbreit",choice:"Sie zählten, hörten aufeinander und drückten im selben Augenblick",result:"Mit einem tiefen Knacken schob sich das fehlende Brückenstück hervor",hook:"Dahinter wartete eine Schale aus blindem Glas"},
  {focus:c,action:"In der Glasschale lag ein Hinweis, der nur durch Wärme sichtbar wurde",obstacle:`${c} brachte statt einer großen Flamme nur einen dünnen Rauchkringel hervor`,choice:`${c} versuchte es noch einmal, doch Scham machte den Atem kurz`,result:"Die Schrift blieb unsichtbar",hook:`${c} wandte sich ab`},
  {focus:c,action:`${c} behauptete, sein kleines Feuer sei wertlos`,obstacle:"Ohne Wärme konnten sie nicht weiter",choice:`${h} erinnerte sich an seinen eigenen Fehler auf der Brücke; ${p} schirmte die Schale vor dem Wind ab`,result:`Niemand verlangte eine große Flamme – nur den Mut zu einem neuen Versuch`,hook:"Ein winziger Funke blieb diesmal bestehen"},
  {focus:c,action:"Der Funke wuchs nicht groß, aber er wärmte das Glas genau genug",obstacle:"Die Zeichen leuchteten nur für wenige Herzschläge",choice:`${p} merkte sich die Reihenfolge, ${h} zeichnete sie in den Staub und ${c} hielt die Wärme`,result:"Der Hinweis blieb erhalten, weil jeder einen anderen Teil übernahm",hook:"Die Zeichen führten zum letzten Tor"},
  {focus:"team",action:"Am letzten Tor lagen drei Vertiefungen nebeneinander",obstacle:"Kein Fundstück passte allein",choice:"Sie verbanden Schlüssel, Karte und Zeichenfolge, statt weiter nach einem einzelnen Wunder zu suchen",result:"Die Vertiefungen begannen im gleichen Rhythmus zu leuchten",hook:"Hinter dem Tor wartete die Kammer des Herzlichts"},
  {focus:h,action:`In der Kammer schwebte der ${o} über einem Ring aus kaltem Wind`,obstacle:"Der Wind ließ niemanden lange genug in die Nähe",choice:`${h} suchte Schutz, ${p} beobachtete die Pausen und ${c} bereitete seinen kleinen Funken vor`,result:"Zum ersten Mal entstand der Plan nicht im Kopf eines Einzelnen",hook:"Für einen kurzen Moment wurde der Weg frei"},
  {focus:"team",action:`Auf ${p}s Zeichen liefen sie gleichzeitig los`,obstacle:"Der Schattenwind kehrte früher zurück als erwartet",choice:`${h} schützte, ohne alles an sich zu reißen; ${p} griff nach dem ${o}; ${c} löste mit seinem Funken den letzten Verschluss`,result:`${o} landete sicher in ihren Händen`,hook:"Doch ein dunkler Riss blieb in der Kammer"},
  {focus:"team",action:`Sie brachten den ${o} an seinen Platz zurück`,obstacle:"Der letzte Riss reagierte weder auf Kraft noch auf Feuer",choice:"Alle drei legten ihre Hände und Pfote auf den Stein und hielten denselben Gedanken fest: Keiner von ihnen hätte den Weg allein geschafft",result:`Wärme und Farbe kehrten nach ${ctx.worldName} zurück`,hook:"Aus den Verstecken kamen die ersten Bewohner"},
  {focus:c,action:`Die Bewohner begrüßten ${h}, ${p} und ${c}`,obstacle:`${c} glaubte noch immer, sein kleiner Funke sei kaum der Rede wert`,choice:`${p} zeigte auf den wieder leuchtenden ${o}; ${h} erzählte nicht von seiner eigenen Kraft, sondern von dem Funken, der alles möglich gemacht hatte`,result:`${c} konnte den eigenen Anteil endlich sehen`,hook:"Am verborgenen Übergang wartete der Abschied"},
  {focus:h,action:`Am Eingang mussten ${h} und ${p} Abschied von ${c} nehmen`,obstacle:"Niemand wusste, ob sich der Weg noch einmal öffnen würde",choice:`${c} schenkte ihnen ein kleines Erinnerungszeichen, das warm wurde, wenn ein Freund an sie dachte`,result:"Der Abschied blieb traurig und zugleich tröstlich",hook:"Dann rauschte der Übergang wieder wie ein ganz gewöhnlicher Wasserfall"},
  {focus:h,action:`Zurück am Ausgangsort legten ${h} und ${p} das Erinnerungszeichen zwischen sich`,obstacle:"Das Abenteuer fühlte sich beinahe wie ein Traum an",choice:`${h} hörte ${p} zu, als sie erzählte, was sie beide geschafft hatten, und widersprach ihr kein einziges Mal`,result:`Als das Zeichen kurz aufleuchtete, wusste ${h}, dass Beschützen nicht bedeutet, alles allein zu tun`,hook:`Die nächste gemeinsame Geschichte hatte längst begonnen`}
 ];
 return stages[s]||stages.at(-1);
}
function moodFor(ctx,index,total){
 const desired=ctx.feelings.length?ctx.feelings:["Staunen","Spannung","Geborgenheit","Freude"];
 const stage=stageFor(index,total);
 if(stage<5)return desired.find(x=>/staun|neugier/i.test(x))||desired[0];
 if(stage<12)return desired.find(x=>/spann|mut/i.test(x))||desired[1]||desired[0];
 if(stage<20)return desired.find(x=>/spann|angst|hoff/i.test(x))||desired[1]||desired[0];
 return desired.find(x=>/geborg|freude|hoff/i.test(x))||desired.at(-1);
}
function speakerLine(character,intent,seed,ctx){
 const name=character.name,strength=trait(character),challenge=shortChallenge(character),role=lower(character.role);
 const young=/klein|schwester|3|4/.test(`${role} ${character.age}`),dragon=/drache/.test(`${role} ${lower(character.description)} ${lower(ctx.worldName)}`);
 if(intent==="observe")return pick(young?[`„Da ist noch etwas“, sagte ${name}. „Ganz unten.“`,`„Nicht die großen Zeichen“, sagte ${name}. „Die kleinen dazwischen.“`,`„Wartet kurz. Das Licht macht immer denselben Sprung.“`]:[`„Etwas daran passt nicht“, sagte ${name}. „Schaut auf die Abstände.“`,`„Bevor wir weitergehen, sollten wir prüfen, was sich wirklich verändert hat“, sagte ${name}.`,`„Dort ist eine Spur, aber sie will nicht gefunden werden“, murmelte ${name}.`],seed);
 if(intent==="doubt")return pick(dragon?[`„Es kommt wieder nur Rauch“, sagte ${name} leise. „Was soll daran helfen?“`,`„Vielleicht braucht ihr jemanden mit richtigem Feuer“, murmelte ${name}.`,`„Ich habe es so oft versucht“, sagte ${name}. „Es wird nie groß genug.“`]:[`„Was, wenn ich es wieder falsch mache?“, fragte ${name}.`,`„Ich weiß nicht, ob ich das kann“, sagte ${name}, ohne aufzusehen.`,`„Mein Mut fühlt sich gerade sehr klein an“, gestand ${name}.`],seed);
 if(intent==="plan")return pick([`„Jeder übernimmt den Teil, den er am besten kann“, sagte ${name}.`,`„Nicht nacheinander“, sagte ${name}. „Gleichzeitig.“`,`„Wir brauchen keinen Stärksten“, sagte ${name}. „Wir brauchen einen guten Plan.“`],seed);
 if(intent==="boundary")return pick(young?[`„Ich kann selbst schauen“, sagte ${name}. „Du musst nur warten, bis ich fertig bin.“`,`„Du darfst mich beschützen“, sagte ${name}. „Aber du musst mir auch glauben.“`,`„Ich bin klein“, sagte ${name}. „Nicht unsichtbar.“`]:[`„Lass mich meinen Teil versuchen“, sagte ${name}.`,`„Hilfe ist nicht dasselbe wie Wegnehmen“, sagte ${name}.`,`„Frag mich, bevor du für mich entscheidest“, sagte ${name}.`],seed);
 if(intent==="comfort")return pick([`„Du musst es nicht groß machen“, sagte ${name}. „Du musst es nur versuchen.“`,`„Wir bleiben hier“, sagte ${name}. „Auch wenn es länger dauert.“`,`„Dein Teil ist nicht kleiner, nur weil er anders aussieht“, sagte ${name}.`],seed);
 return pick([`„Wir gehen zusammen“, sagte ${name}.`,`„Einer sieht mehr als einer“, meinte ${name}.`,`„Dann finden wir eben einen anderen Weg“, sagte ${name}.`],seed);
}
function transition(previous,index,ctx){
 if(!previous)return "";
 const hook=sentence(clean(previous.hook||"Der nächste Schritt wartete").replace(/[.!?]+$/g,""));
 const variants=[
  `Der vorige Hinweis war eindeutig gewesen: ${hook}`,
  `Noch während sie den letzten Fund verstauten, blieb der nächste Hinweis in ihren Gedanken. ${hook}`,
  `Sie ließen den vergangenen Moment hinter sich. Vor ihnen wartete bereits das Nächste: ${hook}`,
  `Was eben noch wie ein Ende ausgesehen hatte, wurde zum Anfang eines neuen Wegstücks. ${hook}`
 ];
 return pick(variants,index+hash(ctx.title));
}
function exactSceneFacts(scene){return [useful(scene?.goal),useful(scene?.conflict),useful(scene?.result),useful(scene?.messageMoment)].filter(Boolean);}
function influence(ctx,event,scene,index,total){
 const team=event.focus==="team";
 const focus=team?ctx.hero:(ctx.characters.find(c=>c.name===event.focus)||ctx.hero);
 return {
  purpose:ctx.purpose,
  coreMessage:ctx.coreMessage,
  secondaryMessage:ctx.secondaryMessages[index%Math.max(1,ctx.secondaryMessages.length)]||"",
  world:`${ctx.worldName} – ${ctx.worldType}`,
  mood:moodFor(ctx,index,total),
  focusCharacter:team?`${ctx.hero.name}, ${ctx.partner.name} und ${ctx.companion.name}`:focus.name,
  focusStrength:team?ctx.characters.slice(0,3).map(trait).join(", "):trait(focus),
  focusChallenge:team?ctx.characters.slice(0,3).map(shortChallenge).join(" | "):shortChallenge(focus),
  focusDevelopment:team?ctx.characters.slice(0,3).map(c=>c.development).filter(Boolean).join(" | "):focus.development,
  relationship:team?ctx.characters.slice(0,3).map(c=>c.relationship).filter(Boolean).join(" | "):focus.relationship,
  sceneFacts:exactSceneFacts(scene),
  themeAction:event.choice,
  consequence:event.result
 };
}

function physicalReaction(character,seed){
 return pick([
  `${character.name} hielt unwillkürlich den Atem an.`,
  `${character.name} kniff die Augen zusammen und sah ein zweites Mal hin.`,
  `${character.name} spürte, wie das Herz ein wenig schneller schlug.`,
  `${character.name} blieb stehen, damit kein vorschneller Schritt die Spur zerstörte.`
 ],seed);
}
function challengeNarration(character,seed){
 const x=lower(character.challenge),name=character.name;
 if(/allein|selbst lösen|alles lösen/.test(x))return pick([
  `${name} merkte, wie schnell er den anderen die Aufgabe aus der Hand nehmen wollte. So versuchte er oft, alle zu beschützen – und übersah dabei manchmal, was sie selbst konnten.`,
  `Der vertraute Gedanke war sofort da: Er musste das allein schaffen. ${name} kannte diesen Gedanken gut. Er klang vernünftig und machte die Welt doch enger.`,
  `${name} wollte schon vorangehen, entscheiden und die Gefahr von den anderen fernhalten. Dann erinnerte er sich daran, dass Beschützen auch bedeuten konnte, zuzuhören.`
 ],seed);
 if(/unterschätzt|zu klein|nicht ernst/.test(x))return pick([
  `${name} kannte den Blick, der über sie hinwegging, weil sie kleiner war. Sie antwortete nicht mit Lautstärke, sondern mit der Genauigkeit, die ihr bisher jedes Mal geholfen hatte.`,
  `Oft entschieden die Größeren zu früh, was ${name} angeblich nicht konnte. Gerade deshalb prüfte sie jedes Detail, bevor sie sprach.`,
  `${name} spürte den Wunsch, sofort zu beweisen, dass sie mithalten konnte. Stattdessen nahm sie sich die Zeit, die anderen nicht hatten.`
 ],seed);
 if(/feuer|flamme|nicht.*kann|kein großes/.test(x))return pick([
  `${name} spürte das vertraute Kribbeln im Hals und zugleich die Angst, dass wieder nur Rauch kommen würde. Die Erwartung einer großen Flamme wog schwerer als jeder Stein.`,
  `Sobald es auf sein Feuer ankam, wurde ${name}s Atem kurz. Er dachte an all die Versuche, bei denen ein Rauchkringel das Einzige gewesen war, was blieb.`,
  `${name} wusste, dass die anderen auf ihn warteten. Gerade das machte den kleinen Funken in seinem Inneren so schwer erreichbar.`
 ],seed);
 return `${name} musste gegen eine vertraute Unsicherheit anarbeiten: ${clean(character.challenge||"Der nächste Schritt verlangte Mut")}.`;
}
function developmentBeat(character){
 const x=lower(character.development),name=character.name;
 if(/vertrau/.test(x))return `${name} wartete auf die Idee der anderen, statt sie vorwegzunehmen.`;
 if(/klein.*groß|auch kleine|bewirken/.test(x))return `${name} ließ ihre Beobachtung für sich sprechen; sie brauchte keine große Geste.`;
 if(/an sich|glaub/.test(x))return `${name} versuchte nicht, jemand anderes zu sein, sondern setzte genau das ein, was er hatte.`;
 return clean(character.development)?`${name} handelte einen kleinen Schritt näher an dem Menschen, der er werden wollte.`:"";
}
function narrativeDetail(ctx,stage,location){
 const h=ctx.hero.name,p=ctx.partner.name,c=ctx.companion.name;
 const details=[
  `Im Haus war es plötzlich so still, dass selbst das Ticken der Uhr zu laut klang.`,
  `Die Lichtpunkte pulsierten nacheinander, als würden sie geduldig auf jemanden warten, der genau hinsah.`,
  `An den nassen Blatträndern hing derselbe silberne Staub wie an der ersten Spur.`,
  `Das Wasser legte sich kalt auf ihre Ärmel, doch hinter dem Vorhang war die Luft überraschend warm.`,
  `Über ihnen spannte sich ein Himmel, dessen Wolken langsam gegen den Wind zogen.`,
  `${c}s Schwanzspitze zitterte, obwohl er versuchte, ganz ruhig zu wirken.`,
  `Auf der Karte verliefen die Linien nicht gerade; sie wanden sich wie lebendige Wurzeln umeinander.`,
  `Jedes Mal, wenn sie ihre Beobachtungen verglichen, wurde aus drei halben Hinweisen ein vollständiger.`,
  `Die Symbole fühlten sich unter den Fingern verschieden an: eines glatt, eines rau, eines warm.`,
  `Der Spalt war so schmal, dass ${p}s Atem kleine Staubwolken über den Boden schob.`,
  `Der falsche Schatten bebte am Rand, als wüsste er, dass ${c} ihn erkannt hatte.`,
  `Unter der Brücke war nichts als Nebel, doch das Seil zwischen ihnen blieb fest und wirklich.`,
  `Das Brett ächzte unter ${h}s Schuhen, während die Hände der anderen das Seil straff hielten.`,
  `Unter dem Hebel klebte feuchtes Moos; jemand musste ihn vor sehr langer Zeit versteckt haben.`,
  `Das tiefe Knacken wanderte durch die ganze Brücke und verlor sich erst weit hinter ihnen.`,
  `Auf dem blinden Glas sammelte sich ${c}s Atem als kleiner, runder Fleck.`,
  `Der Rauchkringel stieg auf, drehte sich einmal um sich selbst und löste sich nicht sofort auf.`,
  `Die leuchtenden Zeichen spiegelten sich in ${p}s Augen, während ${h} sie hastig in den Staub übertrug.`,
  `Als die drei Fundstücke nebeneinanderlagen, liefen feine Lichtfäden von einem zum anderen.`,
  `Der kalte Wind kam in regelmäßigen Stößen, dazwischen lagen drei kurze, kostbare Atemzüge.`,
  `Für einen Moment bewegten sie sich wie Teile eines einzigen Plans, ohne dass jemand ein weiteres Wort brauchte.`,
  `Der dunkle Riss war dünn wie ein Haar und doch kälter als alles, was sie bisher berührt hatten.`,
  `Aus Türen, Höhlen und Baumkronen erschienen vorsichtig die ersten Bewohner der Drachenwelt.`,
  `Hinter dem Wasser verschwammen ${c}s Umrisse, bis nur noch das warme Zeichen in ${p}s Hand blieb.`,
  `Zu Hause roch alles wieder nach Holz und Tee, aber keiner von ihnen war noch ganz derselbe wie am Morgen.`
 ];
 return details[stage]||details.at(-1);
}
function stageReflection(stage,ctx,event,focus,settings,location){
 if(stage===9)return `${ctx.hero.name} sah ${ctx.partner.name} an. Nicht wie jemanden, den er mitnehmen musste, sondern wie jemanden, dessen Blick ihnen gerade den Weg geöffnet hatte.`;
 if(stage===12)return `${ctx.hero.name} hasste das Gefühl, die Kontrolle zu verlieren. Noch schwerer war nur die Erkenntnis, dass die ausgestreckten Hände der anderen keine Niederlage bedeuteten.`;
 if(stage===16)return `Keiner sprach von einer großen Flamme. In diesem Augenblick ging es nur darum, ${ctx.companion.name} genug Ruhe zu geben, damit sein eigener Mut wieder Platz fand.`;
 if(stage===20)return `Ihre Bewegungen waren verschieden und griffen doch ineinander: schützen, beobachten, den kleinen Funken halten. Gerade deshalb funktionierte der Plan.`;
 if(stage===24)return `${ctx.hero.name} verstand nun, dass Nähe nicht darin bestand, immer vor ${ctx.partner.name} zu gehen. Manchmal bestand sie darin, neben ihr zu bleiben.`;
 return "";
}
function isArcMoment(character,stage,ctx){
 if(character.name===ctx.hero.name)return [0,3,8,12,19,20,24].includes(stage);
 if(character.name===ctx.partner.name)return [1,2,4,9,13].includes(stage);
 if(character.name===ctx.companion.name)return [5,6,10,15,16,17,22].includes(stage);
 return false;
}
function dialogueForStage(ctx,stage){
 const h=ctx.hero.name,p=ctx.partner.name,c=ctx.companion.name;
 const pairs=[
  [`„Hörst du das auch?“, fragte ${p}. „Es klingt wie ein winziges Glöckchen.“`,`„Wir sehen gemeinsam nach“, sagte ${h}. „Und wir bleiben beieinander.“`],
  [`„Die Lichtpunkte liegen genau gleich weit auseinander“, sagte ${p}. „Das ist kein Zufall.“`,`${h} beugte sich näher. „Du hast recht. Zeig mir, wo die Reihe beginnt.“`],
  [`„Unter den Blättern glitzert etwas“, sagte ${p}.`,`„Dann suche ich diesmal dort, wo du hinsiehst“, antwortete ${h}.`],
  [`„Bist du bereit?“, fragte ${h} und hielt ${p} die Hand hin.`,`„Ja“, sagte ${p}. „Aber nicht hinter dir. Neben dir.“`],
  [`„Da vorne sind Spuren“, sagte ${p}. „Ganz frisch.“`,`„Dann führst du uns“, sagte ${h}, obwohl ihm das Warten schwerfiel.`],
  [`„Wir kommen nicht näher“, sagte ${p} zu ${c}. „Du darfst selbst entscheiden.“`,`„Wir wollen dir nichts wegnehmen“, fügte ${h} leise hinzu.`],
  [`„Das Herzfeuer ist fort“, sagte ${c}. „Seitdem wird alles kälter.“`,`„Wir helfen“, sagte ${h}. ${p} hob den Finger. „Wir entscheiden aber zu dritt.“`],
  [`„Was kannst du hören, was wir nicht hören?“, fragte ${h} ${c}.`,`„Und ich schaue nach den kleinen Zeichen“, sagte ${p}. „So fehlt uns nichts.“`],
  [`„Die Formen wiederholen sich“, sagte ${h}.`,`„Aber die Töne nicht“, antwortete ${p}. ${c} hielt das Licht näher an den Stein.`],
  [`„Ich kann selbst lesen, was dort steht“, sagte ${p}. „Gebt mir nur einen Moment.“`,`${h} schluckte seine Erklärung hinunter. „Gut. Wir warten.“`],
  [`„Dieser Schatten bewegt sich falsch“, sagte ${c}.`,`„Dann prüfen wir genau den“, antwortete ${h}.`],
  [`„Nicht nach unten schauen“, sagte ${h}.`,`„Ich schaue lieber auf das nächste Brett“, erwiderte ${p}. „Das hilft mehr.“`],
  [`„Elias, zurück!“, rief ${p}. „Links von deiner Hand ist ein Griff.“`,`„Ich sehe ihn“, presste ${h} hervor. „Flammenzahn, halt das Seil!“`],
  [`„Hier unten ist ein Hebel“, sagte ${p}.`,`${h} kniete sich neben sie. „Sag uns, wo wir anfassen sollen.“`],
  [`„Auf drei“, sagte ${h}.`,`„Nicht zu früh“, warnte ${p}. ${c} stellte beide Pfoten fest auf den Boden.`],
  [`„Es wird wieder nur Rauch“, murmelte ${c}.`,`„Dann sehen wir zuerst, was dieser Rauch kann“, sagte ${p}.`],
  [`„Du musst keine große Flamme machen“, sagte ${h}. „Nur deine.“`,`${c} sah zur Glasschale. „Und wenn sie wieder ausgeht?“ – „Dann versuchen wir es wieder“, sagte ${p}.`],
  [`„Jetzt!“, rief ${p}. „Die Zeichen leuchten.“`,`„Ich halte die Wärme“, sagte ${c}. „Elias, zeichne!“`],
  [`„Keines der Dinge reicht allein“, sagte ${h}.`,`„Vielleicht sollen sie gerade deshalb zusammengehören“, meinte ${p}.`],
  [`„Der Wind macht immer dieselbe Pause“, sagte ${p}.`,`„Dann ist das unser Augenblick“, sagte ${h}. „Flammenzahn, bist du bereit?“`],
  [`„Jetzt!“, rief ${p}.`,`${h} stellte sich schützend vor sie, ohne ihr den Weg abzuschneiden. ${c} holte tief Luft.`],
  [`„Der Riss bleibt dunkel“, sagte ${c}.`,`„Dann versuchen wir nicht mehr, ihn zu besiegen“, sagte ${p}. „Wir geben dem Licht gemeinsam Halt.“`],
  [`„Mein Funke war doch winzig“, sagte ${c}.`,`„Genau dieser Funke hat gefehlt“, antwortete ${p}. ${h} nickte. „Ohne ihn wären wir nicht hier.“`],
  [`„Wirst du uns vergessen?“, fragte ${p}.`,`„Nicht, solange dieses Zeichen warm wird“, sagte ${c}.`],
  [`„Du hast mich gerettet“, sagte ${h}.`,`${p} schüttelte den Kopf. „Wir haben uns gerettet.“`]
 ];
 return pairs[stage]||pairs.at(-1);
}
function observerForStage(ctx,stage,focus){
 if(stage<=4)return ctx.partner;
 if(stage<=7)return ctx.companion;
 if(stage===8)return ctx.hero;
 if(stage===9)return ctx.partner;
 if(stage===10)return ctx.companion;
 if(stage===11)return ctx.hero;
 if(stage<=14)return ctx.partner;
 if(stage<=18)return ctx.companion;
 if(stage===20)return ctx.partner;
 if(stage>=21&&stage<=23)return ctx.companion;
 if(stage===24)return ctx.partner;
 return focus;
}
function proseParagraphs(plan,scene,index,total,settings,variation,mode,previous){
 const ctx=storyContext(plan),event=blueprint(ctx,index,total),stage=stageFor(index,total),location=locationAt(ctx,index,total),mood=moodFor(ctx,index,total),seed=hash(scene?.id||scene?.title||index)+variation*41;
 const focus=event.focus==="team"?pick([ctx.hero,ctx.partner,ctx.companion],stage):(ctx.characters.find(c=>c.name===event.focus)||ctx.hero);
 const observed=observerForStage(ctx,stage,focus),dialogue=dialogueForStage(ctx,stage);
 const opening=[transition(previous,index,ctx),sentence(sensory(location,seed,mood)),sentence(event.action)].filter(Boolean).join(" ");
 const observation=`${dialogue[0]} ${physicalReaction(observed,seed+4)}`;
 const obstacle=`${sentence(event.obstacle)} ${physicalReaction(focus,seed+6)}`;
 const detail=narrativeDetail(ctx,stage,location);
 const inner=isArcMoment(focus,stage,ctx)?`${challengeNarration(focus,seed+8)} ${detail}`:detail;
 const decision=`${sentence(event.choice)} ${dialogue[1]}`;
 const consequence=`${sentence(event.result)} ${developmentBeat(focus)}`.trim();
 const voiceBlock=settings.voice==="Ruhig und poetisch"?`${sentence(sensory(location,seed+12,mood))} Das Licht schien den Atem anzuhalten, als wolle auch die Welt wissen, wie sie sich entschieden.`:settings.voice==="Lebendig und humorvoll"?pick([`${ctx.companion.name} schüttelte sich so kräftig, dass ein kleiner Rauchkringel aussah, als hätte er sich verirrt.`,`Für einen Augenblick stolperten Plan, Füße und Mut beinahe übereinander – zum Glück in derselben Richtung.`,`${ctx.partner.name} hob eine Augenbraue. Das war meist das Zeichen dafür, dass jemand anderes gerade etwas Offensichtliches übersehen hatte.`],seed+13):settings.voice==="Spannend und direkt"?`Ein Laut schnitt durch die Stille. Alle fuhren herum. Für einen Herzschlag blieb keine Zeit zum Überlegen.`:"";
 const vivid=mode==="vivid"?`${sentence(sensory(location,seed+15,mood))} Farben, Geräusche und Bewegungen lagen so deutlich vor ihnen, dass kein Detail zufällig wirkte.`:"";
 const deep=mode==="deep"?stageReflection(stage,ctx,event,focus,{...settings,themeDelivery:"Deutlich, aber nicht belehrend"},location):"";
 const exciting=mode==="exciting"?`Dann kippte der Augenblick. Etwas bewegte sich, der sichere Abstand verschwand, und sie mussten handeln, bevor aus einem Fehler eine Gefahr wurde.`:"";
 const extraDialogue=mode==="dialogue"?`${speakerLine(ctx.partner,stage===9?"boundary":"plan",seed+17,ctx)} ${ctx.hero.name} antwortete nicht sofort; diesmal hörte er den Satz bis zum Ende.`:"";
 const reflection=deep||stageReflection(stage,ctx,event,focus,settings,location);
 const hook=pick([
  `${sentence(event.hook)} Keiner von ihnen wusste, wie viel dieser nächste Schritt verändern würde.`,
  `${sentence(event.hook)} Damit war die Ruhe des Augenblicks vorbei.`,
  `${sentence(event.hook)} Sie nahmen den Hinweis mit und gingen weiter.`
 ],seed+19);
 return {ctx,event,influence:influence(ctx,event,scene,index,total),blocks:[opening,observation,obstacle,inner,decision,consequence,voiceBlock,vivid,exciting,extraDialogue,reflection,hook].filter(Boolean)};
}
function targetParagraphs(settings,mode){
 if(mode==="concise"||settings.sceneLength==="Kurz")return 4;
 if(settings.sceneLength==="Mittel")return 6;
 return settings.literaryDepth==="Hoch"?8:7;
}
function writeScene(plan,scene,index,total,settings={},variation=0,mode="literary",previous=null){
 const cfg={...defaults(plan),...settings},data=proseParagraphs(plan,scene,index,total,cfg,variation,mode,previous),count=targetParagraphs(cfg,mode);
 let blocks=data.blocks;
 if(count<blocks.length){
  const must=[blocks[0],blocks[1],blocks[2],blocks.at(-2),blocks.at(-1)].filter(Boolean);
  const middle=blocks.slice(3,-2);
  blocks=[...must.slice(0,3),...middle.slice(0,Math.max(0,count-5)),...must.slice(3)].filter(Boolean);
 }
 if(cfg.dialogueLevel==="Wenig")blocks=blocks.filter((x,i)=>i===0||!/^„/.test(x));
 if(cfg.dialogueLevel==="Viel"&&mode!=="concise")blocks.splice(Math.min(4,blocks.length-1),0,speakerLine(data.ctx.partner,"plan",hash(scene?.id)+variation+23,data.ctx));
 let text=blocks.join("\n\n");
 if(cfg.readingLevel==="3–6 Jahre")text=text.replace(/; /g,". ").replace(/ – /g,", ");
 return {text:text.replace(/\.{2,}/g,".").trim(),influence:data.influence,endingState:{hook:data.event.hook,focus:data.event.focus,mood:data.influence.mood}};
}
function quality(text,scene,influence,settings){
 const paragraphs=String(text||"").split(/\n\s*\n/).filter(Boolean),sentences=clean(text).split(/(?<=[.!?])\s+/).filter(Boolean),count=wc(text),average=sentences.length?count/sentences.length:0;
 const young=settings?.readingLevel==="3–6 Jahre";
 const names=[influence?.focusCharacter].filter(Boolean);
 const hasDialogue=/„[^“]+“/.test(text),hasConcrete=/\b(ging|lief|griff|zeigte|öffnete|legte|zog|drückte|fand|hörte|sah|nahm|folgte|hielt|sprang|leuchtete|wartete|kniete|flüsterte)\b/i.test(text);
 const hasTemplate=/Handlung sichtbar|kleine altersgerechte Herausforderung|Dabei wurde ihnen klar|Noch wussten sie nicht|Man konnte jede Bewegung deutlich sehen/i.test(text);
 const starts=sentences.map(s=>s.split(/\s+/).slice(0,3).join(" ").toLowerCase()),unique=new Set(starts).size/Math.max(1,starts.length);
 const specific=names.every(name=>!name||text.includes(name))&&Boolean(influence?.world)&&Boolean(influence?.focusChallenge);
 const flags={
  ageAppropriate:average<=(young?15:19),
  detailed:count>=(settings?.sceneLength==="Ausführlich"?150:100),
  dialogue:hasDialogue,
  concreteAction:hasConcrete,
  noTemplatePhrases:!hasTemplate,
  variedSentences:unique>=.7,
  narrativeFlow:paragraphs.length>=4,
  contextInfluence:specific,
  themeInAction:Boolean(influence?.themeAction&&influence?.consequence),
  illustrationReady:Boolean(scene?.illustrationIdea||hasConcrete)
 };
 const score=Math.round(Object.values(flags).filter(Boolean).length/Object.keys(flags).length*100);
 return {...flags,score,wordCount:count,paragraphs:paragraphs.length,averageSentenceWords:Math.round(average*10)/10};
}
function report(manuscript,plan){
 const ctx=storyContext(plan),all=manuscript.scenes.map(s=>s.text).join("\n"),totalWords=wc(all),characterCoverage={};
 ctx.characters.forEach(c=>characterCoverage[c.name]=(all.match(new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"))||[]).length);
 const paragraphs=manuscript.scenes.flatMap(s=>s.text.split(/\n\s*\n/).map(clean).filter(Boolean)),duplicates=paragraphs.length-new Set(paragraphs).size;
 const themeScenes=manuscript.scenes.filter(s=>s.influence?.themeAction).length;
 return {
  totalWords,
  averageSceneWords:manuscript.scenes.length?Math.round(totalWords/manuscript.scenes.length):0,
  characterCoverage,
  themeCoverage:manuscript.scenes.length?Math.round(themeScenes/manuscript.scenes.length*100):0,
  duplicateParagraphs:duplicates,
  continuityCoverage:manuscript.scenes.length?Math.round(manuscript.scenes.filter((s,i)=>i===0||s.previousState).length/manuscript.scenes.length*100):0
 };
}
function generate(plan,settings){
 const cfg={...defaults(plan),...(settings||{})},source=list(plan.scenes),scenes=[];
 let previous=null;
 source.forEach((scene,index)=>{
  const written=writeScene(plan,scene,index,source.length,cfg,0,"literary",previous);
  const item={id:uid("MS"),sceneId:scene.id,chapterId:scene.chapterId,chapterNumber:scene.chapterNumber,sceneNumber:scene.number,title:scene.title,text:written.text,status:"draft",wordCount:wc(written.text),revision:1,variation:0,history:[],influence:written.influence,previousState:previous,endingState:written.endingState};
  item.quality=quality(item.text,scene,item.influence,cfg);scenes.push(item);previous=written.endingState;
 });
 const manuscript={schemaVersion:"2.0",generatedAt:new Date().toISOString(),generator:"CAPS Literary Manuscript Engine 2.0 – kontextgebundener Erzählgenerator",settings:cfg,chapters:list(plan.chapters).map(c=>({id:c.id,number:c.number,title:c.title,status:"draft"})),scenes,progress:0,qualityScore:0,editorialReport:null};
 return recalc(manuscript,plan);
}
function upgrade(manuscript,plan){
 if(!manuscript)return manuscript;
 manuscript.settings={...defaults(plan),...(manuscript.settings||{})};
 manuscript.schemaVersion="2.0";
 let previous=null;
 manuscript.scenes=list(manuscript.scenes).map((s,index)=>{
  const source=(plan.scenes||[]).find(x=>x.id===s.sceneId)||{};
  const ctx=storyContext(plan),event=blueprint(ctx,index,manuscript.scenes.length),inf=s.influence||influence(ctx,event,source,index,manuscript.scenes.length);
  const item={...s,variation:Number(s.variation)||0,history:list(s.history),influence:inf,previousState:s.previousState||previous,endingState:s.endingState||{hook:event.hook,focus:event.focus,mood:inf.mood}};
  item.quality=quality(item.text,source,item.influence,manuscript.settings);previous=item.endingState;return item;
 });
 return recalc(manuscript,plan);
}
function rewrite(plan,manuscript,sceneId,mode="literary"){
 upgrade(manuscript,plan);
 const target=manuscript.scenes.find(s=>s.id===sceneId),index=manuscript.scenes.indexOf(target),source=(plan.scenes||[]).find(s=>s.id===target?.sceneId);
 if(!target||!source)return manuscript;
 target.history.push({revision:target.revision,text:target.text,changedAt:new Date().toISOString(),mode});
 const previous=index>0?manuscript.scenes[index-1].endingState:null,written=writeScene(plan,source,index,manuscript.scenes.length,manuscript.settings,(target.variation||0)+1,mode,previous);
 target.revision=(target.revision||1)+1;target.variation=(target.variation||0)+1;target.text=written.text;target.influence=written.influence;target.previousState=previous;target.endingState=written.endingState;target.status="in-progress";
 if(manuscript.scenes[index+1])manuscript.scenes[index+1].previousState=written.endingState;
 return recalc(manuscript,plan);
}
function rewriteChapter(plan,manuscript,chapterId,mode="literary"){
 upgrade(manuscript,plan);
 manuscript.scenes.filter(s=>s.chapterId===chapterId).forEach(s=>rewrite(plan,manuscript,s.id,mode));
 return recalc(manuscript,plan);
}
function recalc(manuscript,plan){
 const n=manuscript.scenes.length||1;manuscript.progress=Math.round(manuscript.scenes.filter(s=>s.status==="approved").length/n*100);
 manuscript.scenes.forEach(s=>{const source=(plan?.scenes||[]).find(x=>x.id===s.sceneId);s.wordCount=wc(s.text);s.quality=quality(s.text,source,s.influence,manuscript.settings)});
 manuscript.qualityScore=manuscript.scenes.length?Math.round(manuscript.scenes.reduce((sum,s)=>sum+s.quality.score,0)/manuscript.scenes.length):0;
 manuscript.editorialReport=report(manuscript,plan);
 return manuscript;
}
window.CAPS_ManuscriptEngine={generate,upgrade,rewrite,rewriteChapter,recalc,quality,defaults,storyContext};
})();
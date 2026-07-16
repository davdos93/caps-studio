(function(){
"use strict";

const uid=prefix=>`${prefix}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const text=(value,fallback="")=>String(value??"").trim()||fallback;
const words=value=>text(value).split(/\s+/).filter(Boolean).length;
const hash=value=>[...String(value??"")].reduce((sum,char)=>((sum<<5)-sum)+char.charCodeAt(0)|0,0);
const pick=(items,seed)=>items[Math.abs(seed)%items.length];
const sentence=value=>{
  const clean=text(value);
  if(!clean)return "";
  const first=clean.charAt(0).toUpperCase()+clean.slice(1);
  return /[.!?…]$/.test(first)?first:`${first}.`;
};
const lower=value=>{
  const clean=text(value);
  return clean?clean.charAt(0).toLowerCase()+clean.slice(1):"";
};
const paragraphs=value=>text(value).split(/\n\s*\n/).filter(Boolean);

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
    refrain:""
  };
}

function context(plan){
  const characters=plan.characters||[];
  const hero=characters[0]||{name:"die Hauptfigur",strengths:[],challenge:"",development:"",relationship:""};
  const ally=characters[1]||hero;
  const guide=characters[2]||ally;
  const profile=plan.storyBible?.psychologicalProfile||{};
  const world=plan.worlds?.[0]||{name:"der Welt der Geschichte",locations:[]};
  return {characters,hero,ally,guide,profile,world,bible:plan.storyBible||{}};
}

function bodySignal(emotion,hero,seed){
  const signals=[
    `${hero.name}s Schultern rückten ein wenig nach oben, als wollten sie die Ohren vor allem schützen, was gleich passieren könnte.`,
    `Unter ${hero.name}s Rippen wurde der Atem klein und schnell, obwohl außen noch niemand etwas Gefährliches sehen konnte.`,
    `${hero.name} spürte das Gefühl zuerst in den Händen: Sie wollten gleichzeitig festhalten und davonlaufen.`,
    `Im Bauch zog sich etwas zusammen. Es war nicht laut, aber deutlich genug, dass ${hero.name} es nicht mehr übersehen konnte.`,
    `${hero.name}s Blick sprang von einem Detail zum nächsten und suchte nach etwas, das sofort Sicherheit versprach.`
  ];
  return `${pick(signals,seed)} ${emotion?`Es fühlte sich ${lower(emotion)} an.`:""}`;
}

function atmosphere(location,seed,voice){
  const bases=[
    `In ${location} lag ein Geruch nach feuchter Erde, Holz und etwas Unbekanntem in der Luft.`,
    `Das Licht in ${location} fiel in breiten Streifen über den Weg und ließ selbst kleine Dinge wichtig aussehen.`,
    `Von irgendwoher kam ein leises Klopfen, dann wieder Stille. ${location} schien zuzuhören.`,
    `Der Boden von ${location} fühlte sich unter jedem Schritt anders an: erst fest, dann federnd, dann überraschend warm.`,
    `Über ${location} bewegten sich Schatten, obwohl kaum Wind ging.`
  ];
  const base=pick(bases,seed);
  if(voice==="Ruhig und poetisch")return `${base} Die Geräusche lagen übereinander wie dünne Decken, unter denen die Welt ruhig atmete.`;
  if(voice==="Lebendig und humorvoll")return `${base} Sogar ein kleiner Stein sah aus, als hätte er eine Meinung dazu.`;
  if(voice==="Spannend und direkt")return `${base} Dann brach ein scharfer Laut durch die Ruhe.`;
  return base;
}

function transition(previous,index,ctx,seed){
  if(!previous)return `${ctx.hero.name} hätte an diesem Morgen nicht sagen können, wann genau aus einem gewöhnlichen Tag der Anfang einer Geschichte wurde.`;
  const options=[
    `Der Gedanke an ${previous.title} ging mit ihnen weiter, auch als der Weg längst anders aussah.`,
    `Noch bevor sie ganz verstanden hatten, was eben geschehen war, veränderte sich die Umgebung erneut.`,
    `Sie ließen ${previous.location} hinter sich, doch das Ergebnis ihrer letzten Entscheidung blieb zwischen ihnen.`,
    `Eine Weile sprachen sie nicht. Jeder Schritt gab dem Erlebten ein wenig mehr Ordnung.`,
    `Der nächste Abschnitt des Weges begann leiser, als sie erwartet hatten.`
  ];
  return pick(options,seed+index);
}

function dialogue(scene,ctx,index,seed){
  const H=ctx.hero.name,A=ctx.ally.name,G=ctx.guide.name;
  const strategy=text(ctx.profile.copingStrategy,"einen kleinen nächsten Schritt wählen");
  const support=text(ctx.profile.supportiveResponse,"ruhig bleiben und Hilfe anbieten, ohne die Lösung abzunehmen");
  const early=[
    `„Ich sehe, dass etwas gerade schwer wird“, sagte ${A}. „Ich bleibe hier. Du musst noch nichts beweisen.“`,
    `„Sollen wir zuerst nur schauen?“, fragte ${A}. „Danach kannst du entscheiden, was der nächste Schritt ist.“`,
    `„Du musst das Gefühl nicht wegmachen“, sagte ${G}. „Wir können herausfinden, was es uns sagen will.“`
  ];
  const middle=[
    `„Was wäre der kleinste Schritt, den du selbst wählen kannst?“, fragte ${A}.`,
    `„Wir können dir den Raum sichern“, sagte ${G}. „Aber die Entscheidung bleibt bei dir.“`,
    `„Lass uns ${lower(strategy)}“, sagte ${A}. „Nicht alles auf einmal.“`
  ];
  const late=[
    `„Sag uns, welche Hilfe du brauchst“, sagte ${A}. „Nicht mehr und nicht weniger.“`,
    `„Ich bin bereit“, sagte ${H}. „Das Gefühl ist noch da. Aber ich weiß jetzt, was ich als Nächstes tue.“`,
    `„Wir bleiben bei unserem Plan“, sagte ${G}. „Du führst deinen Teil selbst aus.“`
  ];
  const pool=index<6?early:index<16?middle:late;
  const first=pick(pool,seed);
  const reply=index<5
    ?`„Ich weiß noch nicht, ob ich das kann“, antwortete ${H}. „Aber ich kann einen Moment hierbleiben.“`
    :index<17
      ?`„Dann fange ich klein an“, sagte ${H}. „Und ihr wartet, bis ich euch brauche.“`
      :`„Jetzt“, sagte ${H}. Das Wort klang nicht laut, aber es gehörte ganz der Hauptfigur.`;
  return `${first} ${reply}`;
}

function actionParagraph(scene,ctx,seed){
  const options=[
    `${sentence(scene.goal)} ${ctx.hero.name} sah nicht nur auf das Ziel, sondern auch auf den Weg dorthin: auf Abstände, Geräusche und die Gesichter der anderen.`,
    `${ctx.hero.name} begann mit der Aufgabe, die diese Szene verlangte. ${sentence(scene.goal)} Jede Bewegung bekam einen Grund.`,
    `${sentence(scene.goal)} Dabei achtete ${ctx.hero.name} darauf, was sich im eigenen Körper veränderte und wie ${ctx.ally.name} darauf reagierte.`,
    `Der Plan war einfach genug, um ihn zu verstehen, aber nicht so einfach, dass er von allein gelang. ${sentence(scene.goal)}`
  ];
  return pick(options,seed);
}

function conflictParagraph(scene,ctx,seed){
  const reaction=text(ctx.profile.currentReaction);
  const options=[
    `${sentence(scene.conflict)} Für einen Augenblick wollte ${ctx.hero.name} wieder genau das tun, was sonst schnell Schutz versprach: ${lower(reaction)}.`,
    `${sentence(scene.conflict)} Das alte Muster war sofort da. Es kannte keine Umwege und versprach Sicherheit, noch bevor jemand prüfen konnte, ob es diesmal wirklich half.`,
    `${sentence(scene.conflict)} ${bodySignal(scene.emotionalState,ctx.hero,seed)} Der vertraute Ausweg wirkte plötzlich sehr verlockend.`,
    `${sentence(scene.conflict)} Niemand schimpfte. Gerade dadurch konnte ${ctx.hero.name} merken, wie stark die bekannte Reaktion nach vorne drängte.`
  ];
  return pick(options,seed);
}

function relationshipParagraph(scene,ctx,seed){
  const relationship=text(ctx.ally.relationship||ctx.hero.relationship);
  const options=[
    `${ctx.ally.name} blieb nah genug, um Sicherheit zu geben, und weit genug entfernt, damit ${ctx.hero.name} selbst handeln konnte.`,
    `${ctx.ally.name} wartete. Dieses Warten war keine Leere, sondern eine Form von Vertrauen.`,
    `Zwischen ${ctx.hero.name} und ${ctx.ally.name} lag für einen Moment alles, was sonst unausgesprochen blieb. ${relationship?sentence(relationship):"Beide wussten, dass Nähe nicht bedeutete, jede Aufgabe füreinander zu lösen."}`,
    `${ctx.guide.name} half nicht mit einer fertigen Antwort. Stattdessen wurde eine Frage gestellt, die ${ctx.hero.name} den eigenen Gedanken zurückgab.`
  ];
  return pick(options,seed);
}

function strategyParagraph(scene,ctx,seed){
  const strategy=text(scene.copingStrategy||ctx.profile.copingStrategy,"innehalten und einen kleinen nächsten Schritt wählen");
  const options=[
    `${ctx.hero.name} hielt inne. Dann begann die Hauptfigur, ${lower(strategy)}. Es war keine große Verwandlung, eher eine Folge kleiner Entscheidungen.`,
    `Diesmal wurde der Ablauf nicht übersprungen: ${sentence(strategy)} ${ctx.hero.name} bemerkte jeden einzelnen Schritt.`,
    `${ctx.hero.name} erinnerte sich an den vereinbarten Weg. ${sentence(strategy)} Das Gefühl verschwand nicht, verlor aber die Macht, alles allein zu bestimmen.`,
    `Der neue Plan begann mit etwas Unspektakulärem: ${lower(strategy)}. Gerade deshalb konnte ${ctx.hero.name} ihn wirklich ausführen.`
  ];
  return pick(options,seed);
}

function resultParagraph(scene,ctx,seed){
  const options=[
    `${sentence(scene.result)} ${ctx.hero.name} spürte keinen plötzlichen Sieg, sondern etwas Verlässlicheres: Der nächste Schritt war möglich gewesen.`,
    `${sentence(scene.result)} Die Veränderung zeigte sich zuerst in kleinen Dingen – einem ruhigeren Atem, einem ehrlichen Blick und einer Entscheidung, die nicht von außen gekommen war.`,
    `${sentence(scene.result)} Niemand behauptete, nun sei alles leicht. Aber die Gruppe wusste genauer, was beim nächsten schwierigen Moment helfen konnte.`,
    `${sentence(scene.result)} Das Ergebnis gehörte nicht einer einzigen Figur. Trotzdem wusste ${ctx.hero.name}, welcher Teil davon der eigene gewesen war.`
  ];
  return pick(options,seed);
}

function hookParagraph(scene,next,ctx,seed){
  if(!next){
    return `Später, in einer kleinen vertrauten Situation, tauchte das alte Gefühl noch einmal auf. ${ctx.hero.name} bemerkte es, atmete und wählte den nächsten Schritt selbst. Das war kein Ende ohne Schwierigkeiten. Es war ein Anfang mit mehr Möglichkeiten.`;
  }
  const options=[
    `Dann veränderte sich das Licht am Rand des Weges. Dort, wo eben noch nichts gewesen war, begann der nächste Hinweis zu leuchten.`,
    `Aus ${next.location} kam ein Geräusch, das nicht zum Wind gehörte. Die Gruppe sah gleichzeitig auf.`,
    `${ctx.hero.name} wollte gerade etwas sagen, als vor ihnen der Weg verschwand.`,
    `Der nächste Abschnitt wartete bereits. Diesmal wusste niemand, welche ihrer neuen Erfahrungen dort tragen würde.`,
    `Hinter ihnen schloss sich der Weg leise. Vor ihnen begann ${next.title}.`
  ];
  return pick(options,seed);
}

function deepen(scene,ctx,seed){
  const desired=text(ctx.profile.desiredDevelopment);
  const need=text(ctx.profile.emotionalNeed);
  const options=[
    `${ctx.hero.name} verstand noch nicht alles. Aber die Hauptfigur merkte, dass ${lower(need)} nichts war, wofür man sich schämen musste.`,
    `Früher hätte ${ctx.hero.name} diesen Augenblick nur danach beurteilt, ob alles gelungen war. Jetzt zählte auch, wie die Entscheidung entstanden war.`,
    `${sentence(desired)} Der Gedanke fühlte sich noch neu an, wie ein Kleidungsstück, in das man erst hineinwachsen musste.`,
    `Das schwierige Gefühl war kein Gegner geworden. Es war eher ein Signal, das Aufmerksamkeit brauchte und danach wieder leiser werden durfte.`
  ];
  return pick(options,seed);
}

function writeScene(plan,scene,index,total,settings,variation=0,mode="literary",previous=null,next=null){
  const cfg={...defaults(plan),...(settings||{})};
  const ctx=context(plan);
  const seed=hash(scene.id||scene.title)+variation*71+index*19;
  let blocks=[
    `${transition(previous,index,ctx,seed)} ${atmosphere(scene.location,seed,cfg.voice)}`,
    bodySignal(scene.emotionalState,ctx.hero,seed+1),
    actionParagraph(scene,ctx,seed+2),
    dialogue(scene,ctx,index,seed+3),
    conflictParagraph(scene,ctx,seed+4),
    relationshipParagraph(scene,ctx,seed+5),
    strategyParagraph(scene,ctx,seed+6),
    resultParagraph(scene,ctx,seed+7),
    deepen(scene,ctx,seed+8),
    hookParagraph(scene,next,ctx,seed+9)
  ];

  if(mode==="dialogue"){
    blocks.splice(6,0,`„Ich möchte es selbst versuchen“, sagte ${ctx.hero.name}. „Sagt mir nur, ob ihr noch da seid.“ – „Wir sind da“, antwortete ${ctx.ally.name}. „Und wir warten auf dein Zeichen.“`);
  }
  if(mode==="vivid"){
    blocks.splice(3,0,`${atmosphere(scene.location,seed+20,"Ruhig und poetisch")} Farben, Geräusche und Entfernungen machten sichtbar, was in den Figuren vorging.`);
  }
  if(mode==="deep"){
    blocks.splice(blocks.length-1,0,`${deepen(scene,ctx,seed+21)} ${ctx.hero.name} dachte an die konkrete Situation, die sich sonst so schwer angefühlt hatte, ohne dass die Geschichte den Gedanken in eine Lektion verwandelte.`);
  }
  if(mode==="exciting"){
    blocks.splice(5,0,`Plötzlich geriet etwas in Bewegung. Der sichere Abstand wurde kleiner, und die Entscheidung musste fallen, bevor der vertraute Ausweg alles bestimmte.`);
  }
  if(cfg.dialogueLevel==="Wenig")blocks=blocks.filter((block,i)=>i!==3);
  if(cfg.dialogueLevel==="Viel"&&mode!=="dialogue")blocks.splice(6,0,`„Was brauchst du jetzt?“, fragte ${ctx.ally.name}. ${ctx.hero.name} antwortete erst, nachdem die Frage wirklich angekommen war.`);
  if(cfg.literaryDepth==="Mittel")blocks=blocks.filter((block,i)=>i!==8);
  if(cfg.sceneLength==="Kurz"||mode==="concise")blocks=[blocks[0],blocks[2],blocks[4],blocks[6],blocks[7],blocks.at(-1)];
  if(cfg.sceneLength==="Mittel")blocks=blocks.slice(0,8).concat(blocks.at(-1));
  if(cfg.refrain&&[4,9,15,20,total-1].includes(index))blocks.splice(blocks.length-1,0,sentence(cfg.refrain));

  return blocks.filter(Boolean).join("\n\n");
}

function quality(scene,plan){
  const value=text(scene.text);
  const count=words(value);
  const paras=paragraphs(value);
  const ctx=context(plan);
  const starts=paras.map(p=>p.split(/\s+/).slice(0,3).join(" ").toLowerCase());
  const uniqueStarts=new Set(starts).size;
  const contextTerms=[ctx.hero.name,ctx.profile.topic,scene.focusCharacter,scene.location].filter(Boolean);
  const contextInfluence=contextTerms.some(term=>value.toLowerCase().includes(String(term).toLowerCase()));
  const strategyTerms=text(ctx.profile.copingStrategy).split(/\s+/).filter(word=>word.length>6);
  const themeInAction=strategyTerms.some(term=>value.toLowerCase().includes(term.toLowerCase()))||value.includes("nächste Schritt");
  const scoreParts=[
    count>=130,
    paras.length>=6,
    uniqueStarts>=Math.max(4,Math.floor(paras.length*.6)),
    contextInfluence,
    themeInAction,
    !/Dann sagte .* Dann sagte|plötzlich war alles gut|musste nur mutig sein/i.test(value)
  ];
  return {
    score:Math.round(scoreParts.filter(Boolean).length/scoreParts.length*100),
    ageAppropriate:!/\b(dementsprechend|nichtsdestotrotz|infolgedessen|psychologisch)\b/i.test(value),
    detailed:count>=130,
    narrativeFlow:paras.length>=6,
    contextInfluence,
    themeInAction,
    noTemplatePhrases:!/plötzlich war alles gut|musste nur mutig sein/i.test(value),
    variedSentences:uniqueStarts>=Math.max(4,Math.floor(paras.length*.6)),
    psychologicalFit:Boolean(scene.influence?.psychologicalFunction),
    coherent:Boolean(scene.influence?.consequence)
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

function recalc(manuscript,plan){
  manuscript.scenes.forEach(scene=>{
    scene.wordCount=words(scene.text);
    scene.quality=quality(scene,plan);
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
  planScenes.forEach((planScene,index)=>{
    const previous=planScenes[index-1]||null;
    const next=planScenes[index+1]||null;
    const textValue=writeScene(plan,planScene,index,planScenes.length,cfg,0,"literary",previous,next);
    scenes.push({
      id:uid("MS"),
      sceneId:planScene.id,
      chapterId:planScene.chapterId,
      chapterNumber:planScene.chapterNumber,
      sceneNumber:planScene.number,
      title:planScene.title,
      text:textValue,
      wordCount:words(textValue),
      status:"draft",
      revision:1,
      variation:0,
      history:[],
      influence:influence(plan,planScene),
      quality:null
    });
  });
  const manuscript={
    schemaVersion:"2.0",
    generatedAt:new Date().toISOString(),
    generator:"CAPS Contextual Literary Writer 1.0",
    settings:cfg,
    chapters,
    scenes,
    progress:0,
    qualityScore:0
  };
  return recalc(manuscript,plan);
}

function rewrite(plan,manuscript,sceneId,mode="literary"){
  const index=manuscript.scenes.findIndex(scene=>scene.id===sceneId);
  if(index<0)return manuscript;
  const scene=manuscript.scenes[index];
  const planScenes=plan.scenes||[];
  const planIndex=planScenes.findIndex(item=>item.id===scene.sceneId);
  const planScene=planScenes[planIndex];
  if(!planScene)return manuscript;
  scene.history=scene.history||[];
  scene.history.push({revision:scene.revision,text:scene.text,changedAt:new Date().toISOString(),mode});
  scene.variation=(scene.variation||0)+1;
  scene.revision=(scene.revision||1)+1;
  scene.text=writeScene(plan,planScene,planIndex,planScenes.length,manuscript.settings,scene.variation,mode,planScenes[planIndex-1],planScenes[planIndex+1]);
  scene.influence=influence(plan,planScene);
  return recalc(manuscript,plan);
}

function rewriteChapter(plan,manuscript,chapterId,mode="literary"){
  manuscript.scenes.filter(scene=>scene.chapterId===chapterId).forEach(scene=>rewrite(plan,manuscript,scene.id,mode));
  return recalc(manuscript,plan);
}

function upgrade(manuscript,plan){
  manuscript.settings={...defaults(plan),...(manuscript.settings||{})};
  manuscript.chapters=Array.isArray(manuscript.chapters)?manuscript.chapters:(plan.chapters||[]).map(chapter=>({...chapter}));
  manuscript.scenes=Array.isArray(manuscript.scenes)?manuscript.scenes:[];
  manuscript.scenes.forEach(scene=>{
    const planScene=(plan.scenes||[]).find(item=>item.id===scene.sceneId)||{};
    scene.history=Array.isArray(scene.history)?scene.history:[];
    scene.revision=Number(scene.revision)||1;
    scene.variation=Number(scene.variation)||0;
    scene.status=scene.status||"draft";
    scene.influence={...influence(plan,planScene),...(scene.influence||{})};
  });
  return recalc(manuscript,plan);
}

window.CAPS_ManuscriptEngine={defaults,generate,rewrite,rewriteChapter,recalc,upgrade};
})();
(function(){
"use strict";

const clean=value=>String(value??"").replace(/\r/g,"").trim();
const words=value=>clean(value).split(/\s+/).filter(Boolean);
const wordCount=value=>words(value).length;
const lower=value=>clean(value).toLocaleLowerCase("de-DE");
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const uid=prefix=>`${prefix}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const deepClone=value=>JSON.parse(JSON.stringify(value));
const hash=value=>{let h=2166136261;for(const ch of clean(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};

const ROLE_LABELS={
  opening:"Einstieg",everyday:"Alltag",problem:"Problem",departure:"Aufbruch",
  discovery:"Entdeckung",relationship:"Beziehung",setback:"Rückschlag",quiet:"Ruhe",
  practice:"Übung",danger:"Gefahr",climax:"Höhepunkt",return:"Heimkehr",
  echo:"Alltag danach",ending:"Schlussbild"
};

const ROLE_IMAGE_SHARE={
  opening:70,everyday:58,problem:66,departure:74,discovery:76,relationship:48,
  setback:66,quiet:46,practice:56,danger:84,climax:90,return:66,echo:60,ending:80
};

const ROLE_TARGET_WORDS={
  opening:70,everyday:78,problem:74,departure:64,discovery:62,relationship:86,
  setback:70,quiet:52,practice:76,danger:48,climax:38,return:66,echo:60,ending:42
};

const TURN_LABELS={
  question:"Offene Frage",action:"Unterbrochene Handlung",reveal:"Zurückgehaltene Entdeckung",
  emotion:"Emotionaler Sog",promise:"Versprechen",transition:"Natürlicher Übergang",
  closure:"Ruhiger Abschluss"
};

function settings(input={}){
  return {
    pageFormat:"A4 Querformat",textPosition:"bottom",fontFamily:"Georgia",
    bodyFontSize:20,titleFontSize:30,showPageNumbers:true,author:"",
    compositionMode:"balanced",...input
  };
}

function sentenceList(value){
  return (clean(value).match(/[^.!?…]+(?:[.!?…]+[„“"'’)]*|$)/g)||[]).map(item=>item.trim()).filter(Boolean);
}

function keywords(text,pattern){return (lower(text).match(pattern)||[]).length;}

function analyzeText(text){
  const value=clean(text),wc=wordCount(value);
  const dialogue=(value.match(/[„“]/g)||[]).length/2;
  const question=(value.match(/\?/g)||[]).length;
  const exclamation=(value.match(/!/g)||[]).length;
  const action=keywords(value,/\b(lief|rannte|sprang|kletterte|stürzte|zog|öffnete|fiel|packte|folgte|eilte|schob|hob|griff|warf|drehte|drückte|hielt|nahm|stellte|schlich|trat|stieg|fing)\b/g);
  const emotion=keywords(value,/\b(angst|ängstlich|traurig|wütend|mutig|zitterte|weinte|lachte|freute|hoffte|erschrak|erleichtert|stolz|unsicher|staunte|lächelte|vermisste)\b/g);
  const calm=keywords(value,/\b(leise|still|langsam|wartete|lauschte|saß|atmete|schlief|ruhe|ruhig|sanft|behutsam|flüsterte)\b/g);
  const turn=keywords(value,/\b(aber|doch|plötzlich|auf einmal|stattdessen|bis|da bemerkte|noch bevor|nun|trotzdem|gerade als|in diesem moment)\b/g);
  const transition=keywords(value,/\b(am nächsten morgen|später|draußen|drinnen|im wald|zu hause|im kindergarten|auf dem weg|hinter der tür|am rand|als sie ankamen|zurück|am abend|kurz darauf)\b/g);
  const consequence=keywords(value,/\b(deshalb|darum|also|dadurch|nun musste|seitdem|sodass|so dass|folgte|blieb|damit|erst jetzt)\b/g);
  const sensory=keywords(value,/\b(roch|duftete|klang|hörte|fühlte|kalt|warm|rau|weich|hell|dunkel|glitzerte|raschelte|knisterte)\b/g);
  const visual=clamp(action*1.7+transition*1.6+emotion+turn+exclamation*.8+sensory,0,10);
  const tension=clamp(action*1.4+turn*1.8+exclamation+question*.6+emotion*.5-calm*.7,0,10);
  const pause=clamp(calm*1.8+(wc<45?1.2:0)-action*.6,0,10);
  const shift=clamp(turn*1.8+transition*1.6+consequence,0,10);
  return {wordCount:wc,sentenceCount:sentenceList(value).length,dialogue,question,exclamation,action,emotion,calm,turn,transition,consequence,sensory,visual,tension,pause,shift};
}

function analyzeBlock(block,index,total){
  const result=analyzeText(block.text);
  result.shift=clamp(result.shift+(index===0||index===total-1?2:0),0,10);
  return result;
}

function paragraphSceneMap(manuscript){
  const map=new Map();
  (manuscript.scenes||[]).forEach(scene=>{
    (scene.sourceParagraphIds||[]).forEach(paragraphId=>{
      const list=map.get(paragraphId)||[];
      list.push({sceneId:scene.sceneId,manuscriptSceneId:scene.id,title:scene.title,sceneNumber:scene.sceneNumber,chapterNumber:scene.chapterNumber});
      map.set(paragraphId,list);
    });
  });
  return map;
}

function flatten(project){
  const manuscript=project.manuscript||{};
  const sceneMap=paragraphSceneMap(manuscript);
  const blocks=[];
  (manuscript.bookChapters||[]).forEach((chapter,chapterIndex)=>{
    const source=chapter.paragraphs?.length?chapter.paragraphs:clean(chapter.text).split(/\n\s*\n/).map((text,index)=>({id:`AUTO-${chapter.chapterId||chapterIndex}-${index}`,text,kind:"narrative",beatNumbers:chapter.sourceBeatNumbers||[]}));
    source.forEach((paragraph,paragraphIndex)=>{
      const text=clean(paragraph.text);if(!text)return;
      const sceneLinks=sceneMap.get(paragraph.id)||[];
      blocks.push({
        id:paragraph.id||`BLOCK-${chapterIndex}-${paragraphIndex}`,
        text,kind:paragraph.kind||"narrative",beatNumbers:paragraph.beatNumbers||[],
        chapterId:chapter.chapterId||chapter.id||`CH-${chapterIndex+1}`,
        chapterNumber:chapter.number||chapterIndex+1,chapterTitle:chapter.title||`Kapitel ${chapterIndex+1}`,
        paragraphIndex,sceneLinks
      });
    });
  });
  blocks.forEach((block,index)=>block.analysis=analyzeBlock(block,index,blocks.length));
  return blocks;
}

function readingProfile(project){
  const value=String(project.manuscript?.settings?.readingLevel||project.audience||"");
  if(value.includes("3")||value.includes("4")||value.includes("5"))return {wordsPerSpread:88,minWords:36,maxWords:142,compositionFactor:.86,lineLength:34};
  if(value.includes("8")||value.includes("9"))return {wordsPerSpread:122,minWords:52,maxWords:180,compositionFactor:1.14,lineLength:48};
  return {wordsPerSpread:105,minWords:44,maxWords:165,compositionFactor:1,lineLength:42};
}

function estimate(project,blocks=flatten(project)){
  const profile=readingProfile(project);
  const totalWords=blocks.reduce((sum,block)=>sum+block.analysis.wordCount,0);
  const strongTurns=blocks.filter(block=>block.analysis.shift>=4.5||block.analysis.tension>=6).length;
  const raw=Math.round(totalWords/profile.wordsPerSpread+strongTurns*.08);
  const targetSpreadCount=clamp(raw,12,24);
  const averageTarget=68*profile.compositionFactor;
  return {targetSpreadCount,totalWords,profile,blockCount:blocks.length,estimatedBookWords:Math.min(totalWords,Math.round(targetSpreadCount*averageTarget))};
}

function boundaryScore(left,right){
  let score=0;
  score+=left.analysis.shift*1.5+left.analysis.tension*.5+left.analysis.question*1.4;
  score+=right.analysis.transition*1.4;
  score+=left.chapterId!==right.chapterId?4.5:0;
  score+=/[!?…][„“"'’)]*$/.test(left.text)?1.1:0;
  score+=/\b(aber|doch|plötzlich|bis|noch bevor)\b/i.test(left.text.slice(-130))?1.8:0;
  score+=left.kind==="hook"||left.kind==="inciting"?2:0;
  return score;
}

function groupCost(blocks,start,end,targetWords,profile){
  let count=0;for(let i=start;i<end;i++)count+=blocks[i].analysis.wordCount;
  const density=Math.pow((count-targetWords)/Math.max(1,targetWords),2)*16;
  const tooShort=count<profile.minWords?(profile.minWords-count)*.7:0;
  const tooLong=count>profile.maxWords?(count-profile.maxWords)*1.6:0;
  const chapterCrossings=blocks.slice(start+1,end).filter((block,i)=>block.chapterId!==blocks[start+i].chapterId).length;
  const endReward=end<blocks.length?boundaryScore(blocks[end-1],blocks[end]):0;
  return density+tooShort+tooLong+chapterCrossings*.8-endReward*.75;
}

function segment(blocks,target,profile){
  const n=blocks.length,k=Math.min(target,n);if(!n)return [];if(k===n)return blocks.map(block=>[block]);
  const totalWords=blocks.reduce((sum,b)=>sum+b.analysis.wordCount,0),targetWords=totalWords/k;
  const dp=Array.from({length:k+1},()=>Array(n+1).fill(Infinity));
  const prev=Array.from({length:k+1},()=>Array(n+1).fill(-1));dp[0][0]=0;
  for(let groups=1;groups<=k;groups++)for(let end=groups;end<=n;end++){
    const minStart=groups-1,maxLookback=Math.max(minStart,end-8);
    for(let start=end-1;start>=maxLookback;start--){
      if(!Number.isFinite(dp[groups-1][start]))continue;
      const cost=dp[groups-1][start]+groupCost(blocks,start,end,targetWords,profile);
      if(cost<dp[groups][end]){dp[groups][end]=cost;prev[groups][end]=start;}
    }
  }
  if(!Number.isFinite(dp[k][n])){
    const groups=[];let current=[],count=0;
    blocks.forEach(block=>{current.push(block);count+=block.analysis.wordCount;if(count>=targetWords&&groups.length<k-1){groups.push(current);current=[];count=0;}});
    if(current.length)groups.push(current);return groups;
  }
  const groups=[];let end=n;for(let g=k;g>0;g--){const start=prev[g][end];groups.unshift(blocks.slice(start,end));end=start;}return groups;
}

function aggregate(group){
  const keys=["dialogue","question","exclamation","action","emotion","calm","turn","transition","consequence","sensory","visual","tension","pause","shift"];
  const result={wordCount:group.reduce((sum,b)=>sum+b.analysis.wordCount,0),sentenceCount:group.reduce((sum,b)=>sum+b.analysis.sentenceCount,0)};
  keys.forEach(key=>result[key]=Number((group.reduce((sum,b)=>sum+b.analysis[key],0)/Math.max(1,group.length)).toFixed(2)));return result;
}

function climaxIndex(groups){
  const from=Math.floor(groups.length*.62),to=Math.max(from+1,Math.ceil(groups.length*.9));let best=from,bestScore=-Infinity;
  for(let i=from;i<Math.min(groups.length-1,to);i++){const a=aggregate(groups[i]),score=a.tension*1.8+a.action+a.turn+a.emotion*.5;if(score>bestScore){best=i;bestScore=score;}}
  return best;
}

function roleFor(group,index,total,climax){
  if(index===0)return "opening";if(index===total-1)return "ending";if(index===climax)return "climax";
  const kinds=new Set(group.map(block=>block.kind)),text=lower(group.map(block=>block.text).join(" ")),analysis=aggregate(group),progress=index/Math.max(1,total-1);
  if(index>climax){if(index===total-2)return /\b(zurück|heim|wieder|zu hause|kindergarten)\b/.test(text)?"echo":"return";return progress>.92?"echo":"return";}
  if(kinds.has("problem")||progress<.18&&/\b(angst|weinte|nicht|schwer|festhielt)\b/.test(text))return "problem";
  if(kinds.has("inciting")||kinds.has("hook")||progress<.3&&analysis.shift>3.5)return "departure";
  if(kinds.has("relationship")||analysis.dialogue>1.2)return "relationship";
  if(kinds.has("failure")||kinds.has("consequence")||/\b(scheiterte|klappte nicht|ging schief|verlor|fiel)\b/.test(text))return "setback";
  if(kinds.has("practice")||/\b(übte|probierte|versuchte es noch einmal|wiederholte)\b/.test(text))return "practice";
  if(analysis.pause>3.5&&analysis.tension<3)return "quiet";if(progress>.58&&analysis.tension>5)return "danger";if(progress<.15)return "everyday";return "discovery";
}

function choosePrimaryScene(group){
  const counts=new Map();group.forEach(block=>block.sceneLinks.forEach(link=>{const key=link.sceneId||link.manuscriptSceneId;if(!key)return;const item=counts.get(key)||{link,count:0};item.count++;counts.set(key,item);}));
  return [...counts.values()].sort((a,b)=>b.count-a.count)[0]?.link||null;
}

function sentenceUnits(group){
  const units=[];
  group.forEach(block=>sentenceList(block.text).forEach((text,index)=>units.push({
    id:`${block.id}-S${index+1}`,text,blockId:block.id,chapterId:block.chapterId,chapterTitle:block.chapterTitle,
    kind:block.kind,analysis:analyzeText(text),sourceOrder:units.length
  })));
  return units;
}

function hookScore(unit,role){
  const text=clean(unit.text),a=unit.analysis;let score=0;
  if(/\?[„“"'’)]*$/.test(text))score+=24;
  if(/…[„“"'’)]*$/.test(text))score+=20;
  if(/![„“"'’)]*$/.test(text))score+=10;
  score+=a.turn*7+a.action*4+a.emotion*2+a.question*5;
  if(/\b(aber|doch|plötzlich|noch bevor|gerade als|da sah|da hörte|da bemerkte|wer|was|warum|wie)\b/i.test(text))score+=10;
  if(/\b(geschafft|vorbei|alles war gut|endlich zu ende|schlief ein)\b/i.test(text)&&role!=="ending")score-=12;
  const count=wordCount(text);if(count>=4&&count<=18)score+=5;if(count>30)score-=4;
  return score;
}

function turnMeta(text,role,nextText=""){
  const value=clean(text),a=analyzeText(value);let strategy="transition";
  if(role==="ending")strategy="closure";
  else if(/\?[„“"'’)]*$/.test(value))strategy="question";
  else if(/…[„“"'’)]*$/.test(value)||/\b(noch bevor|gerade als|plötzlich|doch dann)\b/i.test(value))strategy="action";
  else if(/\b(entdeckte|bemerkte|sah|hörte|hinter|unter|im licht)\b/i.test(value))strategy="reveal";
  else if(a.emotion>0)strategy="emotion";
  else if(/\b(versprach|würde|musste|wollte)\b/i.test(value))strategy="promise";
  let strength=clamp(Math.round(hookScore({text:value,analysis:a},role)*2.15+(nextText?5:0)),0,100);
  if(role==="ending")strength=clamp(Math.round(45+a.emotion*8+a.calm*5),35,85);
  return {strategy,label:TURN_LABELS[strategy],hookLine:value,strength};
}

function reflowForPageTurns(drafts){
  drafts.forEach(spread=>{spread.carryIn=[];spread.carryOut=[];});
  for(let i=0;i<drafts.length-1;i++){
    const spread=drafts[i],next=drafts[i+1],units=spread.units;
    if(spread.role==="ending"||units.length<4)continue;
    if(next.units[0]?.chapterId!==units.at(-1)?.chapterId)continue;
    const lastScore=hookScore(units.at(-1),spread.role);let best=-1,bestScore=lastScore;
    const start=Math.max(1,Math.floor(units.length*.55));
    for(let j=start;j<units.length-1;j++){
      const trailing=units.slice(j+1),trailingWords=trailing.reduce((sum,u)=>sum+u.analysis.wordCount,0),remaining=units.slice(0,j+1).reduce((sum,u)=>sum+u.analysis.wordCount,0);
      if(trailing.length>2||trailingWords>32||remaining<34)continue;
      const score=hookScore(units[j],spread.role);
      if(score>bestScore+5){best=j;bestScore=score;}
    }
    if(best>=0){
      const moved=units.splice(best+1);next.units.unshift(...moved);spread.carryOut=moved.map(u=>u.id);next.carryIn.push(...moved.map(u=>u.id));
    }
  }
  return drafts;
}

function compositionProfile(project,role,rhythm,sourceWords,mode="balanced"){
  const profile=readingProfile(project);let imageShare=ROLE_IMAGE_SHARE[role]||62;
  if(rhythm.dialogue>2)imageShare-=9;if(rhythm.visual>6)imageShare+=6;if(rhythm.pause>4)imageShare-=5;
  if(mode==="visual")imageShare+=10;if(mode==="text")imageShare-=10;
  imageShare=clamp(Math.round(imageShare),38,92);
  let target=Math.round((ROLE_TARGET_WORDS[role]||68)*profile.compositionFactor);
  target=Math.round(target*(1+(60-imageShare)/145));
  if(mode==="visual")target=Math.round(target*.78);if(mode==="text")target=Math.round(target*1.22);
  target=clamp(target,28,118);target=Math.min(sourceWords,target);
  const minWords=Math.min(sourceWords,Math.max(20,Math.round(target*.68)));
  const maxWords=Math.min(sourceWords,Math.max(target+10,Math.round(target*1.22)));
  const textShare=100-imageShare;
  const recommendedPosition=imageShare>=78?"bottom":rhythm.dialogue>1.6?(sourceWords%2?"left":"right"):textShare>=48?"left":"bottom";
  const whiteSpace=textShare>=48?"großzügig":textShare>=28?"ausgewogen":"minimal";
  const safeZone=recommendedPosition==="left"?"linkes Drittel":recommendedPosition==="right"?"rechtes Drittel":"unteres Viertel";
  const maxLines=clamp(Math.round(target/(profile.lineLength/7)),6,18);
  return {mode,imageShare,textShare,targetWords:target,minWords,maxWords,recommendedPosition,whiteSpace,whiteSpacePlan:{safeZone,maxLines,maxParagraphs:role==="climax"||role==="ending"?2:4,lineLength:profile.lineLength,contrast:"ruhiger, kontrastreicher Hintergrundbereich"},manual:false};
}

function sentenceValue(unit,index,total,spread,names){
  const text=clean(unit.text),l=lower(text),a=unit.analysis;let score=1;
  score+=a.dialogue*4+a.action*3+a.emotion*2.4+a.sensory*2+a.turn*3+a.consequence*2+a.question*2;
  if(names.some(name=>name&&l.includes(lower(name))))score+=4;
  if(index===0)score+=spread.role==="opening"?10:3;
  if(index===total-1)score+=12;
  if(spread.role==="relationship"&&a.dialogue)score+=5;
  if(["danger","climax","departure"].includes(spread.role)&&a.action)score+=5;
  if(["return","echo","ending"].includes(spread.role)&&a.consequence)score+=4;
  if(/^\s*(dann|deshalb|darum|doch|aber|dort|nun)\b/i.test(text))score-=2;
  if(/\b(eigentlich|irgendwie|gewissermaßen|sozusagen)\b/i.test(text))score-=2;
  if(wordCount(text)>30)score-=3;
  return score;
}

function requiredSentenceIndexes(units,spread,names){
  const required=new Set();if(!units.length)return required;
  if(spread.role==="opening"||spread.number===1)required.add(0);
  required.add(units.length-1);
  const named=units.findIndex(unit=>names.some(name=>name&&lower(unit.text).includes(lower(name))));if(named>=0)required.add(named);
  if(spread.role==="relationship"){const dialogue=units.findIndex(unit=>unit.analysis.dialogue>0);if(dialogue>=0)required.add(dialogue);}
  if(["danger","climax","departure"].includes(spread.role)){const action=units.findIndex(unit=>unit.analysis.action>0);if(action>=0)required.add(action);}
  if(["return","echo","ending"].includes(spread.role)){const consequence=units.findIndex(unit=>unit.analysis.consequence>0);if(consequence>=0)required.add(consequence);}
  return required;
}

function simplifySentence(value){
  return clean(value)
    .replace(/\bFür einen Moment\b/g,"Kurz")
    .replace(/\bganz plötzlich\b/gi,"plötzlich")
    .replace(/\bein kleines bisschen\b/gi,"ein wenig")
    .replace(/\bsehr,\s*sehr\b/gi,"sehr")
    .replace(/\bwirklich ganz\b/gi,"ganz")
    .replace(/\b([\p{L}]+)\s+\1\b/giu,"$1")
    .replace(/\s+([,.;:!?])/g,"$1")
    .replace(/\s{2,}/g," ")
    .trim();
}

function selectUnits(units,spread,profile,names){
  const totalSource=units.reduce((sum,u)=>sum+u.analysis.wordCount,0);
  if(totalSource<=profile.maxWords)return units.slice();
  const required=requiredSentenceIndexes(units,spread,names),selected=new Set(required);
  const scoreRows=units.map((unit,index)=>({index,score:sentenceValue(unit,index,units.length,spread,names),words:unit.analysis.wordCount})).sort((a,b)=>(b.score/Math.max(4,b.words))-(a.score/Math.max(4,a.words)));
  const selectedWords=()=>[...selected].reduce((sum,index)=>sum+units[index].analysis.wordCount,0);
  for(const row of scoreRows){
    if(selected.has(row.index))continue;
    const dependencies=[];
    if(/^\s*(deshalb|darum|doch|aber|dann|nun)\b/i.test(units[row.index].text)&&row.index>0&&!selected.has(row.index-1))dependencies.push(row.index-1);
    const addition=[row.index,...dependencies].filter(index=>!selected.has(index));
    const additionWords=addition.reduce((sum,index)=>sum+units[index].analysis.wordCount,0);
    if(selectedWords()<profile.minWords||selectedWords()+additionWords<=profile.targetWords+6)addition.forEach(index=>selected.add(index));
    if(selectedWords()>=profile.targetWords)break;
  }
  if(selectedWords()<profile.minWords){
    for(let i=0;i<units.length&&selectedWords()<profile.minWords;i++)selected.add(i);
  }
  return [...selected].sort((a,b)=>a-b).map(index=>units[index]);
}

function unitsToParagraphs(units){
  const paragraphs=[];let current=[],block=null;
  units.forEach(unit=>{
    const startsDialogue=/^[„“"]/.test(unit.text);
    if(current.length&&(unit.blockId!==block||current.length>=3||startsDialogue)){
      paragraphs.push(current.map(item=>simplifySentence(item.text)).join(" "));current=[];
    }
    current.push(unit);block=unit.blockId;
  });
  if(current.length)paragraphs.push(current.map(item=>simplifySentence(item.text)).join(" "));
  return paragraphs.filter(Boolean);
}

function layoutTextFrom(pictureBookText,role){
  const items=sentenceList(pictureBookText);if(items.length<3||role==="ending")return clean(pictureBookText);
  const last=items.at(-1),before=items.slice(0,-1).join(" ");
  if(["danger","climax","departure","problem"].includes(role)||/\?|…/.test(last))return `${before}\n\n${last}`;
  return clean(pictureBookText);
}

function composeSpread(project,spread,mode="balanced"){
  const names=(project.bookPlan?.characters||[]).map(character=>character.name).filter(Boolean);
  const sourceText=spread.units.map(unit=>unit.text).join(" ");
  const sourceWords=wordCount(sourceText),rhythm=analyzeText(sourceText),profile=compositionProfile(project,spread.role,rhythm,sourceWords,mode);
  const selected=selectUnits(spread.units,spread,profile,names),paragraphs=unitsToParagraphs(selected);
  const pictureBookText=paragraphs.join("\n\n"),layoutText=layoutTextFrom(pictureBookText,spread.role);
  const lastSentence=sentenceList(layoutText).at(-1)||"",nextHint="";
  const turn=turnMeta(lastSentence,spread.role,nextHint);
  const pictureWords=wordCount(pictureBookText),layoutWords=wordCount(layoutText);
  profile.sourceWords=sourceWords;profile.pictureBookWords=pictureWords;profile.layoutWords=layoutWords;
  profile.reductionPercent=sourceWords?Math.round((1-pictureWords/sourceWords)*100):0;
  profile.omittedSentences=Math.max(0,spread.units.length-selected.length);
  profile.selectedSentenceIds=selected.map(unit=>unit.id);
  profile.sourceHash=hash(sourceText);
  spread.sourceText=sourceText;spread.reflowSourceText=sourceText;
  spread.pictureBookText=pictureBookText;spread.layoutText=layoutText;spread.text=layoutText;
  spread.pictureBookEdited=false;spread.textEdited=false;spread.wordCount=layoutWords;spread.sourceWordCount=sourceWords;
  spread.rhythm=rhythm;spread.pageTurn=turn;spread.pageTurnStrength=turn.strength;spread.composition=profile;
  return spread;
}

function spreadDraft(project,group,index,total,climax){
  const analysis=aggregate(group),role=roleFor(group,index,total,climax),primary=choosePrimaryScene(group);
  const sourceSceneIds=[...new Set(group.flatMap(block=>block.sceneLinks.map(link=>link.sceneId)).filter(Boolean))];
  const sourceManuscriptSceneIds=[...new Set(group.flatMap(block=>block.sceneLinks.map(link=>link.manuscriptSceneId)).filter(Boolean))];
  const illustrationItems=project.illustrations?.items||[];
  const image=sourceSceneIds.map(sceneId=>illustrationItems.find(item=>item.sceneId===sceneId)).find(Boolean)||null;
  const chapterTitles=[...new Set(group.map(block=>block.chapterTitle))],roleLabel=ROLE_LABELS[role],title=primary?.title||chapterTitles[0]||roleLabel;
  return {
    id:uid("SPREAD"),number:index+1,role,roleLabel,title,textPosition:"inherit",notes:"",
    chapterNumber:group[0].chapterNumber,sceneNumber:primary?.sceneNumber||index+1,
    sceneId:primary?.sceneId||sourceSceneIds[0]||null,manuscriptSceneId:primary?.manuscriptSceneId||sourceManuscriptSceneIds[0]||null,
    illustrationId:image?.id||null,sourceBlockIds:group.map(block=>block.id),sourceSceneIds,sourceManuscriptSceneIds,
    sourceChapterIds:[...new Set(group.map(block=>block.chapterId))],sourceChapterTitles:chapterTitles,
    units:sentenceUnits(group),rhythm:analysis,carryIn:[],carryOut:[]
  };
}

function quality(layout){
  const spreads=layout.spreads||[];if(!spreads.length)return {score:0,checks:[]};
  const roleSet=new Set(spreads.map(spread=>spread.role));
  const sourceWords=spreads.reduce((sum,s)=>sum+(s.sourceWordCount||wordCount(s.sourceText)),0);
  const bookWords=spreads.reduce((sum,s)=>sum+(s.wordCount||wordCount(s.layoutText||s.text)),0);
  const reduction=sourceWords?Math.round((1-bookWords/sourceWords)*100):0;
  const overcrowded=spreads.filter(s=>(s.wordCount||0)>(s.composition?.maxWords||130)).length;
  const empty=spreads.filter(s=>!clean(s.layoutText||s.text)).length;
  const weak=spreads.slice(0,-1).filter(s=>(s.pageTurnStrength||0)<28).length;
  const strong=spreads.slice(0,-1).filter(s=>(s.pageTurnStrength||0)>=45).length;
  const checks=[
    {id:"opening",label:"Klarer Einstieg",pass:roleSet.has("opening")},
    {id:"problem",label:"Problemseite vorhanden",pass:roleSet.has("problem")},
    {id:"climax",label:"Höhepunkt vorhanden",pass:roleSet.has("climax")},
    {id:"ending",label:"Schlussbild vorhanden",pass:roleSet.has("ending")},
    {id:"layers",label:"Drei Textebenen vollständig",pass:spreads.every(s=>clean(s.sourceText)&&clean(s.pictureBookText)&&clean(s.layoutText))},
    {id:"reduction",label:"Bilderbuchtext sinnvoll verdichtet",pass:reduction>=10&&reduction<=62,detail:`${reduction}% kürzer`},
    {id:"density",label:"Keine überfüllten Doppelseiten",pass:overcrowded===0,detail:`${overcrowded} überfüllt`},
    {id:"turn",label:"Tragfähige Umblätterpunkte",pass:weak<=Math.ceil(spreads.length*.32),detail:`${strong} stark · ${weak} schwach`},
    {id:"whitespace",label:"Weißraum für jede Doppelseite geplant",pass:spreads.every(s=>Boolean(s.composition?.whiteSpacePlan?.safeZone))},
    {id:"variety",label:"Abwechslungsreiche Text-Bild-Gewichtung",pass:new Set(spreads.map(s=>Math.round((s.composition?.imageShare||60)/10))).size>=3},
    {id:"complete",label:"Kein leerer Buchtext",pass:empty===0,detail:`${empty} leer`}
  ];
  return {score:Math.round(checks.filter(check=>check.pass).length/checks.length*100),checks,sourceWords,bookWords,reductionPercent:reduction,strongTurns:strong,weakTurns:weak,overcrowded};
}

function preserve(oldLayout,newLayout){
  if(!oldLayout)return newLayout;
  newLayout.settings=settings(oldLayout.settings);
  newLayout.cover={title:newLayout.cover.title,subtitle:newLayout.cover.subtitle,author:"",...(oldLayout.cover||{})};
  const exact=new Map((oldLayout.spreads||[]).filter(spread=>spread.sourceBlockIds?.length).map(spread=>[spread.sourceBlockIds.join("|"),spread]));
  newLayout.spreads.forEach(spread=>{
    const previous=exact.get(spread.sourceBlockIds.join("|"));if(!previous)return;
    const sameSource=!previous.sourceText||hash(previous.sourceText)===hash(spread.sourceText);
    spread.id=previous.id||spread.id;spread.title=previous.title||spread.title;spread.textPosition=previous.textPosition||"inherit";spread.notes=previous.notes||"";spread.illustrationId=previous.illustrationId||spread.illustrationId||null;
    if(sameSource&&previous.pictureBookEdited&&clean(previous.pictureBookText)){
      spread.pictureBookText=previous.pictureBookText;spread.pictureBookEdited=true;
    }
    if(sameSource&&previous.textEdited&&clean(previous.layoutText||previous.text)){
      spread.layoutText=previous.layoutText||previous.text;spread.text=spread.layoutText;spread.textEdited=true;spread.wordCount=wordCount(spread.layoutText);
    }
    if(previous.composition?.manual){
      const imageShare=clamp(Number(previous.composition.imageShare)||spread.composition.imageShare,38,92);
      spread.composition.imageShare=imageShare;spread.composition.textShare=100-imageShare;spread.composition.manual=true;
      if(previous.composition.whiteSpaceManual)spread.composition.whiteSpace=previous.composition.whiteSpaceManual;
    }
  });
  return newLayout;
}

function build(project,oldLayout=null){
  const blocks=flatten(project),info=estimate(project,blocks),groups=segment(blocks,info.targetSpreadCount,info.profile),climax=climaxIndex(groups);
  const drafts=groups.map((group,index)=>spreadDraft(project,group,index,groups.length,climax));
  reflowForPageTurns(drafts);
  const spreads=drafts.map(spread=>{composeSpread(project,spread,"balanced");delete spread.units;return spread;});
  const phase2Migration=oldLayout&&oldLayout.schemaVersion!=="2.1"?{
    fromSchema:oldLayout.schemaVersion||"unknown",fromGenerator:oldLayout.generator||"unknown",oldSpreadCount:(oldLayout.spreads||[]).length,
    migratedAt:new Date().toISOString(),legacySnapshot:deepClone(oldLayout)
  }:oldLayout?.phase2Migration||null;
  const layout={
    schemaVersion:"2.1",compositionVersion:"2.0",engine:"narrative-layout",generatedAt:new Date().toISOString(),
    generator:"CAPS Narrative Layout Engine 2.1 – Phase 2 Bilderbuch-Komposition",
    settings:settings(),cover:{title:project.title||"",subtitle:project.subtitle||"",author:""},
    targetSpreadCount:info.targetSpreadCount,totalSourceWords:info.totalWords,sourceBlockCount:info.blockCount,
    spreads,progress:0,approved:false,phase2Migration,migration:oldLayout?.migration||null
  };
  preserve(oldLayout,layout);layout.quality=quality(layout);layout.compositionStats={...layout.quality};return layout;
}

function generate(project){
  project.layout=build(project,project.layout||null);project.pages=project.layout.spreads.length*2+4;return recalc(project);
}

function sync(project){
  if(!project.layout)return generate(project);const old=project.layout;project.layout=build(project,old);project.layout.updatedAt=new Date().toISOString();project.pages=project.layout.spreads.length*2+4;return recalc(project);
}

function migrate(project){
  if(!project.layout)return generate(project);
  if(project.layout.schemaVersion==="2.1"&&project.layout.compositionVersion==="2.0"&&project.layout.engine==="narrative-layout")return recalc(project);
  return sync(project);
}

function unitsFromText(value,prefix="LOCAL"){
  return sentenceList(value).map((text,index)=>({id:`${prefix}-S${index+1}`,text,blockId:prefix,chapterId:prefix,kind:"narrative",analysis:analyzeText(text),sourceOrder:index}));
}

function recomposeSpread(project,spreadId,mode="balanced"){
  const spread=project.layout?.spreads?.find(item=>item.id===spreadId);if(!spread)return project;
  const keep={id:spread.id,number:spread.number,title:spread.title,textPosition:spread.textPosition,notes:spread.notes,sourceBlockIds:spread.sourceBlockIds};
  spread.units=unitsFromText(spread.reflowSourceText||spread.sourceText,spread.id);composeSpread(project,spread,mode);delete spread.units;
  Object.assign(spread,keep);spread.composition.mode=mode;spread.composition.manual=false;
  return recalc(project);
}

function recomposeAll(project){
  if(!project.layout)return generate(project);
  project.layout.spreads.forEach(spread=>recomposeSpread(project,spread.id,project.layout.settings?.compositionMode||"balanced"));
  project.layout.recomposedAt=new Date().toISOString();return recalc(project);
}

function updateSpread(project,spreadId,values={}){
  const spread=project.layout?.spreads?.find(item=>item.id===spreadId);if(!spread)return project;
  if(values.title!==undefined)spread.title=clean(values.title)||spread.roleLabel;
  if(values.pictureBookText!==undefined){spread.pictureBookText=clean(values.pictureBookText);spread.pictureBookEdited=spread.pictureBookText!==clean(spread.sourceText);}
  if(values.layoutText!==undefined){spread.layoutText=clean(values.layoutText);spread.text=spread.layoutText;spread.textEdited=spread.layoutText!==clean(spread.pictureBookText);}
  if(values.textPosition!==undefined)spread.textPosition=values.textPosition;
  if(values.imageShare!==undefined){const share=clamp(Number(values.imageShare)||spread.composition.imageShare,38,92);spread.composition.imageShare=share;spread.composition.textShare=100-share;spread.composition.manual=true;}
  if(values.whiteSpace!==undefined){spread.composition.whiteSpaceManual=values.whiteSpace;spread.composition.whiteSpace=values.whiteSpace==="auto"?(spread.composition.textShare>=48?"großzügig":spread.composition.textShare>=28?"ausgewogen":"minimal"):values.whiteSpace;spread.composition.manual=true;}
  spread.wordCount=wordCount(spread.layoutText||spread.text);spread.composition.pictureBookWords=wordCount(spread.pictureBookText);spread.composition.layoutWords=spread.wordCount;
  spread.composition.reductionPercent=spread.sourceWordCount?Math.round((1-wordCount(spread.pictureBookText)/spread.sourceWordCount)*100):0;
  const ending=sentenceList(spread.layoutText).at(-1)||"";spread.pageTurn=turnMeta(ending,spread.role);spread.pageTurnStrength=spread.pageTurn.strength;
  project.layout.approved=false;return recalc(project);
}

function approve(project){
  if(!project.layout)return false;project.layout.approved=!project.layout.approved;project.layout.approvedAt=project.layout.approved?new Date().toISOString():null;project.layoutStatus=project.layout.approved?"approved":"draft";return project.layout.approved;
}

function recalc(project){
  const layout=project.layout;if(!layout)return project;
  const images=project.illustrations?.items||[],total=layout.spreads.length||1;
  const ready=layout.spreads.filter(spread=>{const image=images.find(item=>item.id===spread.illustrationId);return clean(spread.layoutText||spread.text)&&Boolean(image?.imageData);}).length;
  layout.progress=Math.round(ready/total*100);layout.quality=quality(layout);layout.compositionStats={...layout.quality};layout.spreadCount=layout.spreads.length;layout.pageCount=layout.spreads.length*2+4;
  if(!layout.approved)project.layoutStatus=layout.progress===100?"ready":"draft";return project;
}

function preview(project){return estimate(project);}

window.CAPS_LayoutEngine={generate,sync,migrate,recalc,preview,quality,recomposeSpread,recomposeAll,updateSpread,approve,roleLabels:ROLE_LABELS,turnLabels:TURN_LABELS};
})();
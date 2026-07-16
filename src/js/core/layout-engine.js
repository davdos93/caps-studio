(function(){
"use strict";
const uid=p=>`${p}-${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}`;
const clean=v=>String(v??"").trim();

function settings(input={}){
  return {
    pageFormat:"A4 Querformat",
    textPosition:"bottom",
    fontFamily:"Georgia",
    bodyFontSize:20,
    titleFontSize:30,
    showPageNumbers:true,
    author:"",
    ...input
  };
}

function source(project){
  const manuscriptScenes=project.manuscript?.scenes||[];
  const illustrationItems=project.illustrations?.items||[];
  return manuscriptScenes.map((scene,index)=>{
    const image=illustrationItems.find(item=>item.sceneId===scene.sceneId);
    return {
      id:uid("SPREAD"),
      sceneId:scene.sceneId,
      manuscriptSceneId:scene.id,
      illustrationId:image?.id||null,
      number:index+1,
      chapterNumber:scene.chapterNumber,
      sceneNumber:scene.sceneNumber,
      title:scene.title,
      text:scene.text,
      sourceText:scene.text,
      textEdited:false,
      textPosition:"inherit",
      notes:""
    };
  });
}

function generate(project){
  const layout={
    schemaVersion:"1.0",
    generatedAt:new Date().toISOString(),
    generator:"CAPS Probebuch Layout Engine 1.0",
    settings:settings(),
    cover:{title:project.title||"",subtitle:project.subtitle||"",author:""},
    spreads:source(project),
    progress:0
  };
  project.layout=layout;
  return recalc(project);
}

function sync(project){
  if(!project.layout)return generate(project);
  project.layout.settings=settings(project.layout.settings);
  project.layout.cover={title:project.title||"",subtitle:project.subtitle||"",author:"",...(project.layout.cover||{})};
  const old=new Map((project.layout.spreads||[]).map(item=>[item.sceneId,item]));
  project.layout.spreads=source(project).map(fresh=>{
    const previous=old.get(fresh.sceneId);
    if(!previous)return fresh;
    return {
      ...fresh,
      ...previous,
      title:fresh.title,
      sourceText:fresh.sourceText,
      illustrationId:fresh.illustrationId,
      text:previous.textEdited?previous.text:fresh.text
    };
  });
  project.layout.updatedAt=new Date().toISOString();
  return recalc(project);
}

function recalc(project){
  const layout=project.layout;
  if(!layout)return project;
  const images=project.illustrations?.items||[];
  const total=layout.spreads.length||1;
  const ready=layout.spreads.filter(spread=>{
    const image=images.find(item=>item.id===spread.illustrationId);
    return clean(spread.text)&&Boolean(image?.imageData);
  }).length;
  layout.progress=Math.round(ready/total*100);
  project.layoutStatus=layout.progress===100?"ready":"draft";
  return project;
}

window.CAPS_LayoutEngine={generate,sync,recalc};
})();
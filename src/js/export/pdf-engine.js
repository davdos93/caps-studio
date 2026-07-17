(function(){
"use strict";

const clean=value=>String(value??"").replace(/\r/g,"").trim();
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const mmToPx=(mm,dpi)=>Math.max(1,Math.round(mm/25.4*dpi));
const mmToPt=mm=>mm/25.4*72;
const encoder=new TextEncoder();
const ascii=value=>encoder.encode(String(value));
const concat=chunks=>{const size=chunks.reduce((sum,chunk)=>sum+chunk.length,0),out=new Uint8Array(size);let offset=0;chunks.forEach(chunk=>{out.set(chunk,offset);offset+=chunk.length});return out};
const escapePdf=value=>String(value||"").replace(/[^\x20-\x7E]/g," ").replace(/([\\()])/g,"\\$1");
const fileSafe=value=>clean(value).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80)||"caps-buch";

const FORMAT_PRESETS={
  a5:{id:"a5",label:"A5 Hochformat",pageWidthMm:148.5,pageHeightMm:210},
  square:{id:"square",label:"21 × 21 cm quadratisch",pageWidthMm:210,pageHeightMm:210}
};

function resolveFormat(project,settings={}){
  const requested=settings.trimPreset;
  if(requested&&FORMAT_PRESETS[requested])return {...FORMAT_PRESETS[requested]};
  const layoutFormat=project.layout?.settings?.pageFormat||"A4 Querformat";
  return {...(layoutFormat.includes("Quadratisch")?FORMAT_PRESETS.square:FORMAT_PRESETS.a5)};
}

function dataUrlBytes(dataUrl){
  const base64=String(dataUrl||"").split(",")[1]||"";
  if(typeof atob==="function"){
    const binary=atob(base64),bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;
  }
  if(typeof Buffer!=="undefined")return new Uint8Array(Buffer.from(base64,"base64"));
  throw new Error("Base64-Daten können in dieser Umgebung nicht gelesen werden.");
}

function jpegDataUrl(dataUrl,width,height){return {bytes:dataUrlBytes(dataUrl),width,height};}

function buildPdfFromJpegs(pages,metadata={}){
  if(!Array.isArray(pages)||!pages.length)throw new Error("Mindestens eine PDF-Seite ist erforderlich.");
  const objectCount=2+pages.length*3+1,infoId=objectCount;
  const objects=Array(objectCount+1),kids=[];
  objects[1]=ascii("<< /Type /Catalog /Pages 2 0 R >>");
  pages.forEach((page,index)=>{
    const imageId=3+index*3,contentId=imageId+1,pageId=imageId+2;kids.push(`${pageId} 0 R`);
    const pageWidthPt=Number(page.pageWidthPt||mmToPt(page.pageWidthMm)),pageHeightPt=Number(page.pageHeightPt||mmToPt(page.pageHeightMm));
    const imageHeader=ascii(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`);
    objects[imageId]=concat([imageHeader,page.bytes,ascii("\nendstream")]);
    const stream=`q\n${pageWidthPt.toFixed(4)} 0 0 ${pageHeightPt.toFixed(4)} 0 0 cm\n/Im${index+1} Do\nQ\n`;
    objects[contentId]=ascii(`<< /Length ${ascii(stream).length} >>\nstream\n${stream}endstream`);
    objects[pageId]=ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt.toFixed(4)} ${pageHeightPt.toFixed(4)}] /Resources << /XObject << /Im${index+1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
  });
  objects[2]=ascii(`<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pages.length} >>`);
  const created=new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14);
  objects[infoId]=ascii(`<< /Title (${escapePdf(metadata.title||"CAPS Kinderbuch")}) /Author (${escapePdf(metadata.author||"")}) /Creator (CAPS Studio ${escapePdf(metadata.version||"")}) /Producer (CAPS Browser PDF Engine) /CreationDate (D:${created}) >>`);
  const header=new Uint8Array([37,80,68,70,45,49,46,52,10,37,226,227,207,211,10]);
  const chunks=[header],offsets=Array(objectCount+1).fill(0);let offset=header.length;
  for(let id=1;id<=objectCount;id++){
    offsets[id]=offset;const prefix=ascii(`${id} 0 obj\n`),suffix=ascii("\nendobj\n");chunks.push(prefix,objects[id],suffix);offset+=prefix.length+objects[id].length+suffix.length;
  }
  const xrefOffset=offset;let xref=`xref\n0 ${objectCount+1}\n0000000000 65535 f \n`;
  for(let id=1;id<=objectCount;id++)xref+=`${String(offsets[id]).padStart(10,"0")} 00000 n \n`;
  const trailer=`trailer\n<< /Size ${objectCount+1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(ascii(xref),ascii(trailer));return concat(chunks);
}

function createCanvas(widthMm,heightMm,dpi){
  if(typeof document==="undefined")throw new Error("Die Seitengestaltung benötigt einen Browser mit Canvas-Unterstützung.");
  const canvas=document.createElement("canvas");canvas.width=mmToPx(widthMm,dpi);canvas.height=mmToPx(heightMm,dpi);return canvas;
}

function loadImage(dataUrl){
  if(!dataUrl)return Promise.resolve(null);
  return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error("Ein Illustrationsbild konnte nicht geladen werden."));image.src=dataUrl;});
}

function drawCover(ctx,image,x,y,w,h){
  if(!image)return false;const sourceRatio=image.naturalWidth/image.naturalHeight,targetRatio=w/h;let sx=0,sy=0,sw=image.naturalWidth,sh=image.naturalHeight;
  if(sourceRatio>targetRatio){sw=image.naturalHeight*targetRatio;sx=(image.naturalWidth-sw)/2}else{sh=image.naturalWidth/targetRatio;sy=(image.naturalHeight-sh)/2}
  ctx.drawImage(image,sx,sy,sw,sh,x,y,w,h);return true;
}

function roundedRect(ctx,x,y,w,h,r){const radius=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+w,y,x+w,y+h,radius);ctx.arcTo(x+w,y+h,x,y+h,radius);ctx.arcTo(x,y+h,x,y,radius);ctx.arcTo(x,y,x+w,y,radius);ctx.closePath();}

function fontStack(value){const font=clean(value)||"Georgia";return /Georgia/i.test(font)?'Georgia, "Times New Roman", serif':/Verdana/i.test(font)?'Verdana, Arial, sans-serif':/Trebuchet/i.test(font)?'"Trebuchet MS", Arial, sans-serif':'Arial, sans-serif';}

function wrapLine(ctx,text,maxWidth){
  const words=clean(text).split(/\s+/).filter(Boolean),lines=[];let line="";
  words.forEach(word=>{const candidate=line?`${line} ${word}`:word;if(ctx.measureText(candidate).width<=maxWidth||!line)line=candidate;else{lines.push(line);line=word}});if(line)lines.push(line);return lines;
}

function layoutText(ctx,title,text,box,options={}){
  const family=fontStack(options.fontFamily),preferred=clamp(Number(options.bodyPt)||16,9,28),min=clamp(Number(options.minBodyPt)||10,8,preferred),titlePt=clamp(Number(options.titlePt)||26,14,48),showTitle=Boolean(options.showTitle&&clean(title));
  const paragraphs=clean(text).split(/\n\s*\n/).map(v=>v.trim()).filter(Boolean);let chosen=null;
  for(let bodyPt=preferred;bodyPt>=min;bodyPt-=.5){
    const px=bodyPt*options.dpi/72,lineHeight=px*1.38,titlePx=titlePt*options.dpi/72,titleHeight=showTitle?titlePx*1.25+lineHeight*.45:0;ctx.font=`${px}px ${family}`;
    const lines=[];paragraphs.forEach((paragraph,index)=>{wrapLine(ctx,paragraph,box.w).forEach(line=>lines.push({text:line,paragraph:index}));});
    const paragraphGaps=Math.max(0,paragraphs.length-1)*lineHeight*.42,total=titleHeight+lines.length*lineHeight+paragraphGaps;
    if(total<=box.h||bodyPt===min){chosen={bodyPt,px,lineHeight,titlePx,titleHeight,lines,total,overflow:total>box.h};break}
  }
  ctx.save();ctx.fillStyle=options.color||"#172033";ctx.textBaseline="top";let y=box.y;
  if(showTitle){ctx.font=`700 ${chosen.titlePx}px ${family}`;const titleLines=wrapLine(ctx,title,box.w);titleLines.slice(0,2).forEach(line=>{ctx.fillText(line,box.x,y);y+=chosen.titlePx*1.12});y+=chosen.lineHeight*.35}
  ctx.font=`${chosen.px}px ${family}`;let lastParagraph=-1;chosen.lines.forEach(line=>{if(lastParagraph>=0&&line.paragraph!==lastParagraph)y+=chosen.lineHeight*.42;ctx.fillText(line.text,box.x,y);y+=chosen.lineHeight;lastParagraph=line.paragraph});ctx.restore();return chosen;
}

function illustrationFor(project,spread){return project.illustrations?.items?.find(item=>item.id===spread.illustrationId)||project.illustrations?.items?.find(item=>item.spreadId===spread.id)||null;}

async function renderSpread(project,spread,settings,format){
  const dpi=settings.outputDpi,canvas=createCanvas(format.pageWidthMm*2,format.pageHeightMm,dpi),ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
  ctx.fillStyle="#fffdf9";ctx.fillRect(0,0,W,H);
  const illustration=illustrationFor(project,spread),image=await loadImage(illustration?.imageData||"").catch(()=>null),share=clamp(Number(spread.composition?.imageShare)||62,38,92)/100;
  const inherited=project.layout?.settings?.textPosition||"bottom",position=spread.textPosition&&spread.textPosition!=="inherit"?spread.textPosition:(spread.composition?.recommendedPosition||inherited);
  let imageBox,copyBox;
  if(position==="left"){
    const textW=W*(1-share);copyBox={x:0,y:0,w:textW,h:H};imageBox={x:textW,y:0,w:W-textW,h:H};
  }else if(position==="right"){
    const imageW=W*share;imageBox={x:0,y:0,w:imageW,h:H};copyBox={x:imageW,y:0,w:W-imageW,h:H};
  }else{
    const imageH=H*share;imageBox={x:0,y:0,w:W,h:imageH};copyBox={x:0,y:imageH,w:W,h:H-imageH};
  }
  if(!drawCover(ctx,image,imageBox.x,imageBox.y,imageBox.w,imageBox.h)){
    const gradient=ctx.createLinearGradient(imageBox.x,imageBox.y,imageBox.x+imageBox.w,imageBox.y+imageBox.h);gradient.addColorStop(0,"#dbeafe");gradient.addColorStop(1,"#ede9fe");ctx.fillStyle=gradient;ctx.fillRect(imageBox.x,imageBox.y,imageBox.w,imageBox.h);ctx.fillStyle="#475569";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`700 ${Math.round(18*dpi/72)}px Arial`;ctx.fillText(`Illustration Doppelseite ${spread.number}`,imageBox.x+imageBox.w/2,imageBox.y+imageBox.h/2);ctx.textAlign="left";
  }
  ctx.fillStyle=settings.paperTint||"#fffdf9";ctx.fillRect(copyBox.x,copyBox.y,copyBox.w,copyBox.h);
  const margin=mmToPx(settings.safeMarginMm,dpi),box={x:copyBox.x+margin,y:copyBox.y+margin,w:Math.max(10,copyBox.w-margin*2),h:Math.max(10,copyBox.h-margin*2)};
  const result=layoutText(ctx,spread.title,spread.layoutText||spread.text||"",box,{dpi,fontFamily:project.layout?.settings?.fontFamily,bodyPt:project.layout?.settings?.bodyFontSize,titlePt:project.layout?.settings?.titleFontSize,minBodyPt:settings.minBodyFontPt,showTitle:settings.showSpreadTitles,color:settings.textColor});
  return {canvas,overflow:result.overflow,bodyPt:result.bodyPt,illustration};
}

function drawMarks(ctx,trim,bleed,slug,dpi,options={}){
  if(!options.cropMarks&&!options.showTrimBox)return;const mm=value=>mmToPx(value,dpi),x0=mm(slug+bleed),y0=mm(slug+bleed),x1=x0+mm(trim.w),y1=y0+mm(trim.h),mark=mm(4),gap=mm(1.2);
  ctx.save();ctx.strokeStyle="#111";ctx.lineWidth=Math.max(1,mm(.18));
  if(options.cropMarks){[[x0,y0,-1,-1],[x1,y0,1,-1],[x0,y1,-1,1],[x1,y1,1,1]].forEach(([x,y,h,v])=>{ctx.beginPath();ctx.moveTo(x+h*gap,y);ctx.lineTo(x+h*(gap+mark),y);ctx.moveTo(x,y+v*gap);ctx.lineTo(x,y+v*(gap+mark));ctx.stroke()})}
  if(options.showTrimBox){ctx.setLineDash([mm(1.5),mm(1)]);ctx.strokeStyle="rgba(220,38,38,.75)";ctx.strokeRect(x0,y0,mm(trim.w),mm(trim.h));ctx.setLineDash([])}ctx.restore();
}

function pageSheet(format,settings){const bleed=Number(settings.bleedMm)||0,slug=settings.cropMarks||settings.showTrimBox?Number(settings.slugMm)||5:0;return {widthMm:format.pageWidthMm+2*(bleed+slug),heightMm:format.pageHeightMm+2*(bleed+slug),bleed,slug};}

function halfPage(spreadCanvas,side,format,settings,pageNumber=null){
  const dpi=settings.outputDpi,sheet=pageSheet(format,settings),canvas=createCanvas(sheet.widthMm,sheet.heightMm,dpi),ctx=canvas.getContext("2d"),slugPx=mmToPx(sheet.slug,dpi),bleedPx=mmToPx(sheet.bleed,dpi),trimW=mmToPx(format.pageWidthMm,dpi),trimH=mmToPx(format.pageHeightMm,dpi),sheetW=canvas.width,sheetH=canvas.height;
  ctx.fillStyle="#fff";ctx.fillRect(0,0,sheetW,sheetH);const sx=side==="left"?0:Math.floor(spreadCanvas.width/2),sw=Math.floor(spreadCanvas.width/2),x=slugPx,y=slugPx,w=trimW+bleedPx*2,h=trimH+bleedPx*2;
  // Slightly enlarged underlay creates real edge bleed without exposing white seams.
  ctx.drawImage(spreadCanvas,sx,0,sw,spreadCanvas.height,x,y,w,h);
  ctx.drawImage(spreadCanvas,sx,0,sw,spreadCanvas.height,x+bleedPx,y+bleedPx,trimW,trimH);
  if(settings.showPageNumbers&&pageNumber){ctx.save();ctx.fillStyle="rgba(51,65,85,.78)";ctx.font=`${Math.max(10,Math.round(8*dpi/72))}px Arial`;ctx.textBaseline="bottom";ctx.textAlign=pageNumber%2===0?"left":"right";const px=pageNumber%2===0?x+bleedPx+mmToPx(8,dpi):x+bleedPx+trimW-mmToPx(8,dpi);ctx.fillText(String(pageNumber),px,y+bleedPx+trimH-mmToPx(5,dpi));ctx.restore()}
  drawMarks(ctx,{w:format.pageWidthMm,h:format.pageHeightMm},sheet.bleed,sheet.slug,dpi,settings);return {canvas,sheet};
}

function blankPage(format,settings,kind="blank",project=null){
  const dpi=settings.outputDpi,sheet=pageSheet(format,settings),canvas=createCanvas(sheet.widthMm,sheet.heightMm,dpi),ctx=canvas.getContext("2d"),slugPx=mmToPx(sheet.slug,dpi),bleedPx=mmToPx(sheet.bleed,dpi),trimW=mmToPx(format.pageWidthMm,dpi),trimH=mmToPx(format.pageHeightMm,dpi),x=slugPx+bleedPx,y=slugPx+bleedPx;
  ctx.fillStyle=settings.paperTint||"#fffdf9";ctx.fillRect(0,0,canvas.width,canvas.height);
  if(kind==="title"){
    const title=project?.layout?.cover?.title||project?.title||"Kinderbuch",subtitle=project?.layout?.cover?.subtitle||"",author=project?.layout?.cover?.author||settings.author||"";const margin=mmToPx(18,dpi),box={x:x+margin,y:y+trimH*.24,w:trimW-margin*2,h:trimH*.5};layoutText(ctx,title,[subtitle,author].filter(Boolean).join("\n\n"),box,{dpi,fontFamily:project?.layout?.settings?.fontFamily,bodyPt:15,titlePt:30,minBodyPt:11,showTitle:true,color:settings.textColor});
  }else if(kind==="copyright"){
    const year=new Date().getFullYear(),title=project?.layout?.cover?.title||project?.title||"",author=project?.layout?.cover?.author||settings.author||"",publisher=settings.publisher||"Privatausgabe",isbn=settings.isbn?`ISBN ${settings.isbn}`:"";const text=[`© ${year} ${author||"Alle Rechte vorbehalten"}`,title,publisher,isbn,"Erstellt und gesetzt mit CAPS Studio.","Text und Illustrationen dürfen nur mit Zustimmung der Rechteinhaber vervielfältigt werden."].filter(Boolean).join("\n\n");const margin=mmToPx(16,dpi),box={x:x+margin,y:y+trimH*.52,w:trimW-margin*2,h:trimH*.34};layoutText(ctx,"",text,box,{dpi,fontFamily:"Arial",bodyPt:9.5,titlePt:18,minBodyPt:8,showTitle:false,color:"#475569"});
  }
  drawMarks(ctx,{w:format.pageWidthMm,h:format.pageHeightMm},sheet.bleed,sheet.slug,dpi,settings);return {canvas,sheet};
}

function canvasJpeg(canvas,quality=.9){const data=canvas.toDataURL("image/jpeg",clamp(quality,.55,.96));return jpegDataUrl(data,canvas.width,canvas.height);}

function interiorPageCount(project){const core=2+(project.layout?.spreads?.length||0)*2;return core+(4-core%4)%4;}

async function createInterior(project,settings={},onProgress=()=>{}){
  if(!project.layout?.spreads?.length)throw new Error("Für den Innenblock ist ein komponiertes Layout erforderlich.");
  const format=resolveFormat(project,settings),cfg={...settings,outputDpi:clamp(Number(settings.outputDpi)||300,120,300)},pages=[],total=interiorPageCount(project),sheet=pageSheet(format,cfg);let completed=0;
  const pushCanvas=(canvas,label)=>{pages.push({...canvasJpeg(canvas,cfg.jpegQuality||.9),pageWidthMm:sheet.widthMm,pageHeightMm:sheet.heightMm});completed++;onProgress({completed,total,label,percent:Math.round(completed/total*100)})};
  pushCanvas(blankPage(format,cfg,"title",project).canvas,"Titelseite");pushCanvas(blankPage(format,cfg,"copyright",project).canvas,"Impressum");
  let logicalPage=3;
  for(const spread of project.layout.spreads){const rendered=await renderSpread(project,spread,cfg,format);const left=halfPage(rendered.canvas,"left",format,cfg,logicalPage++),right=halfPage(rendered.canvas,"right",format,cfg,logicalPage++);pushCanvas(left.canvas,`Doppelseite ${spread.number} links`);pushCanvas(right.canvas,`Doppelseite ${spread.number} rechts`);rendered.canvas.width=1;rendered.canvas.height=1;await new Promise(resolve=>setTimeout(resolve,0));}
  while(pages.length%4)pushCanvas(blankPage(format,cfg,"blank",project).canvas,"Leerseite");
  const bytes=buildPdfFromJpegs(pages,{title:`${project.layout.cover.title||project.title} – Innenblock`,author:project.layout.cover.author,version:"0.8.3"});return {bytes,pageCount:pages.length,format,sheet,filename:`${fileSafe(project.layout.cover.title||project.title)}-Innenblock.pdf`};
}

function spineWidth(project,settings={}){const pages=interiorPageCount(project);if(settings.binding==="saddle")return 0;const sheets=pages/2;return Number((sheets*(Number(settings.paperCaliperMm)||.1)).toFixed(2));}

async function createCover(project,settings={},onProgress=()=>{}){
  if(!project.layout)throw new Error("Für den Umschlag ist ein Layout erforderlich.");
  const format=resolveFormat(project,settings),cfg={...settings,outputDpi:clamp(Number(settings.outputDpi)||300,120,300)},spine=spineWidth(project,cfg),bleed=Number(cfg.bleedMm)||0,slug=cfg.cropMarks||cfg.showTrimBox?Number(cfg.slugMm)||5:0,trimW=format.pageWidthMm*2+spine,trimH=format.pageHeightMm,sheetW=trimW+2*(bleed+slug),sheetH=trimH+2*(bleed+slug),canvas=createCanvas(sheetW,sheetH,cfg.outputDpi),ctx=canvas.getContext("2d"),mm=value=>mmToPx(value,cfg.outputDpi),originX=mm(slug+bleed),originY=mm(slug+bleed),pageW=mm(format.pageWidthMm),pageH=mm(format.pageHeightMm),spinePx=mm(spine);
  ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);const first=project.illustrations?.items?.find(item=>item.imageData),image=await loadImage(first?.imageData||"").catch(()=>null);
  // Bleed underlay and trim background.
  const underX=mm(slug),underY=mm(slug),underW=mm(trimW+2*bleed),underH=mm(trimH+2*bleed);if(!drawCover(ctx,image,underX,underY,underW,underH)){const gradient=ctx.createLinearGradient(underX,underY,underX+underW,underY+underH);gradient.addColorStop(0,"#172554");gradient.addColorStop(1,"#4f46e5");ctx.fillStyle=gradient;ctx.fillRect(underX,underY,underW,underH)}
  // Back cover veil, spine, front cover veil.
  ctx.fillStyle="rgba(15,23,42,.58)";ctx.fillRect(originX,originY,pageW,pageH);ctx.fillStyle="rgba(15,23,42,.28)";ctx.fillRect(originX+pageW+spinePx,originY,pageW,pageH);if(spinePx>0){ctx.fillStyle="rgba(15,23,42,.72)";ctx.fillRect(originX+pageW,originY,spinePx,pageH)}
  const title=project.layout.cover.title||project.title||"Kinderbuch",subtitle=project.layout.cover.subtitle||"",author=project.layout.cover.author||cfg.author||"";
  const frontMargin=mm(16),frontBox={x:originX+pageW+spinePx+frontMargin,y:originY+pageH*.18,w:pageW-frontMargin*2,h:pageH*.58};layoutText(ctx,title,[subtitle,author].filter(Boolean).join("\n\n"),frontBox,{dpi:cfg.outputDpi,fontFamily:project.layout.settings?.fontFamily,bodyPt:15,titlePt:30,minBodyPt:11,showTitle:true,color:"#ffffff"});
  const blurb=clean(cfg.backCoverText)||clean(project.bookPlan?.storyBible?.logline)||clean(project.bookPlan?.storyBible?.coreMessage)||"Eine persönliche Geschichte über Mut, Nähe und einen kleinen Schritt, der vieles verändert.";const backMargin=mm(15),backBox={x:originX+backMargin,y:originY+pageH*.19,w:pageW-backMargin*2,h:pageH*.5};layoutText(ctx,"",blurb,backBox,{dpi:cfg.outputDpi,fontFamily:project.layout.settings?.fontFamily,bodyPt:13,titlePt:20,minBodyPt:10,showTitle:false,color:"#ffffff"});
  if(cfg.publisher){ctx.fillStyle="rgba(255,255,255,.92)";ctx.font=`${Math.round(8.5*cfg.outputDpi/72)}px Arial`;ctx.textBaseline="bottom";ctx.fillText(cfg.publisher,originX+backMargin,originY+pageH-mm(11))}
  if(cfg.isbn){const bw=mm(39),bh=mm(25),bx=originX+pageW-bw-mm(10),by=originY+pageH-bh-mm(10);ctx.fillStyle="#fff";roundedRect(ctx,bx,by,bw,bh,mm(2));ctx.fill();ctx.fillStyle="#111";ctx.font=`${Math.round(7*cfg.outputDpi/72)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(`ISBN ${cfg.isbn}`,bx+bw/2,by+bh/2);ctx.textAlign="left"}
  if(spine>=4.5&&cfg.showSpineText!==false){ctx.save();ctx.translate(originX+pageW+spinePx/2,originY+pageH/2);ctx.rotate(-Math.PI/2);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`700 ${Math.max(9,Math.round(Math.min(13,spine*1.8)*cfg.outputDpi/72))}px ${fontStack(project.layout.settings?.fontFamily)}`;ctx.fillText(`${title}${author?` · ${author}`:""}`,0,0,Math.max(10,pageH-mm(28)));ctx.restore()}
  drawMarks(ctx,{w:trimW,h:trimH},bleed,slug,cfg.outputDpi,cfg);onProgress({completed:1,total:1,label:"Umschlag",percent:100});const page=canvasJpeg(canvas,cfg.jpegQuality||.92);page.pageWidthMm=sheetW;page.pageHeightMm=sheetH;const bytes=buildPdfFromJpegs([page],{title:`${title} – Umschlag`,author,version:"0.8.3"});return {bytes,pageCount:1,format,spineWidthMm:spine,sheet:{widthMm:sheetW,heightMm:sheetH},filename:`${fileSafe(title)}-Umschlag.pdf`};
}

function downloadBytes(bytes,filename,mime="application/pdf"){
  const blob=new Blob([bytes],{type:mime}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);return filename;
}

window.CAPS_PDFEngine={FORMAT_PRESETS,resolveFormat,buildPdfFromJpegs,createInterior,createCover,interiorPageCount,spineWidth,downloadBytes,dataUrlBytes,mmToPt,fileSafe};
})();
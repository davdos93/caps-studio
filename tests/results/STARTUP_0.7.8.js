const fs=require("fs"),vm=require("vm");
const store=new Map(),appNode={innerHTML:""};
const sandbox={
 console,
 crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},
 localStorage:{getItem:key=>store.has(key)?store.get(key):null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)},
 navigator:{userAgent:"Chrome Test"},
 document:{
  getElementById:id=>id==="app"?appNode:null,
  querySelectorAll:()=>[],
  createElement:()=>({style:{},appendChild(){},remove(){},click(){},select(){},setAttribute(){},addEventListener(){},classList:{add(){},remove(){}}}),
  body:{appendChild(){},removeChild(){}},
  documentElement:{style:{}}
 },
 alert(){},confirm(){return true},setTimeout,clearTimeout,
 FileReader:function(){},Blob:function(){},
 URL:{createObjectURL(){return ""},revokeObjectURL(){}}
};
sandbox.window=sandbox;
sandbox.window.addEventListener=()=>{};
sandbox.window.print=()=>{};
vm.createContext(sandbox);
const html=fs.readFileSync("beta/index.html","utf8");
const scripts=[...html.matchAll(/<script src="([^"?]+)/g)].map(match=>match[1]);
for(const ref of scripts){
 vm.runInContext(fs.readFileSync("beta/"+ref,"utf8"),sandbox,{filename:ref});
}
if(!appNode.innerHTML.includes("Was soll in einem Kinderherzen bleiben?"))throw new Error("Home wurde nicht gerendert");
if(!sandbox.CAPS||sandbox.CAPS.version!=="0.7.8")throw new Error("Versionsprüfung fehlgeschlagen");
console.log(JSON.stringify({scripts:scripts.length,homeRendered:true,version:sandbox.CAPS.version},null,2));

const fs=require("fs"),vm=require("vm");
const store=new Map(),appNode={innerHTML:""};
const sandbox={console,crypto:{randomUUID:()=>Math.random().toString(16).slice(2)+"-"+Date.now()},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},navigator:{userAgent:"Chrome Test",clipboard:{writeText:async()=>{}}},document:{getElementById:id=>id==="app"?appNode:null,querySelectorAll:()=>[],createElement:()=>({style:{},appendChild(){},remove(){},click(){},select(){},setAttribute(){},addEventListener(){},classList:{add(){},remove(){}}}),body:{appendChild(){},removeChild(){}},documentElement:{style:{}},execCommand(){return true}},alert(){},confirm(){return true},prompt(){return null},setTimeout,clearTimeout,FileReader:function(){},Image:function(){},Blob:function(){},TextEncoder,URL:{createObjectURL(){return ""},revokeObjectURL(){}}};
sandbox.window=sandbox;sandbox.window.addEventListener=()=>{};sandbox.window.print=()=>{};
vm.createContext(sandbox);
const html=fs.readFileSync("beta/index.html","utf8");
const scripts=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
for(const ref of scripts)vm.runInContext(fs.readFileSync("beta/"+ref,"utf8"),sandbox,{filename:ref});
if(!sandbox.CAPS||sandbox.CAPS.version!=="0.9.0"||!sandbox.CAPS.sprint.includes("Phase 3"))throw new Error("Version oder Phase falsch");
if(typeof sandbox.CAPS_ConsistencyEngine?.run!=="function")throw new Error("Consistency Engine fehlt");
if(!sandbox.CAPS_WorkflowEngine.stageOrder.includes("consistency"))throw new Error("Workflow-Integration fehlt");
if(!sandbox.CAPS_HistoryEngine.stageOrder.includes("consistency"))throw new Error("History-Integration fehlt");
console.log(JSON.stringify({scripts:scripts.length,version:sandbox.CAPS.version,phase:3,consistency:true,workflowStages:sandbox.CAPS_WorkflowEngine.stageOrder.length,historyStages:sandbox.CAPS_HistoryEngine.stageOrder.length,homeRendered:appNode.innerHTML.length>0},null,2));

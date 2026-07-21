const fs=require("fs");
const path=".github/workflows/quality-gate.yml";
if(!fs.existsSync(path))throw new Error("Quality-Gate-Workflow fehlt");
const value=fs.readFileSync(path,"utf8");
const checks={
  name:/name:\s*CAPS Quality Gate/.test(value),
  push:/\bpush:\s*\n\s*branches:/.test(value),
  pullRequest:/\bpull_request:\s*\n\s*branches:/.test(value),
  manual:/\bworkflow_dispatch:/.test(value),
  readOnly:/permissions:\s*\n\s*contents:\s*read/.test(value),
  checkout:/actions\/checkout@v7/.test(value),
  setupNode:/actions\/setup-node@v7/.test(value),
  node24:/node-version:\s*24/.test(value),
  validator:/node scripts\/validate-release\.js/.test(value),
  cleanReport:/rm -f tests\/results\/QUALITY_GATE_REPORT\.json/.test(value),
  artifact:/actions\/upload-artifact@v7/.test(value),
  report:/tests\/results\/QUALITY_GATE_REPORT\.json/.test(value),
  timeout:/timeout-minutes:\s*15/.test(value)
};
const failed=Object.entries(checks).filter(([,pass])=>!pass).map(([name])=>name);
if(failed.length)throw new Error("Workflow-Vertrag verletzt: "+failed.join(", "));
console.log(JSON.stringify({workflow:path,checks:Object.keys(checks).length,passed:Object.values(checks).filter(Boolean).length,node:24,actions:{checkout:7,setupNode:7,uploadArtifact:7}},null,2));

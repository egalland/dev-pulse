import { createInterface } from "node:readline";

const rl = createInterface({input:process.stdin,terminal:false});
const [line] = await new Promise(resolve => rl.once("line", value => resolve([value])));
rl.close();
const input = JSON.parse(line);
const body = {
  jsonrpc:"2.0",
  id:"quota-sync",
  method:"tools/call",
  params:{name:"update_quota_status",arguments:input.quota}
};
const response = await fetch(input.mcpUrl,{
  method:"POST",
  headers:{"content-type":"application/json","OAI-Sites-Authorization":input.siteToken},
  body:JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { throw new Error(`La synchronisation a répondu ${response.status}.`); }
if(!response.ok || result.error || result.result?.isError) throw new Error("La synchronisation du quota a échoué.");
console.log("Quota Dev Pulse synchronisé.");

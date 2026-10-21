const PAGE_PLACEHOLDER = "__DEV_PULSE_PAGE__";

const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
});

function rpc(id, result, error) {
  return json(error ? {jsonrpc:"2.0",id,error} : {jsonrpc:"2.0",id,result});
}

function validQuota(input) {
  const percent = value => Number.isFinite(value) && value >= 0 && value <= 100;
  return input && percent(input.primaryUsedPercent) && percent(input.weeklyUsedPercent) &&
    Number.isInteger(input.primaryResetsAt) && Number.isInteger(input.weeklyResetsAt);
}

async function readQuota(env) {
  const row = await env.DB.prepare("SELECT payload, updated_at FROM quota_state WHERE id = 1").first();
  if (!row) return {connected:false,source:"Codex PC",updatedAt:null};
  const payload = JSON.parse(row.payload);
  const ageSeconds = Math.max(0, Math.floor(Date.now() / 1000) - Number(row.updated_at));
  return {...payload,connected:ageSeconds < 1200,ageSeconds};
}

async function updateQuota(env, args) {
  if (!validQuota(args)) throw new Error("Valeurs de quota invalides");
  const updatedAt = Math.floor(Date.now() / 1000);
  const payload = {
    source:"Codex PC",
    updatedAt:new Date(updatedAt * 1000).toISOString(),
    primary:{usedPercent:args.primaryUsedPercent,remainingPercent:100-args.primaryUsedPercent,windowDurationMins:300,resetsAt:args.primaryResetsAt},
    weekly:{usedPercent:args.weeklyUsedPercent,remainingPercent:100-args.weeklyUsedPercent,windowDurationMins:10080,resetsAt:args.weeklyResetsAt}
  };
  await env.DB.prepare("INSERT INTO quota_state (id, payload, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at")
    .bind(JSON.stringify(payload), updatedAt).run();
  return {...payload,connected:true,ageSeconds:0};
}

async function mcp(request, env) {
  let body;
  try { body = await request.json(); } catch { return rpc(null,null,{code:-32700,message:"Invalid JSON"}); }
  const {id,method,params={}} = body;
  if (method === "server/discover") return rpc(id,{supportedVersions:["2026-07-28"],capabilities:{tools:{}}});
  if (method === "tools/list") return rpc(id,{tools:[
    {name:"get_quota_status",description:"Lire le dernier quota Codex synchronisé et l’état en ligne du PC.",inputSchema:{type:"object",properties:{},additionalProperties:false}},
    {name:"update_quota_status",description:"Mettre à jour le quota Codex depuis le PC connecté.",inputSchema:{type:"object",properties:{primaryUsedPercent:{type:"number",minimum:0,maximum:100},weeklyUsedPercent:{type:"number",minimum:0,maximum:100},primaryResetsAt:{type:"integer"},weeklyResetsAt:{type:"integer"}},required:["primaryUsedPercent","weeklyUsedPercent","primaryResetsAt","weeklyResetsAt"],additionalProperties:false}}
  ]});
  if (method === "tools/call") {
    try {
      const result = params.name === "get_quota_status" ? await readQuota(env) : params.name === "update_quota_status" ? await updateQuota(env,params.arguments||{}) : null;
      if (!result) return rpc(id,{content:[{type:"text",text:"Outil inconnu"}],isError:true});
      return rpc(id,{content:[{type:"text",text:JSON.stringify(result)}],structuredContent:result,isError:false});
    } catch (error) { return rpc(id,{content:[{type:"text",text:error.message}],isError:true}); }
  }
  return rpc(id,null,{code:-32601,message:"Method not found"});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/mcp") return mcp(request,env);
    if (request.method === "GET" && url.pathname === "/api/quota") return json(await readQuota(env));
    if (request.method === "GET" && url.pathname === "/") return new Response(PAGE_PLACEHOLDER,{headers:{"content-type":"text/html; charset=utf-8"}});
    return new Response("Not found",{status:404});
  }
};

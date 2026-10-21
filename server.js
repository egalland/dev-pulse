const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8787);
const root = path.join(__dirname, 'dist');
const quotaFile = path.join(__dirname, 'data', 'quota.json');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};

function send(res, status, body, type='text/plain; charset=utf-8') {
  res.writeHead(status, {'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(body);
}

async function githubDay(url, res) {
  const username = (url.searchParams.get('username') || '').trim();
  const date = url.searchParams.get('date');
  if (!username || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return send(res,400,JSON.stringify({error:'Paramètres invalides'}),types['.json']);
  const headers = {'Accept':'application/vnd.github+json','User-Agent':'Dev-Pulse-Local'};
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`,{headers});
    if (!response.ok) throw new Error(response.status === 404 ? 'Utilisateur GitHub introuvable' : `GitHub ${response.status}`);
    const all = await response.json();
    const events = all.filter(event => event.created_at?.slice(0,10) === date);
    const commits = [];
    for (const event of events.filter(event => event.type === 'PushEvent')) for (const commit of event.payload?.commits || []) commits.push({repo:event.repo.name,sha:commit.sha});
    const unique = [...new Map(commits.map(commit => [`${commit.repo}:${commit.sha}`,commit])).values()];
    const details = await Promise.all(unique.slice(0,30).map(async commit => {
      const detail = await fetch(`https://api.github.com/repos/${commit.repo}/commits/${commit.sha}`,{headers});
      if (!detail.ok) return {additions:0,deletions:0};
      const body = await detail.json(); return body.stats || {additions:0,deletions:0};
    }));
    const stats = details.reduce((sum,item)=>({additions:sum.additions+(item.additions||0),deletions:sum.deletions+(item.deletions||0)}),{additions:0,deletions:0});
    return send(res,200,JSON.stringify({date,commits:unique.length,additions:stats.additions,deletions:stats.deletions,events:events.length,partial:unique.length>30}),types['.json']);
  } catch (error) { return send(res,502,JSON.stringify({error:error.message}),types['.json']); }
}

http.createServer((req,res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/quota') {
    try { return send(res, 200, fs.readFileSync(quotaFile), types['.json']); }
    catch { return send(res, 503, JSON.stringify({connected:false,error:'Quota indisponible'}), types['.json']); }
  }
  if (url.pathname === '/api/github-day') return void githubDay(url,res);
  const clean = decodeURIComponent(url.pathname);
  const requested = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
  const file = path.resolve(root, requested);
  if (!file.startsWith(path.resolve(root) + path.sep) && file !== path.join(root,'index.html')) return send(res,403,'Interdit');
  fs.readFile(file,(err,data)=>err?send(res,404,'Introuvable'):send(res,200,data,types[path.extname(file)]||'application/octet-stream'));
}).listen(PORT,'127.0.0.1',()=>{
  console.log(`Dev Pulse connecté : http://localhost:${PORT}`);
  console.log('Laisse cette fenêtre ouverte. Ctrl+C pour arrêter.');
});

import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const html = readFileSync(resolve(root,"index.html"),"utf8");
const css = readFileSync(resolve(root,"styles.css"),"utf8");
const js = readFileSync(resolve(root,"app.js"),"utf8");
const page = html
  .replace(/<link rel="preconnect"[^>]*>\s*/g,"")
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g,"")
  .replace('<link rel="stylesheet" href="styles.css">',`<style>${css}</style>`)
  .replace('<script src="app.js"></script>',`<script>${js.replaceAll('</script>','<\\/script>')}</script>`);
const source = readFileSync(resolve(root,"worker/index.js"),"utf8")
  .replace('"__DEV_PULSE_PAGE__"',JSON.stringify(page));
mkdirSync(resolve(root,"dist/server"),{recursive:true});
mkdirSync(resolve(root,"dist/.openai"),{recursive:true});
writeFileSync(resolve(root,"dist/server/index.js"),source);
cpSync(resolve(root,".openai/hosting.json"),resolve(root,"dist/.openai/hosting.json"));
console.log("Worker Dev Pulse construit.");

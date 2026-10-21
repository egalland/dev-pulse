import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
const root=resolve(import.meta.dirname,"..");
const worker=resolve(root,"dist/server/index.js");
const manifest=resolve(root,"dist/.openai/hosting.json");
if(!existsSync(worker)||!existsSync(manifest))throw new Error("Artefact incomplet");
const source=readFileSync(worker,"utf8");
for(const marker of ["/api/quota","/mcp","update_quota_status","Dev Pulse"])if(!source.includes(marker))throw new Error(`Marqueur manquant: ${marker}`);
console.log("Artefact Worker valide.");

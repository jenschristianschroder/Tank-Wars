import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=await readFile(new URL('../pages/index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,2);
for(const s of scripts)new vm.Script(s[1]);
assert.ok(!/<script[^>]+src=|<link[^>]+href=|fetch\(|chatgpt\.site|\/api\//.test(html),'The static app must not depend on a game server or external assets.');
console.log('Static game scripts parse; no game server or external assets.');

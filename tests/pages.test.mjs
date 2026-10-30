import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {renderPages} from '../scripts/build-pages.mjs';
test('static game keeps solo rules and routes online actions to the backend',async()=>{
  const html=await renderPages();
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  scripts.forEach(s=>new vm.Script(s));
  assert.equal(scripts.length,2);
  assert.match(scripts[0],/const saved=null/);
  assert.match(scripts[0],/function ai\(/);
  const elements={create:{},join:{},code:{value:' abC234 '}};
  let destination;
  vm.runInNewContext(scripts[1],{$:id=>elements[id],location:{assign:url=>destination=url},URL});
  elements.create.onclick();
  assert.equal(destination,'https://tank-wars.ambersage512.chatgpt.site/');
  elements.join.onsubmit({preventDefault(){}});
  assert.equal(destination,'https://tank-wars.ambersage512.chatgpt.site/?room=ABC234');
});

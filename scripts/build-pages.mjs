import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import worker from '../worker/index.js';

export async function renderPages() {
  const multiplayer = 'https://tank-wars.ambersage512.chatgpt.site/';
  const response = await worker.fetch(new Request(multiplayer), {});
  let html = await response.text();
  html = html.replace('<p class="instructions">', '<p class="instructions">Solo practice runs here. Online duels open the multiplayer site and require access to that site.<br>');
  // Keep the gameplay UI and shared rules in one source. GitHub Pages has no
  // server endpoints: room creation and joining must open the multiplayer host.
  const bridge = `
<script>
$('create').onclick=()=>location.assign(${JSON.stringify(multiplayer)});
$('join').onsubmit=e=>{e.preventDefault();const url=new URL(${JSON.stringify(multiplayer)});url.searchParams.set('room',$('code').value.trim().toUpperCase());location.assign(url.href)};
$('create').textContent='Online duel ↗';
</script>`;
  // Pages never retains server seats. An invite code stays available in the form.
  html = html.replace("const saved=JSON.parse(localStorage.getItem('tankwars-session'));", 'const saved=null;');
  return html.replace('</body>', bridge + '</body>');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await mkdir('pages', { recursive: true });
  await writeFile('pages/index.html', await renderPages());
  await writeFile('pages/.nojekyll', '');
  console.log('Built GitHub Pages app in pages/');
}

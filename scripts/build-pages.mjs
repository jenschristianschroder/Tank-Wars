import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export const renderPages=()=>readFile(new URL('../index.html',import.meta.url),'utf8');
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  await mkdir('pages',{recursive:true});
  await writeFile('pages/index.html',await renderPages());
  await writeFile('pages/.nojekyll','');
  console.log('Built self-contained Tank Wars in pages/');
}

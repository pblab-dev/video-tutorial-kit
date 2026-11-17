// uso: node scripts/check_frames.mjs "t1,t2,..." saida_prefixo   (renderiza frames de checagem nos tempos dados, escala 0.5)
// Gera o JSON de props e imprime o comando. (renderização feita via CLI: remotion render Check --props=... --sequence)
import fs from 'fs';
const [list, out] = process.argv.slice(2);
const t = list.split(',').map(Number);
fs.writeFileSync(out, JSON.stringify({tList: t}));
console.log(t.length + ' frames');

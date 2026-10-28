// Verifica se todos os fontes em src/ são UTF-8 válido e sem mojibake.
// Uso: node scripts/check-encoding.mjs
import fs from "node:fs";
import path from "node:path";

const decoder = new TextDecoder("utf-8", { fatal: true });
let problems = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|css|md)$/.test(entry.name)) check(full);
  }
}

function check(file) {
  const bytes = fs.readFileSync(file);
  try {
    const text = decoder.decode(bytes);
    const mojibake = text.match(/.{0,15}(Ã[\u0080-\u00ff]|Â|â€|\uFFFD).{0,15}/g);
    if (mojibake) {
      problems++;
      console.log(`mojibake em ${file}:`, mojibake.slice(0, 3));
    }
  } catch {
    problems++;
    console.log(`UTF-8 inválido em ${file}`);
  }
}

walk("src");
if (fs.existsSync("README.md")) check("README.md");
console.log(problems ? `${problems} arquivo(s) com problema` : "codificação ok");
process.exit(problems ? 1 : 0);

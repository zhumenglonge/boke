// 拉取《冷水江市志》全书目录树，DFS 阅读顺序输出叶子节清单并写缓存。
// 用法: node catalogue.mjs   （缓存已存在时直接读缓存，不发请求；--force 强制刷新）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const CACHE = path.join(ROOT, '.lsjz-tmp/catalogue.json');
const BASE = 'http://113.246.57.229:8184';
const HEADERS = {
  'content-type': 'application/json;charset=UTF-8',
  'authorization': 'basic enlzb2Z0Onp5c29mdCo2MDc5',
  'u-terminal': 'PC', 'u-system-name': 'CPPCC', 'u-login-areaid': '430000',
  'accept': 'application/json, text/plain, */*',
};
const BOOK_ID = '970702';

if (fs.existsSync(CACHE) && !process.argv.includes('--force')) {
  const c = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  console.log(`（读缓存 ${c.fetchedAt}，共 ${c.leaves.length} 个叶子节；--force 可刷新）`);
  for (const n of c.leaves) console.log(`${n.id}\t${n.path}`);
  process.exit(0);
}

async function fetchTree(tries = 4) {
  let err;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 30000);
      const r = await fetch(BASE + '/lzt/bookCatalogue/openTree', {
        method: 'POST', headers: HEADERS, body: JSON.stringify({ query: { bookId: BOOK_ID } }), signal: ctrl.signal,
      });
      clearTimeout(t);
      const j = await r.json();
      if (j.code !== 200) throw new Error('code ' + j.code + ' ' + (j.message || ''));
      return j.data || [];
    } catch (e) { err = e; await new Promise(s => setTimeout(s, 800 * (i + 1))); }
  }
  throw err;
}

const tree = await fetchTree();
const nodes = [];
const walk = (arr, trail) => {
  for (const n of arr) {
    const p = [...trail, n.name.replace(/\s+/g, '')];
    const leaf = !n.children || !n.children.length;
    nodes.push({ id: String(n.id), name: n.name.replace(/\s+/g, ''), path: p.join(' / '), leaf });
    if (!leaf) walk(n.children, p);
  }
};
walk(tree, []);
const leaves = nodes.filter(n => n.leaf);

fs.mkdirSync(path.dirname(CACHE), { recursive: true });
fs.writeFileSync(CACHE, JSON.stringify({ bookId: BOOK_ID, fetchedAt: new Date().toISOString(), nodes, leaves }, null, 2));
console.log(`目录节点 ${nodes.length} 个，叶子节 ${leaves.length} 个，缓存已写入 .lsjz-tmp/catalogue.json`);
for (const n of leaves) console.log(`${n.id}\t${n.path}`);
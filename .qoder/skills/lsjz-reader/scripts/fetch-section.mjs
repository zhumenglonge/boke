// 按 detailId 提取《冷水江市志》一节正文，清洗 OCR 后直接产出阅读版 md。
// 用法: node fetch-section.mjs <detailId> <输出名>
// 例:   node fetch-section.mjs 970712 01-地理
// 产出: wechat/冷水江市志/<输出名>.md（阅读版草稿，仍需人工润色错字）
//       .lsjz-tmp/parts/<输出名>.raw.txt（原始 OCR 备份）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const BASE = 'http://113.246.57.229:8184';
const HEADERS = {
  'content-type': 'application/json;charset=UTF-8',
  'authorization': 'basic enlzb2Z0Onp5c29mdCo2MDc5',
  'u-terminal': 'PC', 'u-system-name': 'CPPCC', 'u-login-areaid': '430000',
  'accept': 'application/json, text/plain, */*',
};

const detailId = process.argv[2];
const outName = process.argv[3] || detailId;
if (!detailId) { console.error('用法: node fetch-section.mjs <detailId> <输出名>'); process.exit(1); }

async function fetchInfo(id, tries = 4) {
  let err;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 30000);
      const r = await fetch(BASE + '/lzt/bookCatalogue/openInfo', {
        method: 'POST', headers: HEADERS, body: JSON.stringify({ detailId: id }), signal: ctrl.signal,
      });
      clearTimeout(t);
      const j = await r.json();
      if (j.code !== 200) throw new Error('code ' + j.code + ' ' + (j.message || ''));
      return j.data;
    } catch (e) { err = e; await new Promise(s => setTimeout(s, 800 * (i + 1))); }
  }
  throw err;
}

// 去掉中文字符之间、中文与数字/字母之间的 OCR 多余空格
function despace(s) {
  s = s.replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, '$1');
  s = s.replace(/([\u4e00-\u9fff])\s+(?=[0-9A-Za-z°%．.,、])/g, '$1');
  s = s.replace(/([0-9A-Za-z°%．.,])\s+(?=[\u4e00-\u9fff])/g, '$1');
  // 去掉中文标点两侧的多余空格，收紧分数斜杠
  s = s.replace(/\s*([，。、；：？！“”‘’（）《》〈〉【】．])\s*/g, '$1');
  s = s.replace(/(\d)\s*\/\s*(\d)/g, '$1/$2');
  s = s.replace(/[ \t]{2,}/g, ' ');
  return s;
}

function clean(raw, title) {
  const titleC = (title || '').replace(/\s/g, '');
  let t = raw.replace(/<br\s*\/?>/gi, '\n');
  let lines = t.split('\n').map(x => x.trim()).filter(Boolean);
  lines = lines.filter(l => {
    const c = l.replace(/\s/g, '');
    if (titleC && c === titleC) return false;      // 去掉重复 running header
    if (/^\d{1,6}$/.test(c)) return false;          // 去掉页码/杂散数字
    return true;
  });
  // 逐行拼接：句末（。！？）后断段，其余视为行内折行直接相连
  const paras = [];
  let buf = '';
  for (const l of lines) {
    const d = despace(l);
    buf += d;
    if (/[。！？]$/.test(d)) { paras.push(buf); buf = ''; }
  }
  if (buf.trim()) paras.push(buf);
  return paras.join('\n\n');
}

const info = await fetchInfo(detailId);
const raw = info.content || '';
if (!raw) { console.error('警告: 该节点 content 为空（可能是图片页/无正文节点），请换叶子节。'); process.exit(2); }

const partsDir = path.join(ROOT, '.lsjz-tmp/parts');
fs.mkdirSync(partsDir, { recursive: true });
fs.writeFileSync(path.join(partsDir, `${outName}.raw.txt`), raw);

const cleaned = clean(raw, info.name);
const name = (info.name || '').replace(/\s+/g, '');
const header = `# 冷水江市志 · ${name}\n\n> 来源：湖南数字方志馆《冷水江市志》（1994 版，中国城市出版社），据馆藏 OCR 文本整理，已去除多余空格与页码。OCR 错字待人工润色；个别数字因原件扫描模糊按文意复原，仅供阅读。\n\n`;
const docsDir = path.join(ROOT, 'wechat/冷水江市志');
fs.mkdirSync(docsDir, { recursive: true });
const outFile = path.join(docsDir, `${outName}.md`);
fs.writeFileSync(outFile, header + cleaned + '\n');

console.log('节名:', info.name, '| pageNum:', info.pageNum);
console.log('原始字数:', raw.length, '| 清洗后字数:', cleaned.length);
console.log('阅读版草稿:', path.relative(ROOT, outFile));
console.log('下一步: 通读草稿修正 OCR 错字（如 共产裳→共产党、巳→已），并在 skill 的 progress.md 登记。');
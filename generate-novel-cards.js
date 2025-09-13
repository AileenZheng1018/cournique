#!/usr/bin/env node

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const NOVELS_DIR = path.resolve('novels');
const WORKS_HTML = path.resolve('works.html');

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;');
}

async function main() {
  const novelDirs = await fsp.readdir(NOVELS_DIR);
  let cardsHtml = '';

  for (const dir of novelDirs) {
    const metaPath = path.join(NOVELS_DIR, dir, 'meta.json');
    if (!fs.existsSync(metaPath)) continue;

    const meta = JSON.parse(await fsp.readFile(metaPath, 'utf8'));
    const { title, summary, chapters } = meta;

    if (!chapters || chapters.length === 0) continue;

    if (chapters.length === 1) {
      // 单章节
      cardsHtml +=
`        <div class="work-item"
             data-tags='["小说"]'
             data-id="novel-${dir}-01"
             data-link="/novels/${dir}/content.html">
          <div class="title">${escapeHtml(title)}</div>
          <div class="preview">${escapeHtml(summary || '')}</div>
        </div>\n`;
    } else {
      // 多章节
      for (const ch of chapters) {
        const chPath = `chapter-${String(ch.index).padStart(2, '0')}.html`;
        cardsHtml +=
`        <div class="work-item"
             data-tags='["小说","章节"]'
             data-id="novel-${dir}-${String(ch.index).padStart(2,'0')}"
             data-link="/novels/${dir}/${chPath}">
          <div class="title">${escapeHtml(title)} · ${escapeHtml(ch.title)}</div>
          <div class="preview">第${ch.index}章</div>
        </div>\n`;
      }
    }
  }

  let html = await fsp.readFile(WORKS_HTML, 'utf8');

  html = html.replace(
    /(<div\s+class="works-grid"\s*>)/,
    `$1\n${cardsHtml}`
  );

  await fsp.writeFile(WORKS_HTML, html, 'utf8');
  console.log('✅ 小说卡片已插入到 works.html 的 .works-grid 中');
}

main().catch(e => {
  console.error('❌ 出错：', e);
  process.exit(1);
});

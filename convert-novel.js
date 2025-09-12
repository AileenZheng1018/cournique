import fs from 'fs';
import path from 'path';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('用法：node convert-novel.js novels/xxx/source.txt');
  process.exit(1);
}

const novelDir = path.dirname(inputPath);
const novelName = path.basename(novelDir);
const raw = fs.readFileSync(inputPath, 'utf-8').trim();

// === 分章节 ===
const chapters = [];
let current = null;

raw.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (/^#/.test(trimmed)) {
    if (current) chapters.push(current);
    current = { title: trimmed.replace(/^#+\s*/, ''), paras: [] };
  } else if (trimmed === '') {
    if (current) current.paras.push('&nbsp;');
  } else {
    if (!current) current = { title: '正文', paras: [] };
    current.paras.push(trimmed);
  }
});
if (current) chapters.push(current);

// === 写 meta.json ===
const summary = chapters[0]?.paras?.[0]?.replace(/<[^>]+>/g, '').slice(0, 100) || '';
const meta = {
  title: novelName,
  summary: summary || '暂无简介',
  chapters: chapters.map((ch, i) => ({
    index: i + 1,
    title: ch.title
  }))
};
fs.writeFileSync(path.join(novelDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');

// === 单章节模式 ===
if (chapters.length === 1) {
  const contentHTML = `
<div class="chapter-content">
${chapters[0].paras.map(p => `  <p>${p}</p>`).join('\n')}
</div>
  `.trim();
  fs.writeFileSync(path.join(novelDir, 'content.html'), contentHTML, 'utf-8');

  const indexHTML = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>${novelName}</title>
  <link rel="stylesheet" href="/css/novels.css">
  <script src="/js/novels.js" defer></script>
</head>
<body>
  <main class="novel single">
    <h1 class="novel-title">${novelName}</h1>
    <div id="novel-content" data-src="content.html"></div>
  </main>
</body>
</html>
  `.trim();
  fs.writeFileSync(path.join(novelDir, 'index.html'), indexHTML, 'utf-8');

  console.log(`✅ 已生成单章节小说：${novelName}`);
}

// === 多章节模式 ===
else {
  chapters.forEach((ch, i) => {
    const num = String(i + 1).padStart(2, '0');
    const fileName = `chapter-${num}.html`;
    const content = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>${ch.title} - ${novelName}</title>
  <link rel="stylesheet" href="/css/novels.css">
  <script src="/js/novels.js" defer></script>
</head>
<body>
  <main class="chapter">
    <h2 class="chapter-title">${ch.title}</h2>
    <div class="chapter-content">
${ch.paras.map(p => `      <p>${p}</p>`).join('\n')}
    </div>
    <nav class="chapter-nav">
      ${i > 0 ? `<a href="chapter-${String(i).padStart(2,'0')}.html">上一章</a>` : ''}
      <a href="index.html">返回目录</a>
      ${i < chapters.length - 1 ? `<a href="chapter-${String(i+2).padStart(2,'0')}.html">下一章</a>` : ''}
    </nav>
  </main>
</body>
</html>
`.trim();
    fs.writeFileSync(path.join(novelDir, fileName), content, 'utf-8');
  });

  const indexHTML = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>${novelName}</title>
  <link rel="stylesheet" href="/css/novels.css">
  <script src="/js/novels.js" defer></script>
</head>
<body>
  <main class="novel multi">
    <h1 class="novel-title">${novelName}</h1>
    <p class="novel-summary">${summary}</p>
    <ul class="chapter-list">
${chapters.map((ch, i) => {
  const num = String(i + 1).padStart(2, '0');
  return `      <li><a href="chapter-${num}.html">${ch.title}</a></li>`;
}).join('\n')}
    </ul>
  </main>
</body>
</html>
  `.trim();
  fs.writeFileSync(path.join(novelDir, 'index.html'), indexHTML, 'utf-8');

  console.log(`✅ 已生成多章节小说：${novelName}（${chapters.length} 章）`);
}

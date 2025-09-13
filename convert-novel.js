#!/usr/bin/env node
/**
 * convert-novels.js
 * 用法：node convert-novels.js novels/banana/apple.txt
 *
 * 规则：
 * - 如果文件第一行是 "@"，则从该行到下一个仅含 "@" 的行之间的内容作为 summary。
 * - 若文本中出现任何以 "#" 开头的行，则按多章节解析；"#" 后直到换行为章节标题。
 * - 否则作为单章节：输出 index.html + content.html。
 *
 * 生成：
 * - 单章： index.html, content.html, meta.json
 * - 多章： index.html（章节目录）, chapter-01.html.., meta.json
 *
 * 依赖：无（Node 自带模块）
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 将文本块转为 <p>…</p>；空行当作段落分隔；段内换行保留 <br>
function blocksToParagraphs(text) {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n{2,}/);

  return blocks
    .map(b => b.trim())
    .filter(b => b.length > 0)
    .map(b => `<p>${escapeHtml(b).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

// 从 slug 推一个默认标题（文件夹名/文件名转首字母大写）
function titleFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\S/g, s => s.toUpperCase());
}

// 读取 summary（若第一行是 "@"，则取到下一行仅含 "@" 为止）
function extractSummaryAndBody(raw) {
  let text = raw.replace(/^\uFEFF/, ''); // 去 BOM
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  let summary = '';
  if (text.startsWith('@')) {
    const lines = text.split('\n');
    // 第一行必须是单独的 "@"
    if (lines[0].trim() === '@') {
      let endIdx = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '@') { endIdx = i; break; }
      }
      if (endIdx !== -1) {
        summary = lines.slice(1, endIdx).join('\n').trim();
        // 去掉 summary 块
        text = lines.slice(endIdx + 1).join('\n').replace(/^\n+/, '');
      }
    }
  }
  return { summary, body: text };
}

// 解析章节：出现任何以 # 开头的行即多章节
function parseChapters(body) {
  const lines = body.split('\n');
  const headers = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#(.*)$/);
    if (m) {
      const title = m[1].trim() || `第 ${headers.length + 1} 章`;
      headers.push({ line: i, title });
    }
  }
  if (headers.length === 0) {
    return null; // 单章节
  }
  // 切块
  const chapters = [];
  for (let i = 0; i < headers.length; i++) {
    const startLine = headers[i].line + 1; // 内容从标题下一行开始
    const endLine = (i + 1 < headers.length) ? headers[i + 1].line : lines.length;
    const chunk = lines.slice(startLine, endLine).join('\n').trim();
    chapters.push({ index: i + 1, title: headers[i].title, text: chunk });
  }
  return chapters;
}

// 生成公共背景区块（你提供的实验室背景 + 两个 face 区）
function backgroundBlock() {
  return `
  <div class="background-container">
    <img src="/lab_bg.jpg" class="background-img" alt="Lab Background" />
    <!-- Go -->
    <div class="face-area" style="top: 12.4%; left: 36.2%;">
      <div class="face-highlight"></div>
      <div class="face-info">
        <p>Target: Go Shijima</p>
        <p>Species: Homo Sapiens</p>
        <p>Gender: M</p>
        <p>Mood: panic stressful</p>
      </div>
    </div>
    <!-- Chase -->
    <div class="face-area" style="top: 33.2%; left: 60.4%;">
      <div class="face-highlight"></div>
      <div class="face-info">
        <p>Target: Chase</p>
        <p>Species: Roidmude</p>
        <p>Gender: N/A</p>
        <p>Mood: joy</p>
      </div>
    </div>
  </div>`;
}

// 单章节 index.html（通过 novels.js 拉取 content.html）
function renderSingleIndexHtml(title, summary) {
  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/css/guide.css">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500&display=swap" rel="stylesheet" />
  <script src="/js/novels.js" defer></script>
</head>
<body>
  ${backgroundBlock()}
  <main class="novel single">
    <h1 class="novel-title">${escapeHtml(title)}</h1>
    ${summary ? `<p class="novel-summary">${escapeHtml(summary)}</p>` : ''}
    <div id="novel-content" data-src="content.html"></div>
  </main>
  <a href="/novels" class="back-button">← 返<br>回</a>
</body>
</html>`;
}

// 单章节 content.html（仅段落，不含 <html> 头尾）
function renderSingleContentHtml(bodyText) {
  return blocksToParagraphs(bodyText);
}

// 多章节 index.html（目录 + 悬停预览所需的片段）
function renderMultiIndexHtml(title, summary, chapters) {
  const items = chapters.map(ch => {
    const preview = (ch.text || '')
      .replace(/\s+/g, ' ')
      .slice(0, 120)
      .trim();
    const num = String(ch.index).padStart(2, '0');
    const href = `chapter-${num}.html`;

    return `
      <li>
        <a href="${href}">
          <span class="title">${escapeHtml(num)}</span>
          <span class="preview" aria-hidden="true">${escapeHtml(preview)}…</span>
        </a>
      </li>
    `;
  }).join('\n');


  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/css/guide.css">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body>
  ${backgroundBlock()}
  <main class="novel multi">
    <h1 class="novel-title">${escapeHtml(title)}</h1>
    ${summary ? `<p class="novel-summary">${escapeHtml(summary)}</p>` : ''}
    <ul class="chapter-list">
      ${items}
    </ul>
  </main>
  <a href="/novels" class="back-button">← 返<br>回</a>
</body>
</html>`;
}

// 多章节 chapter-xx.html（纯静态，无 JS）
function renderChapterHtml(novelTitle, chapterIndex, chapterTitle, text, totalChapters) {
  const prev = chapterIndex > 1
    ? `<a class="chapter-nav prev" href="chapter-${String(chapterIndex - 1).padStart(2, '0')}.html">← 上一章</a>`
    : '';
  const next = chapterIndex < totalChapters
    ? `<a class="chapter-nav next" href="chapter-${String(chapterIndex + 1).padStart(2, '0')}.html">下一章 →</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(novelTitle)} - ${escapeHtml(chapterTitle)}</title>
  <link rel="stylesheet" href="/css/content.css">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body>
  ${backgroundBlock()}
  <main class="novel single">
    <h1 class="novel-title">${escapeHtml(novelTitle)} · ${escapeHtml(chapterTitle)}</h1>
    <div id="novel-content">
      ${blocksToParagraphs(text)}
    </div>

    <div class="chapter-nav-bar">
      ${prev}
      <a class="chapter-nav index" href="./">返回目录</a>
      ${next}
    </div>
  </main>
</body>
</html>`;
}

// meta.json
function renderMetaJson(title, summary, chapters) {
  if (!chapters) {
    return JSON.stringify({
      title,
      summary,
      chapters: [{ index: 1, title: '正文' }]
    }, null, 2);
  }
  return JSON.stringify({
    title,
    summary,
    chapters: chapters.map(ch => ({ index: ch.index, title: ch.title }))
  }, null, 2);
}

// ---- 主流程 ----
(async function main() {
  try {
    const inputPath = process.argv[2];
    if (!inputPath) {
      console.error('用法：node convert-novels.js <path/to/novel.txt>');
      process.exit(1);
    }

    const absTxt = path.resolve(inputPath);
    const outDir = path.dirname(absTxt); // 输出到 txt 所在文件夹
    const slug = path.basename(outDir);
    const defaultTitle = titleFromSlug(slug);

    const raw = await fsp.readFile(absTxt, 'utf8');

    const { summary, body } = extractSummaryAndBody(raw);
    const chapters = parseChapters(body);

    await fsp.mkdir(outDir, { recursive: true });

    if (!chapters) {
      // 单章节
      const idxHtml = renderSingleIndexHtml(defaultTitle, summary);
      const contentHtml = renderSingleContentHtml(body);
      const meta = renderMetaJson(defaultTitle, summary, null);

      await Promise.all([
        fsp.writeFile(path.join(outDir, 'index.html'), idxHtml, 'utf8'),
        fsp.writeFile(path.join(outDir, 'content.html'), contentHtml, 'utf8'),
        fsp.writeFile(path.join(outDir, 'meta.json'), meta, 'utf8'),
      ]);

      console.log('生成完成：单章节');
      console.log(' -', path.join(outDir, 'index.html'));
      console.log(' -', path.join(outDir, 'content.html'));
      console.log(' -', path.join(outDir, 'meta.json'));
    } else {
      // 多章节
      const idxHtml = renderMultiIndexHtml(defaultTitle, summary, chapters);
      const meta = renderMetaJson(defaultTitle, summary, chapters);

      await fsp.writeFile(path.join(outDir, 'index.html'), idxHtml, 'utf8');
      await fsp.writeFile(path.join(outDir, 'meta.json'), meta, 'utf8');

      for (const ch of chapters) {
      const fname = `chapter-${String(ch.index).padStart(2, '0')}.html`;
      const html = renderChapterHtml(defaultTitle, ch.index, ch.title, ch.text, chapters.length);
      await fsp.writeFile(path.join(outDir, fname), html, 'utf8');
      }


      console.log(`生成完成：多章节（${chapters.length} 章）`);
      console.log(' -', path.join(outDir, 'index.html'));
      console.log(' -', path.join(outDir, 'meta.json'));
    }
  } catch (err) {
    console.error('转换失败：', err);
    process.exit(1);
  }
})();


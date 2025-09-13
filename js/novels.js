document.addEventListener('DOMContentLoaded', () => {
  const contentContainer = document.getElementById('novel-content');
  if (!contentContainer) return;

  const novelFolder = window.location.pathname.replace(/\/index\.html$/, '');
  const metaUrl = `${novelFolder}/meta.json`;

  fetch(metaUrl)
    .then(res => res.json())
    .then(meta => {
      // 更新页面标题
      const titleEl = document.querySelector('.novel-title');
      if (titleEl) titleEl.textContent = meta.title || '未命名小说';

      // 章节判断
      if (!meta.chapters || meta.chapters.length === 0) {
        contentContainer.textContent = '⚠ meta.json 中未定义章节';
        return;
      }

      if (meta.chapters.length === 1) {
        // 单章节 → content.html
        loadSingleChapter(contentContainer, `${novelFolder}/content.html`);
      } else {
        // 多章节 → 章节列表
        loadMultiChapters(contentContainer, novelFolder, meta.chapters);
      }
    })
    .catch(err => {
      console.error('无法加载 meta.json：', err);
      contentContainer.textContent = '⚠ 无法加载小说信息';
    });
});

function loadSingleChapter(container, contentUrl) {
  fetch(contentUrl)
    .then(res => res.text())
    .then(html => {
      container.innerHTML = html;
    })
    .catch(err => {
      console.error('加载 content.html 失败：', err);
      container.textContent = '⚠ 加载小说内容失败';
    });
}

function loadMultiChapters(container, folder, chapters) {
  const list = document.createElement('ul');
  list.className = 'chapter-list';

  chapters.forEach(ch => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    const index = String(ch.index).padStart(2, '0');
    link.href = `${folder}/chapter-${index}.html`;
    link.textContent = ch.title || `第 ${ch.index} 章`;
    li.appendChild(link);
    list.appendChild(li);
  });

  container.appendChild(list);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.back-button');
  if (btn) {
    btn.addEventListener('click', () => {
      if (document.referrer && document.referrer !== location.href) {
        history.back();
      } else {
        // 没有来源页：如果在 chapter-xx 页面就回到目录 ./ ，否则回 /novels
        if (location.pathname.match(/chapter-\d+\.html$/)) {
          location.href = './';
        } else {
          location.href = '/novels';
        }
      }
    });
  }
});

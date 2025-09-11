const fs = require('fs');
const path = require('path');

// 要处理的 HTML 文件
const targetHtml = path.join(__dirname, 'works.html'); // 改成你的文件名
let html = fs.readFileSync(targetHtml, 'utf-8');

// ✅ 只处理 <img src="gallery/xxx/filename.EXT"> 部分，替换为 thumbs 路径
html = html.replace(
  /<img\s+([^>]*?)src="gallery\/([^\/]+)\/([^"]+?)\.(png|jpg|jpeg|webp)"([^>]*)>/gi,
  (match, before, folder, filename, ext, after) => {
    const thumbPath = `gallery/thumbs/${filename}.jpg`;
    return `<img ${before}src="${thumbPath}"${after}>`;
  }
);

// ❌ 不再处理 data-images 的 JSON 内容（保持原图路径）

fs.writeFileSync(targetHtml, html, 'utf-8');
console.log(`✅ 已仅替换 <img src> 部分为缩略图路径：${targetHtml}`);


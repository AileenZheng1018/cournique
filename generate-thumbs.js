// generate-thumbs.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourceDirs = ['gallery/ghost', 'gallery/other'];
const outputDir = 'gallery/thumbs';
const MAX_WIDTH = 400; // 缩略图宽度上限，可根据需要调整

// 创建输出目录（如果不存在）
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function isImageFile(file) {
  return /\.(jpe?g|png|webp)$/i.test(file);
}

function generateThumbnail(inputPath, outputPath) {
  return sharp(inputPath)
    .resize({ width: MAX_WIDTH })
    .toFile(outputPath)
    .then(() => console.log(`✅ 缩略图生成成功：${outputPath}`))
    .catch(err => console.error(`❌ 生成失败: ${outputPath}`, err));
}

async function processAll() {
  for (const dir of sourceDirs) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const inputPath = path.join(dir, file);
      if (!isImageFile(file)) continue;

      const ext = path.extname(file);
      const base = path.basename(file, ext);
      const outputPath = path.join(outputDir, `${base}.jpg`);

      // 避免重复生成
      if (fs.existsSync(outputPath)) {
        console.log(`⏭ 已存在跳过：${outputPath}`);
        continue;
      }

      await generateThumbnail(inputPath, outputPath);
    }
  }

  console.log('\n🎉 所有缩略图处理完毕！');
}

processAll();

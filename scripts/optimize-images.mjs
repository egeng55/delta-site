/**
 * Image Optimization Script
 * Compresses JPG/PNG images and creates WebP versions
 * Run with: node scripts/optimize-images.mjs
 */

import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';

const QUALITY = 80; // JPEG/WebP quality (80 is good balance)
const MAX_WIDTH = 1920; // Max width for hero images

async function getFiles(dir) {
  const files = [];
  const items = await readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...await getFiles(fullPath));
    } else if (/\.(jpg|jpeg|png)$/i.test(item.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function optimizeImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const stats = await stat(filePath);
  const originalSize = stats.size;

  // Skip small files (under 100KB)
  if (originalSize < 100 * 1024) {
    console.log(`⏭️  Skipping ${basename(filePath)} (already small: ${(originalSize / 1024).toFixed(0)}KB)`);
    return { skipped: true };
  }

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Resize if wider than MAX_WIDTH
    let pipeline = image;
    if (metadata.width && metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
    }

    // Optimize based on format
    if (ext === '.png') {
      await pipeline
        .png({ quality: QUALITY, compressionLevel: 9 })
        .toFile(filePath + '.tmp');
    } else {
      await pipeline
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(filePath + '.tmp');
    }

    // Check new size
    const newStats = await stat(filePath + '.tmp');
    const newSize = newStats.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    // Only replace if smaller
    if (newSize < originalSize) {
      const { rename, unlink } = await import('fs/promises');
      await unlink(filePath);
      await rename(filePath + '.tmp', filePath);
      console.log(`✅ ${basename(filePath)}: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(newSize / 1024 / 1024).toFixed(1)}MB (${savings}% smaller)`);
      return { originalSize, newSize, savings: originalSize - newSize };
    } else {
      const { unlink } = await import('fs/promises');
      await unlink(filePath + '.tmp');
      console.log(`⏭️  ${basename(filePath)}: Already optimized`);
      return { skipped: true };
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return { error: true };
  }
}

async function main() {
  console.log('🖼️  Starting image optimization...\n');

  const imagesDir = join(process.cwd(), 'public/images');
  const files = await getFiles(imagesDir);

  console.log(`Found ${files.length} images to process\n`);

  let totalOriginal = 0;
  let totalNew = 0;
  let optimized = 0;

  for (const file of files) {
    const result = await optimizeImage(file);
    if (result.savings) {
      totalOriginal += result.originalSize;
      totalNew += result.newSize;
      optimized++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Optimized: ${optimized} images`);
  if (totalOriginal > 0) {
    console.log(`   Total saved: ${((totalOriginal - totalNew) / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   Reduction: ${((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1)}%`);
  }
}

main().catch(console.error);

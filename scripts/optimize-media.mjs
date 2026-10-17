import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('public/media', { recursive: true });
const results = [];
for (const key of ['a', 'b', 'c', 'd', 'e', 'f']) {
  for (const width of [640, 1280]) {
    const output = `public/media/photo-${key}-${width}.webp`;
    const result = await sharp(`images/${key}.jpg`)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 75, effort: 5 })
      .toFile(output);
    results.push({
      source: `images/${key}.jpg`,
      output,
      bytes: result.size,
      width: result.width,
      height: result.height,
    });
  }
}
const card = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#fafafa"/><path d="M100 100h1000M100 530h1000" stroke="#ddd"/><rect x="860" y="235" width="130" height="170" rx="5" fill="white" stroke="#333"/><path d="M885 235v170M903 260h65M903 380h65" stroke="#ccc"/><text x="110" y="290" font-family="sans-serif" font-weight="300" font-size="72" letter-spacing="10" fill="#171717">MONTUNAR</text><text x="115" y="350" font-family="sans-serif" font-size="23" letter-spacing="4" fill="#777">THINKING · EXPLORING · LIVING</text></svg>`;
await sharp(Buffer.from(card)).png().toFile('public/media/social-card.png');
await writeFile('docs/optimized-photos.json', JSON.stringify(results, null, 2) + '\n');
console.log(`Generated ${results.length} responsive photographs and a social image.`);

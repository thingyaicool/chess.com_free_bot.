/**
 * Generates valid PNG icons for the Chrome extension.
 * Uses pure Node.js with zlib for proper PNG encoding.
 */
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { resolve } = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const typeBytes = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcData = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function createIcon(size) {
  // PNG Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // Image data - chess knight on dark background
  const raw = [];
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;

  for (let y = 0; y < size; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Rounded square background
      const margin = size * 0.08;
      const cornerR = size * 0.2;
      const inBg = (
        x >= margin && x < size - margin &&
        y >= margin && y < size - margin
      );

      // Knight silhouette (simplified geometric shape)
      const nx = (x - cx) / r;
      const ny = (y - cy) / r;
      
      // Knight shape: head + neck + base
      const headCircle = (nx * nx + (ny + 0.3) * (ny + 0.3)) < 0.35;
      const earTriangle = (nx > -0.1 && nx < 0.3 && ny < -0.4 && ny > -0.8 && nx > ny + 0.5);
      const neckRect = (nx > -0.2 && nx < 0.15 && ny > 0.0 && ny < 0.5);
      const baseRect = (nx > -0.4 && nx < 0.4 && ny > 0.4 && ny < 0.7);
      
      const isKnight = inBg && (headCircle || earTriangle || neckRect || baseRect);

      if (isKnight) {
        // Emerald green knight
        raw.push(74, 222, 128, 255); // RGBA
      } else if (inBg) {
        // Dark navy background with subtle gradient
        const grad = 1 - (dist / (size * 0.7));
        const bg = Math.max(0, Math.min(255, Math.round(26 + grad * 12)));
        raw.push(bg, bg, Math.round(bg * 1.6), 255);
      } else {
        // Transparent outside
        raw.push(0, 0, 0, 0);
      }
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(raw));
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Generate icons
const iconsDir = resolve(__dirname, '..', 'extension', 'icons');
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

for (const size of [16, 48, 128]) {
  const png = createIcon(size);
  const path = resolve(iconsDir, `icon${size}.png`);
  writeFileSync(path, png);
  console.log(`✅ Generated icon${size}.png (${png.length} bytes)`);
}

console.log('\n✅ All icons generated successfully');

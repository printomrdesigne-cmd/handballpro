import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width: number, height: number, drawPixel: (x: number, y: number) => [number, number, number, number]): Buffer {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data with row filter 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

// Ensure public directory
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// SVG Handball Logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="50%" stop-color="#1d4ed8" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="ballGrad" x1="20%" y1="20%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Stadium court lines -->
  <circle cx="256" cy="256" r="210" fill="none" stroke="#ffffff" stroke-width="6" stroke-opacity="0.12" />
  <line x1="256" y1="46" x2="256" y2="466" stroke="#ffffff" stroke-width="4" stroke-opacity="0.08" stroke-dasharray="12 12" />
  <circle cx="256" cy="256" r="140" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity="0.15" />

  <!-- Handball Ball Graphic -->
  <g filter="url(#glow)">
    <circle cx="256" cy="240" r="115" fill="url(#ballGrad)" />
    <!-- Ball texture seams -->
    <path d="M 180 180 Q 256 220 332 180" fill="none" stroke="#78350f" stroke-width="5" stroke-linecap="round" />
    <path d="M 160 250 Q 256 270 352 250" fill="none" stroke="#78350f" stroke-width="5" stroke-linecap="round" />
    <path d="M 190 310 Q 256 300 322 310" fill="none" stroke="#78350f" stroke-width="5" stroke-linecap="round" />
    <path d="M 256 125 Q 240 240 256 355" fill="none" stroke="#78350f" stroke-width="5" stroke-linecap="round" />
    <path d="M 190 150 Q 200 240 180 320" fill="none" stroke="#78350f" stroke-width="4" stroke-linecap="round" />
    <path d="M 322 150 Q 312 240 332 320" fill="none" stroke="#78350f" stroke-width="4" stroke-linecap="round" />
    
    <!-- Ball highlight -->
    <ellipse cx="220" cy="180" rx="35" ry="20" fill="#ffffff" fill-opacity="0.3" transform="rotate(-30 220 180)" />
  </g>

  <!-- Pro Badge Banner -->
  <g filter="url(#glow)">
    <rect x="126" y="380" width="260" height="58" rx="29" fill="#10b981" />
    <text x="256" y="420" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="4">HANDBALL PRO</text>
  </g>

  <!-- Stars -->
  <polygon points="256,70 262,88 281,88 266,99 271,117 256,106 241,117 246,99 231,88 250,88" fill="#fbbf24" />
  <polygon points="210,85 214,97 227,97 217,105 220,117 210,109 200,117 203,105 193,97 206,97" fill="#fbbf24" opacity="0.8" />
  <polygon points="302,85 306,97 319,97 309,105 312,117 302,109 292,117 295,105 285,97 298,97" fill="#fbbf24" opacity="0.8" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

// Function to draw pixel for PWA icon
function createIconPixelRenderer(isMaskable: boolean) {
  return function(size: number) {
    return function(x: number, y: number): [number, number, number, number] {
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background rounded rect corner check for standard icon
      if (!isMaskable) {
        const radius = size * 0.22;
        const innerX = Math.max(0, Math.abs(dx) - (cx - radius));
        const innerY = Math.max(0, Math.abs(dy) - (cy - radius));
        if (innerX * innerX + innerY * innerY > radius * radius) {
          return [0, 0, 0, 0]; // transparent outside squircle
        }
      }

      // Background gradient: #1e3a8a (30, 58, 138) to #0f172a (15, 23, 42)
      const gradT = (x + y) / (size * 2);
      let bgR = Math.round(30 * (1 - gradT) + 15 * gradT);
      let bgG = Math.round(58 * (1 - gradT) + 23 * gradT);
      let bgB = Math.round(138 * (1 - gradT) + 42 * gradT);

      // Outer court ring
      const courtRadius = size * (isMaskable ? 0.35 : 0.40);
      if (Math.abs(dist - courtRadius) < size * 0.012) {
        return [255, 255, 255, 120];
      }

      // Center Handball ball
      const ballCenterY = isMaskable ? cy - size * 0.04 : cy - size * 0.03;
      const ballDx = x - cx;
      const ballDy = y - ballCenterY;
      const ballDist = Math.sqrt(ballDx * ballDx + ballDy * ballDy);
      const ballRadius = size * (isMaskable ? 0.22 : 0.25);

      if (ballDist < ballRadius) {
        // Ball shading (Amber / Gold: 245, 158, 11 to 217, 119, 6)
        const ballT = (ballDx + ballDy) / (ballRadius * 2);
        let bR = Math.round(251 - 34 * (ballT + 0.5));
        let bG = Math.round(191 - 72 * (ballT + 0.5));
        let bB = Math.round(36 - 30 * (ballT + 0.5));
        bR = Math.max(180, Math.min(255, bR));
        bG = Math.max(110, Math.min(200, bG));
        bB = Math.max(6, Math.min(60, bB));

        // Ball seam curves
        const normY = ballDy / ballRadius;
        const normX = ballDx / ballRadius;
        const seam1 = Math.abs(normY - 0.5 * (1 - normX * normX));
        const seam2 = Math.abs(normY + 0.5 * (1 - normX * normX));
        const seamVert = Math.abs(normX);

        if (seam1 < 0.06 || seam2 < 0.06 || seamVert < 0.05) {
          return [120, 53, 15, 255]; // Dark seam brown
        }

        // Highlight spot
        const hlDx = ballDx + ballRadius * 0.35;
        const hlDy = ballDy + ballRadius * 0.35;
        if (Math.sqrt(hlDx * hlDx + hlDy * hlDy) < ballRadius * 0.35) {
          bR = Math.min(255, bR + 60);
          bG = Math.min(255, bG + 60);
          bB = Math.min(255, bB + 60);
        }

        return [bR, bG, bB, 255];
      }

      // Green "PRO" bar below ball
      const barY = isMaskable ? cy + size * 0.24 : cy + size * 0.27;
      const barHalfW = size * (isMaskable ? 0.24 : 0.28);
      const barHalfH = size * 0.06;

      if (Math.abs(x - cx) < barHalfW && Math.abs(y - barY) < barHalfH) {
        // Green banner #10b981 (16, 185, 129)
        return [16, 185, 129, 255];
      }

      return [bgR, bgG, bgB, 255];
    };
  };
}

// Generate Icons
console.log('Generating PNG icons...');

// 1. 192x192
const png192 = createPng(192, 192, createIconPixelRenderer(false)(192));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// 2. 512x512
const png512 = createPng(512, 512, createIconPixelRenderer(false)(512));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// 3. Maskable 512x512 (with safe-zone margins)
const pngMaskable512 = createPng(512, 512, createIconPixelRenderer(true)(512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable512);

// 4. Apple Touch Icon 180x180
const png180 = createPng(180, 180, createIconPixelRenderer(false)(180));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);

// 5. Favicon 64x64 as png/ico
const png64 = createPng(64, 64, createIconPixelRenderer(false)(64));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png64);

console.log('All icons generated successfully in /public!');

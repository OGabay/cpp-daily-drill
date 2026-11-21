#!/usr/bin/env node
// Generates the extension's PNG icons (16/48/128) with zero dependencies:
// a white rounded square with a brown "C" (same brown as the plus outlines) and two "+" signs filled with a
// white/brown checkerboard (brown outline), drawn geometrically, rasterised with
// 4x4 supersampling and encoded as PNG via node:zlib.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');
const SIZES = [16, 48, 128];
const SS = 4; // supersampling factor per axis

const BG = [0xff, 0xff, 0xff]; // white tile
const BORDER = [0xe2, 0xd3, 0xbf]; // soft warm rim so the white tile reads on light toolbars
const C_COLOR = [0x9c, 0x4a, 0x1a]; // "C" uses the same brown as the ++ outline
const BROWN = [0x9c, 0x4a, 0x1a]; // checker squares + plus outline
const WHITE = [0xff, 0xff, 0xff];

// ---------- geometry (all in unit coordinates 0..1) ----------
function insideRoundedRect(x, y, r) {
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function insidePlus(x, y, cx, cy, half, thick) {
  const ax = Math.abs(x - cx);
  const ay = Math.abs(y - cy);
  return (ax <= half && ay <= thick / 2) || (ay <= half && ax <= thick / 2);
}

/** Returns 'C' | 'outline' | 'fill' | null for a unit-space sample point. */
function glyphs(size) {
  const bold = size <= 16 ? 1.3 : 1.0;
  const ring = { cx: 0.265, cy: 0.5, rOuter: 0.205, thick: 0.08 * bold, gapDeg: 48 };
  const plusHalf = 0.11;
  const plusThick = 0.094 * bold;
  // outline width: ~1.6px at 128, ~1px at 48
  const outline = Math.max(1 / size, 0.0125);
  const pluses = [0.585, 0.845].map((cx) => ({ cx, cy: 0.5 }));
  return (x, y) => {
    const dx = x - ring.cx;
    const dy = y - ring.cy;
    const d = Math.hypot(dx, dy);
    if (d <= ring.rOuter && d >= ring.rOuter - ring.thick) {
      const ang = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
      if (ang >= ring.gapDeg) return 'C';
      const capR = ring.thick / 2;
      const mid = ring.rOuter - capR;
      for (const s of [-1, 1]) {
        const a = (s * ring.gapDeg * Math.PI) / 180;
        if (Math.hypot(x - (ring.cx + mid * Math.cos(a)), y - (ring.cy + mid * Math.sin(a))) <= capR) return 'C';
      }
    }
    for (const p of pluses) {
      if (!insidePlus(x, y, p.cx, p.cy, plusHalf, plusThick)) continue;
      if (size <= 16) return 'outline'; // too small for a checker: solid brown
      return insidePlus(x, y, p.cx, p.cy, plusHalf - outline, plusThick - 2 * outline) ? 'fill' : 'outline';
    }
    return null;
  };
}

function render(size) {
  const px = new Uint8Array(size * size * 4);
  const inGlyph = glyphs(size);
  const radius = 0.23;
  const rimWidth = size >= 48 ? 0.02 : 0.045;
  // checker cell size in *pixels* so squares stay crisp
  const cell = Math.max(2, Math.round(size / 42));
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let cover = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sj = 0; sj < SS; sj++) {
        for (let si = 0; si < SS; si++) {
          const x = (i + (si + 0.5) / SS) / size;
          const y = (j + (sj + 0.5) / SS) / size;
          if (!insideRoundedRect(x, y, radius)) continue;
          cover++;
          const hit = inGlyph(x, y);
          let c;
          if (hit === 'C') c = C_COLOR;
          else if (hit === 'outline') c = BROWN;
          else if (hit === 'fill') {
            const cxCell = Math.floor((x * size) / cell);
            const cyCell = Math.floor((y * size) / cell);
            c = (cxCell + cyCell) % 2 === 0 ? BROWN : WHITE;
          } else if (!insideRoundedRect((x - rimWidth) / (1 - 2 * rimWidth), (y - rimWidth) / (1 - 2 * rimWidth), radius)) c = BORDER;
          else c = BG;
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const o = (j * size + i) * 4;
      if (cover) {
        px[o] = Math.round(r / cover);
        px[o + 1] = Math.round(g / cover);
        px[o + 2] = Math.round(b / cover);
        px[o + 3] = Math.round((cover / (SS * SS)) * 255);
      }
    }
  }
  return px;
}

// ---------- minimal PNG encoder ----------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const file = resolve(OUT_DIR, `icon${size}.png`);
  writeFileSync(file, encodePng(size, render(size)));
  console.log(`icons: wrote ${file}`);
}

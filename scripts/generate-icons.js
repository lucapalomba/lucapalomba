#!/usr/bin/env node
'use strict';

/**
 * generate-icons.js
 *
 * Regenerates the PWA / favicon PNGs from the 460x460 brain artwork.
 *
 * Zero dependencies: PNG decode/encode is done with Node's built-in `zlib`
 * plus a hand-rolled CRC32 over the chunk layout.
 *
 * The source artwork is a flattened RGB (no alpha) render of a pink brain
 * sitting on the classic "transparency" checkerboard. This script keys that
 * checkerboard out, crops to the artwork, and re-emits the icon set.
 *
 * Usage:
 *   node scripts/generate-icons.js [path/to/master.png]
 *
 * The master is a 460x460, 8-bit, colour-type-2 (RGB) PNG. If no path is
 * given, the script looks for `scripts/icon-source.png` first and falls back to
 * `images/favicon-32.png` while that file is still the pristine 460x460
 * master. Once a master is read from anywhere other than
 * `scripts/icon-source.png`, its bytes are copied there so that later runs stay
 * argument-free and reproducible after `images/favicon-32.png` has been
 * overwritten with the 32x32 output.
 *
 * The master lives under `scripts/` rather than `images/` because `scripts/` is
 * excluded from the Jekyll build: a master kept in `images/` would be published
 * to the site and downloaded by nobody.
 *
 * The script is idempotent and deterministic: no timestamps, no randomness,
 * fixed zlib settings, so two consecutive runs produce byte-identical files.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');
const SOURCE_MASTER = path.join(__dirname, 'icon-source.png');
const LEGACY_MASTER = path.join(IMAGES_DIR, 'favicon-32.png');

const MASTER_W = 460;
const MASTER_H = 460;

/** Distance the artwork keeps from the canvas edge, per side, for plain icons. */
const ICON_MARGIN = 0.06;
/** Fraction of the maskable canvas the artwork is inscribed in (safe zone = 80%). */
const MASKABLE_FIT = 0.8;
/** Radius of the maskable safe zone as a fraction of the canvas (80% diameter). */
const SAFE_ZONE_RADIUS = 0.4;
/** Keep the silhouette just inside the safe circle so a round mask never clips it. */
const SAFE_ZONE_SLACK = 0.98;
/** Opaque backdrop for the maskable icon (must match manifest background_color). */
const MASKABLE_BG = [0x0a, 0x0a, 0x0f];

const COLOR_TYPE_RGB = 2;
const COLOR_TYPE_RGBA = 6;
const CHANNELS = { [COLOR_TYPE_RGB]: 3, [COLOR_TYPE_RGBA]: 4 };

const OUTPUTS = [
  { file: 'icon-192.png', size: 192, alpha: true },
  { file: 'icon-512.png', size: 512, alpha: true },
  { file: 'icon-maskable-512.png', size: 512, alpha: false },
  { file: 'favicon-32.png', size: 32, alpha: true },
];

// ---------------------------------------------------------------------------
// CRC32 (PNG chunk checksum) - written by hand, no dependencies
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// ---------------------------------------------------------------------------
// PNG decoding
// ---------------------------------------------------------------------------

function readPng(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${file}: not a PNG file`);
  }

  let offset = 8;
  let header = null;
  const idat = [];

  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('latin1', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        compression: data[10],
        filterMethod: data[11],
        interlace: data[12],
      };
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(data));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  if (!header) throw new Error(`${file}: missing IHDR chunk`);
  if (header.bitDepth !== 8) throw new Error(`${file}: only 8-bit depth is supported`);
  if (header.interlace !== 0) throw new Error(`${file}: interlaced PNGs are not supported`);

  const channels = CHANNELS[header.colorType];
  if (!channels) throw new Error(`${file}: unsupported colour type ${header.colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width, height } = header;
  const stride = width * channels;
  const expected = (stride + 1) * height;
  if (raw.length !== expected) {
    throw new Error(`${file}: expected ${expected} inflated bytes, got ${raw.length}`);
  }

  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filterType = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let value = line[x];
      switch (filterType) {
        case 0:
          break;
        case 1:
          value = (value + a) & 0xff;
          break;
        case 2:
          value = (value + b) & 0xff;
          break;
        case 3:
          value = (value + ((a + b) >> 1)) & 0xff;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          value = (value + pr) & 0xff;
          break;
        }
        default:
          throw new Error(`${file}: unknown scanline filter ${filterType}`);
      }
      cur[x] = value;
    }
  }

  return { ...header, channels, pixels };
}

// ---------------------------------------------------------------------------
// PNG encoding (adaptive filtering + hand-rolled chunks)
// ---------------------------------------------------------------------------

function filterLine(type, cur, prev, bpp, out) {
  const n = cur.length;
  for (let x = 0; x < n; x++) {
    const a = x >= bpp ? cur[x - bpp] : 0;
    const b = prev ? prev[x] : 0;
    const c = prev && x >= bpp ? prev[x - bpp] : 0;
    let value;
    switch (type) {
      case 0:
        value = cur[x];
        break;
      case 1:
        value = cur[x] - a;
        break;
      case 2:
        value = cur[x] - b;
        break;
      case 3:
        value = cur[x] - ((a + b) >> 1);
        break;
      default: {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value = cur[x] - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
        break;
      }
    }
    out[x] = value & 0xff;
  }
}

function filterCost(line) {
  let sum = 0;
  for (let i = 0; i < line.length; i++) {
    const v = line[i];
    sum += v < 128 ? v : 256 - v;
  }
  return sum;
}

function writePng(width, height, channels, pixels) {
  const colorType = channels === 4 ? COLOR_TYPE_RGBA : COLOR_TYPE_RGB;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  const candidate = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const cur = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;

    let bestType = 0;
    let bestCost = Infinity;
    // Lowest filter type wins ties, which keeps the choice deterministic.
    for (let type = 0; type <= 4; type++) {
      filterLine(type, cur, prev, channels, candidate);
      const cost = filterCost(candidate);
      if (cost < bestCost) {
        bestCost = cost;
        bestType = type;
      }
    }

    raw[y * (stride + 1)] = bestType;
    filterLine(bestType, cur, prev, channels, candidate);
    candidate.copy(raw, y * (stride + 1) + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colorType;
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // non-interlaced

  const chunks = [
    PNG_SIGNATURE,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    makeChunk('IEND', Buffer.alloc(0)),
  ];
  return Buffer.concat(chunks);
}

function makeChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  data.copy(out, 8);
  const crcInput = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  out.writeUInt32BE(crc32(crcInput), 8 + data.length);
  return out;
}

// ---------------------------------------------------------------------------
// Checkerboard keying
// ---------------------------------------------------------------------------

/**
 * The checkerboard has exactly two tones, both light and desaturated
 * (measured: ~247-250 and ~219-223, channel spread 0-3). "Confident artwork"
 * is the opposite: saturated (the pink) or dark (the navy cut-out and its
 * outline), both of which the checkerboard never is.
 */
function isStrictBackground(r, g, b) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min > 210 && max - min < 16;
}

/**
 * Artwork that is beyond doubt: the pink body (saturated) or the dark navy /
 * outline (dark). Deliberately permissive so that antialiased edge pixels are
 * *not* considered confident artwork.
 */
function isConfidentArtwork(r, g, b) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return max - min >= 40 || min <= 180;
}

function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

/**
 * Builds the RGBA artwork layer:
 *   1. classify strict background + confident artwork,
 *   2. despeckle lone non-background pixels (the checkerboard carries a little
 *      compression noise that straddles any fixed threshold),
 *   3. flood fill from the border so only the *outer* background counts -
 *      this is what keeps light, low-saturation pixels inside the silhouette
 *      opaque instead of keying holes in the artwork,
 *   4. give the 1px ring around the outer background a soft coverage alpha
 *      estimated from the pixel's distance to the local background tone,
 *      normalised by the local artwork contrast,
 *   5. un-blend the colour of those edge pixels so no grey fringe survives.
 */
function buildLayer(img) {
  const { width: w, height: h, pixels } = img;
  const n = w * h;
  const at = (x, y) => (y * w + x) * 3;

  const strict = new Uint8Array(n);
  const confident = new Uint8Array(n);
  const bgTones = new Map();
  const fgTones = new Map();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const p = at(x, y);
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];
      if (isStrictBackground(r, g, b)) {
        strict[i] = 1;
        const key = `${r},${g},${b}`;
        bgTones.set(key, (bgTones.get(key) || 0) + 1);
      } else {
        if (isConfidentArtwork(r, g, b)) confident[i] = 1;
        const key = `${r >> 4},${g >> 4},${b >> 4}`;
        fgTones.set(key, (fgTones.get(key) || 0) + 1);
      }
    }
  }

  // --- 2. despeckle: absorb isolated light noise pixels into the background ---
  const bgMask = Uint8Array.from(strict);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (bgMask[i] || confident[i]) continue;
      let neighbours = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (strict[(y + dy) * w + (x + dx)]) neighbours++;
        }
      }
      if (neighbours >= 6) bgMask[i] = 1;
    }
  }

  // --- 3. flood fill the outer background from the border ---
  const outer = new Uint8Array(n);
  const stack = [];
  const push = (x, y) => {
    const i = y * w + x;
    if (!outer[i] && bgMask[i]) {
      outer[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }

  // --- background tone lookup (nearest outer-background pixel, for un-blending) ---
  const bgMean = (() => {
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!outer[y * w + x]) continue;
        const p = at(x, y);
        r += pixels[p];
        g += pixels[p + 1];
        b += pixels[p + 2];
        count++;
      }
    }
    return count ? [r / count, g / count, b / count] : [248, 248, 248];
  })();

  function nearestBackground(x, y) {
    for (let radius = 1; radius <= 4; radius++) {
      let best = null;
      let bestDist = Infinity;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (!outer[ny * w + nx]) continue;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            bestDist = dist;
            best = [nx, ny];
          }
        }
      }
      if (best) {
        const p = at(best[0], best[1]);
        return [pixels[p], pixels[p + 1], pixels[p + 2]];
      }
    }
    return bgMean;
  }

  /** Average colour of confident artwork near (x,y) - reference contrast. */
  function localArtwork(x, y) {
    const collect = (requireInterior) => {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const i = ny * w + nx;
          if (!confident[i]) continue;
          if (requireInterior && ring[i]) continue;
          const p = at(nx, ny);
          r += pixels[p];
          g += pixels[p + 1];
          b += pixels[p + 2];
          count++;
        }
      }
      return count ? [r / count, g / count, b / count] : null;
    };
    return collect(true) || collect(false) || null;
  }

  // --- 4./5. soft alpha ramp on the ring, plus colour un-blending ---
  const alpha = new Float32Array(n);
  const colour = new Float32Array(n * 3);

  // ring = pixels just outside the outer background
  const ring = new Uint8Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (outer[i]) continue;
      let touches = false;
      for (let dy = -1; dy <= 1 && !touches; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (outer[ny * w + nx]) {
            touches = true;
            break;
          }
        }
      }
      if (touches) ring[i] = 1;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const p = at(x, y);
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];

      if (outer[i]) {
        // Fully transparent. Zeroing the colour is a no-op for the encoded
        // bytes (premultiplication erases it anyway), but it keeps the intent
        // explicit: no checkerboard grey is carried into the layer.
        alpha[i] = 0;
        colour[i * 3] = 0;
        colour[i * 3 + 1] = 0;
        colour[i * 3 + 2] = 0;
        continue;
      }

      if (!ring[i]) {
        // Interior: fully opaque, colours untouched. This is what protects the
        // light pink fluff and the dark navy cut-out from being keyed away.
        alpha[i] = 1;
        colour[i * 3] = r;
        colour[i * 3 + 1] = g;
        colour[i * 3 + 2] = b;
        continue;
      }

      // Edge pixel: it is (approximately) a blend of artwork and the local
      // checkerboard tone, so coverage ~= distance-to-bg / artwork-contrast.
      const bg = nearestBackground(x, y);
      const art = localArtwork(x, y);
      const dist = Math.max(Math.abs(r - bg[0]), Math.abs(g - bg[1]), Math.abs(b - bg[2]));

      let reference;
      if (art) {
        reference = Math.max(
          Math.abs(art[0] - bg[0]),
          Math.abs(art[1] - bg[1]),
          Math.abs(art[2] - bg[2])
        );
      } else {
        reference = 0;
      }
      reference = Math.max(reference, 25);

      const a = clamp(dist / reference, 0, 1);
      alpha[i] = a;

      if (a < 0.15 || !art) {
        // Too transparent to un-blend safely; take the neighbouring artwork
        // colour so no grey is baked in.
        const fallback = art || bgMean;
        colour[i * 3] = fallback[0];
        colour[i * 3 + 1] = fallback[1];
        colour[i * 3 + 2] = fallback[2];
      } else {
        // P = a*A + (1-a)*B  =>  A = (P - (1-a)*B) / a
        colour[i * 3] = clamp((r - (1 - a) * bg[0]) / a, 0, 255);
        colour[i * 3 + 1] = clamp((g - (1 - a) * bg[1]) / a, 0, 255);
        colour[i * 3 + 2] = clamp((b - (1 - a) * bg[2]) / a, 0, 255);
      }
    }
  }

  return { width: w, height: h, alpha, colour, outer, confident, bgTones, fgTones, bgMean };
}

// ---------------------------------------------------------------------------
// Cropping and resampling
// ---------------------------------------------------------------------------

function alphaBoundingBox(layer, threshold) {
  const { width: w, height: h, alpha } = layer;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x] <= threshold) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) throw new Error('keying produced an empty image');
  return { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/** Extracts the cropped region as straight-alpha Float32 planes. */
function cropLayer(layer, box) {
  const { width: w, colour, alpha } = layer;
  const { x0, y0, width: cw, height: ch } = box;
  const r = new Float32Array(cw * ch);
  const g = new Float32Array(cw * ch);
  const b = new Float32Array(cw * ch);
  const a = new Float32Array(cw * ch);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const src = (y + y0) * w + (x + x0);
      const dst = y * cw + x;
      r[dst] = colour[src * 3];
      g[dst] = colour[src * 3 + 1];
      b[dst] = colour[src * 3 + 2];
      a[dst] = alpha[src] * 255;
    }
  }
  // Largest distance from the crop centre to a solidly-covered pixel, i.e. the
  // silhouette's outer radius. The bbox has empty corners, so this is the value
  // that decides whether a round launcher mask would clip the artwork.
  let maxRadius = 0;
  const cx = (cw - 1) / 2;
  const cy = (ch - 1) / 2;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (a[y * cw + x] <= 127.5) continue;
      const radius = Math.hypot(x - cx, y - cy);
      if (radius > maxRadius) maxRadius = radius;
    }
  }

  return { width: cw, height: ch, r, g, b, a, maxRadius };
}

/**
 * Separable box (area-average) resample of a single plane. Used instead of
 * nearest-neighbour so that 460 -> 32 does not alias.
 */
function boxResample(src, sw, sh, dw, dh) {
  const tmp = new Float32Array(dw * sh);
  for (let y = 0; y < sh; y++) {
    const row = y * sw;
    for (let x = 0; x < dw; x++) {
      const s0 = (x * sw) / dw;
      const s1 = ((x + 1) * sw) / dw;
      const i0 = Math.floor(s0);
      const i1 = Math.ceil(s1);
      let acc = 0;
      let weight = 0;
      for (let i = i0; i < i1; i++) {
        const overlap = Math.min(s1, i + 1) - Math.max(s0, i);
        if (overlap <= 0) continue;
        const idx = i < 0 ? 0 : i >= sw ? sw - 1 : i;
        acc += src[row + idx] * overlap;
        weight += overlap;
      }
      tmp[y * dw + x] = weight > 0 ? acc / weight : 0;
    }
  }

  const out = new Float32Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    const s0 = (y * sh) / dh;
    const s1 = ((y + 1) * sh) / dh;
    const i0 = Math.floor(s0);
    const i1 = Math.ceil(s1);
    for (let x = 0; x < dw; x++) {
      let acc = 0;
      let weight = 0;
      for (let i = i0; i < i1; i++) {
        const overlap = Math.min(s1, i + 1) - Math.max(s0, i);
        if (overlap <= 0) continue;
        const idx = i < 0 ? 0 : i >= sh ? sh - 1 : i;
        acc += tmp[idx * dw + x] * overlap;
        weight += overlap;
      }
      out[y * dw + x] = weight > 0 ? acc / weight : 0;
    }
  }
  return out;
}

/**
 * Resamples the cropped artwork into a `fit`-sized centred rect and composites
 * it onto a square canvas. Averaging happens in premultiplied space so that
 * transparent pixels do not bleed their (arbitrary) colour into the edges.
 */
function compose(cropped, canvasSize, fit, opaqueBackground) {
  let scale = fit / Math.max(cropped.width, cropped.height);

  if (opaqueBackground) {
    // A maskable icon may be cropped to a circle. Fitting the bounding box to
    // 80% of the canvas is not enough on its own - the silhouette is not
    // square, so its lobes can still reach past the safe circle. Clamp the
    // scale so the measured silhouette radius stays inside it.
    const limit = SAFE_ZONE_RADIUS * canvasSize * SAFE_ZONE_SLACK;
    if (cropped.maxRadius * scale > limit) scale = limit / cropped.maxRadius;
  }

  const dw = Math.max(1, Math.round(cropped.width * scale));
  const dh = Math.max(1, Math.round(cropped.height * scale));
  const dx = Math.floor((canvasSize - dw) / 2);
  const dy = Math.floor((canvasSize - dh) / 2);

  const { width: cw, height: ch, r, g, b, a } = cropped;
  const premulR = new Float32Array(cw * ch);
  const premulG = new Float32Array(cw * ch);
  const premulB = new Float32Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) {
    const w = a[i] / 255;
    premulR[i] = r[i] * w;
    premulG[i] = g[i] * w;
    premulB[i] = b[i] * w;
  }

  const outR = boxResample(premulR, cw, ch, dw, dh);
  const outG = boxResample(premulG, cw, ch, dw, dh);
  const outB = boxResample(premulB, cw, ch, dw, dh);
  const outA = boxResample(a, cw, ch, dw, dh);

  const channels = opaqueBackground ? 3 : 4;
  const canvas = Buffer.alloc(canvasSize * canvasSize * channels);
  // Transparent canvases keep RGB 0 where alpha is 0 (the colour is invisible,
  // but leaving it black avoids baking an arbitrary tint into the file).
  const base = opaqueBackground ? MASKABLE_BG : [0, 0, 0];

  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      const out = (y * canvasSize + x) * channels;
      const sx = x - dx;
      const sy = y - dy;
      const inside = sx >= 0 && sy >= 0 && sx < dw && sy < dh;
      const w = inside ? outA[sy * dw + sx] / 255 : 0;

      let rr;
      let gg;
      let bb;
      if (w > 0) {
        rr = outR[sy * dw + sx] / w;
        gg = outG[sy * dw + sx] / w;
        bb = outB[sy * dw + sx] / w;
      } else {
        rr = base[0];
        gg = base[1];
        bb = base[2];
      }

      if (opaqueBackground) {
        canvas[out] = clamp(Math.round(rr * w + base[0] * (1 - w)), 0, 255);
        canvas[out + 1] = clamp(Math.round(gg * w + base[1] * (1 - w)), 0, 255);
        canvas[out + 2] = clamp(Math.round(bb * w + base[2] * (1 - w)), 0, 255);
      } else {
        canvas[out] = clamp(Math.round(rr), 0, 255);
        canvas[out + 1] = clamp(Math.round(gg), 0, 255);
        canvas[out + 2] = clamp(Math.round(bb), 0, 255);
        canvas[out + 3] = clamp(Math.round(w * 255), 0, 255);
      }
    }
  }

  return { buffer: canvas, channels, dw, dh, dx, dy, scale };
}

// ---------------------------------------------------------------------------
// Reporting helpers
// ---------------------------------------------------------------------------

function topEntries(map, count) {
  return [...map.entries()]
    .sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .slice(0, count);
}

function reportKeying(layer) {
  console.log('Keying report');
  console.log('  background tones (strict match, exact RGB -> pixels):');
  for (const [tone, count] of topEntries(layer.bgTones, 8)) {
    console.log(`    ${tone.padEnd(14)} ${count}`);
  }
  console.log('  artwork tones (coarse r>>4,g>>4,b>>4 -> pixels):');
  for (const [tone, count] of topEntries(layer.fgTones, 8)) {
    console.log(`    ${tone.padEnd(14)} ${count}`);
  }
  let outerCount = 0;
  for (let i = 0; i < layer.outer.length; i++) outerCount += layer.outer[i];
  console.log(`  outer-background pixels: ${outerCount} / ${layer.outer.length}`);
  console.log(`  mean background tone: ${layer.bgMean.map((v) => Math.round(v)).join(',')}`);
}

function reportIhdr(label, file) {
  const img = readPng(file);
  const bytes = fs.statSync(file).size;
  console.log(
    `  ${label.padEnd(22)} ${String(img.width).padStart(3)}x${String(img.height).padEnd(3)}` +
      ` depth ${img.bitDepth}  colour type ${img.colorType}  ${(bytes / 1024).toFixed(1)} KiB`
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function resolveMaster() {
  const arg = process.argv[2];
  const candidates = arg
    ? [path.resolve(process.cwd(), arg)]
    : [SOURCE_MASTER, LEGACY_MASTER];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      if (arg) throw new Error(`source image not found: ${candidate}`);
      continue;
    }
    const img = readPng(candidate);
    const isMaster =
      img.width === MASTER_W && img.height === MASTER_H && img.colorType === COLOR_TYPE_RGB;
    if (!isMaster) {
      if (arg) {
        throw new Error(
          `${candidate}: expected a ${MASTER_W}x${MASTER_H} RGB (colour type 2) master, ` +
            `got ${img.width}x${img.height} colour type ${img.colorType}`
        );
      }
      continue;
    }
    return { file: candidate, img };
  }

  throw new Error(
    `no usable master artwork found.\n` +
      `Looked for: ${candidates.join(', ')}\n` +
      `Usage: node scripts/generate-icons.js [path/to/${MASTER_W}x${MASTER_H}-master.png]`
  );
}

function main() {
  const { file: masterFile, img } = resolveMaster();

  // Preserve the pristine master under a stable name so that re-running after
  // favicon-32.png has been overwritten still reads the 460x460 original.
  if (masterFile !== SOURCE_MASTER) {
    fs.copyFileSync(masterFile, SOURCE_MASTER);
    console.log(`master: ${masterFile} -> copied to ${SOURCE_MASTER}`);
  } else {
    console.log(`master: ${masterFile}`);
  }

  const layer = buildLayer(img);
  reportKeying(layer);

  // Crop at a low alpha threshold so the soft edge is kept, not clipped.
  const box = alphaBoundingBox(layer, 0.08);
  const cropped = cropLayer(layer, box);
  console.log(
    `  artwork bbox: x ${box.x0}..${box.x1}, y ${box.y0}..${box.y1} ` +
      `(${box.width}x${box.height})`
  );

  console.log('Outputs');
  const results = [];
  for (const output of OUTPUTS) {
    const fit = output.alpha
      ? output.size * (1 - 2 * ICON_MARGIN)
      : output.size * MASKABLE_FIT;
    const composed = compose(cropped, output.size, fit, !output.alpha);
    const png = writePng(output.size, output.size, composed.channels, composed.buffer);
    const target = path.join(IMAGES_DIR, output.file);
    fs.writeFileSync(target, png);
    reportIhdr(output.file, target);
    const coverage = ((Math.max(composed.dw, composed.dh) / output.size) * 100).toFixed(1);
    const radius = ((cropped.maxRadius * composed.scale) / output.size) * 100;
    console.log(
      `  ${''.padEnd(22)} artwork ${composed.dw}x${composed.dh} at ${composed.dx},${composed.dy}` +
        ` (${coverage}% of canvas, silhouette radius ${radius.toFixed(1)}% of canvas)`
    );
    results.push({ file: target, bytes: png.length });
  }

  console.log('Done.');
  return results;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`generate-icons: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { readPng, writePng };

// Generates the PWA icon set as PNGs with no image dependencies: draws the
// artwork (6 tab strings + amber finger dots) into an RGBA buffer and encodes
// PNG chunks by hand, using node:zlib for the IDAT deflate stream.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))

function drawIcon(size, { rounded, pad }) {
  const bg = [9, 9, 11] // zinc-950
  const stringCol = [82, 82, 92] // zinc-600
  const nutCol = [113, 113, 122] // zinc-500
  const amber = [251, 191, 36] // amber-400

  const buf = Buffer.alloc(size * size * 4)
  const p = size * pad
  const left = p
  const right = size - p
  const top = p
  const bottom = size - p
  const stringGap = (bottom - top) / 5
  const lineW = Math.max(1, size / 44)
  const radius = rounded ? size * 0.21 : 0
  const dotR = size * 0.062
  // (stringIndex from top, x as fraction of content width)
  const dots = [
    [1, 0.32],
    [3, 0.58],
    [2, 0.82],
  ]

  const roundedCoverage = (x, y) => {
    if (!rounded) return 1
    const cx = clamp01((x < radius ? radius - x : x > size - radius ? x - (size - radius) : 0) / 1)
    void cx
    // distance from nearest corner center when inside a corner square
    const qx = x < radius ? radius : x > size - radius ? size - radius : x
    const qy = y < radius ? radius : y > size - radius ? size - radius : y
    if (qx === x && qy === y) return 1
    const d = Math.hypot(x - qx, y - qy)
    return clamp01(radius - d + 0.5)
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cov = roundedCoverage(x + 0.5, y + 0.5)
      let r = bg[0]
      let g = bg[1]
      let b = bg[2]

      if (x + 0.5 >= left && x + 0.5 <= right) {
        // nut (vertical bar at the left edge of the strings)
        if (x + 0.5 <= left + lineW * 2 && y + 0.5 >= top && y + 0.5 <= bottom) {
          ;[r, g, b] = nutCol
        }
        // strings
        for (let i = 0; i < 6; i++) {
          const sy = top + i * stringGap
          if (Math.abs(y + 0.5 - sy) <= lineW / 2) {
            ;[r, g, b] = stringCol
            break
          }
        }
      }

      // amber dots
      for (const [si, fx] of dots) {
        const dx = left + (right - left) * fx
        const dy = top + si * stringGap
        const d = Math.hypot(x + 0.5 - dx, y + 0.5 - dy)
        const a = clamp01(dotR - d + 0.5)
        if (a > 0) {
          r = r + (amber[0] - r) * a
          g = g + (amber[1] - g) * a
          b = b + (amber[2] - b) * a
        }
      }

      const idx = (y * size + x) * 4
      buf[idx] = Math.round(r)
      buf[idx + 1] = Math.round(g)
      buf[idx + 2] = Math.round(b)
      buf[idx + 3] = Math.round(255 * cov)
    }
  }
  return encodePng(size, buf)
}

mkdirSync('public', { recursive: true })
writeFileSync('public/pwa-192.png', drawIcon(192, { rounded: true, pad: 0.18 }))
writeFileSync('public/pwa-512.png', drawIcon(512, { rounded: true, pad: 0.18 }))
writeFileSync('public/pwa-512-maskable.png', drawIcon(512, { rounded: false, pad: 0.27 }))
writeFileSync('public/apple-touch-icon.png', drawIcon(180, { rounded: false, pad: 0.2 }))
console.log('icons written to public/')

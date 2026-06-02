import sharp from 'sharp'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const SVG_PATH = resolve(ROOT, 'client', 'resources', 'icon.svg')
const RES_DIR = resolve(ROOT, 'client', 'resources')
const BUILD_DIR = resolve(ROOT, 'client', 'build')
const OUT_DIR = resolve(__dirname, 'out')

const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024]

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

const ICNS_TYPES = [
  { size: 16, type: 'icp4' },
  { size: 32, type: 'icp5' },
  { size: 64, type: 'icp6' },
  { size: 128, type: 'ic07' },
  { size: 256, type: 'ic08' },
  { size: 512, type: 'ic09' },
  { size: 1024, type: 'ic10' }
]

async function ensureDir(p) {
  if (!existsSync(p)) await mkdir(p, { recursive: true })
}

async function renderPngs(svgBuffer) {
  await ensureDir(OUT_DIR)
  const pngs = new Map()
  for (const size of SIZES) {
    const buf = await sharp(svgBuffer, { density: 300 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    pngs.set(size, buf)
    await writeFile(resolve(OUT_DIR, `icon-${size}.png`), buf)
    console.log(`  rendered ${size}x${size} (${buf.length} bytes)`)
  }
  return pngs
}

function buildIco(pngs) {
  const images = ICO_SIZES.map((s) => ({ size: s, data: pngs.get(s) }))
    .filter((img) => img.data && img.data.length > 0)

  const headerSize = 6 + images.length * 16
  let totalSize = headerSize
  for (const img of images) totalSize += img.data.length

  const buf = Buffer.alloc(totalSize)
  let offset = 0
  buf.writeUInt16LE(0, offset); offset += 2
  buf.writeUInt16LE(1, offset); offset += 2
  buf.writeUInt16LE(images.length, offset); offset += 2

  let dataOffset = headerSize
  for (const img of images) {
    const { size, data } = img
    const w = size >= 256 ? 0 : size
    const h = size >= 256 ? 0 : size
    buf.writeUInt8(w, offset); offset += 1
    buf.writeUInt8(h, offset); offset += 1
    buf.writeUInt8(0, offset); offset += 1
    buf.writeUInt8(0, offset); offset += 1
    buf.writeUInt16LE(1, offset); offset += 2
    buf.writeUInt16LE(32, offset); offset += 2
    buf.writeUInt32LE(data.length, offset); offset += 4
    buf.writeUInt32LE(dataOffset, offset); offset += 4
    data.copy(buf, dataOffset)
    dataOffset += data.length
  }
  return buf
}

function buildIcns(pngs) {
  const elements = []
  for (const { size, type } of ICNS_TYPES) {
    const data = pngs.get(size)
    if (!data) continue
    const elemLen = 8 + data.length
    const elem = Buffer.alloc(8 + data.length)
    elem.write(type, 0, 4, 'ascii')
    elem.writeUInt32BE(elemLen, 4)
    data.copy(elem, 8)
    elements.push(elem)
  }

  const bodyLen = elements.reduce((s, e) => s + e.length, 0)
  const totalLen = 8 + bodyLen
  const out = Buffer.alloc(totalLen)
  out.write('icns', 0, 4, 'ascii')
  out.writeUInt32BE(totalLen, 4)
  let off = 8
  for (const e of elements) {
    e.copy(out, off)
    off += e.length
  }
  return out
}

async function main() {
  console.log('reading svg:', SVG_PATH)
  const svg = await readFile(SVG_PATH)
  console.log(`svg size: ${svg.length} bytes`)

  console.log('\nrendering PNGs:')
  const pngs = await renderPngs(svg)

  console.log('\nbuilding ICO:')
  const ico = buildIco(pngs)
  console.log(`  ico size: ${ico.length} bytes`)

  console.log('\nbuilding ICNS:')
  const icns = buildIcns(pngs)
  console.log(`  icns size: ${icns.length} bytes`)

  await ensureDir(RES_DIR)
  await ensureDir(BUILD_DIR)

  const png1024 = pngs.get(1024)
  await writeFile(resolve(RES_DIR, 'icon.png'), png1024)
  console.log(`\nwrote ${resolve(RES_DIR, 'icon.png')}`)

  await writeFile(resolve(BUILD_DIR, 'icon.png'), png1024)
  console.log(`wrote ${resolve(BUILD_DIR, 'icon.png')}`)

  await writeFile(resolve(BUILD_DIR, 'icon.ico'), ico)
  console.log(`wrote ${resolve(BUILD_DIR, 'icon.ico')}`)

  await writeFile(resolve(BUILD_DIR, 'icon.icns'), icns)
  console.log(`wrote ${resolve(BUILD_DIR, 'icon.icns')}`)

  console.log('\ndone.')
}

main().catch((err) => {
  console.error('build failed:', err)
  process.exit(1)
})

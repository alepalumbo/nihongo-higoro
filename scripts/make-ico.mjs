// Generate a multi-size Windows .ico from the torii app icon.
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { writeFileSync } from 'node:fs'

const src = 'assets/icon-only.svg'
const sizes = [16, 32, 48, 64, 128, 256]

const buffers = await Promise.all(
  sizes.map((s) => sharp(src).resize(s, s).png().toBuffer()),
)
const ico = await pngToIco(buffers)
writeFileSync('nihongo.ico', ico)
console.log('nihongo.ico written:', ico.length, 'bytes')

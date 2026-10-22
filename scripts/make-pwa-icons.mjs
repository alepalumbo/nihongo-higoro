// Generate PWA PNG icons from the torii sources.
import sharp from 'sharp'

const jobs = [
  { src: 'assets/icon-only.svg', size: 192, out: 'public/pwa-192.png' },
  { src: 'assets/icon-only.svg', size: 512, out: 'public/pwa-512.png' },
  { src: 'assets/pwa-maskable.svg', size: 512, out: 'public/pwa-maskable-512.png' },
]

for (const j of jobs) {
  await sharp(j.src).resize(j.size, j.size).png().toFile(j.out)
  console.log('wrote', j.out)
}

// Generate maskable PWA icons from the source logo.
// Maskable icons need a "safe zone" — the central 80% of the canvas — so
// the logo isn't clipped when Android applies its custom mask.
const sharp = require('/home/z/my-project/node_modules/sharp')
const fs = require('fs')

const src = '/home/z/my-project/public/logo.png'

async function main() {
  const sizes = [192, 512]
  for (const size of sizes) {
    // Create a white canvas at full size, then composite the logo scaled
    // to 70% of the canvas (centered). This leaves a ~15% safe margin.
    const logoSize = Math.round(size * 0.70)
    const offset = Math.round((size - logoSize) / 2)

    const canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })

    const logoBuffer = await sharp(src)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer()

    await canvas
      .composite([{ input: logoBuffer, left: offset, top: offset }])
      .png({ compressionLevel: 9 })
      .toFile(`/home/z/my-project/public/maskable-${size}.png`)

    console.log(`  maskable-${size}.png (${fs.statSync(`/home/z/my-project/public/maskable-${size}.png`).size} bytes)`)
  }
}

main()


// remove-bg.mjs — removes white background from scholarlens-logo.jpeg → scholarlens-logo.png
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, "public", "scholarlens-logo.jpeg");
const output = path.join(__dirname, "public", "scholarlens-logo.png");

// Threshold: pixels whiter than this value (0-255 per channel) become transparent
const THRESHOLD = 240;
const TOLERANCE = 30; // feather edges slightly

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info; // channels = 4 (RGBA)
const pixels = new Uint8ClampedArray(data);

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];

  // Check if pixel is close to white
  if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
    // How "white" is this pixel — use to set alpha (feathering)
    const whiteness = Math.min(r, g, b);
    const alpha = Math.max(0, 255 - Math.round(((whiteness - (THRESHOLD - TOLERANCE)) / TOLERANCE) * 255));
    pixels[i + 3] = alpha;
  }
}

await sharp(pixels, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(`✅ Saved transparent PNG → ${output}`);

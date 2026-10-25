# India Drive Real Car Sim

A browser-based 3D driving prototype featuring Indian village, city and highway environments; selectable generic SUV/coupe/sedan-style vehicles; paint and RGB LED customization; lights, hazards, doors, windows, horn, synthesized DJ-style sound, nitro, camera modes, and touch driving controls.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Create a production build with `npm run build`; output is in `dist/`.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and deploys the site to GitHub Pages when changes are pushed to `main`. Enable GitHub Pages with **GitHub Actions** as the build source if prompted.

## Notes

- This is an original, stylized 3D prototype, not a full AAA simulator or an exact licensed vehicle model.
- The 3D engine is loaded from the Three.js CDN at runtime, so gameplay requires internet access.
- Audio is synthesized in-browser; it does not include commercial music.

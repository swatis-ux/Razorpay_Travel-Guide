# Editorial illustrated travel website references

These SVG files are visual direction boards for the entire website, not decorative assets to insert as page illustrations.

## Files
- `01-overall-art-direction.svg` — global visual direction and avoid list
- `02-illustration-style.svg` — illustration treatment, line weight, shape and texture
- `03-type-colour-layout.svg` — typography, palette and layout rules
- `04-micro-interaction-language.svg` — interaction and motion vocabulary
- `05-parallax-layering.svg` — layered parallax reference
- `06-product-ui-style.svg` — how the visual language should apply to actual product UI

## Intended direction
A mature, Maisonette-inspired editorial illustrated travel website. This is an original interpretation of editorial art direction, not a pixel-perfect reproduction of Maisonette.

## Critical illustration constraints
- At a 1440 px wide artboard, primary outlines should be around 2–2.4 px and detail lines 1–1.3 px.
- Use restrained, warm, muted colours and flat pigment shapes with subtle paper grain.
- Prefer landscape-led compositions, architectural silhouettes and observed travel objects.
- Avoid childlike cartoon faces, oversized heads, thick black comic outlines, emoji-like objects, sticker aesthetics, random doodles and overly cute mascots.
- Illustration must support the content hierarchy, not overwhelm it.

## Implementation
Use the SVGs as design references. Do not place these boards as images in the live website. Rebuild their principles in CSS, HTML, SVG illustration assets and interaction code. Preserve existing information architecture, copy, features and responsive behaviour unless explicitly asked to change them.

## Motion
- UI transitions: 160–280 ms.
- Editorial reveals: 400–700 ms.
- Use restrained ease-out transitions.
- Respect `prefers-reduced-motion`.
- Do not hijack scrolling.
- Parallax only for decorative illustration layers, never text, buttons, maps or core itinerary controls.

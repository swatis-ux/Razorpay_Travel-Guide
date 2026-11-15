# Planner illustrations: image-generation prompts

These prompts are for redrawing the planner's illustrations with an image-generation tool. None has been available so far, so the site uses the SVG illustrations listed below, which follow the art-direction boards in `assets/references/` (01–06). When a generated image replaces one, keep the same file name and aspect ratio so no code changes.

## Where an illustration helps

The planner uses only these. Each one either sets the scene or helps someone recognise a place or a stop.

| Use in the planner | Current file | Aspect ratio | Why it is there |
|---|---|---|---|
| Tell us: the opening scene | `hero-journey.svg` | 1400 × 540 | Sets the mood before any input. It is the one large image. |
| Explore and Review: destination postcards | `dest-coorg.svg`, `dest-chikmagalur.svg`, `dest-wayanad.svg` | 360 × 200 | Helps people tell the three places apart at a glance. |
| Explore: the planning map | `map-coorg.svg` | 1000 × 700 | The surface the route and stops sit on. |
| Explore: an opened stop, and its alternatives | `thumb-*.svg` (bus, car, train, homestay, guesthouse, hostel, coffee, market, food, cafe, fort, viewpoint, waterfall, raft, elephant, rest, monastery) | 240 × 150 | Helps people recognise an activity or stay. |
| Building the trip | `plan-next.svg` | 240 × 150 | Something calm to look at during a short wait. |

All interface text stays in HTML. No image should contain words, labels or numbers.

## The shared style prompt

Use this for every asset. Change only the subject and composition lines.

> Create a mature editorial travel illustration for an art-directed travel magazine website. Use flat, muted pigment shapes with a very subtle paper grain on a warm paper ground (#F7F3EA), in sage (#9BAE91), forest (#465C48), terracotta (#C87555), mustard (#D9B75D), soft blue (#A8C2C5), rose (#D8A49A) and warm ink (#292821). Keep the composition landscape-led, with layered, simplified terrain, architectural silhouettes and observed travel objects. Draw people with realistic, restrained proportions, about 7.5 heads tall, with faces left plain. Use lines sparingly and consistently: primary outlines about 2 px and detail lines about 1.2 px at a 1440 px width, with round caps, and no outlines on terrain or foliage. Avoid cartoon or children's-book styling, oversized heads, exaggerated expressions, thick black comic outlines, sticker-like or emoji-like objects, gradients, glossy 3D, photorealism, text, labels, logos and watermarks.

The art direction comes from the six boards in `assets/references/` (01–06). In particular, follow `02-illustration-style.svg` for line weight and shapes, and `03-type-colour-layout.svg` for colour.

## Subjects

### 1. Main travel landscape (`hero-journey`, wide 2.6:1)
**Subject:** a group of four young friends with backpacks stands on a riverbank looking at a paper map. Behind them, a blue train crosses a sandstone bridge. On the left, a pink-orange palace among palms; on the right, green coffee hills with a small homestay and a waterfall. A dotted terracotta route with three map pins arcs across the sky between them.
**Composition:** a wide panorama that reads left to right as a journey. Leave quiet cream sky in the upper third, with a few clouds and a mustard sun. Large painted fronds frame the lower corners.

### 2. Destination postcards (wide 1.8:1)
- **Coorg:** misty coffee-estate hills in rows, silver-oak trees and a small red-roofed estate house, in morning light.
- **Chikmagalur:** steeper coffee hills, a ridge-line trek path and a distant peak, with two tiny hikers.
- **Wayanad:** dense forest canopy, a still lake, and an elephant at the water's edge.

**Composition:** one clear subject in the middle, with no people in the foreground and generous paper around the edges.

### 3. Planning map (`map-coorg`, 10:7)
**Subject:** a painted, top-down map of the Coorg region: forested hills to the west, a town on a ridge in the middle, a reservoir, the Kaveri river curving along the south, coffee estates, and a monastery town to the east.
**Composition:** keep the map calm and low in contrast. Leave open space where markers sit, at roughly the same positions as the current map, so the route and numbered stops stay legible. Draw no roads thicker than a hairline, and include no text.

### 4. Activities and transport (`thumb-*`, 1.6:1)
Use one subject per image, on a small patch of painted ground:
- an overnight sleeper bus;
- two rental cars;
- a train with a shared cab;
- a homestay among coffee bushes;
- a town guesthouse;
- a hostel bunk room;
- a coffee plantation walk;
- a spice market stall;
- a banana-leaf meal;
- a small café table;
- an old stone fort;
- a sunset viewpoint;
- a waterfall walk;
- a rafting boat on white water;
- an elephant camp by a river;
- a hammock between two trees;
- a golden monastery.

**Composition:** the subject sits centred and slightly low, with no background clutter. The image must still read at 76 × 56 px.

### 5. Supporting object (`plan-next`, 1.6:1)
**Subject:** a traveller beside a large speech bubble and a small itinerary card, joined by a dotted route.
**Composition:** use only a few objects and plenty of paper.

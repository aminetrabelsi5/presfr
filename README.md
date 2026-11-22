# Utopia — présentation cinématique

A cinematic HTML presentation of Thomas More's *Utopia* (1516): 53 slides, 7 speakers.

## Launch
- **Simplest:** double-click `index.html` (it works offline; the Google Fonts load when you're online and fall back to serif fonts when you're not).
- **Local server:** `npm start` → http://localhost:8080

## Controls
| Key | Action |
|---|---|
| `→` / `Space` / `←` | Next / previous slide |
| `12` then `Enter` | Jump to slide 12 |
| `O` | Section overview |
| `N` | Speaker notes drawer |
| `P` | Presenter window (notes, next slide, timer) |
| `F` | Full screen |
| `?` | Help |

Mouse wheel and swipe also work. The URL hash (`#12`) remembers the current slide.

## Structure
```
index.html          all 53 slides (content + speaker notes in <aside class="notes">)
css/style.css       visual identity, themes, components
js/atmosphere.js    living background: skies, stars, glowing dust, parallax
js/scenes.js        procedural SVG: island seascapes, compass rose, map of Utopia
js/deck.js          navigation, transitions, reveals, HUD, notes, presenter view
js/icons.js         generated icon sprite (do not edit)
js/vendor/          GSAP
tools/build.js      regenerates js/icons.js and copies GSAP (`npm run build`)
assets/img/         public-domain artworks (Holbein, Bruegel, 1516/1518 Utopia woodcuts…)
```

## Editing slides
Each slide is a `<section class="slide">` with these attributes:
- `data-theme`: `night` | `parchment` | `emerald` | `dusk`
- `data-section`: `opening` | `prologue` | `p1` | `p2` | `p3` | `conclusion` | `end`
- `data-speaker`: 1–7
- `data-tr`: `slide` | `fade` | `zoom` | `rise`. Moving to a new section always plays the curtain transition.

Add `data-r` to any element to animate it in. Values: `up`, `left`, `right`, `zoom`, `pop`, `fade`, `blur`, `line`, `bar`, `stamp`, `flip`, `letters`, `count`, `draw`. Use `data-d` to set a delay in seconds.
Insert an icon with `data-i="name"` (see `tools/build.js` for the list).

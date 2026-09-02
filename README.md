# faiz-home-

## Hero — scroll-driven word reveal

Open `index.html`. Scrolling through the hero section reveals the copy one word
at a time; the white block fades up behind the words and is fully solid by the
time "Shibili Nuhman" has landed. At the end, `move.` stretches into
`moooooooooooove.` with the extra `o`s in blue. Everything is a pure function of
scroll progress, so scrolling back up plays the whole sequence in reverse.

- `index.html` — the markup, one `<span data-w>` per word
- `styles.css` — type, the white block layer, the badge
- `hero.js` — the scroll → progress → render loop (tunables at the top:
  `REVEAL_END`, `MORPH_START`, `EXTRA_OS`, and the `.reveal` height in the CSS)
- `fonts/` — Inter (latin subset, variable), self-hosted

## Info grid

Below the hero: how I work (software set + the process line), where I work(ed),
and communication. One tall panel left, two stacked right, collapsing to a
single column under 820px. The Adobe marks are drawn as their standard
monogram tiles; Figma and Microsoft are inline SVG. Blender is a placeholder
monogram — drop in the real SVG when you have it.

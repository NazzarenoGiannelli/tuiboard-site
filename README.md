# tuiboard-site

Landing page for [**tuiboard**](https://github.com/NazzarenoGiannelli/tuiboard) —
a terminal kanban board on plain markdown. Lives at **tuiboard.nazzareno.xyz**.

A single hand-written static page: no framework, no build step.

```
index.html        markup (all content in the DOM — reduced-motion is the primary path)
css/style.css     palette, type, layout, motion layer
js/main.js        copy buttons, terminal tab cycler, scroll reveals (progressive enhancement)
assets/fonts/     self-hosted JetBrains Mono (woff2, 400/500/700, Latin subset)
assets/*.png      screenshots (see assets/README.md)
_headers          Cloudflare Pages cache + security headers
```

## Develop

No build needed — just serve the folder:

```bash
bunx serve .          # or: python -m http.server 8080
```

Open the printed URL.

## Deploy (Cloudflare Pages)

Connected to this GitHub repo → builds on every push to `main`.
Framework preset: **None**. Build command: *(empty)*. Output directory: `/`.
Custom domain: `tuiboard.nazzareno.xyz`.

## Design

Aesthetic mirrors the tuiboard TUI: monospace everything, the FIGlet
"Rectangles" ASCII wordmark in the tool's light-yellow accent (`#eaf6ad`,
rationed), an animated faux-terminal demo, and motion that fully respects
`prefers-reduced-motion`.

MIT © Nazzareno Giannelli

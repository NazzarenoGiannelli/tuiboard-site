# Assets

The pictures and clips on the page are the real app: tuiboard's own headless renderer,
recorded on an invented demo board (Sam, Mia, nimbus.app, invented agent sessions), so nothing
on screen is a real board, path or session. They are generated in the tuiboard repo:

```bash
cd ../tuiboard
bun run demo:shots                       # frames -> images and video
python demo/shots/render.py --site       # the terminal alone, for this page (demo/out/site/)
```

Copy `demo/out/site/*.mp4` and the `*.png` (as JPEG, quality ~86) into `assets/media/`.
`og.jpg` is the gradient hero picture (`demo/out/images/hero.png`) cropped to 1200x630.

| File | Where |
|------|-------|
| `media/zones.mp4` | hero: Shift-Tab across the four zones |
| `media/grab.mp4`, `planner.mp4`, `drag.mp4`, `filter.mp4` | sections 01 to 04 |
| `media/tuiboard-film.mp4`, `film-poster.jpg` | the film section under the hero (web encode of the launch film, made in the tuiboard repo: `demo/promo/`) |
| `media/tray.mp4`, `days.mp4`, `multi.mp4` | the small things |
| `media/*.jpg` | posters (shown while a clip loads, and for reduced motion) |
| `media/og.jpg` | social preview |

`fonts/` holds self-hosted JetBrains Mono and Departure Mono (woff2, Latin subset).

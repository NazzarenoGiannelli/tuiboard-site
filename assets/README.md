# Assets

The feature sections use built-in faux-terminal panels (no images needed), so
the landing needs **just one image**:

| File | Where | Notes |
|------|-------|-------|
| `dashboard.jpg` | the full-width "the whole dashboard" showcase **and** the social/OG preview | The full tuiboard dashboard (same hero shot as the GitHub README), resized to 1600px and optimized (~200 KB). |

It's already in place. To refresh it, drop a new dashboard screenshot and
re-optimize, e.g.:

```bash
ffmpeg -y -i source.png -vf "scale=1600:-1:flags=lanczos" -map_metadata -1 -q:v 3 dashboard.jpg
```

A background-free terminal-only PNG can be swapped in later for a glow treatment.

`fonts/` holds self-hosted JetBrains Mono (woff2, 400/500/700, Latin subset).

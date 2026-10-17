# Before migration

Upstream: 0a77af1020c193bfbef93f1da53d407005790bc9 (2026-03-10).
Inventory verified against the complete checkout on 2026-10-17.

| Item | Original state |
|---|---:|
| Markdown articles | 115 |
| Manually maintained index files | 5 |
| index.html | 129,577 bytes / 3,241 lines |
| Embedded style lines | 1,926 |
| Embedded JavaScript lines | 745 |
| Font files | 32,983,800 bytes |
| Images including GIFs | 32,196,186 bytes |
| Two homepage GIFs | 22,024,703 bytes |
| Music, preload=auto | 5,178,011 bytes |

These are uncompressed source sizes, not measured browser transfer totals.
Both GIF sources are declared eagerly and switch only via opacity. Photography
is declared in the same document. Fonts load when matching glyphs/weights occur.

## Confirmed failures

- Day 78 index uses 20251127; the existing file uses 20251128. HTTP: 404 / 200.
- Favicon repeats Montunar.github.io in its relative URL. HTTP: 404 / 200.
- PDF href ../assets/... resolves outside the project base. HTTP: 404 / 200.
- A failing list loader catches the error, then its outer cache is marked loaded.
  Isolated execution: three failed requests, error UI, cache=true.
- Retrying failed Markdown checks children.length and does not refetch.
  Isolated execution: request count remains three after retry.
- Expand-all consults window.*Articles arrays never assigned anywhere.
  Isolated execution: zero requests and a collapsed loading placeholder.
- Search opening uses fixed delays rather than awaiting its target list.

Browser measurements and screenshots are recorded separately with their exact
environment and any failures. The live HTML and all three scripts were checked
byte-for-byte against the upstream checkout before changes.

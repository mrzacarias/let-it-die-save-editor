# LET IT DIE — Save Editor

A browser-based save editor for the game **LET IT DIE**. Edit currencies, fighter stats, decals, and research levels directly in your `.sav` file.

**100% client-side.** The save never leaves your browser — no uploads, no server, no tracking.

## ⚠️ Back up first

Always back up your save before editing. The browser editor does **not** create backups — copy your `.sav` manually first (e.g. `76561198017253135.sav.bak`).

## Usage

1. Open [`index.html`](./index.html) in any browser (no server needed).
2. Click **Open .sav** and select your save file.
3. Edit what you want.
4. Click **Save .sav** to download the modified file.
5. Replace your original save with the downloaded one.

## Features

- **Currencies** — Kill Coins, SPLithium, Recycle Points, Bloodnium, TDM points, Rank points, Death Metals (paid/free)
- **Fighters** — level, HP/STR/DEX/VIT/STM/LUK, skill/bag/rage, grade, limit break
- **Decals** — list, search & add, remove, edit copies, sort by stars
- **Research** — all 371 base blueprints (owned + missing); edit per-blueprint level (fixes the "current level" preview via `LEVELUP.before_lvl`), and add missing blueprints as freshly-acquired (`MAP` research record)

## How it works

The save is a **BRG v2** container: `BRG\0` header → multiple zlib chunks → a single JSON document. The editor decodes it in-browser with [pako](https://github.com/nodeca/pako) (a zlib port), edits the JSON, and re-encodes it. Trailer bytes and chunk framing are preserved.

## Project layout

| Path | What |
|---|---|
| `index.html` | the editor UI |
| `pako.min.js` | zlib for the browser |
| `decals-catalog.js` | decal id → name/stars/premium map |
| `equipment-catalog.js` | equipment id → name/type map |
| `base-blueprints.js` | gear-family base blueprint list (371 roots) |
| `data/*.json` | source data backing the catalogs |
| `tools/add-decal.js` | CLI: add decals to a save |
| `tools/build-catalog.js` | regenerate the decal catalog |
| `tools/build-equipment-catalog.js` | regenerate the equipment catalog |
| `tools/build-base-blueprints.js` | regenerate the base-blueprint list |

## Deploy

It's a static site — host it anywhere for free:

- **GitHub Pages** — push to a repo, enable Pages from `main`.
- **Netlify Drop** — drag the folder onto <https://app.netlify.com/drop>.

## CLI tool

```bash
node tools/add-decal.js path/to/save.sav
```

Adds a set of 5★/4★ premium decals and writes a `.pre-decals.bak` backup.

## Regenerating catalogs (dev)

The catalogs were generated from community game-data dumps (not included in this repo). To rebuild them you need:

- `apiparams.json` — from the LID_Offline datamine (`Data/Params/apiparams.json`)
- `locdat.json` — same datamine (`Data/Locdat/locdat.json`)
- wiki locdat — `letitdie.wiki.gg` `Data:Locdat.json` (via MediaWiki API)

```bash
APIPARAMS=/path/apiparams.json \
LOCDAT=/path/locdat.json \
WIKI_LOCDAT=/path/wiki-locdat.json \
node tools/build-catalog.js [path/to/save.sav]
```

## Disclaimer

Fan-made tool, not affiliated with or endorsed by GungHo / GRASSHOPPER / UNITY. For offline/modding use only. Editing your save can corrupt it — always back up first.

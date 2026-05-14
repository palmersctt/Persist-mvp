# Persistwork Brand — Direction A (Performance / Tracking)

Single accent, near-black canvas, monospace numerals. References: Whoop, Strava Premium, Linear.

## Core Palette

| Token            | Hex                            | Usage                                          |
|------------------|--------------------------------|------------------------------------------------|
| `--ground`       | `#0B0B0C`                      | Page background (everywhere)                   |
| `--surface`      | `#15161A`                      | Card / panel background                        |
| `--surface-2`    | `#1F2024`                      | Raised panel, input background                 |
| `--rule`         | `#23252B`                      | Borders, dividers, hairlines                   |
| `--text`         | `#F5F5F5`                      | Primary text                                   |
| `--text-muted`   | `#9B9DA3`                      | Secondary text                                 |
| `--text-faint`   | `#5F6168`                      | Tertiary text, placeholders, labels            |
| `--signal`       | `#C7F95C`                      | The only accent. CTAs, alerts, popped scores   |
| `--signal-dim`   | `#A8DE3F`                      | Signal hover / darker stop in lime gradients   |
| `--signal-soft`  | `rgba(199, 249, 92, 0.12)`     | Signal-tinted backgrounds, pills               |
| `--signal-edge`  | `rgba(199, 249, 92, 0.25)`     | Signal-tinted borders                          |

## Typography

| Family            | Where                                         |
|-------------------|-----------------------------------------------|
| Geist Sans        | All body and headline text                    |
| Geist Mono        | Score numerals and metric numbers (tabular)   |

Loaded via `next/font/google` in `app/layout.tsx`. Exposed as `--font-geist-sans` and `--font-geist-mono`. The `.num-mono` utility in `globals.css` applies mono + tabular-nums.

No italic-for-emphasis. Emphasis is color (`--signal`) or weight, never style.

## Mood Tier Colors

Three tiers. Every mood maps to exactly one tier. One color family per tier.
All gradients use `160deg` angle. All scores render at uniform `32px` — color-only emphasis.

### Bad Day (survival, grinding, scattered)

Near-black ground. Lime score numerals (alarm).

| Mood           | Gradient Start | Gradient End | Text   |
|----------------|----------------|--------------|--------|
| Survival Mode  | `#0B0B0C`      | `#15161A`    | light  |
| Grinding       | `#15161A`      | `#0B0B0C`    | light  |
| Scattered      | `#1F2024`      | `#15161A`    | light  |

### OK Day (autopilot, coasting)

Graphite ground. White score numerals (steady, no alarm).

| Mood           | Gradient Start | Gradient End | Text   |
|----------------|----------------|--------------|--------|
| Autopilot      | `#1F2024`      | `#15161A`    | light  |
| Coasting       | `#1F2024`      | `#15161A`    | light  |

### Good Day (locked-in, flow, victory)

Lime panel. Near-black score numerals (celebratory inversion).

| Mood           | Gradient Start | Gradient End | Text   |
|----------------|----------------|--------------|--------|
| Locked In      | `#C7F95C`      | `#A8DE3F`    | dark   |
| Flow State     | `#C7F95C`      | `#A8DE3F`    | dark   |
| Victory Lap    | `#D6F36B`      | `#A8DE3F`    | dark   |

## Card Design Tokens

### Dark cards (bad + ok tier)

| Token      | Value                              | Usage                       |
|------------|------------------------------------|-----------------------------|
| popNum     | `rgba(199, 249, 92, 0.95)`         | Emphasized score number     |
| popLbl     | `rgba(199, 249, 92, 0.6)`          | Emphasized score label      |
| ghostNum   | `rgba(245, 245, 245, 0.4)`         | De-emphasized score num     |
| ghostLbl   | `rgba(245, 245, 245, 0.35)`        | De-emphasized score label   |
| flatNum    | `rgba(245, 245, 245, 0.85)`        | OK-tier uniform score num   |
| flatLbl    | `rgba(245, 245, 245, 0.55)`        | OK-tier uniform score lbl   |
| moodLabel  | `rgba(199, 249, 92, 0.75)`         | Mood name text              |
| dotColor   | `rgba(199, 249, 92, 0.75)`         | Mood indicator dot          |
| dotGlow    | `0 0 12px rgba(199, 249, 92, 0.35)`| Dot glow                    |
| quote      | `rgba(245, 245, 245, 0.92)`        | Quote text                  |
| source     | `rgba(245, 245, 245, 0.6)`         | Source attribution          |
| subtitle   | `rgba(245, 245, 245, 0.65)`        | Subtitle / punchline        |
| brandTxt   | `rgba(245, 245, 245, 0.22)`        | Brand text                  |
| brandAcc   | `rgba(199, 249, 92, 0.6)`          | Brand "WORK" accent         |
| glowColor  | `rgba(199, 249, 92, 0.08)`         | Ambient glow                |

OK-tier overrides: moodLabel `rgba(245, 245, 245, 0.45)`, dotColor same, no glow.

### Light cards (good tier — lime panel)

| Token      | Value                              | Usage                       |
|------------|------------------------------------|-----------------------------|
| popNum     | `rgba(11, 11, 12, 0.92)`           | Emphasized score number     |
| popLbl     | `rgba(11, 11, 12, 0.7)`            | Emphasized score label      |
| ghostNum   | `rgba(11, 11, 12, 0.45)`           | De-emphasized score num     |
| ghostLbl   | `rgba(11, 11, 12, 0.38)`           | De-emphasized score label   |
| moodLabel  | `rgba(11, 11, 12, 0.75)`           | Mood name text              |
| dotColor   | `rgba(11, 11, 12, 0.75)`           | Mood indicator dot          |
| quote      | `rgba(11, 11, 12, 0.9)`            | Quote text                  |
| source     | `rgba(11, 11, 12, 0.65)`           | Source attribution          |
| subtitle   | `rgba(11, 11, 12, 0.65)`           | Subtitle / punchline        |
| brandTxt   | `rgba(11, 11, 12, 0.32)`           | Brand text                  |
| brandAcc   | `rgba(11, 11, 12, 0.7)`            | Brand "WORK" accent         |
| glowColor  | `rgba(11, 11, 12, 0.06)`           | Ambient glow                |

## Score Emphasis Rules

Scores are always 32px (uniform). Tier determines which pop:

- **Bad tier**: Strain pops (lime), Focus + Balance ghost (faded white)
- **OK tier**: All flat (uniform white, no pop)
- **Good tier**: Focus + Balance pop (near-black on lime), Strain ghosts

## Accent Usage

Lime `#C7F95C` is the only accent. It appears in:

- CTAs and primary buttons
- Popped scores on dark cards
- Mood label + dot on bad-tier cards
- Brand wordmark highlight ("PERSIST**WORK**")
- Section labels, focus rings, status pills

No other accent colors exist. No rose. No sage. No amber. No "rainbow" semantic colors.

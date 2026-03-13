# Persistwork Brand Colors

## Core Palette

| Token          | Hex       | Usage                                      |
|----------------|-----------|---------------------------------------------|
| `--cream`      | `#FBF7F2` | Page background                             |
| `--warm-white` | `#FEFCF9` | Card/section backgrounds                    |
| `--ink`        | `#1C1917` | Primary text, dark UI elements              |
| `--ink-light`  | `#57534E` | Secondary text                              |
| `--ink-faint`  | `#A8A29E` | Tertiary text, placeholders                 |
| `--amber`      | `#E87D3A` | Brand accent, CTAs, highlights              |
| `--amber-light`| `#FDF0E6` | Amber tinted backgrounds                    |
| `--amber-pale` | `#FEF8F2` | Subtle amber wash                           |
| `--border`     | `#E7E0D8` | Dividers, card borders                      |

## Mood Tier Colors (v4)

Three tiers. Every mood maps to exactly one tier. One color family per tier.
All gradients use `160deg` angle. All scores render at uniform `32px` — color-only emphasis.

### Bad Day (survival, grinding, scattered)
Deepened dark ink — near-black. The day is heavy.

| Mood           | Gradient Start | Gradient End | Text   |
|----------------|---------------|--------------|--------|
| Survival Mode  | `#0E0C0B`     | `#1C1917`    | light  |
| Grinding       | `#1C1917`     | `#0E0C0B`    | light  |
| Scattered      | `#2E2B29`     | `#1C1917`    | light  |

### OK Day (autopilot, coasting)
Lightened warm gray — separates from dark backgrounds with a white border.

| Mood           | Gradient Start | Gradient End | Text   |
|----------------|---------------|--------------|--------|
| Autopilot      | `#4A4542`     | `#2E2B29`    | light  |
| Coasting       | `#4A4542`     | `#2E2B29`    | light  |

### Good Day (locked-in, flow, victory)
Pure white to warm cream — 1px dark border for separation on light backgrounds.

| Mood           | Gradient Start | Gradient End | Text   |
|----------------|---------------|--------------|--------|
| Locked In      | `#FFFFFF`     | `#FDF4EC`    | dark   |
| Flow State     | `#FFFFFF`     | `#FDF4EC`    | dark   |
| Victory Lap    | `#FEF6EE`     | `#F5EDE1`    | dark   |

## Card Design Tokens (v4)

### Dark cards (bad + ok tier)

| Token      | Value                           | Usage                     |
|------------|---------------------------------|---------------------------|
| popNum     | `rgba(232,125,58,0.9)`          | Emphasized score number   |
| popLbl     | `rgba(232,125,58,0.55)`         | Emphasized score label    |
| ghostNum   | `rgba(255,255,255,0.40)`        | De-emphasized score num   |
| ghostLbl   | `rgba(255,255,255,0.35)`        | De-emphasized score label |
| flatNum    | `rgba(255,255,255,0.80)`        | OK-tier uniform score num |
| flatLbl    | `rgba(255,255,255,0.55)`        | OK-tier uniform score lbl |
| moodLabel  | `rgba(232,125,58,0.7)`          | Mood name text            |
| dotColor   | `rgba(232,125,58,0.7)`          | Mood indicator dot        |
| dotGlow    | `0 0 12px rgba(232,125,58,0.3)` | Dot glow                  |
| quote      | `rgba(255,255,255,0.92)`        | Quote text                |
| source     | `rgba(255,255,255,0.60)`        | Source attribution        |
| subtitle   | `rgba(255,255,255,0.65)`        | Subtitle / punchline      |
| brandTxt   | `rgba(255,255,255,0.22)`        | Brand text                |
| brandAcc   | `rgba(232,125,58,0.55)`         | Brand "WORK" accent       |
| glowColor  | `rgba(232,125,58,0.07)`         | Ambient glow              |

OK-tier overrides: moodLabel `rgba(255,255,255,0.45)`, dotColor same, no glow.

### Light cards (good tier)

| Token      | Value                           | Usage                     |
|------------|---------------------------------|---------------------------|
| popNum     | `rgba(232,125,58,0.9)`          | Emphasized score number   |
| popLbl     | `rgba(232,125,58,0.55)`         | Emphasized score label    |
| ghostNum   | `rgba(28,25,23,0.45)`           | De-emphasized score num   |
| ghostLbl   | `rgba(28,25,23,0.38)`           | De-emphasized score label |
| moodLabel  | `rgba(232,125,58,0.65)`         | Mood name text            |
| dotColor   | `rgba(232,125,58,0.65)`         | Mood indicator dot        |
| quote      | `rgba(28,25,23,0.88)`           | Quote text                |
| source     | `rgba(28,25,23,0.65)`           | Source attribution        |
| subtitle   | `rgba(28,25,23,0.65)`           | Subtitle / punchline      |
| brandTxt   | `rgba(28,25,23,0.28)`           | Brand text                |
| brandAcc   | `rgba(232,125,58,0.7)`          | Brand "WORK" accent       |
| glowColor  | `rgba(232,125,58,0.08)`         | Ambient glow              |

## Dashboard Text Colors

| Element | Value |
|---|---|
| Section headers (e.g. "WHY VICTORY?") | `#78716C` |
| Metric row labels | `#57534E` |
| De-emphasised metric numbers | `#57534E` |
| Metric row chevrons | `#E87D3A` |

## Score Emphasis Rules

Scores are always 32px (uniform). Tier determines which pop in amber:
- **Bad tier**: Strain pops, Focus + Balance ghost
- **OK tier**: All flat (no pop, no ghost — uniform white)
- **Good tier**: Focus + Balance pop, Strain ghosts

## Accent Usage

Amber (`#E87D3A`) is the only accent color. It appears in:
- CTAs and buttons
- Popped scores on cards (amber at 0.9 opacity)
- Mood label + dot on dark cards
- Brand wordmark highlight ("PERSIST**WORK**")
- Section labels and eyebrow tags

## Semantic Colors (landing page only)

Used for insight cards and calendar events, not in the card system:

| Token      | Hex       | Purpose              |
|------------|-----------|----------------------|
| `--sage`   | `#5A7A5C` | Balance / green      |
| `--rose`   | `#C0544A` | Strain / red         |

These do NOT appear on share cards. Cards use only the tier palette above.

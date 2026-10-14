# Playtest 2 — flows per month (A2, input for L)

Measured by `node tools/economy.js --games 30 --styles random,balanced,social,cautious --per month` after step 2b and A1 (bots on their own RNG, the preview fix). Per month played, averaged over 30 games a style. Every change is accounted for: the report's `(unaccounted)` row is empty. `rel` and `spark` sum over all characters. Re-run it after each L package; this file is a snapshot, not a target.

Final values are p10 / p50 / p90 at the end of the run.

## random (40.1 months a game)

Endings: graduate 27%, barely 23%, quiet_departure 20%, sent_home 10%, hollow_claimed 7%, archmage 7%.

| Attribute | Final p10/p50/p90 | In / month | Out / month | Largest sources (per month) |
|---|---|---|---|---|
| health | 9 / 43 / 69 | +6.5 | -7.3 | Rest +4.8; cards: story +0.3 -1.7; cards: place +0.5 -1.5; cards: social +0.1 -0.9 |
| mood | 0 / 66 / 100 | +17.3 | -17.4 | cards: place +4.7 -2.5; cards: story +2.9 -3.6; cards: social +3.6 -2.0; cards: ambient +1.8 -1.2 |
| mana | 50 / 64 / 81 | +5.5 | -4.6 | Mana returns +5.3 -0.0; Exam nerves  -2.5; cards: place +0.1 -0.6; cards: story +0.1 -0.5 |
| renown | 10 / 20 / 38 | +4.0 | -3.6 | Fading gossip  -3.0; cards: story +1.3 -0.1; cards: place +0.6 -0.3; cards: social +0.8 -0.1 |
| alignment | -11 / 8 / 38 | +1.3 | -1.1 | cards: place +0.4 -0.4; cards: story +0.5 -0.2; cards: social +0.3 -0.2; cards: ambient +0.1 -0.2 |
| gold | 0 / 4 / 32 | +9.7 | -10.2 | cards: story +2.2 -1.0; Dormitory & board  -3.1; cards: place +1.6 -1.2; cards: ambient +1.4 -1.1 |
| arcana | 30 / 53 / 81 | +1.2 | -0.1 | Coursework +0.3; cards: track course +0.2 -0.0; cards: place +0.2; rust and discovery  -0.1 |
| lore | 31 / 65 / 81 | +1.3 | -0.0 | cards: place +0.3; Hollow Dreams +0.2; cards: social +0.2; cards: track course +0.1 |
| alchemy | 19 / 40 / 72 | +1.0 | -0.2 | Coursework +0.3; cards: place +0.2; rust and discovery  -0.2; cards: track course +0.1 |
| charm | 43 / 59 / 80 | +1.3 | -0.1 | Coursework +0.3; cards: place +0.3; cards: social +0.2; cards: plan +0.1 |
| vigor | 29 / 46 / 66 | +1.1 | -0.2 | cards: place +0.3; Coursework +0.2; cards: social +0.1; rust and discovery  -0.1 |
| guile | 26 / 51 / 71 | +1.2 | -0.1 | Coursework +0.3; cards: place +0.2 -0.0; cards: social +0.2; cards: story +0.1 |
| rel | 96 / 100 / 100 | +16.1 | -5.1 | cards: social +10.1 -2.1; cards: story +2.9 -0.4; relationship drift +0.4 -1.9; cards: ambient +1.1 -0.2 |
| spark | 17 / 85 / 100 | +9.1 | -6.7 | cards: social +6.9 -1.1; relationship drift  -4.2; cards: story +1.1 -1.5; cards: place +0.6 -0.0 |

## balanced (48.0 months a game)

Endings: archmage 33%, alchemist 23%, graduate 17%, shadow 10%, merchant 7%, barely 7%.

| Attribute | Final p10/p50/p90 | In / month | Out / month | Largest sources (per month) |
|---|---|---|---|---|
| health | 63 / 72 / 88 | +5.0 | -5.0 | Rest +2.9; cards: place +0.4 -1.1; cards: social +0.3 -1.0; cards: ambient +0.5 -0.4 |
| mood | 100 / 100 / 100 | +10.0 | -9.2 | cards: place +2.1 -1.1; cards: social +1.6 -1.2; Someone to come home to +2.4; cards: story +1.5 -0.7 |
| mana | 71 / 79 / 90 | +6.3 | -5.3 | Mana returns +6.1 -0.0; Exam nerves  -2.5; cards: story +0.1 -0.7; cards: place +0.1 -0.5 |
| renown | 28 / 57 / 69 | +6.7 | -5.7 | Fading gossip  -5.1; cards: story +2.5 -0.0; cards: social +1.5 -0.1; cards: ambient +1.0 -0.1 |
| alignment | -41 / -11 / 8 | +1.1 | -1.4 | cards: story +0.6 -0.5; cards: social +0.3 -0.4; cards: ambient +0.1 -0.2; cards: place +0.1 -0.2 |
| gold | 6 / 50 / 319 | +13.3 | -11.9 | Dormitory & board  -4.3; cards: story +2.7 -1.4; cards: ambient +2.4 -1.0; cards: track job +3.0 -0.0 |
| arcana | 62 / 77 / 100 | +1.5 | -0.1 | cards: track course +0.2 -0.0; cards: story +0.2; Coursework +0.2; cards: place +0.2 |
| lore | 53 / 67 / 79 | +1.2 | -0.0 | Hollow Dreams +0.2; cards: story +0.2; cards: social +0.1; cards: place +0.1 |
| alchemy | 40 / 67 / 81 | +1.3 | -0.1 | Coursework +0.3; cards: place +0.2; cards: track course +0.2; cards: track club +0.1 |
| charm | 55 / 71 / 91 | +1.4 | -0.1 | Coursework +0.3; cards: place +0.3; cards: track course +0.2; cards: social +0.2 |
| vigor | 40 / 55 / 82 | +1.1 | -0.1 | cards: social +0.2; cards: place +0.2; Coursework +0.2; cards: track course +0.2 |
| guile | 46 / 69 / 81 | +1.3 | -0.1 | cards: place +0.3; Coursework +0.2; cards: social +0.2; cards: track course +0.1 |
| rel | 100 / 100 / 100 | +18.8 | -6.1 | cards: social +11.5 -2.5; cards: story +3.7 -0.3; relationship drift +0.4 -2.4; cards: ambient +1.4 -0.1 |
| spark | 85 / 97 / 100 | +17.1 | -12.0 | cards: social +12.7 -1.2; relationship drift  -10.8; cards: story +2.9; cards: place +0.7 -0.0 |

## social (47.8 months a game)

Endings: archmage 27%, graduate 20%, alchemist 17%, teacher 10%, sent_home 10%, wanderer 7%.

| Attribute | Final p10/p50/p90 | In / month | Out / month | Largest sources (per month) |
|---|---|---|---|---|
| health | 14 / 33 / 53 | +6.8 | -7.6 | Rest +5.0; cards: story +0.3 -2.0; cards: place +0.4 -1.7; cards: social +0.2 -1.2 |
| mood | 65 / 98 / 100 | +18.7 | -18.2 | cards: social +5.7 -2.8; cards: story +2.7 -3.5; cards: place +3.8 -2.3; Someone to come home to +2.9 |
| mana | 60 / 75 / 86 | +5.6 | -4.7 | Mana returns +5.5 -0.0; Exam nerves  -2.5; cards: place +0.1 -0.6; cards: story +0.1 -0.4 |
| renown | 18 / 29 / 46 | +4.5 | -4.1 | Fading gossip  -3.4; cards: story +1.4 -0.1; cards: social +1.2 -0.3; cards: ambient +0.7 -0.1 |
| alignment | 21 / 48 / 84 | +1.8 | -0.9 | cards: story +0.8 -0.2; cards: place +0.5 -0.4; cards: social +0.3 -0.0; cards: ambient +0.2 -0.1 |
| gold | 0 / 13 / 62 | +11.2 | -11.3 | Dormitory & board  -3.3; cards: place +1.9 -1.4; cards: story +2.1 -1.0; cards: track job +2.8 -0.0 |
| arcana | 40 / 71 / 92 | +1.4 | -0.1 | Coursework +0.3; cards: track course +0.3 -0.0; cards: place +0.2; cards: social +0.2 |
| lore | 54 / 68 / 86 | +1.2 | -0.0 | Hollow Dreams +0.3; cards: place +0.2; cards: social +0.2; cards: track course +0.1 |
| alchemy | 43 / 64 / 88 | +1.3 | -0.1 | Coursework +0.3; cards: place +0.2; cards: social +0.2; cards: track course +0.2 |
| charm | 52 / 72 / 86 | +1.3 | -0.1 | Coursework +0.3; cards: place +0.3; cards: social +0.2; cards: plan +0.1 |
| vigor | 43 / 60 / 77 | +1.2 | -0.1 | Coursework +0.3; cards: place +0.2; cards: social +0.2; cards: track course +0.1 |
| guile | 39 / 52 / 70 | +1.1 | -0.1 | cards: place +0.2; Coursework +0.2; cards: social +0.2; cards: ambient +0.1 |
| rel | 100 / 100 / 100 | +20.8 | -4.7 | cards: social +13.2 -1.5; cards: story +3.7 -0.3; relationship drift +0.3 -2.5; cards: ambient +1.4 -0.1 |
| spark | 85 / 94 / 100 | +15.2 | -12.5 | cards: social +11.5 -0.4; cards: story +2.0 -7.1; relationship drift  -5.0; cards: place +0.9 |

## cautious (47.3 months a game)

Endings: graduate 40%, barely 20%, alchemist 17%, scholar 7%, sent_home 7%, shadow 3%.

| Attribute | Final p10/p50/p90 | In / month | Out / month | Largest sources (per month) |
|---|---|---|---|---|
| health | 24 / 50 / 72 | +6.8 | -7.3 | Rest +5.1; cards: story +0.3 -1.7; cards: place +0.3 -1.6; cards: social +0.2 -0.8 |
| mood | 30 / 71 / 100 | +17.7 | -17.6 | cards: story +3.4 -3.3; cards: place +4.1 -2.6; cards: social +3.5 -1.8; cards: ambient +1.9 -1.1 |
| mana | 61 / 68 / 76 | +5.6 | -4.8 | Mana returns +5.5 -0.0; Exam nerves  -2.5; cards: story +0.0 -0.6; cards: place +0.1 -0.5 |
| renown | 12 / 26 / 38 | +4.2 | -3.8 | Fading gossip  -3.5; cards: story +1.5 -0.0; cards: social +0.8 -0.1; cards: ambient +0.7 -0.0 |
| alignment | 25 / 51 / 69 | +1.6 | -0.7 | cards: story +0.7 -0.2; cards: place +0.4 -0.2; cards: social +0.3 -0.1; cards: ambient +0.2 -0.1 |
| gold | 0 / 14 / 135 | +10.7 | -10.6 | Dormitory & board  -3.5; cards: story +2.0 -1.0; cards: track job +2.8; cards: ambient +1.2 -1.4 |
| arcana | 42 / 56 / 72 | +1.1 | -0.1 | Coursework +0.3; cards: track course +0.2; cards: place +0.2; rust and discovery  -0.1 |
| lore | 53 / 71 / 85 | +1.3 | -0.0 | cards: place +0.3; Hollow Dreams +0.2; cards: social +0.2; cards: track course +0.1 |
| alchemy | 32 / 57 / 84 | +1.2 | -0.2 | Coursework +0.4; cards: place +0.3; cards: track course +0.2; rust and discovery  -0.2 |
| charm | 47 / 66 / 84 | +1.3 | -0.1 | Coursework +0.3; cards: place +0.2; cards: social +0.1; cards: ambient +0.1 |
| vigor | 42 / 54 / 71 | +1.1 | -0.2 | cards: place +0.3; Coursework +0.3; cards: social +0.1; rust and discovery  -0.1 |
| guile | 37 / 51 / 72 | +1.0 | -0.1 | Coursework +0.2; cards: place +0.2 -0.0; cards: social +0.2; cards: story +0.1 |
| rel | 100 / 100 / 100 | +15.5 | -5.6 | cards: social +9.4 -2.4; cards: story +2.9 -0.5; relationship drift +0.4 -1.9; cards: ambient +1.0 -0.2 |
| spark | 37 / 85 / 100 | +8.2 | -6.0 | cards: social +6.2 -0.7; relationship drift  -4.2; cards: story +1.0 -1.1; cards: place +0.6 -0.0 |


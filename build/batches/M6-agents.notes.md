# M6: the arc's agents (threads 2)

File: `content/events/hollowstar/agents.grim`. It holds two `@appointment`s, each with a pool of `trigger: queued`, `class: story`, `arc: hollowstar` cards: 10 cards in all.

## Wiring and plot safety

- **No `find` and no `advance` anywhere.** The cards court and watch; they reveal nothing about the door, the seal or the Star beyond what the beats have already shown.
- **`arc: hollowstar`:** the cards end when the arc closes (`arcClosed`). With `limit: plot`, they share the month's plot-card cap, after the beats (core appointments deal first), so they never crowd out a beat.
- **`grey_courts`**, which requires:
  - `seen(hs_grey_stranger) > 0`, so you have seen him (the beat-2 climax of Act I);
  - `flag(hollow_courted)` or `flag(hollow_tempted)`, set by `hs_grey_invitation`, `hs_grey_offer`, `hs_grey_tests` or `hs_grey_return`;
  - `alignment <= -30`;
  - not `flag(grey_beaten)`, from `hs_grey_daylight`;
  - not `flag(sided_wardens)`.

  Its five cards: `ga_grey_gloves`, `ga_grey_board`, `ga_grey_witness`, `ga_grey_answer` and `ga_grey_ice_seat`.
- **`wardens_watch`**, which requires:
  - `flag(wardens_noticed)` (from `hs_wardens_notice`) or `flag(sided_wardens)`;
  - `alignment >= 30`;
  - not `flag(sided_dumonts)`;
  - not `flag(hollow_courted)`.

  Its five cards: `wa_tower_light`, `wa_lake_word`, `wa_isolde_list`, `wa_thorne_margin` and `wa_maud_lantern`.
- **Thorne and Maud speak as Wardens** (their silver rings) only once `hs_silver_rings` (beat 4, Act II) has shown the three rings, so their cards gate on it.
- **Isolde's secret fact** (`isolde.thread`, that the seal is weakening) is never stated. She says only "the lake is cold this time of year". Maud's secret (Edmund) and her personal fact (a student sixty years ago) aren't touched. She goes quiet once at a bend with a view of the lake, and nothing more is said.
- Every option carries an alignment `hint:` where it moves alignment, as the existing agent cards do.

## Measured

20 games per style; per game.

| Style | Months the condition holds | Cards | Per year of holding |
|---|---|---|---|
| hollow | 17.8 (17 of 20 games) | 2.2 | about 1.5 |
| aggressive | 7 | 0.3 | |
| lumen | 6.2 (10 of 20 games) | 1.2 | about 2.3 |

With `chance: slim` the plot cap held them to 1.2 and 0.2 a game, so both are `unlikely`.

## Retrieval

**`search` before drafting.** These existing agent cards were read and are not repeated:
- `hs_grey_offer` (the velvet box), `hs_grey_return` (the letter under the jetty plank), `hs_grey_invitation` (the black-star letter, the boathouse cups), `hs_grey_tests` (the infirmary argument), `grey_on_the_shore` (the upturned boat), `hs_grey_daylight`;
- `hs_wardens_notice` (the list on the stair), `hs_silver_rings`, `hs_isolde_summons`.

**`related --draft`, per card:**
- **`wa_thorne_drill`** (extra ward practice at dawn, "Again on Thursday") repeated `thorne_office_hours`, so it became `wa_thorne_margin`: one pencilled line on your ward diagram.
- **`ga_grey_gloves`** vs `kael_gloves` (gloves you give Kael): a different premise.
- **`ga_grey_ice_seat`** and **`ga_grey_witness`** vs `court_fountain_freeze` (a first-year licking a frozen fountain): the frozen fountain is his canonical sign; the premises differ.
- **`wa_isolde_list`** vs `hs_wardens_notice`: that card is where she mentions the list; here you see it, with a name crossed out.

## Round 1 critic fixes

- **`ga_grey_answer`** (repeating `grey_on_the_shore`) is replaced by **`ga_grey_question`**. At supper, with every jug iced, he sits at the end of your bench, unseen by the others, and asks what you want most. You answer truthfully (Hollow) or lie (`guile`, a little Lumen). There is no frosted look-back. `related --draft` points to `y3_interview_question` (truth or lie in an interview), a different scene.
- **No `repeat:`** on either pool: every card shows once.
- **Slots** replace `time:` (pushed cards go where `slot:` says): `wa_tower_light` night, `ga_grey_ice_seat` morning, `wa_maud_lantern` evening.
- **`ga_grey_board`:** `board_missed == 0`.
- **`ga_grey_gloves`:** the gloves are gone from the chair in the morning, so there is no lasting item.
- **`wa_lake_word`:**
  - Gated on not `sided_wardens` and not having seen `hs_isolde_summons`.
  - The refusal costs `mood -tiny`, not rel.
- **`wa_maud_lantern`:** the hidden health cost is gone, and the lantern goes back to her in both endings, so there is no item.
- **`wa_isolde_list`:** closed on the card: "Someone who changed their mind. People do. It's allowed."
- **`wa_tower_light`:** reworded.
- **The Thorne card** became **`wa_thorne_note`**: carry a sealed note to Maud, by hand, tonight, or at first light.
  - The arcana-essay version needed a course.
  - The margin note was close to `thesis_margin_notes`.
  - "Ask what's in it" was close to `favour_vey_letter`.

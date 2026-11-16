# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Cast

### Lyra Vaneshade (`lyra`)

she/her · age 19 · student year 1 · Emberhall · romanceable

*Heir of House Vaneshade, pyromancy prodigy*

Brilliant, impatient and used to winning. She treats everyone as either a rival or furniture — and is quietly lonely about it.

**Voice:** Clipped and formal; sarcastic when hurt. Never says "please" first, never admits to being tired, apologises by doing something useful.

**Traits:** proud, ambitious, lonely, stubborn · **Interests:** duelling, fire, books

**Stats:** arcana 34, lore 22, alchemy 8, charm 20, vigor 28, guile 12, wealth 5

**Schedule:** The Duelling Hall (afternoon, evening); The Refectory (noon); The Library (night, 60% of days)

**On breaks:** The Duelling Hall (afternoon, evening); The Library (night, 40% of days); Vaneshade House (noon, afternoon, evening); The Royal Gardens (noon, 40% of days); The Theatre (evening, 30% of days)

**Relations:** Kael Dumont -10, Bram Hollis +5, Nessa Quill -5

**Facts:**
- [surface] The pyromancy prodigy of House Vaneshade. Everyone knows the name, and she makes sure of it. (`lyra.prodigy`)
- [personal] She can incinerate a target at forty paces. She cannot make toast. (`lyra.toast`, known when `seen(lyra_toast) > 0`)
- [personal] Her mother has never once told her "well done". (`lyra.mother`, known when `rel(lyra) >= 18`)
- [personal] She came second in the Winter Trials once. Her mother wrote to ask who beat her. (`lyra.second_place`, known when `seen(lyra_letter) > 0`)
- [secret] She studies until she collapses, and begs you not to let her mother find out. (`lyra.burnout`, known when `seen(lyra_burnout) > 0`)
- [personal] You are the only person here who makes her better. She hates it. She doesn't want it to stop. (`lyra.rival`, known when `bond(lyra) == "rival"`)
- [secret] Her mother threatened her inheritance over you. She set the letter on fire. (`lyra.inheritance`, known when `flag(lyra_free)`)
- [personal] Vaneshades sleep exactly eight hours; she can't sleep. Her grandmother's spell, Wildfire, was only for people she trusted, and Lyra has never had anyone to teach it to. (`lyra.wildfire`, known when `seen(lyra_become_close) > 0`)
- [personal] Her family has opened its duels with the same ribbon-of-flame flourish for two hundred years. Teaching it outside the family is not done. (`lyra.flourish`, known when `seen(lyra_teach_spell) > 0`)
- [personal] At Vaneshade House she sleeps on a camp bed in the scorched practice room. Her real bedroom, downstairs, is kept for visitors to see. (`lyra.camp_bed`, known when `seen(vaneshade_practice_room) > 0`)
- [personal] Mrs Callow, the cook at Vaneshade House, has made her toast every morning she has ever spent at home, and is the only person in the house who calls her Lyra. Lyra has written to her every week since she went away to school. (`lyra.cook`, known when `seen(vaneshade_kitchen_toast) > 0`)
- [personal] Her grandmother is the only Vaneshade in the gallery who is smiling. She lit candles by telling them bad jokes: fire, she said, likes to be surprised. (`lyra.grandmother`, known when `seen(vaneshade_portrait_gallery) > 0`)

## Place: Vaneshade House (`vaneshade_house`)

capital · open noon, afternoon, evening

Black stone on the Crescent, a black seal over the door, and a footman who looks at your boots first. Lyra lives here, in a manner of speaking.

## Already written here (54)

- `lyra_who_beat_her` Who Beat Her (routine)
- `lyra_well_done` Well Done (routine)
- `lyra_study_hall_truce` The Study Hall Truce (routine)
- `lyra_become_close` Let It Run (milestone)
- `lyra_rankings_war` The Rankings War (routine)
- `lyra_sabotage_returned` Pink Bubbles, Returned (routine)
- `lyra_glove_thrown` The Glove Thrown (routine)
- `lyra_allies_thornwick` Allies, for an Afternoon (routine)
- `lyra_mother_watches` Her Mother Watches You Win (routine)
- `lyra_rival_letter` A Rival's Letter (routine)
- `lyra_last_match` The Last Rankings (routine)
- `lyra_on_thornwick` Lyra on Thornwick (routine)
- `pyro_lyra_spar` A Challenge in Class (routine)
- `duel_lyra_training` Training Partners (routine)
- `lyra_toast` Lyra Cannot Cook (routine)
- `lyra_mother_visit` Lady Vaneshade (routine)
- `lyra_rival_respect` Respect, Grudgingly (milestone)
- `y3_last_duel` One Last Duel (routine)
- `nudge_brace` Your Name on the Board (routine)
- `vaneshade_practice_room` The Room Upstairs (routine)
- `vaneshade_kitchen_toast` Nineteen Years of Toast (routine)
- `vaneshade_supper_alone` A Table for Twenty (routine)
- `vaneshade_portrait_gallery` The One Who Laughed (routine)
- `lyra_capital_promenade` Being Seen (routine)
- `vaneshade_house_quiet_hour` The Black Seal (routine)
- `lyra_intro` The Last Copy (routine)
- `lyra_letter` A Letter With a Black Seal (routine)
- `lyra_study_rivalry` Top of the Class (routine)
- `lyra_family_gala` The Vaneshade Winter Gala (routine)
- `lyra_confession` Lyra Doesn't Lose (milestone)
- `lyra_family_ultimatum` The Ultimatum (routine)
- `lyra_rival_sabotage` Sabotage in Class (routine)
- `lyra_burnout` Lyra Falls (routine)
- `duelling_refereeing_lyra` Refereeing Lyra (routine, rank 2)
- `lyra_date_dawn_duel` A Duel for Two (routine)
- `letter_lyra_drills` A List of Drills (routine)
- `letter_lyra_book` Foundations of Flame (routine)
- `ring_cameo_lyra` Someone Worth Losing To (routine)
- `lyra_ring_word` Lyra Has Heard (incident)
- `lyra_rival_seat` The Table by the Window (routine)
- … and 14 more (`grim query event 'place == "vaneshade_house"'`)

## Lore

- **Vaneshade** (`vaneshade`, soft): House Vaneshade is old pyromancer nobility. Its letters carry a black seal; its winter gala is an inspection disguised as a party; its duellists carry pale family wands and open every duel with the same flame flourish they have used for two hundred years. Vaneshades sleep exactly eight hours. Lady Vaneshade's highest praise is "Adequate"; she has a velvet chair reserved at her daughter's bouts, and it stays empty. Vaneshade House stands on the Crescent in the capital: black stone, a scorched practice room on the second floor, a long gallery of portraits in which every Vaneshade but one is unsmiling (the exception is Lyra's grandmother, who made Wildfire), and a kitchen run for thirty years by Mrs Callow, the cook.
- **Hollis** (`hollis_family`, soft): Bram's father was a prefect and head boy at Lumenhold; his portrait hangs in the corridor of head boys, and he stops in front of it on every visit. He has never stopped telling his son he will not amount to anything. Hollis House is a narrow, very correct house on the capital's uptown side, with a polished plate on the door, a piano that is played at noon, and, when she visits, Bram's older sister Hester, who is twenty-three, sharp-tongued, went to Thornwick against her father's wishes and is the only member of the family who isn't afraid of him.
- **the house on the Crescent** (`crescent_house`, soft): The tallest house on the Crescent belongs to a shipowner who bought his way up the hill from Port Calder's wharves. Every week he's in town he gives a ball, a garden ball in summer, to prove he belongs there; the old Crescent families come for his supper table and say what they like on the way home. Much of his fortune came up the hill by the bonded warehouses' side door, from the foreman's second set of figures.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Cast

### Mir Ten (`mir`)

they/them · age 19 · student year 1 · Brasswick · romanceable

*Artificer of questionable inventions*

Smells permanently of solder and ozone. Has built a clockwork owl, a self-stirring cauldron and at least one small fire.

**Voice:** Fast, enthusiastic, full of technical tangents and exclamation marks. Talks to machines more gently than to people. Says "probably" a lot.

**Traits:** chaotic, curious, stubborn, funny · **Interests:** machines, clocks, flying

**Stats:** arcana 24, lore 20, alchemy 30, charm 14, vigor 10, guile 12, wealth 3

**Schedule:** Mir's Workshop (afternoon, evening, night); The Refectory (noon, 50% of days); The Lecture Tower (morning)

**On breaks:** Mir's Workshop (afternoon, evening, night); The Ten Clockworks (noon, afternoon, evening); The Grand Bazaar (noon, 30% of days)

**Relations:** Tobias Fennick +10

**Facts:**
- [surface] An artificer who smells of solder and ozone and has started at least one small fire. (`mir.artificer`)
- [personal] Built a clockwork owl that remembers deadlines, birthdays and, slightly, grudges. (`mir.owl`, known when `seen(mir_owl_gift) > 0`)
- [personal] Three years of notebooks are the most precious things they own. (`mir.notebooks`, known when `rel(mir) >= 12`)
- [personal] Their family runs a clockworks and thinks invention is a hobby. It is not a hobby. (`mir.family`, known when `seen(mir_family_business) > 0`)
- [secret] Nobody ever remembered their name day before. (`mir.name_day`, known when `seen(mir_name_day) > 0`)
- [personal] After the third fire in a term, the faculty padlocked their workshop. (`mir.workshop`, known when `seen(mir_workshop_closed) > 0`)
- [personal] Locked out of a workshop, they will solder on the corridor floor for a week rather than stop. It's character-building, they say. (`mir.corridor`, known when `seen(mir_padlock) > 0`)
- [personal] At the family bench Mir works "properly": slow, silent and perfect, the way they never do at the castle. Their real workshop at home is a cupboard under the attic stairs. (`mir.properly`, known when `seen(clockworks_long_bench) > 0`)
- [secret] Their father keeps every invention Mir made as a child in a drawer marked "M.", labelled and oiled. He has never mentioned it to them. (`mir.drawer`, known when `seen(clockworks_drawer) > 0`)
- [personal] Their older sister Greta will inherit the clockworks and is very good at it. She has never once been allowed to set anything on fire. (`mir.sister`, known when `seen(clockworks_greta) > 0`)

## Place: The Ten Clockworks (`ten_clockworks`)

capital · open noon, afternoon, evening

A workshop and a house in one, among the works chimneys: forty clocks all ticking, a family at the long bench, and Mir's old room above the shop.

## Already written here (33)

- `mir_small_fire` A Small Fire (routine)
- `mir_padlock` The Padlock (routine)
- `mir_family_clocks` Not a Hobby (routine)
- `art_mir_collab` A Joint Project (routine)
- `mir_ornithopter` The Test Flight (routine)
- `mir_lab_fire` Fire in the Workshop (routine)
- `mir_name_day` Mir's Name Day (routine)
- `clockworks_long_bench` Properly (routine)
- `clockworks_drawer` The Drawer Marked M. (routine)
- `clockworks_greta` The Proper One (routine)
- `mir_capital_brass` Brass by the Pound (routine)
- `ten_clockworks_quiet_hour` Forty Clocks (routine)
- `hint_ashwood_bite` It Bit Me (routine)
- `mir_intro` An Explosion in the West Wing (routine)
- `mir_owl_gift` A Present With Gears (routine)
- `mir_fair` The Artificers' Fair (routine)
- `mir_workshop_closed` The Workshop Is Shut (routine)
- `mir_dance_machine` The Dancing Machine (routine)
- `mir_confession` Blueprint (milestone)
- `mir_family_business` The Family Clockworks (routine)
- `mir_date_invention` They Built You Something (routine)
- `letter_mir_blueprint` A Letter That Folds Itself (routine)
- `letter_mir_ticking` Something That Ticks (routine)
- `mir_owl_remembers` The Owl Remembers (routine)
- `mir_notebooks` The Notebooks (routine)
- `mir_blueprints` Blueprints (routine)
- `mir_tinkering_evenings` Tinkering Evenings (routine)
- `mir_not_a_hobby` Not a Hobby (routine)
- `mir_family_summons` The Family Wants to Meet You (story)
- `mir_ex` The Owl Holds a Grudge (milestone)
- `mir_gift_given` A Gift With Gears (routine)
- `mir_birthday` Not a Birthday (routine)
- `mir_teaches_contraption` It Probably Works (milestone)

## Lore

- **Ten family** (`ten_clockworks`, soft): Mir's family runs a clockworks, calls invention a hobby and expects Mir home. After a persuasive letter, Mir's mother agreed: "Fine. Win a prize": the guild medal for young artificers. The family keeps name days, not birthdays; Mir's father shows almost nobody the escapement of his clocks. The Ten Clockworks is a workshop and a house in one in the capital's works quarter, with forty clocks on its walls and a long family bench where work is done properly: slowly, silently and perfectly. Mir's older sister Greta will inherit it, and is very good at it.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Cast

### Corvin Ashby (`corvin`)

he/him · age 19 · student year 1 · Duskgate · romanceable

*Charming liability*

Knows every locked door in the academy and has opinions about all of them. Owes money to at least three people.

**Voice:** Quick, teasing, deflecting with jokes; calls you "saint" when you're being good. When he means something, the jokes stop and so does he.

**Traits:** charming, reckless, loyal, secretive · **Interests:** maps, locks, cards, money

**Stats:** arcana 16, lore 12, alchemy 14, charm 30, vigor 18, guile 38, wealth 1

**Schedule:** The Courtyard (noon, afternoon); The Third Gargoyle (night); The Third Gargoyle (midnight, 40% of days); The Gilded Newt (evening)

**On breaks:** The Gilded Newt (afternoon, evening); The Third Gargoyle (night); The Third Gargoyle (midnight, 50% of days); Ashby Lane (evening, night); The Fish Market (noon, 40% of days); The Docks (afternoon, 40% of days)

**Relations:** Bram Hollis -30, Nessa Quill +10

**Facts:**
- [surface] Knows every locked door in the academy and owes money to at least three people. (`corvin.locks`)
- [personal] He is on his last warning. One more detention and they send him home, and home is not a good place. (`corvin.last_warning`, known when `seen(corvin_rooftop) > 0`)
- [secret] His brother turns up for money and threatens to tell the headmistress where Corvin learned to pick locks. (`corvin.brother`, known when `seen(corvin_brother) > 0`)
- [personal] His grandfather's lucky deck sat in the confiscation vault for decades. It really is lucky. (`corvin.grandfather`, known when `seen(corvin_confiscation_vault) > 0`)
- [secret] He runs the Midnight Cartographers, the club that doesn't exist. (`corvin.cartographers`, known when `member(cartographers)`)
- [personal] He once owed thirty crowns to trolls and offered to pay you back with a goat. (`corvin.trolls`, known when `seen(corvin_debt) > 0`)
- [personal] His grandfather could find a lost thing in any house, and taught him to shuffle on rainy Sundays. He's the one person Corvin talks about without a joke. (`corvin.sundays`, known when `seen(corvin_lucky_deck) > 0`)
- [secret] The Cartographers' last Keeper left him the Master Map this summer. Whoever draws two lines in its old blanks keeps it with him. (`corvin.master_map`, known when `flag(carto_map_chain)`)
- [personal] Everyone on Ashby Lane knows him, lends him nothing, and would hide him from the watch without being asked. (`corvin.lane`, known when `seen(ashby_the_chair) > 0`)
- [secret] He sends his mother money he doesn't have, left on her windowsill at night, so that he doesn't have to go in. (`corvin.sill`, known when `seen(ashby_coins_on_the_sill) > 0`)

## Place: Ashby Lane (`ashby_lane`)

capital · open morning, noon, afternoon, evening, night

A crooked lane in Port Calder where the houses lean together and everyone knows the Ashbys. Corvin doesn't talk about it. Now you know why, or will.

## Already written here (46)

- `feud_ledger_war` Say Please (story)
- `corvin_lock_lesson` Every Door (routine)
- `corvin_takes_the_blame` One More Detention (routine)
- `corvin_cartographer_hint` The Club That Doesn't Exist (routine)
- `corvin_locked_out` Locked Out (routine)
- `corvin_bad_odds` Bad Odds (routine)
- `carto_map_blanks` The Blanks on the Map (routine)
- `carto_map_keeper` The Keeping of the Map (milestone)
- `alch_corvin_market` A Side Business (routine)
- `carto_invite` An Invitation at Midnight (routine)
- `corvin_confiscation_vault` The Confiscation Vault (routine)
- `corvin_brother` Corvin's Brother (routine)
- `corvin_cards` How to Cheat at Cards (routine)
- `heard_corvin_bram` Corvin on Bram (routine)
- `ashby_the_chair` The Chair on the Step (routine)
- `ashby_coins_on_the_sill` Coins on the Sill (routine)
- `ashby_lost_ring` Like His Grandad (routine)
- `corvin_capital_quay` Good Hands (routine)
- `ashby_lane_quiet_hour` The Crooked Lane (routine)
- `corvin_intro` Light Fingers (routine)
- `corvin_kitchen_raid` The Kitchen Raid (routine)
- `corvin_debt` Corvin's Little Problem (routine)
- `corvin_repays` Interest (story)
- `corvin_rooftop` Up on the Roof (routine)
- `corvin_framed` Corvin Is Framed (routine)
- `corvin_confession` Corvin, Serious for Once (milestone)
- `corvin_runaway` Let's Leave Tonight (story)
- `cartographers_inking_night` Inking Night (routine)
- `cartographers_silver_pen` A Pen of Your Own (milestone)
- `corvin_date_rooftop_supper` Supper on the Roof (routine)
- `letter_corvin_bakery` The Best Bakery in the Kingdom (routine)
- `letter_corvin_no_jokes` A Letter With No Jokes (routine)
- `ring_cameo_corvin` A Familiar Grin (routine)
- `corvin_note_was_mine` Second Timetable (milestone)
- `corvin_midnight_watch` Corvin Keeps Watch (routine)
- `corvin_lucky_deck` The Lucky Deck (routine)
- `corvin_last_warning` Last Warning (routine)
- `corvin_route_named` A Route Named After You (routine)
- `corvin_goat_clause` The Goat Clause (routine)
- `corvin_lock_left_open` A Lock Left Open (routine)
- … and 6 more (`grim query event 'place == "ashby_lane"'`)

## Lore

- **Ashby** (`ashby_family`, soft): Corvin's grandfather could find a lost thing in any house, taught Corvin to shuffle on rainy Sundays, and owned a genuinely lucky deck of cards that later sat in the confiscation vault. Corvin's brother turns up at the gates wanting money. Home, Corvin says, is not a good place. It is Ashby Lane in Port Calder, the crooked lane his family has lived in long enough to give it a name: his mother still takes in washing there, his grandfather's chair still stands on the step, and the lane knows Corvin, lends him nothing and would hide him from the watch without being asked.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Cast

### Seraphine Hale (`seraphine`)

she/her · age 19 · student year 1 · Stillwater · romanceable

*Seer who never quite looks at the present*

Speaks in half-sentences, as if finishing the other half in a different week. Often right. Unsettlingly often.

**Voice:** Half-sentences, finished in another week. Calm, vague, then suddenly exact about something that hasn't happened yet.

**Traits:** dreamy, distant, perceptive, kind · **Interests:** prophecy, painting, tarot, stars

**Stats:** arcana 20, lore 32, alchemy 10, charm 16, vigor 8, guile 14, wealth 3

**Schedule:** The Observatory (evening, night); The Lakeshore (afternoon); The Library (morning, 50% of days)

**On breaks:** The Observatory (evening, night); The Lakeshore (afternoon); The Oracle's Rooms (noon, afternoon); The Cathedral of the Lamp (evening, 40% of days)

**Relations:** Kael Dumont +10, Lyra Vaneshade +5

**Facts:**
- [surface] A seer who speaks in half-sentences and is unsettlingly often right. (`seraphine.seer`)
- [personal] Sometimes she slips a day ahead and needs someone to tell her what today is. (`seraphine.slips`, known when `seen(seraphine_lost_day) > 0`)
- [personal] Her mother is the Oracle of Vell, who wants her home to tell kings what they want to hear. (`seraphine.oracle`, known when `rel(seraphine) >= 15`)
- [personal] Seers can't see themselves, unless someone is standing next to them. (`seraphine.self`, known when `seen(seraphine_painting) > 0`)
- [secret] The lake calls to her at night. She says it calls to you too. (`seraphine.lake`, known when `flag(seraphine_lake_told)`)
- [secret] When everyone's futures get too loud she hides in the dark. Yours, she says, is quiet. (`seraphine.too_loud`, known when `seen(seraphine_overwhelmed) > 0`)
- [personal] What she sees ahead comes out in her paintings, sometimes months early. She hides the ones she didn't mean to paint under her bed. (`seraphine.paintings`, known when `seen(seraphine_dont_look) > 0 or seen(brk_starfall_observatory) > 0`)
- [personal] In the capital she sits in her mother's window and paints the people queuing on the stairs as they will be in a year. She never shows them. (`seraphine.petitioners`, known when `seen(oracle_window_seat) > 0`)
- [secret] Her mother has seen her say yes to the family seat. Under the window seat in the capital, Seraphine keeps a painting of herself saying no. (`seraphine.other_ending`, known when `seen(oracle_other_painting) > 0`)

## Place: The Oracle's Rooms (`oracle_rooms`)

capital · open noon, afternoon

Where the Oracle of Vell sits for the court in season: a hushed upper floor, a queue of anxious people in good coats, and Seraphine in a window seat.

## Already written here (34)

- `seraphine_oracle_letter` A Letter From Vell (routine)
- `seraphine_what_you_want_to_hear` What You Want to Hear (routine)
- `seraphine_too_loud` Too Loud (routine)
- `hs_seraphine_towers` Seven, Then Six (story)
- `hs_seraphine_shadow` One Star Too Many (story)
- `timeloop_noticed` "You've Done This Before" (story)
- `div_seraphine_vision` She Grabs Your Hand (story)
- `seraphine_lost_day` Seraphine Is Tomorrow (routine)
- `seraphine_painting` A Painting of Somewhere Else (routine)
- `seraphine_mother` The Oracle's Summons (routine)
- `oracle_window_seat` A Year From Now (routine)
- `oracle_audience` An Audience (routine)
- `oracle_other_painting` The Other Ending (routine)
- `seraphine_capital_bells` Before the Bells (routine)
- `oracle_rooms_quiet_hour` The Queue on the Stairs (routine)
- `seraphine_intro` Your Left Shoe (windfall)
- `seraphine_tarot` The Cards (routine)
- `seraphine_lake_vision` She Walks Into the Lake (story)
- `seraphine_future` I Saw You Old (routine)
- `seraphine_overwhelmed` Too Many Tomorrows (routine)
- `seraphine_confession` She Already Knew (milestone)
- `seraphine_date_a_future` A Future She Saw (routine)
- `letter_seraphine_card` Half a Sentence (routine)
- `letter_seraphine_painting` A Painting of You (routine)
- `seraphine_stand_next` Stand Next to Me (routine)
- `seraphine_tomorrow_answer` Tomorrow's Answer (routine)
- `seraphine_dark_room` The Dark Room (routine)
- `seraphine_already_happened` She Tells You the Ending (routine)
- `seraphine_dont_look` Don't Look Ahead (routine)
- `seraphine_vision_hurt` She Won't Let You Go (story)
- `seraphine_ex` She Painted the Ending (milestone)
- `seraphine_partner_neglect` You Were in a Different Week (routine)
- `seraphine_confess_generic` She Already Knew (milestone)
- `seraphine_teaches_omen` Say It So It Lands (milestone)

## Lore

- **Oracle of Vell** (`oracle_of_vell`, soft): The Oracle of Vell, Seraphine's mother, tells kings what they want to hear and has already seen her daughter say yes to taking the family seat. In the court's season she sits in rooms on the capital's uptown side, where anxious people in good coats queue on the stairs to hear her, and pay for it.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Cast

### Bram Hollis (`bram`)

he/him · age 19 · prefect year 1 · Emberhall

*Prefect, enforcer, menace*

A prefect of your own year, with a ledger of demerits and a fondness for writing your name in it.

**Voice:** Loud, officious, rule-quoting; demerits as punctuation. Under it, his father's voice. When he's honest, he's gruff and brief.

**Traits:** bullying, insecure, proud, loyal · **Interests:** rules, duelling

**Stats:** arcana 26, lore 18, alchemy 10, charm 14, vigor 32, guile 20, wealth 4

**Schedule:** The Courtyard (morning, noon); The Duelling Hall (evening); The Library (afternoon, 50% of days)

**On breaks:** The Courtyard (afternoon); The Duelling Hall (evening); Hollis House (noon, afternoon, evening); The Royal Gardens (noon, 40% of days)

**Relations:** Tobias Fennick -15, Corvin Ashby -30, Nessa Quill -20, Lyra Vaneshade +5

**Facts:**
- [surface] A prefect of your own year, with a red sash, a ledger of demerits and a fondness for your name. (`bram.prefect`)
- [secret] His father was head boy, and has told Bram all his life that he will never amount to anything. (`bram.father`, known when `seen(bram_crying) > 0 or seen(bram_father_visit) > 0`)
- [personal] He once invented a "hall tax" for the east staircase. (`bram.hall_tax`, known when `seen(bram_hall_tax) > 0`)
- [secret] You saw him cheat in an exam. He knows you saw. (`bram.cheating`, known when `seen(bram_cheating) > 0`)
- [personal] Under the sash, he will step between you and trouble. Then he tells you not to make it weird. (`bram.ally`, known when `seen(bram_turns) > 0`)
- [personal] His father's portrait hangs in the corridor of head boys. Every visit, his father stops in front of it, and then looks at Bram. (`bram.portrait`, known when `seen(bram_portrait) > 0`)
- [personal] When he loses, he practises alone on the duelling green every evening for a month, and then asks for a rematch. (`bram.rematch`, known when `seen(bram_rematch) > 0`)
- [personal] At home he says "sir" to his father and almost nothing else. Whenever Bram is home, his father inspects his boots, the way Bram inspects first-years. (`bram.sir`, known when `seen(hollis_inspection) > 0`)
- [personal] At home he plays the piano at noon, very precisely, because he was told to at six and never stopped. He would rather you hadn't heard. (`bram.piano`, known when `seen(hollis_noon_piano) > 0`)
- [secret] His older sister Hester went to Thornwick against their father's wishes. Bram is the only one who still writes to her, and keeps her letters inside the demerit ledger. (`bram.hester`, known when `seen(hollis_hester) > 0`)

## Place: Hollis House (`hollis_house`)

capital · open noon, afternoon, evening

A narrow, very correct house on the uptown side, with a polished plate on the door and a father inside who was once head boy.

## Already written here (33)

- `bram_portrait` Head Boy, Forty Years Ago (routine)
- `bram_owns_up` Bram Owns Up (routine)
- `bram_become_close` Not Weird (milestone)
- `bram_marked` Top of the Ledger (milestone)
- `bram_demerit_ledger` The Demerit Ledger (routine)
- `bram_inspection` Inspection (routine)
- `bram_rumour` The Rumour He Started (routine)
- `bram_hall_tax_escalated` The Hall Tax, Escalated (routine)
- `bram_after_curfew` Caught After Curfew (routine)
- `bram_rematch` The Rematch (routine)
- `bram_steps_in` He Steps In (routine)
- `bram_fathers_shadow` His Father's Shadow (routine)
- `forbidden_bram_watch` The Prefect at the Door (story)
- `duel_bram_hazing` Initiation, Prefect-Style (routine)
- `bram_father_visit` Bram's Father (routine)
- `bram_cheating` Bram Cheats (routine)
- `intro_tour` The Prefect's Tour (story)
- `intro_places` Where Things Are (story)
- `heard_bram_corvin` Bram on Corvin (routine)
- `hollis_inspection` Boots (routine)
- `hollis_noon_piano` Scales at Noon (routine)
- `hollis_hester` The Hollis Who Got Away (routine)
- `bram_capital_no_sash` Off Duty (routine)
- `hollis_house_quiet_hour` The Brass Plate (routine)
- `bram_intro` Running in the Halls (routine)
- `bram_hall_tax` The Hall Tax (routine)
- `bram_sabotage` Missing Notes (routine)
- `bram_crying` Behind the Stables (routine)
- `bram_turns` An Unexpected Ally (milestone)
- `bram_duel` A Formal Challenge (routine)
- `ring_cameo_bram` Out of Uniform (routine)
- `bram_rival_race` Prefect's Privilege (routine)
- `bram_rival_signed_up` The Duty Rota (routine)

## Lore

- **Hollis** (`hollis_family`, soft): Bram's father was a prefect and head boy at Lumenhold; his portrait hangs in the corridor of head boys, and he stops in front of it on every visit. He has never stopped telling his son he will not amount to anything. Hollis House is a narrow, very correct house on the capital's uptown side, with a polished plate on the door, a piano that is played at noon, and, when she visits, Bram's older sister Hester, who is twenty-three, sharp-tongued, went to Thornwick against her father's wishes and is the only member of the family who isn't afraid of him.
- **Vaneshade** (`vaneshade`, soft): House Vaneshade is old pyromancer nobility. Its letters carry a black seal; its winter gala is an inspection disguised as a party; its duellists carry pale family wands and open every duel with the same flame flourish they have used for two hundred years. Vaneshades sleep exactly eight hours. Lady Vaneshade's highest praise is "Adequate"; she has a velvet chair reserved at her daughter's bouts, and it stays empty. Vaneshade House stands on the Crescent in the capital: black stone, a scorched practice room on the second floor, a long gallery of portraits in which every Vaneshade but one is unsmiling (the exception is Lyra's grandmother, who made Wildfire), and a kitchen run for thirty years by Mrs Callow, the cook.
- **the house on the Crescent** (`crescent_house`, soft): The tallest house on the Crescent belongs to a shipowner who bought his way up the hill from Port Calder's wharves. Every week he's in town he gives a ball, a garden ball in summer, to prove he belongs there; the old Crescent families come for his supper table and say what they like on the way home. Much of his fortune came up the hill by the bonded warehouses' side door, from the foreman's second set of figures.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Members' Club (`capital_club`)

capital · open afternoon, evening, night

Leather chairs, low voices and a porter who decides who you are. Patrons, collectors and other people's parents come here to be seen not being seen.

## Already written here (6)

- `club_gala_card` An Invitation, Not Yours (routine)
- `club_porter` The Porter's Lodge (routine)
- `club_card_room` Stakes of Another Kind (routine)
- `club_blackball` White and Black (routine)
- `club_reading_room` The Explorer in the Reading Room (routine)
- `capital_club_quiet_hour` The Porter's Look (routine)

## Lore

- **familiars** (`familiars`, soft): Students may keep a familiar if it is registered: twenty crowns and a stamp from the registrar. Unregistered familiars are tolerated if nobody notices them, and some don't want to be noticed.
- **Ember** (`ember_fox`, soft): A small fox with a tail that smoulders like an ember. If you free her from a snare she may come back with a ruby, or stay.
- **Club Fair** (`fairs`, soft): In Emberwane the Club Fair fills the courtyard with recruiting tables; the Job Board in the entrance hall posts term-time work. The Artificers' Fair shows off students' machines, and in summer the village holds its Midsummer Fair with an enchanted carousel.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Cast

### Professor Ottilie Vey (`vey`)

she/her · age 46 · professor · Faculty

*Professor of Illusion & Glamour*

Teaches Illusion & Glamour and grades on whether you fooled her. She is very hard to fool, and very generous to the few who manage it.

**Voice:** Amused, theatrical, a little too observant. Asks questions she already knows the answer to, to see what you'll do. Delighted by anyone who fools her.

**Traits:** charming, perceptive, sly, funny · **Interests:** theatre, painting, cards

**Stats:** arcana 60, lore 50, alchemy 20, charm 78, guile 70, vigor 22, wealth 3

**Schedule:** The Lecture Tower (morning, afternoon); The Great Hall (noon)

**On breaks:** The Theatre (evening, night)

**Relations:** Professor Aldric Thorne +5, Professor Ines Marisol +20

**Facts:**
- [surface] Teaches Illusion & Glamour and grades on whether you fooled her. (`vey.illusion`)
- [personal] She tests students in corridors, unannounced, with tea that isn't there. She keeps score. (`vey.tests`, known when `seen(vey_pop_quiz) > 0`)
- [personal] She produces the faculty revue every year, and has never once let Professor Thorne refuse a part. (`vey.revue`, known when `seen(vey_revue) > 0`)
- [personal] She doesn't use the mirror charm in public. Once, her reflection didn't come back for a week. (`vey.mirror`, known when `seen(vey_trust) > 0`)
- [personal] She teaches that sight is easy to fool; smell is where liars are caught. (`vey.smell`, known when `seen(illu_bread_smell) > 0`)
- [personal] She has every student glamour their own face first: a glamour you can't hold on yourself, she says, won't hold on anyone. (`vey.own_face`, known when `seen(illu_one_small_change) > 0`)
- [personal] She spends every break on the capital theatre's season, backstage, script under her arm, rescuing productions from their own actors. (`vey.season`, known when `seen(theatre_vey_ghost) > 0`)

## Place: The Theatre (`capital_theatre`)

capital · open afternoon, evening, night

The capital's great theatre, gilt and draughty. Its boxes see more of each other than of the stage.

## Already written here (12)

- `vey_lunch_dare` Fool Me Once (routine)
- `vey_rehearsal` An Audience of Nobody (routine)
- `vey_pop_quiz` Is It There? (routine)
- `vey_revue` The Faculty Revue (routine)
- `vey_trust` The Mirror Trick (milestone)
- `theatre_the_gods` Up in the Gods (routine)
- `theatre_vey_ghost` The Ghost Has the Mumps (routine)
- `theatre_opera_glasses` The Boxes Watch the Boxes (routine)
- `theatre_stage_door` The Stage Door (routine)
- `capital_theatre_quiet_hour` Gilt and Draughts (routine)
- `vey_intro` Tea That Isn't There (routine)
- `favour_vey_letter` A Discreet Errand (routine)

## Lore

- **Ottilie Venn** (`ottilie_venn`, soft): Ottilie Venn is a cheerful young botanist from the capital, a fern-hunter, who comes to the countryside in the seventh year for the valley's royal ferns and is given room seven at the coaching inn for nothing. She knows the name of everything green and laughs at everything else.
- **Professor Marisol** (`professors`, soft): Professor Marisol teaches Tidecalling and keeps the lake calm on exam days. Professor Vey teaches Illusion and grades on whether you fooled her. Professor Brask teaches Beastcraft and is kinder to animals than to students.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Royal Gardens (`capital_gardens`)

capital · open morning, noon, afternoon

Gravel walks, a fountain, hothouses full of things that shouldn't grow this far north, and everyone uptown walking slowly to be seen.

## Already written here (5)

- `gardens_promenade` Being Seen (routine)
- `gardens_dawn_duel` Wands at Dawn (routine)
- `gardens_night_vine` Once in Ten Years (routine)
- `gardens_thornwick_dare` The Bronze King's Horse (routine)
- `capital_gardens_quiet_hour` The Promenade (routine)

## Lore

- **Royal Library** (`capital_institutions`, soft): Beyond the academy lie the Royal Library's archives, the Guild of Alchemists' works, the Crown's Office of Unseen Affairs, which has no sign and no address, and the Travelling Circus of Wonders, which recruits graduates who want to wander.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Lamplighters' Bridges (`capital_bridges`)

capital · open afternoon, evening, night

The three old bridges, crowded with buskers, hawkers and couples, and lit every dusk by the lamplighters' guild one lamp at a time.

## Already written here (5)

- `bridges_lamplighters` The Lamplighters' Guild (routine)
- `bridges_busking` An Empty Hat on the Span (routine)
- `bridges_span_duel` The Middle of the Middle Bridge (routine)
- `bridges_mudlark` The Mudlark's Find (routine)
- `capital_bridges_quiet_hour` Lamps on the Bridges (routine)

## Lore

- **the capital** (`capital_districts`, soft): The capital grew down its river: uptown, where the Crescent's great houses curve along the hill above the Royal Gardens; midtown, with the Grand Bazaar, the Arcade of Services, the theatre and the three old bridges the lamplighters' guild lights at every dusk; the works quarter, all chimneys and clockworks; and Port Calder at the river's mouth, the old harbour town the city swallowed, with its fish market, its docks and its crooked lanes.
- **Cathedral of the Lamp** (`cathedral_of_the_lamp`, soft): The capital's great church, whose spire is seen from the sea. Its lamp has burned for four hundred years; its bells tell the whole city the hour; its crypt keeps archives older than the Royal Library's.
- **Lumenhold** (`lumenhold`, soft): Lumenhold Academy is seven towers joined by bridges of light, standing above a mirror-still lake. It has trained mages for three hundred years and has been a seal for exactly as long.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Docks (`capital_docks`)

capital · open morning, noon, afternoon, evening, night

Port Calder's wharves, where the river meets the sea: barges, cranes, gulls and men who can lift a crate and a purse in one movement.

## Already written here (7)

- `docks_bonded_talk` The Richest Floor (routine)
- `docks_day_labour` Hands Wanted (routine)
- `docks_northern_ship` Frost on the Rigging (routine)
- `docks_undercroft_word` Where the Dice Are (routine)
- `docks_roof_runner` Over the Roofs (routine)
- `capital_docks_quiet_hour` Gulls and Cranes (routine)
- `docks_sea_back_door` The Sea's Back Door (routine)


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Fish Market (`capital_fish_market`)

capital · open morning, noon, afternoon

On the quay from dawn: barrows, gulls, shouting, the night's catch on ice, and the best gossip in Port Calder before it's breakfast anywhere else.

## Already written here (6)

- `corvin_capital_quay` Good Hands (routine)
- `shop_fish_market` The Fish Market's Barrows (routine)
- `fish_market_auction` The Dawn Auction (routine)
- `fish_market_gull_war` The Gull War (routine)
- `fish_market_golden_fish` Throw It Back (routine)
- `capital_fish_market_quiet_hour` The Morning Catch (routine)

## Lore

- **star mark** (`star_mark`, soft): Relics of the Star burn so cold they feel hot and can leave a pale star-shaped mark on the palm. The mark hums near the lake and makes spells come easier, which should worry its bearer more than it does.
- **village** (`the_village`, soft): The village lies across the lake, reached by barge. On its square stand the bakery's trestle, the tailor's rail of robes and the pawnbroker's creaking sign; on market days Mir keeps a stall there. Round the square are the Gilded Newt, Mabel's tea shop, Grimsby's Books and Pell & Daughters, and their shopkeepers have seen every kind of student.
- **night market** (`night_market`, soft): On the moonless night of every term month, a market appears after midnight in a field past the village's last stile, and by dawn it's grass again. Its sellers are hooded and name no price until asked; some take payment that isn't coin. In summer it has been seen on other nights, in other fields. The village pretends not to know about it, and most of the village has been once.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Coaching Yard (`capital_coaching_yard`)

capital · open morning, noon, afternoon, evening, night

Where the coaches come in from the countryside and the north: horses, porters, travellers with all their luggage, and people who make a living off travellers.

## Already written here (4)

- `coaching_yard_arrivals` The Coach Is In (routine)
- `coaching_yard_wrong_trunk` The Wrong Trunk (routine)
- `coaching_yard_travellers_tale` Off the Southern Coach (routine)
- `capital_coaching_yard_quiet_hour` Coaches In (routine)


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Cathedral of the Lamp (`capital_cathedral`)

capital · open morning, noon, afternoon, evening

A spire you can see from the sea, a lamp that has burned for four hundred years, bells that tell the whole city the time, and a crypt of archives under it all.

## Already written here (6)

- `seraphine_capital_bells` Before the Bells (routine)
- `cathedral_under_the_lamp` Under the Lamp (routine)
- `cathedral_crypt_archive` The Crypt Archive (routine)
- `cathedral_ringing_chamber` The Ringing Chamber (routine)
- `cathedral_sanctuary` Sanctuary (routine)
- `capital_cathedral_quiet_hour` Under the Lamp (routine)

## Lore

- **Cathedral of the Lamp** (`cathedral_of_the_lamp`, soft): The capital's great church, whose spire is seen from the sea. Its lamp has burned for four hundred years; its bells tell the whole city the hour; its crypt keeps archives older than the Royal Library's.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: Printing Row (`capital_printing_row`)

capital · open morning, noon, afternoon, evening

A street of presses, ink and shouting, where the capital's broadsheets are set by hand and anything said by noon is news by dusk.

## Already written here (4)

- `printing_row_broadsheets` Hot Off the Press (routine)
- `printing_row_your_name` Your Name in Print (routine)
- `printing_row_jammed_press` The Jammed Press (routine)
- `capital_printing_row_quiet_hour` Hot Off the Press (routine)


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Undercroft (`capital_undercroft`)

capital · open evening, night

The old cellars under the middle bridge, where the river drips through the vaults: dice, cards, a pit with sawdust on the floor, and people who buy things without asking where they came from.

Teaser while undiscovered: Dockers talk about somewhere under the middle bridge where the dice never stop.

## Already written here (4)

- `undercroft_crescent_tip` The Shipowner's Safe (routine)
- `undercroft_dice` The Dice Under the Bridge (routine)
- `undercroft_pit` Fight Night (routine)
- `undercroft_fence` No Questions (routine)

## Lore

- **the Undercroft** (`undercroft`, soft): The old cellars under the capital's middle bridge, flooded once a century and dry enough in between: a gambling hall of dice and cards, a sawdust pit for prize-fights and the fences who buy what the docks lose. The watch knows it is there and is paid not to.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Rookery (`capital_rookery`)

capital · open evening, night

The rooftops of Port Calder, where the houses lean so close you can cross a street without touching it: chimney-pots, washing lines, the crews' old routes and the whole city spread out below.

Teaser while undiscovered: In Port Calder, people look up at the roofs a lot.

## Already written here (3)

- `rookery_rooftops` The Roofs of Port Calder (routine)
- `rookery_old_marks` Chalk on the Chimneys (routine)
- `rookery_watch_guide` The Watch Wants a Guide (routine)

## Lore

- **the Rookery** (`rookery`, soft): The rooftops of Port Calder, where the old harbour town's houses lean close enough to cross a street without touching it. The street crews have run its routes for generations and chalk their marks on its chimneys.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Cast

### Tobias Fennick (`tobias`)

he/him · age 19 · student year 1 · Rootward · romanceable

*Farmer's son on a turnip scholarship*

Big hands, bigger heart. Talks to plants and, worryingly, the plants seem to answer.

**Voice:** Warm, slow and earnest, with farm sayings and long stories about goats. Apologises too much; laughs from the belly.

**Traits:** kind, gentle, homesick, loyal · **Interests:** plants, animals, cooking, dancing

**Stats:** arcana 12, lore 14, alchemy 26, charm 18, vigor 30, guile 4, wealth 1

**Schedule:** The Greenhouses (morning, afternoon); The Refectory (noon, evening); The Familiar Stables (evening, 60% of days)

**On breaks:** The Greenhouses (afternoon); The Familiar Stables (evening, 60% of days); The Fennick Farm (noon, afternoon, evening); The Market Village (evening, 30% of days)

**Relations:** Old Maud +20, Bram Hollis -15, Mir Ten +10

**Facts:**
- [surface] A farmer's son on a turnip scholarship, built like a barn door and gentle as a lamb. (`tobias.scholarship`)
- [surface] He talks to plants. Worryingly, they seem to answer. (`tobias.plants`)
- [personal] His mother runs the farm alone at harvest. It's the first harvest he has ever missed. (`tobias.ma`, known when `seen(tobias_homesick) > 0`)
- [personal] He is raising a mandrake called Gerald, who wears a knitted hat and screams softly. (`tobias.gerald`, known when `seen(tobias_godparent) > 0`)
- [personal] The greenhouse moonflowers bloom once every eleven years. He would stand in a storm for them. (`tobias.moonflowers`, known when `rel(tobias) >= 12`)
- [secret] Blight took his family's harvest. Thirty crowns stood between them and a hungry winter. (`tobias.blight`, known when `seen(tobias_bad_harvest) > 0`)
- [personal] He practised waltzing with a broom before the Midwinter Ball. The broom complained. (`tobias.dancing`, known when `seen(tobias_dance_lessons) > 0`)
- [personal] His mother expects him home on the farm after graduation. It was always the plan; he isn't sure any more that it's his. (`tobias.after`, known when `seen(tobias_home_or_here) > 0`)
- [personal] His mother says the weather first and the love last, in person as in her letters. She has never once left the love out. (`tobias.weather_first`, known when `seen(fennick_weather_first) > 0`)
- [personal] Gerald came from a walled bed of mandrakes behind the farmhouse. Every one of them has a hat; his mother knits them all winter. (`tobias.mandrakes`, known when `seen(fennick_mandrake_bed) > 0`)
- [personal] A man from the capital has offered to buy the Fennick farm, this year only. His mother didn't so much as answer him. (`tobias.offer`, known when `seen(fennick_good_boots) > 0`)
- [secret] The Fennick farm lies outside both villages, and the valley's good years have never reached it. His mother says the valley's luck is the valley's business. (`tobias.outside`, known when `seen(fennick_top_field) > 0`)

## Place: The Fennick Farm (`fennick_farm`)

countryside · open noon, afternoon, evening

Up on the upland side, past the tarn, outside the two villages: turnips, tomatoes, a mother who writes the weather first and love last, and Tobias in his oldest boots.

## Already written here (40)

- `tm_watering_engine` The Watering Engine (story)
- `tobias_moonflower_vigil` Every Eleven Years (routine)
- `tobias_moonflower_bloom` Tonight (routine)
- `tobias_plants_vote` The Greenhouse Votes (routine)
- `tobias_scholarship_review` The Turnip Board (routine)
- `heal_tobias_sting` Stung (windfall)
- `garden_moonflower` The Moonflower (routine)
- `tobias_scarecrow` The Scarecrow Project (routine)
- `tobias_dance_lessons` Two Left Feet (routine)
- `tobias_storm_greenhouse` Storm Over the Greenhouses (routine)
- `heard_tobias_mir` Tobias on Mir (routine)
- `fennick_weather_first` Weather First (routine)
- `fennick_mandrake_bed` Gerald's Relations (routine)
- `fennick_good_boots` A Man in Good Boots (routine)
- `fennick_top_field` Outside the Luck (routine)
- `tobias_country_barrow` Turnips, Mostly Free (routine)
- `fennick_farm_quiet_hour` Turnips and Tomatoes (routine)
- `tobias_intro` The Lost Boy (windfall)
- `tobias_homesick` Homesick (routine)
- `tobias_bad_harvest` The Harvest Failed (routine)
- `tobias_repays` Every Crown (story)
- `tobias_godparent` The Mandrake Baby (routine)
- `tobias_bullied` Tobias and the Prefect (routine)
- `tobias_confession` A Confession, With Vegetables (milestone)
- `tobias_picnic` A Picnic in the Orchard (milestone)
- `verdant_tobias_cuttings` The Cuttings Question (routine, rank 2)
- `verdant_greenhouse_keys` The Greenhouse Keys (milestone, rank 2)
- `tobias_date_greenhouse_supper` Lunch Among the Tomatoes (routine)
- `letter_tobias_goats` Four Pages of Goats (routine)
- `letter_tobias_seeds` Seeds for a Windowsill (routine)
- `tobias_gerald_approves` Gerald Approves (routine)
- `tobias_letter_aloud` Read It to Me (routine)
- `tobias_umbrella` One Umbrella (routine)
- `tobias_seed_month` A Seed a Month (routine)
- `tobias_home_or_here` Home or Here (routine)
- `tobias_gerald_wilts` Gerald Is Ill (story)
- `tobias_ex` He Still Waters Your Plant (milestone)
- `tobias_dance_specialized` The Broom Waltz, Again (routine)
- `tobias_friend_sick` Too Big for the Bed (routine)
- `tobias_teaches_heartwood` Something to Stand Under (milestone)

## Lore

- **Fennick** (`fennick_farm`, soft): The Fennick farm grows turnips, tomatoes and stubborn children. Tobias's mother runs it alone at harvest, writes weather first and love last, and expects him home after graduation; one year blight nearly ruined them. Tobias studies on an agricultural scholarship whose board reviews his marks in person. The farm lies on the upland side of the valley, outside both villages, past the tarn; a drystone wall at its top field marks where the villages' land begins. Behind the farmhouse is a walled bed of mandrakes, Gerald's relations, each in a hat Mrs Fennick knits in winter. This year a man from the capital has been buying upland farms.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Cast

### Nessa Quill (`nessa`)

she/her · age 19 · student year 1 · Duskgate · romanceable

*Editor of the Lumen Ledger*

Runs the student paper with a quill that writes on its own. Everyone is a story; some are just not finished yet.

**Voice:** Rapid, bossy, headline-shaped. Treats every conversation as an interview; goes very quiet when it's off the record.

**Traits:** nosy, idealistic, overworked, bold · **Interests:** writing, gossip, justice

**Stats:** arcana 14, lore 26, alchemy 8, charm 30, vigor 12, guile 24, wealth 2

**Schedule:** The Lumen Ledger Office (afternoon, evening, night); The Courtyard (noon); The Gilded Newt (evening, 25% of days)

**On breaks:** The Lumen Ledger Office (afternoon); The Village Square (evening, 50% of days); The Almanac Printer's (noon, afternoon); The Market Village (evening, 40% of days)

**Relations:** Bram Hollis -20, Corvin Ashby +10, Lyra Vaneshade -5

**Facts:**
- [surface] Editor of the Lumen Ledger, with a quill that writes on its own. (`nessa.editor`)
- [personal] Left unsupervised, her quill starts inventing the news. (`nessa.quill`, known when `seen(nessa_burnout) > 0`)
- [personal] Nobody has interviewed the headmistress in twenty years. She means to be the first. (`nessa.interview`, known when `rel(nessa) >= 12`)
- [secret] Her office wall is covered in red string around a sketch of a black star. (`nessa.string`, known when `seen(nessa_hollow_story) > 0`)
- [personal] She would chain herself to the printing press before letting anyone shut the Ledger. (`nessa.press`, known when `seen(nessa_paper_threatened) > 0`)
- [secret] The only time her quill stops is when she tells it the conversation is off the record. (`nessa.off_record`, known when `seen(nessa_confession) > 0`)
- [personal] She plants one error in every proof she asks you to check, to see whether you'll find it. (`nessa.planted`, known when `seen(nessa_fact_check) > 0`)
- [personal] She learned to set type backwards before she could write forwards, above her mother's press in the countryside. At the type case she doesn't say a single headline. (`nessa.type`, known when `seen(almanac_type_case) > 0`)
- [personal] Her first story was a notice for a lost dog called Biscuit, set when she was seven. The dog came home. She has been unbearable ever since, and says it's the job. (`nessa.first_story`, known when `seen(almanac_first_notice) > 0`)
- [secret] Every seventh year the valley's almanac is printed a page short, always the harvest page. Her mother says the old press always did that. Nessa doesn't believe her. (`nessa.almanac`, known when `seen(almanac_short_page) > 0`)
- [personal] She left the valley because nothing in it was ever news. Lately she wonders whether that was the news. (`nessa.why_left`, known when `seen(nessa_country_green) > 0`)

## Place: The Almanac Printer's (`almanac_printers`)

countryside · open noon, afternoon

A crooked shop off the market green with a hand press in the window. It prints the valley's almanac, its notices and its funeral cards, and Nessa grew up above it.

## Already written here (37)

- `nessa_interview_prep` Twenty Years (routine)
- `nessa_fact_check` Fact-Check (routine)
- `nessa_quill_loose` The Quill Gets Loose (routine)
- `ledger_pie_scoop` The Case of the Missing Pies (routine)
- `ledger_bram_story` The Prefect's Bribes (routine)
- `ledger_deadline` Deadline Night (routine)
- `nessa_headmistress_interview` The Impossible Interview (routine)
- `nessa_typo` A Catastrophic Typo (routine)
- `nessa_burnout` The Editor Sleeps (routine)
- `nudge_quickquill` How's My Quill? (routine)
- `heard_nessa_isolde` Nessa on the Headmistress (routine)
- `almanac_type_case` Backwards and Upside Down (routine)
- `almanac_first_notice` Lost: One Brown Dog (routine)
- `almanac_short_page` A Page Short (routine)
- `nessa_country_green` Nothing Ever Happens Here (routine)
- `gy_almanac_page` The Harvest Page (story)
- `almanac_printers_quiet_hour` The Almanac Press (routine)
- `nessa_intro` First Impressions (routine)
- `nessa_gossip_column` You're in the Gossip Column (routine)
- `nessa_source` The Source (routine)
- `nessa_hollow_story` Nessa Smells a Story (story)
- `nessa_paper_threatened` Stop the Presses (routine)
- `nessa_confession` Off the Record (milestone)
- `lumen_ledger_red_ink` Red Ink (routine, rank 2)
- `nessa_date_off_record` Off the Record (routine)
- `letter_nessa_deadline` URGENT (routine)
- `letter_nessa_off_record` Off the Record (routine)
- `nessa_the_one_phrase` The One Phrase (routine)
- `nessa_quill_draft` The Quill's Draft (routine)
- `nessa_deadline_night` Deadline Night (routine)
- `nessa_shared_byline` A Shared Byline (routine)
- `nessa_corrections_column` Corrections (routine)
- `nessa_not_a_story` Not a Story (routine)
- `nessa_press_breaks` The Press Breaks (routine)
- `nessa_ex` Retraction (milestone)
- `nessa_argument` On the Record (routine)
- `nessa_teaches_candour` Off the Record (milestone)

## Lore

- **Quill** (`quill_press`, soft): Nessa grew up above her mother's print shop off the market green in the countryside, the Almanac Printer's, which prints the valley's almanac, its notices and its funeral cards. Mrs Quill works the hand press, ink to the elbows. Nessa set type before she could write, and her first story was a lost-dog notice for a dog called Biscuit, who came home. The attic holds a century of almanacs; every seventh year's is a page short, always the harvest page, and Mrs Quill says the old press always did that.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Marsh (`countryside_marsh`)

countryside · open morning, noon, afternoon, evening, night

Reed beds and black water where the river gives up. Lights move out there at dusk. A hedge-witch keeps a house on stilts at the edge.

## Already written here (9)

- `marsh_grandmother_lesson` The Old Work (routine)
- `marsh_stilt_house_supper` Supper Above the Water (routine)
- `marsh_witch_stranger` The Woman on the Stilt House Steps (routine)
- `marsh_lights_on_the_drovers_road` The Drovers' Road (routine)
- `marsh_drowned_chapel` The Chapel the Marsh Took (routine)
- `marsh_eel_catcher` The Eel Traps (routine)
- `shop_hedge_door` The Hedge-Witch's Door (routine)
- `gy_witch_truth` What the Rue Is For (story)
- `countryside_marsh_quiet_hour` Lights on the Water (routine)


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Market Village (`home_market`)

countryside · plan · open morning, noon, afternoon, evening

A green, a market cross and the coaching inn where the road changes horses. Everyone is very glad to see you.

## Already written here (18)

- `home_market_stallholder` The Stallholder Remembers (routine)
- `home_market_letter_home` A Letter for the Castle (routine)
- `market_inn_welcome` On the House (routine)
- `market_harvest_board` The Board by the Cross (routine)
- `market_day_stalls` Everyone Smiles (routine)
- `market_inn_hands` The Inn Wants Hands (routine)
- `shop_country_market` The Country Market (routine)
- `gy_seventh_year` The Seventh Column (story)
- `gy_fern_hunter` The Fern-Hunter (story)
- `gy_guest_book` The Guest Book (story)
- `gy_ottilie_gone` Room Seven (story)
- `gy_thin_harvest` A Cross on the Board (story)
- `home_market_late_bloomer` The Cold Stove (story)
- `home_market_inn_crowd` Outside the Inn (routine)
- `home_market_charm_seller` The Charm Seller (routine)
- `home_market_post_office` Letters to the Castle (routine)
- `home_market_schoolmistress` The Old Schoolmistress (routine)
- `home_market_day` Market Day (routine)

## Lore

- **village** (`the_village`, soft): The village lies across the lake, reached by barge. On its square stand the bakery's trestle, the tailor's rail of robes and the pawnbroker's creaking sign; on market days Mir keeps a stall there. Round the square are the Gilded Newt, Mabel's tea shop, Grimsby's Books and Pell & Daughters, and their shopkeepers have seen every kind of student.
- **star mark** (`star_mark`, soft): Relics of the Star burn so cold they feel hot and can leave a pale star-shaped mark on the palm. The mark hums near the lake and makes spells come easier, which should worry its bearer more than it does.
- **night market** (`night_market`, soft): On the moonless night of every term month, a market appears after midnight in a field past the village's last stile, and by dawn it's grass again. Its sellers are hooded and name no price until asked; some take payment that isn't coin. In summer it has been seen on other nights, in other fields. The village pretends not to know about it, and most of the village has been once.
- **village tailor** (`village_tailor`, soft): The tailor on the village square, who exchanges students' ruined robes at half price and, it's said, feels it whenever a sleeve is singed. She sews Sister Amaranth's ward thread into cloaks, and will make a robe of Spinner silk, at a price "for my nerves".


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Mill Village (`countryside_mill`)

countryside · open morning, noon, afternoon, evening

A huddle of cottages round a mill and a small grey chapel. The wheel turns slowly, and the children sing at their skipping.

## Already written here (5)

- `mill_skipping_rhyme` Seven for the One (routine)
- `mill_dry_wheel` A Wheel With No Water (routine)
- `mill_miller_sacks` Sacks for the Miller (routine)
- `gy_miller_tally` The Miller's Tally (story)
- `countryside_mill_quiet_hour` The Turning Wheel (routine)

## Lore

- **village** (`the_village`, soft): The village lies across the lake, reached by barge. On its square stand the bakery's trestle, the tailor's rail of robes and the pawnbroker's creaking sign; on market days Mir keeps a stall there. Round the square are the Gilded Newt, Mabel's tea shop, Grimsby's Books and Pell & Daughters, and their shopkeepers have seen every kind of student.
- **village tailor** (`village_tailor`, soft): The tailor on the village square, who exchanges students' ruined robes at half price and, it's said, feels it whenever a sleeve is singed. She sews Sister Amaranth's ward thread into cloaks, and will make a robe of Spinner silk, at a price "for my nerves".


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Fields (`home_fields`)

countryside · plan · open morning, afternoon, evening

Long rows of good harvest under a big sky, and scarecrows in very decent coats.

## Already written here (10)

- `home_fields_old_friend` Someone You Grew Up With (routine)
- `home_fields_night_sky` The Sky Without Towers (routine)
- `fields_scarecrow_coats` Very Decent Coats (routine)
- `fields_gleaners` Gleaning (routine)
- `fields_harvest_day` Harvest Hands (routine)
- `gy_scarecrow_names` Names in the Collars (story)
- `home_fields_bloomer_lessons` Where Nothing Can Catch (story)
- `home_fields_long_rows` The Long Rows (routine)
- `home_fields_pond` The Old Pond (routine)
- `home_old_friend` An Old Friend (routine)


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Ridge (`countryside_ridge`)

countryside · open morning, afternoon, evening, night

A long bare ridge above the villages, with a ring of standing stones and a view of every star there is.

## Already written here (3)

- `ridge_count_aloud` Counting Out Loud (routine)
- `ridge_night_sky` Sightlines (routine)
- `countryside_ridge_quiet_hour` The Stones (routine)


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Ford (`countryside_ford`)

countryside · open morning, noon, afternoon, evening

Where the road meets the river: stepping stones when it's low, a ferryman's punt when it's not, and a ferryman who never seems to cross himself.

## Already written here (4)

- `ford_crossing` The Ferryman's Toll (routine)
- `ford_spate_cart` The River in Spate (routine)
- `ford_ferryman_side` Which Side (routine)
- `countryside_ford_quiet_hour` The Stepping Stones (routine)

## Lore

- **the countryside** (`countryside_country`, soft): The countryside is a long valley with two villages on one road: fen in the south-west, moor in the east, the ridge and its standing stones in the north. Up on the upland side lie the tarn and the farms outside the villages; the high road runs west past the old quarry to the Drovers' Inn; the road crosses the river at the ford; Hollin Coppice is the old cut wood in the south.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: Hollin Coppice (`hollin_coppice`)

countryside · open morning, noon, afternoon, evening

A wood cut and grown again for longer than anyone remembers: charcoal burners' smoke, bluebells in season, and trees marked in chalk by a woodward nobody hired.

## Already written here (4)

- `coppice_rides` Along the Rides (routine)
- `coppice_woodward` The Woodward's Marks (routine)
- `coppice_charcoal_night` Watching the Mound (routine)
- `hollin_coppice_quiet_hour` Charcoal Smoke (routine)

## Lore

- **the countryside** (`countryside_country`, soft): The countryside is a long valley with two villages on one road: fen in the south-west, moor in the east, the ridge and its standing stones in the north. Up on the upland side lie the tarn and the farms outside the villages; the high road runs west past the old quarry to the Drovers' Inn; the road crosses the river at the ford; Hollin Coppice is the old cut wood in the south.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Tarn (`countryside_tarn`)

countryside · open morning, noon, afternoon, evening

A small black lake high on the upland, cold even in summer, so still on calm days that the sky looks deeper in it than it does overhead.

## Already written here (3)

- `tarn_still_water` The Still Water (routine)
- `tarn_angler` The Angler at the Tarn (routine)
- `countryside_tarn_quiet_hour` The Still Water (routine)

## Lore

- **the countryside** (`countryside_country`, soft): The countryside is a long valley with two villages on one road: fen in the south-west, moor in the east, the ridge and its standing stones in the north. Up on the upland side lie the tarn and the farms outside the villages; the high road runs west past the old quarry to the Drovers' Inn; the road crosses the river at the ford; Hollin Coppice is the old cut wood in the south.


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Quarry (`countryside_quarry`)

countryside · open morning, noon, afternoon

An old stone quarry on the valley's western edge, its faces full of fossils and its echo full of opinions.

## Already written here (4)

- `quarry_face` The Quarry Face (routine)
- `quarry_echo` Back Chat (routine)
- `quarry_millstone` The Last Millstone (routine)
- `countryside_quarry_quiet_hour` The Echo (routine)


# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **secret**.

## Place: The Drovers' Inn (`drovers_inn`)

countryside · open noon, afternoon, evening, night

The inn on the high road west, where drovers, tinkers and anybody the coaching inn wouldn't have end up: cheap beer, a long table, and a fight most nights.

## Already written here (5)

- `drovers_long_table` The Long Table (routine)
- `drovers_tinker` The Tinker's Pack (routine)
- `drovers_loose_bear` The Bear Gets Loose (routine)
- `gy_agent_drovers` The Agent at the Drovers' Inn (story)
- `drovers_inn_quiet_hour` The Long Table (routine)

## Lore

- **the countryside** (`countryside_country`, soft): The countryside is a long valley with two villages on one road: fen in the south-west, moor in the east, the ridge and its standing stones in the north. Up on the upland side lie the tarn and the farms outside the villages; the high road runs west past the old quarry to the Drovers' Inn; the road crosses the river at the ford; Hollin Coppice is the old cut wood in the south.

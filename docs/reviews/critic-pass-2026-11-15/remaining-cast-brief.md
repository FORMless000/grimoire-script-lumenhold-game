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

### Grisk (`grisk`)

he/him · age 58 · villager · none

*Moneylender, friend to the temporarily embarrassed*

A goblin in a velvet waistcoat who lends to students: sixty crowns today, twelve a month for six. He keeps a ledger, and sometimes asks for favours instead of coin.

**Voice:** Courtly, purring, every sentence an invoice. Calls debts "friendships". Never threatens; describes, pleasantly, what will happen.

**Traits:** sly, charming, patient, guarded · **Interests:** money, cards, gossip

**Stats:** arcana 18, lore 40, alchemy 20, charm 46, vigor 14, guile 82, wealth 4

**Schedule:** The Gilded Newt (evening); The Village Square (afternoon)

**Relations:** Old Pell -10

**Facts:**
- [surface] A goblin moneylender in a velvet waistcoat: sixty crowns today, twelve a month for six months. (`grisk.lender`)
- [personal] He calls debts "friendships", and keeps all of them in one ledger he never lets out of reach. (`grisk.ledger`, known when `met(grisk) and seen(grisk_pleasantries) > 0`)
- [personal] He sometimes asks for favours instead of coin, and the favours are for clients he never names. (`grisk.favours`, known when `seen(grisk_favour) > 0`)
- [personal] He keeps the corner table at the Gilded Newt, and talks about money the way other people talk about weather: which shops are in trouble, and why. (`grisk.newt_table`, known when `rel(grisk) >= 4 and seen(grisk_pleasantries) > 0`)
- [personal] When a debt runs late, two trolls in waistcoats come to collect. They are polite, and very thorough. (`grisk.collectors`, known when `seen(grisk_collectors) > 0 or seen(grisk_troll_letter) > 0`)
- [secret] He runs parcels in oilcloth from the boathouse jetty at midnight to a cobbler's back door in the village. Nobody opens them. (`grisk.parcels`, known when `seen(grisk_pickup) > 0`)
- [secret] He deals Brightwater and Owl's Ink at the boathouse at midnight, for coin or for favours, and his price climbs before finals and for anyone who can't do without. (`grisk.elixirs`, known when `seen(grisk_elixir_offer) > 0`)

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

### Sister Amaranth (`amaranth`)

she/her · age 54 · staff · Faculty

*Healer of the infirmary*

Runs the infirmary with warming charms, tonics and no patience for excuses. Teaches the healing half of Alchemy & Healing.

**Voice:** Short sentences, delivered while doing something else. Believes no excuse, forgives most things anyway. Praise comes as an instruction ("Keep doing that.").

**Traits:** severe, honest, patient, warm · **Interests:** plants, soup, history

**Stats:** arcana 40, lore 52, alchemy 80, charm 24, vigor 34, guile 30, wealth 2

**Schedule:** The Alchemy Laboratory (morning); The Infirmary (afternoon, evening, night); The Great Hall (noon)

**On breaks:** The Infirmary (afternoon, evening, night)

**Relations:** Old Maud +25, Professor Aldric Thorne +10, Professor Hedda Brask +15

**Facts:**
- [surface] Runs the infirmary and teaches the healing half of Alchemy & Healing. Believes no excuse. (`amaranth.healer`)
- [personal] She treats the true version of an injury faster than the story you tell her, and she always knows which one you told. (`amaranth.truth`, known when `seen(amaranth_intro) > 0`)
- [personal] She does evening rounds of every bed herself, and has never once missed one. (`amaranth.rounds`, known when `seen(amaranth_rounds) > 0`)
- [personal] Only a handful of students have ever been trusted with the key to her tonic cupboard. (`amaranth.key`, known when `seen(amaranth_trust) > 0`)
- [personal] She counts every remedy twice, because the second count is the true one, and keeps a black jar on the top shelf for a curse not seen since her first year. (`amaranth.count`, known when `seen(brk_amaranth_restock) > 0`)
- [personal] She leaves the tonic cupboard open at teatime on purpose, to see who will help themselves, and writes their names in a book. (`amaranth.cupboard`, known when `seen(infirmary_tonic_cupboard) > 0`)
- [personal] She keeps a book of the remedies her students invented, written out in her own square hand. (`amaranth.book`, known when `seen(alch_original_remedy) > 0`)

### Old Maud (`maud`)

she/her · age 81 · staff · Faculty

*Groundskeeper and hedge-witch*

Keeps bees, chickens and a rather large secret garden. Gives advice you only understand two weeks later.

**Voice:** Folksy and sharp; calls everyone "dearie". Gives advice you only understand two weeks later; tells sad stories over tea as if they were recipes.

**Traits:** kind, eccentric, patient, warm · **Interests:** plants, bees, soup, animals, history

**Stats:** arcana 46, lore 58, alchemy 72, charm 30, vigor 20, guile 34, wealth 2

**Schedule:** Old Maud's Cottage (morning, noon, evening); The Greenhouses (afternoon)

**On breaks:** Old Maud's Cottage (morning, evening); The Greenhouses (afternoon)

**Relations:** Professor Aldric Thorne +20, Headmistress Isolde Marrow +25, Tobias Fennick +20

**Facts:**
- [surface] Groundskeeper and hedge-witch, keeper of bees, chickens and a goat called Bartholomew. (`maud.groundskeeper`)
- [personal] She was a student here sixty years ago, the spring the lake froze. (`maud.student`, known when `seen(maud_old_student) > 0`)
- [secret] Edmund went down beneath the lake that night and didn't come back. She kept his silver wand. (`maud.edmund`, known when `seen(maud_old_wand) > 0`)
- [personal] Her soup cures colds, broken hearts and most curses. You're not allowed to write it down. (`maud.soup`, known when `seen(maud_recipe) > 0`)
- [personal] Behind the potting shed there is a door to a garden that only exists for people she shows it to. (`maud.garden`, known when `seen(garden_maud_secret) > 0`)
- [personal] She is eighty-one, and says she's allowed the occasional chill. (`maud.age`, known when `seen(maud_ill) > 0`)
- [personal] In her first winter as groundskeeper she raised a hatchling spider called Tuppence in the potting shed. Tuppence is the Spinner of the Hush now. (`maud.tuppence`, known when `seen(maud_tuppence) > 0 or seen(ww_cocooned) > 0`)
- [personal] The little bees carved on the Whisperwood's birches are hers, from when she used to go down to the Hush to visit Tuppence. Her knees won't take it now. (`maud.blazes`, known when `seen(ww_mastery_map) > 0`)

### Headmistress Isolde Marrow (`isolde`)

she/her · age 57 · headmistress · Faculty

*Headmistress of Lumenhold*

Tall, pale and impossibly calm. She remembers every student's name — and every student's mistakes.

**Voice:** Pleasant, unhurried, every word placed like a chess piece. Never raises her voice; never needs to. A short, delighted laugh when surprised.

**Traits:** calm, watchful, formidable, perceptive · **Interests:** chess, history, justice

**Stats:** arcana 84, lore 90, alchemy 50, charm 60, vigor 30, guile 70, wealth 4

**Schedule:** The Headmistress's Tower (morning, afternoon, evening); The Great Hall (noon)

**On breaks:** The Headmistress's Tower (afternoon, evening)

**Relations:** Professor Aldric Thorne +30, Old Maud +25

**Facts:**
- [surface] She remembers every student's name, and every student's mistakes. (`isolde.names`)
- [secret] As a student she set the observatory on fire twice. Her portrait from those days is hidden in a forgotten corridor. (`isolde.portrait`, known when `seen(isolde_portrait) > 0`)
- [personal] She plays tower chess by her window and laughs, short and delighted, when she loses. (`isolde.chess`, known when `seen(isolde_chess) > 0`)
- [secret] She has been following the same thread you have: the seal beneath the lake is weakening. (`isolde.thread`, known when `flag(warden_trial) or seen(hs_isolde_summons) > 0`)
- [personal] She asks students what they think is just, and sometimes she listens. (`isolde.mercy`, known when `seen(isolde_judgement) > 0`)
- [personal] She knows the name Absalom Vrell: expelled long before her time, and still in the ledger, crossed out. (`isolde.vrell`, known when `seen(item_grimoire_isolde) > 0`)
- [personal] She asks how your term is going, and then how it is really going, and waits for the second answer. (`isolde.really`, known when `seen(headmistress_tower_tea) > 0`)

## Already written here (172)

- `align_maud_way_back` Weeding, Dearie (routine)
- `lyra_who_beat_her` Who Beat Her (routine)
- `lyra_well_done` Well Done (routine)
- `lyra_study_hall_truce` The Study Hall Truce (routine)
- `lyra_become_close` Let It Run (milestone)
- `mir_small_fire` A Small Fire (routine)
- `mir_padlock` The Padlock (routine)
- `mir_family_clocks` Not a Hobby (routine)
- `bram_portrait` Head Boy, Forty Years Ago (routine)
- `bram_owns_up` Bram Owns Up (routine)
- `bram_become_close` Not Weird (milestone)
- `lyra_rankings_war` The Rankings War (routine)
- `lyra_sabotage_returned` Pink Bubbles, Returned (routine)
- `lyra_glove_thrown` The Glove Thrown (routine)
- `lyra_allies_thornwick` Allies, for an Afternoon (routine)
- `lyra_mother_watches` Her Mother Watches You Win (routine)
- `lyra_rival_letter` A Rival's Letter (routine)
- `lyra_last_match` The Last Rankings (routine)
- `bram_marked` Top of the Ledger (milestone)
- `bram_demerit_ledger` The Demerit Ledger (routine)
- `bram_inspection` Inspection (routine)
- `bram_rumour` The Rumour He Started (routine)
- `bram_hall_tax_escalated` The Hall Tax, Escalated (routine)
- `bram_after_curfew` Caught After Curfew (routine)
- `bram_rematch` The Rematch (routine)
- `bram_steps_in` He Steps In (routine)
- `bram_fathers_shadow` His Father's Shadow (routine)
- `hs_maud_locks` Maud Has Seen Ice Before (story)
- `hs_wardens_notice` The Headmistress Takes Note (story)
- `hs_key_breakfast` Something of Mine (story)
- `hs_isolde_summons` The Headmistress Knows (story)
- `hs_aftermath_lost` The Headmistress Closed It (story)
- `lyra_on_thornwick` Lyra on Thornwick (routine)
- `forbidden_bram_watch` The Prefect at the Door (story)
- `forbidden_section_3` Caught (story)
- `pyro_lyra_spar` A Challenge in Class (routine)
- `art_mir_collab` A Joint Project (routine)
- `duel_bram_hazing` Initiation, Prefect-Style (routine)
- `duel_lyra_training` Training Partners (routine)
- `garden_maud_secret` The Secret Garden (routine)
- … and 132 more (`grim query event 'actor == "lyra"'`)

## Lore

- **Vaneshade** (`vaneshade`, soft): House Vaneshade is old pyromancer nobility. Its letters carry a black seal; its winter gala is an inspection disguised as a party; its duellists carry pale family wands and open every duel with the same flame flourish they have used for two hundred years. Vaneshades sleep exactly eight hours. Lady Vaneshade's highest praise is "Adequate"; she has a velvet chair reserved at her daughter's bouts, and it stays empty. Vaneshade House stands on the Crescent in the capital: black stone, a scorched practice room on the second floor, a long gallery of portraits in which every Vaneshade but one is unsmiling (the exception is Lyra's grandmother, who made Wildfire), and a kitchen run for thirty years by Mrs Callow, the cook.
- **Hollis** (`hollis_family`, soft): Bram's father was a prefect and head boy at Lumenhold; his portrait hangs in the corridor of head boys, and he stops in front of it on every visit. He has never stopped telling his son he will not amount to anything. Hollis House is a narrow, very correct house on the capital's uptown side, with a polished plate on the door, a piano that is played at noon, and, when she visits, Bram's older sister Hester, who is twenty-three, sharp-tongued, went to Thornwick against her father's wishes and is the only member of the family who isn't afraid of him.
- **Ten family** (`ten_clockworks`, soft): Mir's family runs a clockworks, calls invention a hobby and expects Mir home. After a persuasive letter, Mir's mother agreed: "Fine. Win a prize": the guild medal for young artificers. The family keeps name days, not birthdays; Mir's father shows almost nobody the escapement of his clocks. The Ten Clockworks is a workshop and a house in one in the capital's works quarter, with forty clocks on its walls and a long family bench where work is done properly: slowly, silently and perfectly. Mir's older sister Greta will inherit it, and is very good at it.
- **infirmary** (`infirmary`, soft): Sister Amaranth runs the infirmary with warming charms, tonics and no patience for excuses. Lake Fever comes from swimming where you shouldn't; curse-cold comes from worse.
- **Wardens** (`wardens`, soft): The headmistress keeps a quiet circle sworn to the founders' seal. When the seal grows thin she recruits students she trusts and gives them silver ward-rings.
- **Grisk** (`grisk`, soft): A goblin in a velvet waistcoat, friend to the temporarily embarrassed: sixty crowns today, twelve a month for six months. He keeps a ledger and occasionally asks for favours instead of coin.
- **the old hall** (`old_hall`, soft): The valley's shut manor behind its wall at the moor's edge. The family who built it kept the valley's books, the ones that matter, until they sold up and left in a bad year nobody will date; an old caretaker stayed. This year a land agent from the capital bought it and works at the old family's desk.
- **young headmistress** (`isolde_youth`, soft): Before she was headmistress, Isolde Marrow was the student with the detention record of the decade, who set the observatory on fire twice.
- **wall stair** (`tower_wall_stair`, soft): Inside the seventh tower's wall, behind a rack of empty bottles in the cellar, a servants' stair one shoulder wide climbs to the landing of candles, with a spyhole onto the main stair. Above the landing are the old classrooms, shut with the tower a century ago and left as their teachers left them: an examiner's cupboard of old papers, floorboards that creak each a different note, a brass orrery still turning, a professor's portrait that asks what you think you're doing. The class register ends on its last day: "Tower closed. Lessons moved." Two turns below the top, where desks choke the stair, the duelling master's study stays locked, and nobody has had its key since.
- **Pell & Daughters** (`pell_and_daughters`, soft): The village apothecary, with a thousand labelled drawers. Old Pell taught three generations to count drops; his daughters keep the counter now, and he counts aloud behind them. It buys what foragers bring out of the Whisperwood.


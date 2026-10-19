/*
 * Lumenhold localization.
 *
 *  - UI strings: English defaults live in UI_EN below; other languages override them in
 *    locales/<lang>/ui.lang (block "@ui").
 *  - Content strings: English is the source, written inline in content/**\/*.grim.
 *    Translations live in locales/<lang>/<same path>.lang, keyed by block + field, e.g.
 *
 *        @event pyro_candle
 *        # en: Light the Candle
 *        title [3f9a1c] = 点燃蜡烛
 *        opt.left.say.1 [77b0e2] = 烛芯被点燃了……
 *
 *    The [hash] fingerprints the English text that was translated. If the English later
 *    changes, the entry is reported as stale (but still used) until someone updates the
 *    translation and deletes the [hash] (the sync tool re-stamps it).
 *  - Applied once at load: I18n.applyContent(content, locale) rewrites the compiled content
 *    in place, so the engine and save files stay language-agnostic.
 *
 * Tooling: `node tools/grim.js i18n <lang>` creates/updates the .lang files; `lint` validates them.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.I18n = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ English UI strings */
  // Keys ending in "_html" may contain simple markup (<b>). {name} placeholders are filled by t().
  const UI_EN = {
    'lang.name': 'English',
    'lang.label': 'Language',

    'title.yourName': 'Your name',
    'title.seed': 'Seed (optional)',
    'title.seedPlaceholder': 'random',
    'title.begin': 'Begin your first year',
    'origin.heading': 'Who were you before?', 'origin.intro': 'Where you come from decides what you start with, and how hard money will be.',
    'origin.poorWarning': 'Hard mode for money: plan on working a job most terms.', 'origin.back': 'Back',
    'title.continue': 'Continue · {info}',
    'title.saveInfo': '{name} — {month}, Year {year}',
    'title.howto_html': '<b>Swipe</b> each card left or right (or press ← / →) to choose. Some moments open a <b>menu</b> with more options. Keep your <b>Health, Mood and Crowns</b> above zero for four years — 48 months — and see who you become. Glowing dots above a meter show what a choice will touch.',
    // Name pools for the title screen's random name: by pronouns (`they` names suit anyone), and `world_*` pools drawn
    // now and then (I18n.randomName). No first name of a named character or a word the content uses as a name.
    'title.names.she': 'Elowen, Isla, Maren, Briony, Clemency, Delphine, Eira, Fenella, Greer, Hesper, Imogen, Iona, Linnea, Mae, Morwenna, Sabine, Philippa, Rosalind, Saoirse, Tegan, Wilhelmina, Yseult, Aveline, Beatrix, Cordelia, Edith, Esme, Flora, Gwendolyn, Hazel, Ivy, Lettice, Lilias, Mirabel, Nell, Opal, Petra, Rhiannon, Rosamund, Thea, Verity, Winifred, Agnes, Dulcie, Effie, Honor, Leda, Clover, Bettany, Sidony',
    'title.names.he': 'Theo, Ezra, Alaric, Ambrose, Barnaby, Caspian, Cedric, Cormac, Crispin, Declan, Rupert, Emrys, Evander, Felix, Gideon, Godric, Hamish, Ignatius, Jasper, Lachlan, Lucan, Magnus, Malachy, Merrick, Oisin, Osric, Percival, Peregrine, Piers, Quentin, Rafferty, Roderick, Rufus, Silas, Tristan, Ulric, Valentine, Wystan, Augustin, Desmond, Fergus, Gareth, Leopold, Matthias, Niall, Anselm, Benedict, Hugo, Lorcan, Dorian',
    'title.names.they': 'Wren, Ash, Rowan, Sable, Marlo, Juniper, Avery, Bryn, Ellis, Emery, Finch, Indigo, Jude, Kit, Linden, Morgan, Quinn, Robin, Sage, Shay, Sparrow, Tarn, Vale, Wynn, Arden, Blair, Briar, Cass, Darcy, Aubrey, Lark, Sorrel, Teagan, Rumer, Perry, Ainsley, Merritt, Remy, Tansy, Reese',
    'title.names.world_she': 'Adaeze, Amaya, Anahí, Chiyo, Esi, Farida, Haeun, Imani, Itzel, Leilani, Mei, Mirela, Parisa, Priya, Saanvi, Sakura, Shirin, Sigrún, Solveig, Tala, Thandiwe, Yara, Zainab, Zarina, Ximena, Aigerim, Nilufar, Ngaio, Aroha, Malia',
    'title.names.world_he': 'Arjun, Bao, Chidi, Dawit, Emeka, Haruto, Ilyas, Inti, Kwame, Kofi, Mateo, Nikolai, Oren, Rustam, Santiago, Tariq, Yusuf, Zoltan, Ruslan, Ikaika, Kaito, Anwar, Bayani, Matiu, Temir, Hemi, Bohdan, Farhan, Jun, Thabo',
    'title.names.world_they': 'Akira, Hikaru, Rei, Yuki, Noor, Kalani, Tenzin, Ayodele, Nima, Dara, Lumi, Rumi, Sami, Amani, Chidera, Eun, Sasha, Ariya, Sefa, Ola',
    'title.randomName': 'Random name',
    'title.pronouns': 'Pronouns', 'title.pronoun.she': 'she/her', 'title.pronoun.he': 'he/him', 'title.pronoun.they': 'they/them',
    'title.defaultName': 'Wren',

    'top.people': 'Character & people',
    'top.quit': 'Save & return to title',
    'top.lang': 'Language',
    'date.sub': 'YEAR {year} · MONTH {turn} OF {max}',

    'tab.you': 'You',
    'tab.people': 'People',
    'tab.clues': 'Clues', 'side.noClues': 'Nothing to follow yet. Odd things you notice, and where they point, gather here.', 'journal.finished': 'Followed up',
    'tab.journal': 'Journal',

    'side.conditions': 'Conditions & commitments',
    'side.nothing': 'Nothing yet.',
    'side.close': 'Close',
    'side.monthsLeft': '{n} mo',
    'side.noPeople': "You haven't really met anyone yet.",
    'side.relationship': 'Relationship {n}',
    'side.romance': 'Spark {n}',
    'side.spells': 'Spells',
    'side.spellCost': '{n} mana',
    'side.emptyJournal': 'Your story is yet unwritten.',
    'journal.when': '{month} · Y{year}',
    'journal.act': 'Act {n} of {of} · {name}',
    'journal.clues': 'Clues',
    'journal.leads': 'Leads',
    'journal.followed': 'followed',
    'journal.keyClue': 'a key clue: needed beneath the lake',
    'journal.log': 'What happened',

    'bond.friend': 'friend',
    'bond.close': 'close',
    'bond.rival': 'rival',
    'bond.nemesis': 'nemesis',
    'bond.partner': 'partner',
    'bond.ex': 'ex',

    'tag.class': 'Class',
    'tag.club': 'Club',
    'tag.job': 'Work',
    'tag.social': 'Social',
    'tag.romance': 'Romance',
    'tag.study': 'Study',
    'tag.mystery': 'Mystery',
    'tag.danger': 'Danger',
    'tag.crisis': 'Crisis',
    'tag.festival': 'Festival',
    'tag.money': 'Coin',
    'tag.nature': 'Grounds',
    'tag.home': 'Home',
    'tag.rival': 'Rivalry',
    'tag.exam': 'Exam',
    'tag.story': 'Chronicle',
    'tag.magic': 'Magic',
    'tag.default': 'Academy life',

    'card.consequence': 'consequence',
    'card.illustration': 'Illustration: {text}',
    'card.notAvailable': 'Not available',
    'card.cantAfford': 'Not enough crowns ({cost} needed)',
    'check.button': '{skill} check · {p}%',
    'check.chip': '{skill} check ({p}%) · {result}',
    'check.success': 'success',
    'check.failed': 'failed',
    'chip.max': 'max', 'chip.rel': '{name} {delta}',
    'chip.perf': '{track} performance {delta}',
    'chip.progress': '{track} progress {delta}',
    'chip.study': '{track} study {delta}',
    'chip.studyAll': 'Exam preparation, {n} courses',
    'chip.love': '{name} (spark) {delta}',
    'note.meet': 'You met {name}.',
    'note.bond': '{name}: {status}',
    'note.gain': '+ {state}',
    'note.lose': '− {state}',
    'note.spell': 'New spell: {spell} {level}',
    'note.spellBonus': 'New spell: {spell} {level} ({bonus})',
    'note.fact': 'You learned something about {name}.',
    'check.challengeChip': '{kind} ({p}%) · {result}',
    'check.challengeButton': '{kind} · {p}%',
    'check.combatButton': 'Combat · {p}% · −{cost} mana', 'check.examButton': 'Exam: {skill} · pass {p}% · A {a}%',
    'swing.wild': 'wild', 'swing.steady': 'steady', 'swing.luck': 'luck', 'challenge.combat': 'Combat',
    'course.tests': 'Tests {skill}', 'course.exam': '{tier} exam, {p}% pass today', 'course.teaches': 'teaches {spells}', 'job.outlook': 'About {gold} crowns a shift · {n} shifts a term', 'track.switch': 'Leaves {from}: your {rank} rank and {perf} performance; you start here as new',
    'tier.easy': 'Easy', 'tier.standard': 'Standard', 'tier.medium': 'Medium', 'tier.hard': 'Hard', 'tier.heroic': 'Heroic',
    'challenge.duel': 'Duel',
    'challenge.negotiate': 'Negotiation',
    'challenge.deceive': 'Deception',
    'challenge.exam': 'Exam',
    'challenge.research': 'Research',
    'challenge.brew': 'Brewing',
    'challenge.enchant': 'Enchanting',
    'challenge.feat': 'Feat',
    'challenge.spell': 'Spellwork',
    'challenge.win': 'win',
    'challenge.partial': 'partial',
    'challenge.lose': 'lose',
    'spell.button': '{spell} {level} · {cost} mana',
    'spell.short': 'Not enough mana',
    'preview.follows': 'Something follows from this.',
    'title.oldSave': 'Your saved game was from an older version of the game and can no longer be loaded. Its run log was kept.',
    'slots.tooOld': 'From an older version; can’t be loaded',
    'outcome.tap': 'tap or swipe to continue',
    'outcome.continue': 'Continue',

    'month.header': 'Year {year} · Month {turn} of {max}',
    'month.thisMonth': 'This month',
    'month.begin': 'Begin {month}',
    'month.continue': 'Continue',
    'season.1': 'The leaves turn. A new term begins.',
    'season.2': 'Lanterns over the lake.',
    'season.3': 'Fog creeps up the stairwells.',
    'season.4': 'Frost on the windows; exams in the air.',
    'season.5': 'Deep winter. The Midwinter Ball approaches.',
    'season.6': 'The thaw, and a new term.',
    'season.7': 'Storms roll in off the mountains.',
    'season.8': 'The lawns are green again. Tournament season.',
    'season.9': 'Blossom on every bough.',
    'season.10': 'High summer heat — and the Grand Examinations.',
    'season.11': 'Summer recess. The towers empty.',
    'season.12': 'The last weeks of summer. Stars begin to fall.',

    'ending.early': 'Your story ends early · {month}, Year {year}',
    'ending.graduation': 'Graduation · Ending',
    'ending.people': 'The people who mattered',
    'ending.again': 'Begin anew',
    'ending.journal': 'Read your journal',
    'ending.back': 'Back to the ending',
    'ending.fond': 'fond',
    'ending.cold': 'cold',
    'ending.export': 'Export this run',
    'ending.slot.mystery': 'The Hollow Star',
    'ending.slot.relationships': 'Bonds',
    'ending.slot.personal': 'Remembered as',

    // Playtest feedback: rate / comment on the current or previous card; runs are logged for export.
    'fb.this': 'This card',
    'fb.last': 'Last card',
    'fb.prev': 'Previous',
    'fb.ending': 'Ending',
    'fb.good': 'Good',
    'fb.bad': 'Bad',
    'fb.open': 'Rate & comment (F)',
    'fb.heading': 'Feedback',
    'fb.intro': 'Rate cards and leave notes for the writers. Everything is saved with this run’s log.',
    'fb.chose': 'You chose: {choice}',
    'fb.placeholder': 'What worked, what didn’t? Tone, typos, balance, a confusing choice…',
    'fb.save': 'Save',
    'fb.cancel': 'Cancel',
    'fb.none': 'Nothing to rate yet.',
    'fb.when': '{month} · Y{year}',
    'fb.log': 'Playtest log: {runs} runs · {notes} notes',
    'fb.export': 'Export',

    // Saved games and the optional server
    // The day and the map (phase 2b)
    'slot.morning': 'Morning', 'slot.noon': 'Noon', 'slot.afternoon': 'Afternoon', 'slot.evening': 'Evening', 'slot.night': 'Night', 'slot.midnight': 'Midnight',
    'phase.term': 'Term', 'phase.break': 'Break', 'phase.wrapup': 'Wrap-up',
    'map.title': '{month} · Year {year} · {phase}',
    'map.question1': 'Where will you spend the afternoon?',
    'map.question2': 'Where will you spend the afternoon and the evening?',
    'map.q.afternoon': 'Where will you spend the afternoon?', 'map.q.evening': 'Where will you spend the evening?', 'map.q.midnight': 'Where will you go tonight?',
    'map.visitOf': 'visit {n} of {of}', 'map.stayIn': 'Stay in', 'map.festivalHere': '{event}: at {place}, this {slot}',
    'map.choose': 'choose…',
    'map.go': 'Begin the day',
    'map.showList': 'List view',
    'map.showMap': 'Map view',
    'map.undiscovered': 'Somewhere you haven’t found yet.',
    'map.full': 'Both visits are picked; tap one to change it.',
    'map.closed': '{name} isn’t open then (open: {hours}).',
    'map.closedNow': 'closed now',
    'map.open': 'open',
    'map.hinted': 'not yet found',
    'map.festival': 'festival this {slot}',
    'map.here': 'here: {names}',
    'map.new': 'something new',
    'map.practiceLeft': 'Practice · {n} left',
    'map.shiftsLeft': 'Shift · {n} left',
    'map.shiftsDone': 'Shifts · all done this term',
    'map.visitedNow': 'visited today',
    'map.visitedToday': 'You’ve already been to {name} today.',
    'map.festivalSoon': 'getting ready for the festival this {slot}',
    'map.festivalLater': '{name} is closed while it gets ready for the festival this {slot}.',
    'map.sessionsLeft': 'Session · {n} left',
    'menu.confirm': 'Confirm ({n}/{max})',
    'due.next': '{delta} next month', 'due.heading': 'Next month:', 'due.other': 'Other',
    'menu.tagline': 'A choice', 'menu.lead': 'Make your choice', 'menu.leadMany': 'Choose up to {n}',
    'menu.prompt': 'Choose one.', 'menu.promptMany': 'Choose up to {n}, then confirm.',
    'amounts.marks': 'Signs (+ ++ +++)', 'amounts.numbers': 'Numbers', 'amounts.icons': 'Icons only',
    'settings.heading': 'Settings', 'settings.amounts': 'Amounts in previews',
    'settings.amountsHint': 'How a choice\'s effects show before you make it. Afterwards the outcome always shows the numbers; Crowns and Mana are always exact.',
    'settings.notes': 'Illustrative text', 'settings.notesHint': 'The line under each card that describes its picture.',
    'settings.on': 'Show', 'settings.off': 'Hide',
    'settings.portraits': 'Portrait art', 'settings.portraitsHint': 'How the people you meet are drawn.',
    'portraits.minimal': 'Minimal', 'portraits.original': 'Original',
    'settings.motion': 'Motion', 'settings.motionHint': 'Animations and the moving sky. Reduced keeps the screen still, for anyone who finds motion uncomfortable.',
    'motion.full': 'Full', 'motion.reduced': 'Reduced',
    'settings.fight': 'Fights', 'settings.fightHint': 'How your opponents choose their moves. It changes only their decisions, never the numbers: their level, Health, Mana and spells stay the same. Engine takes the best move it can find every turn; the lower settings play more naturally, drifting from the best move and leaning on the habits that fit who they are.',
    'settings.fightEngine': 'Engine analysis', 'settings.fightEngineHint': 'Cheating: during a fight, a toggle shows the engine’s analysis of your turn: how good each move is, the best one, and the lines it expects.',
    'settings.engineOff': 'Off', 'settings.engineOn': 'On (cheating)',
    'difficulty.easy': 'Easy', 'difficulty.medium': 'Medium', 'difficulty.hard': 'Hard', 'difficulty.engine': 'Engine',
    // The credit line at the bottom of the title screen and of Settings, after '© year author'.
    'credits.made': 'Made in Grimoire Script', 'credits.license': 'Free to use: WTFPL',
    'credits.source': 'Source on GitHub', 'credits.issues': 'Report a problem',
    // A fight: the combat minigame played over the card (src/combat-ui.js). The minigame's own lines (flavor, what an
    // action does) are translated with its tables, not here.
    'check.fight': 'Fight', 'check.fightButton': 'Fight · {foe} · level {level}', 'check.fightChip': 'Fight: {result} · {reason}',
    'fight.loading': 'The fight is starting…', 'fight.engine': 'Engine analysis', 'fight.evalBar': 'The engine’s evaluation for you, in Health',
    'fight.engineHead': 'Engine · depth {depth} · {nodes}k positions · {s} s', 'fight.engineDeeper': 'searching deeper…', 'fight.engineThinking': 'Engine · thinking…',
    'fight.engineWaits': 'Engine · waits for your turn', 'fight.engineTime': 'Engine time per turn', 'fight.seconds': '{n} s',
    'fight.engineNote': 'Values are in Health from your side: + favours you. Each line is both sides’ best play as the engine sees it: gold chips are your moves, blue chips your opponent’s, and | separates exchanges.',
    'fight.lineWin': 'KO · you win', 'fight.lineLoss': 'KO · you lose', 'fight.lineDraw': 'draw', 'fight.noEngine': 'The fight couldn’t load. Reload the page; if you play on a local server, restart it.',
    'error.choice': 'That choice couldn’t go through, so nothing changed. Try again, or pick another option.', 'fight.you': 'You', 'fight.lv': 'Lv {n}', 'fight.spellLevel': 'Level {n}', 'fight.inspect': 'Look at your opponent',
    'fight.choosing': '{name} is choosing…', 'fight.choosingHint': 'Their move appears when they commit.',
    'fight.theirMove': 'What their move does', 'fight.theyCommit': 'They commit:', 'fight.compelled': 'Compelled:',
    'fight.youFirst': 'You commit first', 'fight.youFirstHint': 'Their reply stays hidden until you do.', 'fight.theyFirst': 'they commit first',
    'fight.pickHint': 'Pick an action to see what it does. Pick it again to act.', 'fight.waiting': 'Waiting for your opponent…',
    'fight.commit': 'Commit', 'fight.cast': 'Cast', 'fight.free': 'Free', 'fight.mana': '{n} Mana', 'fight.hp': '{n} HP',
    'fight.hpBar': 'HP {v} / {max}', 'fight.manaBar': 'Mana {v} / {max} · flux {flux}: Reclaim turns flux back into Mana',
    'fight.flux': 'Flux: Reclaim turns it back into Mana', 'fight.shield': 'Shield: absorbs damage before HP',
    'fight.construct': '{name}: {left} of {of} HP left, until exchange {until}',
    'fight.frozen': 'Frozen · you thaw after this exchange', 'fight.channel': '{spell} · Hold or Release', 'fight.haste': 'Haste · one bundle of basic actions',
    'fight.frozenName': 'Frozen', 'fight.rimeReady': 'Rime ready', 'fight.shieldNote': '{n} shield', 'fight.holds': 'held {n}×', 'fight.banked': '{n} banked', 'fight.hpOf': '{left} of {of} HP',
    'fight.exchange': 'Exchange {n}', 'fight.exchangeShow': 'Exchange {n}: show it in full', 'fight.youLed': 'you led', 'fight.theyLed': 'they led',
    'fight.youLead': 'you lead', 'fight.theyLead': 'they lead', 'fight.committed': 'committed {action}', 'fight.latest': 'Back to the latest',
    'fight.first': '1st', 'fight.yourMove': 'Your move this exchange', 'fight.until': 'until exchange {n}', 'fight.trackLabel': 'Exchanges: the past, this one and the next ones',
    'fight.slotFrozen': 'Exchange {n}: {who} frozen', 'fight.slotCompelled': 'Exchange {n}: compelled to repeat {action}',
    'fight.slotTheyLead': 'Exchange {n}: they commit first, so you see their move', 'fight.slotYouLead': 'Exchange {n}: you commit first; their move stays hidden',
    'fight.canDo': 'What they can do', 'fight.canDoNow': 'What they can do now', 'fight.lastMoves': 'Their last moves', 'fight.everything': 'Everything they can do →', 'fight.close': 'Close',
    'fight.sheetLine': 'Level {level} · HP {hp}/{maxHp} · Mana {mana}/{maxMana}', 'fight.plusFlux': '(+{n} flux)',
    'fight.unfitHealth': 'You come in hurt (Health {n}): your HP in the fight starts low.', 'fight.unfitMana': 'Your Mana isn\'t full ({n} of {max}): the rest starts as flux, which takes a Reclaim.',
    'fight.win': 'Victory', 'fight.lose': 'Defeat', 'fight.draw': 'Draw', 'fight.continue': 'Continue',
    'fight.reason.knockout': 'by knockout', 'fight.reason.decision': 'on points', 'fight.reason.stalemate': 'neither can finish it', 'fight.reason.conceded': 'by concession',
    'size.tiny': 'tiny', 'size.small': 'small', 'size.medium': 'medium', 'size.large': 'large', 'size.huge': 'huge',
    'note.grade': '{track}: {grade}',
    'note.regrade': '{track}: {from} → {grade} on appeal',
    'note.gradeWhy': '{track}: {grade} ({skill} {value} against an exam bar of {bar}; pass chance {p}%)',
    'note.enrol': 'Enrolled: {track}',
    'note.join': 'Joined: {track}',
    'note.leave': 'Left: {track}',
    'note.thesisDone': '{track}: done',
    'note.promote': 'Promoted in {track}',
    'note.dropped': 'Dropped from {track}',
    'note.missed': '{track}: missed {n}',
    'note.attend': '{track}: {n} left this term', 'note.wage': '{track}: your wages, {gold} crowns',
    'note.attendBreak': '{track}: an extra visit (breaks don\'t count toward the term)',
    'note.discover': 'New place: {place}',
    'note.clue': 'A clue found',
    'side.studies': 'Studies & commitments',
    'side.gpa': 'GPA {gpa}',
    'side.enrolled': 'Enrolled this term',
    'side.prep': 'Preparation {n}/{cap}',
    'side.examIn': 'exam in {n} months',
    'side.examNext': 'exam next month',
    'side.examNow': 'exam this month',
    'side.passToday': 'Pass {p}%',
    'side.oddsTip': 'If the exam were today: pass {pass}%, A or B {top}%. Lectures and study choices add preparation (up to the cap); your skill keeps growing until the exam.',
    'side.grades': 'Grades: {grades}',
    'side.rankLine': '{rank} · {due} due this term',
    'side.shiftsDone': '{rank} · all shifts done this term',
    'side.noShifts': '{rank} · no shifts over the break',
    'side.perf': '{n}%',
    'side.progress': 'Progress {n}%',
    'side.society': 'a society: no dues, no ranks', 'side.applied': 'Applied',
    'slots.heading': 'Saved games',
    'slots.auto': 'Autosave',
    'slots.slot': 'Slot {n}',
    'slots.empty': 'Empty',
    'slots.info': '{name} — {month}, Year {year}',
    'slots.saveHere': 'Save here',
    'slots.load': 'Load',
    'slots.saved': 'Saved',
    'slots.close': 'Close',
    'slots.whereServer': 'Stored on the server. Loading a slot continues it as a new run.',
    'slots.whereLocal': 'Stored in this browser. Loading a slot continues it as a new run.',
    'net.connected': 'Connected: runs and feedback are saved on the server.',
    'net.admin': 'Admin',
    'net.needInvite': 'This server needs an invite link to save online. Playing in this browser only.',
    'net.badSync': 'That sync link didn’t work. Playing in this browser only.',
    'sync.heading': 'Play on another device',
    'sync.hint': 'This code is the only key to your online saves. Open the link (or enter the code) on another device to continue there.',
    'sync.show': 'Show code',
    'sync.copyLink': 'Copy link',
    'sync.copied': 'Link copied.',
    'sync.use': 'Use a code',
    'sync.confirm': 'Switch to that code’s saves? The game in this browser is set aside (its log and feedback are kept).',
    'sync.bad': 'That code wasn’t found.',

    // Pronoun tables used by {they} {them} {their} {theirs} {are} {s} in content text.
    'pronoun.she.they': 'she', 'pronoun.she.them': 'her', 'pronoun.she.their': 'her', 'pronoun.she.theirs': 'hers', 'pronoun.she.are': 'is', 'pronoun.she.s': 's',
    'pronoun.he.they': 'he', 'pronoun.he.them': 'him', 'pronoun.he.their': 'his', 'pronoun.he.theirs': 'his', 'pronoun.he.are': 'is', 'pronoun.he.s': 's',
    'pronoun.they.they': 'they', 'pronoun.they.them': 'them', 'pronoun.they.their': 'their', 'pronoun.they.theirs': 'theirs', 'pronoun.they.are': 'are', 'pronoun.they.s': '',
  };

  /* ------------------------------------------------------------------ helpers */
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ('000000' + (h >>> 0).toString(16)).slice(-6);
  }
  const enc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
  const dec = (s) => String(s).replace(/\\(n|\\)/g, (m, c) => (c === 'n' ? '\n' : '\\'));

  /* ------------------------------------------------------------------ .lang parser */
  // Returns { blocks: { 'event:pyro_candle': { title: {text, hash, line} } }, order: [...], errors: [] }
  function parseLang(text, path) {
    const out = { blocks: {}, order: [], errors: [], path };
    let cur = null;
    String(text).replace(/\r\n?/g, '\n').split('\n').forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      let m = line.match(/^@([a-z]+)(?:\s+([a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)?))?$/);
      if (m) {
        cur = m[1] + (m[2] ? ':' + m[2] : '');
        if (!out.blocks[cur]) { out.blocks[cur] = {}; out.order.push(cur); }
        return;
      }
      m = line.match(/^([A-Za-z0-9_.@-]+)(?:\s+\[([0-9a-f]{6})\])?\s*=\s?(.*)$/);
      if (!m) { out.errors.push(path + ':' + (i + 1) + ': expected "key [hash] = text", "@block id" or "# comment"'); return; }
      if (!cur) { out.errors.push(path + ':' + (i + 1) + ': entry before any @block header'); return; }
      if (out.blocks[cur][m[1]]) out.errors.push(path + ':' + (i + 1) + ': duplicate key "' + m[1] + '" in @' + cur.replace(':', ' '));
      out.blocks[cur][m[1]] = { text: dec(m[3]), hash: m[2] || null, line: i + 1 };
    });
    return out;
  }

  // sources: [{path, text}] for one language -> merged locale
  function loadLocale(lang, sources) {
    const loc = { lang, blocks: {}, ui: {}, errors: [], files: {} };
    // Files in an "_in/" inbox (staged translations) are merged last so they win.
    const ordered = (sources || []).slice().sort((a, b) => (/\/_in\//.test(a.path) ? 1 : 0) - (/\/_in\//.test(b.path) ? 1 : 0));
    for (const src of ordered) {
      const p = parseLang(src.text, src.path);
      loc.errors.push(...p.errors);
      loc.files[src.path] = p;
      for (const b of p.order) {
        const target = b === 'ui' ? null : (loc.blocks[b] = loc.blocks[b] || {});
        for (const [k, v] of Object.entries(p.blocks[b])) {
          if (b === 'ui') { if (v.text !== '' || (k.startsWith('pronoun.') && loc.ui[k] == null)) loc.ui[k] = v.text; continue; }  // pronouns may be intentionally empty
          if (v.text === '' && target[k] && target[k].text !== '') continue;  // never let an empty line erase a translation
          target[k] = v;
        }
      }
    }
    return loc;
  }

  /* ------------------------------------------------------------------ content traversal */
  // Calls cb(blockKey, fieldKey, text, set, def) for every translatable string, in source order.
  const FIELDS = {
    game: ['title', 'subtitle', 'intro'],
    resource: ['name', 'desc'],
    skill: ['name', 'desc'],
    npc: ['name', 'short', 'title', 'house', 'desc'],
    state: ['name', 'desc', 'money'],
    event: ['title', 'text', 'scene'],
    ending: ['title', 'text', 'scene'],
    hook: ['label'],
    // Worldbook text players will see (lore, vocab, archetypes and timeline are authoring context only).
    place: ['name', 'desc', 'hint'],
    track: ['name', 'level_names', 'ranks', 'desc', 'picked'],
    spell: ['name', 'desc'],
    fact: ['text'],
    faction: ['name', 'desc'],
    arc: ['name', 'act_names', 'desc'],
    clue: ['thread', 'name', 'text'],
  };
  const EFFECT_FIELDS = { resource: ['on_zero'], state: ['on_add', 'tick', 'on_expire', 'on_remove'], hook: ['do'], event: ['on_show'] };

  function walkSays(effects, fn) {
    if (!effects) return;
    for (const st of effects) {
      if (st.t === 'say') fn(st);
      if (st.t === 'if') { st.branches.forEach((b) => walkSays(b.body, fn)); walkSays(st.else, fn); }
      else if (st.t === 'challenge') { walkSays(st.win, fn); walkSays(st.partial, fn); walkSays(st.lose, fn); }
      else if (st.body) { walkSays(st.body, fn); walkSays(st.else, fn); }
    }
  }

  function visit(content, cb) {
    const defs = [];
    const g = content.game || {};
    defs.push(g.block ? g : Object.assign({ block: 'game', id: 'game' }, g));
    for (const col of ['resources', 'skills', 'npcs', 'states', 'events', 'endings', 'hooks', 'places', 'tracks', 'spells', 'facts', 'factions', 'arcs', 'clues']) defs.push(...Object.values(content[col] || {}));
    defs.sort((a, b) => (a.file || '').localeCompare(b.file || '') || (a.line || 0) - (b.line || 0));
    for (const d of defs) {
      const kind = d.block || 'game';
      const bkey = kind === 'game' ? 'game' : kind + ':' + d.id;
      for (const f of FIELDS[kind] || []) if (typeof d[f] === 'string' && d[f]) cb(bkey, f, d[f], (v) => { d[f] = v; }, d);
      if (kind === 'game' && Array.isArray(d.months)) d.months.forEach((m, i) => cb(bkey, 'month.' + (i + 1), m, (v) => { d.months[i] = v; }, d));
      // A say and its say[npc] overrides: the override's key is the say's key plus @npc.
      const says = (prefix, effects) => { let n = 0; walkSays(effects, (st) => {
        n++; const k = prefix + '.say.' + n;
        cb(bkey, k, st.text, (v) => { st.text = v; }, d);
        for (const who of Object.keys(st.overrides || {})) cb(bkey, k + '@' + who, st.overrides[who], (v) => { st.overrides[who] = v; }, d);
      }); };
      for (const ef of EFFECT_FIELDS[kind] || []) says(ef, d[ef]);
      if (kind === 'event') for (const o of d.options || []) {
        cb(bkey, 'opt.' + o.key + '.label', o.label, (v) => { o.label = v; }, d);
        if (o.hint) cb(bkey, 'opt.' + o.key + '.hint', o.hint, (v) => { o.hint = v; }, d);
        if (o.locked) cb(bkey, 'opt.' + o.key + '.locked', o.locked, (v) => { o.locked = v; }, d);
        says('opt.' + o.key, o.effects);
      }
    }
  }

  // Ordered list of every translatable string: [{file, block, key, text, hash}]
  function extract(content) {
    const out = [];
    visit(content, (block, key, text, set, def) => out.push({ file: def.file || 'content/core/rules.grim', block, key, text, hash: hash(text) }));
    return out;
  }

  // Rewrite compiled content in place. Returns stats.
  function applyContent(content, locale) {
    const stats = { total: 0, translated: 0, stale: 0, missing: [] };
    if (!locale) return stats;
    visit(content, (block, key, text, set) => {
      stats.total++;
      const e = locale.blocks[block] && locale.blocks[block][key];
      if (!e || e.text === '') { stats.missing.push(block + ' ' + key); return; }
      if (e.hash && e.hash !== hash(text)) stats.stale++;
      stats.translated++;
      set(e.text);
    });
    const P = pronounTable(locale.ui);
    content.pronouns = P;
    content.lang = locale.lang;
    return stats;
  }

  function pronounTable(ui) {
    const t = {};
    for (const p of ['she', 'he', 'they']) {
      t[p] = {};
      for (const f of ['they', 'them', 'their', 'theirs', 'are', 's']) {
        const k = 'pronoun.' + p + '.' + f;
        t[p][f] = ui && ui[k] != null ? ui[k] : UI_EN[k];
      }
    }
    return t;
  }

  /* ------------------------------------------------------------------ runtime (UI) */
  let current = { lang: 'en', ui: {}, combat: {} };
  // The fight's strings (locales/<lang>/combat.lang, @combat) are kept for the combat minigame (src/ui.js hands them over).
  function use(locale) {
    const combat = locale && locale.blocks && locale.blocks.combat ? Object.fromEntries(Object.entries(locale.blocks.combat).filter(([, v]) => v.text !== '').map(([k, v]) => [k, v.text])) : {};
    current = locale ? { lang: locale.lang, ui: locale.ui || {}, combat } : { lang: 'en', ui: {}, combat: {} };
  }
  function combatText() { return current.combat; }
  function t(key, vars) {
    let s = current.ui[key] != null ? current.ui[key] : UI_EN[key];
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }
  function lang() { return current.lang; }
  // A random first name for the title screen, fitting the chosen pronouns: she/her and he/him draw their own pool, or
  // now and then a they/them one; they/them only that. One time in five from the world pools. Never `avoid` (the last).
  const NAME_SHARE = { world: 0.2, neutral: 0.25 };
  function randomName(pronouns, rand = Math.random, avoid = null) {
    const p = ['she', 'he'].includes(pronouns) ? pronouns : 'they';
    const pool = (rand() < NAME_SHARE.world ? 'world_' : '') + (p !== 'they' && rand() < NAME_SHARE.neutral ? 'they' : p);
    const names = t('title.names.' + pool).split(/\s*[,，、]\s*/).filter((n) => n && n !== avoid);
    return names[Math.floor(rand() * names.length)] || t('title.defaultName');
  }

  return { UI_EN, hash, enc, dec, parseLang, loadLocale, visit, extract, applyContent, pronounTable, use, t, lang, combatText, randomName, FIELDS };
});

/*
 * Crux's library: what each kind of meeting throws at you. Every bound negotiation belongs to one circumstance (the
 * kind of scene it is, read from its prose: a panel, an official, a deal, a heart-to-heart, a crowd, the press, the wild
 * wood, the shadow of the Hollow Star). Each circumstance has its own crux, its own pool of small arguments, its own
 * demands and the skill it leans on; a few common cards can turn up anywhere.
 *
 * A small argument tests one signal (a skill, your standing, your bond with them, or your record) against the
 * encounter's level plus its own `dc`, which runs from easy (−20) to near-hopeless (+25): some are meant to be
 * deflected. `sway` is exactly how much winning it moves them (the crux rises by that much Agreement, shown on the card).
 * `fail` is what failing it costs (rules.rs fail_amounts): Suspicion, their goodwill, Patience, the others hardening, Mana,
 * crowns, Health, or it coming back later. `fx` (EFFECTS) is rarer: about one card in six. Lines name the doubt, not
 * the words, so they fit anyone in that circumstance, a headmistress or a shadow stag alike.
 *
 * Data only: the rules that play these cards, and how a deck is drawn from them, are the Rust core's (rust/core/src/
 * rules.rs), which reads this file through rust/export-data.js. The page reads it for the cards' words.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CruxCards = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SIGNALS = {
    charm: 'Charm', lore: 'Lore', guile: 'Guile', arcana: 'Arcana', alchemy: 'Alchemy', vigor: 'Vigor',
    standing: 'Standing', bond: 'Bond', record: 'Record',
  };
  const MAIN = ['lore', 'charm', 'guile'];

  // What an argument does besides its check and its failure: few cards (about one in six), each changing a rule rather
  // than a number. `good`: whether it helps you (its banner's colour); `short`: the banner's line on the card.
  const EFFECTS = {
    tell: { name: 'Tell', good: true, short: 'Win: see their next 3', text: 'Win it and you see their next three arguments, and may send the first to the bottom.' },
    opening: { name: 'An opening', good: true, short: 'Win: next push free', text: 'Win it and your next push for the crux costs no Patience.' },
    clears: { name: 'Clears the air', good: true, short: 'Win: Suspicion to 0', text: 'Win it and their Suspicion falls back to nothing.' },
    linked: { name: 'Linked', good: true, short: 'Win: the hardest falls too', text: 'Win it and the hardest other argument on the table falls with it, counted as won.' },
    volatile: { name: 'High stakes', good: false, short: 'Win ×2 · fail ×2', text: 'Win it and it counts double. Fail it and the cost is double too.' },
    sore: { name: 'Sore point', good: false, short: 'No push while it stands', text: 'While it stands, you can’t push for the crux.' },
    watchful: { name: 'Watchful', good: false, short: 'Spells +1 Suspicion', text: 'While it stands, every spell you cast costs 1 more Suspicion.' },
  };

  // Their spells: in a few informal meetings (half of those whose circumstance lists `hexes`, never in a formal
  // room: rules.rs hex_of), one of their arguments is a spell they are working on you. It can't be deflected, only resisted (Confront: an
  // Arcana check; it stays if you fail) or countered (Ward, Reflect). Left until its `wait` runs out, it lands: `lands`
  // (rules.rs hex_lands) says what that does. The man in grey always brings Compel.
  const HEXES = {
    compel: { id: 'hex_compel', hex: 'compel', title: 'Compulsion', text: 'His voice is very reasonable. You find yourself agreeing with it.', signal: 'arcana', dc: 12, sway: 1, wait: 4, short: 'Lands: you lose', lands: 'You agree to everything, in a voice not your own. The meeting is lost.' },
    bewitch: { id: 'hex_bewitch', hex: 'bewitch', title: 'Bewitched', text: 'Something sweet in the air makes your best points sound foolish.', signal: 'arcana', dc: 4, sway: 1, wait: 3, short: 'Lands: the crux −3', lands: 'Your best points sound foolish now: −3 Agreement.' },
    hush: { id: 'hex_hush', hex: 'hush', title: 'A Hush', text: 'A quiet settles on your hands, the kind that smothers spells.', signal: 'arcana', dc: 4, sway: 1, wait: 3, short: 'Lands: no more spells', lands: 'Your magic is smothered: no more spells this meeting.' },
    lightfingers: { id: 'hex_lightfingers', hex: 'lightfingers', title: 'Light Fingers', text: 'A charm on the purse strings, while you’re busy talking.', signal: 'arcana', dc: 0, sway: 1, wait: 3, short: 'Lands: your purse', lands: 'Your purse is lighter, and so is your Mana.' },
  };

  // a(id, title, text, signal, dc, sway, fail, fx)
  const a = (id, title, text, signal, dc, sway, fail, fx = null) => ({ id, title, text, signal, dc, sway, fail, fx });
  // Demands: not a check but a requirement, met for certain or not at all (rules.rs gate_for, meets). `gate`: crowns
  // (pay them), health (pay it), renown (have it), spell (have it prepared and spend its Mana), skill (have `skill`, or
  // the circumstance's lean, at their level + 5).
  const d = (id, title, text, gate, extra = {}) => ({ id, title, text, signal: null, dc: 0, sway: 2, fail: 'sus', fx: null, gate, ...extra });

  const COMMON = [
    a('their_share', 'Their Share', 'They can see what you gain. They can’t yet see what they do.', 'charm', -12, 1, 'cool'),
    a('too_good', 'Too Good to Be True', 'It sounds too good, and in their experience it usually is.', 'guile', 0, 1, 'sus'),
    a('loose_terms', 'Loose Terms', 'Your words are doing more work than your meaning.', 'lore', -4, 1, 'tire'),
    a('contradiction', 'A Contradiction', 'Two of your best points can’t both be true.', 'lore', 24, 3, 'cool2', 'sore'),
    a('silence', 'Silence', 'Nothing comes back across the table. The quiet is doing the work.', 'vigor', 5, 1, 'tire'),
    a('the_point', 'The Point', 'They have stopped listening to the preamble.', 'charm', -18, 1, 'sus'),
  ];

  const CIRCUMSTANCES = {
    hearing: {
      name: 'A hearing', lean: 'lore',
      crux: { signal: 'lore', title: 'Not Yet Proven', text: 'They don’t doubt you believe it. They doubt it would survive another hour of questions.' },
      cards: [
        a('method', 'Method', 'The result may stand. How you reached it may not.', 'lore', 4, 2, 'cool'),
        a('sources', 'Sources', 'Every claim needs a page and a name behind it.', 'lore', 16, 2, 'sus'),
        a('weak_chapter', 'The Weak Chapter', 'They have found the part of your work you hoped they would skip.', 'record', 26, 3, 'cool2', 'sore'),
        a('obvious_objection', 'The Obvious Objection', 'There is an objection anyone would raise, and you have not answered it.', 'lore', -10, 1, 'tire'),
        a('small_point', 'A Small Point', 'A minor objection that turns out not to be minor.', 'lore', -2, 1, 'grudge'),
        a('silent_examiner', 'The Silent Examiner', 'One of them has said nothing, and is writing everything down.', 'guile', 20, 2, 'harden', 'watchful'),
        a('show_it', 'Show It Working', 'Theory will not do. They want to see it.', 'arcana', 8, 2, 'drain', 'opening'),
        a('under_the_lamp', 'Under the Lamp', 'The room is warm, the questions are slow, and your voice is going.', 'vigor', 0, 1, 'tire'),
        a('generous_reading', 'A Generous Reading', 'Someone on the panel wants to be on your side, if you give them the words.', 'charm', -6, 1, 'sus', 'clears'),
        a('first_principles', 'First Principles', 'They take it all the way back to the beginning, and wait.', 'lore', 30, 3, 'cool2'),
        a('the_hourglass', 'The Hourglass', 'The sand is running and the work is not finished.', 'alchemy', 6, 1, 'tire'),
        a('credentials', 'Credentials', 'Only someone who truly knows the field gets a hearing.', 'lore', 18, 3, 'cool2'),
      ],
      demands: [
        d('show_the_spell', 'Show Me the Spell', 'They will believe it when they see it cast.', 'spell'),
      ],
    },
    authority: {
      name: 'Authority', lean: 'lore',
      crux: { signal: 'standing', title: 'The Rule Stands', text: 'The rules don’t bend. You need a reason they should, this once.' },
      cards: [
        a('procedure', 'Procedure', 'There is a proper way to ask for this, and you have not followed it.', 'lore', -8, 1, 'tire'),
        a('no_exceptions', 'No Exceptions', 'Bend the rule once, and everyone will want it bent.', 'standing', 18, 2, 'harden', 'watchful'),
        a('your_record', 'Your Record', 'It is all in a file, and the file is not kind.', 'record', 6, 2, 'cool'),
        a('letter_of_it', 'The Letter of It', 'What is written says otherwise, and they mean to follow what is written.', 'lore', 2, 1, 'grudge'),
        a('quiet_word', 'A Quiet Word', 'If it can be settled without anyone writing it down, they are listening.', 'guile', -4, 1, 'sus', 'tell'),
        a('precedent', 'Precedent', 'Grant it once and it will be quoted back at them for years.', 'lore', 22, 2, 'cool'),
        a('deference', 'Deference', 'They expect to be addressed properly, and first.', 'charm', -10, 1, 'cool'),
        a('the_ledger', 'The Ledger', 'The numbers say what they say, and they are written in ink.', 'lore', 26, 3, 'cost'),
        a('above_them', 'Above Their Head', 'Somebody higher up will read this, and they know it.', 'standing', 28, 3, 'sus2'),
        a('office_hours', 'Office Hours', 'Others are waiting, and the clock on the wall is loud.', 'vigor', 0, 1, 'tire'),
        a('clean_hands', 'Clean Hands', 'They need to be able to say they did it properly.', 'guile', 8, 2, 'sus'),
      ],
      demands: [
        d('a_fee', 'A Fee', 'There is a fee for this, and it is not waived.', 'crowns'),
        d('who_are_you', 'Who Are You?', 'They only deal with people whose names they know.', 'renown'),
      ],
    },
    trade: {
      name: 'A deal', lean: 'guile', hexes: ['lightfingers'],
      crux: { signal: 'guile', title: 'Their Price', text: 'Nothing leaves this table for less than it is worth to them.' },
      cards: [
        a('opening_price', 'The Opening Price', 'The first figure is a joke, and you are meant to laugh.', 'guile', -12, 1, 'cost'),
        a('other_buyers', 'Other Buyers', 'Someone else is interested, or so they say.', 'vigor', 16, 2, 'harden'),
        a('going_rate', 'The Going Rate', 'Your figure does not match what these things are worth.', 'lore', 0, 1, 'cost'),
        a('worth_their_while', 'Worth Their While', 'It has to be worth their while.', 'charm', 4, 2, 'cool', 'opening'),
        a('walk_away', 'The Walk Away', 'You could leave. They need to believe you will.', 'guile', 24, 3, 'cool2'),
        a('quality', 'Quality', 'They turn it slowly in the light to show you it is the real thing.', 'alchemy', -2, 1, 'tire'),
        a('sweetener', 'A Sweetener', 'A little extra on the side would smooth things.', 'charm', -8, 1, 'cost'),
        a('old_debt', 'An Old Debt', 'Something is still owed from last time.', 'bond', 8, 2, 'grudge'),
        a('the_scales', 'The Scales', 'Their weights are not quite honest, and they know you know.', 'guile', 28, 3, 'sus2'),
        a('back_and_forth', 'Back and Forth', 'Every number you name is somewhere for them to start.', 'guile', 6, 1, 'tire'),
        a('in_writing', 'In Writing', 'Get it written down, or it never happened.', 'lore', 18, 2, 'sus'),
      ],
      demands: [
        d('their_price', 'Cash on the Table', 'Nothing moves until something changes hands.', 'crowns'),
        d('a_reference', 'A Reference', 'They deal with people of some reputation.', 'renown'),
      ],
    },
    heart: {
      name: 'A matter of the heart', lean: 'charm',
      crux: { signal: 'bond', title: 'What It Means', text: 'This is not about winning. They need to know you mean it.' },
      cards: [
        a('the_hurt', 'The Hurt', 'Whatever you say, they will hear the thing you did first.', 'charm', 6, 2, 'cool'),
        a('history', 'History', 'Everything that has passed between you is in the room.', 'bond', 0, 2, 'cool'),
        a('the_promise', 'The Promise', 'You promised once. They remember the words exactly.', 'bond', 20, 3, 'cool2'),
        a('a_joke_too_many', 'A Joke Too Many', 'You reach for a joke, and they see you reach.', 'charm', -6, 1, 'sus'),
        a('someone_else', 'Someone Else', 'There is someone else in this, even if they are not here.', 'guile', 18, 2, 'harden'),
        a('the_quiet', 'The Quiet', 'Neither of you speaks for a long time.', 'vigor', 4, 1, 'tire'),
        a('small_kindness', 'A Small Kindness', 'Tea, a blanket, a hand on the shoulder.', 'charm', -14, 1, 'tire', 'clears'),
        a('what_you_said', 'What You Said', 'Something you said months ago, given back word for word.', 'lore', 16, 2, 'grudge'),
        a('all_of_it', 'All of It', 'They want the whole truth, including the part you left out.', 'charm', 26, 3, 'sus2'),
        a('family', 'Family', 'Their family is in this too, and has opinions.', 'bond', 8, 2, 'cool'),
        a('the_door', 'The Door', 'They keep glancing at the door.', 'charm', 22, 2, 'tire'),
        a('a_real_promise', 'A Real Promise', 'Words will not do. They need to see what you are to each other.', 'bond', 14, 3, 'cool2'),
      ],
      demands: [
        d('help_not_words', 'Help, Not Words', 'What they need is practical, and it costs.', 'crowns'),
      ],
    },
    crowd: {
      name: 'In front of a crowd', lean: 'charm',
      crux: { signal: 'charm', title: 'The Room', text: 'The room has made up its mind about you. Change it.' },
      cards: [
        a('the_laugh', 'The Laugh', 'The room is laughing, and it is laughing at you.', 'vigor', 8, 2, 'harden'),
        a('a_heckler', 'A Heckler', 'Something from the back of the room pulls every eye away.', 'vigor', -8, 1, 'sus'),
        a('a_toast', 'A Toast', 'Glasses are raised, and everyone waits for you to say something.', 'charm', -4, 1, 'cool'),
        a('a_rumour', 'A Rumour', 'Someone is passing something along, behind a hand.', 'guile', 6, 2, 'grudge'),
        a('the_rival', 'The Rival', 'Someone else here wants the room more than you do.', 'charm', 22, 3, 'cool2'),
        a('manners', 'Manners', 'Which fork, which title, which order. Everyone is watching.', 'lore', 2, 1, 'sus'),
        a('masks', 'Masks', 'Nobody here is quite who they seem.', 'guile', -6, 1, 'tire', 'tell'),
        a('your_story', 'Your Story', 'They want it told well, with an ending.', 'charm', 16, 2, 'tire'),
        a('your_name', 'Your Name', 'They have heard of you, and not only good things.', 'standing', 4, 2, 'cool'),
        a('the_hush', 'The Hush', 'The whole room goes quiet to hear what you say next.', 'charm', 28, 3, 'sus2', 'volatile'),
        a('the_crowd_turns', 'The Crowd Turns', 'Half the room is with you now. Half is not.', 'guile', 20, 2, 'harden', 'linked'),
      ],
      demands: [
        d('who_are_you_here', 'Who Are You?', 'This room only listens to names it knows.', 'renown'),
        d('a_round', 'A Round for the Room', 'Nothing warms a room like being paid for.', 'crowns'),
      ],
    },
    ink: {
      name: 'On the record', lean: 'lore',
      crux: { signal: 'lore', title: 'The Story', text: 'It will be printed one way or another. Make it the true one.' },
      cards: [
        a('the_deadline', 'The Deadline', 'The presses run at dawn, with you or without you.', 'vigor', 0, 1, 'tire'),
        a('red_ink', 'Red Ink', 'A whole paragraph, struck through without a word.', 'lore', 8, 2, 'cool'),
        a('on_the_record', 'On the Record', 'Every word you say is being written down.', 'guile', 18, 2, 'sus'),
        a('a_quote', 'A Quote', 'They need one good line, and they need it from you.', 'charm', -4, 1, 'cool'),
        a('no_comment', 'No Comment', 'Someone is denying everything, including the obvious.', 'guile', 24, 3, 'grudge'),
        a('the_facts', 'The Facts', 'Names, dates, and the order things happened in.', 'lore', -10, 1, 'tire'),
        a('the_angle', 'The Angle', 'There is a better story here than the true one, and they can smell it.', 'guile', 4, 1, 'harden'),
        a('a_source', 'A Source', 'Someone told them in confidence. Whose side are you on?', 'bond', 20, 2, 'cool2'),
        a('the_headline', 'The Headline', 'Six words in large type, and they decide everything.', 'charm', 26, 3, 'sus2', 'sore'),
        a('spelled_right', 'Spelled Right', 'Your name, at least, should be spelled correctly.', 'lore', -16, 1, 'tire'),
        a('the_column', 'The Column', 'There is space for only so many words, and yours are too many.', 'lore', 6, 2, 'cool'),
        a('know_your_subject', 'Know Your Subject', 'They will not print it unless you know what you are talking about.', 'lore', 12, 2, 'cool'),
      ],
      demands: [
        d('a_byline', 'A Byline', 'Readers trust a name they have seen before.', 'renown'),
      ],
    },
    wild: {
      name: 'In the wild', lean: 'charm', hexes: ['bewitch', 'hush'],
      crux: { signal: 'charm', title: 'The Old Courtesy', text: 'It does not care what you want. It cares whether you have been proper about it.' },
      cards: [
        a('a_riddle', 'A Riddle', 'A question with an answer, and the answer is not the obvious one.', 'lore', 6, 2, 'drain'),
        a('the_wrong_answer', 'The Wrong Answer', 'It has heard every clever answer. It wants the right one.', 'lore', 24, 3, 'wound'),
        a('courtesy', 'Courtesy', 'You have not yet bowed, and it has noticed.', 'charm', -10, 1, 'cool'),
        a('a_trick', 'A Trick', 'It offers you something, and it is clearly a trick.', 'guile', 16, 2, 'grudge'),
        a('old_names', 'Old Names', 'It wants to be called by its proper name.', 'lore', 20, 2, 'cool'),
        a('a_gift', 'A Gift', 'Something given freely, or not at all.', 'charm', 2, 1, 'cost'),
        a('stillness', 'Stillness', 'It moves toward you, and you must not step back.', 'vigor', 8, 2, 'wound'),
        a('the_bargain', 'The Bargain', 'Every word of the bargain matters, and some of them are hiding.', 'guile', 28, 3, 'drain', 'volatile'),
        a('spellwork', 'Spellwork', 'The air is thick with something old. It wants to see what you can do with it.', 'arcana', 4, 2, 'drain'),
        a('a_change_of_mood', 'A Change of Mood', 'Its temper turns like weather.', 'charm', 18, 2, 'tire'),
        a('in_circles', 'In Circles', 'It has led you in a circle, to see if you notice.', 'guile', -4, 1, 'tire'),
      ],
      demands: [
        d('show_me_magic', 'Show Me Your Magic', 'It will listen to a spell before it listens to words.', 'spell'),
        d('a_toll', 'A Toll', 'Nobody passes without paying something.', 'crowns'),
        d('a_drop_of_blood', 'A Drop of Blood', 'What it wants of you will hurt to give.', 'health'),
      ],
    },
    shadow: {
      name: 'In the shadow', lean: 'guile', hexes: ['bewitch', 'hush'],
      crux: { signal: 'guile', title: 'The Grip', text: 'They hold something, or someone. Words are all you have to loosen it.' },
      cards: [
        a('the_threat', 'The Threat', 'Nothing is said outright. Nothing needs to be.', 'vigor', 16, 2, 'wound'),
        a('cold', 'Cold', 'Frost creeps along every edge, and your breath is short.', 'vigor', -4, 1, 'tire'),
        a('leverage', 'Leverage', 'They know something about you, and want you to know they know.', 'guile', 22, 3, 'harden'),
        a('a_lie', 'A Lie', 'Something they said is false, and it is the part that matters.', 'guile', 6, 2, 'sus'),
        a('old_family', 'Old Family', 'Old names, old debts, and an old way of settling them.', 'standing', 20, 2, 'cool'),
        a('the_offer', 'The Offer', 'They offer you something you want. That is the danger.', 'charm', 26, 3, 'cool2', 'volatile'),
        a('under_a_spell', 'Under a Spell', 'Someone here is not speaking for themselves.', 'arcana', 18, 2, 'drain', 'watchful'),
        a('doubt', 'Doubt', 'What if they are right?', 'lore', 2, 1, 'cool'),
        a('nerve', 'Nerve', 'They step closer, and keep stepping.', 'vigor', 28, 3, 'wound'),
        a('a_crack', 'A Crack', 'Their certainty slips for a moment. Only a moment.', 'guile', -10, 1, 'tire', 'linked'),
        a('no_witnesses', 'No Witnesses', 'Nobody else is here, and nobody else would believe you.', 'lore', 8, 2, 'grudge'),
        a('prove_your_power', 'Prove Your Power', 'They respect only what they can see you do.', 'arcana', 16, 3, 'sus2'),
      ],
      demands: [
        d('a_price_in_blood', 'A Price in Blood', 'Some debts are not paid in coin.', 'health'),
      ],
    },
  };

  // Which circumstance each bound negotiation is, by its event, read from its prose; anything unlisted falls back on
  // the group the game files it under.
  const BY_EVENT = {
    hearing: 'thesis_defence y3_interview_practical grade_appeal thesis_margin_notes y3_interview',
    authority: 'crisis_probation aid_interview isolde_warning intern_credit_taken tavern_manager_inspector inc_library_fine nessa_headmistress_interview intro_wrong_tower mir_workshop_closed',
    trade: 'break_work_short_wages slice_market_haggle upper_year_errands grimsbys_last_copy offer_pocket_almanac',
    heart: 'lyra_family_ultimatum tobias_bad_harvest soc_breakup soc_two_timing ilse_kael_reunion lyra_not_second corvin_honest_once corvin_confiscation_vault bram_father_visit',
    crowd: 'home_market_charm_seller tobias_bullied renown_patron_dinner company_masked intern_thornwick_rivalry tavern_festival_room lyra_mother_visit',
    ink: 'nessa_gossip_column lumen_ledger_red_ink ledger_quill_interview nessa_not_a_story',
    wild: 'life_portrait_escape tide_water_spirit_race ww1_pixie_toll ww1_hollow_whisper ww2_grumpy_oak ww2_thornwitch ww2_embers_kin ww3_shadow_stag ww3_elder_oak ww3_wisps ww4_last_witch ww_spinner_meet',
    shadow: 'corvin_brother hs_kael_sister hs_tunnel ilse_grey_returns hs_key_recover hs_night_cult hs_night_ilse ww_outcast_table',
  };
  const EVENT_CIRC = Object.fromEntries(Object.entries(BY_EVENT).flatMap(([c, evs]) => evs.split(' ').map((ev) => [ev, c])));
  const BY_GROUP = { Panels: 'hearing', Scholars: 'hearing', Officials: 'authority', Introduction: 'authority', 'Dealers and hosts': 'trade', Debaters: 'heart', Skeptics: 'authority', Whisperwood: 'wild', 'The Hollow Star': 'shadow' };
  const circumstanceOf = (enc) => EVENT_CIRC[enc.event || String(enc.key).split('/')[0]] || BY_GROUP[enc.group] || 'authority';
  const leanOf = (enc) => (MAIN.includes(enc.using) ? enc.using : CIRCUMSTANCES[circumstanceOf(enc)].lean);

  const hash = (s) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);

  // The spells a Show Me the Spell may ask to see: ones with a visible effect, nothing forbidden.
  const SHOWN_SPELLS = ['foresight', 'glamour', 'seal', 'ward', 'starlight', 'index', 'haste', 'brace'];
  const CARDS = [...COMMON, ...Object.values(CIRCUMSTANCES).flatMap((c) => c.cards)];
  const DEMANDS = Object.values(CIRCUMSTANCES).flatMap((c) => c.demands);
  // How many of your actions an argument waits before it counts as neglected and lands. Most wait 3 to 5 (4 on average,
  // urgent ones included), picked from the card's id so a card always waits as long; urgent ones, 1 or 2.
  const URGENT = {
    the_hourglass: 1, obvious_objection: 2, office_hours: 2, walk_away: 1, other_buyers: 2, the_door: 1, a_heckler: 2,
    the_crowd_turns: 2, the_deadline: 1, a_change_of_mood: 2, the_threat: 1, nerve: 2,
  };
  const WAITS = [3, 4, 5, 5, 5];
  for (const c of [...CARDS, ...DEMANDS]) c.wait = URGENT[c.id] || WAITS[hash(c.id) % WAITS.length];

  return { SIGNALS, MAIN, EFFECTS, COMMON, CIRCUMSTANCES, CARDS, DEMANDS, HEXES, SHOWN_SPELLS, circumstanceOf, leanOf };
});

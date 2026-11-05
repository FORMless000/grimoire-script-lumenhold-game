/*
 * Crux's voices: how each kind of meeting sounds and looks. Words and looks only; no rule reads this file.
 *
 * Every bound negotiation already says three things about itself, and nothing here adds a fourth:
 *   its circumstance (cards.js: a hearing, an official, a deal, a matter of the heart, a crowd, the press, the wild
 *     wood, the shadow): the scene. Its verbs on the buttons, the crux's mood words, how they react to each argument
 *     won or lost, how the meeting ends, and its look (`skin`, style.css) and emblem (`motif`).
 *   its room (the .grim parley's `context`: formal, broker, public, workshop): the register. Not a place (an elder oak
 *     can be formal), but how the talk is held: on ceremony, as a bargain, in front of onlookers, or close.
 *   its profile (who they are, in the game's terms): the name across the table when the card gives none.
 *
 * The rules log what happened in plain words and, beside them, a code (rules.rs `say!`: won, held, deflect, neglect,
 * give, hold); the page voices those in the meeting's own words, keeping the numbers. Lines say "they": it fits a
 * panel, a friend, three pixies and a stag alike. {title} is the argument's title.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CruxVoices = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const svg = (body) => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

  // won: by how much the argument moved them (its Agreement: 0, 1, 2, 3, 4 and up).
  const CIRC = {
    hearing: {
      verbs: { confront: 'Answer', deflect: 'Set aside', push: 'Rest your case' },
      deck: (n) => `${n} question${n === 1 ? '' : 's'} still on their list`,
      bands: ['Unconvinced', 'Taking notes', 'Conferring', 'Nodding along', 'Reaching for the seal'],
      opener: ['Papers are squared. A pen is uncapped. “Whenever you are ready.”', 'The questions are already written down. You can read the list upside down from here.', 'Somebody pours a glass of water nobody will drink. The hearing begins.'],
      won: [
        ['They let it pass without a word.'],
        ['A pen moves.', 'A small nod, and on to the next.', '“Noted.”'],
        ['They write that one down.', 'The pen moves faster.', '“Yes. That answers it.”'],
        ['Someone underlines something, twice.', '“That is the answer we were waiting for.”', 'The next question on the list is crossed out, unasked.'],
        ['A long pause. Then: “Thank you. That is very clear.”', 'The pen stops. They simply look at you.'],
      ],
      held: ['“That doesn’t answer the question.”', 'They write something down, and it is not in your favour.', '“We will come back to {title}.”'],
      deflect: ['You set {title} aside for another day.', '“I will address {title} in writing.” They allow it, barely.', 'You move past {title}. They let you, and note that you did.'],
      neglect: ['{title} sits unanswered long enough to become the answer.', 'They raise {title} again, and this time it goes on the record.'],
      hold: ['“Not yet.” The pen goes back into its cap.', '“We are not there yet.”', 'They would like another hour of questions.'],
      give: ['The pen is set down. “We have heard enough.”', 'They confer in whispers, and turn back to you smiling.'],
      end: {
        persuaded: ['It stands', 'They have no more questions.'], partial: ['Passed, with corrections', 'Not everything you hoped, but it stands.'],
        patience: ['Time', 'The bell goes for the next candidate.'], suspicion: ['Dismissed', 'They have stopped writing anything down.'], walked: ['Withdrawn', 'You gather your papers and go.'],
      },
      motif: svg('<path d="M32 18c-6-5-15-6-24-4v34c9-2 18-1 24 4 6-5 15-6 24-4V14c-9-2-18-1-24 4z"/><path d="M32 18v34"/><path d="M44 12v16l4-3 4 3V13"/>'),
    },
    authority: {
      verbs: { confront: 'Argue', deflect: 'Let it stand', push: 'Make your request' },
      deck: (n) => `${n} more rule${n === 1 ? '' : 's'} they can cite`,
      bands: ['By the book', 'Listening', 'Weighing it', 'Inclined to allow', 'Reaching for the stamp'],
      opener: ['A form is turned round to face you. It has a great many boxes.', '“Well? I have other appointments.”', 'The rulebook is already open, at the page they wanted.'],
      won: [
        ['They let it pass.'],
        ['“Hm.”', 'A box is ticked.', 'They turn a page back, to check.'],
        ['“That is… technically correct.”', 'The pen hovers over the form.', 'They read the rule again, more slowly.'],
        ['“I suppose there is a precedent.”', 'A drawer opens. A different form comes out.'],
        ['The stamp is lifted from its pad.', '“This once,” they say, mostly to themselves.'],
      ],
      held: ['“The rule is quite clear.”', 'They tap the page. “As I said.”', '“That is not how it works.”'],
      deflect: ['You let {title} stand and move on.', '“Fine. {title} stands.” It costs you time.', 'You don’t argue {title}. They note that you didn’t.'],
      neglect: ['{title} goes in the file, against you.', 'You leave {title} too long, and it becomes policy.'],
      hold: ['“Rules are rules.”', 'The stamp stays where it is.', '“Is there anything else?”'],
      give: ['The stamp comes down. Thunk.', '“Very well. This once.”'],
      end: {
        persuaded: ['Approved', 'Signed, stamped and filed.'], partial: ['Approved in part', 'A smaller stamp, but a stamp.'],
        patience: ['Next, please', 'The office closes on time, with your matter unsettled.'], suspicion: ['Referred upward', 'Your name has gone into a different file.'], walked: ['Withdrawn', 'You take the form with you, unsigned.'],
      },
      motif: svg('<circle cx="32" cy="34" r="17"/><path d="M32 23l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L32 39.5l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z"/><path d="M22 14c3 2 7 3 10 3s7-1 10-3"/>'),
    },
    trade: {
      verbs: { confront: 'Haggle', deflect: 'Wave it off', push: 'Make your offer' },
      deck: (n) => `${n} more reason${n === 1 ? '' : 's'} it costs more`,
      bands: ['Not for sale', 'Listening', 'Haggling', 'Nearly a deal', 'Reaching to shake'],
      opener: ['The goods are on the counter. The price is not.', 'They smile the smile of someone who has done this ten thousand times.', '“Everything has a price. Let us find yours.”'],
      won: [
        ['They let it go.'],
        ['“Fair.”', 'They knock a little off.', 'A coin slides across the counter, your way.'],
        ['They stop counting.', '“You know your trade.”', 'The price on the slate is rubbed out and rewritten.'],
        ['They laugh, and mean it.', '“Now that is an argument with money in it.”'],
        ['They look at you as a colleague now.', '“Robbery,” they say, delighted.'],
      ],
      held: ['“It’s worth what I say it’s worth.”', 'They put {title} back on the table, unmoved.', '“Try that at the next stall.”'],
      deflect: ['You wave off {title}. They shrug and try another.', '“Let’s not talk about {title}.” It costs you time.'],
      neglect: ['{title} goes on the bill.', 'Left alone, {title} adds itself to the price.'],
      hold: ['“Not at that price.”', 'They pull the goods a little closer.', '“Come back when you are serious.”'],
      give: ['A palm, a handshake. Done.', '“Sold.”'],
      end: {
        persuaded: ['Sold', 'You shake on it. It is yours.'], partial: ['Half a deal', 'Not the price you wanted, but a price.'],
        patience: ['Shutters down', 'The goods go back under the counter.'], suspicion: ['No sale', '“I don’t sell to cheats.”'], walked: ['You walk', 'The oldest move in haggling. This time they let you go.'],
      },
      motif: svg('<path d="M32 10v40"/><path d="M14 18h36"/><path d="M14 18l-7 16h14zM50 18l-7 16h14z"/><path d="M7 34a7 4 0 0 0 14 0M43 34a7 4 0 0 0 14 0"/><path d="M22 54h20"/>'),
    },
    heart: {
      verbs: { confront: 'Reassure', deflect: 'Let it go', push: 'Say it plainly' },
      deck: (n) => `${n} thing${n === 1 ? '' : 's'} still unsaid`,
      bands: ['Closed off', 'Guarded', 'Wavering', 'Softening', 'Almost there'],
      opener: ['Neither of you knows how to begin, so you both begin at once.', 'It is quiet enough to hear how hard this is.', '“Say something,” they say. “Anything.”'],
      won: [
        ['They let it pass.'],
        ['They nod, without looking up.', 'A breath they had been holding.', '“…Maybe.”'],
        ['They look at you, properly, for the first time.', 'Something in their shoulders lets go.', '“You remember that?”'],
        ['Their voice catches.', 'They almost laugh, and then they do.'],
        ['They have to look away for a moment.', '“Why didn’t you say so before?”'],
      ],
      held: ['“That’s not what this is about.”', 'They go quiet, the bad kind of quiet.', '“You always say that.”'],
      deflect: ['You let {title} go, for now. It hangs there.', 'You don’t rise to {title}. It costs you a little time.'],
      neglect: ['{title} goes unanswered, and they notice.', 'You let {title} sit too long; the silence answers it for you.'],
      hold: ['“I need more than that.”', 'They look at the door, then back at you.', '“Words. Just words.”'],
      give: ['“Okay,” they say. “Okay.”', 'Something between you mends.'],
      end: {
        persuaded: ['Mended', 'Something between you is whole again.'], partial: ['A beginning', 'Not everything. But you are talking again.'],
        patience: ['Not today', '“I can’t do this right now.”'], suspicion: ['Trust, broken', 'They don’t believe a word of it any more.'], walked: ['Unsaid', 'You leave it unsaid. It will still be there.'],
      },
      motif: svg('<path d="M32 52C18 42 10 34 10 24a10 10 0 0 1 22-5 10 10 0 0 1 22 5c0 10-8 18-22 28z"/><path d="M32 19c-3 6-3 12 0 18 3 5 3 9 0 15"/>'),
    },
    crowd: {
      verbs: { confront: 'Answer back', deflect: 'Laugh it off', push: 'Win the room' },
      deck: (n) => `${n} more voice${n === 1 ? '' : 's'} from the floor`,
      bands: ['Against you', 'Muttering', 'Split', 'Coming round', 'On their feet'],
      opener: ['Every head in the room turns your way.', 'Someone at the back is already laughing. Not with you.', 'The room goes quiet, the way rooms do before a fight.'],
      won: [
        ['The room lets it pass.'],
        ['A few people nod.', 'Someone at the back says “Fair.”'],
        ['A ripple of laughter, on your side.', 'Heads turn back toward you.', 'A cheer, quickly hushed.'],
        ['Applause, from a corner.', 'The room laughs with you now.'],
        ['Someone stands up to clap.', 'The room roars.'],
      ],
      held: ['A groan goes round the room.', 'Somebody heckles, and it lands better than you did.', 'Laughter, at you.'],
      deflect: ['You laugh off {title}. Not everyone laughs with you.', 'You let {title} pass. The room notices.'],
      neglect: ['{title} gets a cheer you didn’t want.', 'Nobody answers {title}, so the room does.'],
      hold: ['The room isn’t having it.', 'Silence. Then someone coughs.', 'A slow clap, the wrong kind.'],
      give: ['The room is on its feet.', 'Applause, and it is for you.'],
      end: {
        persuaded: ['The room is yours', 'They are cheering, and they mean it.'], partial: ['Half the room', 'Enough of them came round.'],
        patience: ['The room empties', 'People drift off to the next thing.'], suspicion: ['Booed out', 'They have decided you are a fraud.'], walked: ['Exit', 'You leave to a murmur.'],
      },
      motif: svg('<path d="M10 20c8 4 14 4 22 0 8 4 14 4 22 0"/><path d="M14 22l3 7 3-6M28 22l4 8 4-8M44 23l3 6 3-7"/><circle cx="16" cy="46" r="5"/><circle cx="32" cy="44" r="6"/><circle cx="48" cy="46" r="5"/><path d="M8 58c1-5 4-7 8-7s7 2 8 7M23 58c1-6 5-8 9-8s8 2 9 8M40 58c1-5 4-7 8-7s7 2 8 7"/>'),
    },
    ink: {
      verbs: { confront: 'Correct it', deflect: 'No comment', push: 'Give them the story' },
      deck: (n) => `${n} more question${n === 1 ? '' : 's'} in their notebook`,
      bands: ['Hostile', 'Doubtful', 'Taking it down', 'Rewriting', 'Ready to print'],
      opener: ['A notebook falls open. A pencil is licked.', '“Just a few questions. On the record, if you don’t mind.”', 'The deadline is the third person in this conversation.'],
      won: [
        ['They let it go.'],
        ['Scribble, scribble.', 'They strike out a line.'],
        ['“Can I quote you on that?”', 'A whole paragraph, crossed out.'],
        ['They turn to a fresh page.', '“Now that’s a headline.”'],
        ['They tuck the pencil behind an ear and just listen.', 'The story, rewritten in front of you.'],
      ],
      held: ['“That’s not what my source says.”', 'They underline something. You can’t see what.', '“So that’s a no comment, then?”'],
      deflect: ['“No comment on {title}.” It goes in anyway, smaller.', 'You decline {title}. They write that down too.'],
      neglect: ['{title} goes to print as it stands.', 'You leave {title} unanswered; they fill the silence themselves.'],
      hold: ['“Readers won’t buy that.”', 'They check the clock, then their notes.', '“Off the record? Still no.”'],
      give: ['“Hold the front page.”', 'They tear out the old draft.'],
      end: {
        persuaded: ['Front page', 'The story runs the way it happened.'], partial: ['A correction', 'Page six, but the truth is in it.'],
        patience: ['Deadline', 'The presses roll without you.'], suspicion: ['A hatchet job', 'They have the story they wanted, about you.'], walked: ['No comment', 'Which they will print.'],
      },
      motif: svg('<path d="M18 36h22l-3 18H21z"/><path d="M16 36h26"/><path d="M29 36c4-10 12-20 24-28-4 10-10 20-19 28"/><path d="M38 22l5 4"/>'),
    },
    wild: {
      verbs: { confront: 'Reply', deflect: 'Step aside', push: 'Ask leave' },
      deck: (n) => `${n} more trial${n === 1 ? '' : 's'} in the wood`,
      bands: ['Unmoved', 'Watching', 'Curious', 'Gracious', 'Willing'],
      opener: ['The wood goes quiet, the way it does when something old is listening.', 'Leaves turn to face you, though there is no wind.', 'Somewhere, a branch creaks a question.'],
      won: [
        ['The wood lets it pass.'],
        ['The leaves go still.', 'Something in the wood agrees.'],
        ['The light warms a little.', 'A soft sound, like a laugh among the roots.', 'Moss creeps toward your feet, friendly.'],
        ['Every bird in earshot sings at once.', 'The path behind them opens a little wider.'],
        ['The whole glade seems to bow.', 'Old magic, satisfied.'],
      ],
      held: ['A cold breath through the branches.', 'The wood draws back from you.', 'Somewhere a twig snaps, pointedly.'],
      deflect: ['You step around {title}, politely.', 'You let {title} pass, with a bow. The wood allows it.'],
      neglect: ['You ignored {title}. The wood does not forget a rudeness.', '{title} settles on you like frost.'],
      hold: ['“Not yet,” says the wood.', 'The path stays closed.', 'The light dims, very slightly.'],
      give: ['The path opens.', 'It bows, in its fashion. You have been proper.'],
      end: {
        persuaded: ['Leave given', 'The wood lets you pass, and wishes you well.'], partial: ['A grudging leave', 'It lets you through, but watches you go.'],
        patience: ['Lost in the wood', 'The light goes, and the path with it.'], suspicion: ['Unwelcome', 'Every root in the glade turns against you.'], walked: ['Retreat', 'You back away, the way you came.'],
      },
      motif: svg('<path d="M32 56V30"/><path d="M32 30c-2-8-10-10-14-16 8 0 12 4 14 10 2-6 6-10 14-10-4 6-12 8-14 16z"/><path d="M32 40c-5-1-10-4-13-9M32 46c5-1 10-4 13-9"/><circle cx="14" cy="44" r="1.6" fill="currentColor"/><circle cx="50" cy="20" r="1.6" fill="currentColor"/>'),
    },
    shadow: {
      verbs: { confront: 'Hold firm', deflect: 'Give ground', push: 'Break their grip' },
      deck: (n) => `${n} more threat${n === 1 ? '' : 's'} in the dark`,
      bands: ['An iron grip', 'Testing you', 'Loosening', 'Slipping', 'About to let go'],
      opener: ['The lamp burns lower than it should.', 'Something in the dark is very patient.', 'The cold arrives a moment before they speak.'],
      won: [
        ['They let it pass.'],
        ['A flicker of doubt, there and gone.', 'Their grip shifts.'],
        ['The shadows draw back an inch.', 'For a moment they look less sure.'],
        ['The cold breaks, like ice on a pond.', 'Something in the dark recoils.'],
        ['The lamp flares bright.', 'They take a step back without meaning to.'],
      ],
      held: ['The dark leans in.', '“Is that all?”', 'The cold settles in your hands.'],
      deflect: ['You give ground on {title}. They take it.', 'You won’t be drawn on {title}. The shadows wait.'],
      neglect: ['{title} closes around you while you look away.', 'You let {title} be; it does not let you be.'],
      hold: ['Their grip tightens.', '“No.”', 'The lamp gutters.'],
      give: ['The grip breaks.', 'The dark lets go, all at once.'],
      end: {
        persuaded: ['Free', 'Their hold is broken.'], partial: ['Loosened', 'Not free, but they hold less than they did.'],
        patience: ['The lamp goes out', 'Their patience is gone, and the light with it.'], suspicion: ['Seen through', 'They see through you, and they smile.'], walked: ['Fled', 'You get out while you can.'],
      },
      motif: svg('<path d="M32 6l5 17 17-5-12 13 12 13-17-5-5 17-5-17-17 5 12-13-12-13 17 5z"/><circle cx="32" cy="31" r="7"/>'),
    },
  };

  // The register the .grim gives the parley.
  const ROOMS = {
    formal: { name: 'On ceremony', line: 'It is done properly here: in turn, on the record, by the rules of the occasion.' },
    broker: { name: 'A bargain', line: 'This is a bargain. Everything on the table has a price, your words included.' },
    public: {
      name: 'Watched', line: 'There are onlookers. Every point you win, you win in front of them.',
      // The onlookers: a second voice after the big moments.
      up: ['A murmur of approval from the onlookers.', 'Someone watching says “Ha!”', 'Heads nod among the watchers.'],
      down: ['Someone watching winces for you.', 'A snigger from the onlookers.', 'The watchers lean in, sensing blood.'],
    },
    workshop: { name: 'Close quarters', line: 'No ceremony and no audience: only the matter between you.' },
  };

  // Who sits across the table, when the card doesn't say.
  const PROFILES = { committee: 'The panel', official: 'The official', scholar: 'The scholar', skeptic: 'The skeptic', debater: 'Your opponent', social_operator: 'Your host' };

  return { CIRC, ROOMS, PROFILES };
});

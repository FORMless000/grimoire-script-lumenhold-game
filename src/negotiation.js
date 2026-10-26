/*
 * Negotiations (E8, the first world-expansion plan): which meeting each `challenge negotiate` is. DOM-free; read by
 * lint (every negotiation has an entry) and, later, by the negotiation minigame (docs/minigame-negotiation-v03.md),
 * which sets up its opponent from the entry. The page doesn't load it until then.
 *
 *   PARLEYS["<event>/<option>"] = { profile, context, tutorial?, note? }
 *
 * profile: who sits across the table (the prototype's request weights): debater, scholar, social_operator, skeptic,
 *   official, or committee (a panel taking turns: scholar, skeptic and official).
 * context: the room. workshop (practical requests join the deck), broker (crowns change hands), formal (a hearing, a
 *   viva, a desk with a stamp), public (an audience: settlement rebates differ), practice (a lesson: nothing at stake).
 * tutorial: true for the intro's lesson (coach marks, and "Skip the lesson" settles at no cost once the minigame exists).
 *
 * Until the minigame arrives a negotiation is decided by the engine's stub (Engine#parleyValue: charm, lore and guile,
 * with mood and renown), so an entry changes nothing yet but what the button says.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Negotiation = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const PROFILES = {
    debater: { name: 'Debater', weights: { theory: 4, motives: 3, guarantee: 1, scrutiny: 1 } },
    scholar: { name: 'Scholar', weights: { theory: 6, motives: 2, guarantee: 1, scrutiny: 2 } },
    social_operator: { name: 'Social operator', weights: { theory: 2, motives: 5, guarantee: 3, scrutiny: 1 } },
    skeptic: { name: 'Skeptic', weights: { theory: 3, motives: 2, guarantee: 1, scrutiny: 4 } },
    official: { name: 'Official', weights: { theory: 3, motives: 2, guarantee: 4, scrutiny: 2 } },
    committee: { name: 'Committee', panel: ['scholar', 'skeptic', 'official'] },
  };
  const CONTEXTS = {
    workshop: { name: 'Workshop' },
    broker: { name: 'Broker' },
    formal: { name: 'Formal' },
    public: { name: 'Public' },
    practice: { name: 'Practice', stakes: 'none' },
  };
  const PARLEYS = {
    // A panel: the thesis viva, the final-year interview's practical.
    'thesis_defence/left': { profile: 'committee', context: 'formal' },
    'y3_interview_practical/left': { profile: 'committee', context: 'formal' },
    // Officials at a desk with a stamp.
    'grade_appeal/left': { profile: 'official', context: 'formal' },
    'crisis_probation/left': { profile: 'official', context: 'formal' },
    'aid_interview/left': { profile: 'official', context: 'formal' },
    'isolde_warning/right': { profile: 'official', context: 'formal', note: 'the headmistress' },
    'intern_credit_taken/left': { profile: 'official', context: 'formal', note: 'the supervisor' },
    'tavern_manager_inspector/left': { profile: 'official', context: 'formal', note: 'the inspector' },
    'inc_library_fine/right': { profile: 'official', context: 'formal', note: 'a prefect with a notice' },
    'break_work_short_wages/left': { profile: 'official', context: 'broker', note: 'the employer' },
    'nessa_headmistress_interview/left': { profile: 'official', context: 'formal', note: 'the headmistress' },
    // Crowns change hands.
    'slice_market_haggle/left': { profile: 'social_operator', context: 'broker' },
    'upper_year_errands/right': { profile: 'social_operator', context: 'broker' },
    'grimsbys_last_copy/right': { profile: 'scholar', context: 'broker', note: 'Grimsby prices a book by what it says' },
    'home_market_charm_seller/left': { profile: 'skeptic', context: 'public', note: 'calling out fakes before a crowd' },
    'offer_pocket_almanac/right': { profile: 'scholar', context: 'broker', note: 'Grimsby will sell only to someone who knows what it is for' },
    // A character across the table.
    'lyra_family_ultimatum/left': { profile: 'debater', context: 'workshop', note: 'Lyra' },
    'lyra_mother_visit/left': { profile: 'official', context: 'formal', note: 'Lady Vaneshade' },
    'tobias_bad_harvest/left': { profile: 'social_operator', context: 'workshop', note: 'Tobias' },
    'tobias_bullied/right': { profile: 'debater', context: 'public', note: 'Bram, before a laughing corridor' },
    'corvin_confiscation_vault/right': { profile: 'social_operator', context: 'workshop', note: 'Corvin' },
    'corvin_brother/left': { profile: 'skeptic', context: 'formal', note: "Corvin's brother" },
    'nessa_gossip_column/left': { profile: 'debater', context: 'workshop', note: 'Nessa' },
    'lumen_ledger_red_ink/left': { profile: 'skeptic', context: 'workshop', note: 'the editor' },
    'mir_workshop_closed/left': { profile: 'skeptic', context: 'formal', note: 'Professor Thorne' },
    'thesis_margin_notes/right': { profile: 'scholar', context: 'workshop' },
    'bram_father_visit/left': { profile: 'official', context: 'formal', note: "Bram's father" },
    'soc_breakup/left': { profile: 'social_operator', context: 'workshop', note: 'the partner' },
    'soc_two_timing/left': { profile: 'skeptic', context: 'workshop', note: 'the wronged partner' },
    'ilse_kael_reunion/left': { profile: 'skeptic', context: 'workshop', note: 'Ilse and Kael' },
    'hs_kael_sister/left': { profile: 'skeptic', context: 'formal', note: 'Ilse at the gates' },
    // Rooms full of people who matter.
    'y3_interview/right': { profile: 'social_operator', context: 'formal' },
    'renown_patron_dinner/left': { profile: 'social_operator', context: 'public' },
    'company_masked/left': { profile: 'social_operator', context: 'public' },
    'intern_thornwick_rivalry/left': { profile: 'social_operator', context: 'public' },
    'ledger_quill_interview/left': { profile: 'social_operator', context: 'workshop' },
    'ledger_quill_interview/right': { profile: 'social_operator', context: 'workshop' },
    'tavern_festival_room/left': { profile: 'social_operator', context: 'public' },
    'tavern_festival_room/right': { profile: 'social_operator', context: 'broker' },
    // Spirits and portraits that talk.
    'life_portrait_escape/left': { profile: 'debater', context: 'workshop', note: 'a runaway portrait' },
    'tide_water_spirit_race/right': { profile: 'skeptic', context: 'workshop', note: 'a water spirit' },
    // The intro's lesson (world expansion 1, section 0): a steward and her list, nothing at stake.
    'intro_wrong_tower/right': { profile: 'official', context: 'formal', tutorial: true, note: 'the house steward' },
    // Romance sets (world expansion 1): a partner's quarrel, argued in their own voice.
    'lyra_not_second/left': { profile: 'debater', context: 'formal', note: 'Lyra, who wants to be argued with' },
    'corvin_honest_once/left': { profile: 'debater', context: 'formal', note: 'Corvin, past the jokes' },
    'nessa_not_a_story/left': { profile: 'debater', context: 'workshop', note: 'Nessa, an editor arguing for her best draft' },
    // The Whisperwood delve (world expansion 1): things that talk get a negotiation before a fight.
    'ww1_pixie_toll/right': { profile: 'social_operator', context: 'broker', note: 'three pixies at a toll stone' },
    'ww1_hollow_whisper/right': { profile: 'scholar', context: 'workshop', note: 'a riddling hollow oak' },
    'ww2_grumpy_oak/right': { profile: 'skeptic', context: 'formal', note: 'an oak whose root you kicked' },
    'ww2_thornwitch/right': { profile: 'debater', context: 'broker', note: 'the thornwitch, mid-Siphon' },
    'ww2_embers_kin/right': { profile: 'social_operator', context: 'workshop', note: 'the ember foxes' },
    'ww3_shadow_stag/right': { profile: 'official', context: 'formal', note: 'the shadow stag tests your nerve' },
    'ww3_elder_oak/right': { profile: 'scholar', context: 'formal', note: 'the elder oak, asked for heartwood' },
    'ww3_wisps/right': { profile: 'debater', context: 'workshop', note: 'riddling wisps' },
    'ww4_last_witch/right': { profile: 'scholar', context: 'formal', note: 'the wood\'s last witch, a ghost' },
    'ww_spinner_meet/right': { profile: 'debater', context: 'formal', note: 'the Spinner, for a fair fight' },
    'ww_outcast_table/left': { profile: 'debater', context: 'formal', note: 'Absalom Vrell, for a forbidden lesson' },
    // The plot.
    'hs_tunnel/talk': { profile: 'skeptic', context: 'formal', note: 'the man in grey' },
    // The Hollow Star, v2 (2026-10-26)
    'ilse_grey_returns/talk': { profile: 'skeptic', context: 'public', note: 'the man in grey, in the street' },
    'hs_key_recover/family': { profile: 'skeptic', context: 'workshop', note: 'a Dumont who knows where the families hide things' },
    'hs_night_cult/family': { profile: 'debater', context: 'public', note: 'Madame Dumont, before her circle' },
    'hs_night_ilse/reach': { profile: 'skeptic', context: 'formal', note: 'Ilse, under the man in grey\'s compulsion' },
  };
  const lookup = (event, option) => PARLEYS[event + '/' + option] || null;
  return { PROFILES, CONTEXTS, PARLEYS, lookup };
});

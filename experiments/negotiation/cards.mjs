const check=(id,title,text,source,key,extra={})=>({id,title,text,type:'check',source,key,weight:1,dc:0,agreement:1,resolveHit:5,suspicionHit:1,patienceHit:1,...extra});
export const CARDS=[
 check("common_ground","What Do I Get?","They hear you out, then tilt their head. \"I can see why you want this. Where do I come into it?\"",'skills','charm',{weight:4}),
 check("reassurance","Who Gets the Blame?","\"Lovely, until something goes wrong.\" They fold their arms. \"Whose name comes up then?\"",'skills','charm',{weight:4,resolveHit:4}),
 check("honest_appeal","Plainly, Please","They lift a hand before you can begin again. \"Leave out the polish. What is it you actually want?\"",'skills','charm',{weight:3,dc:-3}),
 check("objection","One Small Objection","They wait until you finish. \"And when it doesn't work?\" The smile stays exactly where it was.",'skills','charm',{weight:3,dc:3,resolveHit:6}),
 check("bold_pitch","The Whole Case","They sit back. \"Enough of bits and pieces. Give me one reason to agree to all of it. And it had better hold.\"",'skills','charm',{weight:2,dc:12,agreement:2,resolveHit:7,suspicionHit:2}),
 check("small_joke","A Very Long Silence","They let the silence stretch. Then one corner of their mouth lifts. \"Is it always so solemn with you?\"",'skills','charm',{weight:2,suspicionHit:2,resolveHit:3}),
 check("precedent","Tried It Before?","\"Has anyone actually tried this?\" They hold up a finger. \"Successfully. That part matters.\"",'skills','lore',{weight:2}),
 check("distinction","That Does Not Follow","They repeat two of your claims, slowly. \"Both of those cannot be true. Which one am I meant to believe?\"",'skills','lore',{dc:5,resolveHit:4}),
 check("read_room","The Unsaid Part","They start to answer, then glance away. \"I have my reasons.\" They smooth a sleeve and offer nothing more.",'skills','guile',{weight:2}),
 check("cover_story","Your Story Changes","They repeat a detail back to you. \"That sounds rather different from the first version. Perhaps I misunderstood.\" They wait.",'skills','guile',{dc:2,suspicionHit:2}),
 check("spellcraft","If the Magic Slips","\"You say you can control it.\" They draw their hands a little closer. \"What happens when the magic stops listening?\"",'skills','arcana'),
 check("method","And the Second Time?","They nod at the result, once. \"Anyone can be lucky. How do you do it again?\"",'skills','alchemy'),
 check("composure","Quite Finished?","They cut across your last word. \"You are getting rather worked up.\" Their own voice has become softer.",'skills','vigor',{resolveHit:6}),
 check("standing","I Know Your Name","Their eyes sharpen at your name. \"Oh. You.\" They look you over a second time, rather more carefully.",'renown',null,{weight:2}),
 check("reputation","A Name Behind It","\"Other people listen to you, do they?\" They lean forward. \"Then you won't mind having your name attached to this.\"",'renown',null,{dc:4}),
 check("trust","Can I Trust You?","They look at you for a long moment. \"Tell me I won't regret taking your word for it.\"",'relationship',null,{weight:2}),
 check("history","What Have You Done?","\"What have you ever done for me?\" They ask it quietly, and wait for you to name something.",'relationship',null,{resolveHit:4}),
 check("principle","Who Pays for This?","They lower their voice. \"And the people who get hurt? Where do they come into your fine plan?\"",'alignment','lumen'),
 check("pragmatism","Be Sensible","They give a small, impatient shrug. \"Someone will come out ahead. Why should it be anyone but us?\"",'alignment','hollow'),
 ...[
 [
  "evocation",
  "The Moment It Slips",
  "They ask where you would put the ward. \"And if the flame gets past it?\" Their finger traces the space beyond your answer."
 ],
 [
  "astromancy",
  "Leave Out the Poetry",
  "\"You have spent long enough watching the stars.\" They look up, briefly. \"What have you learned, apart from how cold it gets?\""
 ],
 [
  "alchemy",
  "Which Goes in First?",
  "They name two ingredients and stop. \"Which goes in first? You may think before answering. I rather wish more people would.\""
 ],
 [
  "illusion",
  "Would You Know?",
  "They smile. \"And how would you know if someone were already doing it to you?\" The smile does not help."
 ],
 [
  "beastcraft",
  "No Bridle, No Treats",
  "\"It won't come near you. You have no bridle and nothing to feed it.\" They pause. \"What would you try first?\""
 ],
 [
  "umbral",
  "The Shadow’s Edge",
  "They glance at your shadow. \"You have studied the dark. When does hiding in it stop being safe?\""
 ],
 [
  "artifice",
  "When the Cog Jams",
  "They turn an imaginary handle, then stop it with a finger. \"One cog jams. Does the rest stop, or does it tear itself apart?\""
 ],
 [
  "starcalling",
  "Why Would It Answer?",
  "They listen to the name of the star without comment. \"Yes. You know what it is called. Why would it answer you?\""
 ],
 [
  "hollow_studies",
  "The Seal Stays Shut",
  "Their voice drops. \"You have read about the seal. Tell me why it stays shut.\" They keep their eyes on yours."
 ]
].map(([key,title,text])=>check("prep_"+key,title,text,"preparation",key,{resolveHit:4})),
 ...[
 [
  "duelling",
  "After the Bout",
  "\"I hear you duel.\" They glance at your wand. \"What do you do when the bout is over and the other person is still on the floor?\""
 ],
 [
  "lumen_ledger",
  "Print a Correction",
  "They mime turning a newspaper page. \"Your piece is printed. Someone says it is wrong. What goes in tomorrow's edition?\""
 ],
 [
  "verdant",
  "More Than Watering",
  "\"The greenhouse is full of things with opinions.\" They raise an eyebrow. \"Do they thrive when you are left in charge?\""
 ],
 [
  "cartographers",
  "A Way Back Out",
  "They glance behind them before speaking. \"All those passages you find. Can you get someone out as readily as you get them in?\""
 ]
].map(([key,title,text])=>check("club_"+key,title,text,"club",key)),
 ...[
 [
  "library_assistant",
  "The Wrong Shelf",
  "They ask for a book by the wrong title, then admit it. \"People do. Does it still get found when you are on duty?\""
 ],
 [
  "tavern",
  "The Room Turns Ugly",
  "\"Two tables are arguing. Someone has stood up.\" They look past you. \"Does your shift usually end with the furniture intact?\""
 ],
 [
  "apothecary_clerk",
  "One Smudged Label",
  "They hold two fingers a drop apart. \"The label is smudged. The customer is in a hurry. How often does that trouble your counter?\""
 ],
 [
  "broom_courier",
  "Did It Arrive Dry?",
  "\"Rain, headwind, one very cross recipient.\" They count the troubles on their fingers. \"Does your parcel still arrive dry?\""
 ],
 [
  "intern_royal_library",
  "An Undated Page",
  "They ask about a page with no date and no name. \"Do they trust your catalogue, or do they check it after you leave?\""
 ],
 [
  "intern_conclave",
  "Your Part in It",
  "\"The laboratory has an excellent reputation.\" They let the compliment settle. \"What part of the work was yours?\""
 ],
 [
  "intern_alchemists",
  "The Whole Batch",
  "They spread their hands. \"One spoiled vial is unfortunate. A whole batch is expensive. What do your supervisors trust you with?\""
 ],
 [
  "intern_expedition",
  "A Summer of Charts",
  "\"A summer of charts.\" They nod. \"And when the clouds closed in, did anyone still find your notes useful?\""
 ],
 [
  "intern_field_station",
  "One Creature Missing",
  "They count on their fingers, then leave one bent. \"One is missing at dusk. Does someone send you, or send someone after you?\""
 ],
 [
  "intern_thornwick",
  "Praise From Rivals",
  "They smile at the mention of your placement. \"And what would they say about your work if no one from home were listening?\""
 ],
 [
  "intern_unseen_office",
  "Off the Record",
  "They lower their voice. \"No names, then. When something had to be done quietly, were you trusted to do it?\""
 ],
 [
  "work",
  "Who Saw Your Work?",
  "\"You have worked for your pay.\" They rub a thumb over their fingertips. \"Someone must have seen how well. What would they tell me?\""
 ]
].map(([key,title,text])=>check("job_"+key,title,text,"job",key)),
 check("project_thesis","The Page You Skipped","They ask about the chapter you passed over. \"That one. What does it prove?\" They have not forgotten where you put it.",'project','thesis',{weight:2,resolveHit:4})
];
// Leads vary acceptance and rejection stakes; each accepted card is one point. These values
// belong to the lead, not the player, and are visible before committing.
const stakes={
 common_ground:[-20,1,3,1,1],reassurance:[-10,1,4,1,1],honest_appeal:[-28,1,2,1,1],
 objection:[5,2,6,2,1],bold_pitch:[18,3,9,3,2],small_joke:[-4,2,4,2,1],
 precedent:[-12,1,3,1,1],distinction:[14,3,8,2,2],read_room:[-8,1,3,1,1],cover_story:[8,2,5,3,1],
 spellcraft:[3,2,6,2,1],method:[-5,2,6,1,2],composure:[4,2,7,1,1],
 standing:[-16,1,3,1,1],reputation:[10,3,7,2,2],trust:[-12,1,3,1,1],history:[9,2,6,2,1],
 principle:[-7,1,4,1,1],pragmatism:[6,2,5,2,1],project_thesis:[10,3,7,2,2]
};
for(const card of CARDS){
 const profile=stakes[card.id]??(card.source==='preparation'?[-14,1,3,1,1]:card.source==='club'?[5,2,5,2,1]:[12,3,7,2,2]);
 [card.dc,,card.resolveHit,card.suspicionHit,card.patienceHit]=profile;
 card.agreement=1;
 card.tags=[card.source,card.source+':'+card.key];
}
export const POOLS={
 general:{name:'General audience',weights:{}},
 scholarly:{name:'Scholarly audience',weights:{preparation:3,'skills:lore':3,'skills:alchemy':2}},
 social:{name:'Social audience',weights:{relationship:3,renown:2,club:2}},
 official:{name:'Formal audience',weights:{renown:3,preparation:2,'skills:lore':2}},
 practical:{name:'Practical audience',weights:{job:3,club:2,'skills:arcana':2,'skills:alchemy':2,'skills:vigor':2}},
 covert:{name:'Private audience',weights:{'skills:guile':3,'alignment:hollow':3,job:2}}
};
const social=['common_ground','reassurance','honest_appeal','objection','bold_pitch','small_joke'];
// A scene admits kinds of evidence, not a bespoke per-card deck. The two Lore
// leads, for example, always share eligibility; weights can favour either.
const deck=(name,ids,weights={})=>({name,tags:[...new Set([...social,...ids.split(' ')].map(id=>{const c=CARDS.find(c=>c.id===id);if(!c)throw Error(id);return c.source+':'+c.key;}))],weights});
Object.assign(POOLS,{
 committee:deck('Committee',['precedent distinction spellcraft method project_thesis',...['evocation','astromancy','alchemy','illusion','beastcraft','umbral','artifice','starcalling','hollow_studies'].map(k=>'prep_'+k)].join(' '),{'skills:lore':3,project:3,preparation:2,small_joke:.25}),
 teaching:deck('Teaching panel','precedent distinction read_room project_thesis prep_astromancy prep_illusion',{'skills:lore':3}),
 appeal:deck('Exam appeal','precedent distinction composure reputation prep_evocation prep_astromancy prep_alchemy prep_illusion prep_beastcraft prep_umbral prep_artifice prep_starcalling prep_hollow_studies',{'skills:lore':2,preparation:3,small_joke:.2}),
 accountability:deck('Accountability hearing','precedent composure principle standing trust prep_evocation prep_astromancy prep_alchemy prep_illusion prep_beastcraft prep_umbral',{principle:2,small_joke:.2,bold_pitch:.5}),
 aid:deck('Hardship interview','principle pragmatism composure job_work job_tavern job_library_assistant job_apothecary_clerk job_broom_courier',{reassurance:2,small_joke:.3}),
 credit:deck('Work and attribution','precedent distinction reputation composure job_intern_royal_library job_intern_conclave job_intern_alchemists job_intern_expedition job_intern_field_station job_intern_thornwick job_intern_unseen_office',{job:2,small_joke:.2}),
 inspection:deck('Licensing inspection','precedent distinction composure principle method job_tavern',{job:5,small_joke:.2,bold_pitch:.5}),
 fine:deck('Liability dispute','precedent distinction spellcraft composure principle reputation',{'skills:lore':2}),
 wages:deck('Wage dispute','precedent distinction composure pragmatism job_work job_tavern job_library_assistant job_apothecary_clerk job_broom_courier',{job:2,small_joke:.3}),
 broker:deck('Price and leverage','read_room cover_story pragmatism standing reputation',{read_room:3,pragmatism:2}),
 errands:deck('Work and price','read_room pragmatism composure job_work job_broom_courier',{read_room:2,job:3}),
 last_copy:deck('A rival buyer','read_room trust history pragmatism precedent',{relationship:3,read_room:2}),
 fakes:deck('Public authenticity dispute','read_room spellcraft method principle standing reputation',{spellcraft:3,method:2}),
 intimate:deck('A personal commitment','read_room trust history principle composure',{relationship:4,principle:2,bold_pitch:.5,small_joke:.2}),
 manners:deck('A formal introduction','read_room composure standing reputation precedent',{renown:3,read_room:2}),
 harvest:deck('A practical way to stay','read_room trust history principle pragmatism job_work job_tavern job_library_assistant job_apothecary_clerk job_broom_courier',{relationship:3,job:2,small_joke:.2}),
 crowd:deck('A hostile audience','read_room composure standing reputation principle club_duelling',{read_room:2,small_joke:3}),
 risk:deck('A risky plan','read_room trust history principle pragmatism composure',{relationship:3,read_room:2}),
 boundary:deck('Refuse coercion','read_room composure principle pragmatism standing reputation',{composure:3,read_room:2,small_joke:.2}),
 press:deck('Correction and reputation','precedent distinction read_room trust standing reputation club_lumen_ledger',{renown:2,'club:lumen_ledger':3}),
 editing:deck('An editorial dispute','precedent distinction read_room trust club_lumen_ledger',{'skills:lore':3,'club:lumen_ledger':4}),
 access:deck('A request for access','read_room trust history standing reputation club_lumen_ledger',{relationship:3,renown:3}),
 workshop:deck('A workshop safety plan','precedent distinction spellcraft method composure prep_artifice prep_alchemy prep_evocation',{method:3,spellcraft:2,'preparation:artifice':4,small_joke:.2}),
 advocacy:deck('Testimony for a friend','read_room composure principle standing reputation',{principle:3,composure:2,small_joke:.2}),
 apology:deck('Trust after betrayal','read_room trust history principle composure',{relationship:4,principle:3,small_joke:.1,bold_pitch:.3}),
 mediation:deck('A difficult reconciliation','read_room trust history principle composure',{relationship:3,read_room:3,small_joke:.3}),
 interview:deck('A career interview','precedent read_room composure standing reputation project_thesis job_intern_royal_library job_intern_conclave job_intern_alchemists job_intern_expedition job_intern_field_station job_intern_thornwick job_intern_unseen_office',{job:1.5,precedent:2}),
 patron:deck('Conversation with a patron','read_room precedent distinction standing reputation',{renown:3,bold_pitch:2,small_joke:2}),
 masked:deck('An anonymous room','read_room cover_story composure pragmatism job_tavern',{'skills:guile':4,composure:2}),
 rivalry:deck('A room of rivals','read_room composure standing reputation job_intern_thornwick club_duelling',{small_joke:3,'job:intern_thornwick':4}),
 reporting:deck('An adversarial interview','read_room cover_story precedent distinction composure club_lumen_ledger',{'skills:guile':4,'club:lumen_ledger':4,small_joke:.3}),
 tavern_room:deck('A festival room','read_room composure standing reputation job_tavern',{'job:tavern':5,small_joke:3}),
 portrait:deck('A dissatisfied portrait','read_room precedent trust standing principle spellcraft',{'skills:charm':2,precedent:2}),
 water_spirit:deck('Water-spirit etiquette','read_room spellcraft composure principle prep_evocation prep_beastcraft',{'preparation:evocation':3,spellcraft:3}),
 tunnel:deck('A guarded passage','read_room cover_story composure principle pragmatism trust',{'skills:guile':3,composure:3,small_joke:.1})
});
export function makePool(config){
 const def=POOLS[config.pool];if(!def)throw Error('Unknown argument pool');
 const weights={'skills:charm':3,...def.weights,...config.weights};
 const cards=CARDS.filter(c=>!def.tags||c.tags.some(tag=>def.tags.includes(tag))).map(c=>({...c,weight:c.weight*(weights[c.id]??weights[c.source+':'+c.key]??weights[c.source]??1)}));
 for(const [i,r]of (config.requests??[]).entries()){
   if(!['flag','spell','gold','health'].includes(r.type))throw Error('Unsupported explicit request');
   if(['gold','health'].includes(r.type)&&(!Number.isInteger(r.amount)||r.amount<1))throw Error('A resource request needs a positive integer amount');
   if(['flag','spell'].includes(r.type)&&typeof r.key!=='string')throw Error('A hard gate needs a key');
   cards.push({id:'event_'+i,type:r.type,key:r.key,amount:r.amount,title:r.title??({flag:'Your Papers, Please',spell:'Do You Know It?',gold:'A Matter of Crowns',health:'A Different Currency'}[r.type]),text:r.text??({flag:'They hold out a hand. "Your authorization, please. I need more than your assurance that it exists."',spell:'"I need someone who knows the spell." They study you. "Have you learned it, or have you only heard the name?"',gold:`They hold out an empty hand. "${r.amount} crowns. Then we can discuss the rest."`,health:'A small silver pin rests in their open palm. "A little of your blood. Given willingly."'}[r.type]),weight:r.weight??2,agreement:1,resolveHit:6,suspicionHit:2,patienceHit:1});
 }
 if(cards.length<2||cards.some(c=>!Number.isFinite(c.weight)||c.weight<=0))throw Error('Invalid argument pool');
 return cards;
}

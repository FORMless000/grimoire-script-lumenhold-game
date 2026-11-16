# Cast voice and schedule references for the knowledge-card scope

Current worldbook source is [`content/world/cast.grim`](../../../content/world/cast.grim). Condensed voice descriptions below preserve the declared voice premise; schedules are transcribed where present. Event-level cast, `actor:`, `place:`, time and term gates remain the specific conditions listed in [`knowing-context.md`](knowing-context.md) and [`full-picture-context.md`](full-picture-context.md).

| NPC | Voice (source line) | Schedule / availability (source lines) |
|---|---|---|
| Lyra | Clipped/formal; sarcastic when hurt; apologizes through useful actions (28). | Campus `duel_hall` evening, `library` afternoon; break schedule includes duel hall/library and Vaneshade/capital places (25–26). |
| Tobias | Warm, slow, earnest; farm sayings/goat stories; over-apologizes (51). | Greenhouses morning/afternoon, refectory noon/evening, stables evening; `gone_when` homesick-return window at lines 46–49 (46–49). |
| Seraphine | Half-sentences, calm/vague, suddenly exact about future (72). | Observatory evening/night, lakeshore afternoon, library mornings at 50% schedule; breaks add oracle rooms/capital cathedral (69–70). |
| Corvin | Teasing jokes, calls player “saint”; jokes stop when serious (94). | Courtyard noon/afternoon, gargoyle passage night/midnight (40%); Gilded Newt evening (90–92). |
| Mir | Fast/enthusiastic technical tangents; gentle to machines; says “probably” (118). | Workshop afternoon/evening/night, refectory noon (50%), lecture tower morning; break schedule workshop/Clockworks/bazaar (115–116). |
| Kael | Quiet, Northern formal, literal about feelings, startled by kindness (140). | Observatory night/midnight (30%), library afternoon (60%), boathouse evening; break schedule lakeshore/boathouse/observatory (136–138). |
| Nessa | Rapid, bossy, headline-shaped; interview mode, quiet off record (161). | Ledger office afternoon/evening/night, courtyard noon, Newt evening (25%) (158–159). |
| Bram | Loud/officious/rule-quoting; under it his father's voice; honest/gruff/brief (184). | Courtyard morning/noon, duel hall evening, library afternoon (50%); remains on campus during breaks (180–182). |
| Thorne | Terse/precise, allergic to flattery; “Hm.” full sentence; praise rare/disguised (206). | Lecture tower morning/afternoon, Great Hall noon, library evening (50%); break library afternoons/evenings (203–204). |
| Maud | Folksy/sharp, “dearie”; delayed advice; sad stories as recipes (228). | Cottage morning/noon/evening and greenhouses afternoon; break schedule similar (225–226). |
| Isolde | Pleasant/unhurried, words placed deliberately; short delighted laugh when surprised (250). | Headmistress tower morning/afternoon/evening and Great Hall noon; breaks tower afternoon/evening (247–248). |
| Ilse | Sharp/curt, Northern when upset; kindness treated warily (270). | Village afternoon/evening, lakeshore night; `gone_when: flag(ilse_taken) or flag(ilse_went_north)` (267–268). |
| Tamsin | Letter voice: fast/sly asides and crossings-out, new insult signature, kind words hidden in postscripts (293). | `distant: true`; cards reach player by letter; `schedule_break: away`; not cast in other people's cards (290–292). |
| Amaranth | Short sentences while doing something else; believes truth; forgiving; praise as instruction (318). | Alchemy lab morning, infirmary afternoon/evening/night, Great Hall noon; breaks infirmary afternoons/evenings/nights (315–316). |
| Brask | Full sentences to creatures, half-sentences to students; stories end in bite/moral; laughs once a term (340). | Stables morning/afternoon/evening, Great Hall noon; break stables and field station (337–338). |
| Vey | Amused/theatrical/observant; asks questions whose answers she knows; delighted when fooled (363). | Lecture tower morning/afternoon, Great Hall noon; breaks at capital theatre evenings/nights (359–361). |
| Marisol | Soft/unhurried until weather; quotes water poems, forgets endings; believes cold water is good for everyone (385). | Lakeshore morning/evening, lecture tower afternoon; breaks lakeshore morning/evening (382–383). |
| Mabel | Warm/brisk, finishes orders; reads moods as weather; calls students “petal” (406). | Mabel's morning/noon/afternoon, village evening (404). |
| Grimsby | Vague/courteous, excited about wrong thing; recommends books by smell; remembers old reading (427). | Grimsby's Books noon/afternoon, village evening (425). |
| Pell | Gruff/precise, counts aloud; corrects labels instead of apologizing (448). | Pell Apothecary morning/afternoon, village evening (446). |
| Grisk | Courtly/purring, invoice-like, calls debts “friendships”; pleasant statement of consequences (470). | Gilded Newt evening, village afternoon; `gone_when: flag(grisk_gone)` (467–468). |

Cast and per semantics: `per: x` or another role makes once/repeat bookkeeping per selected character for that role; the current event cast is filled under its written `where` predicates. Fixed `actor:` is the identity for personal/social cards; `around()` uses current schedule availability. Language guide references: [`docs/grimoire-script.md`](../../grimoire-script.md:516) and [cast roles/per](../../grimoire-script.md:591).

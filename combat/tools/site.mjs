// The test bench site, in memory: {file name → Buffer}. Written to disk by tools/build.mjs (out/site/) and served by the
// main game's server at /bench/ (server/index.js, the title screen's "Combat bench"), so the bench runs with no cargo:
// its core.wasm is web/core.wasm when built here, else the one inlined in build/combat.bundle.js (committed).
//   siteFiles({wasm})   wasm: a Buffer to use instead
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),gameRoot=path.join(root,'..');
const SOURCES=['setup/text.mjs','setup/cast-stats.mjs','setup/loadouts.mjs','setup/roster.mjs','setup/foes.mjs','setup/setup.mjs','setup/flavor.mjs','setup/campaign.mjs','web/core.mjs','web/analysis.mjs'];

// The core: web/core.wasm, else the bundle's (`const WASM='…'`, base64).
export function coreWasm(){
 const own=path.join(root,'web/core.wasm');if(fs.existsSync(own))return fs.readFileSync(own);
 const bundle=fs.readFileSync(path.join(gameRoot,'build/combat.bundle.js'),'utf8'),m=/^const WASM='([A-Za-z0-9+/=]+)';$/m.exec(bundle);
 if(!m)throw Error('build/combat.bundle.js has no inlined core.wasm');
 return Buffer.from(m[1],'base64');
}

export async function siteFiles({wasm,game:withGame=false}={}){
 const files={};
 const {readSpellIcons,readActionIcons}=await import('../web/icon-source.mjs');
 for(const file of ['index.html','app.mjs','art.mjs','style.css','server.mjs','rulebook.md','README.md'])files[file]=fs.readFileSync(path.join(root,'web',file));
 // brief.mjs reads its translations from setup/text.mjs, which the site serves inside engine.mjs.
 files['brief.mjs']=Buffer.from(fs.readFileSync(path.join(root,'web/brief.mjs'),'utf8').replace("from '../setup/text.mjs'","from './engine.mjs'"));
 // Character portraits: the main game's Minimal PNGs (art/characters/minimal/portraits, by NPC id). Characters without one get
 // an SVG placeholder (web/art.mjs).
 const portraitSrc=path.join(gameRoot,'art/characters/minimal/portraits'),portraits=fs.existsSync(portraitSrc)?fs.readdirSync(portraitSrc).filter(f=>/^[a-z0-9_]+\.png$/.test(f)):[];
 for(const f of portraits)files['portraits/'+f]=fs.readFileSync(path.join(portraitSrc,f));
 files['core.wasm']=wasm??coreWasm();
 const sources=SOURCES.map(f=>fs.readFileSync(path.join(root,f),'utf8').replace(/^import .*;\n/gm,'').replace(/^export \{[^}]+\};\n/gm,''));
 // The main game around a fight, read from the repository: its English fight text (UI_EN fight.* and kit.slot.*,
 // src/i18n.js) for the setting line, the lesson's coach marks and the wind-up; the worn items (content/world/items.grim) for
 // the kit picker; the cast's names and pronouns (content/world/cast.grim) for the fight text. Each is left empty when the
 // main game can't be read, and the bench falls back to its own words, no kit and "they".
 const game=createRequire(import.meta.url);
 let GAME_TEXT={},WORN_ITEMS={},GAME_NPCS={};
 try{GAME_TEXT=Object.fromEntries(Object.entries(game(path.join(gameRoot,'src/i18n.js')).UI_EN).filter(([k])=>/^(fight|kit\.slot)\./.test(k)));}catch(e){console.warn('No main-game fight text: '+e.message);}
 try{const {content,errors}=game(path.join(gameRoot,'tools/project.js')).project(gameRoot).compileAll();if(errors?.length)throw Error(errors.length+' content errors');
  for(const [id,d]of Object.entries(content.items??{}))WORN_ITEMS[id]={name:d.name??id,slot:d.slot,...(d.worn?{worn:d.worn}:{})};
  for(const [id,n]of Object.entries(content.npcs??{}))GAME_NPCS[id]={name:n.name,...(n.short?{short:n.short}:{}),pronouns:n.pronouns??'they'};}catch(e){console.warn('No main-game content: '+e.message);}
 // The main game's translations (locales/<lang>/), as src/ui.js hands them to a fight: the fight's own strings (combat.lang)
 // with the spell names the content translates, the fight's UI lines (ui.lang fight.* and kit.slot.*), and the translated
 // names of the cast and the worn items. The bench switches language with them (web/app.mjs).
 let GAME_LOCALES={};
 try{const I18n=game(path.join(gameRoot,'src/i18n.js')),proj=game(path.join(gameRoot,'tools/project.js')).project(gameRoot);
  for(const lang of proj.localeLangs()){const loc=I18n.loadLocale(lang,proj.liveLocaleSources(lang)),{content}=proj.compileAll();I18n.applyContent(content,loc);
   const combat=Object.fromEntries(Object.entries(loc.blocks.combat??{}).filter(([,v])=>v.text!=='').map(([k,v])=>[k,v.text]));
   GAME_LOCALES[lang]={name:loc.ui['lang.name']||lang,
    text:{...Object.fromEntries(Object.entries(content.spells??{}).map(([id,d])=>['label.'+id,d.name])),...combat},
    ui:Object.fromEntries(Object.entries(loc.ui).filter(([k,v])=>/^(fight|kit\.slot)\./.test(k)&&v!=='')),
    npcs:Object.fromEntries(Object.entries(content.npcs??{}).map(([id,n])=>[id,{name:n.name,...(n.short?{short:n.short}:{}),pronouns:n.pronouns??'they'}])),
    items:Object.fromEntries(Object.entries(content.items??{}).map(([id,d])=>[id,d.name??id]))};}}catch(e){console.warn('No main-game translations: '+e.message);}
 // Fight-screen forks (experiments/combat-ui, a local experiment, absent from a deploy): the bench can play a fight in one in
 // place of the main game's screen (web/app.mjs). Each fork is a folder with fork.json ({name, summary}), ui.js and ui.css,
 // on the shared proto/ (base.js, base.css).
 const FORKS=[],forkRoot=path.join(gameRoot,'experiments/combat-ui');
 if(fs.existsSync(path.join(forkRoot,'proto/base.js'))){
  for(const f of ['base.js','base.css'])files['forks/proto/'+f]=fs.readFileSync(path.join(forkRoot,'proto',f));
  for(const d of fs.readdirSync(forkRoot).sort()){const meta=path.join(forkRoot,d,'fork.json');if(!fs.existsSync(meta))continue;
   for(const f of ['ui.js','ui.css'])if(fs.existsSync(path.join(forkRoot,d,f)))files[`forks/${d}/${f}`]=fs.readFileSync(path.join(forkRoot,d,f));
   FORKS.push({id:d,...JSON.parse(fs.readFileSync(meta,'utf8'))});}
 }
 // The main game itself, for a bench served on its own (tools/build.mjs): the fight is played in the game's page (game/),
 // the paths the game's server serves. The game's server serves the bench beside the game, so it needs none of this.
 if(withGame){const walk=(d)=>fs.existsSync(d)?fs.readdirSync(d).flatMap(f=>{const p=path.join(d,f);return fs.statSync(p).isDirectory()?walk(p):[p];}):[];
  for(const p of ['index.html','build/content.bundle.js','build/combat.bundle.js',...walk(path.join(gameRoot,'src')).map(f=>path.relative(gameRoot,f)),...walk(path.join(gameRoot,'content/world/maps')).filter(f=>f.endsWith('.svg')).map(f=>path.relative(gameRoot,f))])
   files['game/'+p]=fs.readFileSync(path.join(gameRoot,p));}
 files['engine.mjs']=Buffer.from('// Generated by combat/tools/site.mjs; edit the sources.\n'+sources.join('\n')+'\nexport const GAME_TEXT='+JSON.stringify(GAME_TEXT)+';\nexport const GAME_LOCALES='+JSON.stringify(GAME_LOCALES)+';\nexport const WORN_ITEMS='+JSON.stringify(WORN_ITEMS)+';\nexport const GAME_NPCS='+JSON.stringify(GAME_NPCS)+';\nexport const SPELL_ICONS='+JSON.stringify(readSpellIcons())+';\nexport const ACTION_ICONS='+JSON.stringify(readActionIcons())+';\nexport const FORKS='+JSON.stringify(FORKS)+';\nexport const PORTRAITS='+JSON.stringify(portraits.map(f=>f.slice(0,-4)))+';\n');
 for(const k of Object.keys(files))if(typeof files[k]==='string')files[k]=Buffer.from(files[k]);
 return files;
}

// The files the bench is made from (the server rebuilds the site when one of them changes).
export function siteSources(){
 const walk=(d)=>fs.existsSync(d)?fs.readdirSync(d).flatMap(f=>{const p=path.join(d,f);return fs.statSync(p).isDirectory()?walk(p):[p];}):[];
 return walk(path.join(root,'setup')).concat(walk(path.join(root,'web')),walk(path.join(gameRoot,'locales')).filter(f=>f.endsWith('.lang')),walk(path.join(gameRoot,'experiments/combat-ui')).filter(f=>/\.(js|css|json)$/.test(f)),[path.join(gameRoot,'build/combat.bundle.js'),path.join(gameRoot,'src/i18n.js')]).filter(f=>!/\.test\.mjs$/.test(f));
}

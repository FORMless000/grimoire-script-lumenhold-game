// Long-lived native Rust process; schema is sent once. A line is a whole game,
// avoiding per-action JSON crossings. No main-game data beyond frozen spells.
import {spawn} from 'node:child_process';import readline from 'node:readline';import {fileURLToPath} from 'node:url';import schema from '../schema.mjs';
export function nativeCore(){const process=spawn(fileURLToPath(new URL('../rust/target/release/negotiation-core',import.meta.url)),[],{stdio:['pipe','pipe','inherit']});const waiting=[];let error;
 readline.createInterface({input:process.stdout}).on('line',line=>{const next=waiting.shift();if(!next)return;try{const v=JSON.parse(line);if(v.error)next.reject(Error(v.error));else next.resolve(v);}catch(e){next.reject(e);}});
 process.on('error',e=>{error=e;while(waiting.length)waiting.shift().reject(e);});process.on('exit',(code,signal)=>{error=Error('Research core exited: '+(signal??code));while(waiting.length)waiting.shift().reject(error);});
 const request=v=>new Promise((resolve,reject)=>{if(error){reject(error);return;}waiting.push({resolve,reject});process.stdin.write(JSON.stringify(v)+'\n');});
 const ready=request({op:'configure',schema:schema.spells});return {request:async v=>{await ready;return request(v);},close:()=>process.stdin.end()};
}

// One compact Rust core in both browsers and Node. No JS search callbacks.
import {SPELLS} from './reference-engine.mjs';
const url=new URL('./negotiation.wasm',import.meta.url);
const bytes=typeof process!=='undefined'&&process.versions?.node
 ? await (await import('node:fs/promises')).readFile(url)
 : await (await fetch(url)).arrayBuffer();
const {instance}=await WebAssembly.instantiate(bytes,{env:{now:()=>performance.now()}});
const wasm=instance.exports,encoder=new TextEncoder(),decoder=new TextDecoder();
function input(name,value){const bytes=encoder.encode(JSON.stringify(value)),ptr=wasm.alloc(bytes.length);new Uint8Array(wasm.memory.buffer,ptr,bytes.length).set(bytes);try{wasm[name](ptr,bytes.length);}finally{wasm.dealloc(ptr,bytes.length);}}
input('configure',SPELLS);
export function core(op,state,extra={}){input('invoke',{op,state,...extra});const result=JSON.parse(decoder.decode(new Uint8Array(wasm.memory.buffer,wasm.out_ptr(),wasm.out_len())));if(result?.error)throw Error(result.error);return result;}

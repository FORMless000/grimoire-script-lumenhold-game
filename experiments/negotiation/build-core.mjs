import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url)),cargo=process.env.CARGO??path.join(process.env.HOME,'.cargo/bin/cargo');
execFileSync(cargo,['build','--offline','--release','--target','wasm32-unknown-unknown','--manifest-path',path.join(root,'rust/Cargo.toml')],{stdio:'inherit'});
fs.copyFileSync(path.join(root,'rust/target/wasm32-unknown-unknown/release/negotiation_core.wasm'),path.join(root,'negotiation.wasm'));
console.log('Built negotiation.wasm');

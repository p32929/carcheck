// One runnable check: parse a real CAR, then corrupt a byte and confirm we catch it.
import { readFileSync } from 'node:fs';
import assert from 'node:assert';
import { verifyCar } from './carcheck.js';

const raw = readFileSync(process.argv[2] ?? 'test.car');
const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);

const good = await verifyCar(buf);
console.log('v%d  blocks=%d ok=%d bad=%d skipped=%d  roots=%s', good.version, good.stats.total, good.stats.ok, good.stats.bad, good.stats.skipped, good.roots.join(','));
console.log('first block:', good.blocks[0].cid, good.blocks[0].codec, good.blocks[0].hash, good.blocks[0].size + 'B');
assert(good.stats.total > 0, 'parsed no blocks');
assert(good.stats.bad === 0, 'clean file reported bad blocks');
assert(good.errors.length === 0, 'clean file reported errors: ' + good.errors.join('; '));
assert(good.roots.length > 0 && good.missingRoots.length === 0, 'root CID not found in file');

// flip one byte inside the last block's payload
const dirty = new Uint8Array(buf.slice(0));
const last = good.blocks[good.blocks.length - 1];
dirty[last.offset + (last.size >> 1)] ^= 0xff;
const bad = await verifyCar(dirty.buffer);
console.log('after 1-byte corruption: bad=%d  errors=%d', bad.stats.bad, bad.errors.length);
assert(bad.stats.bad >= 1, 'corruption went undetected');
console.log('PASS');

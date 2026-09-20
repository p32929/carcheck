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

// Wrap the same CARv1 in a CARv2 envelope (pragma + 40-byte header, no index) and re-verify.
const pragma = Uint8Array.from([0x0a, 0xa1, 0x67, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x02]);
const hdr = new DataView(new ArrayBuffer(40));
hdr.setBigUint64(16, 11n + 40n, true);              // dataOffset
hdr.setBigUint64(24, BigInt(raw.byteLength), true); // dataSize
const v2 = new Uint8Array(11 + 40 + raw.byteLength);
v2.set(pragma, 0);
v2.set(new Uint8Array(hdr.buffer), 11);
v2.set(new Uint8Array(buf), 51);
const wrapped = await verifyCar(v2.buffer);
console.log('CARv%d wrapper: blocks=%d ok=%d bad=%d', wrapped.version, wrapped.stats.total, wrapped.stats.ok, wrapped.stats.bad);
assert.strictEqual(wrapped.version, 2, 'CARv2 pragma not detected');
assert.strictEqual(wrapped.stats.ok, good.stats.ok, 'CARv2 wrapper changed the block count');
assert.strictEqual(wrapped.stats.bad, 0, 'CARv2 wrapper reported corruption');
assert.deepStrictEqual(wrapped.roots, good.roots, 'CARv2 wrapper lost the roots');
console.log('PASS (CARv1 + CARv2)');

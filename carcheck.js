// carcheck — verify an IPFS/Filecoin CAR v1/v2 file block-by-block.
// No dependencies. Runs identically in a browser and in Node (both have crypto.subtle).

const CODECS = { 0x55: 'raw', 0x70: 'dag-pb', 0x71: 'dag-cbor', 0x0129: 'dag-json', 0x78: 'git-raw' };
const HASHES = { 0x00: 'identity', 0x12: 'sha2-256', 0x13: 'sha2-512', 0xb220: 'blake2b-256' };

export function varint(b, i) {
  let x = 0, s = 0, n = 0;
  for (;;) {
    if (i + n >= b.length) throw new Error('truncated varint');
    const c = b[i + n++];
    x += (c & 0x7f) * Math.pow(2, s);
    if (c < 0x80) return [x, i + n];
    s += 7;
    if (s > 63) throw new Error('varint too long');
  }
}

// Minimal CBOR reader — only what a CAR header uses (uint, bytes, text, array, map, tag).
function cbor(b, i) {
  const t = b[i] >> 5, a = b[i] & 31;
  let v = a, j = i + 1;
  if (a === 24) { v = b[j]; j += 1; }
  else if (a === 25) { v = (b[j] << 8) | b[j + 1]; j += 2; }
  else if (a === 26) { v = new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(j); j += 4; }
  else if (a === 27) { v = Number(new DataView(b.buffer, b.byteOffset, b.byteLength).getBigUint64(j)); j += 8; }
  else if (a > 27) throw new Error('unsupported cbor header');
  switch (t) {
    case 0: return [v, j];
    case 2: return [b.subarray(j, j + v), j + v];
    case 3: return [new TextDecoder().decode(b.subarray(j, j + v)), j + v];
    case 4: { const out = []; for (let k = 0; k < v; k++) { const [x, n] = cbor(b, j); out.push(x); j = n; } return [out, j]; }
    case 5: { const out = {}; for (let k = 0; k < v; k++) { const [key, n1] = cbor(b, j); const [val, n2] = cbor(b, n1); out[key] = val; j = n2; } return [out, j]; }
    case 6: { const [x, n] = cbor(b, j); return [x, n]; } // tag 42 = CID, value is the byte string
    default: throw new Error('unsupported cbor major type ' + t);
  }
}

export function parseCid(b, off) {
  if (b[off] === 0x12 && b[off + 1] === 0x20) // CIDv0 is a bare sha2-256 multihash
    return { version: 0, codec: 0x70, mh: 0x12, digest: b.subarray(off + 2, off + 34), start: off, end: off + 34 };
  const [version, a] = varint(b, off);
  if (version !== 1) throw new Error('unsupported CID version ' + version);
  const [codec, c] = varint(b, a);
  const [mh, d] = varint(b, c);
  const [len, e] = varint(b, d);
  if (e + len > b.length) throw new Error('truncated CID');
  return { version, codec, mh, digest: b.subarray(e, e + len), start: off, end: e + len };
}

const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base32(b) {
  let bits = 0, val = 0, out = '';
  for (const byte of b) { val = (val << 8) | byte; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits) out += B32[(val << (5 - bits)) & 31];
  return out;
}

function base58(b) {
  const digits = [0];
  for (const byte of b) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) { carry += digits[i] << 8; digits[i] = carry % 58; carry = (carry / 58) | 0; }
    while (carry) { digits.push(carry % 58); carry = (carry / 58) | 0; }
  }
  let out = '';
  for (const byte of b) { if (byte) break; out += '1'; }
  for (let i = digits.length - 1; i >= 0; i--) out += B58[digits[i]];
  return out;
}

export function cidToString(cid, bytes) {
  const raw = bytes.subarray(cid.start, cid.end);
  return cid.version === 0 ? base58(raw) : 'b' + base32(raw);
}

export const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

async function digestOf(mh, bytes, blockBytes) {
  if (mh === 0x00) return blockBytes;                // identity: the "hash" is the data
  if (mh === 0x12) return new Uint8Array(await crypto.subtle.digest('SHA-256', blockBytes));
  if (mh === 0x13) return new Uint8Array(await crypto.subtle.digest('SHA-512', blockBytes));
  return null;                                        // blake2b etc: no native implementation
}

const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Returns {version, roots[], blocks[], stats, errors[]}
export async function verifyCar(buf, onProgress) {
  const b = new Uint8Array(buf);
  const out = { version: 1, roots: [], blocks: [], errors: [], stats: { total: 0, ok: 0, bad: 0, skipped: 0, bytes: b.length } };

  let i = 0;
  // CARv2: 11-byte pragma then a 40-byte header pointing at an inner CARv1
  const V2_PRAGMA = [0x0a, 0xa1, 0x67, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x02];
  if (b.length > 51 && V2_PRAGMA.every((x, k) => b[k] === x)) {
    const dv = new DataView(b.buffer, b.byteOffset);
    const dataOffset = Number(dv.getBigUint64(11 + 16, true));
    const dataSize = Number(dv.getBigUint64(11 + 24, true));
    out.version = 2;
    return verifyCar(b.subarray(dataOffset, dataOffset + dataSize).slice().buffer, onProgress)
      .then((r) => ({ ...r, version: 2, stats: { ...r.stats, bytes: b.length } }));
  }

  const [hlen, h0] = varint(b, i);
  const [header] = cbor(b, h0);
  i = h0 + hlen;
  if (header.version !== 1) out.errors.push(`header says version ${header.version}, expected 1`);
  for (const r of header.roots || []) {
    // DAG-CBOR wraps a CID in tag 42 with a leading 0x00 identity-multibase prefix
    const bytes = r[0] === 0x00 ? r.subarray(1) : r;
    out.roots.push(cidToString(parseCid(bytes, 0), bytes));
  }

  while (i < b.length) {
    const [blen, p] = varint(b, i);
    if (p + blen > b.length) { out.errors.push(`block at offset ${i} is truncated (declares ${blen} bytes, ${b.length - p} left)`); break; }
    const cid = parseCid(b, p);
    const data = b.subarray(cid.end, p + blen);
    const want = cid.digest;
    const got = await digestOf(cid.mh, b, data);
    const hashName = HASHES[cid.mh] || `0x${cid.mh.toString(16)}`;
    let status;
    if (got === null) { status = 'skipped'; out.stats.skipped++; }
    else if (eq(got, want)) { status = 'ok'; out.stats.ok++; }
    else { status = 'bad'; out.stats.bad++; out.errors.push(`block #${out.stats.total} CID digest mismatch`); }
    out.blocks.push({
      index: out.stats.total, offset: i, cid: cidToString(cid, b), size: data.length,
      codec: CODECS[cid.codec] || `0x${cid.codec.toString(16)}`, hash: hashName, status,
      want: hex(want), got: got ? hex(got) : null,
    });
    out.stats.total++;
    if (onProgress && out.stats.total % 500 === 0) await onProgress(out.stats);
    i = p + blen;
  }

  const have = new Set(out.blocks.map((x) => x.cid));
  out.missingRoots = out.roots.filter((r) => !have.has(r));
  for (const r of out.missingRoots) out.errors.push(`root ${r} is declared in the header but not present in the file`);
  return out;
}

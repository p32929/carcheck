# carcheck

**Verify an IPFS / Filecoin CAR file block-by-block, in your browser. Nothing is uploaded.**

▶ **[p32929.github.io/carcheck](https://p32929.github.io/carcheck/)**

A `.car` (Content Addressable aRchive) is the file format Filecoin deals and IPFS exports
travel in. Its whole promise is that every block is addressed by the hash of its own bytes —
but nothing checks that promise for you. If a byte flips in transit, on disk, or in a
retrieval, the file still *looks* fine.

carcheck opens the archive and, for every single block, re-hashes the bytes and compares the
result to the CID the block is filed under. It also checks that the root CID declared in the
header is actually present in the file — the most common way a truncated or partial export
fails silently.

### What it checks

| Check | Why it matters |
|---|---|
| Every block's bytes re-hashed vs. its CID | Catches bit-rot, truncation and bad retrievals |
| Root CID present in the file | Catches partial/incomplete exports |
| CARv1 and CARv2 (pragma + inner v1) | CARv2 is what indexed exports use |
| Varint framing and block lengths | Catches truncated and malformed archives |
| Unsupported hashes are marked `skipped` | Never silently reports an unverified block as OK |

Supported multihashes: `sha2-256`, `sha2-512`, `identity`. Blake2b blocks are listed and
explicitly marked `skipped` rather than passed.

### Why it's client-side

CAR files are routinely gigabytes and routinely private. Uploading one to a web service to
find out whether it is intact is both slow and a data-handling problem. carcheck is a single
static page with no backend, no dependencies and no network calls — it works offline, and
your data never leaves the tab.

### Use it as a library

```js
import { verifyCar } from 'https://p32929.github.io/carcheck/carcheck.js';

const r = await verifyCar(await file.arrayBuffer());
console.log(r.stats);       // { total, ok, bad, skipped, bytes }
console.log(r.roots, r.missingRoots, r.errors);
```

Zero dependencies. The same module runs in Node (≥18) — see `test.js`.

### Run the check

```bash
curl -L -H 'Accept: application/vnd.ipld.car' \
  https://trustless-gateway.link/ipfs/bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy \
  -o test.car
node test.js test.car
```

It parses the archive, asserts the recomputed CID matches the one requested, then flips a
single byte and asserts the corruption is caught.

MIT © [p32929](https://github.com/p32929)

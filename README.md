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

## What it checks

| Check | Why it matters |
|---|---|
| Every block's bytes re-hashed vs. its CID | Catches bit-rot, truncation and bad retrievals |
| Root CID present in the file | Catches partial/incomplete exports |
| CARv1 and CARv2 (pragma + inner v1) | CARv2 is what indexed exports use |
| Varint framing and block lengths | Catches truncated and malformed archives |
| Unsupported hashes are marked `skipped` | Never silently reports an unverified block as OK |

Supported multihashes: `sha2-256`, `sha2-512`, `identity`. Blake2b blocks are listed and
explicitly marked `skipped` rather than passed.

## Why it's client-side

CAR files are routinely gigabytes and routinely private. Uploading one to a web service to
find out whether it is intact is both slow and a data-handling problem. carcheck is a single
static page with no backend, no dependencies and no network calls — it works offline, and
your data never leaves the tab.

## Use it as a library

```js
import { verifyCar } from 'https://p32929.github.io/carcheck/carcheck.js';

const r = await verifyCar(await file.arrayBuffer());
console.log(r.stats);       // { total, ok, bad, skipped, bytes }
console.log(r.roots, r.missingRoots, r.errors);
```

Zero dependencies. The same module runs in Node (≥18) — see `test.js`.

## Run the check

```bash
curl -L -H 'Accept: application/vnd.ipld.car' \
  https://trustless-gateway.link/ipfs/bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy \
  -o test.car
node test.js test.car
```

It parses the archive, asserts the recomputed CID matches the one requested, then flips a
single byte and asserts the corruption is caught.

## Paid work

The tool is free (MIT) and stays that way. These are the things people pay me to do with it, fixed price, delivered end to end:

| | What you get | Turnaround |
|---|---|---|
| **$500** | **Integrity audit** — send CIDs or a gateway/bucket URL, get every block and declared root verified and a signed report naming exactly what failed and why | 3 working days |
| **$1,500** | **Self-hosted / white-label verifier** — carcheck under your name and domain, plus a Node CLI and a GitHub Action so CI verifies every archive you produce | 1 week |
| **$5,000** | **Storage pipeline integrity build** — verification wired into ingest and retrieval: block checks, Piece CID / CommP re-computation, per-deal failure reports, alerting when an archive stops matching its CID | 2–3 weeks |

Start one at **[buymeacoffee.com/p32929](https://buymeacoffee.com/p32929)** — checkout is in units of $5, so pick the
matching count (100 = $500, 300 = $1,500, 1000 = $5,000) and put `CARCHECK-AUDIT`, `CARCHECK-SELFHOST` or
`CARCHECK-PIPELINE` plus your email in the message. Everything is scoped in writing before any work starts.

## License

MIT © [p32929](https://github.com/p32929) — see [LICENSE](LICENSE).

## Contributing

Contributions are warmly welcomed and greatly appreciated! Whether it's a bug fix, new feature, or improvement, your input helps make this project better for everyone.

Before submitting a pull request, please:

1. Create an issue describing the feature or bug fix you'd like to work on
2. Wait for discussion and approval to ensure alignment with project goals
3. Fork the repository and create your feature branch
4. Submit your pull request with a clear description of changes

This approach helps avoid duplicate efforts and ensures smooth collaboration. Thank you for considering contributing!

## Share

Sharing this repository with your friends is just one click away from here

[![facebook](https://user-images.githubusercontent.com/6418354/179013321-ac1d1452-0689-493f-9066-940cf2302b6e.png)](https://www.facebook.com/sharer/sharer.php?u=https://github.com/p32929/carcheck/)
[![twitter](https://user-images.githubusercontent.com/6418354/179013351-7d8d6d1c-4ce2-46ab-bef8-4c4765a1b888.png)](https://twitter.com/intent/tweet?url=https://github.com/p32929/carcheck/)
[![tumblr](https://user-images.githubusercontent.com/6418354/179013343-3111f55a-3b90-40c7-8487-9777348672b0.png)](https://www.tumblr.com/share?v=3&u=https://github.com/p32929/carcheck/)
[![pocket](https://user-images.githubusercontent.com/6418354/179013334-b095c45f-becf-49f4-9ee1-5a731a9b1f85.png)](https://getpocket.com/save?url=https://github.com/p32929/carcheck/)
[![pinterest](https://user-images.githubusercontent.com/6418354/179013331-44cd9206-11b1-4b65-becb-5863b61c828f.png)](https://pinterest.com/pin/create/button/?url=https://github.com/p32929/carcheck/)
[![reddit](https://user-images.githubusercontent.com/6418354/179013338-7416ae3f-73ba-4522-86e1-1374d7082d22.png)](https://www.reddit.com/submit?url=https://github.com/p32929/carcheck/)
[![linkedin](https://user-images.githubusercontent.com/6418354/179013327-ca7b7102-1da8-4b1c-858f-1a6e5f21bd70.png)](https://www.linkedin.com/shareArticle?mini=true&url=https://github.com/p32929/carcheck/)
[![whatsapp](https://user-images.githubusercontent.com/6418354/179013353-f477fa0b-3e6f-4138-a357-c9991b23ff88.png)](https://api.whatsapp.com/send?text=https://github.com/p32929/carcheck/)

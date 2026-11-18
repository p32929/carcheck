# carcheck

Check that an IPFS or Filecoin CAR file is not broken, block by block, right in your browser. Nothing is uploaded, and there are no third-party dependencies.

**Try it: [p32929.github.io/carcheck](https://p32929.github.io/carcheck/)**

A `.car` file is the format Filecoin deals and IPFS exports travel in. Every block inside it is named by the hash of its own bytes, but nothing checks that for you. If a byte flips in transit, on disk or during a retrieval, the file still looks fine. carcheck re-hashes every block and tells you exactly which ones do not match.

## What it checks

1. **Every block:** it re-hashes the bytes and compares the result with the block's CID. This catches bit rot, cut-off files and bad retrievals.
2. **The root CID:** it checks that the root named in the header is really inside the file. A missing root is the most common sign of a partial export.
3. **CARv1 and CARv2:** both work, including the indexed CARv2 files many tools export.
4. **The file structure:** it checks the length of every block, so truncated or malformed files are caught.
5. **Honest results:** blocks it cannot check are marked `skipped`, never `ok`.

Supported hashes are `sha2-256`, `sha2-512` and `identity`. Blocks hashed with `blake2b-256` are listed and marked `skipped`.

## Why it runs in your browser

CAR files are often gigabytes in size and often private. Uploading one to a web service just to see if it is intact is slow, and it means handing your data to someone else. carcheck is one static page with no server, no dependencies and no network calls. It works offline and your file never leaves the tab.

## Use it in your own code

The same module works in the browser and in Node.js 18 or newer.

```js
import { verifyCar } from 'https://p32929.github.io/carcheck/carcheck.js';

const r = await verifyCar(await file.arrayBuffer());
console.log(r.stats);       // { total, ok, bad, skipped, bytes }
console.log(r.roots, r.missingRoots, r.errors);
```

## Run the test

```bash
curl -L -H 'Accept: application/vnd.ipld.car' \
  https://trustless-gateway.link/ipfs/bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy \
  -o test.car
node test.js test.car
```

The test reads the file, checks that the CID it works out matches the one you asked for, then changes one byte and checks that carcheck catches it.

## License

MIT License, Copyright (c) 2026 Fayaz Bin Salam. See [LICENSE](LICENSE) for the full text.

## Contributing

Contributions are very welcome, thank you! Before you start on a pull request, please open an issue and tell me what you would like to add or change. That way we can agree on it first, and your time is not spent on something that might not fit. Thanks for helping make carcheck better.

## You might also like

<p><a href="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/0"><picture><source media="(prefers-color-scheme: dark)" srcset="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/0-dark.svg"><img src="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/0-light.svg" width="50%" align="top" alt="More apps by p32929 on OpenStore (1)"></picture></a><a href="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/1"><picture><source media="(prefers-color-scheme: dark)" srcset="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/1-dark.svg"><img src="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/1-light.svg" width="50%" align="top" alt="More apps by p32929 on OpenStore (2)"></picture></a><br><a href="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/2"><picture><source media="(prefers-color-scheme: dark)" srcset="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/2-dark.svg"><img src="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/2-light.svg" width="50%" align="top" alt="More apps by p32929 on OpenStore (3)"></picture></a><a href="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/3"><picture><source media="(prefers-color-scheme: dark)" srcset="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/3-dark.svg"><img src="https://openstore.pfay.workers.dev/more/p32929/carcheck/personal/3-light.svg" width="50%" align="top" alt="More apps by p32929 on OpenStore (4)"></picture></a></p>

<p><a href="https://p32929.github.io/share/?repo=carcheck"><picture><source media="(prefers-color-scheme: dark)" srcset="https://p32929.github.io/readme/footer-share-dark.svg"><img src="https://p32929.github.io/readme/footer-share-light.svg" width="50%" align="top" alt="Share this project with your friends in one click"></picture></a><a href="https://p32929.github.io/support/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://p32929.github.io/readme/footer-support-dark.svg"><img src="https://p32929.github.io/readme/footer-support-light.svg" width="50%" align="top" alt="If you like my work and want to support me, feel free to support"></picture></a><br><a href="https://openstore.pfay.workers.dev/add"><picture><source media="(prefers-color-scheme: dark)" srcset="https://p32929.github.io/readme/footer-join-dark.svg"><img src="https://p32929.github.io/readme/footer-join-light.svg" width="100%" align="top" alt="Put your own apps on OpenStore: free, your listing lives in your own repo"></picture></a></p>

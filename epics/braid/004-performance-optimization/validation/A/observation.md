# BRAID-004/A real toolchain observation

Date: 2026-11-05. Machine: Windows x64, PowerShell 7.6.9. This is one official cold installation and one warm reuse. Repeatable proof is `test/fixtures/node-toolchain/Test-NodeToolchain.ps1`. The `win-arm64` pin was not executed on this machine.

The child process PATH was `System32` only, so an existing Node.js on the operator PATH could not satisfy the request. `BRAID_TOOLCHAIN_DIR` was the empty directory `C:\Users\exon\AppData\Local\Temp\braid-004-a-cold-d570e2a139264d4c98f1d624a4f61c9b`. The checkout had no `.tools` directory before or after either command.

Cold `pwsh -NoProfile -File scripts/Install-NodeToolchain.ps1` exited 0 in 12.3 seconds. Stdout was the single directory `node-v26.13.0-win-x64` under that root. Stderr recorded the download of `https://nodejs.org/dist/v26.13.0/SHASUMS256.txt` and `node-v26.13.0-win-x64.zip`, then `Verified SHA-256 dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a`. The published runtime reported Node.js `v26.13.0` and npm `11.20.0`. `.braid-toolchain.json` recorded version `26.13.0`, platform `win-x64`, and that archive hash.

Warm invocation of the same command, with `HTTP_PROXY`, `HTTPS_PROXY`, and `ALL_PROXY` set to `http://127.0.0.1:9`, exited 0 in 1.2 seconds. Stdout was the same directory. Stderr was only `Using shared Node.js toolchain` and did not contain `Downloading`.

The temporary root is outside the checkout and is not a committed artifact.

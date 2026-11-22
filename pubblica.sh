#!/bin/sh
# Pubblica l'app su GitHub Pages (ramo gh-pages).
#   ./pubblica.sh prova     -> solo il canale di prova:  .../TavoloAvventura/prova/
#   ./pubblica.sh pubblico  -> anche il canale pubblico: .../TavoloAvventura/
set -e
canale=${1:-prova}
git push -q origin main
tmp=$(mktemp -d)
git fetch -q origin gh-pages
git worktree add -q -f "$tmp" origin/gh-pages
FILES="index.html styles.css qrcode.js regole.js comandi.js ritratto.js lpc.js mappa.js mappa3d.js voce.js bot.js suoni.js app.js sw.js manifest.webmanifest version.json icon.svg icon-192.png icon-512.png"
mkdir -p "$tmp/prova"
for f in $FILES; do cp "$f" "$tmp/prova/$f"; done
mkdir -p "$tmp/prova/lpc" "$tmp/prova/vendor" && cp lpc/* "$tmp/prova/lpc/" && cp -r vendor/. "$tmp/prova/vendor/"
if [ "$canale" = pubblico ]; then for f in $FILES README.md; do cp "$f" "$tmp/$f"; done; mkdir -p "$tmp/lpc" "$tmp/vendor" && cp lpc/* "$tmp/lpc/" && cp -r vendor/. "$tmp/vendor/"; fi
versione=$(sed -n 's/.*"versione": "\([^"]*\)".*/\1/p' version.json)
(cd "$tmp" && git add -A && git commit -q -m "Pubblica $versione sul canale $canale" && git push -q origin HEAD:gh-pages)
git worktree remove --force "$tmp"
echo "Pubblicata $versione sul canale $canale"

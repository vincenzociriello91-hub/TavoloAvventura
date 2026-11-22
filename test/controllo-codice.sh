#!/bin/sh
# Controllo del codice di app e server (nomi non definiti, doppioni). Serve: npm i eslint@9 globals (una volta, in questa cartella o sopra).
# I file dell'app si controllano uniti nell'ordine di index.html, perché condividono le stesse variabili.
set -e
qui=$(cd "$(dirname "$0")" && pwd); tmp=$(mktemp -d); mkdir "$tmp/server"
cd "$qui/.."
ordine=$(grep -o '<script src="[^"]*"' index.html | sed 's/.*src="//; s/"//' | grep -v qrcode)
cat $ordine > "$tmp/cliente.js"
cp mappa3d.js dadi3d.js sw.js "$tmp/"; cp ../rapporti-vincenzo/src/*.js "$tmp/server/"
cp test/eslint.config.mjs "$tmp/eslint.config.mjs"; [ -d "$qui/node_modules" ] && ln -s "$qui/node_modules" "$tmp/node_modules" || ln -s "$qui/../node_modules" "$tmp/node_modules"
cd "$tmp" && npx eslint . && echo "codice a posto"

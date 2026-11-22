#!/usr/bin/env python3
"""Atlante dei pacchetti grafici comprati da Vincenzo (The Fan-tasy Tileset e gli altri ritagliati per le
Cronache dei Varchi) per le mappe del Tavolo. I file comprati NON vanno mai nel repository pubblico:
l'atlante si scrive nel repository privato TavoloAvventura-rapporti (cartella grafica/) e il server lo
consegna solo a chi è dentro una campagna.

Uso: python3 -I strumenti/atlante_pacchetti.py <cronachedeivarchi/grafica/pacchetti> <uscita>
Produce <uscita>/atlante.png e <uscita>/atlante.json ({nome: [x, y, w, h]}).
"""
import json
import os
import sys

from PIL import Image

sorgente, uscita = sys.argv[1], sys.argv[2]
pezzi = []
for cartella in ['fan', '.']:
    base = os.path.join(sorgente, cartella)
    for f in sorted(os.listdir(base)):
        n = f[:-4]
        if not f.endswith('.png') or n.startswith(('interno', 'sfondo', 'segno_', 'cornice', 'quadri')):
            continue
        nome = n if cartella == 'fan' else 'v_' + n  # i ritagli fuori da fan/ hanno il prefisso v_
        pezzi.append((nome, Image.open(os.path.join(base, f)).convert('RGBA')))

# impacchettamento a ripiani, i più alti per primi
pezzi.sort(key=lambda p: -p[1].size[1])
LARGO, x, y, alto_riga, posti = 2048, 0, 0, 0, {}
for nome, im in pezzi:
    w, h = im.size
    if x + w > LARGO:
        x, y, alto_riga = 0, y + alto_riga + 1, 0
    posti[nome] = [x, y, w, h]
    x, alto_riga = x + w + 1, max(alto_riga, h)
atlante = Image.new('RGBA', (LARGO, y + alto_riga))
for nome, im in pezzi:
    atlante.paste(im, tuple(posti[nome][:2]))
os.makedirs(uscita, exist_ok=True)
atlante.save(os.path.join(uscita, 'atlante.png'), optimize=True)
json.dump(posti, open(os.path.join(uscita, 'atlante.json'), 'w'), separators=(',', ':'))
print(len(posti), 'pezzi, atlante', atlante.size, os.path.getsize(os.path.join(uscita, 'atlante.png')) // 1024, 'KB')

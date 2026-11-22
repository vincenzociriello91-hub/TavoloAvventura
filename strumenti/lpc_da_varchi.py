#!/usr/bin/env python3
"""Copia nell'app le figure Universal LPC già preparate per Le Cronache dei Varchi (solo la camminata 9x4 da 64x64:
righe su, sinistra, giù, destra). Licenze LPC libere (OGA-BY 3.0 / CC-BY-SA 3.0 / GPL 3.0): i crediti vanno in
lpc/crediti.json e l'app li mostra. Nessun pacchetto comprato: solo grafica LPC.
Uso: python3 strumenti/lpc_da_varchi.py <cartella CronacheDeiVarchi>"""
import json, shutil, sys
from pathlib import Path

src = Path(sys.argv[1]) / 'grafica' / 'lpc'
dst = Path(__file__).resolve().parent.parent / 'lpc'
dst.mkdir(exist_ok=True)
cat = json.loads((src / 'catalogo.json').read_text())
out = {}
for pezzo, varianti in cat.items():
    if pezzo.startswith('coda_2_'):
        continue
    vv = []
    for v in varianti:
        file = {corpo: a['walk'] for corpo, a in v['file'].items() if a.get('walk')}
        for f in set(file.values()):
            shutil.copy(src / f, dst / f)
        if file:
            vv.append({'z': v['z'], 'mat': v['mat'], 'file': file})
    if vv:
        out[pezzo] = vv
(dst / 'catalogo.json').write_text(json.dumps(out, separators=(',', ':')))
shutil.copy(src / 'tavolozze.json', dst / 'tavolozze.json')
shutil.copy(src / 'crediti.json', dst / 'crediti.json')
print(len(out), 'pezzi', sum(p.stat().st_size for p in dst.glob('*.png')) // 1024, 'KB')

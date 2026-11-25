"""Effetti magici animati per la mappa: dai pacchetti gratuiti a fogli leggeri (fotogrammi in righe da 8).

Uso: python3 strumenti/effetti.py <cartella con "Spell Effects", "Lightning" e le cartelle fx* estratte> [--elenco]
  --elenco  stampa tutte le animazioni trovate nei fogli di Willibab (per scegliere quali usare)
Scrive effetti/<nome>.png e effetti/catalogo.json ({nome: {w, h, n, c}}: misura di un fotogramma, quanti sono, quanti per riga), usati da mappa.js.

Pacchetto usato: "Simple Pixel Spell Effects" di Willibab (itch.io, gratis anche per uso commerciale).
"2D Spell Effects" di Martin Jelinek / Nyrthos (CC0) è stato guardato e lasciato fuori: sfumato, non in pixel.
"""
import json, os, sys
from PIL import Image

CELLA = 192  # i fogli di Willibab: celle 192x192, 5 per riga, le animazioni separate da celle vuote

def animazioni_willibab(percorso):
    im = Image.open(percorso).convert('RGBA')
    celle = [im.crop((x, y, x + CELLA, y + CELLA)) for y in range(0, im.height, CELLA) for x in range(0, im.width, CELLA)]
    gruppi, ora = [], []
    for c in celle:
        if c.getbbox(): ora.append(c)
        elif ora: gruppi.append(ora); ora = []
    if ora: gruppi.append(ora)
    return [g for g in gruppi if len(g) >= 4]

def fotogrammi_cartella(cartella):
    nomi = sorted((f for f in os.listdir(cartella) if f.endswith('.png')), key=lambda f: int(f.rsplit('_', 1)[1].split('.')[0]))
    return [Image.open(os.path.join(cartella, f)).convert('RGBA') for f in nomi]

def griglia(fotogrammi, colonne=8):
    """Ritaglia tutti i fotogrammi sullo stesso riquadro (l'unione delle parti piene) e li mette in righe da 8: un foglio non troppo largo per i telefoni."""
    l = t = 10 ** 6; r = b = 0
    for f in fotogrammi:
        bb = f.getbbox()
        if bb: l, t, r, b = min(l, bb[0]), min(t, bb[1]), max(r, bb[2]), max(b, bb[3])
    pezzi = [f.crop((l, t, r, b)) for f in fotogrammi]
    w, h, c = r - l, b - t, min(colonne, len(pezzi))
    out = Image.new('RGBA', (w * c, h * ((len(pezzi) + c - 1) // c)))
    for i, p in enumerate(pezzi): out.paste(p, ((i % c) * w, (i // c) * h))
    return out, w, h, c

# quali animazioni usare: (nome nell'app, sorgente, indice dell'animazione nel foglio o None per le cartelle fx)
# solo Willibab: è in pixel come la mappa; gli effetti di Nyrthos sono sfumati e stonerebbero
SCELTE = [
    ('fuoco', 'Spell Effects/Fire 1.png', 2),      # palla di fuoco che scoppia sul bersaglio
    ('fiamme', 'Spell Effects/Fire 1.png', 0),     # colonna di fiamme (aree di fuoco)
    ('saetta', 'Lightning/Thunder Spells.png', 0), # fulmine dal cielo su un bersaglio
    ('fulmine', 'Lightning/Thunder Spells.png', 1),# fulmine ramificato (aree)
    ('cura', 'Spell Effects/Healing 1.png', 1),
    ('gelo', 'Spell Effects/Misc 1.png', 2),
    ('ombra', 'Spell Effects/Support 1.png', 1),
    ('luce', 'Spell Effects/Support 2.png', 0),
    ('arcano', 'Spell Effects/Misc 1.png', 1),
    ('scintille', 'Spell Effects/Misc 2.png', 0),  # colpo critico, nemico che cade
]

def main():
    base = sys.argv[1]
    if '--elenco' in sys.argv:
        for d in ('Spell Effects', 'Lightning'):
            for f in sorted(os.listdir(os.path.join(base, d))):
                for i, g in enumerate(animazioni_willibab(os.path.join(base, d, f))): print(f'{d}/{f}', i, len(g), 'fotogrammi')
        return
    dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'effetti'); os.makedirs(dest, exist_ok=True)
    catalogo = {}
    for nome, sorgente, indice in SCELTE:
        p = os.path.join(base, sorgente)
        fot = fotogrammi_cartella(p) if indice is None else animazioni_willibab(p)[indice]
        img, w, h, c = griglia(fot)
        img.save(os.path.join(dest, nome + '.png'), optimize=True)
        catalogo[nome] = {'w': w, 'h': h, 'n': len(fot), 'c': c}
        print(nome, w, h, len(fot), img.size)
    assert all(v['n'] >= 4 for v in catalogo.values())
    json.dump(catalogo, open(os.path.join(dest, 'catalogo.json'), 'w'), ensure_ascii=False)

if __name__ == '__main__':
    main()

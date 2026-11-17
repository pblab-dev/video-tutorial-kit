import os, json, re
from PIL import Image
src = open('scripts/make_board.py', encoding='utf-8').read()
# reaproveita as listas POP/OUT e a função fit do make_board sem rodar o desenho
ns = {'__file__': os.path.abspath('scripts/make_board.py')}
head = src.split("f1 = ImageFont")[0]
exec(head, ns)
fit_src = src[src.index('def fit('):src.index('H = 90')]
exec(fit_src, ns)
B = ns['B']; C = ns['C']; POP = ns['POP']; OUT = ns['OUT']; fit = ns['fit']
os.makedirs(B + '/cards', exist_ok=True)
rel = 'work/styles/cards'
TONE = {'R': ('Rápido', 'success'), 'M': ('Médio', 'warning'), 'L': ('Mais lento', 'danger')}
pop, out = [], []
n = 0
for (nome, sub, lv, p, v) in POP:
    n += 1
    fit(p, 640, 360, v).save('%s/cards/%02d.jpg' % (B, n), quality=82)
    pop.append({'id': n, 'src': '%s/%02d.jpg' % (rel, n), 'name': '%d · %s' % (n, nome), 'sub': sub,
                'speed': TONE[lv][0], 'tone': TONE[lv][1], 'btn': 'Escolher o %d' % n,
                'send': 'Quero o estilo %d – %s' % (n, nome)})
for (nome, sub, lv, k) in OUT:
    n += 1
    fit('%s/%02d.jpg' % (C, k), 640, 360, False).save('%s/cards/%02d.jpg' % (B, n), quality=82)
    out.append({'id': n, 'src': '%s/%02d.jpg' % (rel, n), 'name': '%d · %s' % (n, nome), 'sub': sub,
                'speed': TONE[lv][0], 'tone': TONE[lv][1], 'btn': 'Escolher o %d' % n,
                'send': 'Quero o estilo %d – %s' % (n, nome)})
json.dump({'pop': pop, 'out': out}, open(B + '/cards/itens.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
tot = sum(os.path.getsize('%s/cards/%02d.jpg' % (B, i)) for i in range(1, n + 1))
print(n, 'cards', tot // 1024, 'KB')

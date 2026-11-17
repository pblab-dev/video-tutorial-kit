"""uso: check_times.py s_ini s_fim saida.json -> tempos de checagem (4 por passo) em props JSON"""
import json, sys, re
tl = json.load(open('content/completo/timeline.json'))
a, b, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
ts = []
for s in range(a, b + 1):
    seg = tl['segments'][s - 1]
    ws = seg['words']
    n = lambda w: re.sub(r'[.,!?:;…]', '', w).lower()
    tb = next(w['s'] for w in ws if n(w['w']) == 'então')
    tc = next(w['s'] for w in ws if re.match(r'^ess[ea]s?$', n(w['w'])))
    A = seg['start']
    ts += [A + 1.2, tb + 0.9, tb + 2.0, tc + 0.7]
json.dump({'tList': [round(x, 2) for x in ts]}, open(out, 'w'))
print(len(ts), ts[:4])

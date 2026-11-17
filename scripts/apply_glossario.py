"""Aplica o glossário aprovado (content/glossario-pronuncia.json) ao campo 'say' de cada segmento de um roteiro.json.
uso: apply_glossario.py roteiro.json"""
import sys, json, re, os

rot = sys.argv[1]
gl = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'content', 'glossario-pronuncia.json'), encoding='utf-8'))['aprovados']
cfg = json.load(open(rot, encoding='utf-8'))
for seg in cfg['segments']:
    say = {}
    for tok in seg['text'].split():
        m = re.match(r'^(.*?)([.,!?:;]*)$', tok)
        base, punct = m.group(1), m.group(2)
        if base in gl:
            say[tok] = gl[base]['voz'] + punct
    seg['say'] = say
json.dump(cfg, open(rot, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok', [(s['id'], s['say']) for s in cfg['segments']])

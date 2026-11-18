"""Narração com voz Gemini por cena, gerando mp3 + linha do tempo (tempo de cada palavra).

Uso:
  tts_gemini.py roteiro.json out.mp3 timeline.json [--only c1,c2] [--voice Algenib]
  tts_gemini.py --sample "texto curto" amostra.mp3 --voice Charon [--style "tom debochado"]

Variáveis de ambiente:
  GEMINI_API_KEY          chave (ou GOOGLE_TTS_KEY)
  GOOGLE_GEMINI_BASE_URL  endereço base do GATEWAY da plataforma. Obrigatória. Nunca usar o endereço
                          do Google direto: a chave só funciona pelo gateway. O script acrescenta
                          /v1beta sozinho se faltar.

roteiro.json: {"voice": "Algenib", "model": "gemini-3.8-flash-tts", "style": "tom debochado, natural",
               "gap": 0.5, "segments": [{"id": "c1", "tag": "GANCHO", "text": "...", "say": {"QI": "quê-i"}}]}
O Gemini não devolve o tempo de cada palavra: ele é estimado pelo tamanho das palavras dentro
da duração real de cada cena (depois de cortar o silêncio das pontas). Serve para a legenda
de uma palavra por vez; confira com scripts/transcribe.py se precisar de precisão.
"""
import sys, os, re, json, base64, wave, time, subprocess, urllib.request, urllib.error

args = sys.argv[1:]

def opt(name, default=None):
    return args[args.index(name) + 1] if name in args else default

KEY = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_TTS_KEY')
BASE = (os.environ.get('GOOGLE_GEMINI_BASE_URL') or '').rstrip('/')
if not KEY or not BASE:
    sys.exit('Faltam GEMINI_API_KEY e/ou GOOGLE_GEMINI_BASE_URL no ambiente.')
if not BASE.endswith('/v1beta'):
    BASE += '/v1beta'
# O gateway fica atrás do Cloudflare, que recusa o User-Agent padrão do Python (erro 1010).
UA = 'minitask-bot/1.0'

TMP = os.environ.get('TTS_TMP', '/tmp/tts_gemini')
os.makedirs(TMP, exist_ok=True)

def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                          '-of', 'csv=p=0', p]).decode().strip())

def synth_wav(text, voice, model, style, path):
    prompt = (f"### DIRETOR\nVoz: {style}. Português do Brasil, ritmo normal de conversa. "
              f"Não leia estas instruções.\n### TEXTO\n{text}")
    body = {'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {'responseModalities': ['AUDIO'],
                                 'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': voice}}}}}
    url = f'{BASE}/models/{model}:generateContent'
    headers = {'Content-Type': 'application/json', 'x-goog-api-key': KEY, 'User-Agent': UA}
    last = None
    for tent in range(3):
        try:
            req = urllib.request.Request(url, json.dumps(body).encode(), headers)
            j = json.load(urllib.request.urlopen(req, timeout=240))
            parts = j['candidates'][0]['content']['parts']
            data = next(p['inlineData']['data'] for p in parts if 'inlineData' in p)
            with wave.open(path, 'wb') as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000)
                w.writeframes(base64.b64decode(data))
            return
        except urllib.error.HTTPError as e:
            last = f'HTTP {e.code} {e.read().decode(errors="replace")[:300]}'
            if e.code in (429, 500, 503):
                time.sleep(4 * (tent + 1)); continue
            break
        except (StopIteration, KeyError, IndexError) as e:
            last = f'resposta sem áudio ({e})'
            time.sleep(2)
    sys.exit(f'Falha ao gerar voz: {last}')

def to_mp3(wav, out):
    """Limpa a cena (sem estalos nas emendas). Se out terminar em .wav, mantém PCM sem perdas.
    - highpass 40 Hz: remove o nível DC da voz (era ele que fazia o "clique" ao emendar com silêncio)
    - corta silêncio das pontas com limiar suave e mantém 60 ms de respiro
    - fade de entrada (15 ms) e de saída (60 ms): a cena começa e termina em zero
    - limitador: evita estouro (clipping) de pico"""
    af = ('highpass=f=40,'
          'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06,'
          'areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06,areverse,'
          'afade=t=in:d=0.015,areverse,afade=t=in:d=0.06,areverse,'
          'alimiter=limit=0.89:level=0')
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', af, '-ar', '44100', '-ac', '1']
    if out.endswith('.wav'):
        cmd += ['-c:a', 'pcm_s16le']
    else:
        cmd += ['-q:a', '2']
    subprocess.run(cmd + [out], check=True)

def sw(t, say):
    if t in say:
        return say[t]
    m = re.match(r'^(.*?)([.,!?:;]*)$', t)
    return say.get(m.group(1), m.group(1)) + m.group(2)

def estimate_words(toks, total):
    """Reparte a duração entre as palavras pelo tamanho (+ pausa extra após pontuação)."""
    w = []
    for t in toks:
        base = max(2, len(re.sub(r'[^\wÀ-ÿ]', '', t))) + 1
        if t[-1:] in '.!?':
            base += 3
        elif t[-1:] in ',;:':
            base += 1.5
        w.append(base)
    k = total / sum(w)
    out, t0 = [], 0.0
    for tok, ww in zip(toks, w):
        d = ww * k
        out.append({'w': tok, 's': round(t0, 3), 'e': round(t0 + d * 0.9, 3)})
        t0 += d
    return out

# ---- modo amostra ----
if '--sample' in args:
    text = opt('--sample'); out = args[args.index('--sample') + 2]
    voice = opt('--voice', 'Charon'); model = opt('--model', 'gemini-3.8-flash-tts')
    style = opt('--style', 'tom natural e claro')
    wav = f'{TMP}/amostra.wav'
    synth_wav(text, voice, model, style, wav)
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    to_mp3(wav, out)
    print('ok', out, round(dur(out), 2), 's')
    sys.exit()

# ---- modo roteiro ----
roteiro, out_mp3, out_json = args[0:3]
cfg = json.load(open(roteiro, encoding='utf-8'))
only = opt('--only').split(',') if '--only' in args else None
voice = opt('--voice', cfg.get('voice', 'Charon'))
model = cfg.get('model', 'gemini-3.8-flash-tts')
style = cfg.get('style', 'tom natural e claro')
gap = cfg.get('gap', 0.5)

parts = []
for seg in cfg['segments']:
    if only and seg['id'] not in only:
        continue
    toks = seg['text'].split()
    say = seg.get('say', {})
    spoken = ' '.join(sw(t, say) for t in toks)
    wav, mp3 = f"{TMP}/{seg['id']}_raw.wav", f"{TMP}/{seg['id']}.wav"
    # às vezes o modelo lê as instruções em voz alta (cena fica longa demais): refaz até 4 vezes
    best = None
    for tent in range(4):
        synth_wav(spoken, voice, model, style, wav)
        to_mp3(wav, mp3)
        d = dur(mp3)
        ritmo = len(spoken) / d
        if best is None or d < best[0]:
            best = (d, f'{TMP}/{seg["id"]}_best.wav')
            subprocess.run(['cp', mp3, best[1]], check=True)
        if ritmo >= 9:
            break
        print(seg['id'], 'ficou lenta/suspeita (', round(ritmo, 1), 'chars/s ), refazendo')
    subprocess.run(['cp', best[1], mp3], check=True)
    d = dur(mp3)
    parts.append((mp3, estimate_words(toks, d), d, seg))
    print(seg['id'], round(d, 2), 's', len(spoken), 'chars')

sil = f'{TMP}/sil.wav'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono',
                '-t', str(gap), '-c:a', 'pcm_s16le', '-ar', '44100', sil], check=True)
t0, tl = 0.0, []
with open(f'{TMP}/list.txt', 'w') as f:
    for p, w, d, seg in parts:
        f.write(f"file '{p}'\nfile '{sil}'\n")
        tl.append({'id': seg['id'], 'tag': seg.get('tag', ''), 'start': round(t0, 3), 'dur': round(d, 3),
                   'words': [{'w': x['w'], 's': round(x['s'] + t0, 3), 'e': round(x['e'] + t0, 3)} for x in w]})
        t0 += d + gap
os.makedirs(os.path.dirname(out_mp3) or '.', exist_ok=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', f'{TMP}/list.txt',
                '-ar', '44100', '-ac', '1', '-q:a', '2', out_mp3], check=True)
json.dump({'duration': dur(out_mp3), 'segments': tl}, open(out_json, 'w'), ensure_ascii=False, indent=1)
print('total', round(dur(out_mp3), 2), 's')

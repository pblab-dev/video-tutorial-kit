"""uso: transcribe.py audio.mp3 -> transcrição (faster-whisper) para conferir pronúncia"""
import sys
from faster_whisper import WhisperModel
m = WhisperModel('small', device='cpu', compute_type='int8')
segs, _ = m.transcribe(sys.argv[1], language='pt')
for s in segs:
    print(f'[{s.start:5.1f}-{s.end:5.1f}] {s.text.strip()}')

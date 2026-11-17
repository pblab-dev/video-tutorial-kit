"""uso: sheet.py dir_frames s_ini  -> work/check/row<S>.jpg (4 frames por passo)"""
import subprocess, sys, os
d, s0 = sys.argv[1], int(sys.argv[2])
n = len([f for f in os.listdir(d) if f.startswith('element-')])
for i in range(n // 4):
    import time
    out = f'work/check/r{s0 + i}_{int(time.time())}.jpg'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '1', '-start_number', str(i * 4), '-t', '4', '-i', f'{d}/element-%02d.jpeg',
                    '-frames:v', '4', '-vf', 'scale=320:-1,tile=4x1', '-update', '1', out], check=True)
    print(out)

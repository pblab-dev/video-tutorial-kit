"""uso: sheets.py dir prefix [per=8] -> gera prefix_0.jpg.. com 4x2 frames por folha (element-NN.png)"""
import subprocess, sys, glob, os
d, pre = sys.argv[1], sys.argv[2]
per = int(sys.argv[3]) if len(sys.argv) > 3 else 8
n = len(glob.glob(d + '/element-*.png'))
outs = []
for k, a in enumerate(range(0, n, per)):
    out = f'{pre}_{k}.jpg'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-start_number', str(a), '-i', d + '/element-%02d.png', '-vf', 'tile=4x2', '-frames:v', '1', '-update', '1', out], check=True)
    outs.append(out)
print(' '.join(outs))

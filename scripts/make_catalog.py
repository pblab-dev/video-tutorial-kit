import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from PIL import Image, ImageDraw, ImageFont
Z = os.environ.get('CATALOG_SRC', '/tmp/catalogo-fonte')  # pagina original (nao distribuida no kit)
OUT = os.path.join(ROOT, 'work', 'styles', 'catalogo')
os.makedirs(OUT, exist_ok=True)
# (nome PT, subtítulo PT, nível: R rápido / M médio / L lento)
PT = [
 ('Recorte de papel', 'artesanal, quentinho', 'R'),
 ('Bonequinhos de traço', 'figuras de tinta em ação', 'R'),
 ('Partículas brilhantes', 'tecnologia cinematográfica', 'L'),
 ('Colagem documental', 'estilo reportagem', 'R'),
 ('Tipografia animada', 'o texto é a imagem', 'R'),
 ('Jornada no mapa', 'rotas e lugares', 'M'),
 ('Argila 3D suave', 'cara de brinquedo', 'M'),
 ('Vidro líquido', 'premium, para apps', 'L'),
 ('Quadro branco', 'desenhado na hora', 'R'),
 ('Dados em movimento', 'gráficos que contam história', 'R'),
 ('Linhas isométricas', 'desenho técnico', 'M'),
 ('Quadrinhos', 'painéis e balões', 'R'),
 ('Terminal e código', 'telas de programador', 'R'),
 ('Vetor plano', '2D limpo de estúdio', 'R'),
 ('TV retrô', 'anos 80/90', 'R'),
 ('Matemática e fórmulas', 'estilo 3Blue1Brown', 'M'),
 ('Risografia', 'pôster de tinta', 'R'),
 ('Grade suíça', 'formas geométricas', 'R'),
 ('Silhuetas', 'teatro de sombras', 'R'),
 ('Pixel art 8 bits', 'jogo retrô', 'R'),
]
NIV = {'R': ('Rápido', (46, 160, 90)), 'M': ('Médio', (230, 160, 30)), 'L': ('Mais lento', (210, 70, 60))}
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
f1 = ImageFont.truetype(FB, 22); f2 = ImageFont.truetype(FR, 16); f3 = ImageFont.truetype(FB, 15); fn = ImageFont.truetype(FB, 20)
CW, CH, PAD, TH = 400, 225, 16, 62
cols, rows = 4, 5
W = cols * (CW + PAD) + PAD
H = rows * (CH + TH + PAD) + PAD + 70
im = Image.new('RGB', (W, H), (247, 244, 236))
d = ImageDraw.Draw(im)
d.text((PAD, 16), 'Estilos de vídeo disponíveis (20)', font=ImageFont.truetype(FB, 30), fill=(30, 30, 40))
for i, (n, s, lv) in enumerate(PT):
    x = PAD + (i % cols) * (CW + PAD); y = 70 + PAD + (i // cols) * (CH + TH + PAD)
    t = Image.open('%s/th/%02d.jpg' % (Z, i + 1)).convert('RGB').resize((CW, CH), Image.LANCZOS)
    im.paste(t, (x, y))
    d.rectangle([x, y, x + CW, y + CH], outline=(200, 195, 180), width=2)
    d.ellipse([x + 8, y + 8, x + 40, y + 40], fill=(20, 20, 30)); d.text((x + 24, y + 24), str(i + 1), font=fn, fill='white', anchor='mm')
    lab, col = NIV[lv]
    tw = d.textlength(lab, font=f3)
    d.rounded_rectangle([x + CW - tw - 22, y + 8, x + CW - 8, y + 34], 8, fill=col); d.text((x + CW - tw - 15, y + 12), lab, font=f3, fill='white')
    d.text((x, y + CH + 6), n, font=f1, fill=(30, 30, 40)); d.text((x, y + CH + 34), s, font=f2, fill=(100, 100, 110))
im.save(OUT + '/estilos_20.jpg', quality=88)
for i in range(20):
    pass
print(im.size)

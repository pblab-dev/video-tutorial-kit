import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from PIL import Image, ImageDraw, ImageFont
B = os.path.join(ROOT, 'work', 'styles')
C = B + '/catalogo'
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
NIV = {'R': ('Rápido', (46, 160, 90)), 'M': ('Médio', (230, 160, 30)), 'L': ('Mais lento', (210, 70, 60))}
# (nome, subtítulo, nível, imagem, crop_vertical)
POP = [
 ('3D Animado', 'mundo de argila / low-poly, colorido', 'M', B + '/estilo_3d.jpg', True),
 ('3D Profissional', 'realista, cara de cinema', 'L', B + '/estilo_pro.jpg', True),
 ('Quadro Branco', 'desenhado na hora', 'R', C + '/09.jpg', False),
 ('Dados em Movimento', 'gráficos que contam história', 'R', C + '/10.jpg', False),
 ('Terminal e Código', 'telas de programador', 'R', C + '/13.jpg', False),
 ('Pixel Art 8 bits', 'jogo retrô', 'R', C + '/20.jpg', False),
]
OUT = [
 ('Recorte de papel', 'artesanal, quentinho', 'R', 1), ('Bonequinhos de traço', 'figuras de tinta em ação', 'R', 2),
 ('Partículas brilhantes', 'tecnologia cinematográfica', 'L', 3), ('Colagem documental', 'estilo reportagem', 'R', 4),
 ('Tipografia animada', 'o texto é a imagem', 'R', 5), ('Jornada no mapa', 'rotas e lugares', 'M', 6),
 ('Argila 3D suave', 'cara de brinquedo', 'M', 7), ('Vidro líquido', 'premium, para apps', 'L', 8),
 ('Linhas isométricas', 'desenho técnico', 'M', 11), ('Quadrinhos', 'painéis e balões', 'R', 12),
 ('Vetor plano', '2D limpo de estúdio', 'R', 14), ('TV retrô', 'anos 80/90', 'R', 15),
 ('Matemática e fórmulas', 'estilo 3Blue1Brown', 'M', 16), ('Risografia', 'pôster de tinta', 'R', 17),
 ('Grade suíça', 'formas geométricas', 'R', 18), ('Silhuetas', 'teatro de sombras', 'R', 19),
]
f1 = ImageFont.truetype(FB, 24); f2 = ImageFont.truetype(FR, 17); f3 = ImageFont.truetype(FB, 15)
fn = ImageFont.truetype(FB, 20); fh = ImageFont.truetype(FB, 34); fs = ImageFont.truetype(FB, 26)
PAD = 20
CW1, CH1 = 400, 225  # populares (3 col)
CW2, CH2 = 300, 169  # demais (4 col)
W = 3 * CW1 + 4 * PAD + 0
# largura comum: 3*400+4*20=1280 ; 4*300+5*20=1300 -> usar 1300
W = 1300
def fit(path, w, h, vert):
    im = Image.open(path).convert('RGB')
    if vert:
        iw, ih = im.size
        ch = int(iw * h / w)
        top = max(0, (ih - ch) // 2 - 20)
        im = im.crop((0, top, iw, top + ch))
    else:
        iw, ih = im.size
        r = w / h
        if iw / ih > r:
            nw = int(ih * r); im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
        else:
            nh = int(iw / r); im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)
H = 90 + 60 + 2 * (CH1 + 80 + PAD) + 70 + 4 * (CH2 + 70 + PAD) + 30
im = Image.new('RGB', (W, H), (247, 244, 236)); d = ImageDraw.Draw(im)
d.text((PAD, 20), 'Escolha o estilo do seu vídeo', font=fh, fill=(30, 30, 40))
y0 = 90
d.rounded_rectangle([PAD, y0, PAD + 210, y0 + 40], 10, fill=(240, 180, 20)); d.text((PAD + 105, y0 + 20), '★  POPULARES', font=fs if False else ImageFont.truetype(FB, 22), fill=(40, 30, 0), anchor='mm')
y0 += 56
x0 = (W - (3 * CW1 + 2 * PAD)) // 2
def badge(x, y, w, lv):
    lab, col = NIV[lv]; tw = d.textlength(lab, font=f3)
    d.rounded_rectangle([x + w - tw - 22, y + 8, x + w - 8, y + 34], 8, fill=col); d.text((x + w - tw - 15, y + 12), lab, font=f3, fill='white')
for i, (n, s, lv, p, v) in enumerate(POP):
    x = x0 + (i % 3) * (CW1 + PAD); y = y0 + (i // 3) * (CH1 + 80 + PAD)
    d.rounded_rectangle([x - 6, y - 6, x + CW1 + 6, y + CH1 + 70], 14, fill=(255, 250, 225), outline=(240, 180, 20), width=3)
    im.paste(fit(p, CW1, CH1, v), (x, y))
    d.ellipse([x + 8, y + 8, x + 42, y + 42], fill=(20, 20, 30)); d.text((x + 25, y + 25), str(i + 1), font=fn, fill='white', anchor='mm')
    d.text((x + CW1 - 38, y + CH1 - 24), '★', font=ImageFont.truetype(FB, 26), fill=(255, 210, 40))
    badge(x, y, CW1, lv)
    d.text((x, y + CH1 + 8), n, font=f1, fill=(30, 30, 40)); d.text((x, y + CH1 + 40), s, font=f2, fill=(100, 100, 110))
y1 = y0 + 2 * (CH1 + 80 + PAD) + 10
d.text((PAD, y1), 'Outros estilos 2D (16)', font=ImageFont.truetype(FB, 28), fill=(30, 30, 40))
y1 += 50
x0 = (W - (4 * CW2 + 3 * PAD)) // 2
for i, (n, s, lv, k) in enumerate(OUT):
    x = x0 + (i % 4) * (CW2 + PAD); y = y1 + (i // 4) * (CH2 + 70 + PAD)
    im.paste(fit('%s/%02d.jpg' % (C, k), CW2, CH2, False), (x, y))
    d.rectangle([x, y, x + CW2, y + CH2], outline=(200, 195, 180), width=2)
    d.ellipse([x + 6, y + 6, x + 38, y + 38], fill=(20, 20, 30)); d.text((x + 22, y + 22), str(i + 7), font=fn, fill='white', anchor='mm')
    badge(x, y, CW2, lv)
    d.text((x, y + CH2 + 6), n, font=ImageFont.truetype(FB, 19), fill=(30, 30, 40)); d.text((x, y + CH2 + 32), s, font=ImageFont.truetype(FR, 15), fill=(100, 100, 110))
im = im.crop((0, 0, W, y1 + 4 * (CH2 + 70 + PAD) + 10))
im.save(B + '/quadro_estilos.jpg', quality=88)
print(im.size)

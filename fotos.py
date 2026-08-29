# -*- coding: utf-8 -*-
"""
Processa as fotos dos procedimentos: recorte 4:3, ajuste de cor e otimizacao.

  python3 fotos.py <id> <arquivo-de-origem> [foco-x] [foco-y] [zoom]

  foco-x / foco-y: 0 a 1, onde fica o assunto na foto (padrao 0.5 0.5)
  zoom: 1.0 = recorte mais aberto possivel; 1.8 = bem mais fechado
  Ex.: python3 fotos.py fox-eyes ~/Downloads/foto.jpg 0.5 0.47 1.4

Saida: assets/fotos/<id>.jpg, 1200x900, tratado e otimizado.
"""
import sys, pathlib
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

try:
    import pillow_heif; pillow_heif.register_heif_opener()
except ImportError:
    pass

LARG, ALT = 1200, 900          # 4:3
RAIZ = pathlib.Path(__file__).parent


def recorta(im, fx=0.5, fy=0.5, zoom=1.0):
    """Recorta em 4:3 centrado no ponto de foco. zoom>1 fecha mais."""
    w, h = im.size
    if w / h > LARG / ALT:                 # sobra largura
        cw, ch = int(h * LARG / ALT), h
    else:                                  # sobra altura
        cw, ch = w, int(w * ALT / LARG)
    if zoom > 1:
        cw, ch = int(cw / zoom), int(ch / zoom)
    x = min(max(0, int(w * fx) - cw // 2), w - cw)
    y = min(max(0, int(h * fy) - ch // 2), h - ch)
    return im.crop((x, y, x + cw, y + ch))


def trata(im):
    """Tratamento leve e uniforme, para as 13 fotos parecerem um conjunto."""
    im = ImageOps.exif_transpose(im).convert("RGB")

    # equilibrio de branco suave (cinza-medio amortecido em 50%)
    r, g, b = [c.resize((1, 1)).getpixel((0, 0)) for c in im.split()]
    alvo = (r + g + b) / 3
    if min(r, g, b) > 8:
        canais = []
        for canal, media in zip(im.split(), (r, g, b)):
            k = 1 + (alvo / media - 1) * 0.5
            canais.append(canal.point(lambda v, k=k: min(255, int(v * k))))
        im = Image.merge("RGB", canais)

    im = ImageOps.autocontrast(im, cutoff=(0.4, 0.2))   # respira sem estourar
    im = ImageEnhance.Color(im).enhance(1.06)           # cor levemente mais viva
    im = ImageEnhance.Contrast(im).enhance(1.04)
    return im


def processa(pid, origem, fx=0.5, fy=0.5, zoom=1.0):
    im = Image.open(origem)
    im = trata(im)
    im = recorta(im, fx, fy, zoom)
    im = im.resize((LARG, ALT), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=48, threshold=3))

    destino = RAIZ / "assets" / "fotos" / ("%s.jpg" % pid)
    destino.parent.mkdir(parents=True, exist_ok=True)
    q = 86
    while q >= 74:
        im.save(destino, "JPEG", quality=q, optimize=True, progressive=True)
        if destino.stat().st_size <= 220 * 1024:
            break
        q -= 4
    return destino, destino.stat().st_size, q


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    pid, origem = sys.argv[1], sys.argv[2]
    fx = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
    fy = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
    zoom = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
    d, tam, q = processa(pid, origem, fx, fy, zoom)
    print("%s -> %d KB (qualidade %d)" % (d.name, round(tam / 1024), q))

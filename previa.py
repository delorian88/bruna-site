# -*- coding: utf-8 -*-
"""Gera /home/claude/previa.html: pagina inteira num arquivo so, sem pixel."""
import pathlib, re, base64, mimetypes

raiz = pathlib.Path(__file__).parent
def dataurl(rel):
    f = raiz / rel
    if not f.exists(): return None
    mt = mimetypes.guess_type(str(f))[0] or 'application/octet-stream'
    return 'data:%s;base64,%s' % (mt, base64.b64encode(f.read_bytes()).decode())

css = (raiz/'assets/styles.css').read_text()
js  = (raiz/'assets/app.js').read_text()
h   = (raiz/'index.html').read_text()
corpo = re.search(r'<body>(.*?)</body>', h, re.S).group(1)

def troca(m):
    u = dataurl(m.group(1))
    return 'src="%s"' % u if u else 'src="" data-sem-foto="1"'
corpo = re.sub(r'src="(assets/[^"]+)"', troca, corpo)
corpo = corpo.replace('<script src="assets/app.js"></script>', '')

(pathlib.Path('/home/claude/previa.html')).write_text('''<title>Bruna Carvalho Beauty</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap">
<style>
%s

.previa{
  position:fixed;top:0;left:0;right:0;z-index:80;background:var(--deep);color:#fff;
  font-family:"Jost",sans-serif;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
  text-align:center;padding:7px 12px;line-height:1.4
}
body{padding-top:30px}
</style>

<div class="previa">Prévia · sem pixel</div>
%s
<script>
%s
</script>
''' % (css, corpo, js.replace("fbq", "fbqDesligado")))
print('previa gerada')

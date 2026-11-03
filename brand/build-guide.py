from pathlib import Path
import base64, io, json, math, zipfile, html
from PIL import Image

root=Path(__file__).resolve().parent
def enc(data): return base64.b64encode(data).decode()
def uri(data,mime): return 'data:'+mime+';base64,'+enc(data)
font=(root/'assets/fonts/PlusJakartaSans[wght].ttf').read_bytes()
fontcss="@font-face{font-family:'Plus Jakarta Sans';src:url("+uri(font,'font/ttf')+") format('truetype');font-weight:200 800;font-display:swap;}"
dark={'bg':'#211332','surface':'#302041','surface-2':'#40294F','border':'#624273','control-border':'#A98AB8','text':'#FFF7FF','text-muted':'#D8C0E4','primary':'#FF4BC5','on-primary':'#300B29','accent':'#70F6EC','on-accent':'#083331','success':'#70F6EC','warning':'#FFD166','danger':'#FF9AB4','on-danger':'#3B0B1F','info':'#70F6EC'}
light={'bg':'#FFF7FF','surface':'#FFFFFF','surface-2':'#F1E4F6','border':'#DBC9E4','control-border':'#84688E','text':'#211332','text-muted':'#665070','primary':'#A30A74','on-primary':'#FFFFFF','accent':'#70F6EC','on-accent':'#083331','success':'#146B61','warning':'#775200','danger':'#B51B43','on-danger':'#FFFFFF','info':'#3254A6'}

def lab(hexcolor):
 rgb=[int(hexcolor[i:i+2],16)/255 for i in (1,3,5)]
 r,g,b=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
 l=(.4122214708*r+.5363325363*g+.0514459929*b)**(1/3)
 m=(.2119034982*r+.6806995451*g+.1073969566*b)**(1/3)
 s=(.0883024619*r+.2817188376*g+.6299787005*b)**(1/3)
 L=.2104542553*l+.793617785*m-.0040720468*s
 a=1.9779984951*l-2.428592205*m+.4505937099*s
 bb=.0259040371*l+.7827717662*m-.808675766*s
 return L,math.hypot(a,bb),math.atan2(bb,a)
def fromlch(L,C,h):
 a=C*math.cos(h);b=C*math.sin(h)
 l=(L+.3963377774*a+.2158037573*b)**3;m=(L-.1055613458*a-.0638541728*b)**3;s=(L-.0894841775*a-1.291485548*b)**3
 vals=[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s]
 vals=[max(0,min(1,12.92*v if v<=.0031308 else 1.055*max(v,0)**(1/2.4)-.055)) for v in vals]
 return '#'+''.join(f'{round(v*255):02X}' for v in vals)
def scale(c):
 L,C,h=lab(c);stops=[50,100,200,300,400,500,600,700,800,900,950]
 return {str(k):fromlch(.97-i*.085,C*min(1,.25+math.sin(i/10*math.pi)*.85),h) for i,k in enumerate(stops)}
scales={k:scale(v) for k,v in {'primary':'#FF4BC5','accent':'#70F6EC','neutral':'#624273'}.items()}
tokens={'version':'2026.1','brand':{'name':'LOS CURSOS DE GRIMI','direction':'Fucsia club','fuchsia':'#FF4BC5','cyan':'#70F6EC','aubergine':'#211332','light':'#FFF7FF'},'themes':{'dark':dark,'light':light},'scales':scales,'typography':{'family':'Plus Jakarta Sans','license':'SIL OFL 1.1','weights':[400,500,600,700,800],'display':{'size':64,'lineHeight':66,'weight':800,'tracking':'-0.03em'},'h1':{'size':44,'lineHeight':46,'weight':800},'h2':{'size':30,'lineHeight':36,'weight':700},'h3':{'size':20,'lineHeight':26,'weight':700},'body':{'size':16,'lineHeight':26,'weight':400},'small':{'size':13,'lineHeight':20,'weight':500}},'spacing':{'1':4,'2':8,'3':12,'4':16,'6':24,'8':32,'12':48,'16':64},'radii':{'control':12,'panel':24,'pill':999},'motion':{'fast':'120ms','base':'200ms','slow':'360ms','ease':'cubic-bezier(.22,1,.36,1)'},'grid':{'columns':12,'gutter':24,'mobileGutter':16,'breakpoints':[640,850,1200]}}
out=root/'tokens';out.mkdir(exist_ok=True)
tj=json.dumps(tokens,ensure_ascii=False,indent=2);(out/'tokens.json').write_text(tj)
base="--font:'Plus Jakarta Sans',sans-serif;--radius-control:12px;--radius-panel:24px;--motion-fast:120ms;--motion-base:200ms;--motion-slow:360ms;--ease:cubic-bezier(.22,1,.36,1);--shadow:0 12px 40px #00000038;--backdrop:#140920B3;"
css=':root,[data-theme="dark"]{'+base+''.join('--'+k+':'+v+';' for k,v in dark.items())+'}\n[data-theme="light"]{'+''.join('--'+k+':'+v+';' for k,v in light.items())+'}\n'
css+=':root{'+''.join('--'+n+'-'+k+':'+v+';' for n,s in scales.items() for k,v in s.items())+'}'
(out/'tokens.css').write_text(css)
preset="// Tailwind CSS 3 preset. Import tokens.css in application.\nmodule.exports = "+json.dumps({'theme':{'extend':{'colors':{k:'var(--'+k+')' for k in dark},'fontFamily':{'sans':['Plus Jakarta Sans','sans-serif']},'borderRadius':{'control':'12px','panel':'24px'}}}},indent=2)+';\n'
(out/'tailwind.preset.cjs').write_text(preset)

logos=root/'assets/logo';logos.mkdir(exist_ok=True)
def logo(fg,bg=None,mono=False):
 return '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180" viewBox="0 0 600 180" role="img" aria-label="Los cursos de Grimi"><defs><style>'+fontcss+'</style></defs>'+('<rect width="600" height="180" rx="16" fill="'+bg+'"/>' if bg else '')+'<text x="30" y="107" fill="'+fg+'" font-family="Plus Jakarta Sans" font-size="92" font-weight="800" letter-spacing="-6">grimmy<tspan fill="'+(fg if mono else '#FF4BC5')+'">.</tspan></text><text x="35" y="145" fill="'+fg+'" font-family="Plus Jakarta Sans" font-size="20" font-weight="600" letter-spacing="1">LOS CURSOS DE GRIMI</text></svg>'
variants=[('principal','#FFF7FF','#211332',False),('claro','#211332','#FFF7FF',False),('monocromo','#211332',None,True)]
logohtml=''
for name,fg,bg,mono in variants:
 raw=logo(fg,None,mono);(logos/(name+'.svg')).write_text(raw)
 logohtml+='<div><div class="logo-preview" style="--logo-bg:'+(bg or '#FFFFFF')+'"><img src="'+uri(raw.encode(),'image/svg+xml')+'" alt="Logo '+name+'"></div><p class="note">'+name.capitalize()+' · fuente embebida · fondo transparente</p></div>'
isotipo='<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="20" fill="#FF4BC5"/><path d="M42 20H29a12 12 0 1 0 0 24h13V31H30m12 10v6c0 7-5 10-13 10" fill="none" stroke="#300B29" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
(logos/'isotipo.svg').write_text(isotipo);(logos/'favicon.svg').write_text(isotipo)
icons={'curso':'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 9 5 3-5 3Z"/>','ruta':'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h8"/>','play':'<path d="m8 4 12 8-12 8Z"/>','calendario':'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h3"/>','consulta':'<path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 4V5a2 2 0 0 1 2-2Z"/><path d="M7 8h10M7 12h6"/>','seguridad':'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>','material':'<path d="M5 3h9l5 5v13H5Z"/><path d="M14 3v6h5M8 13h8M8 17h6"/>','perfil':'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>','membresia':'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>','progreso':'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>','aviso':'<path d="M18 8a6 6 0 0 0-12 0v6l-2 4h16l-2-4ZM10 21h4"/>','ajustes':'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>'}
iconhtml='';ip=root/'assets/icons';ip.mkdir(exist_ok=True)
for name,paths in icons.items():
 svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>'
 (ip/(name+'.svg')).write_text(svg);iconhtml+='<div class="icon-item">'+svg.replace('<svg ','<svg aria-hidden="true" ')+ '<span>'+name+'</span></div>'

def optimized(path,size):
 im=Image.open(root/path);im.thumbnail(size);f=io.BytesIO();im.save(f,format='WEBP',quality=90);return f.getvalue()
mascot=optimized('assets/images/grimmy-welcome-v1.png',(700,1050));sheet=optimized('assets/images/grimmy-3d-v1.png',(1200,800))
(root/'assets/images/grimmy-welcome-web.webp').write_bytes(mascot)
(root/'assets/images/grimmy-expressions-web.webp').write_bytes(sheet)

# Component library shares exact font, semantic tokens and approved mascot.
component_path=root/'components-template.html'
if component_path.exists():
 component=component_path.read_text().replace('__FONT__',fontcss).replace('__TOKENS_CSS__',css).replace('__MASCOT__',uri(mascot,'image/webp'))
 search='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg>'
 component=component.replace('__SEARCH__',search)
 for key,name in [('MATERIAL','material'),('CURSO','curso'),('RUTA','ruta'),('CALENDARIO','calendario'),('PERFIL','perfil')]:
  svg=(ip/(name+'.svg')).read_text().replace('<svg ','<svg aria-hidden="true" ')
  component=component.replace('__'+key+'__',svg)
 component=component.replace('Navigation de démo: ','Navegación de ejemplo: ')
 assert '__FONT__' not in component
 (root/'components.html').write_text(component)

# Editable marketing compositions; source mascot included as embedded asset.
marketing=root/'assets/marketing';marketing.mkdir(exist_ok=True)
for name,w,h in [('post',1080,1080),('story',1080,1920),('og',1200,630)]:
 text='<text x="70" y="95" fill="#300B29" font-family="Plus Jakarta Sans" font-size="28" font-weight="700">LOS CURSOS DE GRIMI</text><text x="70" y="240" fill="#300B29" font-family="Plus Jakarta Sans" font-size="88" font-weight="800"><tspan x="70">Tu idea merece</tspan><tspan x="70" dy="95">salir del chat.</tspan></text>'
 svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+str(w)+'" height="'+str(h)+'" viewBox="0 0 '+str(w)+' '+str(h)+'"><defs><style>'+fontcss+'</style></defs><rect width="100%" height="100%" fill="#FF4BC5"/>'+text+'<image href="'+uri(mascot,'image/webp')+'" x="'+str(w-480)+'" y="'+str(max(280,h-650))+'" width="430" height="620"/></svg>'
 (marketing/(name+'.svg')).write_text(svg)

def lum(c):
 v=[int(c[i:i+2],16)/255 for i in (1,3,5)];v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v];return sum(x*k for x,k in zip(v,[.2126,.7152,.0722]))
contrast='';reports=[]
for mode,t in [('Oscuro',dark),('Claro',light)]:
 for fg,bg in [('text','bg'),('text-muted','surface'),('on-primary','primary'),('on-accent','accent'),('on-danger','danger'),('danger','bg')]:
  a,b=sorted([lum(t[fg]),lum(t[bg])]);ratio=(b+.05)/(a+.05);assert ratio>=4.5,(mode,fg,bg,ratio)
  label=f'{mode} · {fg} / {bg}';contrast+='<div><span>'+label+'</span><strong>'+f'{ratio:.2f}'+':1 · AA</strong></div>';reports.append({'theme':mode,'foreground':fg,'background':bg,'ratio':round(ratio,2),'AA':True})
(out/'contrast-report.json').write_text(json.dumps(reports,indent=2))
swatches=''
for name,color,role in [('Fucsia','#FF4BC5','Acción e impulso'),('Cian','#70F6EC','Acompañar y celebrar'),('Berenjena','#211332','Base y lectura'),('Luz','#FFF7FF','Texto y modo claro')]:
 swatches+='<button class="swatch" data-copy="'+color+'" aria-label="Copiar '+color+'"><span class="sample" style="--swatch:'+color+'"></span><strong>'+name+'</strong><small>'+color+' · '+role+'</small></button>'
def scalehtml(key):return ''.join('<span style="--shade:'+c+'" aria-label="'+k+' '+c+'"></span>' for k,c in scales[key].items())
lessons=''.join('<button class="btn secondary small" data-lesson="'+title+'" aria-pressed="'+str(i==0).lower()+'">'+str(i+1)+'. '+label+'</button>' for i,(label,title) in enumerate([('Idea','Tu idea, bien definida'),('Diseño','Diseñar primera pantalla'),('Construcción','Construir con AI'),('Robustez','Errores y pruebas'),('Seguridad','Cuidar acceso y datos'),('Publicación','Publicar primera app')]))

readme='''# Fucsia club — LOS CURSOS DE GRIMI

Paleta, Plus Jakarta Sans y concepto Grimmy 3D aprobados. Logos, iconos, componentes y copy derivados para revisión. Fuente: Google Fonts, SIL OFL 1.1 incluida. SVG de logos y marketing embeben fuente; según editor puede requerir convertir texto a curvas al preparar imprenta.

Mascotas generadas con image_gen integrada a partir de referencia suministrada por Grimi; no incluyen modelo 3D ni animación. SVG de iconos creados para proyecto. Revisar registro de marca antes de registrar logo; no se realizó búsqueda de exclusividad.

Consumir tokens.css y tokens.json. Preset para Tailwind 3. Descargar y alojar fuente localmente. No confundir estados de ejemplo con backend funcional. Escalas generadas en OKLCH y convertidas a sRGB con recorte; roles semánticos y contrastes se validan por separado.
'''
(root/'assets/README.md').write_text(readme)
zipbuffer=io.BytesIO()
with zipfile.ZipFile(zipbuffer,'w',zipfile.ZIP_DEFLATED) as z:
 for folder in [root/'tokens',logos,ip,marketing,root/'assets/fonts']:
  for p in folder.iterdir():
   if p.is_file():z.write(p,p.relative_to(root))
 for name in ['grimmy-welcome-v1.png','grimmy-3d-v1.png','grimmy-welcome-web.webp','grimmy-expressions-web.webp']:
  p=root/'assets/images'/name;z.write(p,p.relative_to(root))
 z.write(root/'assets/README.md','README.md')
 if (root/'components.html').exists():z.write(root/'components.html','components.html')
kit=zipbuffer.getvalue();(root/'grimmy-brand-kit.zip').write_bytes(kit)
def asset(data,name,mime):return {'name':name,'type':mime,'data':enc(data)}
assets={'kit':asset(kit,'grimmy-brand-kit.zip','application/zip'),'tokens-json':asset(tj.encode(),'tokens.json','application/json'),'tokens-css':asset(css.encode(),'tokens.css','text/css'),'tailwind':asset(preset.encode(),'tailwind.preset.cjs','text/javascript'),'logo':asset((logos/'principal.svg').read_bytes(),'grimmy-logo.svg','image/svg+xml'),'mascot':asset((root/'assets/images/grimmy-welcome-v1.png').read_bytes(),'grimmy-welcome.png','image/png'),'font':asset(font,'PlusJakartaSans.ttf','font/ttf'),'license':asset((root/'assets/fonts/OFL.txt').read_bytes(),'OFL.txt','text/plain')}
template=(root/'guide-template.html').read_text()
replacements={'FONT':fontcss,'TOKENS_CSS':css,'LOGOS':logohtml,'SWATCHES':swatches,'PRIMARY_SCALE':scalehtml('primary'),'ACCENT_SCALE':scalehtml('accent'),'CONTRASTS':contrast,'ICONS':iconhtml,'MASCOT':uri(mascot,'image/webp'),'SHEET':uri(sheet,'image/webp'),'LESSONS':lessons,'ASSETS':json.dumps(assets,separators=(',',':'))}
for k,v in replacements.items():template=template.replace('__'+k+'__',v)
assert '__ASSETS__' not in template
assert len(template.encode())<16*1024*1024,len(template)
(root.parent/'branding.html').write_text(template)
(root/'brand.html').write_text(template.replace('href="brand/components.html"','href="components.html"'))
print('Guide',round(len(template.encode())/1024/1024,2),'MB; kit',round(len(kit)/1024/1024,2),'MB;',len(reports),'contrast pairs AA.')

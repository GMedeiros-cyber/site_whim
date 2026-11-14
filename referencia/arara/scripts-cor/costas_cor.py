# Costas por cor (900x1200), alinhadas à foto de frente da mesma peça (mesma altura do tecido e mesmo centro).
import sys, os, json, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tint import tint
import frente_cor as _f
key_still,CORES=_f.key_still,_f.CORES
def caixa(rgb,a):
    # corpo da peça: do ombro (primeira linha com mais de metade da largura máxima) até a barra; ignora o gancho
    m=(a>0.5)&(rgb.mean(-1)>0.55)
    w=m.sum(1); top=int(np.argmax(w>0.5*w.max())); bot=int(np.where(w>0)[0].max())
    r=int(top+0.7*(bot-top)); xs=np.where(m[r])[0]
    return int(xs.min()),top,int(xs.max()),bot
info={}
for p in sys.argv[1:]:
    fr=np.asarray(Image.open(f'src/{p}-frente.jpg').convert('RGB').resize((900,1200),Image.LANCZOS))
    frgb,fa=key_still(fr); fb=caixa(frgb,fa)
    bk=Image.open(f'costas/{p}-costas.jpg').convert('RGB')
    brgb,ba=key_still(np.asarray(bk)); bb=caixa(brgb,ba)
    s=((fb[3]-fb[1])/(bb[3]-bb[1])+(fb[2]-fb[0])/(bb[2]-bb[0]))/2
    W,H=bk.size; nw,nh=round(W*s),round(H*s)
    rgba=Image.fromarray(np.dstack([brgb*255,ba*255]).clip(0,255).round().astype(np.uint8),'RGBA').resize((nw,nh),Image.LANCZOS)
    cx=(bb[0]+bb[2])/2*s; ty=bb[3]*s
    ox=round((fb[0]+fb[2])/2-cx); oy=round(fb[3]-ty)
    can=Image.new('RGBA',(900,1200),(0,0,0,0)); can.paste(rgba,(ox,oy),rgba)
    arr=np.asarray(can).astype(np.float32)/255; rgb,a=arr[...,:3],arr[...,3]
    for nome,hx in CORES.items():
        o=tint(rgb,a,hx)
        # franja clara entre gola e cabide que o tint deixa branca: pinta com a cor base
        c=np.array([int(hx[i:i+2],16) for i in (1,3,5)])/255
        lum=rgb.mean(-1); fr=(lum>0.5)&(a>0.15)&(np.abs(o-rgb).sum(-1)<0.02)
        if not (c>0.97).all(): o[fr]=c*np.clip(lum[fr]/0.9,0.6,1)[:,None]
        od=f'out/{p}/{nome}'; os.makedirs(od,exist_ok=True)
        Image.fromarray(np.dstack([o*255,a*255]).clip(0,255).round().astype(np.uint8),'RGBA').save(f'{od}/costas.webp',quality=85,method=4)
    info[p]={'escala':round(s,3),'frente':[int(v) for v in fb],'costas':[int(v) for v in caixa(rgb,a)]}
    print(p,info[p])
json.dump(info,open('costas/alinhamento.json','w'),indent=1)

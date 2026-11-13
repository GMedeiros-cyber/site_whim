# Processa um giro no verde: recorta, tira o verde, acha o trecho do giro e gera os quadros por cor.
import subprocess, sys, os, json, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tint import tint
BOX=(91,260,538,720); OW,OH=480,640
CORES={'branco':'#FFFFFF','azul-marinho':'#373857','turquesa':'#31C4EA','mescla':'#B9BFCB','preto':'#1E1F2B'}
def frames(path):
    raw=subprocess.run(['ffmpeg','-loglevel','quiet','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.uint8).reshape(-1,1280,720,3)
def keycolor(fr):
    b=np.concatenate([fr[20:40,20:700].reshape(-1,3),fr[1240:1260,20:700].reshape(-1,3)])
    return np.median(b,0).astype(np.float32)
def crop(fr,k):
    x,y,w,h=BOX; T=8
    c=np.empty((h,w,3),np.float32); c[:]=k
    sx0,sy0,sx1,sy1=max(T,x),max(T,y),min(720-T,x+w),min(1280-T,y+h)
    c[sy0-y:sy1-y,sx0-x:sx1-x]=fr[sy0:sy1,sx0:sx1]
    return np.asarray(Image.fromarray(c.astype(np.uint8)).resize((OW,OH),Image.LANCZOS)).astype(np.float32)
def key(im,k):
    r,g,b=im[...,0],im[...,1],im[...,2]; kgx=k[1]-max(k[0],k[2])
    gx=g-np.maximum(r,b)
    a=1-np.clip((gx-kgx*0.18)/(kgx*0.37),0,1)
    g2=np.minimum(g,np.maximum(r,b))
    rgb=np.stack([r,g2,b],-1)/255
    # gancho prateado: fio fino misturado ao verde; acima do topo do cabide refaz alfa e cor
    lum=rgb.mean(-1); dark=(lum<0.22)&(a>0.6)
    rows=np.where(dark[:int(OH*0.5)].sum(1)>=4)[0]
    if True:
        cut=(min(rows.min(),78) if len(rows) else 78)+2   # primeira linha escura vinda de cima = topo do cabide (o gancho é prateado)
        ah=np.clip((kgx-gx[:cut])/kgx*1.8-0.08,0,1)
        a[:cut]=ah; rgb[:cut]=0.80
    return rgb,a
def width(a):
    band=a[int(OH*.38):int(OH*.62)]>0.5
    cols=np.where(band.mean(0)>0.12)[0]
    return (cols.max()-cols.min()) if len(cols) else 0
def segment(A):
    W=np.convolve([width(a) for a in A],np.ones(3)/3,'same'); fw=np.median(W[-12:])
    last=A[-1]; dl=np.array([np.abs(a-last).mean()*255 for a in A])
    end=len(A)-1
    for i in range(len(A)):
        if (W[i:len(A)-2]>=0.96*fw).all() and (dl[i:]<max(1.5,dl.max()*0.08)).all(): end=i; break
    c=[i for i in range(end) if W[i]<=0.5*fw]; start=c[-1] if c else 0
    return start,end,W
if __name__=='__main__':
    peca,video,outdir=sys.argv[1],sys.argv[2],sys.argv[3]
    seg=tuple(map(int,sys.argv[4].split(','))) if len(sys.argv)>4 else None
    F=frames(video); k=keycolor(F[0])
    if seg is None:
        K=[key(crop(f,k),k) for f in F]; s,e,W=segment([a for _,a in K])
    else:
        s,e=seg; K={i:key(crop(F[i],k),k) for i in range(s,e+1)}
    print(peca,'quadros',len(F),'giro',s,e,'key',k.astype(int))
    for nome,hx in CORES.items():
        od=f'{outdir}/{peca}/{nome}'; os.makedirs(od,exist_ok=True)
        for f in os.listdir(od): os.remove(os.path.join(od,f))
        for n,i in enumerate(range(s,e+1)):
            rgb,a=K[i]; o=tint(rgb,a,hx)
            rgba=np.dstack([o*255,a*255]).clip(0,255).round().astype(np.uint8)
            Image.fromarray(rgba,'RGBA').save(f'{od}/{n+1:03d}.webp',quality=82,method=4)
    # tira de conferência (azul-marinho) em fundo claro
    od=f'{outdir}/{peca}/azul-marinho'; fs=sorted(os.listdir(od)); idx=np.linspace(0,len(fs)-1,9).round().astype(int)
    S=Image.new('RGB',(160*9,214),(245,247,250))
    for c,i in enumerate(idx):
        im=Image.open(f'{od}/{fs[i]}').resize((160,214)); S.paste(im,(c*160,0),im)
    S.save(f'/home/claude/arara/verde/tira_{peca}.png')
    json.dump({'peca':peca,'inicio':s,'fim':e,'quadros':e-s+1},open(f'/home/claude/arara/verde/seg_{peca}.json','w'))

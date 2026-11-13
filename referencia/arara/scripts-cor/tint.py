import numpy as np
from PIL import Image
from scipy import ndimage
def load(png):
    arr=np.asarray(Image.open(png)).astype(np.float32)/255
    return arr[...,:3], arr[...,3]
def fabric_mask(rgb,a):
    lum=rgb.mean(-1)
    H=lum.shape[0]
    dark=(lum<0.22)&(a>0.6)
    rows=np.where(dark[:int(H*0.5)].sum(1)>=4)[0]
    E=H/640   # escala (quadros do vídeo têm 640 de altura)
    cinza=(not len(rows)) or rows.min()>80*E   # quadro em que o Veo deixou o cabide cinza
    cut=int(min(rows.min(),78*E) if len(rows) else 78*E)
    m=np.clip((lum-0.33)/0.12,0,1)*(a>0.02)
    m[:cut]=0
    # cabide: região mais escura que o tecido, ligada à base do gancho (o Veo às vezes deixa o cabide cinza)
    if not cinza: return m
    z0,z1=cut,min(H,cut+int(75*E))
    cand=np.zeros_like(lum,bool); cand[z0:z1]=(lum[z0:z1]<0.74)&(a[z0:z1]>0.5)
    seed=np.zeros_like(cand); seed[z0:z0+int(14*E)]=cand[z0:z0+int(14*E)]
    lab,n=ndimage.label(cand)
    fora=ndimage.binary_dilation(a<0.3,iterations=max(2,int(2*E)))   # pontas do cabide encostam no fundo
    ids=np.unique(np.concatenate([lab[seed],lab[fora&cand]])); ids=ids[ids>0]
    if len(ids):
        hang=ndimage.binary_dilation(np.isin(lab,ids),iterations=1)
        m[hang]=0
    return m
def tint(rgb,a,hexc):
    c=np.array([int(hexc[i:i+2],16) for i in (1,3,5)])/255
    if (c>0.97).all(): return rgb
    lum=rgb.mean(-1)
    fm=fabric_mask(rgb,a)
    ref=np.median(lum[fm>0.9])
    s=(lum/ref)[...,None]                 # 1 = flat fabric, <1 folds, >1 highlights
    cl=(c*[0.2126,0.7152,0.0722]).sum()
    base=c*np.minimum(s,1)                # multiply-like shading
    # darks: add absolute fold contrast so folds survive
    k=0.55*(1-cl)
    base=base+(s-1)*k
    base=np.clip(base+np.maximum(s-1,0)*c*0.5,0,1)
    f=fm[...,None]
    return base*f+rgb*(1-f)

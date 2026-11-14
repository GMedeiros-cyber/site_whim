# Vista ampliada por cor (900x1200) a partir das fotos brancas no verde (896x1200).
import sys, os, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tint import tint
from scipy import ndimage
CORES={'branco':'#FFFFFF','azul-marinho':'#373857','turquesa':'#31C4EA','mescla':'#B9BFCB','preto':'#1E1F2B'}
def key_still(im):
    im=im.astype(np.float32); H=im.shape[0]
    bd=np.concatenate([im[:8].reshape(-1,3),im[-8:].reshape(-1,3),im[:,:8].reshape(-1,3),im[:,-8:].reshape(-1,3)])
    k=np.median(bd,0); kgx=k[1]-max(k[0],k[2])
    r,g,b=im[...,0],im[...,1],im[...,2]; gx=g-np.maximum(r,b)
    a=1-np.clip((gx-kgx*0.18)/(kgx*0.37),0,1)
    rgb=np.stack([r,np.minimum(g,np.maximum(r,b)),b],-1)/255
    return rgb,a
if __name__=='__main__':
  for p in sys.argv[1:]:
      im=np.asarray(Image.open(f'src/{p}-frente.jpg').convert('RGB').resize((900,1200),Image.LANCZOS))
      rgb,a=key_still(im)
      for nome,hx in CORES.items():
          o=tint(rgb,a,hx)
          od=f'out/{p}/{nome}'; os.makedirs(od,exist_ok=True)
          Image.fromarray(np.dstack([o*255,a*255]).clip(0,255).round().astype(np.uint8),'RGBA').save(f'{od}/frente.webp',quality=85,method=4)
      print(p,'ok')

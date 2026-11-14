# Áreas de estampa aproximadas (retângulos normalizados 0..1 no quadro 900x1200) a partir das máscaras do tecido.
import json, numpy as np
from PIL import Image, ImageDraw
from tint import fabric_mask
PS=['camiseta','polo','golav','regata','babylook','moletom']
def medidas(p,lado):
    arr=np.asarray(Image.open(f'out/{p}/branco/{lado}.webp')).astype(np.float32)/255
    rgb,a=arr[...,:3],arr[...,3]
    m=(a>0.5)&(rgb.mean(-1)>0.55)
    w=m.sum(1); bot=int(np.where(w>0)[0].max())
    cx=450
    col=m[:,cx-40:cx+40].sum(1); 
    # gola: primeira linha clara no centro abaixo do cabide (pula o gancho: exige faixa larga)
    gola=int(np.argmax(w>0.35*w.max()))
    # tronco = largura da barra (no moletom os braços caem ao lado do corpo)
    r=int(bot-0.05*(bot-gola)); xs=np.where(m[r])[0]
    if p=='moletom':   # barra canelada: pega o maior trecho contínuo no centro
        lab=np.split(xs,np.where(np.diff(xs)>3)[0]+1); xs=max(lab,key=len)
    tx0,tx1=int(xs.min()),int(xs.max())
    # mangas: o que passa do tronco na altura da manga
    rs=int(gola+(0.30 if p=='moletom' else 0.16)*(bot-gola)); xs2=np.where(m[rs])[0]; sx0,sx1=int(xs2.min()),int(xs2.max())
    return dict(gola=gola,bot=bot,tx0=tx0,tx1=tx1,sx0=sx0,sx1=sx1,rs=rs)
def R(x0,y0,x1,y1): return [round(x0/900,4),round(y0/1200,4),round((x1-x0)/900,4),round((y1-y0)/1200,4)]
out={}
for p in PS:
    o={}
    for lado in ('frente','costas'):
        d=medidas(p,lado); W=d['tx1']-d['tx0']; H=d['bot']-d['gola']; c=(d['tx0']+d['tx1'])/2; g=d['gola']
        if p=='moletom' and lado=='costas': g=0.40*1200-0.08*H   # capuz: áreas começam abaixo da ponta do capuz
        if lado=='frente':
            s=0.24*W; y=g+0.09*H
            o['peito-esquerdo']=R(c+0.12*W,y,c+0.12*W+s,y+s)     # esquerdo de quem veste = direita de quem olha
            o['peito-direito']=R(c-0.12*W-s,y,c-0.12*W,y+s)
            o['centro-peito']=R(c-0.2*W,g+0.10*H,c+0.2*W,g+0.30*H)
            o['frente-inteira']=R(c-0.36*W,g+0.10*H,c+0.36*W,g+(0.52 if p=='moletom' else 0.64)*H)
            if p!='regata' and d['tx0']-d['sx0']>25:
                sw=min(d['tx0']-d['sx0'],d['sx1']-d['tx1']); q=min(0.75*sw,0.15*W)
                ys=d['rs']-q*0.5
                o['manga-direita']=R(d['sx0']+sw*0.5-q/2,ys,d['sx0']+sw*0.5+q/2,ys+q)   # direita de quem veste = esquerda de quem olha
                o['manga-esquerda']=R(d['sx1']-sw*0.5-q/2,ys,d['sx1']-sw*0.5+q/2,ys+q)
        else:
            if p!='moletom': o['nuca']=R(c-0.1*W,g+0.04*H,c+0.1*W,g+0.1*H)
            o['costas-em-cima']=R(c-0.33*W,g+0.08*H,c+0.33*W,g+0.24*H)
            o['costas-inteira']=R(c-0.36*W,g+0.1*H,c+0.36*W,g+0.66*H)
    out[p]=o
json.dump(out,open('costas/areas.json','w'),indent=1)
# conferência visual
T=Image.new('RGB',(6*300,2*400),(200,200,205))
for i,p in enumerate(PS):
    for j,lado in enumerate(('frente','costas')):
        im=Image.open(f'out/{p}/azul-marinho/{lado}.webp').convert('RGBA'); dr=ImageDraw.Draw(im)
        for k,(x,y,w,h) in out[p].items():
            if (lado=='frente')==(k in('peito-esquerdo','peito-direito','centro-peito','frente-inteira','manga-direita','manga-esquerda')):
                col={'peito-esquerdo':'#31C4EA','manga-esquerda':'#31C4EA','nuca':'#31C4EA'}.get(k,'#FFFFFF')
                dr.rectangle([x*900,y*1200,(x+w)*900,(y+h)*1200],outline=col,width=4)
        T.paste(im.resize((300,400)),(i*300,j*400),im.resize((300,400)))
T.save('costas/areas.jpg',quality=80)
print(json.dumps(out['camiseta']))

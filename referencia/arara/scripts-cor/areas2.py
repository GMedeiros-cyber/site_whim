# Áreas de estampa por lado, com ângulo nas mangas (referencia/previa-cor/README-estampa-2.md).
# Formato: areasEstampa[lado][chave] = [x, y, largura, altura] (0..1 no quadro 900x1200) + ângulo em graus nas mangas
# (positivo = horário na tela). Lado de quem veste: "esquerda" aparece à direita de quem olha na frente
# e à esquerda de quem olha nas costas.
import json, numpy as np, math
from PIL import Image, ImageDraw
PS=['camiseta','polo','golav','regata','babylook','moletom']
def mascara(p,lado):
    arr=np.asarray(Image.open(f'out/{p}/branco/{lado}.webp')).astype(np.float32)/255
    return (arr[...,3]>0.5)&(arr[...,:3].mean(-1)>0.55)
def R(x0,y0,x1,y1,ang=None):
    r=[round(x0/900,4),round(y0/1200,4),round((x1-x0)/900,4),round((y1-y0)/1200,4)]
    return r+[round(ang,1)] if ang is not None else r
def manga(m,tx0,tx1,g,H,lado_tela,longa):
    # pixels da manga: fora do tronco, na faixa do ombro até o fim da manga curta (ou o braço do moletom)
    y0,y1=int(g+0.02*H),int(g+(0.55 if longa else 0.30)*H)
    sub=m[y0:y1].copy()
    if lado_tela=='esq': sub[:,tx0-4:]=False
    else: sub[:,:tx1+4]=False
    ys,xs=np.where(sub); ys=ys+y0
    if len(xs)<200: return None
    # borda de fora (mais longe do tronco) por linha -> inclinação do braço
    linhas=sorted(set(ys)); bx=[]; by=[]
    for y in linhas[::3]:
        xx=xs[ys==y]; 
        if len(xx)<6: continue
        bx.append(xx.min() if lado_tela=='esq' else xx.max()); by.append(y)
    a=np.polyfit(by,bx,1)[0]            # dx/dy da borda de fora
    ang=math.degrees(math.atan(abs(a)))*(1 if lado_tela=='esq' else -1)
    ang=max(-40,min(40,ang))
    cx,cy=xs.mean(),ys.mean()
    larg=np.percentile([ (xs[ys==y].max()-xs[ys==y].min()) for y in linhas if (ys==y).sum()>5],60)
    q=min(0.55*larg, 0.14*(tx1-tx0)) if not longa else min(0.6*larg,0.12*(tx1-tx0))
    if longa: cy=g+0.22*H
    return R(cx-q/2,cy-q/2,cx+q/2,cy+q/2,ang)
out={}
for p in PS:
    o={'frente':{},'costas':{}}
    for lado in ('frente','costas'):
        m=mascara(p,lado); w=m.sum(1); bot=int(np.where(w>0)[0].max()); gola=int(np.argmax(w>0.35*w.max()))
        r=int(bot-0.05*(bot-gola)); xs=np.where(m[r])[0]
        if p=='moletom': lab=np.split(xs,np.where(np.diff(xs)>3)[0]+1); xs=max(lab,key=len)
        tx0,tx1=int(xs.min()),int(xs.max()); W=tx1-tx0; H=bot-gola; c=(tx0+tx1)/2; g=gola
        if p=='moletom': g = g+0.07*H if lado=='frente' else 0.40*1200-0.08*H
        if lado=='frente':
            s=0.22*W; y=g+0.12*H               # peito: um pouco mais baixo para não encostar na gola
            o[lado]['peito-esquerdo']=R(c+0.11*W,y,c+0.11*W+s,y+s)
            o[lado]['peito-direito']=R(c-0.11*W-s,y,c-0.11*W,y+s)
            o[lado]['centro-peito']=R(c-0.2*W,g+0.12*H,c+0.2*W,g+0.30*H)
            o[lado]['frente-inteira']=R(c-0.34*W,g+0.12*H,c+0.34*W,g+(0.52 if p=='moletom' else 0.64)*H)
        else:
            if p!='moletom': o[lado]['nuca']=R(c-0.1*W,g+0.05*H,c+0.1*W,g+0.11*H)
            o[lado]['costas-em-cima']=R(c-0.32*W,g+0.10*H,c+0.32*W,g+0.25*H)
            o[lado]['costas-inteira']=R(c-0.34*W,g+0.12*H,c+0.34*W,g+0.66*H)
        if p!='regata':
            e=manga(m,tx0,tx1,gola,bot-gola,'esq',p=='moletom'); d=manga(m,tx0,tx1,gola,bot-gola,'dir',p=='moletom')
            # frente: esquerda de quem veste = direita da tela; costas: esquerda de quem veste = esquerda da tela
            if lado=='frente': o[lado]['manga-direita'],o[lado]['manga-esquerda']=e,d
            else: o[lado]['manga-esquerda'],o[lado]['manga-direita']=e,d
    out[p]=o
json.dump(out,open('costas/areas2.json','w'),indent=1)
T=Image.new('RGB',(6*300,2*400),(200,200,205))
for i,p in enumerate(PS):
    for j,lado in enumerate(('frente','costas')):
        im=Image.open(f'out/{p}/azul-marinho/{lado}.webp').convert('RGBA'); dr=ImageDraw.Draw(im)
        for k,v in out[p][lado].items():
            if v is None: continue
            x,y,w,h=v[:4]; ang=v[4] if len(v)>4 else 0
            cx,cy=(x+w/2)*900,(y+h/2)*1200; hw,hh=w*450,h*600; t=math.radians(ang)
            pts=[(cx+dx*math.cos(t)-dy*math.sin(t),cy+dx*math.sin(t)+dy*math.cos(t)) for dx,dy in((-hw,-hh),(hw,-hh),(hw,hh),(-hw,hh))]
            col='#31C4EA' if 'esquerd' in k or k=='nuca' else '#FFFFFF'
            dr.polygon(pts,outline=col,width=4); dr.line([pts[0],pts[1]],fill='#FFD400',width=6)
        T.paste(im.resize((300,400)),(i*300,j*400),im.resize((300,400)))
T.save('costas/areas2.jpg',quality=80)
print({p:{l:{k:v[4] for k,v in out[p][l].items() if v and len(v)>4} for l in out[p]} for p in PS})

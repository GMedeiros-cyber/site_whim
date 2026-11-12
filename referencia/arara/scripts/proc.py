import subprocess, numpy as np, json, os, sys
from PIL import Image
OLD='/mnt/user-data/uploads/Downloads/whim-arara'; V2=OLD+'/v2'
SRCW,SRCH=896,1200
# source-box placement in the 720x1280 video, per generation type
BOX={'v2':(91,260,538,720)}           # padded 9:16 inputs at scale 0.6
OLDBOX={'regata':(-116,-1,962,1288),'babylook':(-79,0,957,1282)}  # medido no quadro final
PIECES={'camiseta':('v2',V2),'polo':('v2',V2),'golav':('v2',V2),'moletom':('v2',V2),
        'regata':('old',OLD),'babylook':('old',OLD)}
OW,OH=480,640
def frames(path):
    raw=subprocess.run(['ffmpeg','-loglevel','quiet','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.uint8).reshape(-1,1280,720,3)
def norm(fr,box):
    x,y,w,h=box; bg=np.array([249,249,249],np.uint8)
    canvas=np.tile(bg,(h,w,1))
    T=8  # descarta a borda do vídeo (fio escuro)
    sx0,sy0=max(T,x),max(0,y); sx1,sy1=min(720-T,x+w),min(1280,y+h)
    canvas[sy0-y:sy1-y, sx0-x:sx1-x]=fr[sy0:sy1,sx0:sx1]
    im=Image.fromarray(canvas).resize((OW,OH),Image.LANCZOS)
    a=np.asarray(im).astype(float)
    d=np.abs(a-249).max(2); wgt=np.clip((d-6)/8,0,1)[...,None]
    a=a*wgt+255*(1-wgt)       # background -> pure white (for mix-blend-mode: multiply)
    return Image.fromarray(a.round().astype(np.uint8))
def width(im):
    g=np.asarray(im.convert('L')).astype(float)[int(OH*.38):int(OH*.62)]
    cols=np.where((g<246).mean(0)>0.12)[0]
    return (cols.max()-cols.min()) if len(cols) else 0
def cx(im):
    g=np.asarray(im.convert('L')).astype(float)[int(OH*.38):int(OH*.62)]
    m=(g<246); xs=np.where(m)[1]; return xs.mean() if len(xs) else OW/2
only=sys.argv[1:] or list(PIECES)
out=json.load(open('seg.json')) if os.path.exists('seg.json') else {}
for n in only:
    kind,d=PIECES[n]; F=frames(f'{d}/{n}-giro.mp4')
    N=[norm(f,BOX[kind]) for f in F]
    W=np.array([width(i) for i in N],float); Ws=np.convolve(W,np.ones(3)/3,'same')
    fw=np.median(Ws[-12:])
    last=np.asarray(N[-1].convert('L')).astype(float)
    dl=np.array([np.abs(np.asarray(i.convert('L')).astype(float)-last).mean() for i in N])
    end=len(N)-1
    for i in range(len(N)):
        if (Ws[i:len(N)-2]>=0.96*fw).all() and (dl[i:]<max(2.0,dl.max()*0.08)).all(): end=i; break
    c=[i for i in range(end) if Ws[i]<=0.5*fw]; start=c[-1] if c else 0
    # turn direction: garment centre moves left or right during the turn
    mid=(start+end)//2
    out[n]=dict(kind=kind,start=start,end=end,count=end-start+1,final_w=float(fw),
                cx_start=round(cx(N[start]),1),cx_mid=round(cx(N[mid]),1),cx_end=round(cx(N[end]),1))
    od=f'/home/claude/arara/build/out/{n}/frames'; os.makedirs(od,exist_ok=True)
    for f in os.listdir(od): os.remove(os.path.join(od,f))
    for k,i in enumerate(range(start,end+1)):
        N[i].save(f'{od}/{k+1:03d}.webp',quality=82,method=6)
    print(n,out[n])
json.dump(out,open('seg.json','w'),indent=1)

import sys,os,json,numpy as np
from PIL import Image
exec(open('proc.py').read().split('only=sys.argv')[0])
SEG=json.load(open('manual.json'))
only=sys.argv[1:] or list(SEG)
for n in only:
    s,e=SEG[n]; kind,d=PIECES[n]; F=frames(f'{d}/{n}-giro.mp4')
    od=f'/home/claude/arara/build/out/{n}/frames'; os.makedirs(od,exist_ok=True)
    for f in os.listdir(od): os.remove(os.path.join(od,f))
    N=[norm(F[i],OLDBOX.get(n,BOX.get(kind))) for i in range(s,e+1)]
    for k,im in enumerate(N): im.save(f'{od}/{k+1:03d}.webp',quality=82,method=6)
    # strip of 9 evenly spaced frames
    idx=np.linspace(0,len(N)-1,9).round().astype(int)
    S=Image.new('RGB',(160*9,214),'white')
    for c,i in enumerate(idx): S.paste(N[i].resize((160,214)),(c*160,0))
    S.save(f'/home/claude/arara/build/strip_{n}.png'); print(n,len(N))

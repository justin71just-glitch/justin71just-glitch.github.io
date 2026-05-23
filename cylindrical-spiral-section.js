(()=>{
const section = document.querySelector('.section-nine');
const canvas = document.getElementById('gl9');
const gl = canvas.getContext('webgl', {alpha:true, antialias:true});
if (!gl) { section.innerHTML='<div style="padding:40px;color:#111;font-family:sans-serif">当前浏览器不支持 WebGL。</div>'; return; }

const imagePaths = [
    'chemsex-img.png',
    'data-analysis-img.png',
    'report-writing-img.png',
    'product-design-img.png',
    'competition-img.jpg',
    'photography-img.jpg',
    'data-org-img.png',
    'fitrun-img.png',
    'learning-img.png',
];

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

const projects = ['Nocturne','Solaris','Drift','Monolith','Echo','Glyph','Fold','Pulse','Arc','Vessel','Lumen','Index','Atlas','Bloom','Signal','Mirage','Prism','Horizon','Vector','Cinder','Orbit','Trace','Phase','Relay'].map((t,i)=>[t,['Film Identity','Interactive Archive','Campaign System','3D Product Story','Sound Installation','Editorial System','Brand Experience','Generative Visuals','WebGL Showcase','Museum Microsite'][i%10],String(2026-i%12)]);

const TAU=Math.PI*2, CARD_HALF_W=1.82, CARD_HALF_H=.72, CYLINDER_RADIUS=2.95, CARD_ARC=.50, HELIX_TURNS=3.05;
const HELIX_STEP=TAU*HELIX_TURNS/projects.length, HELIX_PITCH=.54, SCROLL_TO_ITEM=1.62;
const clamp01=v=>Math.max(0,Math.min(1,v));
const smoothstep=(a,b,x)=>{const t=clamp01((x-a)/(b-a)); return t*t*(3-2*t)};
const ease=(a,b,n)=>a+(b-a)*n, wrap01=v=>v-Math.floor(v);

const vs = `precision highp float;
attribute vec3 a_pos;attribute vec2 a_uv;
uniform mat4 u_mvp;uniform float u_hover;uniform float u_curve;uniform float u_entry;uniform float u_skew;
varying vec2 v_uv;varying float v_lighting;
void main(){
 vec3 p=a_pos;float nx=p.x/1.82;float ny=p.y/0.72;
 float arc=nx*u_curve;float r=1.0/max(u_curve,0.0001);
 p.x=sin(arc)*r;p.z+=cos(arc)*r-r;
 p.x*=1.0+u_entry*0.18;p.y*=1.0-u_entry*0.055;p.x+=ny*u_skew;p.z+=abs(ny)*u_entry*0.035;
 p.z-=(1.0-ny*ny)*0.018;p.z+=sin((nx+ny)*4.6)*0.010*u_hover;
 v_lighting=1.0-abs(nx)*0.18+(1.0-nx*nx)*0.05;
 gl_Position=u_mvp*vec4(p,1.0);v_uv=a_uv;
}`;

const fs = `precision highp float;
uniform sampler2D u_tex;uniform float u_opacity;uniform float u_hover;
varying vec2 v_uv;varying float v_lighting;
float roundedBox(vec2 uv,float radius){vec2 q=abs(uv-0.5)-vec2(0.5-radius);return 1.0-smoothstep(0.0,0.015,length(max(q,0.0))-radius);}
void main(){
 vec4 tex=texture2D(u_tex,v_uv);float mask=roundedBox(v_uv,0.048);if(mask<0.01||u_opacity<0.01)discard;
 float edge=max(abs(v_uv.x-0.5),abs(v_uv.y-0.5))*2.0;float border=smoothstep(0.956,0.99,edge);
 vec3 color=tex.rgb*v_lighting;color+=border*vec3(0.16)*(0.36+u_hover);color+=u_hover*0.08;
 gl_FragColor=vec4(color,tex.a*mask*u_opacity);
}`;

function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);

function createPlane(segX,segY){const data=[];function v(ix,iy){const u=ix/segX,vv=iy/segY;data.push((u-.5)*CARD_HALF_W*2,(.5-vv)*CARD_HALF_H*2,0,u,vv)}for(let y=0;y<segY;y++){for(let x=0;x<segX;x++){v(x,y);v(x+1,y);v(x,y+1);v(x,y+1);v(x+1,y);v(x+1,y+1)}}return new Float32Array(data)}
const plane=createPlane(42,20), vertexCount=plane.length/5;
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,plane,gl.STATIC_DRAW);
const aPos=gl.getAttribLocation(program,'a_pos'), aUv=gl.getAttribLocation(program,'a_uv');
gl.enableVertexAttribArray(aPos);gl.enableVertexAttribArray(aUv);
gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,20,0);gl.vertexAttribPointer(aUv,2,gl.FLOAT,false,20,12);
const uMvp=gl.getUniformLocation(program,'u_mvp'), uTex=gl.getUniformLocation(program,'u_tex'), uOpacity=gl.getUniformLocation(program,'u_opacity'), uHover=gl.getUniformLocation(program,'u_hover'), uCurve=gl.getUniformLocation(program,'u_curve'), uEntry=gl.getUniformLocation(program,'u_entry'), uSkew=gl.getUniformLocation(program,'u_skew');
gl.uniform1i(uTex,0);

function makeTexture(project,i, img){
    if (img && img.naturalWidth > 0) {
        const c=document.createElement('canvas');c.width=1024;c.height=640;
        const ctx=c.getContext('2d');
        ctx.fillStyle='#050505';
        ctx.fillRect(0,0,1024,640);
        const iw=img.naturalWidth, ih=img.naturalHeight;
        const imgRatio=iw/ih;
        const canvasRatio=1024/640;
        let dw,dh,dx,dy;
        if(imgRatio>canvasRatio){dh=640;dw=dh*imgRatio;dx=(1024-dw)/2;dy=0;}
        else{dw=1024;dh=dw/imgRatio;dx=0;dy=(640-dh)/2;}
        // Slight drift to avoid all cards looking identical when cycling
        const drift=((i%5)-2)*10;
        ctx.drawImage(img,dx+drift,dy,dw,dh);
        // Subtle overlay for visual consistency with original cards
        const grad=ctx.createLinearGradient(0,0,1024,640);
        grad.addColorStop(0,'rgba(255,255,255,.04)');
        grad.addColorStop(.44,'rgba(255,255,255,0)');
        grad.addColorStop(1,'rgba(255,255,255,.08)');
        ctx.fillStyle=grad;ctx.fillRect(0,0,1024,640);
        const tex=gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D,tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        return tex;
    }
    // Original gradient texture
    const c=document.createElement('canvas');c.width=1024;c.height=640;const ctx=c.getContext('2d');
    const [title,type,year] = project;
    const hue=(190+i*29)%360;
    const grad=ctx.createLinearGradient(0,0,1024,640);grad.addColorStop(0,`hsl(${hue},78%,54%)`);grad.addColorStop(.42,`hsl(${(hue+52)%360},62%,18%)`);grad.addColorStop(1,`hsl(${(hue+118)%360},74%,23%)`);ctx.fillStyle=grad;ctx.fillRect(0,0,1024,640);
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=.42;for(let n=0;n<9;n++){const x=120+Math.sin(i*1.7+n)*360+n*70,y=120+Math.cos(i*1.1+n*.8)*220+n*20,r=70+((i+n)%5)*32;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`hsla(${(hue+n*38)%360},95%,72%,.9)`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
    ctx.globalAlpha=.22;ctx.strokeStyle='#fff';ctx.lineWidth=2;for(let n=0;n<4;n++){ctx.beginPath();ctx.ellipse(520+Math.sin(i+n)*90,300+Math.cos(i*.7+n)*70,180-n*26,130-n*18,n*.65,0,Math.PI*2);ctx.stroke()}
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.96;ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(0,0,1024,640);ctx.fillStyle='rgba(255,255,255,.90)';ctx.font='800 72px Inter,system-ui,sans-serif';ctx.fillText(title,64,462);ctx.font='500 24px Inter,system-ui,sans-serif';ctx.fillText(String(i+1).padStart(2,'0')+' / '+type+' / '+year,68,520);
    const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);return tex
}

function mat4(){return new Float32Array(16)}
function identity(o){o.set([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);return o}
function multiply(o,a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let row=0;row<4;row++)r[c*4+row]=a[row]*b[c*4]+a[4+row]*b[c*4+1]+a[8+row]*b[c*4+2]+a[12+row]*b[c*4+3];o.set(r);return o}
function perspective(o,fovy,aspect,near,far){const f=1/Math.tan(fovy/2),nf=1/(near-far);o.set([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);return o}
function translate(o,a,x,y,z){const t=identity(mat4());t[12]=x;t[13]=y;t[14]=z;return multiply(o,a,t)}
function rotateX(o,a,r){const c=Math.cos(r),s=Math.sin(r),m=identity(mat4());m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return multiply(o,a,m)}
function rotateY(o,a,r){const c=Math.cos(r),s=Math.sin(r),m=identity(mat4());m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return multiply(o,a,m)}
function rotateZ(o,a,r){const c=Math.cos(r),s=Math.sin(r),m=identity(mat4());m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return multiply(o,a,m)}
function scale(o,a,x,y,z){const s=identity(mat4());s[0]=x;s[5]=y;s[10]=z;return multiply(o,a,s)}
function lookAt(o,eye,center,up){let zx=eye[0]-center[0],zy=eye[1]-center[1],zz=eye[2]-center[2];let zl=Math.hypot(zx,zy,zz);zx/=zl;zy/=zl;zz/=zl;let xx=up[1]*zz-up[2]*zy,xy=up[2]*zx-up[0]*zz,xz=up[0]*zy-up[1]*zx;let xl=Math.hypot(xx,xy,xz);xx/=xl;xy/=xl;xz/=xl;const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;o.set([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*eye[0]+xy*eye[1]+xz*eye[2]),-(yx*eye[0]+yy*eye[1]+yz*eye[2]),-(zx*eye[0]+zy*eye[1]+zz*eye[2]),1]);return o}

function projectPoint(mvp,x,y,z,w2,h2){
 const w=mvp[3]*x+mvp[7]*y+mvp[11]*z+mvp[15];
 const nx=(mvp[0]*x+mvp[4]*y+mvp[8]*z+mvp[12])/w;
 const ny=(mvp[1]*x+mvp[5]*y+mvp[9]*z+mvp[13])/w;
 return [(nx*.5+.5)*w2, (-ny*.5+.5)*h2, w];
}

let items = [];
let w2 = section.offsetWidth, h2 = section.offsetHeight;
let targetSpin=0, spin=0, velocity=0, active=-1;
let mouseX=w2/2, mouseY=h2/2, smoothX=mouseX, smoothY=mouseY;
let dragging=false, lastX=mouseX;

function initItems(images) {
    // Use all loaded images, cycling through the 9 images for all 24 cards
    items = projects.map((p,i)=>{
        const img = images[i % images.length] || null;
        return {project:p,texture:makeTexture(p,i, img),x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:1,hover:0,curve:CARD_ARC,entry:0,skew:0,screenRadius:0};
    });
    console.log('Items created, first image used:', !!images[0], 'image count:', images.filter(Boolean).length);
}

function cylinderPoint(index,offset){
 const travel=index+offset*SCROLL_TO_ITEM;
 const wrapped=wrap01(travel/items.length)*items.length;
 const centered=wrapped-items.length/2;
 const angle=centered*HELIX_STEP+Math.PI*.5;
 return {centered, angle, x:Math.cos(angle)*CYLINDER_RADIUS, z:Math.sin(angle)*CYLINDER_RADIUS, y:centered*HELIX_PITCH+Math.sin(angle*.65)*.22};
}

section.addEventListener('wheel', e => { if (window.lsMaskOpen) { targetSpin += e.deltaY * 0.0018; } }, {passive: true});
section.addEventListener('pointerdown', e => { if (window.lsMaskOpen) { dragging=true; lastX=e.clientX; } });
section.addEventListener('pointerup', ()=>dragging=false);
section.addEventListener('pointercancel', ()=>dragging=false);
section.addEventListener('pointermove', e => { const rect=section.getBoundingClientRect(); mouseX=e.clientX-rect.left; mouseY=e.clientY-rect.top; if(dragging && window.lsMaskOpen){ velocity+=(e.clientX-lastX)*.0085; lastX=e.clientX; } });

function resize(){
 const dpr=Math.min(devicePixelRatio||1, 2);
 w2 = section.offsetWidth; h2 = section.offsetHeight;
 canvas.width = Math.floor(w2 * dpr);
 canvas.height = Math.floor(h2 * dpr);
 canvas.style.width = w2 + 'px';
 canvas.style.height = h2 + 'px';
 gl.viewport(0,0,canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);

function buildModel(x,y,z,rx,ry,rz,s){
 return scale(mat4(), rotateZ(mat4(), rotateX(mat4(), rotateY(mat4(), translate(mat4(), identity(mat4()), x,y,z), ry), rx), rz), s,s,s);
}

let isActive = false;
const observer = new IntersectionObserver(entries => {
 isActive = entries[0].isIntersecting;
}, {threshold: 0.1});
observer.observe(section);

let renderedOnce = false;
function render(){
 requestAnimationFrame(render);
 if (items.length === 0) return;
 if (!renderedOnce) { console.log('First render, items:', items.length); renderedOnce = true; }
 velocity*=.91; targetSpin+=velocity*.018; spin=ease(spin, targetSpin, .07);
 smoothX=ease(smoothX, mouseX, .16); smoothY=ease(smoothY, mouseY, .16);
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

 const aspect = canvas.width / canvas.height;
 const proj = perspective(mat4(), Math.PI/4.58, aspect, .1, 90);
 const mx = smoothX/w2 - .5, my = smoothY/h2 - .5;
 const camX = .88 + mx*.56, camY = .68 - my*.38, camZ = 11.8;
 const view = lookAt(mat4(), [camX,camY,camZ], [0,.08,0], [0,1,0]);
 const vp = multiply(mat4(), proj, view);

 active=-1; let best=999999;
 items.forEach((item,i)=>{
  const cp=cylinderPoint(i, spin), centered=cp.centered, angle=cp.angle;
  const frontness=(Math.sin(angle)+1)*.5, centerBoost=Math.max(0,1-Math.abs(centered)/(items.length*.52));
  const bottomPose=smoothstep(.12,2.15,-cp.y), topPose=smoothstep(.12,2.15,cp.y);
  const edgePose=Math.max(bottomPose,topPose), edgeDir=topPose>bottomPose?1:-1;
  const notYetFront=smoothstep(.18,.76,1-frontness), targetEntry=edgePose*(.28+notYetFront*.72);
  const skewSide=Math.cos(angle)>=0?-1:1, targetSkew=skewSide*edgeDir*.38*targetEntry;
  const tx=cp.x, ty=cp.y+edgeDir*targetEntry*.62, tz=cp.z-targetEntry*.50;
  const cylinderRy=Math.PI*.5-angle, baseRx=Math.cos(angle)*.075-.02+my*.025;
  const baseRz=Math.sin(angle)*.055+Math.sin(i*1.9)*.025, targetRx=baseRx-edgeDir*targetEntry*.32;
  const targetRz=baseRz+targetSkew*.42, ts=(.62+centerBoost*.16+frontness*.16)*(1-targetEntry*.05);

  const wrapJump = Math.hypot(item.x-tx, item.y-ty, item.z-tz) > 4.2;
  if (wrapJump){ item.x=tx; item.y=ty; item.z=tz; item.ry=cylinderRy; item.rx=targetRx; item.rz=targetRz; item.scale=ts; item.entry=targetEntry; item.skew=targetSkew; }

  item.x=ease(item.x,tx,.095); item.y=ease(item.y,ty,.095); item.z=ease(item.z,tz,.095);
  item.ry=ease(item.ry,cylinderRy,.11); item.rx=ease(item.rx,targetRx,.10); item.rz=ease(item.rz,targetRz,.10);
  item.scale=ease(item.scale,ts,.095); item.curve=ease(item.curve,CARD_ARC+item.hover*.035,.1);
  item.entry=ease(item.entry,targetEntry,.12); item.skew=ease(item.skew,targetSkew,.12);

  const mvp=multiply(mat4(), vp, buildModel(item.x,item.y,item.z,item.rx,item.ry,item.rz,item.scale));
  const p=projectPoint(mvp,0,0,0,w2,h2);
  item.screenRadius=108+item.scale*16;
  const dx=p[0]-mouseX, dy=p[1]-mouseY, dist=Math.hypot(dx,dy);
  if(dist<item.screenRadius && dist<best){best=dist; active=i;}
 });

 [...items].sort((a,b)=>a.z-b.z).forEach(item=>{
  const i=items.indexOf(item), isActive=i===active;
  item.hover=ease(item.hover, isActive?1:0, .12);
  const verticalFade=Math.max(.18,1-Math.abs(item.y)/8.6), entryOpacity=1-item.entry*.32;
  const dim=(active===-1||isActive?1:.5)*verticalFade*entryOpacity;
  const hoverScale=1+item.hover*.09;
  const mvp=multiply(mat4(), vp, buildModel(item.x,item.y,item.z,item.rx,item.ry,item.rz,item.scale*hoverScale));
  gl.uniformMatrix4fv(uMvp,false,mvp); gl.uniform1f(uOpacity,dim); gl.uniform1f(uHover,item.hover);
  gl.uniform1f(uCurve,item.curve); gl.uniform1f(uEntry,item.entry); gl.uniform1f(uSkew,item.skew);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,item.texture);
  gl.drawArrays(gl.TRIANGLES,0,vertexCount);
 });
}

// Load images first, then start render loop
Promise.all(imagePaths.map(loadImage)).then(images => {
    console.log('Images loaded:', images.map((img, i) => ({ index: i, ok: !!img, src: imagePaths[i] })));
    initItems(images);
    console.log('Items initialized, total:', items.length);
    requestAnimationFrame(render);
});
})();

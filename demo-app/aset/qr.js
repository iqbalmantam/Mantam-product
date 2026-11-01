/* Generator QR Code (byte mode, koreksi M, versi 1-10) tanpa pustaka luar */
const QR=(()=>{
const EXP=new Array(512),LOG=new Array(256);{let x=1;for(let i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11D}for(let i=255;i<512;i++)EXP[i]=EXP[i-255]}
const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
const gen=n=>{let g=[1];for(let i=0;i<n;i++){const h=new Array(g.length+1).fill(0);g.forEach((c,j)=>{h[j]^=c;h[j+1]^=mul(c,EXP[i])});g=h}return g};
const rs=(data,n)=>{const g=gen(n),r=new Array(n).fill(0);data.forEach(d=>{const f=d^r.shift();r.push(0);if(f)g.slice(1).forEach((c,i)=>r[i]^=mul(c,f))});return r};
/* [total data, ec per block, blok grup1, data grup1, blok grup2, data grup2] untuk level M */
const T={1:[16,10,1,16,0,0],2:[28,16,1,28,0,0],3:[44,26,1,44,0,0],4:[64,18,2,32,0,0],5:[86,24,2,43,0,0],6:[108,16,4,27,0,0],7:[124,18,4,31,0,0],8:[154,22,2,38,2,39],9:[182,22,3,36,2,37],10:[216,26,4,43,1,44]};
const AL={1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50]};
const bch=(v,g,len)=>{let d=v<<len;const gl=Math.floor(Math.log2(g));for(let i=Math.floor(Math.log2(d));i>=gl;i--)if(d>>i&1)d^=g<<(i-gl);return d};
function utf8(s){return Array.from(new TextEncoder().encode(s))}
function build(text){
  const bytes=utf8(text);let ver=0;for(let v=1;v<=10;v++)if(bytes.length+2+(v>9?1:0)<=T[v][0]){ver=v;break}
  if(!ver)throw new Error('Teks terlalu panjang untuk QR');
  const [dc,ecl,b1,d1,b2,d2]=T[ver],bits=[],push=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push(v>>i&1)};
  push(4,4);push(bytes.length,ver>9?16:8);bytes.forEach(b=>push(b,8));push(0,Math.min(4,dc*8-bits.length));while(bits.length%8)bits.push(0);
  const cw=[];for(let i=0;i<bits.length;i+=8)cw.push(parseInt(bits.slice(i,i+8).join(''),2));for(let p=0;cw.length<dc;p++)cw.push(p%2?17:236);
  const blocks=[];let o=0;for(let i=0;i<b1;i++){blocks.push(cw.slice(o,o+d1));o+=d1}for(let i=0;i<b2;i++){blocks.push(cw.slice(o,o+d2));o+=d2}
  const ecs=blocks.map(b=>rs(b,ecl)),out=[],mx=Math.max(d1,d2||0);
  for(let i=0;i<mx;i++)blocks.forEach(b=>{if(i<b.length)out.push(b[i])});for(let i=0;i<ecl;i++)ecs.forEach(e=>out.push(e[i]));
  const N=17+4*ver,M=Array.from({length:N},()=>new Array(N).fill(null)),F=Array.from({length:N},()=>new Array(N).fill(false));
  const set=(r,c,v)=>{if(r>=0&&c>=0&&r<N&&c<N){M[r][c]=v;F[r][c]=true}};
  const finder=(r,c)=>{for(let i=-1;i<=7;i++)for(let j=-1;j<=7;j++){const d=i>=0&&i<=6&&j>=0&&j<=6&&(i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4));set(r+i,c+j,d)}};
  finder(0,0);finder(0,N-7);finder(N-7,0);
  for(let i=8;i<N-8;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
  const al=AL[ver];al.forEach(r=>al.forEach(c=>{if((r===6&&c===6)||(r===6&&c===al[al.length-1])||(r===al[al.length-1]&&c===6))return;for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)set(r+i,c+j,Math.max(Math.abs(i),Math.abs(j))!==1)}));
  set(N-8,8,true);
  for(let i=0;i<9;i++){if(!F[8][i])set(8,i,false);if(!F[i][8])set(i,8,false)}for(let i=0;i<8;i++){set(8,N-1-i,false);set(N-1-i,8,false)}
  if(ver>=7){const v=(ver<<12)|bch(ver,0x1F25,12);for(let i=0;i<18;i++){const b=!!(v>>i&1),a=Math.floor(i/3),c=N-11+i%3;set(a,c,b);set(c,a,b)}}
  const data=[];out.forEach(b=>{for(let i=7;i>=0;i--)data.push(b>>i&1)});
  const place=()=>{let k=0,up=true;for(let c=N-1;c>0;c-=2){if(c===6)c--;for(let i=0;i<N;i++){const r=up?N-1-i:i;for(let j=0;j<2;j++){const cc=c-j;if(!F[r][cc]){M[r][cc]=k<data.length?!!data[k]:false;k++}}}up=!up}};place();
  const masks=[(r,c)=>(r+c)%2===0,(r,c)=>r%2===0,(r,c)=>c%3===0,(r,c)=>(r+c)%3===0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,(r,c)=>(r*c)%2+(r*c)%3===0,(r,c)=>((r*c)%2+(r*c)%3)%2===0,(r,c)=>((r+c)%2+(r*c)%3)%2===0];
  const fmtBits=m=>{const v=((0<<3)|m);return ((v<<10)|bch(v,0x537,10))^0x5412};
  const withMask=m=>{const A=M.map(r=>r.slice());for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!F[r][c]&&masks[m](r,c))A[r][c]=!A[r][c];
    const f=fmtBits(m),g=i=>!!(f>>i&1);for(let i=0;i<=5;i++)A[i][8]=g(i);A[7][8]=g(6);A[8][8]=g(7);A[8][7]=g(8);for(let i=9;i<15;i++)A[8][14-i]=g(i);
    for(let i=0;i<8;i++)A[8][N-1-i]=g(i);for(let i=8;i<15;i++)A[N-15+i][8]=g(i);A[N-8][8]=true;return A};
  const pen=A=>{let p=0;for(let k=0;k<2;k++){for(let i=0;i<N;i++){let run=1;for(let j=1;j<N;j++){const a=k?A[j][i]:A[i][j],b=k?A[j-1][i]:A[i][j-1];if(a===b){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}}}
    for(let r=0;r<N-1;r++)for(let c=0;c<N-1;c++){const v=A[r][c];if(v===A[r][c+1]&&v===A[r+1][c]&&v===A[r+1][c+1])p+=3}
    const pat=[1,0,1,1,1,0,1,0,0,0,0],pr=pat.slice().reverse();for(let k=0;k<2;k++)for(let i=0;i<N;i++)for(let j=0;j<=N-11;j++){let a=true,b=true;for(let t=0;t<11;t++){const v=(k?A[j+t][i]:A[i][j+t])?1:0;if(v!==pat[t])a=false;if(v!==pr[t])b=false}if(a||b)p+=40}
    let d=0;A.forEach(r=>r.forEach(v=>{if(v)d++}));p+=Math.floor(Math.abs(d*100/(N*N)-50)/5)*10;return p};
  let best=null,bp=1e9;for(let m=0;m<8;m++){const A=withMask(m),p=pen(A);if(p<bp){bp=p;best=A}}return best}
function svg(text,px=120,quiet=2){const A=build(text),N=A.length,S=N+quiet*2;let d='';A.forEach((r,y)=>r.forEach((v,x)=>{if(v)d+=`M${x+quiet} ${y+quiet}h1v1h-1z`}));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${px}" height="${px}" shape-rendering="crispEdges"><rect width="${S}" height="${S}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`}
return {build,svg}})();

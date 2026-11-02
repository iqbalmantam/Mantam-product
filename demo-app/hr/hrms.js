/* Aplikasi bisnis · modul HRMS: mesin payroll + tampilan */
const HR={d:null,P:null,
 init(){
  const saved=Store.get('hr',null),ver=3;
  if(saved&&saved.ver===ver&&saved.edition===CONFIG.edition){this.d=saved.d;this.P=saved.P;return}
  this.reset();
 },
 reset(){
  const S=JSON.parse(JSON.stringify(HR_SEED));
  if(DEMO()){S.emps=S.emps.slice(0,12);const ids=new Set(S.emps.map(e=>e.id));S.cuti=S.cuti.filter(c=>ids.has(c.id)).slice(0,10);S.latih=S.latih.filter(c=>ids.has(c.id)).slice(0,8);S.low=S.low.slice(0,3);S.cand=S.cand.filter(c=>S.low.some(l=>l.kode===c.kode)).slice(0,14)}
  this.d={emps:S.emps,cuti:S.cuti,latih:S.latih,low:S.low,cand:S.cand,depts:S.depts};
  this.P={company:'PT Nusantara Karya Mandiri (contoh)',bulan:10,tahun:2026,hariKerja:22,jam:173,mult:1.75,transport:25000,makan:30000,rep:'2026-10-31',jatah:12,bjPct:.05,bjMax:6e6,
   bpjs:S.bpjs,ptkp:S.ptkp,bracket:S.bracket,ter:S.ter,grade:S.grade,rating:S.rating,kpiN:S.kpiN,kpiW:S.kpiW,box:S.box,hol:S.hol,
   thrH:85,thrM:70,potH:4,potM:3,jamMasuk:'08:00',jamPulang:'17:00',telat:10};
  this.seedAtt();
  this.save();
 },
 blank(){this.d.att={};this.d.emps=[];this.d.cuti=[];this.d.latih=[];this.d.low=[];this.d.cand=[];this.save()},
 save(){Store.set('hr',{ver:3,edition:CONFIG.edition,d:this.d,P:this.P})},
 tmin(t){const [a,b]=String(t||'0:0').split(':');return (+a||0)*60+(+b||0)},
 mm(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')},
 isWork(ds){const d=dt(ds),w=d.getDay();return w>0&&w<6&&!this.P.hol.includes(ds)},
 leaveOn(id,ds){return this.d.cuti.some(c=>c.id===id&&c.status==='Disetujui'&&c.mulai<=ds&&c.selesai>=ds)},
 seedAtt(){const P=this.P,att=this.d.att={},days=[];for(let d=new Date(P.tahun,P.bulan-1,1);d.getMonth()===P.bulan-1;d.setDate(d.getDate()+1)){const s=iso(d);if(this.isWork(s)&&s<=P.rep)days.push(s)}
  this.d.emps.forEach((e,ei)=>{if(e.st==='Resign'||!days.length)return;const a=e.abs||{},rest=[['S',a.sakit||0],['I',a.izin||0],['C',a.cuti||0],['A',a.alpa||0]],slots=days.map((_,i)=>i),pick=[];let k=(ei*7+3)%days.length;rest.forEach(([s,n])=>{for(let j=0;j<n;j++){if(pick.length>=days.length)return;while(pick.some(x=>x[0]===k))k=(k+1)%days.length;pick.push([k,s]);k=(k+5)%days.length}});
   let lem=a.lembur||0;days.forEach((ds,i)=>{const p=pick.find(x=>x[0]===i);(att[ds]=att[ds]||{})[e.id]=p?{s:p[1]}:(()=>{let ex=0;if(lem>0){ex=Math.min(lem,2);lem-=ex}const late=(ei+i)%9===0?'08:'+String(12+(i%5)*3):'07:'+String(50+(i%9));return {s:'H',in:late,out:this.mm(this.tmin(P.jamPulang)+ex*60+(i%4))}})()})})},
 recap(bln,thn){const P=this.P,r={};this.d.emps.forEach(e=>r[e.id]={hadir:0,sakit:0,izin:0,cuti:0,alpa:0,telat:0,lembur:0,kosong:0});const keys=Object.keys(this.d.att||{}).filter(k=>+k.slice(0,4)===thn&&+k.slice(5,7)===bln);
  keys.forEach(ds=>this.d.emps.forEach(e=>{const x=this.d.att[ds][e.id];if(!x||!r[e.id])return;const R=r[e.id];if(x.s==='H'){R.hadir++;if(x.in&&this.tmin(x.in)>this.tmin(P.jamMasuk)+P.telat)R.telat++;if(x.out){const ex=Math.max(0,this.tmin(x.out)-this.tmin(P.jamPulang));R.lembur+=Math.floor(ex/30)/2}}else if(x.s==='S')R.sakit++;else if(x.s==='I')R.izin++;else if(x.s==='C')R.cuti++;else if(x.s==='A')R.alpa++}));
  this.d.emps.forEach(e=>{if(e.st==='Resign')return;let n=0;for(let d=new Date(thn,bln-1,1);d.getMonth()===bln-1;d.setDate(d.getDate()+1)){const s=iso(d);if(this.isWork(s)&&s<=P.rep&&!(this.d.att[s]&&this.d.att[s][e.id])){if(this.leaveOn&&this.leaveOn(e.id,s))r[e.id].cuti++;else n++}}r[e.id].kosong=n});return r},
 workdays(y,m){const h=new Set(this.P.hol);let n=0;for(let d=new Date(y,m-1,1);d.getMonth()===m-1;d.setDate(d.getDate()+1)){const w=d.getDay();if(w&&w<6&&!h.has(iso(d)))n++}return n},
 key(){return this.P.tahun+'-'+this.P.bulan},
 setPeriod(bulan,tahun){const P=this.P,old=this.key();P.hk=P.hk||{};P.hk[old]=P.hariKerja;
  this.d.emps.forEach(e=>{e.hist=e.hist||{};e.hist[old]=JSON.parse(JSON.stringify(e.abs||{}))});
  P.bulan=bulan;P.tahun=tahun;const k=this.key();P.rep=iso(new Date(tahun,bulan,0));P.hariKerja=Math.max(1,P.hk[k]||this.workdays(tahun,bulan)||22);
  this.d.emps.forEach(e=>{e.abs=(e.hist&&e.hist[k])?JSON.parse(JSON.stringify(e.hist[k])):{hadir:e.st==='Resign'?0:P.hariKerja,sakit:0,izin:0,cuti:0,alpa:0,lembur:0,bonus:0,lain:0}});this.save()},
 /* ---------- mesin perhitungan ---------- */
 terRate(cat,n){let r=0;for(const [lo,t] of this.P.ter[cat]){if(n>=lo)r=t;else break}return r},
 calc(e,per){
  const P=this.P,ab=e.abs||{},act=e.st==='Resign'?0:1,[bj,bk,bkk,bkm,bks]=P.bpjs;
  const F=act*e.gaji,G=act*e.tun,base=F+G,H=act*(ab.hadir||0)*P.transport,I=act*(ab.hadir||0)*P.makan;
  const J=Math.round(act*(ab.lembur||0)*base/P.jam*P.mult),K=act*(ab.bonus||0),L=Math.round(act*(ab.alpa||0)*F/P.hariKerja);
  const cap=(r)=>Math.min(base,r[3]);
  const M=Math.round(cap(bkk)*bkk[1]+cap(bkm)*bkm[1]+cap(bks)*bks[1]);
  const N=F+G+H+I+J+K-L+M,pt=P.ptkp.find(x=>x[0]===e.ptkp)||P.ptkp[0],cat=pt[2];
  const rate=this.terRate(cat,N),X=Math.round(N*rate);
  const Pj=Math.round(cap(bj)*bj[2]),Q=Math.round(cap(bk)*bk[2]),R=Math.round(cap(bks)*bks[2]);
  let O=X,AA=0,Z=0;
  if(P.bulan>=12){const Y=N*12-Math.min(N*12*P.bjPct,P.bjMax)-(Pj+Q)*12;Z=Math.max(0,Math.floor((Y-pt[1])/1000)*1000);
    P.bracket.forEach(([lo],i)=>{const df=P.bracket[i][1]-(i?P.bracket[i-1][1]:0);if(Z>lo)AA+=(Z-lo)*df});AA=Math.round(AA);O=Math.max(0,AA-X*11)}
  const S=act*(ab.lain||0),pend=F+G+H+I+J+K,pot=L+O+Pj+Q+R+S,T=pend-pot;
  const U=M+Math.round(cap(bj)*bj[1])+Math.round(cap(bk)*bk[1]),V=pend-L+U;
  return {F,G,H,I,J,K,L,M,N,O,Pj,Q,R,S,T,U,V,pend,pot,cat,rate,act};
 },
 pay(){return this.d.emps.map(e=>({e,c:this.calc(e,this.P)}))},
 active(){return this.d.emps.filter(e=>e.st!=='Resign')},
 netDays(a,b){let n=0;const h=new Set(this.P.hol);for(let d=dt(a);d<=dt(b);d.setDate(d.getDate()+1)){const w=d.getDay();if(w&&w<6&&!h.has(iso(d)))n++}return n},
 masa(e){const end=e.keluar?Math.min(dt(e.keluar),dt(this.P.rep)):dt(this.P.rep);return years(dt(e.masuk),end)},
 usia(e){return Math.floor(years(dt(e.lahir),dt(this.P.rep)))},
 saldo(e){if(this._sc&&this._sc.has(e.id))return this._sc.get(e.id);const r=this.saldo0(e);if(this._sc)this._sc.set(e.id,r);return r},
 saldo0(e){const P=this.P,hak=e.st==='Resign'||this.masa(e)<1?0:P.jatah;let pakai=0,tunggu=0;
  this.d.cuti.forEach(c=>{if(c.id!==e.id||c.jenis!=='Tahunan'||dt(c.mulai).getFullYear()!==P.tahun)return;const n=this.netDays(c.mulai,c.selesai);if(c.status==='Disetujui')pakai+=n;if(c.status==='Menunggu')tunggu+=n});
  return {hak,pakai,tunggu,sisa:hak-pakai}},
 score(e){if(!e.kpi)return null;const w=this.P.kpiW;return Math.round(e.kpi.reduce((s,v,i)=>s+v*w[i],0)/w.reduce((a,b)=>a+b,0)*10)/10},
 rating(s){let r=this.P.rating[0];this.P.rating.forEach(x=>{if(s>=x[0])r=x});return r},
 boxOf(e){const s=this.score(e);if(s==null||e.pot==null)return null;const P=this.P,pl=s>=P.thrH?3:s>=P.thrM?2:1,po=e.pot>=P.potH?3:e.pot>=P.potM?2:1;return (pl-1)*3+po}
};
const ST_C={Tetap:'ok',Kontrak:'info',Probation:'warn',Magang:'warn',Resign:'bad'};
const DEPTS=()=>HR.d.depts;
function empOptions(sel){return HR.d.emps.map(e=>`<option value="${e.id}" ${e.id===sel?'selected':''}>${e.id} · ${esc(e.nama)}</option>`).join('')}

/* V dipindah ke core.js */ /* tampilan */
V.dashboard=el=>{
  const pay=HR.pay(),act=HR.active(),P=HR.P,sum=k=>pay.reduce((s,x)=>s+x.c[k],0),res=HR.d.emps.filter(e=>e.st==='Resign').length;
  const kon=act.filter(e=>e.k1&&dt(e.k1)>=dt(P.rep)&&dt(e.k1)<=new Date(dt(P.rep).getTime()+60*864e5));
  const wait=HR.d.cuti.filter(c=>c.status==='Menunggu').length;
  const k=(t,v,d,i)=>`<div class="card kpi"><span class="ico">${ico(i)}</span><small>${t}</small><b>${v}</b><span class="d">${d}</span></div>`;
  const avgMasa=act.reduce((s,e)=>s+HR.masa(e),0)/(act.length||1),avgUsia=act.reduce((s,e)=>s+HR.usia(e),0)/(act.length||1);
  el.innerHTML=`<div class="grid g4">${k('Headcount aktif',act.length,`${res} resign tahun ini · turnover ${pct(res/((act.length+res)||1))}`,'users')}${k('Total biaya perusahaan',juta(sum('V')),`periode ${MN[P.bulan-1]} ${P.tahun}`,'cash')}${k('Gaji bersih dibayarkan',juta(sum('T')),`PPh 21 ${juta(sum('O'))}`,'trend')}${k('Rata-rata masa kerja',avgMasa.toFixed(1).replace('.',',')+' thn',`usia rata-rata ${avgUsia.toFixed(1).replace('.',',')} thn`,'clock')}</div>
  <div class="grid g32" style="margin-top:16px"><div class="card"><h3>Headcount per departemen</h3><div id="c1"></div></div><div class="card"><h3>Status kerja</h3><div id="c2"></div></div></div>
  <div class="grid g3" style="margin-top:16px"><div class="card"><h3>Biaya perusahaan per departemen <small>jt Rp</small></h3><div id="c3"></div></div><div class="card"><h3>Kelompok usia</h3><div id="c4"></div></div>
  <div class="card"><h3>Perlu perhatian</h3><div id="c5"></div></div></div>`;
  const ds=DEPTS().filter(d=>act.some(e=>e.dept===d));
  barChart($('#c1'),ds,ds.map(d=>act.filter(e=>e.dept===d).length),{w:560,h:230});
  const sts=['Tetap','Kontrak','Probation','Magang'];donut($('#c2'),sts,sts.map(s=>act.filter(e=>e.st===s).length),{sub:'karyawan aktif',center:act.length});
  hBars($('#c3'),ds,ds.map(d=>pay.filter(x=>x.e.dept===d).reduce((s,x)=>s+x.c.V,0)/1e6),{fmt:v=>fmt(v)});
  const ag=[['<25',0,24],['25-34',25,34],['35-44',35,44],['45+',45,200]];barChart($('#c4'),ag.map(a=>a[0]),ag.map(a=>act.filter(e=>{const u=HR.usia(e);return u>=a[1]&&u<=a[2]}).length),{w:300,h:200,colors:[PAL[1]]});
  $('#c5').innerHTML=`<div style="font-size:13px"><p style="margin:0 0 8px"><b>${kon.length}</b> kontrak berakhir ≤ 60 hari</p>${kon.map(e=>`<div style="margin:3px 0">${esc(e.nama)} <span class="pill p-warn">${fdate(e.k1)}</span></div>`).join('')}<p style="margin:12px 0 8px"><b>${wait}</b> pengajuan cuti menunggu</p><p style="margin:8px 0"><b>${HR.d.low.filter(l=>l.status==='Dibuka').length}</b> lowongan dibuka</p></div>`;
};
V.karyawan=el=>{
  const F=el._f=el._f||{fd:'',fs:''};
  el.innerHTML=`<div class="tools"><select class="sel" id="fd"><option value="">Semua departemen</option>${opts(DEPTS())}</select><select class="sel" id="fs"><option value="">Semua status</option>${opts(['Tetap','Kontrak','Probation','Magang','Resign'])}</select><span class="sp"></span><button class="btn" id="im">${ico('plus')} Impor CSV</button><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn pri" id="ad">${ico('plus')} Tambah karyawan</button></div><div class="tbl" id="tb"></div>`;
  $('#im').classList.toggle('lk',DEMO());
  $('#ex').classList.toggle('lk',DEMO());
  const draw=()=>{const q=(App.q||'').toLowerCase(),fd=F.fd,fs=F.fs,rows=HR.d.emps.filter(e=>(!fd||e.dept===fd)&&(!fs||e.st===fs)&&(!q||(e.nama+e.id+e.jab+e.dept).toLowerCase().includes(q)));
   dataTable($('#tb'),[{h:'Karyawan',v:r=>r.nama,r:r=>`<span class="av">${initials(r.nama)}</span><b>${esc(r.nama)}</b> <small style="color:var(--mute)">${r.id}</small>`},{h:'Departemen',k:'dept'},{h:'Jabatan',v:r=>r.jab,r:r=>`${esc(r.jab)} <small style="color:var(--mute)">${r.grade}</small>`},{h:'Status',k:'st',r:r=>pill(r.st,ST_C[r.st]||'mut')},{h:'Masuk',k:'masuk',f:fdate},{h:'Masa kerja',n:1,v:r=>HR.masa(r),f:null,r:r=>HR.masa(r).toFixed(1).replace('.',',')+' thn'},{h:'Gaji pokok',n:1,k:'gaji',r:r=>idr(r.gaji)},{h:'PTKP',k:'ptkp'}],rows,{click:r=>empForm(r)})};
  $('#fd').value=F.fd;$('#fs').value=F.fs;el._onSearch=draw;$('#fd').onchange=e=>{F.fd=e.target.value;draw()};$('#fs').onchange=e=>{F.fs=e.target.value;draw()};
  $('#ad').onclick=()=>{if(DEMO()&&HR.d.emps.length>=12)return lock('Karyawan lebih dari 12 orang');empForm(null)};
  $('#ex').onclick=gate('Ekspor data karyawan',()=>download('karyawan.csv',toCSV([['ID','Nama','Departemen','Jabatan','Grade','Status','Masuk','PTKP','Gaji','Tunjangan'],...HR.d.emps.map(e=>[e.id,e.nama,e.dept,e.jab,e.grade,e.st,e.masuk,e.ptkp,e.gaji,e.tun])])));
  $('#im').onclick=()=>importCSV('Karyawan',[{k:'nama',h:'Nama',req:1,ex:'Budi Santoso'},{k:'g',h:'Gender',ex:'L'},{k:'lahir',h:'Lahir',t:'date',ex:'1995-04-12'},{k:'dept',h:'Departemen',ex:'Keuangan'},{k:'jab',h:'Jabatan',ex:'Staf'},{k:'grade',h:'Grade',ex:'G2'},{k:'st',h:'Status',ex:'Tetap'},{k:'masuk',h:'Masuk',t:'date',req:1,ex:'2024-01-15'},{k:'ptkp',h:'PTKP',ex:'TK/0'},{k:'gaji',h:'Gaji',t:'num',req:1,ex:'7000000'},{k:'tun',h:'Tunjangan',t:'num',ex:'700000'}],rows=>{let id=HR.d.emps.reduce((m,e)=>Math.max(m,+e.id.slice(2)||0),0);rows.forEach(r=>{id++;if(r.dept&&!HR.d.depts.includes(r.dept))HR.d.depts.push(r.dept);HR.d.emps.push({id:'K-'+String(id).padStart(3,'0'),nama:r.nama,g:r.g==='P'?'P':'L',lahir:r.lahir||'1995-01-01',dept:r.dept||HR.d.depts[0],jab:r.jab||'Staf',grade:r.grade||'G2',st:r.st||'Tetap',masuk:r.masuk,ptkp:r.ptkp||'TK/0',gaji:r.gaji,tun:r.tun||0,atasan:'-',lok:'-',keluar:null,k1:null,abs:{hadir:HR.P.hariKerja,sakit:0,izin:0,cuti:0,alpa:0,lembur:0,bonus:0,lain:0},kpi:null,pot:null})});HR.save();App.render();return rows.length+' karyawan diimpor'},r=>HR.P.ptkp.some(p=>p[0]===(r.ptkp||'TK/0'))?'':'PTKP tidak dikenal: '+r.ptkp);
  draw();
};
function empForm(e){
  const n=!e;e=e||{id:'K-'+String(HR.d.emps.reduce((m,x)=>Math.max(m,+String(x.id).slice(2)||0),0)+1).padStart(3,'0'),nama:'',g:'L',lahir:'1995-01-01',dept:DEPTS()[0],jab:'Staf',grade:'G2',st:'Tetap',masuk:HR.P.rep,ptkp:'TK/0',gaji:7000000,tun:700000,atasan:'-',lok:'Jakarta',keluar:null,k1:null,abs:{hadir:22,sakit:0,izin:0,cuti:0,alpa:0,lembur:0,bonus:0,lain:0},kpi:null,pot:null};
  const f=(l,id,v,t='text',full)=>`<div class="${full?'full':''}"><label>${l}</label><input class="inp" id="f_${id}" type="${t}" value="${esc(v??'')}"></div>`;
  const s=(l,id,list,v)=>`<div><label>${l}</label><select class="sel" id="f_${id}">${opts(list,v)}</select></div>`;
  modal(n?'Tambah karyawan':'Ubah karyawan',`<div class="form">${f('Nama lengkap','nama',e.nama,'text',1)}${s('Gender','g',['L','P'],e.g)}${f('Tanggal lahir','lahir',e.lahir,'date')}${s('Departemen','dept',DEPTS(),e.dept)}${f('Jabatan','jab',e.jab)}${s('Grade','grade',HR.P.grade.map(g=>g[0]),e.grade)}${s('Status kerja','st',['Tetap','Kontrak','Probation','Magang','Resign'],e.st)}${f('Tanggal masuk','masuk',e.masuk,'date')}${s('Status PTKP','ptkp',HR.P.ptkp.map(p=>p[0]),e.ptkp)}${f('Gaji pokok (Rp)','gaji',e.gaji,'number')}${f('Tunjangan tetap (Rp)','tun',e.tun,'number')}${f('Atasan','atasan',e.atasan)}${f('Lokasi','lok',e.lok)}${f('Tanggal keluar (jika resign)','keluar',e.keluar,'date')}${f('Akhir kontrak','k1',e.k1,'date')}</div>`,
  {buttons:[...(n?[]:[{text:'Hapus',cls:'dng',fn:()=>{if(!confirm('Hapus karyawan ini?'))return false;HR.d.emps=HR.d.emps.filter(x=>x!==e);HR.d.cuti=HR.d.cuti.filter(c=>c.id!==e.id);HR.d.latih=HR.d.latih.filter(l=>l.id!==e.id);Object.keys(HR.d.att||{}).forEach(k=>{if(HR.d.att[k])delete HR.d.att[k][e.id]});HR.save();App.render();toast('Karyawan dihapus')}}]),{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{
    const g=id=>$('#f_'+id).value;if(!g('nama').trim()){toast('Nama wajib diisi');return false}
    const gl=HR.P.grade.find(x=>x[0]===g('grade'));
    Object.assign(e,{nama:g('nama').trim(),g:g('g'),lahir:g('lahir'),dept:g('dept'),jab:g('jab'),grade:g('grade'),st:g('st'),masuk:g('masuk'),ptkp:g('ptkp'),gaji:+g('gaji')||0,tun:+g('tun')||0,atasan:g('atasan'),lok:g('lok'),keluar:g('keluar')||null,k1:g('k1')||null});
    if(n)HR.d.emps.push(e);HR.save();App.render();toast(n?'Karyawan ditambahkan':'Perubahan disimpan')}}]});
}
V.absensi=el=>{
  const P=HR.P;
  el.innerHTML=`<div class="note" style="background:rgba(14,165,164,.08);border-color:rgba(14,165,164,.3);color:var(--brand)">Periode <b>${MN[P.bulan-1]} ${P.tahun}</b> · ${P.hariKerja} hari kerja. Ubah angka langsung di tabel; payroll ikut terhitung otomatis.</div><div class="tbl" style="max-height:calc(100vh - 230px)"><table><thead><tr><th>Karyawan</th><th>Dept</th>${['Hadir','Sakit','Izin','Cuti','Alpa','Lembur (jam)','Bonus (Rp)','Pot. lain (Rp)'].map(h=>`<th class="n">${h}</th>`).join('')}<th>Cek</th></tr></thead><tbody>${HR.d.emps.map((e,i)=>{const a=e.abs,tot=a.hadir+a.sakit+a.izin+a.cuti+a.alpa;return `<tr><td><span class="av">${initials(e.nama)}</span>${esc(e.nama)}</td><td>${e.dept}</td>${['hadir','sakit','izin','cuti','alpa','lembur','bonus','lain'].map(k=>`<td class="n"><input class="inp" style="width:${k==='bonus'||k==='lain'?96:60}px;text-align:right" type="number" min="0" data-i="${i}" data-k="${k}" value="${a[k]}" ${e.st==='Resign'?'disabled':''}></td>`).join('')}<td data-c="${i}">${e.st==='Resign'?pill('Resign','mut'):tot===P.hariKerja?pill('OK','ok'):pill('Cek hari','bad')}</td></tr>`}).join('')}</tbody></table></div>`;
  $$('input',el).forEach(i=>i.onchange=()=>{const e=HR.d.emps[+i.dataset.i];e.abs[i.dataset.k]=Math.max(0,+i.value||0);HR.save();const a=e.abs,tot=a.hadir+a.sakit+a.izin+a.cuti+a.alpa;$(`[data-c="${i.dataset.i}"]`).innerHTML=tot===P.hariKerja?pill('OK','ok'):pill('Cek hari','bad')});
};
V.payroll=el=>{
  const P=HR.P,pay=HR.pay(),sum=k=>pay.reduce((s,x)=>s+x.c[k],0);
  el.innerHTML=`<div class="tools"><select class="sel" id="pb">${MN.map((m,i)=>`<option value="${i+1}" ${i+1===P.bulan?'selected':''}>${m}</option>`).join('')}</select><select class="sel" id="pt">${[2025,2026,2027].map(y=>`<option ${y===P.tahun?'selected':''}>${y}</option>`).join('')}</select>${P.bulan>=12?pill('PPh 21 progresif (masa pajak terakhir)','info'):pill('PPh 21 metode TER','info')}<span class="sp"></span><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn" id="sa">${ico('file')} Cetak semua slip (PDF)</button><button class="btn pri" id="sl">${ico('file')} Slip gaji</button></div>
  <div class="grid g4" style="margin-bottom:14px"><div class="card kpi"><small>Total pendapatan bruto</small><b>${juta(sum('pend'))}</b></div><div class="card kpi"><small>Total PPh 21</small><b>${juta(sum('O'))}</b></div><div class="card kpi"><small>BPJS perusahaan</small><b>${juta(sum('U'))}</b></div><div class="card kpi"><small>Gaji bersih (THP)</small><b>${juta(sum('T'))}</b></div></div>
  <div class="tbl" style="max-height:calc(100vh - 330px)" id="tb"></div>`;
  $('#ex').classList.toggle('lk',DEMO());$('#sl').classList.toggle('lk',DEMO());$('#sa').classList.toggle('lk',DEMO());$('#sa').onclick=()=>printAllSlips();
  $('#pb').onchange=e=>{const b=+e.target.value;if(DEMO()&&b>=12){lock('PPh 21 progresif Desember');e.target.value=P.bulan;return}HR.setPeriod(b,P.tahun);App.render()};$('#pt').onchange=e=>{HR.setPeriod(P.bulan,+e.target.value);App.render()};
  const col=(h,k,o={})=>({h,n:1,v:r=>r.c[k],r:r=>(o.b?'<b>':'')+fmt(r.c[k])+(o.b?'</b>':''),sum:1});
  dataTable($('#tb'),[{h:'Karyawan',v:r=>r.e.nama,r:r=>`<span class="av">${initials(r.e.nama)}</span>${esc(r.e.nama)}`},{h:'PTKP',v:r=>r.e.ptkp,r:r=>`${r.e.ptkp} <small style="color:var(--mute)">${r.c.cat}</small>`},col('Gaji pokok','F'),col('Tunjangan','G'),{h:'Transport+makan',n:1,v:r=>r.c.H+r.c.I,r:r=>fmt(r.c.H+r.c.I),sum:1},col('Lembur','J'),col('Bonus','K'),col('Pot. alpa','L'),col('PPh 21','O'),col('BPJS karyawan','Pj',{}),col('THP','T',{b:1}),col('Biaya perusahaan','V')].map((c,i)=>i===9?{h:'BPJS karyawan',n:1,v:r=>r.c.Pj+r.c.Q+r.c.R,r:r=>fmt(r.c.Pj+r.c.Q+r.c.R),sum:1}:c),pay,{total:1,click:r=>slipView(r)});
  $('#ex').onclick=gate('Ekspor payroll',()=>download(`payroll-${P.tahun}-${P.bulan}.csv`,toCSV([['ID','Nama','Gaji pokok','Tunjangan','Transport','Makan','Lembur','Bonus','Pot. alpa','PPh21','JHT','JP','Kes','Pot. lain','THP','BPJS perusahaan','Total biaya'],...pay.map(x=>[x.e.id,x.e.nama,x.c.F,x.c.G,x.c.H,x.c.I,x.c.J,x.c.K,x.c.L,x.c.O,x.c.Pj,x.c.Q,x.c.R,x.c.S,x.c.T,x.c.U,x.c.V])])));
  $('#sl').onclick=()=>pay[0]&&slipView(pay.find(x=>x.e.st!=='Resign'));
};
function slipView(r){
  if(DEMO())return lock('Slip gaji siap cetak');
  const {e,c}=r,P=HR.P,row=(a,b)=>`<tr><td>${a}</td><td style="text-align:right">${fmt(b)}</td></tr>`;
  const m=modal('Slip gaji',`<div class="slip" id="slipbox"><h2>${esc(CO.get())}</h2><div style="color:#64748b;margin-bottom:12px">SLIP GAJI · ${MN[P.bulan-1]} ${P.tahun}</div><table style="margin-bottom:14px"><tr><td><b>${esc(e.nama)}</b> (${e.id})</td><td>${esc(e.jab)} · ${e.grade}</td></tr><tr><td>${e.dept}</td><td>PTKP ${e.ptkp} · masa kerja ${HR.masa(e).toFixed(1).replace('.',',')} thn</td></tr></table>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><div><b>PENDAPATAN</b><table>${row('Gaji pokok',c.F)}${row('Tunjangan tetap',c.G)}${row('Transport',c.H)}${row('Makan',c.I)}${row('Lembur',c.J)}${row('Bonus',c.K)}<tr><td><b>Jumlah</b></td><td style="text-align:right"><b>${fmt(c.pend)}</b></td></tr></table></div>
  <div><b>POTONGAN</b><table>${row('Alpa',c.L)}${row('PPh 21',c.O)}${row('BPJS JHT',c.Pj)}${row('BPJS JP',c.Q)}${row('BPJS Kesehatan',c.R)}${row('Potongan lain',c.S)}<tr><td><b>Jumlah</b></td><td style="text-align:right"><b>${fmt(c.L+c.O+c.Pj+c.Q+c.R+c.S)}</b></td></tr></table></div></div>
  <div style="margin-top:16px;padding:12px 16px;background:#0b1a30;color:#fff;border-radius:10px;display:flex;justify-content:space-between"><b>GAJI BERSIH DITERIMA</b><b style="font-size:18px">${idr(c.T)}</b></div><p style="font-size:11px;color:#64748b;margin-top:12px">BPJS ditanggung perusahaan ${idr(c.U)} · Total biaya perusahaan ${idr(c.V)}. Dokumen ini dihasilkan otomatis.</p></div>`,{w:'780px',buttons:[{text:'Tutup'},{text:'Cetak / PDF',cls:'pri',fn:()=>{printSlip(r);return false}}]});
}
const nmE=id=>(HR.d.emps.find(e=>e.id===id)||{}).nama||id;
function cutiForm(c,done){
  const n=!c;c=c||{id:(HR.d.emps[0]||{}).id,jenis:'Tahunan',mulai:HR.P.rep,selesai:HR.P.rep,status:'Menunggu'};
  if(!HR.d.emps.length)return toast('Tambahkan karyawan terlebih dahulu');
  modal(n?'Ajukan cuti':'Ubah pengajuan cuti',`<div class="form"><div class="full"><label>Karyawan</label><select class="sel" id="c_id">${empOptions(c.id)}</select></div><div><label>Jenis</label><select class="sel" id="c_j">${opts(['Tahunan','Sakit','Melahirkan','Izin Khusus','Tanpa Gaji'],c.jenis)}</select></div><div><label>Status</label><select class="sel" id="c_s">${opts(['Menunggu','Disetujui','Ditolak'],c.status)}</select></div><div><label>Mulai</label><input class="inp" type="date" id="c_a" value="${c.mulai}"></div><div><label>Selesai</label><input class="inp" type="date" id="c_b" value="${c.selesai}"></div></div>`,
  {buttons:[...(n?[]:[{text:'Hapus',cls:'dng',fn:()=>{if(!confirm('Hapus pengajuan ini?'))return false;HR.d.cuti=HR.d.cuti.filter(x=>x!==c);HR.save();done();toast('Pengajuan dihapus')}}]),{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const a=$('#c_a').value,b=$('#c_b').value;if(!a||!b||b<a){toast('Tanggal tidak valid');return false}
    Object.assign(c,{id:$('#c_id').value,jenis:$('#c_j').value,mulai:a,selesai:b,status:$('#c_s').value});if(n)HR.d.cuti.push(c);HR.save();done();toast(n?'Pengajuan dicatat':'Perubahan disimpan')}}]});
}
V.cuti=el=>{
  let tab='saldo';
  const draw=()=>{
   el.innerHTML=`<div class="tabs"><button data-t="saldo" class="${tab==='saldo'?'on':''}">Saldo cuti</button><button data-t="log" class="${tab==='log'?'on':''}">Pengajuan</button></div><div id="tb"></div>`;
   $$('.tabs button',el).forEach(b=>b.onclick=()=>{tab=b.dataset.t;draw()});
   if(tab==='saldo'){$('#tb').className='tbl';HR._sc=new Map();setTimeout(()=>{HR._sc=null},0);dataTable($('#tb'),[{h:'Karyawan',v:r=>r.nama,r:r=>`<span class="av">${initials(r.nama)}</span>${esc(r.nama)}`},{h:'Dept',k:'dept'},{h:'Hak',n:1,v:r=>HR.saldo(r).hak},{h:'Terpakai',n:1,v:r=>HR.saldo(r).pakai},{h:'Menunggu',n:1,v:r=>HR.saldo(r).tunggu},{h:'Sisa',n:1,v:r=>HR.saldo(r).sisa,r:r=>`<b>${HR.saldo(r).sisa}</b>`},{h:'Status',v:r=>HR.saldo(r).sisa,r:r=>{const s=HR.saldo(r);return r.st==='Resign'?pill('Resign','mut'):s.hak===0?pill('Belum berhak','mut'):s.sisa<=0?pill('Habis','bad'):s.sisa<=3?pill('Menipis','warn'):pill('Cukup','ok')}}],HR.d.emps)}
   else{$('#tb').className='';$('#tb').innerHTML=`<div class="tools"><span class="sp"></span><button class="btn pri" id="ad">${ico('plus')} Ajukan cuti</button></div><div class="tbl" id="lg"></div>`;
    dataTable($('#lg'),[{h:'Karyawan',v:r=>nmE(r.id),r:r=>esc(nmE(r.id))+` <small style="color:var(--mute)">${r.id}</small>`},{h:'Jenis',k:'jenis'},{h:'Mulai',k:'mulai',f:fdate},{h:'Selesai',k:'selesai',f:fdate},{h:'Hari kerja',n:1,v:r=>HR.netDays(r.mulai,r.selesai)},{h:'Status',k:'status',r:r=>pill(r.status,{Disetujui:'ok',Menunggu:'warn',Ditolak:'bad'}[r.status])},{h:'',r:r=>r.status==='Menunggu'?`<button class="btn sm" data-a="ok">Setujui</button> <button class="btn sm dng" data-a="no">Tolak</button>`:''}],HR.d.cuti,{click:c=>cutiForm(c,draw),after:(t,rs)=>$$('button[data-a]',t).forEach(b=>b.onclick=()=>{const r=rs[+b.closest('tr').dataset.r];r.status=b.dataset.a==='ok'?'Disetujui':'Ditolak';HR.save();draw();toast('Status diperbarui')})});
    $('#ad').onclick=()=>cutiForm(null,draw)}
  };draw();
};
const STAGES=['Lamaran','Screening','Interview HR','Interview User','Penawaran','Diterima','Ditolak'];
function lowForm(l,done){
  const n=!l;l=l||{kode:'JOB-'+String(HR.d.low.reduce((m,x)=>Math.max(m,+String(x.kode).slice(4)||0),0)+1).padStart(2,'0'),posisi:'',dept:DEPTS()[0],butuh:1,status:'Dibuka'};
  modal(n?'Tambah lowongan':'Ubah lowongan',`<div class="form"><div><label>Kode</label><input class="inp" id="w_k" value="${esc(l.kode)}" ${n?'':'disabled'}></div><div><label>Status</label><select class="sel" id="w_s">${opts(['Dibuka','Terisi','Ditutup'],l.status)}</select></div><div class="full"><label>Posisi</label><input class="inp" id="w_p" value="${esc(l.posisi)}"></div><div><label>Departemen</label><select class="sel" id="w_d">${opts(DEPTS(),l.dept)}</select></div><div><label>Jumlah dibutuhkan</label><input class="inp" type="number" min="1" id="w_b" value="${l.butuh}"></div></div>`,
  {buttons:[...(n?[]:[{text:'Hapus',cls:'dng',fn:()=>{if(!confirm('Hapus lowongan dan kandidatnya?'))return false;HR.d.low=HR.d.low.filter(x=>x!==l);HR.d.cand=HR.d.cand.filter(c=>c.kode!==l.kode);HR.save();done();toast('Lowongan dihapus')}}]),{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const p=$('#w_p').value.trim();if(!p){toast('Posisi wajib diisi');return false}
    if(n&&HR.d.low.some(x=>x.kode===$('#w_k').value.trim())){toast('Kode sudah dipakai');return false}
    Object.assign(l,{kode:$('#w_k').value.trim(),posisi:p,dept:$('#w_d').value,butuh:+$('#w_b').value||1,status:$('#w_s').value});if(n)HR.d.low.push(l);HR.save();done();toast('Lowongan disimpan')}}]});
}
function candForm(c,done){
  const n=!c,lows=HR.d.low;if(!lows.length)return toast('Tambahkan lowongan terlebih dahulu');
  c=c||{id:'C-'+String(HR.d.cand.reduce((m,x)=>Math.max(m,+String(x.id).slice(2)||0),0)+1).padStart(3,'0'),kode:lows[0].kode,nama:'',sumber:'LinkedIn',tahap:'Lamaran',lamar:HR.P.rep,harap:8000000};
  modal(n?'Tambah kandidat':'Ubah kandidat',`<div class="form"><div class="full"><label>Nama kandidat</label><input class="inp" id="k_n" value="${esc(c.nama)}"></div><div><label>Lowongan</label><select class="sel" id="k_l">${lows.map(l=>`<option value="${l.kode}" ${l.kode===c.kode?'selected':''}>${l.kode} · ${esc(l.posisi)}</option>`).join('')}</select></div><div><label>Sumber</label><select class="sel" id="k_s">${opts(['LinkedIn','Jobstreet','Referral','Situs Karier','Kampus','Walk-in'],c.sumber)}</select></div><div><label>Tahap</label><select class="sel" id="k_t">${opts(STAGES,c.tahap)}</select></div><div><label>Gaji harapan (Rp)</label><input class="inp" type="number" id="k_g" value="${c.harap}"></div></div>`,
  {buttons:[...(n?[]:[{text:'Hapus',cls:'dng',fn:()=>{if(!confirm('Hapus kandidat ini?'))return false;HR.d.cand=HR.d.cand.filter(x=>x!==c);HR.save();done();toast('Kandidat dihapus')}}]),{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const nm=$('#k_n').value.trim();if(!nm){toast('Nama wajib diisi');return false}Object.assign(c,{nama:nm,kode:$('#k_l').value,sumber:$('#k_s').value,tahap:$('#k_t').value,harap:+$('#k_g').value||0});if(n)HR.d.cand.push(c);HR.save();done();toast('Kandidat disimpan')}}]});
}
V.rekrutmen=el=>{
  const lows=HR.d.low,again=()=>V.rekrutmen(el);
  el.innerHTML=`<div class="grid g32" style="margin-bottom:16px"><div class="card"><h3>Lowongan</h3><div class="tools"><span class="sp"></span><button class="btn" id="al">${ico('plus')} Tambah lowongan</button></div><div class="tbl" id="lw"></div></div><div class="card"><h3>Ringkasan</h3><div id="rs"></div></div></div><div class="tools"><h3 style="margin:0">Papan kandidat</h3><span class="sp"></span><button class="btn pri" id="ad">${ico('plus')} Tambah kandidat</button></div><div class="kan" id="kb"></div>`;
  dataTable($('#lw'),[{h:'Kode',k:'kode'},{h:'Posisi',k:'posisi'},{h:'Dept',k:'dept'},{h:'Butuh',n:1,k:'butuh'},{h:'Pelamar',n:1,v:l=>HR.d.cand.filter(c=>c.kode===l.kode).length},{h:'Diterima',n:1,v:l=>HR.d.cand.filter(c=>c.kode===l.kode&&c.tahap==='Diterima').length},{h:'Status',k:'status',r:l=>pill(l.status,l.status==='Dibuka'?'ok':'mut')}],lows,{click:l=>lowForm(l,again)});
  const cnt=STAGES.map(s=>HR.d.cand.filter(c=>c.tahap===s).length);hBars($('#rs'),STAGES,cnt,{fmt:v=>v});
  $('#kb').innerHTML=STAGES.map(s=>`<div class="col"><h5>${s}<b>${HR.d.cand.filter(c=>c.tahap===s).length}</b></h5>${HR.d.cand.filter(c=>c.tahap===s).slice(0,12).map(c=>`<div class="cd" data-id="${c.id}" style="cursor:pointer"><b>${esc(c.nama)}</b><small>${esc((lows.find(l=>l.kode===c.kode)||{}).posisi||c.kode)}<br>${c.sumber} · harapan ${juta(c.harap)}</small><div class="mv">${STAGES.indexOf(s)>0&&s!=='Ditolak'?`<button class="btn sm" data-id="${c.id}" data-d="-1">◀</button>`:''}${s!=='Diterima'&&s!=='Ditolak'?`<button class="btn sm" data-id="${c.id}" data-d="1">▶</button>`:''}</div></div>`).join('')}</div>`).join('');
  $$('#kb button').forEach(b=>b.onclick=()=>{const c=HR.d.cand.find(x=>x.id===b.dataset.id);c.tahap=STAGES[STAGES.indexOf(c.tahap)+ +b.dataset.d];HR.save();again()});
  $$('#kb .cd').forEach(d=>d.onclick=e=>{if(e.target.closest('button'))return;candForm(HR.d.cand.find(x=>x.id===d.dataset.id),again)});
  $('#ad').onclick=()=>candForm(null,again);$('#al').onclick=()=>lowForm(null,again);
};
V.kinerja=el=>{
  let tab='nilai';const P=HR.P;
  const draw=()=>{
   el.innerHTML=`<div class="tabs"><button data-t="nilai" class="${tab==='nilai'?'on':''}">Penilaian KPI</button><button data-t="box" class="${tab==='box'?'on':''}">Talent 9-Box</button><button data-t="suk" class="${tab==='suk'?'on':''}">Suksesi</button></div><div id="tb"></div>`;
   $$('.tabs button',el).forEach(b=>b.onclick=()=>{if(DEMO()&&b.dataset.t!=='nilai')return lock('Talent 9-Box dan Suksesi');tab=b.dataset.t;draw()});
   const emps=HR.d.emps.filter(e=>e.st!=='Resign');
   if(tab==='nilai'){$('#tb').innerHTML=`<div class="tbl"><table><thead><tr><th>Karyawan</th>${P.kpiN.map((k,i)=>`<th class="n">${k}<br><small>${P.kpiW[i]}%</small></th>`).join('')}<th class="n">Potensi</th><th class="n">Skor</th><th>Rating</th><th class="n">Bonus usulan</th><th class="n">Kenaikan</th></tr></thead><tbody>${emps.map(e=>{const s=HR.score(e),r=s==null?null:HR.rating(s);return `<tr><td><span class="av">${initials(e.nama)}</span>${esc(e.nama)}</td>${P.kpiN.map((k,i)=>`<td class="n"><input class="inp" style="width:62px;text-align:right" type="number" min="0" max="100" data-e="${e.id}" data-k="${i}" value="${e.kpi?e.kpi[i]:''}"></td>`).join('')}<td class="n"><input class="inp" style="width:62px;text-align:right" type="number" min="1" max="5" step=".1" data-e="${e.id}" data-k="p" value="${e.pot??''}"></td><td class="n"><b>${s??'-'}</b></td><td>${r?pill(r[1]+' · '+r[2],r[1]==='A'||r[1]==='B'?'ok':r[1]==='C'?'info':'bad'):'-'}</td><td class="n">${r?fmt(r[3]*e.gaji):'-'}</td><td class="n">${r?pct(r[4],0):'-'}</td></tr>`}).join('')}</tbody></table></div>`;
    $$('input',el).forEach(i=>i.onchange=()=>{const e=HR.d.emps.find(x=>x.id===i.dataset.e);if(i.dataset.k==='p')e.pot=i.value===''?null:Math.max(1,Math.min(5,+i.value||1));else{e.kpi=e.kpi||[0,0,0,0,0];e.kpi[+i.dataset.k]=Math.max(0,Math.min(100,+i.value||0))}HR.save();const nx=$$('input',el),ix=nx.indexOf(i);draw();const n2=$$('input',el);if(n2[ix+1]){n2[ix+1].focus();n2[ix+1].select&&n2[ix+1].select()}})}
   else if(tab==='box'){const cells={};emps.forEach(e=>{const b=HR.boxOf(e);if(b)(cells[b]=cells[b]||[]).push(e)});
    const col={9:'#bbf7d0',8:'#dcfce7',6:'#dcfce7',7:'#fef9c3',5:'#fef9c3',3:'#fef9c3',4:'#ffedd5',2:'#ffedd5',1:'#fecaca'};
    $('#tb').innerHTML=`<div class="card"><h3>Matriks 9-box <small>kinerja (skor KPI) × potensi</small></h3><div class="nb"><div></div><div class="h">Kinerja rendah</div><div class="h">Kinerja sedang</div><div class="h">Kinerja tinggi</div>${[3,2,1].map(po=>`<div class="h">Potensi ${['','rendah','sedang','tinggi'][po]}</div>`+[1,2,3].map(pl=>{const b=(pl-1)*3+po,l=cells[b]||[];return `<div class="c" style="background:${col[b]};color:#14342a" title="${esc(P.box[b-1][1])}"><b>${esc(P.box[b-1][0])}</b><div class="n">${l.length}</div><small>${l.slice(0,3).map(e=>esc(e.nama.split(' ')[0])).join(', ')}${l.length>3?'…':''}</small></div>`}).join('')).join('')}</div></div>`}
   else{const rows=emps.filter(e=>HR.boxOf(e)).map(e=>({e,k:e.pot*10000+HR.score(e)*10})).sort((a,b)=>b.k-a.k).slice(0,10);
    $('#tb').className='tbl';dataTable($('#tb'),[{h:'#',v:r=>0,r:r=>rows.indexOf(r)+1},{h:'Nama',v:r=>r.e.nama,r:r=>`<span class="av">${initials(r.e.nama)}</span>${esc(r.e.nama)}`},{h:'Departemen',v:r=>r.e.dept},{h:'Jabatan',v:r=>r.e.jab},{h:'Skor',n:1,v:r=>HR.score(r.e)},{h:'Potensi',n:1,v:r=>r.e.pot},{h:'Kotak',v:r=>P.box[HR.boxOf(r.e)-1][0]},{h:'Tindakan',v:r=>P.box[HR.boxOf(r.e)-1][1],r:r=>`<span style="white-space:normal;display:block;min-width:260px">${esc(P.box[HR.boxOf(r.e)-1][1])}</span>`}],rows)}
  };draw();
};
function latihForm(l,done){
  const n=!l;if(!HR.d.emps.length)return toast('Tambahkan karyawan terlebih dahulu');l=l||{id:HR.d.emps[0].id,nama:'',kat:'Teknis',tgl:HR.P.rep,jam:8,biaya:1000000,penyelenggara:'Internal'};
  modal(n?'Catat pelatihan':'Ubah pelatihan',`<div class="form"><div class="full"><label>Karyawan</label><select class="sel" id="l_id">${empOptions(l.id)}</select></div><div class="full"><label>Nama pelatihan</label><input class="inp" id="l_n" value="${esc(l.nama)}"></div><div><label>Kategori</label><select class="sel" id="l_k">${opts(['Teknis','Kepemimpinan','Soft Skill','Kepatuhan & K3','Digital'],l.kat)}</select></div><div><label>Tanggal</label><input class="inp" type="date" id="l_t" value="${l.tgl}"></div><div><label>Jam</label><input class="inp" type="number" id="l_j" value="${l.jam}"></div><div><label>Biaya (Rp)</label><input class="inp" type="number" id="l_b" value="${l.biaya}"></div></div>`,
  {buttons:[...(n?[]:[{text:'Hapus',cls:'dng',fn:()=>{if(!confirm('Hapus catatan ini?'))return false;HR.d.latih=HR.d.latih.filter(x=>x!==l);HR.save();done();toast('Catatan dihapus')}}]),{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{if(!$('#l_n').value.trim()){toast('Nama pelatihan wajib diisi');return false}Object.assign(l,{id:$('#l_id').value,nama:$('#l_n').value.trim(),kat:$('#l_k').value,tgl:$('#l_t').value,jam:+$('#l_j').value||0,biaya:+$('#l_b').value||0});if(n)HR.d.latih.push(l);HR.save();done();toast('Pelatihan disimpan')}}]});
}
V.pelatihan=el=>{
  const ds=DEPTS(),again=()=>V.pelatihan(el);
  el.innerHTML=`<div class="grid g32"><div class="card"><h3>Log pelatihan</h3><div class="tools"><span class="sp"></span><button class="btn pri" id="ad">${ico('plus')} Catat pelatihan</button></div><div class="tbl" id="tb" style="max-height:60vh"></div></div><div class="card"><h3>Jam pelatihan per departemen</h3><div id="c1"></div><h3 style="margin-top:18px">Biaya <small>jt Rp</small></h3><div id="c2"></div></div></div>`;
  dataTable($('#tb'),[{h:'Karyawan',v:r=>nmE(r.id)},{h:'Pelatihan',k:'nama'},{h:'Kategori',k:'kat'},{h:'Tanggal',k:'tgl',f:fdate},{h:'Jam',n:1,k:'jam'},{h:'Biaya',n:1,k:'biaya',r:r=>fmt(r.biaya)}],HR.d.latih,{total:1,click:l=>latihForm(l,again)});
  const dep=d=>HR.d.latih.filter(l=>(HR.d.emps.find(e=>e.id===l.id)||{}).dept===d);
  hBars($('#c1'),ds,ds.map(d=>dep(d).reduce((s,l)=>s+l.jam,0)),{fmt:v=>v});hBars($('#c2'),ds,ds.map(d=>dep(d).reduce((s,l)=>s+l.biaya,0)/1e6),{fmt:v=>fmt(v)});
  $('#ad').onclick=()=>latihForm(null,again);
};
V.pengaturan=el=>{
  const P=HR.P;
  el.innerHTML=`<div class="note">Tarif BPJS, PTKP, dan tabel TER adalah nilai acuan yang dapat berubah. Verifikasi dengan peraturan resmi (PP 58/2023, PMK 168/2023, ketentuan BPJS terbaru) sebelum dipakai untuk penggajian nyata.</div>
  <div class="grid g2"><div class="card"><h3>Perusahaan & periode</h3><div class="form"><div class="full"><label>Nama perusahaan</label><input class="inp" data-co value="${esc(CO.get())}"></div><div><label>Hari kerja bulan ini</label><input class="inp" type="number" data-p="hariKerja" value="${P.hariKerja}"></div><div><label>Pembagi upah per jam</label><input class="inp" type="number" data-p="jam" value="${P.jam}"></div><div><label>Pengali lembur rata-rata</label><input class="inp" type="number" step=".05" data-p="mult" value="${P.mult}"></div><div><label>Jatah cuti tahunan</label><input class="inp" type="number" data-p="jatah" value="${P.jatah}"></div><div><label>Tunjangan transport / hari hadir</label><input class="inp" type="number" data-p="transport" value="${P.transport}"></div><div><label>Tunjangan makan / hari hadir</label><input class="inp" type="number" data-p="makan" value="${P.makan}"></div><div><label>Biaya jabatan (%)</label><input class="inp" type="number" step=".01" data-p="bjPct" value="${P.bjPct}"></div><div><label>Biaya jabatan maks / tahun</label><input class="inp" type="number" data-p="bjMax" value="${P.bjMax}"></div><div><label>Jam masuk</label><input class="inp" type="time" data-p="jamMasuk" value="${P.jamMasuk}"></div><div><label>Jam pulang (lembur dihitung setelahnya)</label><input class="inp" type="time" data-p="jamPulang" value="${P.jamPulang}"></div><div><label>Toleransi terlambat (menit)</label><input class="inp" type="number" data-p="telat" value="${P.telat}"></div></div></div>
  <div class="card"><h3>Tarif BPJS</h3><div class="tbl"><table><thead><tr><th>Komponen</th><th class="n">Perusahaan</th><th class="n">Karyawan</th><th class="n">Batas upah</th></tr></thead><tbody>${P.bpjs.map((b,i)=>`<tr><td>${b[0]}</td><td class="n"><input class="inp" style="width:80px;text-align:right" type="number" step=".0001" data-b="${i}.1" value="${b[1]}"></td><td class="n"><input class="inp" style="width:80px;text-align:right" type="number" step=".0001" data-b="${i}.2" value="${b[2]}"></td><td class="n"><input class="inp" style="width:130px;text-align:right" type="number" data-b="${i}.3" value="${b[3]}"></td></tr>`).join('')}</tbody></table></div><p style="color:var(--mute);font-size:12px">Batas 9.999.999.999 = tanpa batas. Tarif JKK mengikuti kelas risiko usaha.</p>
  <h3 style="margin-top:14px">PTKP & kategori TER</h3><div class="tbl"><table><thead><tr><th>Status</th><th class="n">PTKP / tahun</th><th>Kategori</th></tr></thead><tbody>${P.ptkp.map(p=>`<tr><td>${p[0]}</td><td class="n">${fmt(p[1])}</td><td>${p[2]}</td></tr>`).join('')}</tbody></table></div></div></div>
  <div class="card" style="margin-top:16px"><h3>Data & aplikasi</h3><h3 style="margin-top:16px">Departemen</h3><div class="form"><div class="full"><label>Daftar departemen (pisahkan dengan koma)</label><input class="inp" id="dp" value="${esc(HR.d.depts.join(', '))}"></div></div><div class="tools" style="margin-top:12px"><button class="btn" id="bk">${ico('down')} Cadangkan data (JSON)</button><button class="btn" id="rst">Pulihkan dari cadangan</button><button class="btn" id="bl">Mulai dari data kosong</button><button class="btn dng" id="rs">Kembalikan data contoh</button><span class="sp"></span><button class="btn" id="th">${ico('moon')} Tema gelap/terang</button></div><p style="color:var(--mute);margin:8px 0 0">Data tersimpan di komputer ini saja. Edisi: <b>${DEMO()?'Demo (terbatas)':'Lengkap · '+esc(CONFIG.buyer)}</b>. Produk diberikan sebagaimana adanya, tanpa layanan garansi, pembaruan, maupun dukungan.</p></div>`;
  $$('[data-p]',el).forEach(i=>i.onchange=()=>{const k=i.dataset.p;const raw=String(i.value).replace(/\./g,'').replace(',','.');let v=(i.type==='number'||i.dataset.num==='1')?(+raw||0):i.value;if((k==='hariKerja'||k==='jam')&&!(v>0)){v=k==='jam'?173:22;i.value=v;toast('Nilai harus lebih dari 0')}P[k]=v;HR.save();toast('Pengaturan disimpan')});
  $$('[data-b]',el).forEach(i=>i.onchange=()=>{const [a,b]=i.dataset.b.split('.').map(Number);P.bpjs[a][b]=+i.value;HR.save();toast('Tarif disimpan')});
  $('#rst').onclick=gate('Pulihkan cadangan',()=>pickBackup('HRMS',j=>j&&Array.isArray(j.d&&j.d.emps)&&j.P&&j.P.bulan,j=>{HR.d=j.d;HR.P=j.P;HR.save();App.render()}));
  $('#bk').onclick=gate('Cadangan data',()=>download('hrms-cadangan.json',JSON.stringify({d:HR.d,P:HR.P}),'application/json'));
  $('#rs').onclick=()=>{if(confirm('Semua perubahan akan hilang. Lanjutkan?')){HR.reset();App.render();toast('Data contoh dikembalikan')}};
  $('#th').onclick=()=>App.theme();
  $('#dp').onchange=e=>{const l=e.target.value.split(',').map(x=>x.trim()).filter(Boolean);if(!l.length){toast('Minimal satu departemen');return}HR.d.depts=l;HR.save();toast('Departemen disimpan')};
  $('#bl').onclick=gate('Mulai dari data kosong',()=>{if(confirm('Semua karyawan, cuti, rekrutmen, dan pelatihan contoh dihapus; pengaturan tarif tetap. Lanjutkan?')){HR.blank();App.cur='karyawan';App.render();toast('Data dikosongkan. Tambahkan karyawan Anda.')}});
};

V.harian=el=>{
  const P=HR.P;let ds=el._ds;if(!ds){ds=P.rep;const x=dt(ds);while(!HR.isWork(iso(x)))x.setDate(x.getDate()-1);ds=el._ds=iso(x)}let tab=el._tab||'hari';
  const SL={H:'Hadir',S:'Sakit',I:'Izin',C:'Cuti',A:'Alpa'},SC2={H:'ok',S:'warn',I:'info',C:'info',A:'bad'};
  const drawDay=()=>{const act=HR.active(),day=(HR.d.att[ds]=HR.d.att[ds]||{}),work=HR.isWork(ds);
   $('#bd').innerHTML=`<div class="tools"><button class="btn" id="pv">◀</button><input class="inp" type="date" id="dd" value="${ds}" style="width:auto"><button class="btn" id="nx">▶</button>${work?pill('Hari kerja','ok'):pill('Libur / akhir pekan','mut')}<span class="sp"></span><button class="btn" id="im">Impor CSV</button><button class="btn" id="ha">Hadirkan semua</button><button class="btn dng" id="ko">Kosongkan hari</button></div>
   <div class="tbl" style="max-height:calc(100vh - 260px)"><table><thead><tr><th>Karyawan</th><th>Dept</th><th>Status</th><th>Masuk</th><th>Pulang</th><th class="n">Terlambat</th><th class="n">Lembur (jam)</th></tr></thead><tbody>${act.map(e=>{const x=day[e.id]||{},lv=!x.s&&HR.leaveOn(e.id,ds)&&work,s=x.s||(lv?'C':'');const late=s==='H'&&x.in?Math.max(0,HR.tmin(x.in)-HR.tmin(P.jamMasuk)-P.telat):0,ex=s==='H'&&x.out?Math.floor(Math.max(0,HR.tmin(x.out)-HR.tmin(P.jamPulang))/30)/2:0;
    return `<tr><td><span class="av">${initials(e.nama)}</span>${esc(e.nama)}</td><td>${esc(e.dept)}</td><td><select class="sel" data-e="${e.id}" data-f="s"><option value="">—</option>${Object.entries(SL).map(([k,v])=>`<option value="${k}" ${s===k?'selected':''}>${v}</option>`).join('')}</select>${lv?' <small style="color:var(--mute)">cuti disetujui</small>':''}</td><td><input class="inp" type="time" data-e="${e.id}" data-f="in" value="${x.in||''}" ${s==='H'?'':'disabled'}></td><td><input class="inp" type="time" data-e="${e.id}" data-f="out" value="${x.out||''}" ${s==='H'?'':'disabled'}></td><td class="n">${late?pill(late+' mnt','warn'):'-'}</td><td class="n">${ex||'-'}</td></tr>`}).join('')||'<tr><td colspan="7" class="empty">Belum ada karyawan</td></tr>'}</tbody></table></div>`;
   const go=n=>{const d=dt(ds);d.setDate(d.getDate()+n);ds=el._ds=iso(d);drawDay()};
   $('#pv').onclick=()=>go(-1);$('#nx').onclick=()=>go(1);$('#dd').onchange=e=>{if(e.target.value){ds=el._ds=e.target.value;drawDay()}};
   $$('[data-e]',el).forEach(i=>i.onchange=()=>{const x=day[i.dataset.e]=day[i.dataset.e]||{};if(i.dataset.f==='s'){x.s=i.value;if(!i.value)delete day[i.dataset.e];else if(i.value==='H'){x.in=x.in||P.jamMasuk;x.out=x.out||P.jamPulang}else{delete x.in;delete x.out}}else x[i.dataset.f]=i.value;HR.save();drawDay()});
   $('#im').onclick=()=>importCSV('Absen harian',[{k:'d',h:'Tanggal',t:'date',req:1,ex:'2026-10-30'},{k:'e',h:'ID atau nama karyawan',req:1,ex:'K-001'},{k:'s',h:'Status (Hadir/Sakit/Izin/Cuti/Alpa)',ex:'Hadir'},{k:'in',h:'Jam masuk',ex:'08:00'},{k:'out',h:'Jam pulang',ex:'17:00'}],rows=>{const M={h:'H',hadir:'H',s:'S',sakit:'S',i:'I',izin:'I',c:'C',cuti:'C',a:'A',alpa:'A',alpha:'A'},ids={};HR.d.emps.forEach(e=>{ids[e.id.toLowerCase()]=e;ids[e.nama.toLowerCase()]=e});let ok=0,sk=0;rows.forEach(r=>{const e=ids[String(r.e||'').trim().toLowerCase()],s=M[String(r.s||'Hadir').trim().toLowerCase()],t=x=>/^\d{1,2}:\d{2}/.test(String(x||''))?String(x).trim().slice(0,5).padStart(5,'0'):'';if(!e||!s||!r.d){sk++;return}const o={s};if(s==='H'){o.in=t(r.in)||P.jamMasuk;o.out=t(r.out)||P.jamPulang}(HR.d.att[r.d]=HR.d.att[r.d]||{})[e.id]=o;ok++});HR.save();ds=el._ds=rows[0]&&rows[0].d||ds;drawDay();toast(ok+' baris absen diimpor'+(sk?', '+sk+' dilewati (karyawan atau status tidak dikenali)':''))});
   $('#ha').onclick=()=>{HR.active().forEach(e=>{if(HR.leaveOn(e.id,ds)&&!(day[e.id]&&day[e.id].s))day[e.id]={s:'C'};else if(!(day[e.id]&&day[e.id].s))day[e.id]={s:'H',in:P.jamMasuk,out:P.jamPulang}});HR.save();drawDay();toast('Semua karyawan yang belum diisi ditandai hadir')};
   $('#ko').onclick=()=>{if(!confirm('Kosongkan semua catatan pada tanggal ini?'))return;delete HR.d.att[ds];HR.save();drawDay()}};
  const drawRec=()=>{const R=HR.recap(P.bulan,P.tahun);
   $('#bd').innerHTML=`<div class="note" style="background:rgba(14,165,164,.08);border-color:rgba(14,165,164,.3);color:var(--brand)">Rekap kehadiran <b>${MN[P.bulan-1]} ${P.tahun}</b> dari catatan harian. Terapkan ke payroll untuk mengisi Hadir, Sakit, Izin, Cuti, Alpa, dan Lembur (bonus dan potongan lain tidak berubah). Kolom "Belum diisi" = hari kerja sampai tanggal laporan yang belum dicatat.</div><div class="tools"><span class="sp"></span><button class="btn pri ${DEMO()?'lk':''}" id="ap">Terapkan ke payroll</button></div><div class="tbl" id="tb"></div>`;
   dataTable($('#tb'),[{h:'Karyawan',v:e=>e.nama,r:e=>`<span class="av">${initials(e.nama)}</span>${esc(e.nama)}`},{h:'Hadir',n:1,v:e=>R[e.id].hadir},{h:'Sakit',n:1,v:e=>R[e.id].sakit},{h:'Izin',n:1,v:e=>R[e.id].izin},{h:'Cuti',n:1,v:e=>R[e.id].cuti},{h:'Alpa',n:1,v:e=>R[e.id].alpa},{h:'Terlambat (x)',n:1,v:e=>R[e.id].telat},{h:'Lembur (jam)',n:1,v:e=>R[e.id].lembur},{h:'Belum diisi',n:1,v:e=>R[e.id].kosong,r:e=>R[e.id].kosong?pill(R[e.id].kosong+' hari','warn'):'-'}],HR.active());
   $('#ap').onclick=gate('Terapkan absensi harian ke payroll',()=>{HR.active().forEach(e=>{const r=R[e.id];Object.assign(e.abs,{hadir:r.hadir,sakit:r.sakit,izin:r.izin,cuti:r.cuti,alpa:r.alpa,lembur:r.lembur})});HR.save();toast('Rekap diterapkan ke payroll '+MN[P.bulan-1]+' '+P.tahun)})};
  el.innerHTML=`<div class="tabs"><button data-t="hari" class="${tab==='hari'?'on':''}">Catat harian</button><button data-t="rekap" class="${tab==='rekap'?'on':''}">Rekap bulanan</button></div><div id="bd"></div>`;
  $$('.tabs button',el).forEach(b=>b.onclick=()=>{el._tab=b.dataset.t;V.harian(el)});tab==='hari'?drawDay():drawRec();
};

/* ---------- THR keagamaan (Permenaker 6/2016) & pesangon (PP 35/2021) ---------- */
const HRK={
 bln(a,b){const x=dt(a),y=dt(b);let m=(y.getFullYear()-x.getFullYear())*12+y.getMonth()-x.getMonth();if(y.getDate()<x.getDate())m--;return Math.max(0,m)},
 upah(e){return (e.gaji||0)+(e.tun||0)},
 thr(e,tgl){const m=this.bln(e.masuk,tgl),up=this.upah(e);let r='';
  if(e.st==='Resign'||(e.keluar&&e.keluar<tgl))r='Sudah keluar';else if(e.st==='Magang')r='Magang (tanpa hubungan kerja)';else if(e.masuk>tgl||m<1)r='Masa kerja kurang dari 1 bulan';
  if(r)return {m,up,v:0,r};
  return {m,up,v:Math.round(m>=12?up:up*m/12),r:m>=12?'1 bulan upah':m+'/12 × upah'}},
 pph(e,v){if(!v)return 0;const c=HR.calc(e,HR.P),ap=(HR.P.thrApplied||{})[HR.key()+'|'+e.id]||0,N=c.N-ap;return Math.max(0,Math.round((N+v)*HR.terRate(c.cat,N+v))-Math.round(N*c.rate))},
 RS:[
  {k:'rugi',n:'Efisiensi karena rugi / tutup karena rugi / pailit / PKPU rugi / force majeure tutup',up:.5,mk:1},
  {k:'fm',n:'Force majeure tanpa penutupan perusahaan',up:.75,mk:1},
  {k:'efis',n:'Efisiensi mencegah rugi / merger / akuisisi / tutup bukan karena rugi / perilaku pengusaha',up:1,mk:1},
  {k:'pensiun',n:'Pensiun (mencapai usia pensiun)',up:1.75,mk:1},
  {k:'sakit',n:'Sakit berkepanjangan / cacat akibat kerja lebih dari 12 bulan / meninggal dunia',up:2,mk:1},
  {k:'sp',n:'Pelanggaran setelah peringatan 1, 2, dan 3',up:.5,mk:1},
  {k:'resign',n:'Mengundurkan diri atas kemauan sendiri',up:0,mk:0,pisah:1},
  {k:'berat',n:'Kesalahan berat',up:0,mk:0,pisah:1},
  {k:'pkwt',n:'Kontrak (PKWT) berakhir',up:0,mk:0,pkwt:1}],
 MK:[[3,2],[6,3],[9,4],[12,5],[15,6],[18,7],[21,8],[24,10]],
 pes(s){const e=s.e,R=this.RS.find(x=>x.k===s.alasan),m=this.bln(e.masuk,s.tgl),th=Math.floor(m/12),up=Math.max(0,+s.upah||0);
  const bUP=R.up?Math.min(9,th+1):0,bMK=R.mk?(this.MK.filter(x=>th>=x[0]).pop()||[0,0])[1]:0;
  const UP=Math.round(up*bUP*R.up),UPMK=Math.round(up*bMK*R.mk),cuti=Math.round(Math.max(0,+s.cuti||0)*up/(+s.pembagi||25)),pulang=Math.max(0,+s.pulang||0),lain=Math.max(0,+s.lain||0),pisah=R.pisah?Math.max(0,+s.pisah||0):0;
  const kp=R.pkwt&&m>=1?Math.round(up*m/12):0,UPH=cuti+pulang+lain,total=UP+UPMK+UPH+pisah+kp;
  const base=UP+UPMK,L=[[5e7,0],[1e8,.05],[5e8,.15],[Infinity,.25]];let pj=0,lo=0;L.forEach(([hi,r])=>{if(base>lo)pj+=(Math.min(base,hi)-lo)*r;lo=hi});
  return {R,m,th,bUP,bMK,UP,UPMK,cuti,pulang,lain,pisah,kp,UPH,total,pph:Math.round(pj),up}},
 ym(m){return Math.floor(m/12)+' tahun '+(m%12)+' bulan'}
};
function thrBody(L,tgl){const tot=L.reduce((s,x)=>s+x.t.v,0);
 return `<div class="pg">${docHead('Daftar Tunjangan Hari Raya (THR)','Hari raya '+fdate(tgl)+' · dibayar paling lambat '+fdate(iso(new Date(dt(tgl).getTime()-7*864e5))))}<table><thead><tr><th>Karyawan</th><th>Tgl masuk</th><th class="n">Masa kerja</th><th class="n">Upah 1 bulan</th><th>Dasar</th><th class="n">THR</th><th>Tanda terima</th></tr></thead><tbody>${L.map(x=>`<tr><td>${esc(x.e.nama)}<br><small>${x.e.id}</small></td><td>${fdate(x.e.masuk)}</td><td class="n">${x.t.m} bln</td><td class="n">${fmt(x.t.up)}</td><td>${x.t.r}</td><td class="n">${fmt(x.t.v)}</td><td style="width:90px"></td></tr>`).join('')}<tr><td colspan="5"><b>Total</b></td><td class="n"><b>${fmt(tot)}</b></td><td></td></tr></tbody></table><p style="font-size:11px;color:#64748b;margin-top:10px">THR dihitung dari upah pokok + tunjangan tetap sesuai Permenaker 6/2016: masa kerja 12 bulan atau lebih = 1 bulan upah; 1–11 bulan = masa kerja/12 × 1 bulan upah. Jika perjanjian atau peraturan perusahaan memberi lebih besar, berlaku yang lebih besar.</p></div>`}
V.thr=el=>{
 const P=HR.P;P.thrTgl=P.thrTgl||'2027-03-10';const tgl=P.thrTgl;
 const L=HR.d.emps.map(e=>{const t=HRK.thr(e,tgl),p=HRK.pph(e,t.v);return {e,t,p}}),pay=L.filter(x=>x.t.v>0),tot=pay.reduce((s,x)=>s+x.t.v,0),pj=pay.reduce((s,x)=>s+x.p,0);
 el.innerHTML=`<div class="tools"><label style="color:var(--mute)">Tanggal hari raya</label><input class="inp" type="date" id="td" value="${tgl}" style="width:160px"><span class="sp"></span><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn" id="pr">${ico('file')} Cetak daftar THR (PDF)</button><button class="btn pri" id="ap">Masukkan ke bonus payroll</button></div>
 <div class="grid g4" style="margin-bottom:14px"><div class="card kpi"><small>Penerima THR</small><b>${pay.length}</b></div><div class="card kpi"><small>Total THR</small><b>${juta(tot)}</b></div><div class="card kpi"><small>Estimasi PPh 21 atas THR</small><b>${juta(pj)}</b></div><div class="card kpi"><small>Batas bayar</small><b>${fdate(iso(new Date(dt(tgl).getTime()-7*864e5)))}</b></div></div>
 <div class="note" style="margin-bottom:12px">Dasar: Permenaker 6/2016. Masa kerja 12 bulan atau lebih mendapat 1 bulan upah; 1–11 bulan mendapat masa kerja/12 × upah; di bawah 1 bulan tidak berhak. THR wajib dibayar paling lambat 7 hari sebelum hari raya. Upah = gaji pokok + tunjangan tetap. Tanggal hari raya diisi sesuai kalender (default hanya perkiraan). PPh 21 atas THR adalah estimasi metode TER pada bulan pembayaran.</div><div class="tbl" id="tb"></div>`;
 dataTable($('#tb'),[{h:'Karyawan',v:x=>x.e.nama,r:x=>`<span class="av">${initials(x.e.nama)}</span>${esc(x.e.nama)} <small style="color:var(--mute)">${x.e.id}</small>`},{h:'Status',v:x=>x.e.st,r:x=>pill(x.e.st,ST_C[x.e.st]||'info')},{h:'Tgl masuk',v:x=>x.e.masuk,r:x=>fdate(x.e.masuk)},{h:'Masa kerja',n:1,v:x=>x.t.m,r:x=>x.t.m+' bln'},{h:'Upah 1 bulan',n:1,v:x=>x.t.up,r:x=>fmt(x.t.up)},{h:'Dasar',v:x=>x.t.r},{h:'THR',n:1,v:x=>x.t.v,r:x=>`<b>${fmt(x.t.v)}</b>`,sum:1},{h:'Est. PPh 21',n:1,v:x=>x.p,r:x=>fmt(x.p),sum:1},{h:'Diterima',n:1,v:x=>x.t.v-x.p,r:x=>fmt(x.t.v-x.p),sum:1}],L,{total:1});
 $('#td').onchange=e=>{if(!e.target.value)return;P.thrTgl=e.target.value;HR.save();V.thr(el)};
 $('#pr').onclick=()=>pay.length?printDoc('Daftar THR',thrBody(pay,tgl)):toast('Tidak ada penerima THR');
 $('#ex').onclick=gate('Ekspor THR',()=>download('thr-'+tgl+'.csv',toCSV([['ID','Nama','Status','Tgl masuk','Masa kerja (bln)','Upah 1 bulan','Dasar','THR','Estimasi PPh 21','Diterima'],...L.map(x=>[x.e.id,x.e.nama,x.e.st,x.e.masuk,x.t.m,x.t.up,x.t.r,x.t.v,x.p,x.t.v-x.p])])));
 $('#ap').onclick=gate('THR ke payroll',()=>{if(!pay.length)return toast('Tidak ada penerima THR');if(!confirm('Tambahkan THR ke kolom Bonus payroll periode '+MN[P.bulan-1]+' '+P.tahun+' untuk '+pay.length+' karyawan? Jika sudah pernah dimasukkan, nilai lama diganti (tidak dobel).'))return;P.thrApplied=P.thrApplied||{};pay.forEach(x=>{const k=HR.key()+'|'+x.e.id,prev=P.thrApplied[k]||0;x.e.abs=x.e.abs||{};x.e.abs.bonus=Math.max(0,(x.e.abs.bonus||0)-prev)+x.t.v;P.thrApplied[k]=x.t.v});HR.save();V.thr(el);toast('THR ditambahkan ke bonus payroll')});
};
function pesBody(s,r){const e=s.e,rw=(a,b)=>`<tr><td>${a}</td><td class="n">${b}</td></tr>`;
 return `<div class="pg">${docHead('Perhitungan Kompensasi Pemutusan Hubungan Kerja','PP 35/2021')}<table style="margin-bottom:10px"><tr><td style="width:34%;color:#64748b">Karyawan</td><td>${esc(e.nama)} (${e.id}) · ${esc(e.jab)}</td></tr><tr><td style="color:#64748b">Tanggal masuk / berakhir</td><td>${fdate(e.masuk)} s.d. ${fdate(s.tgl)} · ${HRK.ym(r.m)}</td></tr><tr><td style="color:#64748b">Alasan</td><td>${esc(r.R.n)}</td></tr><tr><td style="color:#64748b">Upah sebulan (pokok + tunjangan tetap)</td><td>${idr(r.up)}</td></tr></table>
 <table><thead><tr><th>Komponen</th><th class="n">Rupiah</th></tr></thead><tbody>${rw('Uang pesangon ('+r.bUP+' bulan × '+r.R.up+')',fmt(r.UP))}${rw('Uang penghargaan masa kerja ('+r.bMK+' bulan × '+r.R.mk+')',fmt(r.UPMK))}${rw('Uang penggantian hak: cuti yang belum diambil',fmt(r.cuti))}${rw('Uang penggantian hak: ongkos pulang',fmt(r.pulang))}${rw('Uang penggantian hak: lainnya',fmt(r.lain))}${r.R.pisah?rw('Uang pisah',fmt(r.pisah)):''}${r.R.pkwt?rw('Kompensasi PKWT ('+r.m+'/12 × upah)',fmt(r.kp)):''}<tr><td><b>Total</b></td><td class="n"><b>${fmt(r.total)}</b></td></tr></tbody></table>
 <p style="font-size:11px;color:#64748b;margin-top:10px">Estimasi PPh 21 final atas uang pesangon dan UPMK: ${idr(r.pph)} (tarif lapisan 0% sampai Rp50 juta, 5% sampai Rp100 juta, 15% sampai Rp500 juta, 25% di atasnya). Perhitungan ini bersifat estimasi; perjanjian kerja, peraturan perusahaan, atau PKB yang lebih menguntungkan karyawan tetap berlaku.</p><div class="ttd"><div>Perusahaan<br><br><br><br>(................)</div><div>Karyawan<br><br><br><br>(${esc(e.nama)})</div></div></div>`}
V.pesangon=el=>{
 const emps=HR.d.emps;if(!emps.length){el.innerHTML='<div class="card" style="padding:40px;text-align:center;color:var(--mute)">Belum ada karyawan.</div>';return}
 const S=el._s=el._s||{eid:(emps.find(e=>e.st!=='Resign')||emps[0]).id,tgl:HR.P.rep,alasan:'efis',pembagi:25,pulang:0,lain:0,pisah:0,cuti:null,upah:null,fresh:1};
 const e=emps.find(x=>x.id===S.eid)||emps[0];S.e=e;
 if(S.fresh){S.upah=HRK.upah(e);S.cuti=HR.saldo(e).sisa;S.fresh=0}
 const r=HRK.pes(S),R=HRK.RS,row=(a,b,o)=>`<tr><td>${a}</td><td class="n">${o?'<b>'+b+'</b>':b}</td></tr>`;
 el.innerHTML=`<div class="grid g2" style="align-items:start"><div class="card"><h3>Data pemutusan hubungan kerja</h3><div class="form"><div class="full"><label>Karyawan</label><select class="sel" id="pe">${empOptions(e.id)}</select></div><div class="full"><label>Alasan</label><select class="sel" id="pa">${R.map(x=>`<option value="${x.k}" ${x.k===S.alasan?'selected':''}>${esc(x.n)}</option>`).join('')}</select></div><div><label>Tanggal berakhir hubungan kerja</label><input class="inp" type="date" id="pt" value="${S.tgl}"></div><div><label>Upah sebulan (Rp)</label><input class="inp" type="number" data-rp data-k="upah" value="${S.upah}"></div><div><label>Sisa cuti belum diambil (hari)</label><input class="inp" type="number" data-k="cuti" value="${S.cuti}"></div><div><label>Pembagi upah harian</label><input class="inp" type="number" data-k="pembagi" value="${S.pembagi}"></div><div><label>Ongkos pulang (Rp)</label><input class="inp" type="number" data-rp data-k="pulang" value="${S.pulang}"></div><div><label>Hak lain sesuai PKB (Rp)</label><input class="inp" type="number" data-rp data-k="lain" value="${S.lain}"></div>${r.R.pisah?`<div class="full"><label>Uang pisah menurut perjanjian / PKB (Rp)</label><input class="inp" type="number" data-rp data-k="pisah" value="${S.pisah}"></div>`:''}</div><p style="color:var(--mute);margin:10px 0 0">Upah sebulan terisi otomatis dari gaji pokok + tunjangan tetap. Sisa cuti diambil dari saldo cuti tahun berjalan; ubah bila perlu.</p></div>
 <div class="card"><h3>Hasil perhitungan</h3><p style="margin:0 0 10px;color:var(--mute)">Masa kerja <b style="color:var(--fg,inherit)">${HRK.ym(r.m)}</b> · ${esc(e.nama)}</p><div class="tbl"><table><tbody>${row('Uang pesangon ('+r.bUP+' bln × '+r.R.up+')',fmt(r.UP))}${row('Uang penghargaan masa kerja ('+r.bMK+' bln × '+r.R.mk+')',fmt(r.UPMK))}${row('Penggantian hak: cuti',fmt(r.cuti))}${row('Penggantian hak: ongkos pulang & lainnya',fmt(r.pulang+r.lain))}${r.R.pisah?row('Uang pisah',fmt(r.pisah)):''}${r.R.pkwt?row('Kompensasi PKWT ('+r.m+'/12 × upah)',fmt(r.kp)):''}${row('Total kompensasi',idr(r.total),1)}${row('Estimasi PPh 21 final (pesangon + UPMK)',fmt(r.pph))}${row('Estimasi diterima bersih',idr(r.total-r.pph),1)}</tbody></table></div><div class="tools" style="margin-top:12px"><span class="sp"></span><button class="btn pri" id="pc">${ico('file')} Cetak perhitungan (PDF)</button></div></div></div>
 <div class="note" style="margin-top:14px">Dasar: PP 35/2021 (turunan UU Cipta Kerja). Pesangon dan UPMK dihitung dari masa kerja dengan pengali sesuai alasan PHK; UPMK baru ada setelah masa kerja 3 tahun; pesangon maksimal 9 bulan upah. Pengunduran diri dan kesalahan berat tidak mendapat pesangon dan UPMK, hanya penggantian hak dan uang pisah menurut perjanjian. Kontrak (PKWT) berakhir mendapat kompensasi masa kerja/12 × upah. Bila perusahaan punya program pensiun, perhitungan dapat berbeda. Hasil adalah estimasi; konsultasikan dengan ahli ketenagakerjaan untuk kasus nyata.</div>`;
 $('#pe').onchange=x=>{S.eid=x.target.value;S.fresh=1;V.pesangon(el)};$('#pa').onchange=x=>{S.alasan=x.target.value;V.pesangon(el)};$('#pt').onchange=x=>{if(x.target.value){S.tgl=x.target.value;V.pesangon(el)}};
 $$('[data-k]',el).forEach(i=>i.onchange=()=>{S[i.dataset.k]=+i.value||0;V.pesangon(el)});
 $('#pc').onclick=()=>printDoc('Kompensasi PHK '+e.nama,pesBody(S,r));
};

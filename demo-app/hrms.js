/* Mantam Suite · modul HRMS: mesin payroll + tampilan */
const HR={d:null,P:null,
 init(){
  const saved=Store.get('hr',null),ver=2;
  if(saved&&saved.ver===ver&&saved.edition===CONFIG.edition){this.d=saved.d;this.P=saved.P;return}
  this.reset();
 },
 reset(){
  const S=JSON.parse(JSON.stringify(HR_SEED));
  if(DEMO()){S.emps=S.emps.slice(0,12);const ids=new Set(S.emps.map(e=>e.id));S.cuti=S.cuti.filter(c=>ids.has(c.id)).slice(0,10);S.latih=S.latih.filter(c=>ids.has(c.id)).slice(0,8);S.low=S.low.slice(0,3);S.cand=S.cand.filter(c=>S.low.some(l=>l.kode===c.kode)).slice(0,14)}
  this.d={emps:S.emps,cuti:S.cuti,latih:S.latih,low:S.low,cand:S.cand,depts:S.depts};
  this.P={company:'PT Nusantara Karya Mandiri (contoh)',bulan:10,tahun:2026,hariKerja:22,jam:173,mult:1.75,transport:25000,makan:30000,rep:'2026-10-31',jatah:12,bjPct:.05,bjMax:6e6,
   bpjs:S.bpjs,ptkp:S.ptkp,bracket:S.bracket,ter:S.ter,grade:S.grade,rating:S.rating,kpiN:S.kpiN,kpiW:S.kpiW,box:S.box,hol:S.hol,
   thrH:85,thrM:70,potH:4,potM:3};
  this.save();
 },
 save(){Store.set('hr',{ver:2,edition:CONFIG.edition,d:this.d,P:this.P})},
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
 saldo(e){const P=this.P,hak=e.st==='Resign'||this.masa(e)<1?0:P.jatah;let pakai=0,tunggu=0;
  this.d.cuti.forEach(c=>{if(c.id!==e.id||c.jenis!=='Tahunan'||dt(c.mulai).getFullYear()!==P.tahun)return;const n=this.netDays(c.mulai,c.selesai);if(c.status==='Disetujui')pakai+=n;if(c.status==='Menunggu')tunggu+=n});
  return {hak,pakai,tunggu,sisa:hak-pakai}},
 score(e){if(!e.kpi)return null;const w=this.P.kpiW;return Math.round(e.kpi.reduce((s,v,i)=>s+v*w[i],0)/w.reduce((a,b)=>a+b,0)*10)/10},
 rating(s){let r=this.P.rating[0];this.P.rating.forEach(x=>{if(s>=x[0])r=x});return r},
 boxOf(e){const s=this.score(e);if(s==null||e.pot==null)return null;const P=this.P,pl=s>=P.thrH?3:s>=P.thrM?2:1,po=e.pot>=P.potH?3:e.pot>=P.potM?2:1;return (pl-1)*3+po}
};
const ST_C={Tetap:'ok',Kontrak:'info',Probation:'warn',Magang:'warn',Resign:'bad'};
const DEPTS=()=>HR.d.depts;
function empOptions(sel){return HR.d.emps.map(e=>`<option value="${e.id}" ${e.id===sel?'selected':''}>${e.id} · ${esc(e.nama)}</option>`).join('')}
function opts(arr,sel){return arr.map(x=>`<option ${x===sel?'selected':''}>${esc(x)}</option>`).join('')}

const V={}; /* tampilan */
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
  const q=(App.q||'').toLowerCase();let fd='',fs='';
  el.innerHTML=`<div class="tools"><select class="sel" id="fd"><option value="">Semua departemen</option>${opts(DEPTS())}</select><select class="sel" id="fs"><option value="">Semua status</option>${opts(['Tetap','Kontrak','Probation','Magang','Resign'])}</select><span class="sp"></span><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn pri" id="ad">${ico('plus')} Tambah karyawan</button></div><div class="tbl" id="tb"></div>`;
  $('#ex').classList.toggle('lk',DEMO());
  const draw=()=>{const rows=HR.d.emps.filter(e=>(!fd||e.dept===fd)&&(!fs||e.st===fs)&&(!q||(e.nama+e.id+e.jab+e.dept).toLowerCase().includes(q)));
   dataTable($('#tb'),[{h:'Karyawan',v:r=>r.nama,r:r=>`<span class="av">${initials(r.nama)}</span><b>${esc(r.nama)}</b> <small style="color:var(--mute)">${r.id}</small>`},{h:'Departemen',k:'dept'},{h:'Jabatan',v:r=>r.jab,r:r=>`${esc(r.jab)} <small style="color:var(--mute)">${r.grade}</small>`},{h:'Status',k:'st',r:r=>pill(r.st,ST_C[r.st]||'mut')},{h:'Masuk',k:'masuk',f:fdate},{h:'Masa kerja',n:1,v:r=>HR.masa(r),f:null,r:r=>HR.masa(r).toFixed(1).replace('.',',')+' thn'},{h:'Gaji pokok',n:1,k:'gaji',r:r=>idr(r.gaji)},{h:'PTKP',k:'ptkp'}],rows,{click:r=>empForm(r)})};
  $('#fd').onchange=e=>{fd=e.target.value;draw()};$('#fs').onchange=e=>{fs=e.target.value;draw()};
  $('#ad').onclick=()=>{if(DEMO()&&HR.d.emps.length>=12)return lock('Karyawan lebih dari 12 orang');empForm(null)};
  $('#ex').onclick=gate('Ekspor data karyawan',()=>download('karyawan.csv',toCSV([['ID','Nama','Departemen','Jabatan','Grade','Status','Masuk','PTKP','Gaji','Tunjangan'],...HR.d.emps.map(e=>[e.id,e.nama,e.dept,e.jab,e.grade,e.st,e.masuk,e.ptkp,e.gaji,e.tun])])));
  draw();
};
function empForm(e){
  const n=!e;e=e||{id:'K-'+String(HR.d.emps.length+1).padStart(3,'0'),nama:'',g:'L',lahir:'1995-01-01',dept:DEPTS()[0],jab:'Staf',grade:'G2',st:'Tetap',masuk:HR.P.rep,ptkp:'TK/0',gaji:7000000,tun:700000,atasan:'-',lok:'Jakarta',keluar:null,k1:null,abs:{hadir:22,sakit:0,izin:0,cuti:0,alpa:0,lembur:0,bonus:0,lain:0},kpi:null,pot:null};
  const f=(l,id,v,t='text',full)=>`<div class="${full?'full':''}"><label>${l}</label><input class="inp" id="f_${id}" type="${t}" value="${esc(v??'')}"></div>`;
  const s=(l,id,list,v)=>`<div><label>${l}</label><select class="sel" id="f_${id}">${opts(list,v)}</select></div>`;
  modal(n?'Tambah karyawan':'Ubah karyawan',`<div class="form">${f('Nama lengkap','nama',e.nama,'text',1)}${s('Gender','g',['L','P'],e.g)}${f('Tanggal lahir','lahir',e.lahir,'date')}${s('Departemen','dept',DEPTS(),e.dept)}${f('Jabatan','jab',e.jab)}${s('Grade','grade',HR.P.grade.map(g=>g[0]),e.grade)}${s('Status kerja','st',['Tetap','Kontrak','Probation','Magang','Resign'],e.st)}${f('Tanggal masuk','masuk',e.masuk,'date')}${s('Status PTKP','ptkp',HR.P.ptkp.map(p=>p[0]),e.ptkp)}${f('Gaji pokok (Rp)','gaji',e.gaji,'number')}${f('Tunjangan tetap (Rp)','tun',e.tun,'number')}${f('Atasan','atasan',e.atasan)}${f('Lokasi','lok',e.lok)}${f('Tanggal keluar (jika resign)','keluar',e.keluar,'date')}${f('Akhir kontrak','k1',e.k1,'date')}</div>`,
  {buttons:[...(n?[]:[{text:'Hapus',cls:'dng',fn:()=>{if(!confirm('Hapus karyawan ini?'))return false;HR.d.emps=HR.d.emps.filter(x=>x!==e);HR.save();App.render();toast('Karyawan dihapus')}}]),{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{
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
  el.innerHTML=`<div class="tools"><select class="sel" id="pb">${MN.map((m,i)=>`<option value="${i+1}" ${i+1===P.bulan?'selected':''}>${m}</option>`).join('')}</select><select class="sel" id="pt">${[2025,2026,2027].map(y=>`<option ${y===P.tahun?'selected':''}>${y}</option>`).join('')}</select>${P.bulan>=12?pill('PPh 21 progresif (masa pajak terakhir)','info'):pill('PPh 21 metode TER','info')}<span class="sp"></span><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn pri" id="sl">${ico('file')} Slip gaji</button></div>
  <div class="grid g4" style="margin-bottom:14px"><div class="card kpi"><small>Total pendapatan bruto</small><b>${juta(sum('pend'))}</b></div><div class="card kpi"><small>Total PPh 21</small><b>${juta(sum('O'))}</b></div><div class="card kpi"><small>BPJS perusahaan</small><b>${juta(sum('U'))}</b></div><div class="card kpi"><small>Gaji bersih (THP)</small><b>${juta(sum('T'))}</b></div></div>
  <div class="tbl" style="max-height:calc(100vh - 330px)" id="tb"></div>`;
  $('#ex').classList.toggle('lk',DEMO());$('#sl').classList.toggle('lk',DEMO());
  $('#pb').onchange=e=>{P.bulan=+e.target.value;if(DEMO()&&P.bulan>=12){P.bulan=11;lock('PPh 21 progresif Desember')}HR.save();App.render()};$('#pt').onchange=e=>{P.tahun=+e.target.value;HR.save();App.render()};
  const col=(h,k,o={})=>({h,n:1,v:r=>r.c[k],r:r=>(o.b?'<b>':'')+fmt(r.c[k])+(o.b?'</b>':''),sum:1});
  dataTable($('#tb'),[{h:'Karyawan',v:r=>r.e.nama,r:r=>`<span class="av">${initials(r.e.nama)}</span>${esc(r.e.nama)}`},{h:'PTKP',v:r=>r.e.ptkp,r:r=>`${r.e.ptkp} <small style="color:var(--mute)">${r.c.cat}</small>`},col('Gaji pokok','F'),col('Tunjangan','G'),{h:'Transport+makan',n:1,v:r=>r.c.H+r.c.I,r:r=>fmt(r.c.H+r.c.I),sum:1},col('Lembur','J'),col('Bonus','K'),col('Pot. alpa','L'),col('PPh 21','O'),col('BPJS karyawan','Pj',{}),col('THP','T',{b:1}),col('Biaya perusahaan','V')].map((c,i)=>i===9?{h:'BPJS karyawan',n:1,v:r=>r.c.Pj+r.c.Q+r.c.R,r:r=>fmt(r.c.Pj+r.c.Q+r.c.R),sum:1}:c),pay,{total:1,click:r=>slipView(r)});
  $('#ex').onclick=gate('Ekspor payroll',()=>download(`payroll-${P.tahun}-${P.bulan}.csv`,toCSV([['ID','Nama','Gaji pokok','Tunjangan','Transport','Makan','Lembur','Bonus','Pot. alpa','PPh21','JHT','JP','Kes','Pot. lain','THP','BPJS perusahaan','Total biaya'],...pay.map(x=>[x.e.id,x.e.nama,x.c.F,x.c.G,x.c.H,x.c.I,x.c.J,x.c.K,x.c.L,x.c.O,x.c.Pj,x.c.Q,x.c.R,x.c.S,x.c.T,x.c.U,x.c.V])])));
  $('#sl').onclick=()=>pay[0]&&slipView(pay.find(x=>x.e.st!=='Resign'));
};
function slipView(r){
  if(DEMO())return lock('Slip gaji siap cetak');
  const {e,c}=r,P=HR.P,row=(a,b)=>`<tr><td>${a}</td><td style="text-align:right">${fmt(b)}</td></tr>`;
  const m=modal('Slip gaji',`<div class="slip" id="slipbox"><h2>${esc(P.company)}</h2><div style="color:#64748b;margin-bottom:12px">SLIP GAJI · ${MN[P.bulan-1]} ${P.tahun}</div><table style="margin-bottom:14px"><tr><td><b>${esc(e.nama)}</b> (${e.id})</td><td>${esc(e.jab)} · ${e.grade}</td></tr><tr><td>${e.dept}</td><td>PTKP ${e.ptkp} · masa kerja ${HR.masa(e).toFixed(1).replace('.',',')} thn</td></tr></table>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><div><b>PENDAPATAN</b><table>${row('Gaji pokok',c.F)}${row('Tunjangan tetap',c.G)}${row('Transport',c.H)}${row('Makan',c.I)}${row('Lembur',c.J)}${row('Bonus',c.K)}<tr><td><b>Jumlah</b></td><td style="text-align:right"><b>${fmt(c.pend)}</b></td></tr></table></div>
  <div><b>POTONGAN</b><table>${row('Alpa',c.L)}${row('PPh 21',c.O)}${row('BPJS JHT',c.Pj)}${row('BPJS JP',c.Q)}${row('BPJS Kesehatan',c.R)}${row('Potongan lain',c.S)}<tr><td><b>Jumlah</b></td><td style="text-align:right"><b>${fmt(c.L+c.O+c.Pj+c.Q+c.R+c.S)}</b></td></tr></table></div></div>
  <div style="margin-top:16px;padding:12px 16px;background:#0b1a30;color:#fff;border-radius:10px;display:flex;justify-content:space-between"><b>GAJI BERSIH DITERIMA</b><b style="font-size:18px">${idr(c.T)}</b></div><p style="font-size:11px;color:#64748b;margin-top:12px">BPJS ditanggung perusahaan ${idr(c.U)} · Total biaya perusahaan ${idr(c.V)}. Dokumen ini dihasilkan otomatis.</p></div>`,{w:'780px',buttons:[{text:'Tutup'},{text:'Cetak',cls:'pri',fn:()=>{window.print();return false}}]});
}
V.cuti=el=>{
  let tab='saldo';
  const draw=()=>{
   el.innerHTML=`<div class="tabs"><button data-t="saldo" class="${tab==='saldo'?'on':''}">Saldo cuti</button><button data-t="log" class="${tab==='log'?'on':''}">Pengajuan</button></div><div id="tb"></div>`;
   $$('.tabs button',el).forEach(b=>b.onclick=()=>{tab=b.dataset.t;draw()});
   if(tab==='saldo'){$('#tb').className='tbl';dataTable($('#tb'),[{h:'Karyawan',v:r=>r.nama,r:r=>`<span class="av">${initials(r.nama)}</span>${esc(r.nama)}`},{h:'Dept',k:'dept'},{h:'Hak',n:1,v:r=>HR.saldo(r).hak},{h:'Terpakai',n:1,v:r=>HR.saldo(r).pakai},{h:'Menunggu',n:1,v:r=>HR.saldo(r).tunggu},{h:'Sisa',n:1,v:r=>HR.saldo(r).sisa,r:r=>`<b>${HR.saldo(r).sisa}</b>`},{h:'Status',v:r=>HR.saldo(r).sisa,r:r=>{const s=HR.saldo(r);return r.st==='Resign'?pill('Resign','mut'):s.hak===0?pill('Belum berhak','mut'):s.sisa<=0?pill('Habis','bad'):s.sisa<=3?pill('Menipis','warn'):pill('Cukup','ok')}}],HR.d.emps)}
   else{$('#tb').className='';$('#tb').innerHTML=`<div class="tools"><span class="sp"></span><button class="btn pri" id="ad">${ico('plus')} Ajukan cuti</button></div><div class="tbl" id="lg"></div>`;
    dataTable($('#lg'),[{h:'Karyawan',v:r=>nm(r.id),r:r=>esc(nm(r.id))+` <small style="color:var(--mute)">${r.id}</small>`},{h:'Jenis',k:'jenis'},{h:'Mulai',k:'mulai',f:fdate},{h:'Selesai',k:'selesai',f:fdate},{h:'Hari kerja',n:1,v:r=>HR.netDays(r.mulai,r.selesai)},{h:'Status',k:'status',r:r=>pill(r.status,{Disetujui:'ok',Menunggu:'warn',Ditolak:'bad'}[r.status])},{h:'',r:r=>r.status==='Menunggu'?`<button class="btn sm" data-a="ok">Setujui</button> <button class="btn sm dng" data-a="no">Tolak</button>`:''}],HR.d.cuti,{after:(t,rs)=>$$('button[data-a]',t).forEach(b=>b.onclick=()=>{const r=rs[+b.closest('tr').dataset.r];r.status=b.dataset.a==='ok'?'Disetujui':'Ditolak';HR.save();draw();toast('Status diperbarui')})});
    $('#ad').onclick=()=>modal('Ajukan cuti',`<div class="form"><div class="full"><label>Karyawan</label><select class="sel" id="c_id">${empOptions()}</select></div><div><label>Jenis</label><select class="sel" id="c_j">${opts(['Tahunan','Sakit','Melahirkan','Izin Khusus','Tanpa Gaji'])}</select></div><div></div><div><label>Mulai</label><input class="inp" type="date" id="c_a" value="${HR.P.rep}"></div><div><label>Selesai</label><input class="inp" type="date" id="c_b" value="${HR.P.rep}"></div></div>`,{buttons:[{text:'Batal'},{text:'Ajukan',cls:'pri',fn:()=>{const a=$('#c_a').value,b=$('#c_b').value;if(!a||!b||b<a){toast('Tanggal tidak valid');return false}HR.d.cuti.push({id:$('#c_id').value,jenis:$('#c_j').value,mulai:a,selesai:b,status:'Menunggu'});HR.save();draw();toast('Pengajuan dicatat')}}]})}
  };
  const nm=id=>(HR.d.emps.find(e=>e.id===id)||{}).nama||id;draw();
};
const STAGES=['Lamaran','Screening','Interview HR','Interview User','Penawaran','Diterima','Ditolak'];
V.rekrutmen=el=>{
  const lows=HR.d.low;
  el.innerHTML=`<div class="grid g32" style="margin-bottom:16px"><div class="card"><h3>Lowongan</h3><div class="tbl" id="lw"></div></div><div class="card"><h3>Ringkasan</h3><div id="rs"></div></div></div><div class="tools"><h3 style="margin:0">Papan kandidat</h3><span class="sp"></span><button class="btn pri" id="ad">${ico('plus')} Tambah kandidat</button></div><div class="kan" id="kb"></div>`;
  dataTable($('#lw'),[{h:'Kode',k:'kode'},{h:'Posisi',k:'posisi'},{h:'Dept',k:'dept'},{h:'Butuh',n:1,k:'butuh'},{h:'Pelamar',n:1,v:l=>HR.d.cand.filter(c=>c.kode===l.kode).length},{h:'Diterima',n:1,v:l=>HR.d.cand.filter(c=>c.kode===l.kode&&c.tahap==='Diterima').length},{h:'Status',k:'status',r:l=>pill(l.status,l.status==='Dibuka'?'ok':'mut')}],lows);
  const cnt=STAGES.map(s=>HR.d.cand.filter(c=>c.tahap===s).length);hBars($('#rs'),STAGES,cnt,{fmt:v=>v});
  const kb=()=>{$('#kb').innerHTML=STAGES.map(s=>`<div class="col"><h5>${s}<b>${HR.d.cand.filter(c=>c.tahap===s).length}</b></h5>${HR.d.cand.filter(c=>c.tahap===s).slice(0,12).map(c=>`<div class="cd"><b>${esc(c.nama)}</b><small>${esc((lows.find(l=>l.kode===c.kode)||{}).posisi||c.kode)}<br>${c.sumber} · harapan ${juta(c.harap)}</small><div class="mv">${STAGES.indexOf(s)>0&&s!=='Ditolak'?`<button class="btn sm" data-id="${c.id}" data-d="-1">◀</button>`:''}${s!=='Diterima'&&s!=='Ditolak'?`<button class="btn sm" data-id="${c.id}" data-d="1">▶</button>`:''}</div></div>`).join('')}</div>`).join('');
   $$('#kb button').forEach(b=>b.onclick=()=>{const c=HR.d.cand.find(x=>x.id===b.dataset.id);c.tahap=STAGES[STAGES.indexOf(c.tahap)+ +b.dataset.d];HR.save();V.rekrutmen(el)})};kb();
  $('#ad').onclick=()=>modal('Tambah kandidat',`<div class="form"><div class="full"><label>Nama kandidat</label><input class="inp" id="k_n"></div><div><label>Lowongan</label><select class="sel" id="k_l">${lows.map(l=>`<option value="${l.kode}">${l.kode} · ${esc(l.posisi)}</option>`).join('')}</select></div><div><label>Sumber</label><select class="sel" id="k_s">${opts(['LinkedIn','Jobstreet','Referral','Situs Karier','Kampus','Walk-in'])}</select></div><div class="full"><label>Gaji harapan (Rp)</label><input class="inp" type="number" id="k_g" value="8000000"></div></div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const n=$('#k_n').value.trim();if(!n){toast('Nama wajib diisi');return false}HR.d.cand.push({id:'C-'+String(HR.d.cand.length+1).padStart(3,'0'),kode:$('#k_l').value,nama:n,sumber:$('#k_s').value,tahap:'Lamaran',lamar:HR.P.rep,harap:+$('#k_g').value||0});HR.save();V.rekrutmen(el);toast('Kandidat ditambahkan')}}]});
};
V.kinerja=el=>{
  let tab='nilai';const P=HR.P;
  const draw=()=>{
   el.innerHTML=`<div class="tabs"><button data-t="nilai" class="${tab==='nilai'?'on':''}">Penilaian KPI</button><button data-t="box" class="${tab==='box'?'on':''}">Talent 9-Box</button><button data-t="suk" class="${tab==='suk'?'on':''}">Suksesi</button></div><div id="tb"></div>`;
   $$('.tabs button',el).forEach(b=>b.onclick=()=>{if(DEMO()&&b.dataset.t!=='nilai')return lock('Talent 9-Box dan Suksesi');tab=b.dataset.t;draw()});
   const emps=HR.d.emps.filter(e=>e.st!=='Resign');
   if(tab==='nilai'){$('#tb').innerHTML=`<div class="tbl"><table><thead><tr><th>Karyawan</th>${P.kpiN.map((k,i)=>`<th class="n">${k}<br><small>${P.kpiW[i]}%</small></th>`).join('')}<th class="n">Potensi</th><th class="n">Skor</th><th>Rating</th><th class="n">Bonus usulan</th><th class="n">Kenaikan</th></tr></thead><tbody>${emps.map(e=>{const s=HR.score(e),r=s==null?null:HR.rating(s);return `<tr><td><span class="av">${initials(e.nama)}</span>${esc(e.nama)}</td>${P.kpiN.map((k,i)=>`<td class="n"><input class="inp" style="width:62px;text-align:right" type="number" min="0" max="100" data-e="${e.id}" data-k="${i}" value="${e.kpi?e.kpi[i]:''}"></td>`).join('')}<td class="n"><input class="inp" style="width:62px;text-align:right" type="number" min="1" max="5" step=".1" data-e="${e.id}" data-k="p" value="${e.pot??''}"></td><td class="n"><b>${s??'-'}</b></td><td>${r?pill(r[1]+' · '+r[2],r[1]==='A'||r[1]==='B'?'ok':r[1]==='C'?'info':'bad'):'-'}</td><td class="n">${r?fmt(r[3]*e.gaji):'-'}</td><td class="n">${r?pct(r[4],0):'-'}</td></tr>`}).join('')}</tbody></table></div>`;
    $$('input',el).forEach(i=>i.onchange=()=>{const e=HR.d.emps.find(x=>x.id===i.dataset.e);if(i.dataset.k==='p')e.pot=i.value===''?null:+i.value;else{e.kpi=e.kpi||[0,0,0,0,0];e.kpi[+i.dataset.k]=Math.max(0,Math.min(100,+i.value||0))}HR.save();draw()})}
   else if(tab==='box'){const cells={};emps.forEach(e=>{const b=HR.boxOf(e);if(b)(cells[b]=cells[b]||[]).push(e)});
    const col={9:'#bbf7d0',8:'#dcfce7',6:'#dcfce7',7:'#fef9c3',5:'#fef9c3',3:'#fef9c3',4:'#ffedd5',2:'#ffedd5',1:'#fecaca'};
    $('#tb').innerHTML=`<div class="card"><h3>Matriks 9-box <small>kinerja (skor KPI) × potensi</small></h3><div class="nb"><div></div><div class="h">Kinerja rendah</div><div class="h">Kinerja sedang</div><div class="h">Kinerja tinggi</div>${[3,2,1].map(po=>`<div class="h">Potensi ${['','rendah','sedang','tinggi'][po]}</div>`+[1,2,3].map(pl=>{const b=(pl-1)*3+po,l=cells[b]||[];return `<div class="c" style="background:${col[b]};color:#14342a" title="${esc(P.box[b-1][1])}"><b>${esc(P.box[b-1][0])}</b><div class="n">${l.length}</div><small>${l.slice(0,3).map(e=>esc(e.nama.split(' ')[0])).join(', ')}${l.length>3?'…':''}</small></div>`}).join('')).join('')}</div></div>`}
   else{const rows=emps.filter(e=>HR.boxOf(e)).map(e=>({e,k:e.pot*10000+HR.score(e)*10})).sort((a,b)=>b.k-a.k).slice(0,10);
    $('#tb').className='tbl';dataTable($('#tb'),[{h:'#',v:r=>0,r:r=>rows.indexOf(r)+1},{h:'Nama',v:r=>r.e.nama,r:r=>`<span class="av">${initials(r.e.nama)}</span>${esc(r.e.nama)}`},{h:'Departemen',v:r=>r.e.dept},{h:'Jabatan',v:r=>r.e.jab},{h:'Skor',n:1,v:r=>HR.score(r.e)},{h:'Potensi',n:1,v:r=>r.e.pot},{h:'Kotak',v:r=>P.box[HR.boxOf(r.e)-1][0]},{h:'Tindakan',v:r=>P.box[HR.boxOf(r.e)-1][1],r:r=>`<span style="white-space:normal;display:block;min-width:260px">${esc(P.box[HR.boxOf(r.e)-1][1])}</span>`}],rows)}
  };draw();
};
V.pelatihan=el=>{
  const ds=DEPTS();const nm=id=>(HR.d.emps.find(e=>e.id===id)||{}).nama||id;
  el.innerHTML=`<div class="grid g32"><div class="card"><h3>Log pelatihan</h3><div class="tools"><span class="sp"></span><button class="btn pri" id="ad">${ico('plus')} Catat pelatihan</button></div><div class="tbl" id="tb" style="max-height:60vh"></div></div><div class="card"><h3>Jam pelatihan per departemen</h3><div id="c1"></div><h3 style="margin-top:18px">Biaya <small>jt Rp</small></h3><div id="c2"></div></div></div>`;
  dataTable($('#tb'),[{h:'Karyawan',v:r=>nm(r.id)},{h:'Pelatihan',k:'nama'},{h:'Kategori',k:'kat'},{h:'Tanggal',k:'tgl',f:fdate},{h:'Jam',n:1,k:'jam'},{h:'Biaya',n:1,k:'biaya',r:r=>fmt(r.biaya)}],HR.d.latih,{total:1});
  const dep=d=>HR.d.latih.filter(l=>(HR.d.emps.find(e=>e.id===l.id)||{}).dept===d);
  hBars($('#c1'),ds,ds.map(d=>dep(d).reduce((s,l)=>s+l.jam,0)),{fmt:v=>v});hBars($('#c2'),ds,ds.map(d=>dep(d).reduce((s,l)=>s+l.biaya,0)/1e6),{fmt:v=>fmt(v)});
  $('#ad').onclick=()=>modal('Catat pelatihan',`<div class="form"><div class="full"><label>Karyawan</label><select class="sel" id="l_id">${empOptions()}</select></div><div class="full"><label>Nama pelatihan</label><input class="inp" id="l_n"></div><div><label>Kategori</label><select class="sel" id="l_k">${opts(['Teknis','Kepemimpinan','Soft Skill','Kepatuhan & K3','Digital'])}</select></div><div><label>Tanggal</label><input class="inp" type="date" id="l_t" value="${HR.P.rep}"></div><div><label>Jam</label><input class="inp" type="number" id="l_j" value="8"></div><div><label>Biaya (Rp)</label><input class="inp" type="number" id="l_b" value="1000000"></div></div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{if(!$('#l_n').value.trim()){toast('Nama pelatihan wajib diisi');return false}HR.d.latih.push({id:$('#l_id').value,nama:$('#l_n').value.trim(),kat:$('#l_k').value,tgl:$('#l_t').value,jam:+$('#l_j').value||0,biaya:+$('#l_b').value||0,penyelenggara:'Internal'});HR.save();V.pelatihan(el);toast('Pelatihan dicatat')}}]});
};
V.pengaturan=el=>{
  const P=HR.P;
  el.innerHTML=`<div class="note">Tarif BPJS, PTKP, dan tabel TER adalah nilai acuan yang dapat berubah. Verifikasi dengan peraturan resmi (PP 58/2023, PMK 168/2023, ketentuan BPJS terbaru) sebelum dipakai untuk penggajian nyata.</div>
  <div class="grid g2"><div class="card"><h3>Perusahaan & periode</h3><div class="form"><div class="full"><label>Nama perusahaan</label><input class="inp" data-p="company" value="${esc(P.company)}"></div><div><label>Hari kerja bulan ini</label><input class="inp" type="number" data-p="hariKerja" value="${P.hariKerja}"></div><div><label>Pembagi upah per jam</label><input class="inp" type="number" data-p="jam" value="${P.jam}"></div><div><label>Pengali lembur rata-rata</label><input class="inp" type="number" step=".05" data-p="mult" value="${P.mult}"></div><div><label>Jatah cuti tahunan</label><input class="inp" type="number" data-p="jatah" value="${P.jatah}"></div><div><label>Tunjangan transport / hari hadir</label><input class="inp" type="number" data-p="transport" value="${P.transport}"></div><div><label>Tunjangan makan / hari hadir</label><input class="inp" type="number" data-p="makan" value="${P.makan}"></div><div><label>Biaya jabatan (%)</label><input class="inp" type="number" step=".01" data-p="bjPct" value="${P.bjPct}"></div><div><label>Biaya jabatan maks / tahun</label><input class="inp" type="number" data-p="bjMax" value="${P.bjMax}"></div></div></div>
  <div class="card"><h3>Tarif BPJS</h3><div class="tbl"><table><thead><tr><th>Komponen</th><th class="n">Perusahaan</th><th class="n">Karyawan</th><th class="n">Batas upah</th></tr></thead><tbody>${P.bpjs.map((b,i)=>`<tr><td>${b[0]}</td><td class="n"><input class="inp" style="width:80px;text-align:right" type="number" step=".0001" data-b="${i}.1" value="${b[1]}"></td><td class="n"><input class="inp" style="width:80px;text-align:right" type="number" step=".0001" data-b="${i}.2" value="${b[2]}"></td><td class="n"><input class="inp" style="width:130px;text-align:right" type="number" data-b="${i}.3" value="${b[3]}"></td></tr>`).join('')}</tbody></table></div><p style="color:var(--mute);font-size:12px">Batas 9.999.999.999 = tanpa batas. Tarif JKK mengikuti kelas risiko usaha.</p>
  <h3 style="margin-top:14px">PTKP & kategori TER</h3><div class="tbl"><table><thead><tr><th>Status</th><th class="n">PTKP / tahun</th><th>Kategori</th></tr></thead><tbody>${P.ptkp.map(p=>`<tr><td>${p[0]}</td><td class="n">${fmt(p[1])}</td><td>${p[2]}</td></tr>`).join('')}</tbody></table></div></div></div>
  <div class="card" style="margin-top:16px"><h3>Data & aplikasi</h3><div class="tools"><button class="btn" id="bk">${ico('down')} Cadangkan data (JSON)</button><button class="btn dng" id="rs">Kembalikan data contoh</button><span class="sp"></span><button class="btn" id="th">${ico('moon')} Tema gelap/terang</button></div><p style="color:var(--mute);margin:8px 0 0">Data tersimpan di komputer ini saja. Edisi: <b>${DEMO()?'Demo (terbatas)':'Lengkap · '+esc(CONFIG.buyer)}</b>. Produk diberikan sebagaimana adanya, tanpa layanan garansi, pembaruan, maupun dukungan.</p></div>`;
  $$('[data-p]',el).forEach(i=>i.onchange=()=>{const k=i.dataset.p;P[k]=i.type==='number'?+i.value:i.value;HR.save();toast('Pengaturan disimpan')});
  $$('[data-b]',el).forEach(i=>i.onchange=()=>{const [a,b]=i.dataset.b.split('.').map(Number);P.bpjs[a][b]=+i.value;HR.save();toast('Tarif disimpan')});
  $('#bk').onclick=gate('Cadangan data',()=>download('mantam-hrms-cadangan.json',JSON.stringify({d:HR.d,P:HR.P}),'application/json'));
  $('#rs').onclick=()=>{if(confirm('Semua perubahan akan hilang. Lanjutkan?')){HR.reset();App.render();toast('Data contoh dikembalikan')}};
  $('#th').onclick=()=>App.theme();
};

/* Mantam Suite · modul Finance & Accounting */
const FIN={d:null,
 init(){const s=Store.get('fin',null);if(s&&s.ver===2&&s.edition===CONFIG.edition){this.d=s.d;return}this.reset()},
 reset(){this.d=JSON.parse(JSON.stringify(DEMO()?FIN_DEMO:FIN_FULL));this.d.sel=this.d.bulan;this.d.lock='';const o=this.sums(this.start(1),this.end(this.d.bulan),false);this.d.budget={};this.d.coa.forEach(a=>{if(['Pendapatan','HPP','Beban'].includes(a.t)){const v=this.bal(o,a.k);if(v)this.d.budget[a.k]=Math.round(v/this.d.bulan*1.05/1e5)*1e5}});this.save()},
 blank(){const d=this.d;d.ent=[];d.jual=[];d.beli=[];d.pays=[];d.aset=[];d.loans=[];d.ob={};d.budget={};d.lock='';this.save()},
 save(){Store.set('fin',{ver:2,edition:CONFIG.edition,d:this.d})},
 acc(k){return this.d.coa.find(a=>a.k===+k)||{k,n:'?',t:'Aset',g:''}},
 dn(a){return ['Aset','HPP','Beban'].includes(a.t)||a.k===7100?1:-1}, /* +1 normal debit */
 end(m){return iso(new Date(this.d.tahun,m,0))},start(m){return `${this.d.tahun}-${String(m).padStart(2,'0')}-01`},
 /* saldo per akun (nilai positif = sisi normal) */
 sums(from,to,openBal){const o={};if(openBal)for(const k in this.d.ob)o[k]={d:Math.max(0,this.d.ob[k]),k:Math.max(0,-this.d.ob[k])};
  this.d.ent.forEach(e=>{if((from&&e.d<from)||(to&&e.d>to))return;e.l.forEach(([c,db,kr])=>{const x=o[c]=o[c]||{d:0,k:0};x.d+=db;x.k+=kr})});return o},
 bal(o,k){const x=o[k];if(!x)return 0;const a=this.acc(k);return this.dn(a)>0?x.d-x.k:x.k-x.d},
 /* laba rugi periode */
 pl(m1,m2){const o=this.sums(this.start(m1),this.end(m2),false),g={Pendapatan:0,HPP:0,Beban:0,bunga:0,lain:0},rows=[];
  this.d.coa.filter(a=>['Pendapatan','HPP','Beban','Lain-lain'].includes(a.t)).forEach(a=>{const v=this.bal(o,a.k);if(!v)return;rows.push([a,v]);
   if(a.t==='Lain-lain')g.lain+=a.k===7100?-v:v;else g[a.t]+=v});
  const kotor=g.Pendapatan-g.HPP,oper=kotor-g.Beban,bersih=oper+g.lain;return {rows,rev:g.Pendapatan,hpp:g.HPP,beban:g.Beban,lain:g.lain,kotor,oper,bersih}},
 neraca(m){const o=this.sums(null,this.end(m),true),by={},ytd=this.pl(1,m).bersih;
  this.d.coa.forEach(a=>{if(['Aset','Liabilitas','Ekuitas'].includes(a.t)){const v=this.bal(o,a.k);if(v||a.k===3200)(by[a.g]=by[a.g]||[]).push([a,v])}});
  const tot=g=>(by[g]||[]).reduce((s,x)=>s+x[1],0),aset=tot('Aset Lancar')+tot('Aset Tetap'),lia=tot('Liabilitas Jangka Pendek')+tot('Liabilitas Jangka Panjang'),eq=tot('Ekuitas')+ytd;
  return {by,ytd,aset,lia,eq,selisih:Math.round(aset-lia-eq),tot}},
 chk(date){const l=this.d.lock;if(l&&String(date).slice(0,7)<=l){const m=+l.slice(5,7);toast('Periode sampai '+MN[m-1]+' '+l.slice(0,4)+' sudah ditutup. Buka kembali di menu Tutup Buku untuk mengubahnya.');return false}return true},
 paid(no){return this.d.pays.filter(p=>p.ref===no).reduce((s,p)=>s+p.amt,0)},
 aging(list,asof){return list.map(x=>{const sisa=x.tot-this.paid(x.no);if(sisa<=0||x.d>asof)return null;const dl=Math.round((dt(asof)-dt(x.jt))/864e5);
   const b=dl<=0?0:dl<=30?1:dl<=60?2:dl<=90?3:4;return {x,sisa,dl,b}}).filter(Boolean)},
 saldoKas(m){const o=this.sums(null,this.end(m),true);return this.bal(o,1100)+this.bal(o,1110)},
 nextNo(pre,list){const mx=list.reduce((m,x)=>Math.max(m,+(x.no.split('-')[1])||0),0);return pre+'-'+String(mx+1).padStart(4,'0')},
 post(d,no,ket,l,src){this.d.ent.push({d,no,ket,src:src||'',l:l.filter(x=>x[1]||x[2])});this.d.ent.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:a.no<b.no?-1:1)}
};
const BUCK=['Belum jatuh tempo','1-30 hari','31-60 hari','61-90 hari','>90 hari'];
const mSel=(el,cb,max)=>{const m=FIN.d.sel;el.innerHTML=`<select class="sel" id="mm">${MN.slice(0,FIN.d.bulan).map((n,i)=>`<option value="${i+1}" ${i+1===m?'selected':''}>${n} ${FIN.d.tahun}</option>`).join('')}</select>`;$('#mm',el).onchange=e=>{FIN.d.sel=+e.target.value;FIN.save();cb()}};
const rp=(v)=>v<0?`<span style="color:var(--bad)">(${fmt(-v)})</span>`:fmt(v);

V.f_dashboard=el=>{
  const d=FIN.d,m=d.sel,pl=FIN.pl(1,m),n=FIN.neraca(m),plm=FIN.pl(m,m),ar=FIN.aging(d.jual,FIN.end(m)),ap=FIN.aging(d.beli,FIN.end(m));
  const od=ar.filter(r=>r.b>0).reduce((s,r)=>s+r.sisa,0),k=(t,v,s,i)=>`<div class="card kpi"><span class="ico">${ico(i)}</span><small>${t}</small><b>${v}</b><span class="d">${s}</span></div>`;
  const mth=[...Array(m).keys()].map(i=>i+1),pm=mth.map(i=>FIN.pl(i,i));
  el.innerHTML=`<div class="tools"><span id="ms"></span></div><div class="grid g4">${k('Pendapatan (YTD)',juta(pl.rev),`bulan ini ${juta(plm.rev)}`,'trend')}${k('Laba bersih (YTD)',juta(pl.bersih),`margin ${pct(pl.rev?pl.bersih/pl.rev:0)}`,'cash')}${k('Kas & bank',juta(FIN.saldoKas(m)),'saldo akhir periode','cash')}${k('Piutang jatuh tempo',juta(od),`dari total ${juta(ar.reduce((s,r)=>s+r.sisa,0))}`,'alert')}</div>
  <div class="grid g32" style="margin-top:16px"><div class="card"><h3>Pendapatan vs beban per bulan <small>jt Rp</small></h3><div id="c1"></div></div><div class="card"><h3>Komposisi beban operasional</h3><div id="c2"></div></div></div>
  <div class="grid g3" style="margin-top:16px"><div class="card"><h3>Umur piutang</h3><div id="c3"></div></div><div class="card"><h3>Umur utang</h3><div id="c4"></div></div><div class="card"><h3>Posisi neraca</h3><div style="font-size:13px;line-height:2"><div>Total aset <b style="float:right">${idr(n.aset)}</b></div><div>Total liabilitas <b style="float:right">${idr(n.lia)}</b></div><div>Total ekuitas <b style="float:right">${idr(n.eq)}</b></div><div>Neraca ${n.selisih===0?pill('seimbang','ok'):pill('selisih '+fmt(n.selisih),'bad')}</div></div></div></div>`;
  mSel($('#ms'),()=>App.render());
  const rev=pm.map(x=>x.rev/1e6),bb=pm.map(x=>(x.hpp+x.beban)/1e6);
  barChart($('#c1'),mth.map(i=>MN[i-1].slice(0,3)),rev,{w:620,h:230});
  const bx=pl.rows.filter(r=>r[0].t==='Beban');donut($('#c2'),bx.map(r=>r[0].n.replace('Beban ','')),bx.map(r=>Math.round(r[1]/1e6)),{sub:'jt Rp',center:fmt(pl.beban/1e6)});
  const bk=a=>BUCK.map((_,i)=>a.filter(r=>r.b===i).reduce((s,r)=>s+r.sisa,0)/1e6);hBars($('#c3'),BUCK,bk(ar),{fmt:v=>fmt(v)});hBars($('#c4'),BUCK,bk(ap),{fmt:v=>fmt(v)});
};
const invOf=kind=>kind==='jual'?FIN.d.jual:FIN.d.beli,ptOf=kind=>kind==='jual'?FIN.d.cust:FIN.d.supp;
const invLines=(kind,x)=>kind==='jual'?[[1200,x.tot,0],[x.ak,0,x.dpp],[2200,0,x.ppn]]:[[x.ak,x.dpp,0],[1400,x.ppn,0],[2100,0,x.tot]];
function invForm(kind,x,done){
  const d=FIN.d,L=invOf(kind),pt=ptOf(kind),n=!x,pre=kind==='jual'?'INV':'BIL',ak=kind==='jual'?[4100,4200]:[5100,1300,6500,6400,6300];
  if(!pt.length)return toast('Isi daftar '+(kind==='jual'?'pelanggan':'pemasok')+' di Pengaturan Keuangan');
  if(n&&DEMO()&&L.length>=40)return lock('Faktur tanpa batas');
  x=x||{c:pt[0].n,d:FIN.end(d.sel),ak:ak[0],dpp:25000000};
  modal(n?(kind==='jual'?'Faktur penjualan':'Tagihan pemasok'):'Ubah '+x.no,`<div class="form"><div class="full"><label>${kind==='jual'?'Pelanggan':'Pemasok'}</label><select class="sel" id="i_c">${pt.map(p=>`<option ${p.n===x.c?'selected':''}>${esc(p.n)}</option>`).join('')}</select></div><div><label>Tanggal</label><input class="inp" type="date" id="i_d" value="${x.d}"></div><div><label>Akun</label><select class="sel" id="i_a">${ak.map(k=>`<option value="${k}" ${k===x.ak?'selected':''}>${k} ${FIN.acc(k).n}</option>`).join('')}</select></div><div class="full"><label>DPP (Rp)</label><input class="inp" type="number" id="i_v" value="${x.dpp}"></div><div class="note full">PPN ${pct(d.ppn,0)} dihitung otomatis dan jurnal dibuat otomatis.</div></div>`,
  {buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const dpp=+$('#i_v').value;if(!(dpp>0)){toast('DPP harus lebih dari 0');return false}
    const c=$('#i_c').value,dd=$('#i_d').value,a=+$('#i_a').value,ppn=Math.round(dpp*d.ppn),tot=dpp+ppn,t=(pt.find(p=>p.n===c)||{t:30}).t,jt=iso(new Date(dt(dd).getTime()+t*864e5));
    if(!FIN.chk(dd)||(!n&&!FIN.chk(x.d)))return false;
    if(!n){if(tot<FIN.paid(x.no)){toast('Total baru lebih kecil dari yang sudah dibayar');return false}d.ent=d.ent.filter(e=>!(e.no===x.no&&(e.src==='jual'||e.src==='beli')));Object.assign(x,{c,d:dd,ak:a,dpp,ppn,tot,jt})}
    else{x={no:FIN.nextNo(pre,L),d:dd,c,ak:a,dpp,ppn,tot,jt};L.push(x)}
    FIN.post(dd,x.no,(kind==='jual'?'Penjualan ':'Pembelian ')+c,invLines(kind,x),kind);FIN.save();done();toast(x.no+(n?' tercatat':' diperbarui'))}}]});
}
function delPay(p){const d=FIN.d,i=d.ent.findIndex(e=>e.src==='bayar'&&e.d===p.d&&e.ket.endsWith(p.ref)&&e.l.some(l=>l[1]===p.amt||l[2]===p.amt));if(i>=0)d.ent.splice(i,1);d.pays=d.pays.filter(x=>x!==p)}
function invModal(x,kind,done){
  const d=FIN.d,ps=d.pays.filter(p=>p.ref===x.no),sisa=x.tot-FIN.paid(x.no);
  modal(x.no+' · '+esc(x.c),`<div style="line-height:1.9"><div>Tanggal <b style="float:right">${fdate(x.d)}</b></div><div>Jatuh tempo <b style="float:right">${fdate(x.jt)}</b></div><div>DPP <b style="float:right">${idr(x.dpp)}</b></div><div>PPN <b style="float:right">${idr(x.ppn)}</b></div><div>Total <b style="float:right">${idr(x.tot)}</b></div><div>Sisa <b style="float:right">${idr(sisa)}</b></div></div>
  <h3 style="font-size:14px;margin:14px 0 6px">Pembayaran</h3>${ps.length?`<div class="tbl"><table><tbody>${ps.map((p,i)=>`<tr><td>${fdate(p.d)}</td><td class="n">${fmt(p.amt)}</td><td>${p.ak===1100?'Kas':'Bank'}</td><td><button class="btn sm dng" data-dp="${i}">Hapus</button></td></tr>`).join('')}</tbody></table></div>`:'<p style="color:var(--mute);margin:0">Belum ada pembayaran.</p>'}`,
  {w:'560px',buttons:[{text:'Hapus faktur',cls:'dng',fn:()=>{if(!FIN.chk(x.d)||ps.some(p=>!FIN.chk(p.d))||!confirm('Hapus faktur beserta jurnal dan pembayarannya?'))return false;ps.forEach(delPay);d.ent=d.ent.filter(e=>!(e.no===x.no&&(e.src==='jual'||e.src==='beli')));const L=invOf(kind),i=L.indexOf(x);if(i>=0)L.splice(i,1);FIN.save();done();toast('Faktur dihapus')}},{text:'Tutup'},{text:'Cetak / PDF',fn:()=>{printDoc(x.no,invoiceBody(x,kind));return false}},{text:'Ubah',fn:()=>{setTimeout(()=>invForm(kind,x,done),50)}},...(sisa>0?[{text:'Catat pembayaran',cls:'pri',fn:()=>{setTimeout(()=>payForm(x,kind,done),50)}}]:[])]});
  $$('[data-dp]').forEach(b=>b.onclick=()=>{if(!FIN.chk(ps[+b.dataset.dp].d)||!confirm('Hapus pembayaran ini?'))return;delPay(ps[+b.dataset.dp]);FIN.save();document.querySelectorAll('.mask').forEach(m=>m.remove());done();toast('Pembayaran dihapus')});
}
function invList(el,kind){
  const d=FIN.d,L=invOf(kind),asof=FIN.end(d.sel),lbl=kind==='jual'?'Pelanggan':'Pemasok',redo=()=>V[App.cur](el);
  el.innerHTML=`<div class="tools"><select class="sel" id="fs"><option value="">Semua status</option><option>Lunas</option><option>Sebagian</option><option>Belum dibayar</option><option>Lewat tempo</option></select><span class="sp"></span><button class="btn" id="im">${ico('plus')} Impor CSV</button><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn pri" id="ad">${ico('plus')} ${kind==='jual'?'Faktur penjualan':'Tagihan pemasok'}</button></div><div class="tbl" id="tb"></div>`;
  $('#im').classList.toggle('lk',DEMO());
  $('#ex').classList.toggle('lk',DEMO());
  const st=x=>{const p=FIN.paid(x.no);return p>=x.tot?'Lunas':x.jt<asof?'Lewat tempo':p>0?'Sebagian':'Belum dibayar'},cl={Lunas:'ok',Sebagian:'info','Belum dibayar':'mut','Lewat tempo':'bad'};
  let f='';const draw=()=>dataTable($('#tb'),[{h:'No',k:'no'},{h:'Tanggal',k:'d',f:fdate},{h:lbl,k:'c'},{h:'DPP',n:1,k:'dpp',r:r=>fmt(r.dpp),sum:1},{h:'PPN',n:1,k:'ppn',r:r=>fmt(r.ppn),sum:1},{h:'Total',n:1,k:'tot',r:r=>fmt(r.tot),sum:1},{h:'Terbayar',n:1,v:r=>FIN.paid(r.no),r:r=>fmt(FIN.paid(r.no))},{h:'Jatuh tempo',k:'jt',f:fdate},{h:'Status',v:r=>st(r),r:r=>pill(st(r),cl[st(r)])}],[...L].reverse().filter(x=>!f||st(x)===f),{total:1,click:x=>invModal(x,kind,redo)});
  draw();$('#fs').onchange=e=>{f=e.target.value;draw()};
  $('#ex').onclick=gate('Ekspor faktur',()=>download(kind+'.csv',toCSV([['No','Tanggal',lbl,'DPP','PPN','Total','Terbayar','Jatuh tempo'],...L.map(x=>[x.no,x.d,x.c,x.dpp,x.ppn,x.tot,FIN.paid(x.no),x.jt])])));
  $('#im').onclick=()=>importCSV(kind==='jual'?'Faktur penjualan':'Tagihan pemasok',[{k:'d',h:'Tanggal',t:'date',req:1,ex:'2026-10-15'},{k:'c',h:lbl,req:1,ex:ptOf(kind)[0]?.n||''},{k:'dpp',h:'DPP',t:'num',req:1,ex:'25000000'},{k:'ak',h:'Akun',t:'num',ex:kind==='jual'?'4100':'5100'}],rows=>{if(rows.some(r=>!FIN.chk(r.d)))return false;const pt=ptOf(kind),pre=kind==='jual'?'INV':'BIL';rows.forEach(r=>{const ak=r.ak||(kind==='jual'?4100:5100),ppn=Math.round(r.dpp*d.ppn),tot=r.dpp+ppn,t=(pt.find(p=>p.n===r.c)||{t:30}).t,x={no:FIN.nextNo(pre,L),d:r.d,c:r.c,ak,dpp:r.dpp,ppn,tot,jt:iso(new Date(dt(r.d).getTime()+t*864e5))};L.push(x);FIN.post(r.d,x.no,(kind==='jual'?'Penjualan ':'Pembelian ')+r.c,invLines(kind,x),kind)});FIN.save();redo();return rows.length+' faktur diimpor dan dijurnal'},r=>r.dpp<=0?'DPP harus > 0':(r.ak&&!d.coa.some(a=>a.k===r.ak))?'Akun tidak ada: '+r.ak:'');
  $('#ad').onclick=()=>invForm(kind,null,redo);
}
function payForm(x,kind,done){
  const sisa=x.tot-FIN.paid(x.no);if(sisa<=0)return toast(x.no+' sudah lunas');
  modal((kind==='jual'?'Terima pembayaran ':'Bayar tagihan ')+x.no,`<div class="form"><div class="full"><b>${esc(x.c)}</b> · sisa ${idr(sisa)}</div><div><label>Tanggal</label><input class="inp" type="date" id="p_d" value="${FIN.end(FIN.d.sel)}"></div><div><label>Akun kas/bank</label><select class="sel" id="p_a"><option value="1110">1110 Bank</option><option value="1100">1100 Kas</option></select></div><div class="full"><label>Jumlah (Rp)</label><input class="inp" type="number" id="p_v" value="${sisa}"></div></div>`,{buttons:[{text:'Batal'},{text:'Catat',cls:'pri',fn:()=>{const v=+$('#p_v').value;if(!(v>0)||v>sisa){toast('Jumlah tidak valid (maks '+fmt(sisa)+')');return false}
   const dd=$('#p_d').value;if(!FIN.chk(dd))return false;const ak=+$('#p_a').value,no=(kind==='jual'?'RCV-':'PAY-')+String(FIN.d.pays.length+1).padStart(4,'0');
   FIN.d.pays.push({d:dd,jn:kind==='jual'?'Terima':'Bayar',ref:x.no,amt:v,ak});FIN.post(dd,no,(kind==='jual'?'Terima pembayaran ':'Bayar tagihan ')+x.no,kind==='jual'?[[ak,v,0],[1200,0,v]]:[[2100,v,0],[ak,0,v]],'bayar');FIN.save();done();toast('Pembayaran dicatat')}}]});
}
V.f_penjualan=el=>invList(el,'jual');V.f_pembelian=el=>invList(el,'beli');
function entModal(e,done){
  const man=!e.src;modal((man?'Jurnal manual ':'Jurnal otomatis ')+e.no,`<p style="margin:0 0 8px">${fdate(e.d)} · ${esc(e.ket)}</p><div class="tbl"><table><thead><tr><th>Akun</th><th class="n">Debit</th><th class="n">Kredit</th></tr></thead><tbody>${e.l.map(l=>`<tr><td>${l[0]} ${esc(FIN.acc(l[0]).n)}</td><td class="n">${l[1]?fmt(l[1]):''}</td><td class="n">${l[2]?fmt(l[2]):''}</td></tr>`).join('')}</tbody></table></div>${man?'':'<p style="color:var(--mute);font-size:12.5px;margin-top:10px">Dibuat otomatis; ubah atau hapus lewat halaman asalnya (faktur, pembayaran, aset, atau pinjaman).</p>'}`,{buttons:[...(man?[{text:'Hapus jurnal',cls:'dng',fn:()=>{if(!FIN.chk(e.d)||!confirm('Hapus jurnal ini?'))return false;FIN.d.ent=FIN.d.ent.filter(x=>x!==e);FIN.save();done();toast('Jurnal dihapus')}}]:[]),{text:'Tutup'}]});
}
V.f_jurnal=el=>{
  const q=(App.q||'').toLowerCase();let src='';
  el.innerHTML=`<div class="tools"><select class="sel" id="fs"><option value="">Semua sumber</option><option value="">Semua</option><option value="manual">Jurnal manual</option></select><span class="sp"></span><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn pri" id="ad">${ico('plus')} Jurnal manual</button></div><div class="tbl" id="tb" style="max-height:calc(100vh - 190px)"></div>`;
  $('#ex').classList.toggle('lk',DEMO());
  const rows=[];FIN.d.ent.forEach(e=>e.l.forEach(([c,db,kr],i)=>rows.push({e,c,db,kr,i})));
  const draw=()=>dataTable($('#tb'),[{h:'Tanggal',v:r=>r.e.d,r:r=>r.i?'':fdate(r.e.d)},{h:'No',v:r=>r.e.no,r:r=>r.i?'':r.e.no},{h:'Keterangan',v:r=>r.e.ket,r:r=>r.i?'':esc(r.e.ket)},{h:'Akun',v:r=>r.c,r:r=>`<span style="${r.kr?'padding-left:18px;display:inline-block':''}">${r.c} ${esc(FIN.acc(r.c).n)}</span>`},{h:'Debit',n:1,v:r=>r.db,r:r=>r.db?fmt(r.db):''},{h:'Kredit',n:1,v:r=>r.kr,r:r=>r.kr?fmt(r.kr):''}],rows.filter(r=>(!src||(src==='manual'?!r.e.src:r.e.src===src))&&(!q||(r.e.ket+r.e.no+FIN.acc(r.c).n).toLowerCase().includes(q))).slice(-400).reverse(),{click:r=>entModal(r.e,()=>V.f_jurnal(el))});
  draw();$('#fs').onchange=e=>{src=e.target.value;draw()};
  $('#ex').onclick=gate('Ekspor jurnal',()=>download('jurnal.csv',toCSV([['Tanggal','No','Keterangan','Akun','Nama akun','Debit','Kredit'],...rows.map(r=>[r.e.d,r.e.no,r.e.ket,r.c,FIN.acc(r.c).n,r.db,r.kr])])));
  $('#ad').onclick=()=>{
   const ln=i=>`<tr><td><select class="sel" id="j_a${i}"><option value="">—</option>${FIN.d.coa.map(a=>`<option value="${a.k}">${a.k} ${esc(a.n)}</option>`).join('')}</select></td><td><input class="inp" type="number" id="j_d${i}" style="width:130px"></td><td><input class="inp" type="number" id="j_k${i}" style="width:130px"></td></tr>`;
   modal('Jurnal manual',`<div class="form"><div><label>Tanggal</label><input class="inp" type="date" id="j_t" value="${FIN.end(FIN.d.sel)}"></div><div><label>Keterangan</label><input class="inp" id="j_n"></div></div><div class="tbl" style="margin-top:12px"><table><thead><tr><th>Akun</th><th>Debit</th><th>Kredit</th></tr></thead><tbody>${[0,1,2,3].map(ln).join('')}</tbody></table></div><div id="j_s" style="margin-top:8px;font-size:12.5px;color:var(--mute)">Debit harus sama dengan kredit.</div>`,{w:'680px',buttons:[{text:'Batal'},{text:'Posting',cls:'pri',fn:()=>{const l=[0,1,2,3].map(i=>[+$('#j_a'+i).value,+$('#j_d'+i).value||0,+$('#j_k'+i).value||0]).filter(x=>x[0]&&(x[1]||x[2]));
    const D=l.reduce((s,x)=>s+x[1],0),K=l.reduce((s,x)=>s+x[2],0);if(l.length<2||D!==K||!D){$('#j_s').innerHTML=`<span style="color:var(--bad)">Tidak seimbang: debit ${fmt(D)} · kredit ${fmt(K)}</span>`;return false}
    if(!$('#j_n').value.trim()){toast('Keterangan wajib diisi');return false}
    if(!FIN.chk($('#j_t').value))return false;
    FIN.post($('#j_t').value,'JU-'+String(FIN.d.ent.filter(e=>!e.src).length+1).padStart(3,'0')+'M',$('#j_n').value.trim(),l);FIN.save();App.render();toast('Jurnal diposting')}}]})};
};
V.f_bukubesar=el=>{
  const d=FIN.d;let ak=1110;
  const draw=()=>{const o=d.ob[ak]||0,a=FIN.acc(ak),s=FIN.dn(a);let run=o*s;const rows=[];
   d.ent.filter(e=>e.d<=FIN.end(d.sel)).forEach(e=>e.l.forEach(([c,db,kr])=>{if(c===ak){run+=(db-kr)*s;rows.push({e,db,kr,run})}}));
   $('#tb').innerHTML='';$('#hd').innerHTML=`Saldo awal tahun <b>${idr(Math.abs(o))}</b> · Saldo akhir <b>${idr(run)}</b> · ${rows.length} transaksi`;
   dataTable($('#tb'),[{h:'Tanggal',v:r=>r.e.d,f:null,r:r=>fdate(r.e.d)},{h:'No',v:r=>r.e.no},{h:'Keterangan',v:r=>r.e.ket},{h:'Debit',n:1,v:r=>r.db,r:r=>r.db?fmt(r.db):''},{h:'Kredit',n:1,v:r=>r.kr,r:r=>r.kr?fmt(r.kr):''},{h:'Saldo',n:1,v:r=>r.run,r:r=>'<b>'+fmt(r.run)+'</b>'}],rows)};
  el.innerHTML=`<div class="tools"><select class="sel" id="ak" style="min-width:300px">${d.coa.map(a=>`<option value="${a.k}" ${a.k===ak?'selected':''}>${a.k} · ${esc(a.n)}</option>`).join('')}</select><span id="mm"></span><span class="sp"></span><span id="hd"></span></div><div class="tbl" id="tb" style="max-height:calc(100vh - 190px)"></div>`;
  mSel($('#mm'),draw);$('#ak').onchange=e=>{ak=+e.target.value;draw()};draw();
};
V.f_labarugi=el=>{
  const m=FIN.d.sel,a=FIN.pl(m,m),y=FIN.pl(1,m),pv=m>1?FIN.pl(m-1,m-1):null;
  const line=(l,v,b,v2)=>`<tr${b?' style="font-weight:700;background:rgba(14,165,164,.07)"':''}><td>${l}</td><td class="n">${rp(v)}</td><td class="n">${rp(v2)}</td>${pv!==null?`<td class="n">${b?'':''}</td>`:''}</tr>`;
  const grp=t=>y.rows.filter(r=>r[0].t===t).map(r=>{const am=a.rows.find(x=>x[0].k===r[0].k);return line('&nbsp;&nbsp;'+r[0].k+' '+esc(r[0].n),am?am[1]:0,0,r[1])}).join('');
  el.innerHTML=`<div class="tools"><span id="mm"></span><span class="sp"></span><button class="btn" id="pr">${ico('file')} Cetak</button></div><div class="card"><h3>Laporan laba rugi · ${MN[m-1]} ${FIN.d.tahun}</h3><div class="tbl"><table><thead><tr><th>Uraian</th><th class="n">Bulan ini</th><th class="n">Tahun berjalan</th></tr></thead><tbody>
  ${line('<b>PENDAPATAN</b>',0,0,0).replace(/<td class="n">.*?<\/td>/g,'<td></td>')}${grp('Pendapatan')}${line('Total pendapatan',a.rev,1,y.rev)}
  ${grp('HPP')}${line('Laba kotor',a.kotor,1,y.kotor)}${grp('Beban')}${line('Laba operasional',a.oper,1,y.oper)}${grp('Lain-lain')}${line('LABA BERSIH',a.bersih,1,y.bersih)}
  </tbody></table></div><p style="color:var(--mute);margin-top:10px">Margin laba kotor ${pct(y.rev?y.kotor/y.rev:0)} · margin bersih ${pct(y.rev?y.bersih/y.rev:0)} (tahun berjalan)</p></div>`;
  mSel($('#mm'),()=>App.render());$('#pr').onclick=()=>printDoc('Laba rugi '+MN[m-1],lrBody(m));$('#pr').classList.toggle('lk',DEMO());
};
V.f_neraca=el=>{
  const m=FIN.d.sel,n=FIN.neraca(m),sec=(t,gs)=>`<tr style="font-weight:700;background:rgba(14,165,164,.07)"><td colspan="2">${t}</td></tr>`+gs.map(g=>(n.by[g]||[]).map(([a,v])=>`<tr><td>&nbsp;&nbsp;${a.k} ${esc(a.n)}</td><td class="n">${rp(v)}</td></tr>`).join('')+`<tr><td><i>Jumlah ${g}</i></td><td class="n"><i>${rp(n.tot(g))}</i></td></tr>`).join('');
  el.innerHTML=`<div class="tools"><span id="mm"></span><span class="sp"></span>${n.selisih===0?pill('Neraca seimbang','ok'):pill('Selisih '+fmt(n.selisih),'bad')}<button class="btn ${DEMO()?'lk':''}" id="pr">${ico('file')} Cetak / PDF</button></div><div class="grid g2"><div class="card"><h3>Aset</h3><div class="tbl"><table><tbody>${sec('ASET',['Aset Lancar','Aset Tetap'])}<tr style="font-weight:700"><td>TOTAL ASET</td><td class="n">${rp(n.aset)}</td></tr></tbody></table></div></div>
  <div class="card"><h3>Liabilitas & ekuitas</h3><div class="tbl"><table><tbody>${sec('LIABILITAS',['Liabilitas Jangka Pendek','Liabilitas Jangka Panjang'])}${sec('EKUITAS',['Ekuitas'])}<tr><td>&nbsp;&nbsp;Laba tahun berjalan</td><td class="n">${rp(n.ytd)}</td></tr><tr style="font-weight:700"><td>TOTAL LIABILITAS & EKUITAS</td><td class="n">${rp(n.lia+n.eq)}</td></tr></tbody></table></div></div></div>`;
  mSel($('#mm'),()=>App.render());$('#pr').onclick=()=>printDoc('Neraca '+MN[m-1],nrBody(m));
};
V.f_aging=el=>{
  const asof=FIN.end(FIN.d.sel);let tab='ar';
  const draw=()=>{const L=tab==='ar'?FIN.d.jual:FIN.d.beli,ag=FIN.aging(L,asof),names=[...new Set(ag.map(r=>r.x.c))],rows=names.map(n=>{const o={n,b:BUCK.map((_,i)=>ag.filter(r=>r.x.c===n&&r.b===i).reduce((s,r)=>s+r.sisa,0))};o.t=o.b.reduce((a,b)=>a+b,0);return o});
   el.innerHTML=`<div class="tabs"><button data-t="ar" class="${tab==='ar'?'on':''}">Piutang</button><button data-t="ap" class="${tab==='ap'?'on':''}">Utang</button></div><div class="tools"><span id="mm"></span></div><div class="tbl" id="tb"></div>`;
   $$('.tabs button',el).forEach(b=>b.onclick=()=>{tab=b.dataset.t;draw()});mSel($('#mm'),()=>draw());
   dataTable($('#tb'),[{h:tab==='ar'?'Pelanggan':'Pemasok',v:r=>r.n},...BUCK.map((h,i)=>({h,n:1,v:r=>r.b[i],r:r=>r.b[i]?fmt(r.b[i]):'-',sum:1})),{h:'Total',n:1,v:r=>r.t,r:r=>'<b>'+fmt(r.t)+'</b>',sum:1}],rows,{total:1,sort:6})};draw();
};
const KELA={'Peralatan & Mesin':1800,'Kendaraan':1810};
function asetCalc(a,m){const mo=Math.round((a.hrg-a.hrg*a.res)/a.umur),k=Math.max(0,Math.min(a.umur,(FIN.d.tahun-+a.tgl.slice(0,4))*12+m-+a.tgl.slice(5,7))),ak=mo*k;return {...a,mo,k,ak,nb:a.hrg-ak}}
function asetForm(done){
  modal('Tambah aset tetap',`<div class="form"><div><label>Kode</label><input class="inp" id="a_k" value="A-${String(FIN.d.aset.length+1).padStart(3,'0')}"></div><div><label>Kelompok</label><select class="sel" id="a_g">${opts(Object.keys(KELA))}</select></div><div class="full"><label>Nama aset</label><input class="inp" id="a_n"></div><div><label>Tanggal perolehan</label><input class="inp" type="date" id="a_t" value="${FIN.end(FIN.d.sel)}"></div><div><label>Harga perolehan (Rp)</label><input class="inp" type="number" id="a_h" value="50000000"></div><div><label>Nilai residu (%)</label><input class="inp" type="number" id="a_r" value="0" min="0" max="90"></div><div><label>Umur manfaat (bulan)</label><input class="inp" type="number" id="a_u" value="48" min="1"></div><div class="full"><label><input type="checkbox" id="a_j" checked> Catat jurnal pembelian (Dr aset, Cr bank) bila tanggal di tahun berjalan</label></div></div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const n=$('#a_n').value.trim(),h=+$('#a_h').value,u=+$('#a_u').value;if(!n||!(h>0)||!(u>0)){toast('Nama, harga, dan umur wajib diisi');return false}if(FIN.d.aset.some(x=>x.kode===$('#a_k').value.trim())){toast('Kode sudah dipakai');return false}
    const as={kode:$('#a_k').value.trim(),nama:n,kel:$('#a_g').value,tgl:$('#a_t').value,hrg:h,res:(+$('#a_r').value||0)/100,umur:u,akun:KELA[$('#a_g').value]};if($('#a_j').checked&&!FIN.chk(as.tgl))return false;FIN.d.aset.push(as);
    if($('#a_j').checked&&as.tgl.slice(0,4)==FIN.d.tahun)FIN.post(as.tgl,'AST-'+as.kode,'Pembelian '+n,[[as.akun,h,0],[1110,0,h]],'aset');
    FIN.save();done();toast('Aset ditambahkan')}}]});
}
function postDep(m){let n=0;if(!FIN.chk(FIN.end(m)))return 0;FIN.d.aset.forEach(a=>{const c=asetCalc(a,m),no=`DEP-${a.kode}-${String(m).padStart(2,'0')}`;if(c.k>=1&&c.k<=a.umur&&c.mo&&!FIN.d.ent.some(e=>e.no===no)){FIN.post(FIN.end(m),no,'Penyusutan '+a.nama,[[6600,c.mo,0],[1900,0,c.mo]],'dep');n++}});return n}
V.f_aset=el=>{
  if(DEMO()){el.innerHTML=`<div class="card" style="text-align:center;padding:50px"><h3>Aset tetap & penyusutan</h3><p style="color:var(--mute)">Register aset, penyusutan otomatis, dan nilai buku tersedia di edisi lengkap.</p><button class="btn pri" id="u">Lihat edisi lengkap</button></div>`;$('#u').onclick=()=>lock('Aset tetap & penyusutan');return}
  const m=FIN.d.sel,rows=FIN.d.aset.map(a=>asetCalc(a,m)),again=()=>V.f_aset(el);
  el.innerHTML=`<div class="tools"><span id="mm"></span><span class="sp"></span><button class="btn" id="pd">Posting penyusutan bulan ini</button><button class="btn pri" id="ad">${ico('plus')} Tambah aset</button></div><div class="grid g3" style="margin-bottom:14px"><div class="card kpi"><small>Harga perolehan</small><b>${juta(rows.reduce((s,r)=>s+r.hrg,0))}</b></div><div class="card kpi"><small>Akumulasi penyusutan</small><b>${juta(rows.reduce((s,r)=>s+r.ak,0))}</b></div><div class="card kpi"><small>Nilai buku</small><b>${juta(rows.reduce((s,r)=>s+r.nb,0))}</b></div></div><div class="tbl" id="tb"></div>`;
  mSel($('#mm'),()=>App.render());dataTable($('#tb'),[{h:'Kode',k:'kode'},{h:'Aset',k:'nama'},{h:'Kelompok',k:'kel'},{h:'Perolehan',k:'tgl',f:fdate},{h:'Harga',n:1,k:'hrg',r:r=>fmt(r.hrg),sum:1},{h:'Umur (bln)',n:1,k:'umur'},{h:'Susut/bln',n:1,k:'mo',r:r=>fmt(r.mo),sum:1},{h:'Akumulasi',n:1,k:'ak',r:r=>fmt(r.ak),sum:1},{h:'Nilai buku',n:1,k:'nb',r:r=>'<b>'+fmt(r.nb)+'</b>',sum:1},{h:'',r:r=>`<button class="btn sm dng" data-del="${r.kode}">Hapus</button>`}],rows,{total:1,after:t=>$$('[data-del]',t).forEach(b=>b.onclick=()=>{if(!confirm('Hapus aset beserta jurnal pembelian dan penyusutannya?'))return;const k=b.dataset.del;FIN.d.aset=FIN.d.aset.filter(x=>x.kode!==k);FIN.d.ent=FIN.d.ent.filter(e=>!(e.no==='AST-'+k||e.no.startsWith('DEP-'+k+'-')));FIN.save();again();toast('Aset dihapus')})});
  $('#ad').onclick=()=>asetForm(again);$('#pd').onclick=()=>{const n=postDep(m);FIN.save();again();toast(n?`${n} jurnal penyusutan diposting`:'Penyusutan bulan ini sudah diposting semua')};
};
function loanSched(l){const r=l.bunga/12,P=l.pokok,n=l.tenor,pmt=Math.round(P*r/(1-Math.pow(1+r,-n)));let bal=P;const f=dt(l.first),rows=[];for(let k=1;k<=n;k++){const y=f.getFullYear()+Math.floor((f.getMonth()+k-1)/12),mo=(f.getMonth()+k-1)%12,d=iso(new Date(y,mo+1,0)),bg=Math.round(bal*r),pk=k===n?bal:pmt-bg;rows.push({k,d,bal,ang:pk+bg,bg,pk,sisa:bal-pk,no:`${l.id}-${String(k).padStart(2,'0')}`});bal-=pk}return rows}
V.f_pinjaman=el=>{
  if(DEMO())return lockPage(el,'Pinjaman & angsuran','Jadwal angsuran, posting bunga dan pokok otomatis tersedia di edisi lengkap.');
  const d=FIN.d,again=()=>V.f_pinjaman(el);let sel=el._ln||(d.loans[0]||{}).id;
  const draw=()=>{const l=d.loans.find(x=>x.id===sel),sc=l?loanSched(l):[],end=FIN.end(d.sel),due=sc.filter(r=>r.d<=end&&r.d>=FIN.start(1)&&!d.ent.some(e=>e.no===r.no));
   el.innerHTML=`<div class="tools"><select class="sel" id="ls">${d.loans.map(x=>`<option value="${x.id}" ${x.id===sel?'selected':''}>${esc(x.nama)}</option>`).join('')||'<option>(belum ada pinjaman)</option>'}</select><span id="mm"></span><span class="sp"></span>${l?`<button class="btn" id="po">Posting angsuran sampai bulan ini (${due.length})</button><button class="btn dng" id="dl">Hapus pinjaman</button>`:''}<button class="btn pri" id="ad">${ico('plus')} Pinjaman baru</button></div>${l?`<div class="grid g3" style="margin-bottom:14px"><div class="card kpi"><small>Pokok pinjaman</small><b>${juta(l.pokok)}</b></div><div class="card kpi"><small>Angsuran / bulan</small><b>${juta(sc[0].ang)}</b></div><div class="card kpi"><small>Sisa pokok (${MN[d.sel-1]})</small><b>${juta((sc.filter(r=>r.d<=end).pop()||{sisa:l.pokok}).sisa)}</b></div></div><div class="tbl" id="tb" style="max-height:60vh"></div>`:''}`;
   mSel($('#mm'),draw);$('#ls').onchange=e=>{sel=el._ln=e.target.value;draw()};$('#ad').onclick=()=>loanForm(l2=>{sel=el._ln=l2;draw()});
   if(!l)return;dataTable($('#tb'),[{h:'#',n:1,v:r=>r.k},{h:'Tanggal',v:r=>r.d,r:r=>fdate(r.d)},{h:'Saldo awal',n:1,v:r=>r.bal,r:r=>fmt(r.bal)},{h:'Angsuran',n:1,v:r=>r.ang,r:r=>fmt(r.ang),sum:1},{h:'Bunga',n:1,v:r=>r.bg,r:r=>fmt(r.bg),sum:1},{h:'Pokok',n:1,v:r=>r.pk,r:r=>fmt(r.pk),sum:1},{h:'Sisa pokok',n:1,v:r=>r.sisa,r:r=>fmt(r.sisa)},{h:'Jurnal',v:r=>d.ent.some(e=>e.no===r.no)?1:0,r:r=>d.ent.some(e=>e.no===r.no)?pill('terposting','ok'):r.d<FIN.start(1)?pill('di saldo awal','mut'):r.d<=end?pill('belum','warn'):pill('jadwal','mut')}],sc);
   $('#po').onclick=()=>{const lk=d.lock||'',ok=due.filter(r=>!(lk&&r.d.slice(0,7)<=lk));if(ok.length<due.length)toast('Angsuran pada periode yang sudah ditutup dilewati');ok.forEach(r=>FIN.post(r.d,r.no,`Angsuran ${l.nama} ke-${r.k}`,[[7100,r.bg,0],[2500,r.pk,0],[1110,0,r.ang]],'loan'));FIN.save();draw();toast(ok.length?`${ok.length} angsuran diposting`:'Tidak ada angsuran yang perlu diposting')};
   $('#dl').onclick=()=>{if(d.ent.some(e=>e.no.startsWith(l.id+'-')&&!FIN.chk(e.d))||!confirm('Hapus pinjaman beserta jurnal angsurannya?'))return;d.ent=d.ent.filter(e=>!e.no.startsWith(l.id+'-'));d.loans=d.loans.filter(x=>x!==l);FIN.save();sel=el._ln=(d.loans[0]||{}).id;draw();toast('Pinjaman dihapus')}};
  draw();
};
function loanForm(done){
  const d=FIN.d;modal('Pinjaman baru',`<div class="form"><div class="full"><label>Nama pinjaman</label><input class="inp" id="n_n" value="Kredit Bank"></div><div><label>Pokok (Rp)</label><input class="inp" type="number" id="n_p" value="300000000"></div><div><label>Bunga per tahun (%)</label><input class="inp" type="number" step=".1" id="n_b" value="10"></div><div><label>Tenor (bulan)</label><input class="inp" type="number" id="n_t" value="24"></div><div><label>Tanggal pencairan</label><input class="inp" type="date" id="n_d" value="${FIN.start(d.sel)}"></div><div class="full"><label><input type="checkbox" id="n_j" checked> Catat jurnal pencairan (Dr bank, Cr utang bank)</label></div></div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const p=+$('#n_p').value,b=+$('#n_b').value/100,t=+$('#n_t').value;if(!(p>0)||!(t>0)||b<0){toast('Pokok, bunga, dan tenor tidak valid');return false}
    const dd=dt($('#n_d').value),id='LN'+(d.loans.length+1+Math.floor(Math.random()*90)),first=iso(new Date(dd.getFullYear(),dd.getMonth()+2,0));
    if($('#n_j').checked&&!FIN.chk($('#n_d').value))return false;d.loans.push({id,nama:$('#n_n').value.trim()||'Pinjaman',pokok:p,bunga:b,tenor:t,first});if($('#n_j').checked)FIN.post($('#n_d').value,id+'-CAIR','Pencairan '+$('#n_n').value,[[1110,p,0],[2500,0,p]],'loan');FIN.save();done(id);toast('Pinjaman dibuat')}}]});
}
V.f_anggaran=el=>{
  if(DEMO())return lockPage(el,'Anggaran vs aktual','Penyusunan anggaran per akun dan perbandingannya dengan realisasi tersedia di edisi lengkap.');
  const d=FIN.d,m=d.sel,om=FIN.sums(FIN.start(m),FIN.end(m),false),oy=FIN.sums(FIN.start(1),FIN.end(m),false),accs=d.coa.filter(a=>['Pendapatan','HPP','Beban'].includes(a.t));
  el.innerHTML=`<div class="tools"><span id="mm"></span></div><div class="note">Isi anggaran bulanan tiap akun. Selisih positif pada pendapatan = melebihi target; pada biaya = melebihi anggaran (kurang baik).</div><div class="tbl"><table><thead><tr><th>Akun</th><th class="n">Anggaran / bulan</th><th class="n">Aktual bulan ini</th><th class="n">Anggaran YTD</th><th class="n">Aktual YTD</th><th class="n">Selisih YTD</th><th class="n">% terhadap anggaran</th></tr></thead><tbody>${accs.map(a=>{const b=d.budget[a.k]||0,ay=FIN.bal(oy,a.k),by=b*m,df=ay-by,bad=a.t==='Pendapatan'?df<0:df>0;return `<tr><td>${a.k} ${esc(a.n)}</td><td class="n"><input class="inp" style="width:140px;text-align:right" type="number" min="0" data-b="${a.k}" value="${b||''}"></td><td class="n">${fmt(FIN.bal(om,a.k))}</td><td class="n">${fmt(by)}</td><td class="n">${fmt(ay)}</td><td class="n" style="color:var(--${by?(bad?'bad':'ok'):'ink'})">${rp(df)}</td><td class="n">${by?pct(ay/by,0):'-'}</td></tr>`}).join('')}</tbody></table></div>`;
  mSel($('#mm'),()=>App.render());$$('[data-b]',el).forEach(i=>i.onchange=()=>{const v=Math.max(0,+i.value||0);if(v)d.budget[i.dataset.b]=v;else delete d.budget[i.dataset.b];FIN.save();V.f_anggaran(el)});
};
V.f_arus=el=>{
  if(DEMO()){el.innerHTML=`<div class="card" style="text-align:center;padding:50px"><h3>Arus kas</h3><p style="color:var(--mute)">Laporan arus kas masuk/keluar bulanan tersedia di edisi lengkap.</p><button class="btn pri" id="u">Lihat edisi lengkap</button></div>`;$('#u').onclick=()=>lock('Laporan arus kas');return}
  const d=FIN.d,ms=[...Array(d.sel).keys()].map(i=>i+1),rows=ms.map(m=>{const o=FIN.sums(FIN.start(m),FIN.end(m),false);let i=0,u=0;[1100,1110].forEach(k=>{const x=o[k]||{d:0,k:0};i+=x.d;u+=x.k});return {m,i,u,n:i-u,s:FIN.saldoKas(m)}});
  el.innerHTML=`<div class="grid g32"><div class="card"><h3>Kas masuk vs keluar <small>jt Rp</small></h3><div id="c1"></div></div><div class="card"><h3>Saldo kas & bank akhir bulan</h3><div id="c2"></div></div></div><div class="tbl" id="tb" style="margin-top:16px"></div>`;
  barChart($('#c1'),ms.map(m=>MN[m-1].slice(0,3)),rows.map(r=>r.n/1e6),{w:600,h:230,colors:[PAL[1]]});barChart($('#c2'),ms.map(m=>MN[m-1].slice(0,3)),rows.map(r=>r.s/1e6),{w:420,h:230,colors:[PAL[0]]});
  dataTable($('#tb'),[{h:'Bulan',v:r=>r.m,r:r=>MN[r.m-1]},{h:'Kas masuk',n:1,v:r=>r.i,r:r=>fmt(r.i),sum:1},{h:'Kas keluar',n:1,v:r=>r.u,r:r=>fmt(r.u),sum:1},{h:'Arus bersih',n:1,v:r=>r.n,r:r=>rp(r.n),sum:1},{h:'Saldo akhir',n:1,v:r=>r.s,r:r=>'<b>'+fmt(r.s)+'</b>'}],rows,{total:1});
};
V.f_ppn=el=>{
  if(DEMO()){el.innerHTML=`<div class="card" style="text-align:center;padding:50px"><h3>Rekap PPN</h3><p style="color:var(--mute)">Rekap PPN keluaran/masukan bulanan dan estimasi kurang bayar tersedia di edisi lengkap.</p><button class="btn pri" id="u">Lihat edisi lengkap</button></div>`;$('#u').onclick=()=>lock('Rekap PPN');return}
  const d=FIN.d,rows=[...Array(d.sel).keys()].map(i=>{const m=i+1,o=FIN.sums(FIN.start(m),FIN.end(m),false),k=(o[2200]||{k:0}).k,msk=(o[1400]||{d:0}).d;return {m,k,msk,net:k-msk}});
  el.innerHTML=`<div class="note">Rekap dari jurnal faktur penjualan/pembelian. Tarif PPN ${pct(d.ppn,0)}; verifikasi dengan ketentuan perpajakan yang berlaku.</div><div class="tbl" id="tb"></div>`;
  dataTable($('#tb'),[{h:'Masa',v:r=>r.m,r:r=>MN[r.m-1]+' '+d.tahun},{h:'PPN keluaran',n:1,v:r=>r.k,r:r=>fmt(r.k),sum:1},{h:'PPN masukan',n:1,v:r=>r.msk,r:r=>fmt(r.msk),sum:1},{h:'Kurang/(lebih) bayar',n:1,v:r=>r.net,r:r=>rp(r.net),sum:1}],rows,{total:1});
};
V.f_pengaturan=el=>{
  const d=FIN.d,bsAcc=d.coa.filter(a=>['Aset','Liabilitas','Ekuitas'].includes(a.t)&&a.k!==3200),dnorm=a=>a.t==='Aset'&&a.k!==1900,get=a=>{const v=d.ob[a.k]||0;return Math.abs(v)&&((dnorm(a)?v:-v))},plug=-Object.values(d.ob).reduce((s,v)=>s+v,0);
  el.innerHTML=`<div class="card"><h3>Periode berjalan</h3><div class="form"><div><label>Bulan berjalan (laporan sampai bulan ini)</label><select class="sel" id="pb">${MN.map((n,i)=>`<option value="${i+1}" ${i+1===d.bulan?'selected':''}>${n} ${d.tahun}</option>`).join('')}</select></div></div></div><div class="card" style="margin-top:16px"><h3>Saldo awal tahun</h3><p style="color:var(--mute);margin:0 0 10px">Isi saldo awal akun neraca (nilai positif di sisi normal; akumulasi penyusutan diisi positif). Laba ditahan terisi otomatis sebagai penyeimbang.</p><div class="tbl"><table><thead><tr><th>Akun</th><th class="n">Saldo awal (Rp)</th></tr></thead><tbody>${bsAcc.map(a=>`<tr><td>${a.k} ${esc(a.n)} <small style="color:var(--mute)">${a.g}</small></td><td class="n"><input class="inp" style="width:170px;text-align:right" type="number" min="0" data-ob="${a.k}" value="${get(a)||''}"></td></tr>`).join('')}<tr><td><b>3200 Laba Ditahan (otomatis)</b></td><td class="n"><b id="plug">${fmt(plug)}</b></td></tr></tbody></table></div></div>
  <div class="card" style="margin-top:16px"><h3>Daftar akun (COA)</h3><div class="tools"><button class="btn pri" id="ac">${ico('plus')} Tambah akun</button><span style="color:var(--mute)">${d.coa.length} akun</span></div></div>
  <div class="card" style="margin-top:16px"><h3>Pelanggan & pemasok</h3><div class="form"><div class="full"><label>Pelanggan (satu per baris: Nama; termin hari)</label><textarea class="inp" id="cu" rows="4">${esc(d.cust.map(c=>c.n+'; '+c.t).join('\n'))}</textarea></div><div class="full"><label>Pemasok (satu per baris: Nama; termin hari)</label><textarea class="inp" id="su" rows="4">${esc(d.supp.map(c=>c.n+'; '+c.t).join('\n'))}</textarea></div></div></div>
  <div class="card" style="margin-top:16px"><h3>Data keuangan</h3><div class="tools"><button class="btn" id="bk">${ico('down')} Cadangkan (JSON)</button><button class="btn" id="bl">Mulai dari data kosong</button><button class="btn dng" id="rs">Kembalikan data contoh</button></div><p style="color:var(--mute)">Data tersimpan di komputer ini. Angka pada edisi ini adalah data simulasi. Produk diberikan sebagaimana adanya, tanpa garansi, pembaruan, maupun dukungan.</p></div>`;
  $('#pb').onchange=e=>{d.bulan=+e.target.value;d.sel=d.bulan;FIN.save();toast('Periode berjalan: '+MN[d.bulan-1])};
  $$('[data-ob]',el).forEach(i=>i.onchange=()=>{if(d.lock){toast('Saldo awal terkunci karena sudah ada periode yang ditutup');return V.f_pengaturan(el)}const a=FIN.acc(i.dataset.ob),v=Math.max(0,+i.value||0);if(v)d.ob[a.k]=dnorm(a)?v:-v;else delete d.ob[a.k];FIN.save();$('#plug').textContent=fmt(-Object.values(d.ob).reduce((s,x)=>s+x,0));toast('Saldo awal disimpan')});
  const parse=t=>t.split('\n').map(x=>x.split(';')).filter(x=>x[0].trim()).map(x=>({n:x[0].trim(),t:+x[1]||30}));
  $('#cu').onchange=e=>{d.cust=parse(e.target.value);FIN.save();toast('Pelanggan disimpan')};$('#su').onchange=e=>{d.supp=parse(e.target.value);FIN.save();toast('Pemasok disimpan')};
  $('#ac').onclick=()=>{if(DEMO())return lock('Tambah akun');modal('Tambah akun',`<div class="form"><div><label>Kode (angka)</label><input class="inp" type="number" id="a_k"></div><div><label>Nama akun</label><input class="inp" id="a_n"></div><div><label>Tipe</label><select class="sel" id="a_t">${opts(['Aset','Liabilitas','Ekuitas','Pendapatan','HPP','Beban','Lain-lain'])}</select></div><div><label>Kelompok</label><select class="sel" id="a_g">${opts(['Aset Lancar','Aset Tetap','Liabilitas Jangka Pendek','Liabilitas Jangka Panjang','Ekuitas','Pendapatan','HPP','Beban Operasional','Pendapatan/Beban Lain'])}</select></div></div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const k=+$('#a_k').value,n=$('#a_n').value.trim();if(!k||!n){toast('Kode dan nama wajib diisi');return false}if(d.coa.some(a=>a.k===k)){toast('Kode sudah ada');return false}d.coa.push({k,n,t:$('#a_t').value,g:$('#a_g').value});d.coa.sort((a,b)=>a.k-b.k);FIN.save();V.f_pengaturan(el);toast('Akun ditambahkan')}}]})};
  $('#bk').onclick=gate('Cadangan data',()=>download('mantam-finance-cadangan.json',JSON.stringify(FIN.d),'application/json'));
  $('#bl').onclick=gate('Mulai dari data kosong',()=>{if(confirm('Semua jurnal, faktur, pembayaran, dan aset contoh dihapus. Isi saldo awal setelahnya. Lanjutkan?')){FIN.blank();App.render();toast('Data dikosongkan. Isi saldo awal di sini.')}});
  $('#rs').onclick=()=>{if(confirm('Semua perubahan akan hilang. Lanjutkan?')){FIN.reset();App.render();toast('Data contoh dikembalikan')}};
};

V.f_tutup=el=>{
  if(DEMO())return lockPage(el,'Tutup buku & kunci periode','Periksa kelengkapan jurnal lalu kunci periode agar angka laporan tidak berubah. Tersedia di edisi lengkap.');
  const d=FIN.d,lk=d.lock||'',lm=lk?+lk.slice(5,7):0,nm=lm+1,draw=()=>V.f_tutup(el);
  const chk=m=>{const end=FIN.end(m),s=FIN.start(m),r=[];
   const unb=d.ent.filter(e=>e.l.reduce((a,x)=>a+x[1]-x[2],0)!==0).length;
   r.push({t:'Semua jurnal seimbang (debit = kredit)',ok:!unb,n:unb?unb+' jurnal tidak seimbang':'',blk:1});
   const ns=FIN.neraca(m).selisih;r.push({t:'Neraca akhir bulan seimbang',ok:ns===0,n:ns?'Selisih '+idr(ns):'',blk:1});
   let md=0;d.aset.forEach(a=>{const c=asetCalc(a,m);if(c.k>=1&&c.k<=a.umur&&c.mo&&!d.ent.some(e=>e.no===`DEP-${a.kode}-${String(m).padStart(2,'0')}`))md++});
   r.push({t:'Penyusutan aset tetap sudah diposting',ok:!md,n:md?md+' aset belum disusutkan (menu Aset Tetap)':'',blk:1});
   let ml=0;d.loans.forEach(l=>loanSched(l).forEach(x=>{if(x.d>=s&&x.d<=end&&!d.ent.some(e=>e.no===x.no))ml++}));
   r.push({t:'Angsuran pinjaman bulan ini sudah diposting',ok:!ml,n:ml?ml+' angsuran belum diposting (menu Pinjaman)':'',blk:1});
   const kas=FIN.saldoKas(m);r.push({t:'Saldo kas & bank tidak negatif',ok:kas>=0,n:kas<0?'Saldo '+idr(kas)+' — periksa pencatatan':'',blk:0});
   const op=d.jual.concat(d.beli).filter(x=>x.d<=end&&x.d>=s&&!d.ent.some(e=>e.no===x.no&&(e.src==='jual'||e.src==='beli'))).length;
   r.push({t:'Semua faktur bulan ini punya jurnal',ok:!op,n:op?op+' faktur tanpa jurnal':'',blk:1});return r};
  const canClose=nm<=12&&nm<=d.bulan,res=canClose?chk(nm):[],pass=res.every(x=>x.ok||!x.blk);
  el.innerHTML=`<div class="grid g2"><div class="card"><h3>Status periode</h3><p style="margin:0 0 10px">${lk?`Dikunci sampai akhir <b>${MN[lm-1]} ${d.tahun}</b>. Transaksi bertanggal pada atau sebelum itu tidak bisa ditambah, diubah, atau dihapus.`:'Belum ada periode yang ditutup.'}</p>
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${MN.map((n,i)=>`<span class="pill ${i<lm?'ok':'mut'}">${i<lm?'🔒 ':''}${n.slice(0,3)}</span>`).join('')}</div>
   <div class="tools">${lm?`<button class="btn dng" id="op">Buka kembali ${MN[lm-1]}</button>`:''}</div></div>
   <div class="card"><h3>${canClose?'Tutup buku '+MN[nm-1]+' '+d.tahun:'Tutup buku'}</h3>${canClose?`<div style="display:grid;gap:8px;margin-bottom:14px">${res.map(x=>`<div style="display:flex;gap:8px;align-items:flex-start"><span class="pill ${x.ok?'ok':x.blk?'bad':'warn'}">${x.ok?'Lolos':x.blk?'Gagal':'Periksa'}</span><div>${x.t}${x.n?`<br><small style="color:var(--mute)">${esc(x.n)}</small>`:''}</div></div>`).join('')}</div><div class="tools"><button class="btn pri" id="cl" ${pass?'':'disabled'}>Tutup buku ${MN[nm-1]}</button><button class="btn" id="pl">Cetak laba rugi & neraca</button></div>${pass?'':'<p style="color:var(--mute);margin:10px 0 0">Selesaikan pemeriksaan yang gagal untuk dapat menutup periode.</p>'}`:`<p style="color:var(--mute);margin:0">${nm>12?'Seluruh bulan tahun '+d.tahun+' sudah ditutup.':'Bulan berikutnya ('+MN[nm-1]+') belum menjadi periode berjalan. Ubah periode berjalan di Pengaturan Keuangan bila ingin menutupnya.'}</p>`}</div></div>`;
  if($('#cl'))$('#cl').onclick=()=>{if(!confirm('Tutup buku '+MN[nm-1]+'? Transaksi pada periode ini akan terkunci.'))return;d.lock=d.tahun+'-'+String(nm).padStart(2,'0');FIN.save();draw();toast(MN[nm-1]+' ditutup')};
  if($('#op'))$('#op').onclick=()=>{if(!confirm('Buka kembali '+MN[lm-1]+'? Periode akan bisa diubah lagi.'))return;d.lock=lm>1?d.tahun+'-'+String(lm-1).padStart(2,'0'):'';FIN.save();draw();toast(MN[lm-1]+' dibuka kembali')};
  if($('#pl'))$('#pl').onclick=()=>printDoc('Laporan '+MN[nm-1]+' '+d.tahun,lrBody(nm)+nrBody(nm));
};

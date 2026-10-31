/* Mantam Suite · modul Finance & Accounting */
const FIN={d:null,
 init(){const s=Store.get('fin',null);if(s&&s.ver===1&&s.edition===CONFIG.edition){this.d=s.d;return}this.reset()},
 reset(){this.d=JSON.parse(JSON.stringify(DEMO()?FIN_DEMO:FIN_FULL));this.d.sel=this.d.bulan;this.save()},
 save(){Store.set('fin',{ver:1,edition:CONFIG.edition,d:this.d})},
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
 paid(no){return this.d.pays.filter(p=>p.ref===no).reduce((s,p)=>s+p.amt,0)},
 aging(list,asof){return list.map(x=>{const sisa=x.tot-this.paid(x.no);if(sisa<=0||x.d>asof)return null;const dl=Math.round((dt(asof)-dt(x.jt))/864e5);
   const b=dl<=0?0:dl<=30?1:dl<=60?2:dl<=90?3:4;return {x,sisa,dl,b}}).filter(Boolean)},
 saldoKas(m){const o=this.sums(null,this.end(m),true);return this.bal(o,1100)+this.bal(o,1110)},
 nextNo(pre,list){return pre+'-'+String(list.length+1).padStart(4,'0')},
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
function invList(el,kind){
  const d=FIN.d,L=kind==='jual'?d.jual:d.beli,pre=kind==='jual'?'INV':'BIL',asof=FIN.end(d.sel),lbl=kind==='jual'?'Pelanggan':'Pemasok',pt=kind==='jual'?d.cust:d.supp;
  el.innerHTML=`<div class="tools"><select class="sel" id="fs"><option value="">Semua status</option><option>Lunas</option><option>Sebagian</option><option>Belum dibayar</option><option>Lewat tempo</option></select><span class="sp"></span><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn pri" id="ad">${ico('plus')} ${kind==='jual'?'Faktur penjualan':'Tagihan pemasok'}</button></div><div class="tbl" id="tb"></div>`;
  $('#ex').classList.toggle('lk',DEMO());
  const st=x=>{const p=FIN.paid(x.no);return p>=x.tot?'Lunas':x.jt<asof?'Lewat tempo':p>0?'Sebagian':'Belum dibayar'},cl={Lunas:'ok',Sebagian:'info','Belum dibayar':'mut','Lewat tempo':'bad'};
  let f='';const draw=()=>dataTable($('#tb'),[{h:'No',k:'no'},{h:'Tanggal',k:'d',f:fdate},{h:lbl,k:'c'},{h:'DPP',n:1,k:'dpp',r:r=>fmt(r.dpp),sum:1},{h:'PPN',n:1,k:'ppn',r:r=>fmt(r.ppn),sum:1},{h:'Total',n:1,k:'tot',r:r=>fmt(r.tot),sum:1},{h:'Terbayar',n:1,v:r=>FIN.paid(r.no),r:r=>fmt(FIN.paid(r.no))},{h:'Jatuh tempo',k:'jt',f:fdate},{h:'Status',v:r=>st(r),r:r=>pill(st(r),cl[st(r)])}],[...L].reverse().filter(x=>!f||st(x)===f),{total:1,click:x=>payForm(x,kind,()=>V[App.cur](el))});
  draw();$('#fs').onchange=e=>{f=e.target.value;draw()};
  $('#ex').onclick=gate('Ekspor faktur',()=>download(kind+'.csv',toCSV([['No','Tanggal',lbl,'DPP','PPN','Total','Terbayar','Jatuh tempo'],...L.map(x=>[x.no,x.d,x.c,x.dpp,x.ppn,x.tot,FIN.paid(x.no),x.jt])])));
  $('#ad').onclick=()=>{if(DEMO()&&L.length>=40)return lock('Faktur tanpa batas');
   const ak=kind==='jual'?[4100,4200]:[5100,1300,6500,6400,6300];
   modal(kind==='jual'?'Faktur penjualan':'Tagihan pemasok',`<div class="form"><div class="full"><label>${lbl}</label><select class="sel" id="i_c">${pt.map(p=>`<option>${esc(p.n)}</option>`).join('')}</select></div><div><label>Tanggal</label><input class="inp" type="date" id="i_d" value="${asof}"></div><div><label>Akun</label><select class="sel" id="i_a">${ak.map(k=>`<option value="${k}">${k} ${FIN.acc(k).n}</option>`).join('')}</select></div><div class="full"><label>DPP (Rp)</label><input class="inp" type="number" id="i_v" value="25000000"></div><div class="note full">PPN ${pct(d.ppn,0)} dihitung otomatis dan jurnal dibuat otomatis.</div></div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const dpp=+$('#i_v').value;if(!(dpp>0)){toast('DPP harus lebih dari 0');return false}
    const c=$('#i_c').value,dd=$('#i_d').value,ak=+$('#i_a').value,ppn=Math.round(dpp*d.ppn),tot=dpp+ppn,t=(pt.find(p=>p.n===c)||{t:30}).t,jt=iso(new Date(dt(dd).getTime()+t*864e5)),no=FIN.nextNo(pre,L);
    L.push({no,d:dd,c,ak,dpp,ppn,tot,jt});
    FIN.post(dd,no,(kind==='jual'?'Penjualan ':'Pembelian ')+c,kind==='jual'?[[1200,tot,0],[ak,0,dpp],[2200,0,ppn]]:[[ak,dpp,0],[1400,ppn,0],[2100,0,tot]],kind);FIN.save();V[App.cur](el);toast(no+' tercatat')}}]})};
}
function payForm(x,kind,done){
  const sisa=x.tot-FIN.paid(x.no);if(sisa<=0)return toast(x.no+' sudah lunas');
  modal((kind==='jual'?'Terima pembayaran ':'Bayar tagihan ')+x.no,`<div class="form"><div class="full"><b>${esc(x.c)}</b> · sisa ${idr(sisa)}</div><div><label>Tanggal</label><input class="inp" type="date" id="p_d" value="${FIN.end(FIN.d.sel)}"></div><div><label>Akun kas/bank</label><select class="sel" id="p_a"><option value="1110">1110 Bank</option><option value="1100">1100 Kas</option></select></div><div class="full"><label>Jumlah (Rp)</label><input class="inp" type="number" id="p_v" value="${sisa}"></div></div>`,{buttons:[{text:'Batal'},{text:'Catat',cls:'pri',fn:()=>{const v=+$('#p_v').value;if(!(v>0)||v>sisa){toast('Jumlah tidak valid (maks '+fmt(sisa)+')');return false}
   const dd=$('#p_d').value,ak=+$('#p_a').value,no=(kind==='jual'?'RCV-':'PAY-')+String(FIN.d.pays.length+1).padStart(4,'0');
   FIN.d.pays.push({d:dd,jn:kind==='jual'?'Terima':'Bayar',ref:x.no,amt:v,ak});FIN.post(dd,no,(kind==='jual'?'Terima pembayaran ':'Bayar tagihan ')+x.no,kind==='jual'?[[ak,v,0],[1200,0,v]]:[[2100,v,0],[ak,0,v]],'bayar');FIN.save();done();toast('Pembayaran dicatat')}}]});
}
V.f_penjualan=el=>invList(el,'jual');V.f_pembelian=el=>invList(el,'beli');
V.f_jurnal=el=>{
  const q=(App.q||'').toLowerCase();let src='';
  el.innerHTML=`<div class="tools"><select class="sel" id="fs"><option value="">Semua sumber</option><option value="">Semua</option><option value="manual">Jurnal manual</option></select><span class="sp"></span><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn pri" id="ad">${ico('plus')} Jurnal manual</button></div><div class="tbl" id="tb" style="max-height:calc(100vh - 190px)"></div>`;
  $('#ex').classList.toggle('lk',DEMO());
  const rows=[];FIN.d.ent.forEach(e=>e.l.forEach(([c,db,kr],i)=>rows.push({e,c,db,kr,i})));
  const draw=()=>dataTable($('#tb'),[{h:'Tanggal',v:r=>r.e.d,r:r=>r.i?'':fdate(r.e.d)},{h:'No',v:r=>r.e.no,r:r=>r.i?'':r.e.no},{h:'Keterangan',v:r=>r.e.ket,r:r=>r.i?'':esc(r.e.ket)},{h:'Akun',v:r=>r.c,r:r=>`<span style="${r.kr?'padding-left:18px;display:inline-block':''}">${r.c} ${esc(FIN.acc(r.c).n)}</span>`},{h:'Debit',n:1,v:r=>r.db,r:r=>r.db?fmt(r.db):''},{h:'Kredit',n:1,v:r=>r.kr,r:r=>r.kr?fmt(r.kr):''}],rows.filter(r=>(!src||(src==='manual'?!r.e.src:r.e.src===src))&&(!q||(r.e.ket+r.e.no+FIN.acc(r.c).n).toLowerCase().includes(q))).slice(-400).reverse());
  draw();$('#fs').onchange=e=>{src=e.target.value;draw()};
  $('#ex').onclick=gate('Ekspor jurnal',()=>download('jurnal.csv',toCSV([['Tanggal','No','Keterangan','Akun','Nama akun','Debit','Kredit'],...rows.map(r=>[r.e.d,r.e.no,r.e.ket,r.c,FIN.acc(r.c).n,r.db,r.kr])])));
  $('#ad').onclick=()=>{
   const ln=i=>`<tr><td><select class="sel" id="j_a${i}"><option value="">—</option>${FIN.d.coa.map(a=>`<option value="${a.k}">${a.k} ${esc(a.n)}</option>`).join('')}</select></td><td><input class="inp" type="number" id="j_d${i}" style="width:130px"></td><td><input class="inp" type="number" id="j_k${i}" style="width:130px"></td></tr>`;
   modal('Jurnal manual',`<div class="form"><div><label>Tanggal</label><input class="inp" type="date" id="j_t" value="${FIN.end(FIN.d.sel)}"></div><div><label>Keterangan</label><input class="inp" id="j_n"></div></div><div class="tbl" style="margin-top:12px"><table><thead><tr><th>Akun</th><th>Debit</th><th>Kredit</th></tr></thead><tbody>${[0,1,2,3].map(ln).join('')}</tbody></table></div><div id="j_s" style="margin-top:8px;font-size:12.5px;color:var(--mute)">Debit harus sama dengan kredit.</div>`,{w:'680px',buttons:[{text:'Batal'},{text:'Posting',cls:'pri',fn:()=>{const l=[0,1,2,3].map(i=>[+$('#j_a'+i).value,+$('#j_d'+i).value||0,+$('#j_k'+i).value||0]).filter(x=>x[0]&&(x[1]||x[2]));
    const D=l.reduce((s,x)=>s+x[1],0),K=l.reduce((s,x)=>s+x[2],0);if(l.length<2||D!==K||!D){$('#j_s').innerHTML=`<span style="color:var(--bad)">Tidak seimbang: debit ${fmt(D)} · kredit ${fmt(K)}</span>`;return false}
    if(!$('#j_n').value.trim()){toast('Keterangan wajib diisi');return false}
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
  mSel($('#mm'),()=>App.render());$('#pr').onclick=gate('Cetak laporan',()=>window.print());$('#pr').classList.toggle('lk',DEMO());
};
V.f_neraca=el=>{
  const m=FIN.d.sel,n=FIN.neraca(m),sec=(t,gs)=>`<tr style="font-weight:700;background:rgba(14,165,164,.07)"><td colspan="2">${t}</td></tr>`+gs.map(g=>(n.by[g]||[]).map(([a,v])=>`<tr><td>&nbsp;&nbsp;${a.k} ${esc(a.n)}</td><td class="n">${rp(v)}</td></tr>`).join('')+`<tr><td><i>Jumlah ${g}</i></td><td class="n"><i>${rp(n.tot(g))}</i></td></tr>`).join('');
  el.innerHTML=`<div class="tools"><span id="mm"></span><span class="sp"></span>${n.selisih===0?pill('Neraca seimbang','ok'):pill('Selisih '+fmt(n.selisih),'bad')}</div><div class="grid g2"><div class="card"><h3>Aset</h3><div class="tbl"><table><tbody>${sec('ASET',['Aset Lancar','Aset Tetap'])}<tr style="font-weight:700"><td>TOTAL ASET</td><td class="n">${rp(n.aset)}</td></tr></tbody></table></div></div>
  <div class="card"><h3>Liabilitas & ekuitas</h3><div class="tbl"><table><tbody>${sec('LIABILITAS',['Liabilitas Jangka Pendek','Liabilitas Jangka Panjang'])}${sec('EKUITAS',['Ekuitas'])}<tr><td>&nbsp;&nbsp;Laba tahun berjalan</td><td class="n">${rp(n.ytd)}</td></tr><tr style="font-weight:700"><td>TOTAL LIABILITAS & EKUITAS</td><td class="n">${rp(n.lia+n.eq)}</td></tr></tbody></table></div></div></div>`;
  mSel($('#mm'),()=>App.render());
};
V.f_aging=el=>{
  const asof=FIN.end(FIN.d.sel);let tab='ar';
  const draw=()=>{const L=tab==='ar'?FIN.d.jual:FIN.d.beli,ag=FIN.aging(L,asof),names=[...new Set(ag.map(r=>r.x.c))],rows=names.map(n=>{const o={n,b:BUCK.map((_,i)=>ag.filter(r=>r.x.c===n&&r.b===i).reduce((s,r)=>s+r.sisa,0))};o.t=o.b.reduce((a,b)=>a+b,0);return o});
   el.innerHTML=`<div class="tabs"><button data-t="ar" class="${tab==='ar'?'on':''}">Piutang</button><button data-t="ap" class="${tab==='ap'?'on':''}">Utang</button></div><div class="tools"><span id="mm"></span></div><div class="tbl" id="tb"></div>`;
   $$('.tabs button',el).forEach(b=>b.onclick=()=>{tab=b.dataset.t;draw()});mSel($('#mm'),()=>draw());
   dataTable($('#tb'),[{h:tab==='ar'?'Pelanggan':'Pemasok',v:r=>r.n},...BUCK.map((h,i)=>({h,n:1,v:r=>r.b[i],r:r=>r.b[i]?fmt(r.b[i]):'-',sum:1})),{h:'Total',n:1,v:r=>r.t,r:r=>'<b>'+fmt(r.t)+'</b>',sum:1}],rows,{total:1,sort:6})};draw();
};
V.f_aset=el=>{
  if(DEMO()){el.innerHTML=`<div class="card" style="text-align:center;padding:50px"><h3>Aset tetap & penyusutan</h3><p style="color:var(--mute)">Register aset, penyusutan otomatis, dan nilai buku tersedia di edisi lengkap.</p><button class="btn pri" id="u">Lihat edisi lengkap</button></div>`;$('#u').onclick=()=>lock('Aset tetap & penyusutan');return}
  const m=FIN.d.sel,e=FIN.end(m),rows=FIN.d.aset.map(a=>{const mo=Math.round((a.hrg-a.hrg*a.res)/a.umur),k=Math.max(0,Math.min(a.umur,(FIN.d.tahun-+a.tgl.slice(0,4))*12+m-+a.tgl.slice(5,7))),ak=mo*k;return {...a,mo,ak,nb:a.hrg-ak}});
  el.innerHTML=`<div class="tools"><span id="mm"></span></div><div class="grid g3" style="margin-bottom:14px"><div class="card kpi"><small>Harga perolehan</small><b>${juta(rows.reduce((s,r)=>s+r.hrg,0))}</b></div><div class="card kpi"><small>Akumulasi penyusutan</small><b>${juta(rows.reduce((s,r)=>s+r.ak,0))}</b></div><div class="card kpi"><small>Nilai buku</small><b>${juta(rows.reduce((s,r)=>s+r.nb,0))}</b></div></div><div class="tbl" id="tb"></div>`;
  mSel($('#mm'),()=>App.render());dataTable($('#tb'),[{h:'Kode',k:'kode'},{h:'Aset',k:'nama'},{h:'Kelompok',k:'kel'},{h:'Perolehan',k:'tgl',f:fdate},{h:'Harga',n:1,k:'hrg',r:r=>fmt(r.hrg),sum:1},{h:'Umur (bln)',n:1,k:'umur'},{h:'Susut/bln',n:1,k:'mo',r:r=>fmt(r.mo),sum:1},{h:'Akumulasi',n:1,k:'ak',r:r=>fmt(r.ak),sum:1},{h:'Nilai buku',n:1,k:'nb',r:r=>'<b>'+fmt(r.nb)+'</b>',sum:1}],rows,{total:1});
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
  el.innerHTML=`<div class="card"><h3>Data keuangan</h3><div class="tools"><button class="btn" id="bk">${ico('down')} Cadangkan (JSON)</button><button class="btn dng" id="rs">Kembalikan data contoh</button></div><p style="color:var(--mute)">Data tersimpan di komputer ini. Seluruh angka pada edisi ini adalah data simulasi. Produk diberikan sebagaimana adanya, tanpa garansi, pembaruan, maupun dukungan.</p></div>`;
  $('#bk').onclick=gate('Cadangan data',()=>download('mantam-finance-cadangan.json',JSON.stringify(FIN.d),'application/json'));
  $('#rs').onclick=()=>{if(confirm('Semua perubahan akan hilang. Lanjutkan?')){FIN.reset();App.render();toast('Data contoh dikembalikan')}};
};

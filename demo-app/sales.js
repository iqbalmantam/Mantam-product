/* Mantam Suite · modul Sales & Marketing */
const SAL={d:null,
 init(){const s=Store.get('sal',null);if(s&&s.ver===1&&s.edition===CONFIG.edition){this.d=s.d;return}this.reset()},
 reset(){this.d=JSON.parse(JSON.stringify(DEMO()?SAL_DEMO:SAL_FULL));this.save()},
 save(){Store.set('sal',{ver:1,edition:CONFIG.edition,d:this.d})},
 prod(n){return this.d.prods.find(p=>p.n===n)||{h:0,hpp:0}},
 line(t){const p=this.prod(t.p),h=Math.round(p.h*(1-t.disc)),rev=h*t.q;return {rev,hpp:p.hpp*t.q,laba:rev-p.hpp*t.q}},
 inM(t,m){return t.d.slice(0,4)==this.d.p.tahun&&+t.d.slice(5,7)===m},
 rev(f){return this.d.trx.filter(f).reduce((s,t)=>s+this.line(t).rev,0)},
 score(l){const p=this.d.p,w=p.w,cs=[Math.min(1,l.ang/p.full)*100,(l.wew-1)/2*100,(l.keb-1)/4*100,l.rb<=1?100:l.rb<=3?75:l.rb<=6?50:25,Math.min(10,l.it)/10*100];
  return Math.round(cs.reduce((s,c,i)=>s+c*w[i],0)/w.reduce((a,b)=>a+b,0))},
 cat(sc){return sc>=this.d.p.hot?'Hot':sc>=this.d.p.warm?'Warm':'Cold'},
 prob(st){return (this.d.stages.find(s=>s[0]===st)||[0,0])[1]},
 komisi(n,m){const t=this.d.team.find(x=>x.n===n),real=this.rev(x=>x.s===n&&this.inM(x,m)),pc=t.t?real/t.t:0;let r=0;this.d.tiers.forEach(([th,rt])=>{if(pc>=th)r=rt});const k=Math.round(real*r),b=pc>=1?this.d.p.bonus:0;return {t:t.t,real,pc,r,k,b,tot:k+b}},
 cstat(c){const last=this.d.trx.filter(t=>t.c===c.n).map(t=>t.d).sort().pop();if(!last)return {last:null,days:null,s:'Baru'};const days=Math.round((dt(this.d.rep)-dt(last))/864e5);return {last,days,s:days>=this.d.p.sleep?'Tidur':days>=this.d.p.risk?'Berisiko':'Aktif'}},
 open(x){return x.st!=='Menang'&&x.st!=='Kalah'},
 late(x){return this.open(x)&&x.tg<this.d.rep}
};
const SC={Hot:'bad',Warm:'warn',Cold:'info'},CC={Aktif:'ok',Berisiko:'warn',Tidur:'bad',Baru:'info'};
const lockPage=(el,t,d)=>{el.innerHTML=`<div class="card" style="text-align:center;padding:50px"><h3>${t}</h3><p style="color:var(--mute)">${d}</p><button class="btn pri" id="u">Lihat edisi lengkap</button></div>`;$('#u').onclick=()=>lock(t)};

V.s_dashboard=el=>{
  const d=SAL.d,m=d.p.bln,tot=SAL.rev(t=>SAL.inM(t,m)),ytd=SAL.rev(()=>true),laba=d.trx.reduce((s,t)=>s+SAL.line(t).laba,0);
  const op=d.deals.filter(SAL.open),pipe=op.reduce((s,x)=>s+x.v,0),wt=op.reduce((s,x)=>s+x.v*SAL.prob(x.st),0),w=d.deals.filter(x=>x.st==='Menang').length,l=d.deals.filter(x=>x.st==='Kalah').length;
  const k=(t,v,s,i)=>`<div class="card kpi"><span class="ico">${ico(i)}</span><small>${t}</small><b>${v}</b><span class="d">${s}</span></div>`;
  const ms=[...new Set(d.trx.map(t=>+t.d.slice(5,7)))].sort((a,b)=>a-b);
  el.innerHTML=`<div class="grid g4">${k('Penjualan bulan ini',juta(tot),MN[m-1]+' '+d.p.tahun,'trend')}${k('Penjualan tahun berjalan',juta(ytd),`margin kotor ${pct(laba/ytd)}`,'cash')}${k('Pipeline terbuka',juta(pipe),`tertimbang ${juta(wt)}`,'brief')}${k('Win rate',pct(w+l?w/(w+l):0),`${w} menang · ${l} kalah · ${d.deals.filter(SAL.late.bind(SAL)).length} terlambat`,'star')}</div>
  <div class="grid g32" style="margin-top:16px"><div class="card"><h3>Penjualan per bulan <small>jt Rp</small></h3><div id="c1"></div></div><div class="card"><h3>Pipeline per tahap</h3><div id="c2"></div></div></div>
  <div class="grid g3" style="margin-top:16px"><div class="card"><h3>Penjualan per produk <small>jt Rp</small></h3><div id="c3"></div></div><div class="card"><h3>Penjualan per sales <small>jt Rp</small></h3><div id="c4"></div></div><div class="card"><h3>Kategori lead</h3><div id="c5"></div></div></div>`;
  barChart($('#c1'),ms.map(i=>MN[i-1].slice(0,3)),ms.map(i=>SAL.rev(t=>SAL.inM(t,i))/1e6),{w:620,h:230});
  const st=d.stages.filter(s=>s[0]!=='Kalah').map(s=>s[0]);hBars($('#c2'),st,st.map(s=>d.deals.filter(x=>x.st===s).reduce((a,x)=>a+x.v,0)/1e6),{fmt:v=>fmt(v)});
  const pp=d.prods.map(p=>[p.n,SAL.rev(t=>t.p===p.n)/1e6]).sort((a,b)=>b[1]-a[1]).slice(0,6);hBars($('#c3'),pp.map(x=>x[0]),pp.map(x=>x[1]),{fmt:v=>fmt(v)});
  hBars($('#c4'),d.team.map(t=>t.n),d.team.map(t=>SAL.rev(x=>x.s===t.n)/1e6),{fmt:v=>fmt(v)});
  const cats=['Hot','Warm','Cold'];donut($('#c5'),cats,cats.map(c=>d.leads.filter(x=>SAL.cat(SAL.score(x))===c).length),{sub:'lead',center:d.leads.length});
};
V.s_pelanggan=el=>{
  const q=(App.q||'').toLowerCase();let fs='';
  el.innerHTML=`<div class="tools"><select class="sel" id="fs"><option value="">Semua status</option><option>Aktif</option><option>Berisiko</option><option>Tidur</option><option>Baru</option></select><span class="sp"></span><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn pri" id="ad">${ico('plus')} Tambah pelanggan</button></div><div class="tbl" id="tb"></div>`;
  $('#ex').classList.toggle('lk',DEMO());
  const rows=()=>SAL.d.cust.map(c=>({c,s:SAL.cstat(c),tot:SAL.rev(t=>t.c===c.n),n:SAL.d.trx.filter(t=>t.c===c.n).length})).filter(r=>(!fs||r.s.s===fs)&&(!q||(r.c.n+r.c.s+r.c.w).toLowerCase().includes(q)));
  const draw=()=>dataTable($('#tb'),[{h:'ID',v:r=>r.c.id},{h:'Pelanggan',v:r=>r.c.n,r:r=>`<span class="av">${initials(r.c.n.replace(/^(PT|CV|UD) /,''))}</span><b>${esc(r.c.n)}</b>`},{h:'Segmen',v:r=>r.c.seg},{h:'Wilayah',v:r=>r.c.w},{h:'Sales',v:r=>r.c.s},{h:'Transaksi',n:1,v:r=>r.n},{h:'Total penjualan',n:1,v:r=>r.tot,r:r=>fmt(r.tot),sum:1},{h:'Beli terakhir',v:r=>r.s.last||'',r:r=>r.s.last?fdate(r.s.last):'-'},{h:'Status',v:r=>r.s.s,r:r=>pill(r.s.s,CC[r.s.s])}],rows(),{total:1,sort:6});
  draw();$('#fs').onchange=e=>{fs=e.target.value;draw()};
  $('#ex').onclick=gate('Ekspor pelanggan',()=>download('pelanggan.csv',toCSV([['ID','Nama','Segmen','Wilayah','Sales','Transaksi','Total'],...rows().map(r=>[r.c.id,r.c.n,r.c.seg,r.c.w,r.c.s,r.n,r.tot])])));
  $('#ad').onclick=()=>{if(DEMO()&&SAL.d.cust.length>=15)return lock('Pelanggan lebih dari 15');
   modal('Tambah pelanggan',`<div class="form"><div class="full"><label>Nama pelanggan</label><input class="inp" id="c_n"></div><div><label>Segmen</label><select class="sel" id="c_g">${opts(SAL.d.segs)}</select></div><div><label>Wilayah</label><select class="sel" id="c_w">${opts(SAL.d.wil)}</select></div><div class="full"><label>Sales pemilik</label><select class="sel" id="c_s">${opts(SAL.d.team.map(t=>t.n))}</select></div></div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const n=$('#c_n').value.trim();if(!n){toast('Nama wajib diisi');return false}SAL.d.cust.push({id:'C-'+String(SAL.d.cust.length+1).padStart(3,'0'),n,seg:$('#c_g').value,w:$('#c_w').value,s:$('#c_s').value});SAL.save();App.render();toast('Pelanggan ditambahkan')}}]})};
};
V.s_lead=el=>{
  let fc='';
  el.innerHTML=`<div class="tools"><select class="sel" id="fc"><option value="">Semua kategori</option><option>Hot</option><option>Warm</option><option>Cold</option></select><span class="sp"></span><button class="btn pri" id="ad">${ico('plus')} Tambah lead</button></div><div class="tbl" id="tb" style="max-height:calc(100vh - 190px)"></div>`;
  const draw=()=>dataTable($('#tb'),[{h:'ID',v:l=>l.id},{h:'Prospek',v:l=>l.n},{h:'Sumber',v:l=>l.src},{h:'Kampanye',v:l=>l.camp||'-'},{h:'Anggaran (jt)',n:1,v:l=>l.ang},{h:'Wewenang',n:1,v:l=>l.wew},{h:'Kebutuhan',n:1,v:l=>l.keb},{h:'Beli (bln)',n:1,v:l=>l.rb},{h:'Interaksi',n:1,v:l=>l.it},{h:'Sales',v:l=>l.s},{h:'Status',v:l=>l.st},{h:'Skor',n:1,v:l=>SAL.score(l),r:l=>'<b>'+SAL.score(l)+'</b>'},{h:'Kategori',v:l=>SAL.score(l),r:l=>pill(SAL.cat(SAL.score(l)),SC[SAL.cat(SAL.score(l))])}],SAL.d.leads.filter(l=>!fc||SAL.cat(SAL.score(l))===fc),{sort:11});
  draw();$('#fc').onchange=e=>{fc=e.target.value;draw()};
  $('#ad').onclick=()=>{if(DEMO()&&SAL.d.leads.length>=30)return lock('Lead lebih dari 30');
   const n=(l,id,v,mn,mx)=>`<div><label>${l}</label><input class="inp" type="number" id="${id}" value="${v}" min="${mn}" max="${mx}"></div>`;
   modal('Tambah lead',`<div class="form"><div class="full"><label>Nama prospek</label><input class="inp" id="l_n"></div><div><label>Sumber</label><select class="sel" id="l_s">${opts(SAL.d.sources)}</select></div><div><label>Sales</label><select class="sel" id="l_o">${opts(SAL.d.team.map(t=>t.n))}</select></div>${n('Anggaran (juta Rp)','l_a',50,0,9999)}${n('Wewenang (1-3)','l_w',2,1,3)}${n('Kebutuhan (1-5)','l_k',3,1,5)}${n('Rencana beli (bulan)','l_r',3,0,24)}${n('Interaksi (0-10)','l_i',3,0,10)}</div><div id="l_sc" class="note" style="margin-top:10px">Skor akan dihitung otomatis.</div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const nm=$('#l_n').value.trim();if(!nm){toast('Nama wajib diisi');return false}
    const l={id:'L-'+String(SAL.d.leads.length+1).padStart(3,'0'),n:nm,src:$('#l_s').value,camp:null,tgl:SAL.d.rep,ang:+$('#l_a').value,wew:+$('#l_w').value,keb:+$('#l_k').value,rb:+$('#l_r').value,it:+$('#l_i').value,s:$('#l_o').value,st:'Baru'};
    SAL.d.leads.push(l);SAL.save();V.s_lead(el);toast(`Lead ${l.id} · skor ${SAL.score(l)} (${SAL.cat(SAL.score(l))})`)}}]})};
};
V.s_pipeline=el=>{
  const d=SAL.d,stg=d.stages.map(s=>s[0]);
  el.innerHTML=`<div class="tools"><b>${d.deals.filter(SAL.open).length}</b> peluang terbuka · tertimbang <b>${juta(d.deals.filter(SAL.open).reduce((s,x)=>s+x.v*SAL.prob(x.st),0))}</b><span class="sp"></span><button class="btn pri" id="ad">${ico('plus')} Tambah peluang</button></div><div class="kan" id="kb"></div>`;
  const kb=()=>{$('#kb').innerHTML=stg.map(s=>{const L=d.deals.filter(x=>x.st===s);return `<div class="col"><h5>${s} · ${pct(SAL.prob(s),0)}<b>${L.length}</b></h5><div style="font-size:11.5px;color:var(--mute);margin:-4px 0 8px">${juta(L.reduce((a,x)=>a+x.v,0))}</div>${L.slice(0,10).map(x=>`<div class="cd"><b>${esc(x.c)}</b><small>${juta(x.v)} · ${esc(x.s)}<br>target ${fdate(x.tg)} ${SAL.late(x)?pill('terlambat','bad'):''}</small><div class="mv">${stg.indexOf(s)>0&&s!=='Kalah'&&s!=='Menang'?`<button class="btn sm" data-id="${x.id}" data-d="-1">◀</button>`:''}${SAL.open(x)?`<button class="btn sm" data-id="${x.id}" data-d="1">▶</button><button class="btn sm dng" data-id="${x.id}" data-x="1">✕</button>`:''}</div></div>`).join('')}${L.length>10?`<small style="color:var(--mute)">+${L.length-10} lainnya</small>`:''}</div>`}).join('');
   $$('#kb button').forEach(b=>b.onclick=()=>{const x=d.deals.find(y=>y.id===b.dataset.id);if(b.dataset.x)x.st='Kalah';else{const nx=stg[stg.indexOf(x.st)+ +b.dataset.d];x.st=nx==='Kalah'?'Menang':nx}SAL.save();V.s_pipeline(el)})};kb();
  $('#ad').onclick=()=>{if(DEMO()&&d.deals.length>=30)return lock('Peluang lebih dari 30');
   modal('Tambah peluang',`<div class="form"><div class="full"><label>Pelanggan</label><select class="sel" id="d_c">${opts(d.cust.map(c=>c.n))}</select></div><div><label>Sales</label><select class="sel" id="d_s">${opts(d.team.map(t=>t.n))}</select></div><div><label>Nilai (Rp)</label><input class="inp" type="number" id="d_v" value="50000000"></div><div class="full"><label>Target tutup</label><input class="inp" type="date" id="d_t" value="${d.rep}"></div></div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const v=+$('#d_v').value;if(!(v>0)){toast('Nilai tidak valid');return false}d.deals.push({id:'D-'+String(d.deals.length+1).padStart(3,'0'),c:$('#d_c').value,s:$('#d_s').value,src:'Referral',st:'Prospek',v,cr:d.rep,tg:$('#d_t').value,lid:null});SAL.save();V.s_pipeline(el);toast('Peluang ditambahkan')}}]})};
};
V.s_penjualan=el=>{
  const d=SAL.d,q=(App.q||'').toLowerCase();let fm=0;
  el.innerHTML=`<div class="tools"><select class="sel" id="fm"><option value="0">Semua bulan</option>${MN.slice(0,d.p.bln).map((n,i)=>`<option value="${i+1}">${n}</option>`).join('')}</select><span class="sp"></span><button class="btn" id="ex">${ico('down')} Ekspor CSV</button><button class="btn pri" id="ad">${ico('plus')} Catat penjualan</button></div><div class="tbl" id="tb" style="max-height:calc(100vh - 190px)"></div>`;
  $('#ex').classList.toggle('lk',DEMO());
  const rows=()=>d.trx.filter(t=>(!fm||SAL.inM(t,fm))&&(!q||(t.c+t.p+t.s).toLowerCase().includes(q))).map(t=>({t,...SAL.line(t)})).reverse();
  const draw=()=>dataTable($('#tb'),[{h:'Tanggal',v:r=>r.t.d,r:r=>fdate(r.t.d)},{h:'Pelanggan',v:r=>r.t.c},{h:'Produk',v:r=>r.t.p},{h:'Sales',v:r=>r.t.s},{h:'Qty',n:1,v:r=>r.t.q,sum:1},{h:'Diskon',n:1,v:r=>r.t.disc,r:r=>pct(r.t.disc,0)},{h:'Pendapatan',n:1,v:r=>r.rev,r:r=>fmt(r.rev),sum:1},{h:'Laba kotor',n:1,v:r=>r.laba,r:r=>fmt(r.laba),sum:1}],rows(),{total:1});
  draw();$('#fm').onchange=e=>{fm=+e.target.value;draw()};
  $('#ex').onclick=gate('Ekspor penjualan',()=>download('penjualan.csv',toCSV([['Tanggal','Pelanggan','Produk','Sales','Qty','Diskon','Pendapatan','Laba kotor'],...rows().map(r=>[r.t.d,r.t.c,r.t.p,r.t.s,r.t.q,r.t.disc,r.rev,r.laba])])));
  $('#ad').onclick=()=>{if(DEMO()&&d.trx.length>=150)return lock('Transaksi tanpa batas');
   modal('Catat penjualan',`<div class="form"><div class="full"><label>Pelanggan</label><select class="sel" id="t_c">${opts(d.cust.map(c=>c.n))}</select></div><div><label>Produk</label><select class="sel" id="t_p">${opts(d.prods.map(p=>p.n))}</select></div><div><label>Sales</label><select class="sel" id="t_s">${opts(d.team.map(t=>t.n))}</select></div><div><label>Tanggal</label><input class="inp" type="date" id="t_d" value="${d.rep}"></div><div><label>Qty</label><input class="inp" type="number" id="t_q" value="1" min="1"></div><div class="full"><label>Diskon</label><select class="sel" id="t_k"><option value="0">0%</option><option value="0.05">5%</option><option value="0.1">10%</option><option value="0.15">15%</option></select></div></div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{const q=+$('#t_q').value;if(!(q>0)){toast('Qty tidak valid');return false}d.trx.push({d:$('#t_d').value,s:$('#t_s').value,c:$('#t_c').value,p:$('#t_p').value,q,disc:+$('#t_k').value});d.trx.sort((a,b)=>a.d<b.d?-1:1);SAL.save();V.s_penjualan(el);toast('Penjualan dicatat')}}]})};
};
V.s_produk=el=>{
  const d=SAL.d;
  el.innerHTML=`<div class="tbl" id="tb"></div>`;
  dataTable($('#tb'),[{h:'Kode',v:p=>p.k},{h:'Produk',v:p=>p.n},{h:'Kategori',v:p=>p.kat},{h:'HPP',n:1,v:p=>p.hpp,r:p=>fmt(p.hpp)},{h:'Harga',n:1,v:p=>p.h,r:p=>fmt(p.h)},{h:'Margin',n:1,v:p=>(p.h-p.hpp)/p.h,r:p=>pct((p.h-p.hpp)/p.h)},{h:'Unit terjual',n:1,v:p=>d.trx.filter(t=>t.p===p.n).reduce((s,t)=>s+t.q,0),sum:1},{h:'Pendapatan',n:1,v:p=>SAL.rev(t=>t.p===p.n),r:p=>fmt(SAL.rev(t=>t.p===p.n)),sum:1},{h:'Laba kotor',n:1,v:p=>d.trx.filter(t=>t.p===p.n).reduce((s,t)=>s+SAL.line(t).laba,0),r:p=>fmt(d.trx.filter(t=>t.p===p.n).reduce((s,t)=>s+SAL.line(t).laba,0)),sum:1}],d.prods,{total:1,click:p=>modal('Ubah harga · '+p.n,`<div class="form"><div><label>HPP / unit</label><input class="inp" type="number" id="p_h" value="${p.hpp}"></div><div><label>Harga / unit</label><input class="inp" type="number" id="p_j" value="${p.h}"></div></div>`,{buttons:[{text:'Batal'},{text:'Simpan',cls:'pri',fn:()=>{p.hpp=+$('#p_h').value;p.h=+$('#p_j').value;SAL.save();App.render();toast('Harga diperbarui')}}]})});
};
V.s_komisi=el=>{
  const d=SAL.d;let m=d.p.bln;
  const draw=()=>{const rows=d.team.map(t=>({n:t.n,w:t.w,...SAL.komisi(t.n,m)})).map(r=>({...r}));const rk=[...rows].sort((a,b)=>b.pc-a.pc);rows.forEach(r=>r.rank=rk.findIndex(x=>x.n===r.n)+1);
   el.innerHTML=`<div class="tools"><select class="sel" id="mm">${MN.slice(0,d.p.bln).map((n,i)=>`<option value="${i+1}" ${i+1===m?'selected':''}>${n} ${d.p.tahun}</option>`).join('')}</select><span class="sp"></span><button class="btn" id="sl">${ico('file')} Slip komisi</button></div><div class="grid g32"><div class="card"><h3>Target vs realisasi <small>jt Rp</small></h3><div id="c1"></div></div><div class="card"><h3>Tarif berjenjang</h3><div class="tbl"><table><tbody>${d.tiers.map((t,i)=>`<tr><td>Capaian ≥ ${pct(t[0],0)}</td><td class="n">${pct(t[1])}</td></tr>`).join('')}<tr><td>Bonus capaian ≥ 100%</td><td class="n">${idr(d.p.bonus)}</td></tr></tbody></table></div></div></div><div class="tbl" id="tb" style="margin-top:16px"></div>`;
   barChart($('#c1'),rows.map(r=>r.n.split(' ')[0]),rows.map(r=>r.real/1e6),{w:620,h:220});
   dataTable($('#tb'),[{h:'Sales',v:r=>r.n},{h:'Wilayah',v:r=>r.w},{h:'Target',n:1,v:r=>r.t,r:r=>fmt(r.t),sum:1},{h:'Realisasi',n:1,v:r=>r.real,r:r=>fmt(r.real),sum:1},{h:'Capaian',n:1,v:r=>r.pc,r:r=>`<b style="color:var(--${r.pc>=1?'ok':r.pc<.8?'bad':'ink'})">${pct(r.pc)}</b>`},{h:'Tarif',n:1,v:r=>r.r,r:r=>pct(r.r)},{h:'Komisi',n:1,v:r=>r.k,r:r=>fmt(r.k),sum:1},{h:'Bonus',n:1,v:r=>r.b,r:r=>fmt(r.b),sum:1},{h:'Total',n:1,v:r=>r.tot,r:r=>'<b>'+fmt(r.tot)+'</b>',sum:1},{h:'Peringkat',n:1,v:r=>r.rank}],rows,{total:1});
   $('#mm').onchange=e=>{m=+e.target.value;draw()};$('#sl').classList.toggle('lk',DEMO());
   $('#sl').onclick=()=>{if(DEMO())return lock('Slip komisi');slip(rows[0])};
   function slip(r){modal('Slip komisi',`<div class="slip"><h2>${esc(d.p.company)}</h2><div style="color:#64748b;margin-bottom:12px">SLIP KOMISI · ${MN[m-1]} ${d.p.tahun}</div><p><b>${esc(r.n)}</b> · ${esc(r.w)}</p><table><tr><td>Target</td><td style="text-align:right">${fmt(r.t)}</td></tr><tr><td>Realisasi</td><td style="text-align:right">${fmt(r.real)}</td></tr><tr><td>Capaian</td><td style="text-align:right">${pct(r.pc)}</td></tr><tr><td>Komisi (${pct(r.r)})</td><td style="text-align:right">${fmt(r.k)}</td></tr><tr><td>Bonus</td><td style="text-align:right">${fmt(r.b)}</td></tr></table><div style="margin-top:14px;padding:12px 16px;background:#0b1a30;color:#fff;border-radius:10px;display:flex;justify-content:space-between"><b>TOTAL</b><b>${idr(r.tot)}</b></div></div>`,{buttons:[{text:'Tutup'},{text:'Cetak',cls:'pri',fn:()=>{window.print();return false}}]})}
  };draw();
};
V.s_kampanye=el=>{
  if(DEMO())return lockPage(el,'Kampanye & ROI','Analisis biaya, CPL, CAC, ROAS, dan ROI tiap kampanye tersedia di edisi lengkap.');
  const d=SAL.d,rows=d.camps.map(c=>{const ls=d.leads.filter(l=>l.camp===c.n),w=d.deals.filter(x=>x.st==='Menang'&&ls.some(l=>l.id===x.lid)),rev=w.reduce((s,x)=>s+x.v,0);return {...c,leads:ls.length,win:w.length,rev,cpl:ls.length?c.biaya/ls.length:0,cac:w.length?c.biaya/w.length:0,cpc:c.biaya/c.klik,roas:rev/c.biaya,roi:(rev-c.biaya)/c.biaya,ctr:c.klik/c.imp}});
  el.innerHTML=`<div class="grid g2"><div class="card"><h3>ROAS per kampanye</h3><div id="c1"></div></div><div class="card"><h3>Biaya vs pendapatan <small>jt Rp</small></h3><div id="c2"></div></div></div><div class="tbl" id="tb" style="margin-top:16px"></div>`;
  hBars($('#c1'),rows.map(r=>r.n),rows.map(r=>+r.roas.toFixed(2)),{fmt:v=>String(v).replace('.',',')+'x'});barChart($('#c2'),rows.map(r=>r.n.split(' ')[0]),rows.map(r=>r.rev/1e6),{w:520,h:220,colors:[PAL[1]]});
  dataTable($('#tb'),[{h:'Kampanye',v:r=>r.n},{h:'Kanal',v:r=>r.kanal},{h:'Biaya',n:1,v:r=>r.biaya,r:r=>fmt(r.biaya),sum:1},{h:'Klik',n:1,v:r=>r.klik,r:r=>fmt(r.klik),sum:1},{h:'CTR',n:1,v:r=>r.ctr,r:r=>pct(r.ctr,2)},{h:'Lead',n:1,v:r=>r.leads,sum:1},{h:'Menang',n:1,v:r=>r.win,sum:1},{h:'CPL',n:1,v:r=>r.cpl,r:r=>fmt(r.cpl)},{h:'CAC',n:1,v:r=>r.cac,r:r=>r.cac?fmt(r.cac):'-'},{h:'Pendapatan',n:1,v:r=>r.rev,r:r=>fmt(r.rev),sum:1},{h:'ROAS',n:1,v:r=>r.roas,r:r=>r.roas.toFixed(1).replace('.',',')+'x'},{h:'ROI',n:1,v:r=>r.roi,r:r=>`<b style="color:var(--${r.roi>=0?'ok':'bad'})">${pct(r.roi,0)}</b>`}],rows,{total:1});
};
V.s_funnel=el=>{
  if(DEMO())return lockPage(el,'Funnel penjualan','Corong lead hingga menang, konversi tiap tahap, dan rasio CAC tersedia di edisi lengkap.');
  const d=SAL.d,L=d.leads.length,q=d.leads.filter(l=>['Terkualifikasi','Jadi Peluang'].includes(l.st)).length,j=d.leads.filter(l=>l.st==='Jadi Peluang').length,dl=d.deals.length,w=d.deals.filter(x=>x.st==='Menang').length,wv=d.deals.filter(x=>x.st==='Menang').reduce((s,x)=>s+x.v,0),bi=d.camps.reduce((s,c)=>s+c.biaya,0);
  const st=[['Lead masuk',L],['Terkualifikasi+',q],['Jadi peluang',j],['Peluang tercatat',dl],['Menang',w]];
  el.innerHTML=`<div class="grid g32"><div class="card"><h3>Corong penjualan</h3><div id="c1"></div></div><div class="card"><h3>Indikator</h3><div style="font-size:13.5px;line-height:2.1"><div>Biaya pemasaran <b style="float:right">${idr(bi)}</b></div><div>Nilai peluang menang <b style="float:right">${idr(wv)}</b></div><div>CAC rata-rata <b style="float:right">${w?idr(bi/w):'-'}</b></div><div>Rata-rata nilai deal <b style="float:right">${w?idr(wv/w):'-'}</b></div><div>Win rate (peluang) <b style="float:right">${pct(w/(w+d.deals.filter(x=>x.st==='Kalah').length||1))}</b></div></div></div></div><div class="tbl" style="margin-top:16px"><table><thead><tr><th>Tahap</th><th class="n">Jumlah</th><th class="n">Konversi dari tahap sebelumnya</th></tr></thead><tbody>${st.map((s,i)=>`<tr><td>${s[0]}</td><td class="n">${s[1]}</td><td class="n">${i?pct(st[i-1][1]?s[1]/st[i-1][1]:0):'-'}</td></tr>`).join('')}</tbody></table></div>`;
  hBars($('#c1'),st.map(s=>s[0]),st.map(s=>s[1]),{fmt:v=>v});
};
V.s_pengaturan=el=>{
  const p=SAL.d.p;
  el.innerHTML=`<div class="grid g2"><div class="card"><h3>Parameter</h3><div class="form"><div class="full"><label>Nama perusahaan</label><input class="inp" data-p="company" value="${esc(p.company)}"></div><div><label>Bulan periode (1-12)</label><input class="inp" type="number" min="1" max="12" data-p="bln" value="${p.bln}"></div><div><label>Bonus capaian ≥100% (Rp)</label><input class="inp" type="number" data-p="bonus" value="${p.bonus}"></div><div><label>Skor minimal Hot</label><input class="inp" type="number" data-p="hot" value="${p.hot}"></div><div><label>Skor minimal Warm</label><input class="inp" type="number" data-p="warm" value="${p.warm}"></div><div><label>Pelanggan berisiko (hari)</label><input class="inp" type="number" data-p="risk" value="${p.risk}"></div><div><label>Pelanggan tidur (hari)</label><input class="inp" type="number" data-p="sleep" value="${p.sleep}"></div></div></div>
  <div class="card"><h3>Bobot skor lead</h3><div class="form">${['Anggaran','Wewenang','Kebutuhan','Rencana beli','Interaksi'].map((n,i)=>`<div><label>${n}</label><input class="inp" type="number" data-w="${i}" value="${p.w[i]}"></div>`).join('')}</div><h3 style="margin-top:16px">Data</h3><div class="tools"><button class="btn" id="bk">${ico('down')} Cadangkan (JSON)</button><button class="btn dng" id="rs">Kembalikan data contoh</button></div><p style="color:var(--mute)">Semua angka adalah data simulasi. Produk diberikan sebagaimana adanya, tanpa garansi, pembaruan, maupun dukungan.</p></div></div>`;
  $$('[data-p]',el).forEach(i=>i.onchange=()=>{p[i.dataset.p]=i.type==='number'?+i.value:i.value;SAL.save();toast('Disimpan')});$$('[data-w]',el).forEach(i=>i.onchange=()=>{p.w[+i.dataset.w]=+i.value;SAL.save();toast('Disimpan')});
  $('#bk').onclick=gate('Cadangan data',()=>download('mantam-sales-cadangan.json',JSON.stringify(SAL.d),'application/json'));
  $('#rs').onclick=()=>{if(confirm('Semua perubahan akan hilang. Lanjutkan?')){SAL.reset();App.render();toast('Data contoh dikembalikan')}};
};

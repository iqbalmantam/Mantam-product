const MODS=[
 {g:'Human Resources',items:[['dashboard','Dasbor','dash'],['karyawan','Karyawan','users'],['absensi','Absensi','clock'],['payroll','Payroll','cash'],['cuti','Cuti','cal'],['rekrutmen','Rekrutmen','brief'],['kinerja','Kinerja & Talenta','star'],['pelatihan','Pelatihan','book'],['pengaturan','Pengaturan','gear']]},
 {g:'Finance & Accounting',items:[['f_dashboard','Dasbor Keuangan','dash'],['f_jurnal','Jurnal Umum','book'],['f_penjualan','Penjualan & Piutang','trend'],['f_pembelian','Pembelian & Utang','box'],['f_bukubesar','Buku Besar','file'],['f_labarugi','Laba Rugi','cash'],['f_neraca','Neraca','dash'],['f_aging','Umur Piutang/Utang','clock'],['f_arus','Arus Kas','trend'],['f_aset','Aset Tetap','box'],['f_ppn','PPN','alert'],['f_pengaturan','Pengaturan Keuangan','gear']]},
 {g:'Sales & Marketing',items:[['s_dashboard','Dasbor Penjualan','dash'],['s_pelanggan','Pelanggan (CRM)','users'],['s_lead','Lead & Skor','star'],['s_pipeline','Pipeline','brief'],['s_penjualan','Penjualan','trend'],['s_produk','Produk & Harga','box'],['s_komisi','Komisi','cash'],['s_kampanye','Kampanye & ROI','alert'],['s_funnel','Funnel','trend'],['s_pengaturan','Pengaturan Sales','gear']]},
 {g:'Media Sosial',items:[['m_dashboard','Dasbor Sosial','dash'],['m_kalender','Kalender Konten','cal'],['m_konten','Papan Konten','brief'],['m_analitik','Analitik','trend'],['m_ide','Ide & Hashtag','star'],['m_pengaturan','Pengaturan Sosial','gear']]}];
const App={cur:'dashboard',q:'',
 init(){HR.init();FIN.init();SAL.init();SOC.init();try{if(Store.get('theme','')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}
  $('#lic').textContent=DEMO()?'EDISI DEMO':'LISENSI LENGKAP';$('#lic').className='lic'+(DEMO()?'':' full');
  $('#nav').innerHTML=MODS.map(m=>`<div class="mod"><h6>${m.g}${m.soon?' · segera':''}</h6>${m.items.map(i=>`<button class="nav${m.soon?' soon':''}" data-k="${i[0]}">${ico(i[2])}<span>${i[1]}</span></button>`).join('')}</div>`).join('');
  $$('.nav:not(.soon)').forEach(b=>b.onclick=()=>{this.cur=b.dataset.k;this.q='';$('#q').value='';this.render()});
  $('#q').oninput=e=>{this.q=e.target.value;if(['karyawan','f_jurnal','s_pelanggan','s_penjualan'].includes(this.cur))this.render()};
  $('#ft').innerHTML=DEMO()?`Edisi demo · fitur terbatas.<br><a href="#" id="up" style="color:#7dd3fc">Buka edisi lengkap</a>`:`Terdaftar: ${esc(CONFIG.buyer)}`;
  const u=$('#up');if(u)u.onclick=e=>{e.preventDefault();lock('Edisi lengkap')};
  this.render()},
 render(){const k=this.cur,grp=MODS.find(m=>m.items.some(i=>i[0]===k)),item=grp.items.find(i=>i[0]===k);
  $$('.nav').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
  $('#h1').textContent=item[1];$('#cr').textContent=grp.g+' · '+HR.P.company;
  const el=$('#ct');el.innerHTML='';V[k](el)},
 theme(){const d=document.documentElement;d.dataset.theme=d.dataset.theme==='dark'?'':'dark';try{Store.set('theme',d.dataset.theme)}catch(e){}}};
App.init();

/* Mantam Suite · core: util, store, UI kit, grafik SVG */
const CONFIG={edition:'demo',buyer:'',modules:null,whatsapp:'6289623291732',appName:'Mantam Suite'};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const DEMO=()=>CONFIG.edition==='demo';
const fmt=n=>new Intl.NumberFormat('id-ID').format(Math.round(n||0));
const idr=n=>'Rp '+fmt(n);
const juta=n=>(n/1e6).toLocaleString('id-ID',{maximumFractionDigits:1})+' jt';
const pct=(n,d=1)=>(n*100).toFixed(d).replace('.',',')+'%';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const dt=s=>s?new Date(s+'T00:00:00'):null;
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fdate=s=>{if(!s)return'-';const d=dt(s);return d.getDate()+' '+MN[d.getMonth()].slice(0,3)+' '+d.getFullYear()};
const years=(a,b)=>(b-a)/(365.25*864e5);
const initials=n=>n.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase();

/* ---------- penyimpanan lokal (localStorage, cadangan memori) ---------- */
const Store={
  mem:{},
  get(k,def){try{const v=localStorage.getItem('mantam:'+k);return v?JSON.parse(v):(this.mem[k]??def)}catch(e){return this.mem[k]??def}},
  set(k,v){this.mem[k]=v;try{localStorage.setItem('mantam:'+k,JSON.stringify(v))}catch(e){}},
  del(k){delete this.mem[k];try{localStorage.removeItem('mantam:'+k)}catch(e){}}
};

/* ---------- ikon ---------- */
const ICONS={
 moon:'<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',file:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 dash:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2.4.6 4 2.300 4 5.200"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 cash:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9v.01M18 15v.01"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 brief:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
 star:'<path d="M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.8z"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',down:'<path d="M12 4v12M6 11l6 6 6-6M4 21h16"/>',file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
 trend:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',moon:'<path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z"/>',
 box:'<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
};
const ico=k=>`<svg viewBox="0 0 24 24">${ICONS[k]||''}</svg>`;

/* ---------- UI kit ---------- */
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function modal(title,html,opts={}){
  const m=document.createElement('div');m.className='mask';
  m.innerHTML=`<div class="modal" style="${opts.w?'width:'+opts.w:''}"><header><h2>${title}</h2><button class="x" aria-label="Tutup">×</button></header><div class="body">${html}</div>${opts.foot===false?'':'<footer></footer>'}</div>`;
  document.body.appendChild(m);const close=()=>m.remove();
  m.querySelector('.x').onclick=close;m.addEventListener('mousedown',e=>{if(e.target===m)close()});
  const foot=m.querySelector('footer');
  (opts.buttons||[]).forEach(b=>{const x=document.createElement('button');x.className='btn '+(b.cls||'');x.textContent=b.text;x.onclick=()=>{if(!b.fn||b.fn(m)!==false)close()};foot.appendChild(x)});
  m.close=close;return m;
}
function lock(feature){
  const m=modal('Fitur versi lengkap',`<p style="margin:0 0 10px"><b>${esc(feature)}</b> hanya tersedia di versi lengkap Mantam Suite.</p><p style="margin:0;color:var(--mute)">Versi demo ini memakai data simulasi dengan kapasitas dan fitur terbatas. Pesan versi lengkap lewat WhatsApp.</p>`,{w:'460px',buttons:[{text:'Nanti saja'},{text:'Pesan via WhatsApp',cls:'pri',fn:()=>{window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent('Halo, saya tertarik Mantam Suite versi lengkap ('+feature+')')}`,'_blank')}}]});
}
const gate=(feature,fn)=>(...a)=>DEMO()?lock(feature):fn(...a);
function download(name,text,mime='text/csv;charset=utf-8'){const b=new Blob(['﻿'+text],{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),600)}
const toCSV=rows=>rows.map(r=>r.map(v=>{v=String(v??'');return /[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(',')).join('\n');
function pill(t,c){return `<span class="pill p-${c}">${esc(t)}</span>`}

/* tabel dengan urut, cari, klik baris */
function dataTable(el,cols,rows,opt={}){
  let sort=opt.sort||null,asc=true;
  const draw=()=>{
    let rs=[...rows];
    if(sort!=null){const c=cols[sort];rs.sort((a,b)=>{const x=c.v?c.v(a):a[c.k],y=c.v?c.v(b):b[c.k];return (typeof x==='number'&&typeof y==='number'?x-y:String(x??'').localeCompare(String(y??''),'id'))*(asc?1:-1)})}
    const total=opt.total?`<tfoot><tr>${cols.map((c,i)=>`<td class="${c.n?'n':''}">${i===0?'TOTAL':c.sum?c.f?c.f(rs.reduce((s,r)=>s+(c.v?c.v(r):r[c.k]||0),0)):fmt(rs.reduce((s,r)=>s+(c.v?c.v(r):r[c.k]||0),0)):''}</td>`).join('')}</tr></tfoot>`:'';
    el.innerHTML=`<table><thead><tr>${cols.map((c,i)=>`<th class="${c.n?'n':''}" data-i="${i}">${esc(c.h)}${sort===i?(asc?' ▲':' ▼'):''}</th>`).join('')}</tr></thead><tbody>${rs.map((r,ri)=>`<tr class="${opt.click?'clk':''}" data-r="${ri}">${cols.map(c=>`<td class="${c.n?'n':''}">${c.r?c.r(r):esc(c.f?c.f(c.v?c.v(r):r[c.k]):(c.v?c.v(r):r[c.k]))}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${cols.length}" class="empty">Belum ada data</td></tr>`}</tbody>${total}</table>`;
    $$('th',el).forEach(th=>th.onclick=()=>{const i=+th.dataset.i;if(sort===i)asc=!asc;else{sort=i;asc=true}draw()});
    if(opt.click)$$('tbody tr',el).forEach(tr=>tr.onclick=e=>{if(e.target.closest('button,input,select'))return;const r=rs[+tr.dataset.r];r&&opt.click(r)});
    opt.after&&opt.after(el,rs);
  };
  draw();return{redraw:draw};
}

/* ---------- grafik SVG tanpa pustaka ---------- */
const PAL=['#0ea5a4','#2563eb','#f59e0b','#7c3aed','#ef4444','#14b8a6','#64748b'];
function barChart(el,labels,vals,o={}){
  const W=o.w||520,H=o.h||230,pl=o.fmt||(v=>fmt(v)),mx=Math.max(...vals,1)*1.12,pad={l:44,r:10,t:12,b:o.rot?52:30},bw=(W-pad.l-pad.r)/labels.length;
  const ticks=4,tk=Array.from({length:ticks+1},(_,i)=>mx*i/ticks);
  el.innerHTML=`<svg class="ch" viewBox="0 0 ${W} ${H}" width="100%" role="img">`+tk.map(v=>{const y=pad.t+(H-pad.t-pad.b)*(1-v/mx);return `<line x1="${pad.l}" x2="${W-pad.r}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${pad.l-6}" y="${y+4}" text-anchor="end">${(o.axis||pl)(v)}</text>`}).join('')+
  vals.map((v,i)=>{const h=(H-pad.t-pad.b)*v/mx,x=pad.l+i*bw+bw*.18,y=H-pad.b-h;return `<rect x="${x}" y="${y}" width="${bw*.64}" height="${Math.max(h,0)}" rx="5" fill="${o.colors?o.colors[i%o.colors.length]:PAL[0]}"><title>${esc(labels[i])}: ${pl(v)}</title></rect><text x="${x+bw*.32}" y="${H-pad.b+15}" text-anchor="middle"${o.rot?` transform="rotate(-28 ${x+bw*.32} ${H-pad.b+15})" text-anchor="end"`:''}>${esc(String(labels[i]).slice(0,12))}</text><text x="${x+bw*.32}" y="${y-4}" text-anchor="middle" style="font-weight:700;fill:var(--ink)">${pl(v)}</text>`}).join('')+'</svg>';
}
function hBars(el,labels,vals,o={}){
  const mx=Math.max(...vals,1),pl=o.fmt||fmt;
  el.innerHTML=labels.map((l,i)=>`<div class="bar-h"><span>${esc(l)}</span><div><i style="width:${vals[i]/mx*100}%"></i></div><b>${pl(vals[i])}</b></div>`).join('');
}
function donut(el,labels,vals,o={}){
  const S=170,R=66,r=42,c=S/2,tot=vals.reduce((a,b)=>a+b,0)||1;let a0=-Math.PI/2,p='';
  vals.forEach((v,i)=>{if(!v)return;const a1=a0+v/tot*Math.PI*2,big=a1-a0>Math.PI?1:0,pt=(R_,a)=>[c+R_*Math.cos(a),c+R_*Math.sin(a)];
    const [x1,y1]=pt(R,a0),[x2,y2]=pt(R,a1-.0001),[x3,y3]=pt(r,a1-.0001),[x4,y4]=pt(r,a0);
    p+=`<path d="M${x1} ${y1}A${R} ${R} 0 ${big} 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 ${big} 0 ${x4} ${y4}Z" fill="${PAL[i%PAL.length]}"><title>${esc(labels[i])}: ${v}</title></path>`;a0=a1});
  el.innerHTML=`<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap"><svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">${p}<text x="${c}" y="${c+2}" text-anchor="middle" style="font-size:24px;font-weight:800;fill:var(--ink)">${o.center??tot}</text><text x="${c}" y="${c+18}" text-anchor="middle" style="font-size:10px;fill:var(--mute)">${o.sub||'total'}</text></svg><div>${labels.map((l,i)=>`<div style="margin:5px 0;font-size:12.5px"><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${PAL[i%PAL.length]};margin-right:8px"></i>${esc(l)} <b>${vals[i]}</b></div>`).join('')}</div></div>`;
}
function spark(vals,w=90,h=26){const mx=Math.max(...vals),mn=Math.min(...vals),rg=mx-mn||1;return `<svg width="${w}" height="${h}"><polyline fill="none" stroke="var(--brand)" stroke-width="2" points="${vals.map((v,i)=>`${i/(vals.length-1)*w},${h-2-(v-mn)/rg*(h-4)}`).join(' ')}"/></svg>`}

/* ---------- impor CSV ---------- */
function parseCSV(t){t=t.replace(/^﻿/,'');const first=t.split(/\r?\n/)[0]||'',del=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',',rows=[];let row=[],f='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else if(c==='"')q=true;else if(c===del){row.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(f);f='';if(row.some(x=>x.trim()!==''))rows.push(row);row=[]}else f+=c}
  row.push(f);if(row.some(x=>x.trim()!==''))rows.push(row);return rows}
function parseNum(v){let s=String(v??'').replace(/Rp|\s/gi,'');if(s==='')return NaN;if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');else if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))s=s.replace(/,/g,'');else s=s.replace(',','.');return Number(s)}
function parseDate(v){const s=String(v??'').trim();let m;if((m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)))return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;if((m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)))return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;return null}
/* cols: [{k,h,req,t:'num'|'date'|'str',ex:'contoh'}]; onRows(list)->pesan ; list item = objek per kolom */
function importCSV(title,cols,onRows,validate){
  if(DEMO())return lock('Impor CSV');
  const tpl=()=>download(title.toLowerCase().replace(/\W+/g,'-')+'-templat.csv',toCSV([cols.map(c=>c.h),cols.map(c=>c.ex??'')]));
  const m=modal('Impor CSV · '+title,`<p style="margin:0 0 8px;color:var(--mute)">Kolom: ${cols.map(c=>`<b>${esc(c.h)}</b>${c.req?'*':''}`).join(', ')}. Baris pertama adalah judul kolom. Tanggal: YYYY-MM-DD atau DD/MM/YYYY.</p><div class="tools"><button class="btn" id="im_t">${ico('down')} Unduh templat</button></div><input type="file" id="im_f" accept=".csv,text/csv,.txt"><div id="im_r" class="note" style="margin-top:12px">Pilih file CSV.</div>`,{w:'620px',buttons:[{text:'Batal'},{text:'Impor',cls:'pri',fn:()=>{const list=window.__imp;if(!list||!list.ok.length){toast('Tidak ada baris valid');return false}const msg=onRows(list.ok);toast(msg||`${list.ok.length} baris diimpor`)}}]});
  $('#im_t').onclick=tpl;
  $('#im_f').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const rows=parseCSV(String(r.result));if(rows.length<2){$('#im_r').textContent='File kosong atau tanpa baris data.';window.__imp=null;return}
    const hd=rows[0].map(x=>x.trim().toLowerCase()),idx=cols.map(c=>{let i=hd.indexOf(c.h.toLowerCase());if(i<0)i=hd.indexOf(c.k.toLowerCase());return i}),miss=cols.filter((c,i)=>c.req&&idx[i]<0).map(c=>c.h);
    if(miss.length){$('#im_r').innerHTML=`<span style="color:var(--bad)">Kolom wajib tidak ditemukan: ${esc(miss.join(', '))}</span>`;window.__imp=null;return}
    const ok=[],bad=[];rows.slice(1).forEach((r,n)=>{const o={};let err='';cols.forEach((c,i)=>{let v=idx[i]>=0?(r[idx[i]]??'').trim():'';if(c.t==='num'){const x=parseNum(v);if(v!==''&&isNaN(x))err=`${c.h} bukan angka`;o[c.k]=isNaN(x)?undefined:x}else if(c.t==='date'){const x=v?parseDate(v):null;if(v&&!x)err=`${c.h} format tanggal salah`;o[c.k]=x||undefined}else o[c.k]=v||undefined;if(c.req&&(o[c.k]===undefined||o[c.k]===''))err=err||`${c.h} wajib diisi`});
      if(!err&&validate)err=validate(o)||'';err?bad.push(`Baris ${n+2}: ${err}`):ok.push(o)});
    window.__imp={ok,bad};$('#im_r').innerHTML=`<b>${ok.length}</b> baris valid, <b style="color:${bad.length?'var(--bad)':'inherit'}">${bad.length}</b> dilewati.${bad.length?'<br><small>'+bad.slice(0,5).map(esc).join('<br>')+(bad.length>5?'<br>…':'')+'</small>':''}`};r.readAsText(f)};
}

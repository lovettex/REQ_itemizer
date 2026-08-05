const groups = [
  // PG 01-02: Glass Frame — Vertical Section (MST/001-002)
  ['Glass frame',1,['GF - 1','GF - 2','GF - 3','GF - 4','GF - 5','GF - 6','GF - 7','GF - 8']],['Glass frame',2,['GF - 9','GF - 10','GF - 11','GF - 12','GF - 13']],
  // PG 03-04: Glass Frame — Horizontal Section (MST/003-004)
  ['Glass frame',3,['GF - A','GF - B','GF - C','GF - D','GF - E','GF - F','GF - G','GF - H','GF - I']],['Glass frame',4,['GF - J','GF - K','GF - L','GF - M','GF - N','GF - O','GF - P','GF - Q']],
  // PG 05-06: Door Frame — Horizontal Section (MST/005-006)
  ['Swing door frame',5,['SWING DF - A','SWING DF - B','SWING DF - C','SWING DF - D','SWING DF - E','SWING DF - F','SWING DF - G','SWING DF - H','SWING DF - I']],['Swing door frame',6,['SWING DF - J','SWING DF - K','SWING DF - L','SWING DF - M','SWING DF - N']],
  // PG 07: Door Frame Horizontal + Swing Door Panel (MST/007)
  ['Swing door panel',7,['SWING DP - A1','SWING DP - A2','SWING DP - B1','SWING DP - B2','SWING DP - E']],
  // PG 08: T1 Bifold Door (MST/008)
  ['Bifold door',8,['SWING DP - A3','SWING DP - A3 (4 Panels)']],
  // PG 09: Door Panel — Horizontal Section (MST/009)
  ['Swing door panel',9,['SWING DP - C1','SWING DP - C2','SWING DP - D1']],
  // PG 10: Door Panel & Door Frame — Vertical Section (MST/010)
  ['Door vertical',10,['DV - 1','DV - 2','DV - 3','DV - 4','DV - 5','DV - 6','DV - 7','DV - 8']],
  // PG 11: T-30 Series Door (MST/011)
  ['T-30 series door',11,['SWING DP - E','DV - E']],
  // PG 12-13: Transom (MST/012-013)
  ['Transom',12,['TS - 1','TS - 2','TS - 3','TS - 4','TS - 5','TS - 6',"DOOR'S TS & TS - 1","DOOR'S TS & TS - 2"]],['Transom',13,["DOOR'S TS - 1","DOOR'S TS - 2","DOOR'S TS - 3"]],
  // PG 14-15: Mullion (MST/014-015)
  ['Mullion',14,['MU - 1','MU - 2','MU - 3','MU - 4','MU - 5','MU - 6','MU - 7','MU - 8',"DOOR'S MU & MU - 1","DOOR'S MU & MU - 2"]],['Mullion',15,["DOOR'S MU - 1","DOOR'S MU - 2","DOOR'S MU - 3"]],
  // PG 16: Power Column (MST/016)
  ['Power column',16,['PC - 1','PC - 2','PC - 3','PC - 4','PC - 5','PC - 6','PC - 7','PC - 8','PC - 9']],
  // PG 17: Square Post (MST/017)
  ['Square post',17,['SP - 1','SP - 2','SP - 3','SP - 4']],
  // PG 18: Sliding Door Panel — Horizontal Section (MST/018)
  ['Sliding door panel',18,['SLIDE DP - 1','SLIDE DP - 2','SLIDE DP - 3','SLIDE DP - 4','SLIDE DP - 5']],
  // PG 19: Sliding Door Frame — Horizontal Section (MST/019)
  ['Sliding door frame',19,['SLIDE DF - 1','SLIDE DF - 2','SLIDE DF - 3','SLIDE DF - 4','SLIDE DF - 5']],
  // PG 20-21: Sliding Door Panel — Vertical Section (MST/020-021)
  ['Sliding door panel',20,['SDP-V A1','SDP-V A2','SDP-V A3','SDP-V B1','SDP-V B2','SDP-V B3','SDP-V C1','SDP-V C2']],['Sliding door panel',21,['SDP-V C3','SDP-V D1','SDP-V D2']],
  // PG 22: Floor Rail Sliding Door — Horizontal Section (MST/022)
  ['Floor rail sliding door',22,['FRSLD - 1','FRSLD - 2','FRSLD - 3','FRSLD - 4','FRSLD - 5']],
  // PG 23: Floor Rail Sliding Door Panel — Vertical Section (MST/023)
  ['Floor rail sliding panel',23,['FRSDP-V A1','FRSDP-V A2','FRSDP-V A3','FRSDP-V A4','FRSDP-V A5']]
];
const products = groups.flatMap(([category,page,codes]) => codes.map(code => ({code,category,page,image:`assets/pages/drawing-${String(page).padStart(2,'0')}.png`})));
// 為每個產品計算在圖紙頁面上的網格位置 (0~1 比例)
products.forEach(p => {
  const pageProducts = products.filter(x => x.page === p.page);
  const idx = pageProducts.findIndex(x => x.code === p.code);
  const total = pageProducts.length;
  const cols = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / cols);
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const margin = 0.025;
  const cellW = (1 - margin * (cols + 1)) / cols;
  const cellH = (1 - margin * (rows + 1)) / rows;
  p.pos = { x: margin + col * (cellW + margin), y: margin + row * (cellH + margin), w: cellW, h: cellH };
});
// --- Profile Template data ---
const profileGroups = [
  // PG 1: Glass Frame (MST/001/F)
  ['Glass frame',1,['T-5001','T-5002','T-5003','T-5003M','T-5004','T-5004C','T-5004M','T-5004P','T-5005','T-5006','T-5052','T-5053','T-5053M','T-5055P','T-8004','T-8004A','T-8005','T-8011','T-8014L','T-8016']],
  // PG 2: Glass Frame (MST/002/E)
  ['Glass frame',2,['T-8867','T-8867L','T-xxxx','T-8020','T-8027','T-8027C','T-8900','T-8900A','T-8877','T-8875','T-8857','T-8859','T-8907','T-8919','50MM FLATBAR','25MM FLATBAR']],
  // PG 3: Sliding / Track (MST/003/C)
  ['Sliding track',3,['T-3008','T-5008','T-5012','T-5027','T-5027?','T-8027A','T-3004A']],
  // PG 4: Door Panel (MST/004/G)
  ['Door panel',4,['T-3002','T-3003','T-3004M','T-3005','T-8319','T-8320','T-8320C','T-8419','T-8419C','T-8426','T-8427','T-8428','T-8519','T-8526','T-8526A','T-8915','T-8917','T-8918']]
];
const profileProducts = profileGroups.flatMap(([category,page,codes]) => codes.map(code => ({code,category,page,image:`assets/profile-pages/profile-${page}.png`})));
profileProducts.forEach(p => {
  const pageItems = profileProducts.filter(x => x.page === p.page);
  const idx = pageItems.findIndex(x => x.code === p.code);
  const total = pageItems.length;
  const cols = 5;
  const rows = Math.ceil(total / cols);
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const margin = 0.025;
  const cellW = (1 - margin * (cols + 1)) / cols;
  const cellH = (1 - margin * (rows + 1)) / rows;
  p.pos = { x: margin + col * (cellW + margin), y: margin + row * (cellH + margin), w: cellW, h: cellH };
});
const profileCategories = [...new Set(profileProducts.map(x => x.category))];
const categories = [...new Set(products.map(x => x.category))];
const $ = id => document.getElementById(id);
const state = {query:'',category:'',a1:null,a2:null,inventoryA1:'',inventoryA2:'',pairs:_lsRead('t1-product-pairs'),projects:_lsRead('t1-projects')};
function _lsRead(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}}
function save(){localStorage.setItem('t1-product-pairs',JSON.stringify(state.pairs));localStorage.setItem('t1-projects',JSON.stringify(state.projects));const _fs=(window.T1||{}).firestore;if(_fs&&_fs.ready){_fs.savePairs(state.pairs);_fs.saveProjects(state.projects)}}
function esc(s){return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function id(){return crypto.randomUUID()}
function inventoryOptions(){return (window.inventoryDescriptions||[]).map(d=>`<option value="${esc(d)}"></option>`).join('')}
function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200)}

function renderFilters(){ $('filters').innerHTML=categories.map(x=>`<button class="filter ${state.category===x?'active':''}" data-cat="${esc(x)}">${esc(x)}</button>`).join('');document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{state.category=state.category===b.dataset.cat?'':b.dataset.cat;renderFilters();renderResults()}) }
function renderResults(){const q=state.query.toLowerCase().replace(/\s/g,'');let shown=[];if(q||state.category){shown=products.filter(p=>(!state.category||p.category===state.category)&&(`${p.code}${p.category}`.toLowerCase().replace(/\s/g,'').includes(q)))};$('resultCount').textContent=`${shown.length} results`;$('empty').hidden=shown.length>0;$('empty').textContent=(!q&&!state.category)?'輸入檢索關鍵字或點選分類標籤以顯示內容':'No matching drawings.';$('results').innerHTML=shown.map((p,n)=>`<article class="card"><img src="${p.image}" alt="${esc(p.code)}" data-view="${products.indexOf(p)}" loading="${n>8?'lazy':'eager'}"><div class="card-body"><div class="code">${esc(p.code)}</div><div class="meta">${esc(p.category)}</div><div class="actions"><button data-assign="a1" data-product="${products.indexOf(p)}">A1</button><button data-assign="a2" data-product="${products.indexOf(p)}">A2</button><button data-mix-add="${products.indexOf(p)}">Mix</button></div></div></article>`).join('');document.querySelectorAll('[data-view]').forEach(x=>x.onclick=()=>openViewer(products[x.dataset.view]));document.querySelectorAll('[data-assign]').forEach(x=>x.onclick=()=>{state[x.dataset.assign]=products[x.dataset.product];renderSlots();document.querySelectorAll('.tab-bar .tab').forEach(t=>t.classList.remove('active'));const pairTab=document.querySelector('.tab-bar .tab[data-tab="pair"]');if(pairTab){pairTab.classList.add('active');document.querySelectorAll('.tab-panel').forEach(p=>{p.style.display=p.dataset.tab==='pair'?'block':'none';if(p.dataset.tab==='pair')p.classList.add('active');else p.classList.remove('active')})}toast(`Set as ${x.dataset.assign.toUpperCase()}`)})}

// --- Profile Template state and functions ---
const profileState = {query:'',category:''};
function renderProfileFilters(){ $('profileFilters').innerHTML=profileCategories.map(x=>`<button class="filter ${profileState.category===x?'active':''}" data-pcat="${esc(x)}">${esc(x)}</button>`).join('');document.querySelectorAll('[data-pcat]').forEach(b=>b.onclick=()=>{profileState.category=profileState.category===b.dataset.pcat?'':b.dataset.pcat;renderProfileFilters();renderProfileResults()}) }
function renderProfileResults(){const q=profileState.query.toLowerCase().replace(/\s/g,'');let shown=[];if(q||profileState.category){shown=profileProducts.filter(p=>(!profileState.category||p.category===profileState.category)&&(`${p.code}${p.category}`.toLowerCase().replace(/\s/g,'').includes(q)))};$('profileResultCount').textContent=`${shown.length} results`;$('profileEmpty').hidden=shown.length>0;$('profileEmpty').textContent=(!q&&!profileState.category)?'輸入檢索關鍵字或點選分類標籤以顯示內容':'No matching profiles.';$('profileResults').innerHTML=shown.map((p,n)=>`<article class="card"><img src="${p.image}" alt="${esc(p.code)}" data-profile-view="${profileProducts.indexOf(p)}" loading="${n>8?'lazy':'eager'}"><div class="card-body"><div class="code">${esc(p.code)}</div><div class="meta">${esc(p.category)}</div><div class="actions"><button data-mix-add-profile="${profileProducts.indexOf(p)}">Mix</button></div></div></article>`).join('');document.querySelectorAll('[data-profile-view]').forEach(x=>x.onclick=()=>openViewer(profileProducts[x.dataset.profileView]))}

// === Mail Request — per-project email composition + send (new feature) ===
function buildMailContent(p){
  const lines = [];
  lines.push('=== CLIENT INFO ===');
  lines.push('Project: ' + (p.name || ''));
  lines.push('Sales: ' + (p.sales || '-'));
  lines.push('Delivery Mode: ' + (p.priority || '-'));
  if (p.deadline) lines.push('Deadline: ' + p.deadline);
  lines.push('Address: ' + (p.address || '-'));
  lines.push('Tenderer: ' + (p.tenderer || '-'));
  lines.push('Attn: ' + (p.attn || '-'));
  lines.push('Tel: ' + (p.tel || '-'));
  lines.push('Email: ' + (p.email || '-'));
  lines.push('Mobile: ' + (p.mobile || '-'));
  lines.push('Fax: ' + (p.fax || '-'));
  if (p.briefing) {
    if (p.briefing.general) lines.push('Briefing General: ' + p.briefing.general);
    if (p.briefing.layout) lines.push('Briefing Layout: ' + p.briefing.layout);
  }
  if (p.zipMeta) {
    lines.push('');
    lines.push('=== ZIP FILE ===');
    lines.push('File: ' + (p.zipMeta.name || '') + ' (' + ((p.zipMeta.size || 0) / 1024).toFixed(1) + ' KB)' + (p.zipMeta.downloadUrl ? ' [Uploaded]' : ''));
  }
  ['PARTITION', 'DOOR', 'OPERABLE_WALL'].forEach(function(type) {
    const items = (p.items || []).filter(i => i.type === type);
    if (!items.length) return;
    lines.push('');
    lines.push('=== ' + type + ' (' + items.length + ') ===');
    items.forEach(function(item, idx) {
      const extra = item.extra || {};
      const detail = Object.keys(extra).filter(k => extra[k]).map(k => k + ': ' + extra[k]).join(' | ');
      const label = (item.pair && item.pair.name) ? item.pair.name : '';
      lines.push((idx + 1) + '. ' + label + (detail ? ' — ' + detail : ''));
    });
  });
  if ((p.workLogs || []).length) {
    lines.push('');
    lines.push('=== WORK LOG ===');
    (p.workLogs || []).forEach(function(l) {
      lines.push('[' + (l.status || 'submited') + '] ' + (l.summary || '') + ' (' + (l.createdAt || '').slice(0, 10) + ')');
    });
  }
  return lines.join('\n');
}
// Send Mail Request — recipients (TO+CC, comma separated) each receive the composed email
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-mail-send]');
  if (!btn) return;
  const p = state.projects.find(x => x.id === btn.dataset.mailSend);
  if (!p) return;
  const card = btn.closest('[data-mail-request]');
  if (!card) return;
  const toRaw = card.querySelector('[data-mail-to]').value;
  const ccRaw = card.querySelector('[data-mail-cc]').value;
  const subject = card.querySelector('[data-mail-subject]').value.trim();
  const content = card.querySelector('[data-mail-content]').value;
  const recipients = (toRaw + ',' + ccRaw).split(',').map(s => s.trim()).filter(Boolean);
  if (!recipients.length) { toast('請輸入 TO 或 CC 收件人'); return; }
  if (!subject) { toast('請輸入 Subject'); return; }
  const es = (window.T1 || {}).emailService;
  const et = (window.T1 || {}).emailTemplate;
  if (!es || !es.sendEmail) { toast('Email 服務未就緒'); return; }
  const html = et && et.buildMailRequestHtml ? et.buildMailRequestHtml(content) : '<pre>' + esc(content) + '</pre>';
  btn.disabled = true; btn.textContent = 'Sending…';
  Promise.all(recipients.map(function(to) {
    return es.sendEmail({ to: to, subject: subject, html: html }).then(function(ok) { return ok; });
  })).then(function(results) {
    btn.disabled = false; btn.textContent = 'Send Email';
    const okCount = results.filter(Boolean).length;
    toast(okCount === recipients.length ? 'Email 已寄出 (' + okCount + '/' + recipients.length + ')' : '部分寄送失敗 (' + okCount + '/' + recipients.length + ')');
  });
});


var mixState = _lsRead('t1-mixmatch');
var mixNotes = (function(){ try { return JSON.parse(localStorage.getItem('t1-mixmatch-notes') || '{}'); } catch(e) { return {}; } })();
var selectedMix = null;
function saveMix(){ localStorage.setItem('t1-mixmatch', JSON.stringify(mixState)); }
function saveMixNotes(){
  localStorage.setItem('t1-mixmatch-notes', JSON.stringify(mixNotes));
  const _fs = (window.T1 || {}).firestore;
  if (_fs && _fs.ready && _fs.saveMixNotes) _fs.saveMixNotes(mixNotes); // 雲端備份
}
function renderMixMatch(){
  const grid = document.getElementById('mixMatchGrid');
  if (!grid) return;
  let html = '';
  for (let i = 0; i < 6; i++) {
    const it = mixState[i];
    const n = (it && mixNotes[it.code]) || {};
    const box = it
      ? `<div class="mix-box filled${selectedMix === i ? ' selected' : ''}" data-mix-view="${i}"><img src="${esc(it.image)}" alt="${esc(it.code)}"><span class="mix-code">${esc(it.code)}</span><button type="button" class="mix-remove" data-mix-remove="${i}" title="移除">✕</button></div>`
      : `<div class="mix-box empty"><span class="mix-empty-label">+</span></div>`;
    html += `<div class="mix-card">${box}<div class="mix-notes"><input class="mix-note" data-mix-note="${i}" data-mix-note-idx="0" placeholder="name 1" value="${esc(n.r1 || '')}" ${it ? '' : 'disabled'}><input class="mix-note" data-mix-note="${i}" data-mix-note-idx="1" placeholder="name 2" value="${esc(n.r2 || '')}" ${it ? '' : 'disabled'}><input class="mix-note" data-mix-note="${i}" data-mix-note-idx="2" placeholder="name 3" value="${esc(n.r3 || '')}" ${it ? '' : 'disabled'}><button type="button" class="mix-save-btn" data-mix-save="${i}" ${it ? '' : 'disabled'}>Save Profile</button></div></div>`;
  }
  grid.innerHTML = html;
}
function addToMixMatch(item){
  while (mixState.length < 6) mixState.push(null); // 確保有 6 個位置
  const idx = mixState.findIndex(x => !x);
  if (idx === -1) { toast('Mix & Match 已滿，請先移除項目'); return false; }
  mixState[idx] = { code: item.code, category: item.category, image: item.image, page: item.page, pos: item.pos };
  saveMix();
  renderMixMatch();
  return true;
}
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-mix-add]');
  const btnP = e.target.closest('[data-mix-add-profile]');
  if (!btn && !btnP) return;
  e.preventDefault();
  const item = btn ? products[+btn.dataset.mixAdd] : profileProducts[+btnP.dataset.mixAddProfile];
  if (!item) return;
  const targetBox = document.querySelector('#mixMatchGrid .mix-box.empty');
  if (!targetBox) { toast('Mix & Match 已滿，請先移除項目'); return; }
  // 自動切換到側邊 Mix & Match 分頁（panel 顯示後，飛行動畫目標位置才正確）
  const mmTab = document.querySelector('.tab-bar .tab[data-tab="mixmatch"]');
  if (mmTab && !mmTab.classList.contains('active')) mmTab.click();
  // 飛行動畫：從 Mix 按鈕飛向目標方框
  const src = btn || btnP;
  const sr = src.getBoundingClientRect();
  const tr = targetBox.getBoundingClientRect();
  const fly = document.createElement('img');
  fly.src = item.image;
  fly.alt = item.code;
  fly.className = 'mix-fly';
  fly.style.left = (sr.left + sr.width / 2 - 20) + 'px';
  fly.style.top = (sr.top + sr.height / 2 - 20) + 'px';
  document.body.appendChild(fly);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      fly.style.transform = 'translate(' + (tr.left + tr.width / 2 - (sr.left + sr.width / 2)) + 'px,' + (tr.top + tr.height / 2 - (sr.top + sr.height / 2)) + 'px) scale(0.25)';
      fly.style.opacity = '0.35';
    });
  });
  setTimeout(function() { fly.remove(); addToMixMatch(item); }, 520);
});
document.addEventListener('click', e => {
  const del = e.target.closest('[data-mix-remove]');
  if (!del) return;
  mixState[+del.dataset.mixRemove] = null;
  if (selectedMix === +del.dataset.mixRemove) selectedMix = null;
  saveMix();
  renderMixMatch();
  toast('已從 Mix & Match 移除');
});
// 點選方框 → 放大檢視（同 Profile 檢視）+ 載入該 item 的專屬備註
document.addEventListener('click', e => {
  const box = e.target.closest('[data-mix-view]');
  if (!box || e.target.closest('.mix-remove')) return;
  const item = mixState[+box.dataset.mixView];
  if (!item) return;
  openViewer(item);
  selectedMix = +box.dataset.mixView;
  renderMixMatch();
});
// Save Profile — 儲存該方框 item 的備註（移除方框後備註仍保留、再加入自動帶回）
document.addEventListener('click', e => {
  const saveBtn = e.target.closest('[data-mix-save]');
  if (!saveBtn) return;
  const i = +saveBtn.dataset.mixSave;
  const item = mixState[i];
  if (!item) { toast('該方框無項目'); return; }
  const card = saveBtn.closest('.mix-card');
  const inputs = card ? card.querySelectorAll('.mix-note') : [];
  mixNotes[item.code] = {
    r1: inputs[0] ? inputs[0].value : '',
    r2: inputs[1] ? inputs[1].value : '',
    r3: inputs[2] ? inputs[2].value : ''
  };
  saveMixNotes();
  toast('Profile 備註已儲存');
});
function slotHtml(slot){const p=state[slot];if(!p)return `<div class="slot-label">ITEM ${slot.toUpperCase()}</div>Select from left panel and set to ${slot.toUpperCase()}`;return `<div class="slot-label">ITEM ${slot.toUpperCase()}</div><img src="${p.image}" alt="" data-slot-view="${slot}"><strong>${esc(p.code)}</strong><br><span class="meta">${esc(p.category)}</span><br><button data-remove="${slot}">DELETE</button>`}
function renderSlots(){['a1','a2'].forEach(slot=>{const el=$(slot==='a1'?'slotA1':'slotA2');el.className=`slot ${state[slot]?'filled':''}`;el.innerHTML=slotHtml(slot)});$('inventoryOptions').innerHTML=inventoryOptions();$('inventoryA1').value=state.inventoryA1;$('inventoryA2').value=state.inventoryA2;$('savePair').disabled=!(state.a1||state.a2);const sel=$('pairProjectSelect');if(sel){$('pairCopyBtn').disabled=!sel.value||!(state.a1||state.a2)}document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state[b.dataset.remove]=null;renderSlots()})}
const viewer={img:null,container:null,scale:1,tx:0,ty:0,iw:0,ih:0,cw:0,ch:0,panning:false,panSX:0,panSY:0,panTX:0,panTY:0,target:null};function viewerUpdate(a){if(!viewer.img)return;viewer.img.style.transition=a?'transform .45s cubic-bezier(.22,.61,.36,1)':'none';viewer.img.style.transform=`translate(${viewer.tx}px,${viewer.ty}px) scale(${viewer.scale})`}function viewerLabel(){const el=$('viewerZoomLevel');if(el)el.textContent=Math.round(viewer.scale*100)+'%'}function viewerShowRefocus(v){const btn=$('viewerRefocus');if(btn)btn.style.display=v?'':'none'}function viewerFit(anim){if(!viewer.iw||!viewer.ih)return;const s=Math.min(viewer.cw/viewer.iw,viewer.ch/viewer.ih);viewer.scale=s;viewer.tx=(viewer.cw-viewer.iw*s)/2;viewer.ty=(viewer.ch-viewer.ih*s)/2;viewer.target=null;viewerShowRefocus(false);viewerUpdate(anim);viewerLabel()}function viewerFocus(p,anim){if(!viewer.iw||!viewer.ih||!p||!p.pos)return;const pos=p.pos;const s=Math.min(viewer.cw*.8/(viewer.iw*pos.w),viewer.ch*.8/(viewer.ih*pos.h));const sc=Math.max(.35,Math.min(8,s));const cx=(pos.x+pos.w/2)*viewer.iw*sc;const cy=(pos.y+pos.h/2)*viewer.ih*sc;viewer.scale=sc;viewer.tx=viewer.cw/2-cx;viewer.ty=viewer.ch/2-cy;viewer.target=p;viewerShowRefocus(true);viewerUpdate(anim);viewerLabel()}function viewerZoomAt(mx,my,delta){const ns=Math.max(.35,Math.min(8,viewer.scale*(1+delta*.15)));viewer.tx=mx-(mx-viewer.tx)*(ns/viewer.scale);viewer.ty=my-(my-viewer.ty)*(ns/viewer.scale);viewer.scale=ns;viewerUpdate(false);viewerLabel()}function viewerSyncSize(){viewer.cw=viewer.container.clientWidth;viewer.ch=viewer.container.clientHeight;if(viewer.img&&viewer.img.complete&&viewer.img.naturalWidth){viewer.iw=viewer.img.naturalWidth;viewer.ih=viewer.img.naturalHeight;viewer.target?viewerFocus(viewer.target,false):viewerFit(false)}}function initViewer(){viewer.img=$('viewerImage');viewer.container=$('viewerContainer');if(!viewer.img||!viewer.container)return;viewer.container.addEventListener('wheel',e=>{e.preventDefault();const r=viewer.container.getBoundingClientRect();viewerZoomAt(e.clientX-r.left,e.clientY-r.top,-Math.sign(e.deltaY))},{passive:false});viewer.container.addEventListener('mousedown',e=>{if(e.button!==0)return;viewer.panning=true;viewer.panSX=e.clientX;viewer.panSY=e.clientY;viewer.panTX=viewer.tx;viewer.panTY=viewer.ty;viewer.container.classList.add('grabbing')});window.addEventListener('mousemove',e=>{if(!viewer.panning)return;viewer.tx=viewer.panTX+(e.clientX-viewer.panSX);viewer.ty=viewer.panTY+(e.clientY-viewer.panSY);viewerUpdate(false)});window.addEventListener('mouseup',()=>{viewer.panning=false;viewer.container.classList.remove('grabbing')});viewer.container.addEventListener('dblclick',()=>{viewer.target?viewerFocus(viewer.target,true):viewerFit(true)});new ResizeObserver(()=>viewerSyncSize()).observe(viewer.container);$('viewerToolbar').addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;const id=btn.id;if(id==='viewerZoomIn'){const cx=viewer.cw/2,cy=viewer.ch/2;viewerZoomAt(cx,cy,1)}else if(id==='viewerZoomOut'){const cx=viewer.cw/2,cy=viewer.ch/2;viewerZoomAt(cx,cy,-1)}else if(id==='viewerReset'){viewerFit(true)}else if(id==='viewerRefocus'){if(viewer.target)viewerFocus(viewer.target,true)}else if(id==='viewerSavePos'){viewerSavePos()}else if(id==='closeViewer'){$('viewer').close()}});$('viewer').addEventListener('close',()=>{viewer.target=null;viewerShowRefocus(false)})}
function viewerSavePos(){if(!viewer.target){toast('請先點選一個產品聚焦');return}const key='t1-viewer-positions';const all=JSON.parse(localStorage.getItem(key)||'{}');all[viewer.target.code]={scale:viewer.scale,tx:viewer.tx,ty:viewer.ty};localStorage.setItem(key,JSON.stringify(all));const _fs=(window.T1||{}).firestore;if(_fs&&_fs.ready&&_fs.saveViewerPos)_fs.saveViewerPos(all);toast(`已儲存 ${viewer.target.code} 的檢視位置`)}
function openViewer(p){$('viewerTitle').textContent=`${p.code} · ${p.category}`;$('viewerInfo').textContent=`第 ${p.page} 頁 · ${p.category}｜滾輪縮放｜拖曳平移｜📌 可儲存自訂位置`;viewer.target=p;viewerShowRefocus(true);viewer.img.onload=null;viewer.img.onerror=null;const img=new Image();img.onload=()=>{viewer.iw=img.naturalWidth;viewer.ih=img.naturalHeight;viewer.cw=viewer.container.clientWidth;viewer.ch=viewer.container.clientHeight;const s=Math.min(viewer.cw/viewer.iw,viewer.ch/viewer.ih);viewer.scale=s;viewer.tx=(viewer.cw-viewer.iw*s)/2;viewer.ty=(viewer.ch-viewer.ih*s)/2;viewerLabel();viewerUpdate(false);viewer.img.src=img.src;const saved=JSON.parse(localStorage.getItem('t1-viewer-positions')||'{}')[p.code];if(saved){requestAnimationFrame(()=>{viewer.scale=saved.scale;viewer.tx=saved.tx;viewer.ty=saved.ty;viewerLabel();viewerUpdate(true)})}else{requestAnimationFrame(()=>requestAnimationFrame(()=>viewerFocus(p,true)))}};img.onerror=()=>{viewer.target=null;viewerShowRefocus(false);toast('無法載入圖面')};img.src=p.image;$('viewer').showModal()}

function descriptionLine(pair){let html='';if(pair.a1)html+=`A1 · <span class="item-view-link" data-item-view>${esc(pair.a1.code)}</span>${pair.inventoryA1?` (${esc(pair.inventoryA1)})`:''}`;if(pair.a2){if(html)html+='<br>';html+=`A2 · <span class="item-view-link" data-item-view>${esc(pair.a2.code)}</span>${pair.inventoryA2?` (${esc(pair.inventoryA2)})`:''}`}if(pair.qtn)html+=`<br>QTN · ${esc(pair.qtn)}`;if(pair.boq)html+=`<br>BOQ · ${esc(pair.boq)}`;return html||'未指定產品'}
function projectOptions(){return `<option value="">選擇 Project</option>${state.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}`}
function renderPairs(){const pageSize=10;let page=renderPairs._page||1;const sorted=[...state.pairs].sort((a,b)=>{const da=a.createdAt||'',db=b.createdAt||'';return da<db?1:da>db?-1:0});const total=state.pairs.length,totalPages=Math.max(1,Math.ceil(total/pageSize));if(page>totalPages)page=totalPages;renderPairs._page=page;const start=(page-1)*pageSize,end=Math.min(start+pageSize,total),pageItems=sorted.slice(start,end);$('savedCount').textContent=total?`${total} pairs`:'';$('savedPairs').innerHTML=total?pageItems.map(pair=>`<div class="saved-item"><div class="saved-title" contenteditable data-pair-name="${pair.id}">${esc(pair.name)}</div><div class="saved-desc">${descriptionLine(pair)}</div><div class="saved-options"><button data-pair-view="a1" data-pair="${pair.id}">ZOOM IN A1</button><button data-pair-view="a2" data-pair="${pair.id}">ZOOM IN A2</button><button data-pair-delete="${pair.id}">DELETE SAVED</button></div><div class="copy-row"><select data-project-for="${pair.id}">${projectOptions()}</select><button data-copy="${pair.id}">COPY TO PROJECT</button></div></div>`).join(''):'<div class="saved-empty">尚未儲存配對。</div>';const pg=$('savedPagination');if(total<=pageSize){pg.innerHTML='';return}let btns='';for(let i=1;i<=totalPages;i++){btns+=`<button class="pg-btn ${i===page?'pg-active':''}" data-page="${i}">${i}</button>`}pg.innerHTML=btns;pg.querySelectorAll('.pg-btn').forEach(b=>b.addEventListener('click',()=>{renderPairs._page=parseInt(b.dataset.page);renderPairs()}))}

function projectInputs(p){return `<form class="project-form project-edit" data-project-edit="${p.id}"><label>Project<input name="name" required value="${esc(p.name)}"></label><label>Sales<input name="sales" list="salesList" autocomplete="off" value="${esc(p.sales||'')}" placeholder="選擇或輸入 Sales"></label><datalist id="salesList"><option value="Glen Tew"><option value="Gerry Lee"><option value="Eugene Ng"><option value="Jim Lim"><option value="Kelvin Tjia"><option value="Benjamin Seng"><option value="Lim Zhi Kang Louis"><option value="Bella"><option value="Jensen"><option value="Rayven Leong"><option value="Zac Lee"><option value="Naomi"></datalist><label>Delivery mode<select name="priority" data-priority-select><option value="">選擇等級</option><option value="REGULAR" ${p.priority==='REGULAR'?'selected':''}>REGULAR</option><option value="URGENT" ${p.priority==='URGENT'?'selected':''}>URGENT</option><option value="CERTAIN DEADLINE" ${p.priority==='CERTAIN DEADLINE'?'selected':''}>CERTAIN DEADLINE</option></select></label><label class="deadline-label" style="${p.priority==='CERTAIN DEADLINE'?'':'display:none'}">Deadline<input name="deadline" type="date" value="${esc(p.deadline||'')}" data-deadline-input></label><label>Address<input name="address" value="${esc(p.address)}"></label><label>Tenderer 1<input name="tenderer" value="${esc(p.tenderer)}"></label><label>Attn<input name="attn" value="${esc(p.attn)}"></label><label>Tel<input name="tel" value="${esc(p.tel)}"></label><label>Email<input name="email" type="email" value="${esc(p.email)}"></label><label>Mobile<input name="mobile" value="${esc(p.mobile)}"></label><label>Fax<input name="fax" value="${esc(p.fax)}"></label><label class="zip-upload-label"><span>📦 Upload Zip file</span><input name="zipFile" type="file" accept=".zip" data-zip-upload hidden><span class="zip-choose-btn">Choose Zip file</span><small class="zip-file-status" data-zip-status>${p.zipMeta?`目前檔案: ${esc(p.zipMeta.name)} (${(p.zipMeta.size/1024).toFixed(1)} KB)${p.zipMeta.downloadUrl?' ✓ 已上傳':''}`:'No file selected yet'}</small>${p.zipMeta&&p.zipMeta.storagePath?`<button type="button" class="zip-download-btn" data-zip-download="${p.id}">⬇ Download file</button>`:''}</label><div class="briefing-block"><div class="briefing-title">Project Briefing</div><div class="briefing-hint">*Please sorted out your files into folders, and pinpoint the main target content to save time for evaluating and analyzing data</div><label class="briefing-field">General briefing<textarea name="briefingGeneral" rows="4" placeholder="輸入 General briefing...">${esc((p.briefing&&p.briefing.general)||'')}</textarea></label><label class="briefing-field">Layout &amp; file highlight<textarea name="briefingLayout" rows="4" placeholder="輸入 Layout &amp; file highlight...">${esc((p.briefing&&p.briefing.layout)||'')}</textarea></label></div><button class="primary" type="submit">儲存修改</button></form>`}
const extraFields={PARTITION:[['legend','LEGEND'],['finishes','FRAME FINISHES'],['height','HEIGHT'],['verticalSection','VERTICAL SECTION'],['horizontalSection','HORIZONTAL SECTION'],['transom','TRANSOM'],['mullion','MULLION'],['glass1','GLASS 1'],['glass2','GLASS 2'],['squarePost','SQUARE POST'],['powerColumn','POWER COLUMN'],['sizePc','SIZE PC'],['remark','REMARK IF ANY']],DOOR:[['legend','LEGEND'],['finishes','FRAME FINISHES'],['height','HEIGHT'],['noOfLeaf','NO OF LEAF'],['doorFrame','DOOR FRAME'],['doorPanel','DOOR PANEL'],['transom','TRANSOM'],['mullion','MULLION'],['glass1','GLASS 1'],['glass2','GLASS 2'],['hardware','HARDWARE'],['lock','LOCK'],['doorCloser','DOOR CLOSER'],['hwFinishes','HW FINISHES'],['remark','REMARK IF ANY']],OPERABLE_WALL:[['legend','LEGEND (Manual)'],['finishes','FINISHES'],['height','HEIGHT'],['type','TYPE'],['operate','OPERATE'],['country','COUNTRY'],['hwFinishes','HW FINISHES'],['remark','REMARK IF ANY']]};
// Work Log — 6 drop-downs. "-" is hidden from the exported Log Summary.
const WORK_LOG_DROPDOWNS = [
  ['-','A','A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11'],
  ['-','B','B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11'],
  ['-','A&B','A1&B1','A2&B2','A3&B3','A4&B4','A5&B5','A6&B6','A7&B7','A8&B8','A9&B9','A10&B10'],
  ['-','R1','R2','R3','R4','R5','R6','R7','R9','R10','R11'],
  ['-','VO1','VO2','VO3','VO4','VO5','VO6','VO7','VO8','VO9','VO10','VO11'],
  ['-','R1','R2','R3','R4','R5','R6','R7','R9','R10','R11']
];
function worklogFormHtml(p){
  const wl = p.workLog || {};
  const fields = WORK_LOG_DROPDOWNS.map((opts,i)=>{
    const name = 'wl'+(i+1);
    const options = opts.map(o=>`<option value="${esc(o)}" ${(wl[name]||'-')===o?'selected':''}>${esc(o)}</option>`).join('');
    return `<label class="worklog-field">Work Log ${i+1}<select name="${name}">${options}</select></label>`;
  }).join('');
  const logs = (Array.isArray(p.workLogs)?p.workLogs:[]).map(log=>{
    const st = log.status || 'submited';
    const bg = st==='confirmed' ? 'background:#F0FF45' : (st==='Considering' ? 'background:#406B28;color:#fff' : '');
    return `<div class="worklog-item" style="${bg}"><span class="worklog-item-summary">${esc(log.summary||log.qtnNum||'—')}</span>${log.summary&&log.qtnNum?`<span class="worklog-item-qtn">QTN: ${esc(log.qtnNum)}</span>`:''}<span class="worklog-item-date">${esc((log.createdAt||'').slice(0,10))}</span><select class="worklog-status" data-wlog-status="${log.id}"><option value="submited" ${st==='submited'?'selected':''}>submited</option><option value="Considering" ${st==='Considering'?'selected':''}>Considering</option><option value="confirmed" ${st==='confirmed'?'selected':''}>confirmed</option></select><button type="button" class="worklog-btn" data-wlog-up="${log.id}" title="上移">▲</button><button type="button" class="worklog-btn" data-wlog-down="${log.id}" title="下移">▼</button><button type="button" class="worklog-btn worklog-del" data-wlog-del="${log.id}" title="刪除">✕</button></div>`;
  }).join('');
  return `<div class="p-inner-panel" data-ptab-panel="${p.id}|notes" style="display:none"><form class="worklog-form" data-worklog="${p.id}"><div class="worklog-heading">Work Log <input class="worklog-qtn" name="qtnNum" placeholder="QTN NUM:" /></div><div class="worklog-grid">${fields}</div><button class="primary" type="submit">Submit Work Log</button><div class="worklog-loglist">${logs||'<div class="worklog-empty">尚未生成任何 Log。</div>'}</div></form></div>`;
}
function itemExtraSummary(item){const type=item.type||'',extra=item.extra||{};if(!type)return '<span class="item-type-badge none">尚未設定類別</span>';const badge=type==='OPERABLE_WALL'?'<span class="item-type-badge operable-wall">OW</span>':`<span class="item-type-badge ${type==='PARTITION'?'partition':'door'}">${type}</span>`;return `<span class="item-extra-summary">${badge} ${(extraFields[type]||[]).map(([key,label])=>`<span class="extra-kv"><em>${label}:</em> <strong>${esc(extra[key]||'—')}</strong></span>`).join(' ')}</span>`}
function itemExtraBody(project,item){const type=item.type||'',extra=item.extra||{};const formKey=`${project.id}|${item.id}`;if(type==='OPERABLE_WALL'){const fields=(extraFields.OPERABLE_WALL||[]).map(([key,label])=>`<label><span>${label}</span>${key==='remark'?`<textarea name="${key}">${esc(extra[key])}</textarea>`:`<input name="${key}" value="${esc(extra[key])}">`}</label>`).join('');return `<div class="extra-body"><div class="extra-fields">${fields}</div><button class="primary" type="submit">儲存項目資料</button></div>`}const isPartition=type==='PARTITION';if(!type)return `<div class="extra-body"><div class="type-tabs"><button class="type-tab partition" data-set-type="${formKey}|PARTITION">PARTITION</button><button class="type-tab door" data-set-type="${formKey}|DOOR">DOOR</button></div></div>`;const fields=(extraFields[type]||[]).map(([key,label])=>`<label><span>${label}</span>${key==='remark'?`<textarea name="${key}">${esc(extra[key])}</textarea>`:`<input name="${key}" value="${esc(extra[key])}">`}</label>`).join('');return `<div class="extra-body"><div class="type-tabs"><button class="type-tab partition ${isPartition?'active':''}" data-set-type="${formKey}|PARTITION">PARTITION</button><button class="type-tab door ${!isPartition?'active':''}" data-set-type="${formKey}|DOOR">DOOR</button></div><div class="extra-fields">${fields}</div><button class="primary" type="submit">儲存項目資料</button></div>`}
function matchedItemsTable(project){const items=project.items.filter(i=>!i.type);if(!items.length)return'<div class="project-empty">尚無未分類商品。</div>';return'<div class="item-table-wrap"><table class="item-table"><thead><tr><th>#</th><th>商品名稱</th><th>配對資訊</th><th>分類</th><th></th></tr></thead><tbody>'+items.map((item,i)=>{const pairInfo=descriptionLine(item.pair);return'<tr><td>'+(i+1)+'</td><td>'+esc(item.pair.name)+'</td><td><small>'+pairInfo+'</small></td><td><select class="matched-type-select" data-matched-classify="'+project.id+'|'+item.id+'"><option value="">選擇分類</option><option value="PARTITION">PARTITION</option><option value="DOOR">DOOR</option></select></td><td class="item-actions"><button data-item-delete="'+project.id+'|'+item.id+'" class="project-delete">刪</button></td></tr>';}).join('')+'</tbody></table></div>';}
function itemTable(project,type){const items=project.items.filter(i=>i.type===type);if(!items.length)return'<div class="project-empty">尚無 '+type+' 項目。</div>';const fields=extraFields[type]||[];const thead='<thead><tr><th>#</th>'+fields.map(([,l])=>'<th>'+l+'</th>').join('')+'<th>配對資訊</th><th></th></tr></thead>';const tbody='<tbody>'+items.map((item,i)=>{const CLICKABLE_KEYS=['verticalSection','horizontalSection','doorFrame','doorPanel'];const tds=fields.map(([k])=>{const v=item.extra[k];return'<td>'+(v?CLICKABLE_KEYS.includes(k)?'<span class="item-field-link" data-item-field-view="'+esc(v)+'">'+esc(v)+'</span>':esc(v):'—')+'</td>'}).join('');const pairInfo=descriptionLine(item.pair);const actions='<button data-up="'+project.id+'|'+item.id+'"'+(i===0?' disabled':'')+'>▲</button><button data-down="'+project.id+'|'+item.id+'"'+(i===items.length-1?' disabled':'')+'>▼</button><button data-item-delete="'+project.id+'|'+item.id+'" class="project-delete">刪</button><button data-item-edit="'+project.id+'|'+item.id+'" class="item-edit-btn">'+(item.extra&&Object.keys(item.extra).length?'編輯':'設定')+'</button>';return'<tr><td>'+(i+1)+'</td>'+tds+'<td>'+esc(item.pair.name)+'<br><small>'+pairInfo+'</small></td><td class="item-actions">'+actions+'</td></tr>'}).join('')+'</tbody>';const forms=items.map(item=>'<div class="item-extra-display" data-item-summary="'+project.id+'|'+item.id+'" style="display:none">'+itemExtraSummary(item)+'</div><form class="project-extra" data-item-extra-key="'+project.id+'|'+item.id+'" style="display:none">'+itemExtraBody(project,item)+'</form>').join('');return'<div class="item-table-wrap"><table class="item-table">'+thead+tbody+'</table></div>'+forms}
function renderProjects(){state.projects.forEach(p=>{p.items=Array.isArray(p.items)?p.items:[];if(!Array.isArray(p.workLogs))p.workLogs=[];if(p.workLogSummary){if(!p.workLogs.length)p.workLogs=[{id:id(),summary:p.workLogSummary,status:'submited',createdAt:new Date().toISOString()}];delete p.workLogSummary}});$('projectCount')&&($('projectCount').textContent=state.projects.length?`(${state.projects.length})`:'');const openIds=new Set();document.querySelectorAll('.project-card[open]').forEach(el=>{const pid=el.dataset.projectCard;if(pid)openIds.add(pid)});$('projectList').innerHTML=state.projects.length?state.projects.map(p=>`<details class="project-card" ${openIds.has(p.id)?'open':''} data-project-card="${p.id}"><summary${p.priority==='URGENT'&&p.status!=='Completed'?' style="background:#b2fc58;color:#000"':''}><span>${esc(p.name)}<span class="pc-count">${p.items.length} 項配對</span></span><span class="pc-qs"><select class="assign-qs-select" data-assign-qs="${p.id}"><option value="">QS</option><option value="Ben" ${p.assignedQs==='Ben'?'selected':''}>Ben</option><option value="Mary" ${p.assignedQs==='Mary'?'selected':''}>Mary</option><option value="Bella" ${p.assignedQs==='Bella'?'selected':''}>Bella</option><option value="Shih Min" ${p.assignedQs==='Shih Min'?'selected':''}>Shih Min</option></select><select class="assign-status-select" data-assign-status="${p.id}"><option value="">Status</option><option value="Pending info" ${p.status==='Pending info'?'selected':''}>Pending info</option><option value="Pending supplier quote" ${p.status==='Pending supplier quote'?'selected':''}>Pending supplier quote</option><option value="On the queue" ${p.status==='On the queue'?'selected':''}>On the queue</option><option value="Processing" ${p.status==='Processing'?'selected':''}>Processing</option><option value="Double check" ${p.status==='Double check'?'selected':''}>Double check</option><option value="Completed" ${p.status==='Completed'?'selected':''}>Completed</option><option value="On hold" ${p.status==='On hold'?'selected':''}>On hold</option></select>${(Array.isArray(p.workLogs)?p.workLogs:[]).filter(l=>l.status==='confirmed').map(l=>`<span class="pc-log" title="Log Summary">${esc(l.summary)}</span>`).join('')}</span></summary><div class="project-detail">${p.zipMeta&&p.zipMeta.storagePath?`<div class="zip-bar"><span>📦 ${esc(p.zipMeta.name)} (${(p.zipMeta.size/1024).toFixed(1)} KB)${p.zipMeta.downloadUrl?' ✓ 已上傳':''}</span><button type="button" class="zip-download-btn" data-zip-download="${p.id}">⬇ Download file</button></div>`:''}
<div class="p-inner-tabs"><button class="p-inner-tab active" data-ptab="${p.id}" data-ptab-panel="info">Client info:<em></em></button><button class="p-inner-tab" data-ptab="${p.id}" data-ptab-panel="matched">Matched Items<em></em></button><button class="p-inner-tab" data-ptab="${p.id}" data-ptab-panel="partition">PARTITION<em></em></button><button class="p-inner-tab" data-ptab="${p.id}" data-ptab-panel="door">DOOR<em></em></button><button class="p-inner-tab" data-ptab="${p.id}" data-ptab-panel="ow">OW<em></em></button><button class="p-inner-tab" data-ptab="${p.id}" data-ptab-panel="notes">Work Log</button><button class="p-inner-tab" data-ptab="${p.id}" data-ptab-panel="mail">Mail Request</button></div>
<div class="p-inner-panel" data-ptab-panel="${p.id}|info">
${projectInputs(p)}<div class="project-info"><div>Sales: ${esc(p.sales||'-')}</div><div>等級: ${esc(p.priority||'-')}</div>${p.deadline?`<div>Deadline: ${esc(p.deadline)}</div>`:''}<div>QS: ${esc(p.assignedQs||'-')}</div><div>Status: ${esc(p.status||'-')}</div><div>Address: ${esc(p.address||'-')}</div><div>Tenderer: ${esc(p.tenderer||'-')}</div><div>Attn: ${esc(p.attn||'-')}</div><div>Tel: ${esc(p.tel||'-')}</div><div>Email: ${esc(p.email||'-')}</div><div>Mobile: ${esc(p.mobile||'-')}</div><div>Fax: ${esc(p.fax||'-')}</div></div></div>
<div class="p-inner-panel" data-ptab-panel="${p.id}|matched" style="display:none">${matchedItemsTable(p)}</div>
<div class="p-inner-panel" data-ptab-panel="${p.id}|partition" style="display:none">
<div class="item-scan-row"><button class="item-scan-btn" data-scan-items="${p.id}" type="button">📄 掃描 Excel</button><small class="item-scan-hint">從 Glazing System 匯入 PARTITION 項目</small></div>
${itemTable(p,'PARTITION')}</div>
<div class="p-inner-panel" data-ptab-panel="${p.id}|door" style="display:none">
<div class="item-scan-row"><button class="item-scan-btn" data-scan-items="${p.id}" type="button">📄 掃描 Excel</button><small class="item-scan-hint">從 Glazing System 匯入 DOOR 項目</small></div>
${itemTable(p,'DOOR')}</div>
<div class="p-inner-panel" data-ptab-panel="${p.id}|ow" style="display:none">
<div class="item-scan-row"><button class="item-scan-btn" data-scan-items="${p.id}" type="button">📄 掃描 Excel</button><small class="item-scan-hint">從 Excel 匯入 OPERABLE WALL 項目</small></div>
${itemTable(p,'OPERABLE_WALL')}</div>
<div class="p-inner-panel" data-ptab-panel="${p.id}|notes" style="display:none">${worklogFormHtml(p)}</div>
<div class="p-inner-panel" data-ptab-panel="${p.id}|mail" style="display:none"><div class="mail-request-form" data-mail-request="${p.id}"><div class="mail-field"><label>TO:</label><input data-mail-to placeholder="name@example.com, name2@example.com"><small>使用逗號分隔多個收件人</small></div><div class="mail-field"><label>CC:</label><input data-mail-cc placeholder="cc@example.com"></div><div class="mail-field"><label>Subject:</label><input data-mail-subject placeholder="Email Subject"></div><div class="mail-field"><label>Content:</label><textarea data-mail-content rows="12">${esc(buildMailContent(p))}</textarea></div><button type="button" class="primary mail-send-btn" data-mail-send="${p.id}">Send Email</button></div></div>
<button class="project-delete" data-project-delete="${p.id}">刪除 Project</button></div></details>`).join(''):'<div class="project-empty">尚未儲存 Project。</div>';document.querySelectorAll('[data-project-edit]').forEach(form=>form.onsubmit=async e=>{e.preventDefault();const p=state.projects.find(x=>x.id===form.dataset.projectEdit),f=new FormData(form);['name','sales','priority','deadline','address','tenderer','attn','tel','email','mobile','fax'].forEach(k=>{p[k]=f.get(k);if(k==='deadline'&&p[k])p[k]=p[k]+' EOD'});p.briefing={general:f.get('briefingGeneral')||'',layout:f.get('briefingLayout')||''};const zipInput=form.querySelector('[data-zip-upload]');const zipFile=zipInput&&zipInput.files[0];const _st=(window.T1||{}).storage;let zipUpdating=false;if(zipFile){const submitBtn=form.querySelector('button[type="submit"]');if(_st&&_st.ready){zipUpdating=true;if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='上傳中…'}try{const up=await _st.uploadZip(p.id,zipFile);p.zipMeta={name:zipFile.name,size:zipFile.size,lastModified:zipFile.lastModified,storagePath:up.storagePath,downloadUrl:up.downloadUrl,uploadedAt:new Date().toISOString()}}catch(err){console.warn('[Zip] upload failed:',err.message);p.zipMeta={name:zipFile.name,size:zipFile.size,lastModified:zipFile.lastModified};toast('ZIP 上傳失敗，僅存檔案資訊')}finally{if(submitBtn){submitBtn.disabled=false;submitBtn.textContent='儲存修改'}}}else{p.zipMeta={name:zipFile.name,size:zipFile.size,lastModified:zipFile.lastModified}}}save();renderProjects();renderPairs();toast(zipFile?(zipUpdating?`Project 已更新 (含 ${zipFile.name})`:`Project 已更新 (含 ${zipFile.name})`):'Project 已更新')});document.querySelectorAll('[data-priority-select]').forEach(sel=>sel.onchange=()=>{const dl=sel.closest('form').querySelector('.deadline-label');if(dl)dl.style.display=sel.value==='CERTAIN DEADLINE'?'':'none'});document.querySelectorAll('[data-item-edit]').forEach(btn=>btn.onclick=()=>{const [projectId,itemId]=btn.dataset.itemEdit.split('|');const form=document.querySelector(`[data-item-extra-key="${projectId}|${itemId}"]`);const summary=document.querySelector(`[data-item-summary="${projectId}|${itemId}"]`);if(form.style.display==='none'){form.style.display='';summary.style.display='none';btn.textContent='收起'}else{form.style.display='none';summary.style.display='';btn.textContent=document.querySelector(`[data-item-summary="${projectId}|${itemId}"] .item-type-badge`)?.classList.contains('none')?'設定類別':'編輯資料'}});document.querySelectorAll('[data-project-delete]').forEach(b=>b.onclick=()=>{state.projects=state.projects.filter(p=>p.id!==b.dataset.projectDelete);save();renderProjects();renderPairs();toast('已刪除 Project')});document.querySelectorAll('[data-item-delete]').forEach(b=>b.onclick=()=>{const [projectId,itemId]=b.dataset.itemDelete.split('|');const p=state.projects.find(x=>x.id===projectId);p.items=p.items.filter(x=>x.id!==itemId);save();renderProjects();toast('已刪除項目')});[['data-up',-1],['data-down',1]].forEach(([attribute,delta])=>document.querySelectorAll(`[${attribute}]`).forEach(b=>b.onclick=()=>{const [projectId,itemId]=b.getAttribute(attribute).split('|');const p=state.projects.find(x=>x.id===projectId);const i=p.items.findIndex(x=>x.id===itemId);[p.items[i],p.items[i+delta]]=[p.items[i+delta],p.items[i]];save();renderProjects()}));refreshPairProjectSelect();setTimeout(restoreProjectTabs,0); setTimeout(function(){if(typeof wikiRender==="function")wikiRender()},100) }

function renderDashboard(){
  const STATUS_ORDER = ['Pending info','Pending supplier quote','On the queue','Processing','Double check','On hold'];
  const STATUS_CSS = {'Pending info':'pending-info','Pending supplier quote':'pending-supplier-quote','On the queue':'on-the-queue','Processing':'processing','Double check':'double-check','On hold':'on-hold'};
  const incomplete = state.projects.filter(p => p.status !== 'Completed');
  $('dashboardCount') && ($('dashboardCount').textContent = incomplete.length ? `(${incomplete.length})` : '');
  const grouped = {};
  STATUS_ORDER.forEach(s => { grouped[s] = []; });
  incomplete.forEach(p => {
    const key = STATUS_ORDER.includes(p.status) ? p.status : 'On hold';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });
  let html = '';
  STATUS_ORDER.forEach(status => {
    const items = grouped[status] || [];
    if (!items.length) return;
    html += `<div class="dash-group"><div class="dash-group-header" data-dash-toggle><span class="dash-toggle-icon">▶</span>${esc(status)}<span class="dash-badge ${STATUS_CSS[status]||''}">${items.length}</span></div><div class="dash-group-body" style="display:none">`;
    items.forEach(p => {
      const priorityClass = p.priority === 'URGENT' ? 'urgent' : p.priority === 'CERTAIN DEADLINE' ? 'certain' : '';
      html += `<div class="dash-item"><span class="dash-item-name" title="${esc(p.name)}">${esc(p.name)}</span>${p.priority ? `<span class="dash-priority ${priorityClass}">${esc(p.priority)}</span>` : ''}</div>`;
    });
    html += `</div></div>`;
  });
  if (!html) html = '<div class="dash-empty">🎉 所有 Project 皆已完成！</div>';
  $('dashboardList').innerHTML = html;
}

// PROJECT CONFIRMED tab — projects that have at least one confirmed Work Log
// PROJECT CONFIRMED — per-project confirmation drop-downs (selection appends to Summary)
const CONFIRMED_DROPDOWNS = [
  { label: 'Ironmongery Sign Off (4DWGS)', options: ['TO DO','DONE'] },
  { label: 'PROJECT ADMIN', options: ['UPDATED','PENDING'] },
  { label: 'PICKLIST (DO)', options: ['NOT YET','DO1','DO2','DO3','DO4','DO5','DO6','D07','DO8','DO9','DO10','D011'] }
];
function _confirmedHits(){
  return state.projects
    .map(p => ({ p, logs: (Array.isArray(p.workLogs)?p.workLogs:[]).filter(l => l.status === 'confirmed') }))
    .filter(x => x.logs.length > 0)
    .sort((a,b) => (a.p.name||'').localeCompare(b.p.name||''));
}
function _confirmedCardHtml(p, logs){
  const summary = Array.isArray(p.confirmSummary)?p.confirmSummary:[];
  const selects = CONFIRMED_DROPDOWNS.map(dd=>`<label class="confirmed-select"><span>${esc(dd.label)}</span><select data-confirmed-select="${p.id}" data-confirmed-type="${esc(dd.label)}"><option value="">—</option>${dd.options.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></label>`).join('');
  const items = summary.map(r=>`<div class="confirmed-summary-item"><span class="cs-label">${esc(r.label)}</span><span class="cs-value">${esc(r.value)}</span><span class="cs-date">${esc((r.createdAt||'').slice(0,10))}</span><button type="button" class="worklog-btn worklog-del" data-confirmed-del="${p.id}|${r.id}" title="刪除">✕</button></div>`).join('');
  return `<div class="confirmed-card" data-confirmed-card="${p.id}"><div class="confirmed-card-head"><strong class="confirmed-card-name" data-confirmed-open="${p.id}" title="開啟 Work Log">${esc(p.name)}</strong>${p.priority==='URGENT'?'<span class="confirmed-urgent">URGENT</span>':''}${p.sales?`<span class="confirmed-qs">Sales: ${esc(p.sales)}</span>`:''}${p.assignedQs?`<span class="confirmed-qs">QS: ${esc(p.assignedQs)}</span>`:''}</div><div class="confirmed-card-logs">${logs.map(l=>`<span class="pc-log" title="${esc(l.summary)}">${esc(l.summary)}</span>`).join('')}</div><div class="confirmed-selects">${selects}</div><button type="button" class="confirmed-toggle" data-confirmed-toggle="${p.id}">▶ Summary (${summary.length})</button><div class="confirmed-summary" data-confirmed-summary="${p.id}" style="display:none">${items||'<div class="worklog-empty">尚無 Summary 記錄。</div>'}</div></div>`;
}
// PROJECT CONFIRMED：檢索式下拉 — 唯有檢索並選取才顯示該 project 的內容，否則空白
renderConfirmed.selectedId = null;
function renderConfirmed(){
  const list = document.getElementById('confirmedList');
  if (!list) return;
  const hits = _confirmedHits();
  // 檢索下拉清單（所有 confirmed project）
  const dd = document.getElementById('confirmedDropdown');
  if (dd) {
    dd.innerHTML = hits.length
      ? hits.map(({p}) => `<div class="ps-item" data-confirmed-pick="${p.id}">${esc(p.name)}${p.assignedQs?`<small style="color:#7a97b0;font-weight:400"> (${esc(p.assignedQs)})</small>`:''}</div>`).join('')
      : '<div class="ps-empty">尚無已確認 (confirmed) 的 Project</div>';
  }
  // 僅顯示選取的 project（若仍為 confirmed），否則空白提示
  let sel = null;
  if (renderConfirmed.selectedId) {
    const hit = hits.find(x => x.p.id === renderConfirmed.selectedId);
    if (hit) sel = hit;
    else renderConfirmed.selectedId = null;
  }
  list.innerHTML = sel
    ? _confirmedCardHtml(sel.p, sel.logs)
    : '<div class="project-empty">請檢索並選取一個已確認 (confirmed) 的 Project。</div>';
}

// Confirmed searchable dropdown — filter + pick
(function(){
  const search = document.getElementById('confirmedSearch');
  const dd = document.getElementById('confirmedDropdown');
  if (!search || !dd) return;
  dd.addEventListener('click', e => {
    const item = e.target.closest('[data-confirmed-pick]');
    if (!item) return;
    renderConfirmed.selectedId = item.dataset.confirmedPick;
    const p = state.projects.find(x => x.id === renderConfirmed.selectedId);
    if (search && p) search.value = p.name;
    dd.classList.remove('open');
    renderConfirmed();
  });
  search.addEventListener('focus', () => { renderConfirmed(); dd.classList.add('open'); });
  search.addEventListener('blur', () => setTimeout(() => dd.classList.remove('open'), 200));
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    let visible = 0;
    dd.querySelectorAll('.ps-item').forEach(it => {
      const match = !q || it.textContent.toLowerCase().includes(q);
      it.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    const empty = dd.querySelector('.ps-empty');
    if (empty) empty.style.display = visible ? 'none' : '';
    dd.classList.add('open');
  });
})();

// Click a confirmed project → jump to LISTED PROJECTS, open that card's Work Log tab
document.addEventListener('click', e => {
  const opener = e.target.closest('[data-confirmed-open]');
  if (!opener) return;
  const pid = opener.dataset.confirmedOpen;
  const savedBtn = document.querySelector('.project-tab[data-project-tab="saved"]');
  if (savedBtn) savedBtn.click();
  const card = document.querySelector(`.project-card[data-project-card="${pid}"]`);
  if (card) card.open = true;
  projectTabState[pid] = 'notes';
  setTimeout(() => {
    const notesBtn = document.querySelector(`[data-ptab="${pid}"][data-ptab-panel="notes"]`);
    if (notesBtn) notesBtn.click();
  }, 60);
});

// Confirmed card drop-down → append to Summary (persisted per project)
document.addEventListener('change', e => {
  const sel = e.target.closest('[data-confirmed-select]');
  if (!sel) return;
  const pid = sel.dataset.confirmedSelect;
  const label = sel.dataset.confirmedType;
  const value = sel.value;
  const p = state.projects.find(x => x.id === pid);
  if (!p) return;
  if (!value) return; // reverted to "—": no record
  if (!Array.isArray(p.confirmSummary)) p.confirmSummary = [];
  p.confirmSummary.push({ id: id(), label, value, createdAt: new Date().toISOString() });
  save();
  renderProjects(); // re-renders confirmed list (summary stays collapsed by default)
  toast(`已新增 Summary: ${label} · ${value}`);
});

// Summary toggle (collapsed by default)
document.addEventListener('click', e => {
  const tog = e.target.closest('[data-confirmed-toggle]');
  if (!tog) return;
  const body = document.querySelector(`[data-confirmed-summary="${tog.dataset.confirmedToggle}"]`);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  const count = body.querySelectorAll('.confirmed-summary-item').length;
  tog.textContent = (isOpen ? '▶' : '▼') + ' Summary (' + count + ')';
});

// Delete a Summary record
document.addEventListener('click', e => {
  const del = e.target.closest('[data-confirmed-del]');
  if (!del) return;
  e.preventDefault();
  const [pid, rid] = del.dataset.confirmedDel.split('|');
  const p = state.projects.find(x => x.id === pid);
  if (!p || !Array.isArray(p.confirmSummary)) return;
  p.confirmSummary = p.confirmSummary.filter(r => r.id !== rid);
  save();
  renderProjects();
  toast('Summary 記錄已刪除');
});

// Zip file selected → update status text (Choose Zip file / No file selected yet)
document.addEventListener('change', e => {
  const input = e.target.closest('[data-zip-upload]');
  if (!input) return;
  const label = input.closest('.zip-upload-label');
  const status = label ? label.querySelector('[data-zip-status]') : null;
  if (status) status.textContent = (input.files && input.files[0]) ? input.files[0].name : 'No file selected yet';
});

// Download Zip — fetch download URL from Firebase Storage and trigger download
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-zip-download]');
  if (!btn) return;
  e.preventDefault();
  const p = state.projects.find(x => x.id === btn.dataset.zipDownload);
  if (!p || !p.zipMeta || !p.zipMeta.storagePath) { toast('此 Project 沒有已上傳的 ZIP'); return; }
  const _st = (window.T1 || {}).storage;
  if (!_st || !_st.ready) { toast('Firebase Storage 未就緒'); return; }
  _st.getDownloadUrl(p.zipMeta.storagePath).then(url => {
    const a = document.createElement('a');
    a.href = url;
    a.download = p.zipMeta.name || 'download.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('開始下載 ' + (p.zipMeta.name || ''));
  }).catch(err => { console.warn('[Zip] download failed:', err.message); toast('下載失敗'); });
});

// Dashboard group toggle (collapsed by default)
document.addEventListener('click', e => {
  const header = e.target.closest('[data-dash-toggle]');
  if (!header) return;
  const body = header.nextElementSibling;
  const icon = header.querySelector('.dash-toggle-icon');
  if (!body || !icon) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  icon.textContent = isOpen ? '▶' : '▼';
});

// Make renderProjects trigger dashboard + confirmed refresh
const _origRenderProjects = renderProjects;
renderProjects = function(){
  _origRenderProjects();
  renderDashboard();
  renderConfirmed();
};

// Event delegation for type tabs and extra forms (avoids re-rendering entire project list)
document.addEventListener('click',e=>{const btn=e.target.closest('[data-set-type]');if(!btn)return;e.preventDefault();const [projectId,itemId,newType]=btn.dataset.setType.split('|');const p=state.projects.find(x=>x.id===projectId);if(!p)return;const item=p.items.find(x=>x.id===itemId);if(!item)return;item.type=newType;item.extra={};save();const form=btn.closest('.project-extra');const isPartition=newType==='PARTITION';const fields=(extraFields[newType]||[]).map(([key,label])=>`<label><span>${label}</span>${key==='remark'?`<textarea name="${key}"></textarea>`:`<input name="${key}">`}</label>`).join('');const body=form.querySelector('.extra-body');body.innerHTML=`<div class="type-tabs"><button class="type-tab partition ${isPartition?'active':''}" data-set-type="${projectId}|${itemId}|PARTITION">PARTITION</button><button class="type-tab door ${!isPartition?'active':''}" data-set-type="${projectId}|${itemId}|DOOR">DOOR</button></div><div class="extra-fields">${fields}</div><button class="primary" type="submit">儲存項目資料</button>`});
document.addEventListener('submit',e=>{const form=e.target.closest('[data-item-extra-key]');if(!form)return;e.preventDefault();const [projectId,itemId]=form.dataset.itemExtraKey.split('|');const p=state.projects.find(x=>x.id===projectId);const item=p.items.find(x=>x.id===itemId);const fd=new FormData(form);item.extra=Object.fromEntries(fd.entries());save();renderProjects();toast('項目資料已儲存');});

$('search').oninput=e=>{state.query=e.target.value;renderResults()};$('clearSearch').onclick=()=>{$('search').value='';state.query='';state.category='';renderFilters();renderResults()};$('inventoryA1').oninput=e=>state.inventoryA1=e.target.value;$('inventoryA2').oninput=e=>state.inventoryA2=e.target.value;$('resetPair').onclick=()=>{state.a1=null;state.a2=null;state.inventoryA1='';state.inventoryA2='';$('pairName').value='Item A';renderSlots()};$('savePair').onclick=()=>{state.pairs.unshift({id:id(),name:$('pairName').value.trim()||'未命名配對',a1:state.a1?structuredClone(state.a1):null,a2:state.a2?structuredClone(state.a2):null,inventoryA1:state.inventoryA1,inventoryA2:state.inventoryA2,qtn:$('qtnSearch').value.trim(),boq:$('boqSearch').value.trim(),createdAt:new Date().toISOString()});save();renderPairs();toast('配對已儲存')};document.addEventListener('change',e=>{const sel=e.target.closest('[data-priority-select]');if(!sel)return;const label=sel.closest('form').querySelector('.deadline-label');if(label)label.style.display=sel.value==='CERTAIN DEADLINE'?'':'none'});$('projectForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const deadline=f.get('deadline');const zipInput=e.target.querySelector('[data-zip-upload]');const zipFile=zipInput&&zipInput.files[0];const _st=(window.T1||{}).storage;const pid=id();let zipMeta=zipFile?{name:zipFile.name,size:zipFile.size,lastModified:zipFile.lastModified}:null;let zipUpdating=false;const submitBtn=e.target.querySelector('button[type="submit"]');if(zipFile&&_st&&_st.ready){zipUpdating=true;if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='上傳中…'}try{const up=await _st.uploadZip(pid,zipFile);zipMeta.storagePath=up.storagePath;zipMeta.downloadUrl=up.downloadUrl;zipMeta.uploadedAt=new Date().toISOString()}catch(err){console.warn('[Zip] upload failed:',err.message);toast('ZIP 上傳失敗，僅存檔案資訊')}finally{if(submitBtn){submitBtn.disabled=false;submitBtn.textContent='SAVE'}}}state.projects.unshift({id:pid,name:f.get('name').trim(),assignedQs:'',status:'',sales:f.get('sales').trim(),priority:f.get('priority').trim(),deadline:deadline?deadline+' EOD':'',address:f.get('address').trim(),tenderer:f.get('tenderer').trim(),attn:f.get('attn').trim(),tel:f.get('tel').trim(),email:f.get('email').trim(),mobile:f.get('mobile').trim(),fax:f.get('fax').trim(),briefing:{general:f.get('briefingGeneral')||'',layout:f.get('briefingLayout')||''},zipMeta,items:[]});save();try{const _fs2=(window.T1||{}).firestore;if(_fs2&&_fs2.ready&&_fs2.saveProjectsAwait){await _fs2.saveProjectsAwait(state.projects);const _es=(window.T1||{}).emailService,_et=(window.T1||{}).emailTemplate,_auth=(window.T1||{}).auth;if(_es&&_es.sendEmail&&_et){const _p=state.projects[0];if(_p&&_p.email){const _iso=new Date().toISOString().slice(0,10);const _sbj=_et.buildEmailSubject(_p.name);const _html=_et.buildEmailHtml({rfqNumber:_p.name,customer:_p.tenderer||'',project:_p.name,quotationDate:_iso,createdBy:((_auth&&_auth.currentUser?(_auth.currentUser()||{}).email:null)||''),totalItems:(_p.items||[]).length});await _es.sendEmail({to:_p.email,subject:_sbj,html:_html})}}}}catch(_e){console.error('[RFQ Email] notification skipped (RFQ creation unaffected):',_e&&_e.message?_e.message:_e)}e.target.reset();document.querySelector('[data-deadline-input]').closest('.deadline-label').style.display='none';renderProjects();renderPairs();refreshPairProjectSelect();toast(zipMeta?`Project 已儲存 (含 ${zipMeta.name})`:'Project 已儲存')};$('exportPairs').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({pairs:state.pairs,projects:state.projects},null,2)],{type:'application/json'}));a.download='t1-configuration-backup.json';a.click();URL.revokeObjectURL(a.href)};$('importPairs').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!Array.isArray(d.pairs))throw Error();state.pairs=d.pairs;state.projects=Array.isArray(d.projects)?d.projects:[];save();renderPairs();renderProjects();refreshPairProjectSelect();toast('備份已匯入')}catch{toast('無法讀取備份檔')}e.target.value=''};$('exportProjects').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({projects:state.projects},null,2)],{type:'application/json'}));a.download='t1-projects-backup.json';a.click();URL.revokeObjectURL(a.href)};$('importProjects').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!Array.isArray(d.projects))throw Error();state.projects=d.projects;save();renderProjects();renderPairs();refreshPairProjectSelect();toast('Projects 已匯入')}catch{toast('無法讀取 Projects 備份')}e.target.value=''};$('viewer').addEventListener('click',e=>{if(e.target===$('viewer'))$('viewer').close()});initViewer();renderFilters();renderResults();renderSlots();renderPairs();renderProjects();refreshPairProjectSelect();renderMixMatch();(function boot(){const _overlay=document.getElementById('t1Loading');const _fs=(window.T1||{}).firestore;function _hide(){if(_overlay){_overlay.classList.add('t1-loaded');setTimeout(()=>_overlay.remove(),400)}}if(_fs&&_fs.init){_fs.init().then(data=>{if(data.pairs&&data.projects){state.pairs=data.pairs;state.projects=data.projects;renderPairs();renderProjects();renderFilters();renderResults();renderSlots();refreshPairProjectSelect()}if(data.mixNotes){mixNotes=Object.assign({},data.mixNotes,mixNotes);renderMixMatch()}if(data.wiki&&Array.isArray(data.wiki)){wikiEntries=data.wiki;wikiRender()}_hide()}).catch(_hide)}else{_hide()}})();
$('profileSearch').oninput=e=>{profileState.query=e.target.value;renderProfileResults()};$('clearProfileSearch').onclick=()=>{$('profileSearch').value='';profileState.query='';profileState.category='';renderProfileFilters();renderProfileResults()};renderProfileFilters();renderProfileResults();

// Project searchable filter dropdown
(function(){const search=$('projectSearch'),dropdown=$('projectDropdown');if(!search||!dropdown)return;let selectedId='';function rebuild(items){dropdown.innerHTML=items.length?items.map(p=>`<div class="ps-item" data-pid="${p.id}">${esc(p.name)} ${p.assignedQs?`<small style="color:#7a97b0;font-weight:400">(${esc(p.assignedQs)})</small>`:''}</div>`).join(''):'<div class="ps-empty">無符合的 Project</div>';dropdown.querySelectorAll('.ps-item').forEach(el=>{el.addEventListener('click',()=>{selectedId=el.dataset.pid;const p=state.projects.find(x=>x.id===selectedId);search.value=p?p.name:'';dropdown.classList.remove('open');applyFilter()})})}function applyFilter(){document.querySelectorAll('.project-card').forEach(card=>{card.style.display=selectedId&&card.dataset.projectCard===selectedId?'block':'none'})}search.addEventListener('focus',()=>{rebuild(state.projects.slice(0,4));dropdown.classList.add('open')});search.addEventListener('blur',()=>setTimeout(()=>dropdown.classList.remove('open'),200));search.addEventListener('input',()=>{const q=search.value.toLowerCase().trim();const filtered=state.projects.filter(p=>p.name.toLowerCase().includes(q)||(p.assignedQs||'').toLowerCase().includes(q));rebuild(filtered);dropdown.classList.add('open')});const prevRender2=renderProjects;renderProjects=function(){prevRender2();applyFilter()};applyFilter();if(!state.projects.length)selectedId=''})();

// Operable Wall searchable dropdowns
(function(){function setupSearchableDropdown(searchId,dropdownId,emptyId){const search=document.getElementById(searchId),dropdown=document.getElementById(dropdownId),empty=emptyId?document.getElementById(emptyId):null;if(!search||!dropdown)return;const allItems=dropdown.querySelectorAll('.ow-item');search.addEventListener('focus',()=>{dropdown.classList.add('open')});search.addEventListener('blur',()=>setTimeout(()=>dropdown.classList.remove('open'),180));search.addEventListener('input',()=>{const q=search.value.toLowerCase().trim();let visible=0;dropdown.querySelectorAll('.ow-group').forEach(g=>{let gVis=0;g.querySelectorAll('.ow-item').forEach(item=>{const match=!q||item.dataset.value.toLowerCase().includes(q);item.style.display=match?'':'none';if(match)gVis++});g.style.display=gVis?'':'none';visible+=gVis});const flatItems=dropdown.querySelectorAll(':scope > .ow-item');flatItems.forEach(item=>{const match=!q||item.dataset.value.toLowerCase().includes(q);item.style.display=match?'':'none';if(match)visible++});if(empty)empty.hidden=visible>0;dropdown.classList.add('open')});allItems.forEach(item=>{item.addEventListener('click',()=>{search.value=item.dataset.value;dropdown.classList.remove('open');toast(`已選擇: ${item.dataset.value}`)})})}setupSearchableDropdown('operableWallSearch','operableWallDropdown','owEmpty');setupSearchableDropdown('sourcingSearch','sourcingDropdown','sourcingEmpty');})();

// Operable Wall form — populate project select and copy to project
(function(){const select=$('owProjectSelect'),copyBtn=$('owCopyBtn');if(!select||!copyBtn)return;function refreshProjects(){const cur=select.value;select.innerHTML='<option value="">選擇 Project</option>'+state.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');if(cur)select.value=cur}refreshProjects();const prevRender=renderProjects;renderProjects=function(){prevRender();refreshProjects()};copyBtn.addEventListener('click',()=>{const pid=select.value;if(!pid){toast('請先選擇 Project');return}const p=state.projects.find(x=>x.id===pid);if(!p){toast('找不到 Project');return}const sourcing=$('sourcingSearch').value.trim();const product=$('operableWallSearch').value.trim();if(!sourcing&&!product){toast('請先選擇 Sourcing 或 Operable Wall 產品');return}p.items.push({id:id(),pair:{name:(sourcing||product),a1:{code:sourcing||'—',category:'Operable Wall',page:0,image:''},a2:{code:product||'—',category:'Operable Wall',page:0,image:''},inventoryA1:'',inventoryA2:''},type:'OPERABLE_WALL',extra:{legend:$('owLegend').value.trim(),finishes:$('owFinishes').value.trim(),height:$('owHeight').value.trim(),type:$('owType').value.trim(),operate:$('owOperate').value.trim(),country:$('owCountry').value.trim(),hwFinishes:$('owHwFinishes').value.trim(),remark:$('owRemark').value.trim()}});save();renderProjects();toast(`已複製到 ${p.name}`)})})();

// Assigned QS per-project card (delegated)
document.addEventListener('change',e=>{const sel=e.target.closest('[data-assign-qs]');if(!sel)return;const p=state.projects.find(x=>x.id===sel.dataset.assignQs);if(!p)return;p.assignedQs=sel.value;save();renderDashboard()});
document.addEventListener('change',e=>{const sel=e.target.closest('[data-assign-status]');if(!sel)return;const p=state.projects.find(x=>x.id===sel.dataset.assignStatus);if(!p)return;p.status=sel.value;save();renderDashboard()});

// QTN data from QTN.md
const qtnCategories=[
  {name:'SGL PARTITION — T-108 / T-50 / T-25',products:[
    'T1 Single Glazed Partition System — Single Glazed Partition Center Pocket (T-108)',
    'T1 Single Glazed Partition System c/w 2H Transom & V Mullion — Single Glazed Partition Center Pocket (T-108)',
    'T1 Single Glazed Partition System c/w 2H 25mm Flat Bar Transom & V 25mm Flat Bar Mullion — Single Glazed Partition Center Pocket (T-108)',
    'T1 Single Glazed Partition System c/w 2H 50mm Flat Bar Transom & V 50mm Flat Bar Mullion — Single Glazed Partition Center Pocket (T-108)',
    'T1 Single Glazed Partition System — Single Glazed Partition Offset (T-108)',
    'T1 Single Glazed Partition System c/w 2H Transom & V Mullion — Single Glazed Partition Offset (T-108)',
    'T1 Single Glazed Partition System c/w 2H 25mm Flat Bar Transom & V 25mm Flat Bar Mullion — Single Glazed Partition Offset (T-108)',
    'T1 Single Glazed Partition System c/w 2H 50mm Flat Bar Transom & V 50mm Flat Bar Mullion — Single Glazed Partition Offset (T-108)',
    'T1 Single Glazed Partition System — Single Glazed Partition (T-50)',
    'T1 Single Glazed Partition System c/w 2H Transom & V Mullion — Single Glazed Partition (T-50)',
    'T1 Single Glazed Partition System c/w 2H 25mm Flat Bar Transom & V 25mm Flat Bar Mullion — Single Glazed Partition (T-50)',
    'T1 Single Glazed Partition System c/w 2H 50mm Flat Bar Transom & V 50mm Flat Bar Mullion — Single Glazed Partition (T-50)',
    'T1 Single Glazed Partition System — Single Glazed Partition (T-25)',
    'T1 Single Glazed Partition System c/w 2H 25mm Flat Bar Transom & V 25mm Flat Bar Mullion — Single Glazed Partition (T-25)',
    'T1 Single Glazed Partition System c/w 2H 50mm Flat Bar Transom & V 50mm Flat Bar Mullion — Single Glazed Partition (T-25)'
  ]},
  {name:'SGL SWING DOOR — T-115SG / T-70SG / T-30SG',products:[
    'T1 Single Glazed System Swing Door c/w Door Frame — Single leaf (T-115SG)',
    'T1 Single Glazed System Swing Door c/w Door Frame & 2H Transom — Single leaf (T-115SG)',
    'T1 Single Glazed System Swing Door c/w Door Frame & 2H 25mm Flat Bar Transom — Single leaf (T-115SG)',
    'T1 Single Glazed System Swing Door c/w Door Frame — Single leaf (T-30SG) Lockbox: black spray paint',
    'T1 Single Glazed System Swing Door c/w Door Frame — Single leaf (T-30SG)',
    'T1 Single Glazed System Swing Door c/w Door Frame & 2H Transom — Single leaf (T-30SG)',
    'T1 Single Glazed System Swing Door c/w Door Frame & 2H 25mm Flat Bar Transom — Single leaf (T-30SG)',
    'T1 Single Glazed System Swing Door c/w Door Frame — Single leaf (T-70SG)',
    'T1 Single Glazed System Swing Door c/w Door Frame & 2H Transom — Single leaf (T-70SG)',
    'T1 Single Glazed System Swing Door c/w Door Frame & 2H 25mm Flat Bar Transom — Single leaf (T-70SG)',
    'T1 Fixed Center Pivot Single Glazed System Door c/w Door Frame — Single leaf (T-115SG)',
    'T1 Frameless Single Glazed Swing Door — Single leaf 1000mm H Pull Handle w/ SS Finish Floor Lockset & SS Finish Floor Spring',
    'T1 Frameless Single Glazed Swing Door — Single leaf 1000mm H Pull Handle w/ SS Finish Dorma Floor Lockset & SS Finish Dorma Floor Spring'
  ]},
  {name:'SGL PREMIO DOOR',products:[
    'T1 Single Glazed Premio Swing Door c/w Door Frame — Single leaf (Premio Door)'
  ]},
  {name:'SGL SLIDING DOOR — T-115SG / T-70SG',products:[
    'T1 Single Glazed Top Hung Sliding System c/w Door Frame — Single leaf (T-115SG) Ceiling Track (Manual)',
    'T1 Single Glazed Floor Roller Sliding System c/w Door Frame — Single leaf (T-115SG) Floor Roller (Manual)',
    'T1 Single Glazed Floor Roller Sliding System c/w Door Frame & 2H Transom — Single leaf (T-115SG) Floor Roller (Manual)',
    'T1 Single Glazed Floor Roller Sliding System c/w Door Frame & 2H 25mm Flat Bar Transom — Single leaf (T-115SG) Floor Roller (Manual)',
    'T1 Single Glazed Floor Roller Sliding System c/w Door Frame — Single leaf (T-70SG) Floor Roller (Manual)'
  ]},
  {name:'DGL PARTITION — T-108',products:[
    'T1 Double Glazed Partition System — Double Glazed Partition (T-108)',
    'T1 Double Glazed Partition System c/w 2H Transom & V Mullion — Double Glazed Partition (T-108)',
    'T1 Double Glazed Partition System c/w 2H 25mm Flat Bar Transom & V 25mm Flat Bar Mullion — Double Glazed Partition (T-108)',
    'T1 Double Glazed Partition System c/w 2H 50mm Flat Bar Transom & V 50mm Flat Bar Mullion — Double Glazed Partition (T-108)',
    'T1 Double Glazed Partition System — Pocket DGL Partition (T-108) Track: 108x50mm',
    'T1 Double Glazed Partition System — Pocket DGL Partition (T-108) Track: 108x50mm(T) | 108x25mm(B&V)'
  ]},
  {name:'DGL SWING DOOR — T-115DG / T-90DG / T-30DG',products:[
    'T1 Double Glazed Entry System Swing Door c/w Door Frame — Single leaf (T-115DG)',
    'T1 Double Glazed Entry System Swing Door c/w Door Frame & 2H Transom — Single leaf (T-115DG)',
    'T1 Double Glazed Entry System Swing Door c/w Door Frame & 2H 25mm Flat Bar Transom — Single leaf (T-115DG)',
    'T1 Double Glazed System Rebate Swing Door c/w Door Frame — Single leaf (T-90DG)',
    'T1 Double Glazed Entry System Swing Door c/w Door Frame — Single leaf (T-30DG)',
    'T1 Double Glazed Entry System Swing Door c/w Door Frame & 2H 25mm Flat Bar Transom — Single leaf (T-30DG)'
  ]},
  {name:'DGL SLIDING DOOR — T-90DG / T-115DG',products:[
    'T1 Double Glazed Top Hung Sliding System c/w Door Frame — Single leaf (T-90DG) Ceiling Track (Manual)',
    'T1 Double Glazed Floor Roller Sliding System c/w Door Frame — Single leaf (T-115DG) Floor Roller (Manual)',
    'T1 Double Glazed Floor Roller Sliding System c/w Door Frame & 2H Transom — Single leaf (T-115DG) Floor Roller (Manual)',
    'T1 Double Glazed Floor Roller Sliding System c/w Door Frame & 2H 25mm Flat Bar Transom — Single leaf (T-115DG) Floor Roller (Manual)'
  ]},
  {name:'PARTITION & DOOR c/w SWITCHABLE GLASS',products:[
    'T1 Double Glazed Partition System c/w Switchable Glass — DGL Partition (T-108) 10mm Clear+11.52mm Switchable | 108x25mm',
    'T1 Double Glazed Partition System c/w Switchable Glass — DGL Partition (T-108) 10mm Clear+11.52mm Switchable | 108x50mm',
    'T1 Single Glazed Partition System c/w Switchable Glass — SGL Partition Offset (T-108) 11.52mm Switchable | 108x25mm',
    'T1 Single Glazed Partition System c/w Switchable Glass — SGL Partition Offset (T-108) 11.52mm Switchable | 108x50mm',
    'T1 Single Glazed Partition System c/w Switchable Glass — SGL Partition Center Pocket (T-108) 11.52mm Switchable | 108x25mm',
    'T1 Single Glazed Partition System c/w Switchable Glass — SGL Partition Center Pocket (T-108) 11.52mm Switchable | 108x50mm',
    'T1 Double Glazed System Rebate Swing Door c/w Door Frame (Switchable Glass) — Single leaf (T-90DG)',
    'T1 Double Glazed Entry System Swing Door c/w Door Frame (Switchable Glass) — Single leaf (T-115DG)'
  ]},
  {name:'SGL / DGL CURVE GLASS',products:[
    'T1 Double Glazed Partition System — Curve Glass DGL Partition (T-108) Radius 1041 | Track 108x25mm',
    'T1 Double Glazed Partition System — Curve Glass DGL Partition (T-108) Radius 1041 | Track 108x50mm',
    'T1 Single Glazed Partition System — Curve Glass SGL Partition Offset (T-108) Radius 1041 | Track 108x25mm',
    'T1 Single Glazed Partition System — Curve Glass SGL Partition Offset (T-108) Radius 1041 | Track 108x50mm',
    'T1 Single Glazed Partition System — Curve Glass SGL Partition (T-25) Radius 1000 | Track 25x25mm',
    'T1 Single Glazed Partition System — Curve Glass SGL Partition (T-25) Radius 1000 | Track 25x50mm'
  ]},
  {name:'BI-FOLD DOOR — T-70SG',products:[
    'T1 (2-Panel) Bi-Fold Door c/w Door Frame — 2 Panels (T-70SG) Open Left/Right or Open 1 Side'
  ]},
  {name:'TIMBER SWING DOOR — T-90DG',products:[
    'T1 Acoustic Timber System Swing Door c/w Door Frame — T90 Timber Single leaf | One Side Laminated Finishes',
    'T1 Acoustic Timber System Swing Door c/w Door Frame — T90 Timber Single leaf | Both Sides Laminated Finishes'
  ]},
  {name:'MISCELLANEOUS',products:[
    'T1 System Door Frame Only — Ironmongery Excluded / Offset S/S Hinge Only',
    'T1 System Power Column — Double Glazed Power Column 300mm (black/silver/white paint back glass)',
    'T1 Aluminium Power Column — Aluminium Square Power Column',
    'T1 Metal Cladding Power Column — 300Wx2700H Metal Cladding with max 3 holes (black powdercoated/NA)',
    'Motorised Venetian Blinds',
    'Additional cost: Powdercoat T1 Standard White (RAL 9016)',
    'Additional cost: Manual Hoisting / Weekend/Night Works'
  ]},
  {name:'BARRIERA — T-50',products:[
    'T1 Single Glazed Barriera System — Type A | SGL Partition (T-50)',
    'T1 Single Glazed Barriera System — Type B | SGL Partition (T-50)',
    'T1 Single Glazed Barriera System — Type C | SGL Partition (T-50)'
  ]},
  {name:'JLL FRAMELESS GLASS PARTITION & DOOR',products:[
    'Frameless Glass (Top & Bottom Frame Only)',
    'Frameless Single Glazed Swing Door — Single leaf | 600mm H Pull Handle SSS Finish c/w Floor Spring Set & Lockset',
    'Frameless Single Glazed Swing Door — Single leaf | 600mm H Pull Handle SSS Finish c/w Manual Sliding Mechanism Set & Lockset'
  ]}
];
(function(){const search=$('qtnSearch'),dropdown=$('qtnDropdown');if(!search||!dropdown)return;function rebuild(q){const query=(q||'').toLowerCase().trim();dropdown.innerHTML='';let anyMatch=false;qtnCategories.forEach(cat=>{const prodHtml=cat.products.filter(p=>!query||p.toLowerCase().includes(query)).map(p=>`<div class="qtn-item" data-value="${esc(p)}">${esc(p)}</div>`).join('');if(!prodHtml)return;anyMatch=true;dropdown.innerHTML+=`<div class="qtn-group"><div class="qtn-group-label">${esc(cat.name)}</div>${prodHtml}</div>`});if(!anyMatch)dropdown.innerHTML='<div class="qtn-empty">無符合的產品</div>';dropdown.classList.add('open')}search.addEventListener('focus',()=>rebuild(search.value));search.addEventListener('blur',()=>setTimeout(()=>dropdown.classList.remove('open'),200));search.addEventListener('input',()=>rebuild(search.value));dropdown.addEventListener('click',e=>{const item=e.target.closest('.qtn-item');if(!item)return;search.value=item.dataset.value;dropdown.classList.remove('open');toast(`已選擇: ${item.dataset.value}`)})})();

// BOQ data from BOQ.txt
const boqCategories=[
  {name:'SINGLE GLAZED PARTITION SYSTEM',products:[
    'T1 Single Glaze Partition (T25) Without GSEAL / GJOINER',
    'T1 Single Glaze Partition (T25) | T1 Glass [ T-25 | GF-1/A ]',
    'T1 Single Glaze Partition (T50) [ T-50 | GF-2/B ]',
    'T1 Single Glaze Partition (T108 - Center Pocket)',
    'T1 Single Glaze Partition (T108 - Center Pocket) | T1 Glass [ T-108 | GF-4/D ]',
    'T1 Single Glaze Partition (T108 - Offset) [ T-108 | GF-5/E ]',
    'T1 Single Glaze Partition (T108 - Offset) | T1 Glass [ T-108 | GF-7/K ]',
    'T1 Single Glaze Partition (T108 - Offset) | T1 Glass [ T-108 | GF-5/N ]',
    'T1 Single Glaze Partition (T25) | T1 Glass [ T-25 | GF-12/H ]'
  ]},
  {name:'SINGLE GLAZED SWING DOOR PANEL SYSTEM',products:[
    'T1 Single Glazed Door (T115SG) | T1 Glass [ T-115SG | SWING DP-A1 ]',
    '[ T-30SG ] Single Glazed Entry Door Panel - Customised Lockbox | T1 Glass [ T-30SG | SWING DP-A3 ]',
    '[ T-30SG ] Single Glazed Entry Door Panel with Transom - Customised Lockbox',
    'T1 Single Glazed Door (T30SG) - T1 Lockbox | T1 Glass [ T-30SG | SWING DP-A3 ]',
    'T1 Single Glazed Door (T70SG) - T1 Glass [ T-70SG | SWING DP-A2 ]'
  ]},
  {name:'PREMIO SWING DOOR',products:[
    'Door Frame 50x25mm with T5012 | T1 Glass [ T-50 | SWING DF-A1 (PREMIO) ]',
    '[ Frameless ] Frameless Glazed Door - Premio Door | T1 Glass [ SWING DP-C1 ]'
  ]},
  {name:'DOUBLE GLAZED PARTITION SYSTEM',products:[
    'T1 Double Glaze Partition (T108) | T1 Glass [ T-108 | GF-6/F ]',
    'T1 Double Glaze Partition (T108) (Vietnam) | T1 Glass [ T-108 | GF6/O ]',
    'T1 Double Glaze Partition (T108) | T1 Glass [ T-108 | GF-8/L ]',
    'T1 Double Glaze Partition (T108) - Pocket | T1 Glass [ T-108 | GF-9/J ] - FB'
  ]},
  {name:'DOUBLE GLAZED SWING DOOR PANEL SYSTEM',products:[
    'T1 Double Glazed Door Panel (T90DG) | T1 Glass [ T-90DG | SWING DP-B1 ]',
    '[ T-115DG ] Double Glazed Entry Door Panel c/w Transom | T1 Glass [ T-115DG | SWING DP-B2 ]',
    '[ T-30DG ] Double Glazed Entry Door Panel with 25mmH Flat Bar Transom - t1 Lockbox | T1 Glass [ T-30SG | SWING DP-A3 ]'
  ]},
  {name:'SWING DOOR FRAME SYSTEM',products:[
    'Door Frame 50x25mm with T5012 | T1 Glass [ T-50 | SWING DF-A | DV-1 ]',
    'Door Frame 108x25mm with T8027A + T8029 - T90DG | T1 Glass [ T-108 | SWING DF-B | DV-8 ]',
    'Door Frame 108x25mm with T8027A + T8029 - T115DG | T1 Glass [ T-108 | SWING DF-B2 | DV-7 ]',
    'Door Frame 108x25mm with T8027A + T8029 - T115SG / T1 Door Frame Only | T1 Glass [ T-108 | SWING DF-B3 | DV-3 ]',
    'Door Frame 108x25mm with T8834 + T8016/011 + T5008 | T1 Glass [ T-108 | SWING DF-C/D | DV-2 ]',
    'Door Frame 108x25mm with T8834 + T8016/011 + T5046+C | T1 Glass [ T-108 | SWING DF-E/F ]',
    'Door Frame 108x50mm with T8835 + T8016/011 + T5008 | T1 Glass [ T-108 | SWING DF-G/H ]',
    'Door Frame 108x50mm with T8835 + T8016/011 + T5046+C | T1 Glass [ T-108 | SWING DF-I/J ]'
  ]},
  {name:'SLIDING DOOR SYSTEM',products:[
    'Sliding Door Frame 25x50mm with T5053M - Floor Roller / Track (New T3008) - SGL | T1 Glass [ T-108 | FRSLD-1 ]',
    'Sliding Door Frame 25x50mm with T5053M - Floor Roller / Track (New T3008) - DGL Pocket Sliding | T1 Glass [ T-108 | FRSLD-3 ]',
    'Sliding Door Frame 25x50mm with T8835/8011 - Floor Roller / Track (New T3008) - SGL - Slide Offset | T1 Glass [ T-108 | FRSLD-4 ]',
    'T1 Single Glazed Floor Track Sliding Door (T115SG) | T1 Glass [ T-115SG | FRSDP-V A1 ]',
    'T1 Single Glazed Floor Track Sliding Door (T115SG - 1 Vert, T70 - T&B + 1 Vert) | T1 Glass [ T-115SG/70SG | FRSDP-V A2 ]',
    'T1 Double Glazed Floor Track Sliding Door (T115DG) | T1 Glass [ T-115DG | FRSDP-V A3 ]',
    'Sliding Door Frame 50x25mm with T5004M + T5006 + T5046 - Ceiling Track | T1 Glass [ T-50 | SLIDE DF-1 ]',
    'Sliding Door Frame 108x25mm with T8834 + T8011/016 + T5046 - Ceiling Track | T1 Glass [ T-108 | SLIDE DF-2 ]',
    'Sliding Door Frame 108x25mm with T8835 + T8011/016 + T5046 - Ceiling Track | T1 Glass [ T-108 | SLIDE DF-3 ]',
    'T1 Single Glazed Ceiling Track Sliding Door (T115SG) | T1 Glass [ T-115SG | SLIDE DP-1 ]',
    'T1 Double Glazed Ceiling Track Sliding Door (T90DG) | T1 Glass [ T-90DG | SLIDE DP-5 ]'
  ]},
  {name:'BI-FOLD DOOR SYSTEM',products:[
    'Bi-Fold Door Frame 108x50mm | T1 Glass [ T-50 | BF-DF ]',
    'T1 Single Glazed Bi-Fold Door (T70SG) | T1 Glass [ T-70SG | DP-A2 ]'
  ]},
  {name:'POWER COLUMN SYSTEM',products:[
    'T-50 Power Column | T1 Glass [ T-50 PC1 ]',
    'T-50 Metal Cladding Power Column | T1 Glass [ T-50 PC2 ]',
    'T-108 Power Column | T1 Glass [ T-108 PC3 / PC4 ]',
    'T-108 Metal Cladding Power Column | T1 Glass [ T-108 PC5 / PC6 ]',
    'T-108 Aluminium Square Post | T1 Glass [ T-108 Square Post ]'
  ]},
  {name:'MISCELLANEOUS',products:[
    'Powder Coat for Aluminium Finishes',
    'Manual Hoisting',
    'Motorised Venetian/Roller Blinds',
    'T1 50/100mm Skirting | T1 Skirting'
  ]},
  {name:'ACOUSTIC TIMBER SWING DOOR PANEL SYSTEM',products:[
    '[ T-90DT ] Timber Door Panel (Single side Acoustic, Single side Laminated) | T1 Glass [ T-90DT | SWING DP-B1 ]'
  ]},
  {name:'CURVE GLASS',products:[
    'T1 Double Glaze Curved Partition (T108x25 - Curved) | T1 Glass [ T-25 ]',
    'T1 Single Glaze Offset Curved Partition (T108x25 - Offset - Curved) | T1 Glass [ T-25 ]',
    'T1 Single Glaze Curved Partition (T25x25 - Curved) | T1 Glass [ T-25 ]'
  ]},
  {name:'FRAMELESS GLASS PARTITION & FRAMELESS DOOR',products:[
    'T1 Frameless Glass Partition',
    'T1 Frameless Swing Door | T1 Glass [ SWING DP-D1-Frameless ]',
    'T1 Frameless Swing Door w/ Clerestory | T1 Glass [ SWING DP-D1-Frameless with clerestory, door above 2400mmH ]',
    'T1 Frameless Sliding Door | T1 Glass [ SLIDING DP-D1-Frameless ]'
  ]}
];
(function(){const search=$('boqSearch'),dropdown=$('boqDropdown');if(!search||!dropdown)return;function rebuild(q){const query=(q||'').toLowerCase().trim();dropdown.innerHTML='';let anyMatch=false;boqCategories.forEach(cat=>{const prodHtml=cat.products.filter(p=>!query||p.toLowerCase().includes(query)).map(p=>`<div class="qtn-item" data-value="${esc(p)}">${esc(p)}</div>`).join('');if(!prodHtml)return;anyMatch=true;dropdown.innerHTML+=`<div class="qtn-group"><div class="boq-group-label">${esc(cat.name)}</div>${prodHtml}</div>`});if(!anyMatch)dropdown.innerHTML='<div class="qtn-empty">無符合的產品</div>';dropdown.classList.add('open')}search.addEventListener('focus',()=>rebuild(search.value));search.addEventListener('blur',()=>setTimeout(()=>dropdown.classList.remove('open'),200));search.addEventListener('input',()=>rebuild(search.value));dropdown.addEventListener('click',e=>{const item=e.target.closest('.qtn-item');if(!item)return;search.value=item.dataset.value;dropdown.classList.remove('open');toast(`已選擇: ${item.dataset.value}`)})})();

// Tab switching
document.querySelectorAll('.tab-bar .tab').forEach(tab=>{tab.addEventListener('click',()=>{document.querySelectorAll('.tab-bar .tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');document.querySelectorAll('.tab-panel').forEach(p=>{p.style.display=p.dataset.tab===tab.dataset.tab?'block':'none';if(p.dataset.tab===tab.dataset.tab)p.classList.add('active');else p.classList.remove('active')})})});

// Project tab switching
document.querySelectorAll('.project-tab').forEach(tab=>{tab.addEventListener('click',()=>{document.querySelectorAll('.project-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');document.querySelectorAll('.project-tab-panel').forEach(p=>{p.style.display=p.dataset.projectTabPanel===tab.dataset.projectTab?'block':'none';if(p.dataset.projectTabPanel===tab.dataset.projectTab)p.classList.add('active');else p.classList.remove('active')})})});

// Catalog tab switching
document.querySelectorAll('.catalog-tab').forEach(tab=>{tab.addEventListener('click',()=>{document.querySelectorAll('.catalog-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');document.querySelectorAll('.catalog-tab-panel').forEach(p=>{p.style.display=p.dataset.catalogTabPanel===tab.dataset.catalogTab?'block':'none';if(p.dataset.catalogTabPanel===tab.dataset.catalogTab)p.classList.add('active');else p.classList.remove('active')})})});

// Slot image click → open viewer
document.addEventListener('click',e=>{const img=e.target.closest('[data-slot-view]');if(!img)return;const p=state[img.dataset.slotView];if(p)openViewer(p)});
// Item-view link in project items — look up full product to get correct pos
document.addEventListener('click',e=>{const el=e.target.closest('[data-item-view]');if(!el)return;const code=el.textContent.trim();const p=products.find(x=>x.code===code);if(p)openViewer(p)});
// Item field value click → open viewer (e.g. VERTICAL SECTION = "GF - 3")
document.addEventListener('click',e=>{const el=e.target.closest('[data-item-field-view]');if(!el)return;const raw=el.dataset.itemFieldView.trim();let p=products.find(x=>x.code===raw);if(!p){const norm=raw.replace(/\s*-\s*/g,' - ');p=products.find(x=>x.code===norm)}if(!p){p=profileProducts.find(x=>x.code===raw);if(!p){const norm=raw.replace(/\s*-\s*/g,' - ');p=profileProducts.find(x=>x.code===norm)}}if(p)openViewer(p);else toast('找不到對應圖面: '+raw)});

// Delegated clicks for saved-pairs actions
document.addEventListener('click',e=>{const btn=e.target.closest('[data-pair-view]');if(!btn)return;const pair=state.pairs.find(p=>p.id===btn.dataset.pair);openViewer(pair[btn.dataset.pairView])});
document.addEventListener('click',e=>{const btn=e.target.closest('[data-pair-delete]');if(!btn)return;state.pairs=state.pairs.filter(p=>p.id!==btn.dataset.pairDelete);save();renderPairs();toast('已刪除配對')});
document.addEventListener('click',e=>{const btn=e.target.closest('[data-copy]');if(!btn)return;const select=document.querySelector(`[data-project-for="${btn.dataset.copy}"]`);const project=state.projects.find(p=>p.id===select.value);const pair=state.pairs.find(p=>p.id===btn.dataset.copy);if(!project){toast('請先選擇 Project');return}project.items.push({id:id(),pair:{name:pair.name,a1:structuredClone(pair.a1),a2:structuredClone(pair.a2),inventoryA1:pair.inventoryA1,inventoryA2:pair.inventoryA2,qtn:pair.qtn||'',boq:pair.boq||''}});save();renderProjects();toast(`已複製到 ${project.name}`)});
// Blur → save editable pair name in saved-pairs list
document.addEventListener('blur',e=>{const el=e.target.closest('[data-pair-name]');if(!el)return;const pair=state.pairs.find(p=>p.id===el.dataset.pairName);if(pair&&el.textContent.trim()){pair.name=el.textContent.trim();save()}},true);
// Blur → save editable item name in project items
document.addEventListener('blur',e=>{const el=e.target.closest('[data-item-name]');if(!el)return;const [projectId,itemId]=el.dataset.itemName.split('|');const p=state.projects.find(x=>x.id===projectId);if(!p)return;const item=p.items.find(x=>x.id===itemId);if(item&&el.textContent.trim()){item.pair.name=el.textContent.trim();save()}},true);

// Pairing section "複製到 Project"
function refreshPairProjectSelect(){const sel=$('pairProjectSelect');if(!sel)return;const v=sel.value;sel.innerHTML=`<option value="">複製到 Project</option>${state.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}`;sel.value=v&&state.projects.some(p=>p.id===v)?v:'';$('pairCopyBtn').disabled=!sel.value||!(state.a1||state.a2)}
// Pairing section copy button — event delegation
document.addEventListener('click',e=>{const btn=e.target.closest('#pairCopyBtn');if(!btn||btn.disabled)return;const sel=$('pairProjectSelect');if(!sel||!sel.value){toast('請先選擇 Project');return}const project=state.projects.find(p=>p.id===sel.value);if(!project){toast('找不到 Project');return}project.items.push({id:id(),pair:{name:$('pairName').value.trim()||'未命名配對',a1:state.a1?structuredClone(state.a1):null,a2:state.a2?structuredClone(state.a2):null,inventoryA1:state.inventoryA1,inventoryA2:state.inventoryA2,qtn:$('qtnSearch').value.trim(),boq:$('boqSearch').value.trim()}});save();renderProjects();toast('已複製到 '+project.name)});
document.addEventListener('change',e=>{const sel=e.target.closest('[data-matched-classify]');if(!sel)return;const [projectId,itemId]=sel.dataset.matchedClassify.split('|');const newType=sel.value;if(!newType){return}const p=state.projects.find(x=>x.id===projectId);if(!p)return;const item=p.items.find(x=>x.id===itemId);if(!item)return;item.type=newType;item.extra={};save();renderProjects();toast('已分類為 '+newType)});
document.addEventListener('change',e=>{const sel=e.target.closest('#pairProjectSelect');if(!sel)return;$('pairCopyBtn').disabled=!sel.value||!(state.a1||state.a2)});

// QS 備註 form handler
// Work Log form handler — 6 drop-downs append a NEW log (never overwrites).
// Log Summary = non-"-" values joined in order.
document.addEventListener('submit',e=>{const form=e.target.closest('[data-worklog]');if(!form)return;e.preventDefault();const p=state.projects.find(x=>x.id===form.dataset.worklog);if(!p)return;const fd=new FormData(form);const names=['wl1','wl2','wl3','wl4','wl5','wl6'];const wl={};names.forEach(n=>wl[n]=fd.get(n)||'-');const summary=names.map(n=>wl[n]).filter(v=>v&&v!=='-').join('');const qtnNum=(fd.get('qtnNum')||'').trim();if(!summary&&!qtnNum){toast('請至少選擇一個非「-」的 Work Log 或填寫 QTN NUM');return}p.workLog=wl;if(!Array.isArray(p.workLogs))p.workLogs=[];p.workLogs.unshift({id:id(),summary,qtnNum,status:'submited',createdAt:new Date().toISOString()});save();renderProjects();toast('Log 已新增: '+(summary||qtnNum))});

// Work Log management — status change / delete / reorder (delegated, bound once)
function _findWorkLog(logId){
  for(let i=0;i<state.projects.length;i++){
    const logs=state.projects[i].workLogs||[];
    for(let j=0;j<logs.length;j++) if(logs[j].id===logId) return {p:state.projects[i],i:j};
  }
  return null;
}
document.addEventListener('change',e=>{
  const sel=e.target.closest('[data-wlog-status]');if(!sel)return;
  const hit=_findWorkLog(sel.dataset.wlogStatus);if(!hit)return;
  hit.p.workLogs[hit.i].status=sel.value;save();renderProjects();
});
document.addEventListener('click',e=>{
  const del=e.target.closest('[data-wlog-del]');
  if(del){e.preventDefault();const hit=_findWorkLog(del.dataset.wlogDel);if(!hit)return;hit.p.workLogs.splice(hit.i,1);save();renderProjects();toast('Log 已刪除');return}
  const up=e.target.closest('[data-wlog-up]');
  if(up){e.preventDefault();const hit=_findWorkLog(up.dataset.wlogUp);if(!hit)return;const a=hit.p.workLogs;if(hit.i>0){const t=a[hit.i];a[hit.i]=a[hit.i-1];a[hit.i-1]=t;save();renderProjects();}return}
  const down=e.target.closest('[data-wlog-down]');
  if(down){e.preventDefault();const hit=_findWorkLog(down.dataset.wlogDown);if(!hit)return;const a=hit.p.workLogs;if(hit.i<a.length-1){const t=a[hit.i];a[hit.i]=a[hit.i+1];a[hit.i+1]=t;save();renderProjects();}return}
});
// Project inner-tab state persistence
let projectTabState={};
document.addEventListener('click',e=>{const btn=e.target.closest('[data-ptab]');if(!btn)return;const pid=btn.dataset.ptab;projectTabState[pid]=btn.dataset.ptabPanel;document.querySelectorAll(`[data-ptab="${pid}"]`).forEach(t=>t.classList.remove('active'));btn.classList.add('active');const panel=btn.dataset.ptabPanel;document.querySelectorAll(`[data-ptab-panel="${pid}|info"],[data-ptab-panel="${pid}|matched"],[data-ptab-panel="${pid}|partition"],[data-ptab-panel="${pid}|door"],[data-ptab-panel="${pid}|ow"],[data-ptab-panel="${pid}|notes"],[data-ptab-panel="${pid}|mail"]`).forEach(p=>{p.style.display=p.dataset.ptabPanel===`${pid}|${panel}`?'':'none'});});
function restoreProjectTabs(){state.projects.forEach(p=>{const tab=projectTabState[p.id]||'info';const btn=document.querySelector(`[data-ptab="${p.id}"][data-ptab-panel="${tab}"]`);if(btn)btn.click()})}
// Global helpers for scan.js
window.T1 = window.T1 || {};
window.T1.createItem = function(projectId, type, extraData, name) {
  const p = state.projects.find(x => x.id === projectId);
  if (!p) return false;
  p.items.push({
    id: id(),
    pair: { name: name || ('Item ' + (p.items.length + 1)), a1: null, a2: null, inventoryA1: '', inventoryA2: '', qtn: '', boq: '' },
    type: type,
    extra: extraData
  });
  save();
  return true;
};


/* === RFQ Wiki Module — appended === */
// === RFQ Wiki Module (top-level independent tab) ===
var wikiEntries = [];
try { wikiEntries = JSON.parse(localStorage.getItem('t1-wiki-entries') || '[]'); } catch(e) { wikiEntries = []; }

function wikiSave() {
  localStorage.setItem('t1-wiki-entries', JSON.stringify(wikiEntries));
  const _fs = (window.T1 || {}).firestore;
  if (_fs && _fs.ready && _fs.saveWiki) _fs.saveWiki(wikiEntries); // 雲端備份（跨設備）
}

// Migrate legacy OS category names → OVERSEA A / B (keeps old entries matching the new dropdown)
var WIKI_CATEGORY_RENAME = {'OS.PARTITION':'OVERSEA A','OS. PARTITION':'OVERSEA A','OS.DOOR':'OVERSEA B','OS. DOOR':'OVERSEA B'};
var _wikiCategoryMigrated = false;
for (var _we = 0; _we < wikiEntries.length; _we++) {
  var _oldCat = wikiEntries[_we].category;
  if (_oldCat && WIKI_CATEGORY_RENAME[_oldCat]) {
    wikiEntries[_we].category = WIKI_CATEGORY_RENAME[_oldCat];
    _wikiCategoryMigrated = true;
  }
}
if (_wikiCategoryMigrated) wikiSave();

// One-time migration: fix legacy wrong column keys.
// The old column generator produced headers A, AB, AC, … while the paste writer
// stored data under correct Excel keys A, B, C, … — so pasted cells were saved
// under keys the grid never rendered (data looked "lost"). Migrate multi-letter
// legacy keys (AB→B, AC→C, …, AZ→Z, BB→AB, …) exactly once.
if (!localStorage.getItem('t1-wiki-cols-migrated')) {
  var _colFix = {};
  for (var _cf = 0; _cf < 200; _cf++) {
    var _lg = _wikiLegacyCol(_cf);
    if (_lg.length > 1) _colFix[_lg] = _wikiColLetter(_cf);
  }
  var _colMigrated = false;
  for (var _ce2 = 0; _ce2 < wikiEntries.length; _ce2++) {
    var _tabs2 = wikiEntries[_ce2].cells || {};
    Object.keys(_tabs2).forEach(function(_tab){
      var _cs2 = _tabs2[_tab];
      var _new2 = {};
      var _ks2 = Object.keys(_cs2);
      for (var _kk2 = 0; _kk2 < _ks2.length; _kk2++) {
        var _k2 = _ks2[_kk2];
        var _mm = _k2.match(/^([A-Z]+)(\d+)$/);
        var _fix = (_mm && _colFix[_mm[1]]) ? _colFix[_mm[1]] + _mm[2] : null;
        // Legacy manual keys take precedence over the (usually empty) correct key,
        // since they are the data the user actually saw and edited.
        if (_fix) { _new2[_fix] = _cs2[_k2]; _colMigrated = true; }
        else _new2[_k2] = _cs2[_k2];
      }
      _tabs2[_tab] = _new2;
    });
  }
  if (_colMigrated) wikiSave();
  localStorage.setItem('t1-wiki-cols-migrated', '1');
}
function wikiId() { return crypto.randomUUID(); }

var wikiCurrentEntry = null;
var wikiCurrentSubTab = 'RFQ';

var WIKI_SUB_TABS = ['RFQ','BLUEBEAM','QTN','BOQ','HARDWARE','INVENTORY','PS','OP QTN','OP BOQ','OVERSEA A','OVERSEA B'];

// Range selection state
var wikiSelectAnchor = null;    // {key: "A1"} when drag starts
var wikiSelectCells = [];       // array of {key, colLetter, rowNum} currently selected
var wikiIsSelecting = false;    // true during mouse drag

function wikiRender() {
  var panel = document.getElementById('wikiContent');
  if (!panel) return;

  // Build sub-tabs bar — always show RFQ + BLUEBEAM, others conditional
  var alwaysShow = ['RFQ','BLUEBEAM'];
  var allToShow = alwaysShow.slice();
  if (wikiCurrentEntry) {
    var linked = wikiCurrentEntry.linkedTabs || [];
    for (var lt = 0; lt < linked.length; lt++) {
      if (allToShow.indexOf(linked[lt]) === -1 && WIKI_SUB_TABS.indexOf(linked[lt]) !== -1) {
        allToShow.push(linked[lt]);
      }
    }
  }
  var subBarHtml = '<div class="wiki-subtabs-bar">';
  for (var st = 0; st < allToShow.length; st++) {
    var tn = allToShow[st];
    var cls = wikiCurrentSubTab === tn ? ' active' : '';
    subBarHtml += '<button class="wiki-subtab-btn'+cls+'" data-wikitab="'+tn+'">'+tn+'</button>';
  }
  subBarHtml += '<div class="wiki-subtab-actions">' +
    '<button class="wiki-create-btn primary" type="button" id="wikiSaveCloseBtn">SAVE &amp; CLOSE</button>' +
    '<button class="wiki-cancel-btn" type="button" id="wikiViewCancelBtn">CANCEL</button>' +
    '</div>';
  subBarHtml += '</div>';

  // Content area based on which sub-tab is active
  var contentHtml = '';
  if (wikiCurrentSubTab === 'RFQ') {
    contentHtml = _wikiRfqContent();
  } else {
    contentHtml = _wikiGridContent();
  }

  panel.innerHTML = subBarHtml + contentHtml;
  _bindWikiEvents();
  // Show detail panel for current entry
  _renderWikiEntryDetail(wikiCurrentEntry);
  _clearAllSelections();
}

// --- RFQ sub-tab content (search-as-you-type dropdown + entry detail) ---
function _wikiRfqContent() {
  var cats = [
    {v:'PARTITION',l:'PARTITION'},{v:'DOOR',l:'DOOR'},{v:'OVERSEA A',l:'OVERSEA A'},
    {v:'OVERSEA B',l:'OVERSEA B'},{v:'CUTSHEET',l:'CUTSHEET'},{v:'PO',l:'PO'},{v:'PICKLIST(DO)',l:'PICKLIST(DO)'}
  ];
  var opts = '';
  for (var i = 0; i < cats.length; i++) opts += '<option value="'+cats[i].v+'">'+cats[i].l+'</option>';

  // Build dropdown entries list
  var dropdownEntries = '';
  for (var de = 0; de < wikiEntries.length; de++) {
    var ent = wikiEntries[de];
    var lkTabs = (ent.linkedTabs||[]).join(', ');
    dropdownEntries += '<div class="wiki-dd-item" data-wikidddentry="'+ent.id+'" title="'+esc(ent.title)+'"><span class="wiki-dd-item-text">'+esc(ent.title)+'<br><small style="color:#7a8896">('+esc(ent.category)+') '+lkTabs+'</small></span><button class="wiki-dd-del" type="button" data-widedel="'+ent.id+'" title="Delete">×</button></div>';
  }

  var html = '<div class="wiki-search-wrapper">' +
    '<div class="wiki-search-box">' +
      '<span class="wiki-search-icon">&#9998;</span>' +
      '<input type="text" id="wikiSearchInput" placeholder="Search Knowledge Items..." autocomplete="off">' +
    '</div>' +
    '<div class="wiki-dropdown" id="wikiDropdown">' + (wikiEntries.length ? dropdownEntries : '<div class="wiki-dd-empty">No entries yet.</div>') + '</div>' +

    // Entry detail panel
    '<div class="wiki-entry-detail" id="wikiEntryDetail" style="display:none">' +
      '<div class="wiki-detail-header"><strong class="wiki-detail-title"></strong><button class="wiki-detail-delete" data-widedel="" type="button">&#215;</button></div>' +
      '<div class="wiki-detail-category">Category: <em></em></div>' +
      '<div class="wiki-detail-remark">Remark: <em></em></div>' +
      '<div class="wiki-detail-linked-tabs">Linked tabs: <span class="wiki-linked-tab-tags"></span></div>' +
    '</div>' +
    '</div>';

  html += '<div class="wiki-level1">' +
    '<select id="wikiCategorySelect">'+opts+'</select>' +
    '<button class="wiki-add-inquiry-btn" type="button" id="wikiAddBtn">ADD NEW INQUIRY / NOTE</button>' +
    '</div>';

  html += '<form class="wiki-inquiry-form" id="wikiInquiryForm" style="display:none">' +
    '<label>Title<input name="title" required placeholder="Inquiry title"></label>' +
    '<label>Remark<textarea name="remark" placeholder="Additional notes..."></textarea></label>' +
    '<div class="wiki-link-row">' +
      '<label style="grid-column:1/-1;font-size:12px;font-weight:800;color:#3a4a5a;">Linked Tabs:</label>' +
      WIKI_SUB_TABS.map(function(t){return '<div class="wiki-checkbox-item"><input type="checkbox" name="linkTab" value="'+t+'"> '+t+' </div>'}).join('') +
    '</div>' +
    '<button type="submit" style="display:none"></button>' +
    '</form>';

  html += '</div>';
  return html;
}

// --- Other sub-tab content (editable grid) ---
function _wikiGridContent() {
  if (!wikiCurrentEntry) {
    return '<div class="wiki-grid-area"><p class="wiki-empty">No inquiry selected. Go to RFQ tab and create one.</p></div>';
  }
  var linkedTabs = wikiCurrentEntry.linkedTabs || [];
  // Only show sub-tabs that this entry has linked
  var visibleTabs = linkedTabs.filter(function(t){ return WIKI_SUB_TABS.indexOf(t) !== -1; });

  // Sub-tab buttons (only linked ones)
  var innerBar = '<div class="wiki-inner-bar">';
  for (var i = 0; i < visibleTabs.length; i++) {
    var tn = visibleTabs[i];
    var actClass = wikiCurrentSubTab === tn ? ' active' : '';
    innerBar += '<button class="wiki-inner-tab'+actClass+'" data-wikisub="'+tn+'">'+tn+'</button>';
  }
  innerBar += '</div>';

  // Grid for current sub-tab
  var activeTabName = wikiCurrentSubTab;
  var cells = (wikiCurrentEntry.cells && wikiCurrentEntry.cells[activeTabName]) || {};
  var colLetters = _getWikiCols(activeTabName);
  var maxRow = 0;
  Object.keys(cells).forEach(function(k){ var rn = parseInt(k.replace(/[A-Z]/g,''), 10); if (rn > maxRow) maxRow = rn; });
  var rows = Math.max(maxRow + 10, 10);

  var tableHtml = '<table class="wiki-grid"><thead><tr><th class="wiki-row-num">#</th>';
  for (var ci = 0; ci < colLetters.length; ci++) tableHtml += '<th class="wiki-col-header" data-colidx="'+ci+'">'+colLetters[ci]+'</th>';
  tableHtml += '</tr></thead><tbody>';

  for (var r = 1; r <= rows; r++) {
    tableHtml += '<tr><td class="wiki-row-num" data-rownum="'+r+'">'+r+'</td>';
    for (var c = 0; c < colLetters.length; c++) {
      var key = colLetters[c] + r;
      var val = cells[key] || '';
      tableHtml += '<td class="wiki-cell-editable" contenteditable="true" data-key="'+key+'" data-tab="'+activeTabName+'" data-eid="'+wikiCurrentEntry.id+'">'+val+'</td>';
    }
    tableHtml += '</tr>';
  }
  tableHtml += '</tbody></table>';
  tableHtml += '<div class="wiki-grid-controls">' +
    '<button data-wikewrite-row="'+wikiCurrentEntry.id+'" type="button">+ Row</button>' +
    '<button data-wikewrite-col="'+wikiCurrentEntry.id+'" type="button">+ Column</button>' +
    '<button id="wikiDeleteRowsBtn" type="button">Delete Rows</button>' +
    '<button id="wikiDeleteColsBtn" type="button">Delete Cols</button>' +
    '</div>';

  return '<div class="wiki-grid-area">'+innerBar+'<div data-wikipanel="'+activeTabName+'">'+tableHtml+'</div></div>';
}

// Excel-style column helpers (0-based index → A, B, …, Z, AA, AB, …)
function _wikiColLetter(index) {
  var letters = '';
  index += 1;
  while (index > 0) {
    var rem = (index - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    index = Math.floor((index - 1) / 26);
  }
  return letters;
}

// Excel-style column → 0-based index (A→0, Z→25, AA→26, AB→27)
function _wikiColIndex(colStr) {
  var idx = 0;
  for (var i = 0; i < colStr.length; i++) idx = idx * 26 + (colStr.charCodeAt(i) - 64);
  return idx - 1;
}

// Legacy (buggy) column generator that produced A, AB, AC, … — kept only for data migration
function _wikiLegacyCol(n) {
  var q = Math.floor(n / 26);
  var r = n % 26;
  return String.fromCharCode(65 + q) + (r ? String.fromCharCode(65 + r) : '');
}

function _getWikiCols(tabName) {
  if (!wikiCurrentEntry) return [];
  var cells = (wikiCurrentEntry.cells && wikiCurrentEntry.cells[tabName]) || {};
  var maxIdx = -1;
  Object.keys(cells).forEach(function(k){
    var colStr = k.replace(/[0-9]/g,'');
    var idx = _wikiColIndex(colStr);
    if (idx > maxIdx) maxIdx = idx;
  });
  var count = Math.max(maxIdx + 1, 5);
  var letters = [];
  for (var n = 0; n < count; n++) letters.push(_wikiColLetter(n));
  return letters;
}

// Render selected entry detail in the dropdown area
function _renderWikiEntryDetail(entry) {
  var detail = document.getElementById('wikiEntryDetail');
  if (!detail) return;
  if (!entry) {
    detail.style.display = 'none';
    return;
  }
  detail.style.display = '';
  detail.querySelector('.wiki-detail-title').textContent = entry.title || 'Untitled';
  var catEm = detail.querySelector('.wiki-detail-category em');
  var remEm = detail.querySelector('.wiki-detail-remark em');
  var tagSpan = detail.querySelector('.wiki-linked-tab-tags');
  var delBtn = detail.querySelector('.wiki-detail-delete');
  if (catEm) catEm.textContent = entry.category || '-';
  if (remEm) remEm.textContent = entry.remark || '(no remark)';
  if (tagSpan) {
    var tabs = entry.linkedTabs || [];
    var tagsHtml = '';
    for (var t = 0; t < tabs.length; t++) {
      tagsHtml += '<span class="wiki-linked-tab-tag">'+tabs[t]+'</span>';
    }
    tagSpan.innerHTML = tagsHtml;
  }
  if (delBtn) delBtn.dataset.widedel = entry.id;
}

function _bindWikiEvents() {
  // Document-level listeners must be bound exactly once — _bindWikiEvents runs
  // on every wikiRender, and re-adding paste/keydown/input each time stacked
  // duplicate handlers (double paste processing, double toasts).
  if (!window._wikiDocBound) {
    window._wikiDocBound = true;
    document.addEventListener('mouseup', _wikiOnMouseUp);
    document.addEventListener('keydown', _wikiOnKeyDown);
    document.addEventListener('paste', _wikiOnPaste, true);
    document.addEventListener('paste', _wikiOnPasteFallback, true);
    document.addEventListener('input', _wikiOnInput);
    document.addEventListener('copy', _wikiOnCopy);
    document.addEventListener('cut', _wikiOnCut);
  }

  // Add inquiry button → toggle form
  var addBtn = document.getElementById('wikiAddBtn');
  if (addBtn) {
    addBtn.onclick = function() {
      var form = document.getElementById('wikiInquiryForm');
      if (form) {
        form.style.display = form.style.display === 'none' ? '' : 'none';
      }
    };
  }

  // Form submit → create entry
  var form = document.getElementById('wikiInquiryForm');
  if (form) {
    form.onsubmit = function(e) {
      e.preventDefault();
      var catSel = document.getElementById('wikiCategorySelect');
      var category = catSel.value;
      if (!category) { toast('Please select a category first'); return; }

      var checkboxes = form.querySelectorAll('input[name="linkTab"]:checked');
      var linkedTabs = [];
      for (var i = 0; i < checkboxes.length; i++) linkedTabs.push(checkboxes[i].value);

      var titleInput = form.querySelector('input[name="title"]');
      var remarkInput = form.querySelector('textarea[name="remark"]');

      if (!linkedTabs.length) { toast('Please select at least one tab to link'); return; }
      if (!titleInput || !titleInput.value.trim()) { toast('Please enter a title'); return; }

      var entry = {
        id: wikiId(),
        category: category,
        title: titleInput ? titleInput.value.trim() : '',
        remark: remarkInput ? remarkInput.value.trim() : '',
        createdAt: new Date().toISOString(),
        linkedTabs: linkedTabs,
        cells: {}
      };
      for (var k = 0; k < linkedTabs.length; k++) entry.cells[linkedTabs[k]] = {};

      wikiEntries.push(entry);
      wikiSave();
      wikiCurrentEntry = entry;
      wikiCurrentSubTab = linkedTabs[0]; // switch to first linked tab
      form.style.display = 'none';
      wikiRender();
      toast('RFQ Wiki entry created');
    };
  }

  // Sub-tab bar SAVE & CLOSE / CANCEL buttons (global — visible when an entry is selected)
  var saveCloseBtn = document.getElementById('wikiSaveCloseBtn');
  if (saveCloseBtn) {
    saveCloseBtn.onclick = function() {
      var form = document.getElementById('wikiInquiryForm');
      // If the inquiry form is open, submit it (creates new entry)
      if (form && form.style.display !== 'none') {
        var submitEvent = new Event('submit', { cancelable: true });
        form.dispatchEvent(submitEvent);
        return;
      }
      // Otherwise save current entry and exit
      wikiSave();
      wikiCurrentEntry = null;
      wikiCurrentSubTab = 'RFQ';
      wikiRender();
      toast('Changes saved');
    };
  }
  var viewCancelBtn = document.getElementById('wikiViewCancelBtn');
  if (viewCancelBtn) {
    viewCancelBtn.onclick = function() {
      // If form is open, just hide it
      var form = document.getElementById('wikiInquiryForm');
      if (form && form.style.display !== 'none') {
        form.style.display = 'none';
        return;
      }
      wikiCurrentEntry = null;
      wikiCurrentSubTab = 'RFQ';
      wikiRender();
    };
  }

  // Search filter — only show dropdown when typing (not on focus)
  var searchInput = document.getElementById('wikiSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      var dd = document.getElementById('wikiDropdown');
      var q = searchInput.value.toLowerCase().trim();
      if (q) {
        if (dd) dd.classList.add('open');
      } else {
        if (dd) dd.classList.remove('open');
        // Hide all dropdown items too
        var allItems = document.querySelectorAll('.wiki-dd-item');
        for (var j = 0; j < allItems.length; j++) allItems[j].style.display = 'none';
        var emptyEl2 = document.querySelector('.wiki-dd-empty');
        if (emptyEl2) emptyEl2.style.display = 'none';
        return;
      }
      var items = document.querySelectorAll('.wiki-dd-item');
      var anyVisible = 0;
      for (var i = 0; i < items.length; i++) {
        var txt = items[i].textContent.toLowerCase();
        var show = q ? txt.indexOf(q) !== -1 : false;
        items[i].style.display = show ? '' : 'none';
        if (show) anyVisible++;
      }
      var emptyEl = document.querySelector('.wiki-dd-empty');
      if (emptyEl) emptyEl.style.display = anyVisible ? 'none' : '';
    });
  }

  // Dropdown click → select entry OR delete
  var dropdown = document.getElementById('wikiDropdown');
  if (dropdown) {
    dropdown.addEventListener('click', function(e) {
      // Handle delete button on dropdown item
      var delBtn = e.target.closest('.wiki-dd-del');
      if (delBtn) {
        e.stopPropagation();
        var eid2 = delBtn.dataset.widedel;
        wikiEntries = wikiEntries.filter(function(x){ return x.id !== eid2; });
        if (wikiCurrentEntry && wikiCurrentEntry.id === eid2) wikiCurrentEntry = null;
        wikiSave();
        wikiRender();
        toast('RFQ Wiki entry deleted');
        return;
      }

      var item = e.target.closest('.wiki-dd-item');
      if (!item) return;
      var eid = item.dataset.wikidddentry;
      var entry = null;
      for (var i = 0; i < wikiEntries.length; i++) {
        if (wikiEntries[i].id === eid) { entry = wikiEntries[i]; break; }
      }
      if (!entry) return;
      wikiCurrentEntry = entry;
      wikiCurrentSubTab = (entry.linkedTabs && entry.linkedTabs[0]) || 'BLUEBEAM';
      wikiRender();
    });
  }

  // === Wiki grid cell selection + delete ===
  var gridArea = document.querySelector('.wiki-grid-area');
  if (gridArea) {
    var tbody = gridArea.querySelector('tbody');
    var thead = gridArea.querySelector('thead');
    if (!tbody) return; // nothing to bind on

    // Mouse down on cell → start selection anchor
    gridArea.addEventListener('mousedown', function(e) {
      var td = e.target.closest('.wiki-cell-editable');
      // If clicking column header, select entire column
      if (thead && e.target.closest('.wiki-col-header')) {
        e.preventDefault();
        var th = e.target.closest('.wiki-col-header');
        var ci = parseInt(th.dataset.colidx, 10);
        var colHeaders = thead.querySelectorAll('.wiki-col-header');
        var clickedColLetter = colHeaders[ci] ? colHeaders[ci].textContent : null;
        if (!clickedColLetter) return;
        var newSel = [];
        var maxRow = 200;
        for (var rr = 1; rr <= maxRow; rr++) {
          newSel.push({ key: clickedColLetter + rr, colLetter: clickedColLetter, rowNum: rr });
        }
        if (!e.shiftKey && !e.ctrlKey) _clearAllSelections();
        wikiSelectCells = newSel;
        _highlightSelectedCells(newSel);
        wikiIsSelecting = true;
        wikiSelectAnchor = { key: clickedColLetter + '1', colLetter: clickedColLetter, rowNum: 1 };
        return;
      }
      if (!td || !wikiCurrentEntry) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        e.preventDefault();
      } else {
        // Don't prevent default — allow the cell to gain focus for editing
      }
      var key = td.dataset.key;

      if (e.shiftKey && wikiSelectAnchor) {
        var colLetters = _getWikiCols(wikiCurrentSubTab);
        var cells = _computeRangeCells(wikiSelectAnchor.key, key, colLetters);
        wikiSelectCells = cells;
        _highlightSelectedCells(cells);
      } else if (e.ctrlKey || e.metaKey) {
        var parsed = _parseCellKey(key);
        if (!parsed) return;
        var existingIdx = -1;
        for (var t = 0; t < wikiSelectCells.length; t++) {
          if (wikiSelectCells[t].key === key) { existingIdx = t; break; }
        }
        if (existingIdx >= 0) {
          wikiSelectCells.splice(existingIdx, 1);
        } else {
          wikiSelectCells.push(parsed);
        }
        _highlightSelectedCells(wikiSelectCells);
      } else {
        _clearAllSelections();
        var parsed = _parseCellKey(key);
        if (parsed) {
          wikiSelectAnchor = parsed;
          wikiSelectCells = [parsed];
          _highlightSelectedCells([parsed]);
        }
      }
      wikiIsSelecting = true;
    });

    // Mouse over tbody → drag selection
    tbody.addEventListener('mouseover', function(e) {
      if (!wikiIsSelecting || !wikiSelectAnchor) return;
      var td = e.target.closest('.wiki-cell-editable');
      if (!td) return;
      var key = td.dataset.key;
      var colLetters = _getWikiCols(wikiCurrentSubTab);
      var cells = _computeRangeCells(wikiSelectAnchor.key, key, colLetters);
      wikiSelectCells = cells;
      _highlightSelectedCells(cells);
    });

    // Mouse up ends selection (document-level, bound once — see _wikiOnMouseUp)

    // Click (non-drag) on cell: clear other handlers
    gridArea.addEventListener('click', function(e) {
      var td = e.target.closest('.wiki-cell-editable');
      if (td) return; // handled by mousedown/mouseover
      var subTab = e.target.closest('[data-wikisub]');
      if (subTab) { wikiCurrentSubTab = subTab.dataset.wikisub; wikiRender(); return; }
      var rowBtn = e.target.closest('[data-wikewrite-row]');
      if (rowBtn) { wikiAddRow(rowBtn.dataset.wikiwriteRow); return; }
      var colBtn = e.target.closest('[data-wikewrite-col]');
      if (colBtn) { wikiAddColumn(colBtn.dataset.wikiewriteCol); return; }
    });

    // Row number header click → select entire row
    tbody.addEventListener('click', function(e) {
      var rowTd = e.target.closest('.wiki-row-num');
      if (!rowTd) return;
      var rowNum = parseInt(rowTd.dataset.rownum, 10);
      // Find all editable cells in this row by querying data-rownum
      var colHeaders = gridArea.querySelector('thead .wiki-col-header');
      // Use the column count from thead
      var colCount = gridArea.querySelectorAll('thead .wiki-col-header').length;
      if (colCount === 0) return;
      var newSel = [];
      for (var c = 0; c < colCount; c++) {
        var colHeader = gridArea.querySelectorAll('thead .wiki-col-header')[c];
        var colLetter = colHeader ? colHeader.textContent : '';
        if (colLetter) {
          newSel.push({ key: colLetter + rowNum, colLetter: colLetter, rowNum: rowNum });
        }
      }
      if (!e.shiftKey && !e.ctrlKey) _clearAllSelections();
      var merged = newSel;
      if (e.ctrlKey || e.metaKey) {
        for (var m = 0; m < newSel.length; m++) {
          var found = false;
          for (var n = 0; n < wikiSelectCells.length; n++) {
            if (wikiSelectCells[n].key === newSel[m].key) { found = true; break; }
          }
          if (!found) merged.push(newSel[m]);
        }
      }
      wikiSelectCells = merged;
      _highlightSelectedCells(merged);
    });

    // Delete Rows / Delete Cols buttons
    var delRowsBtn = document.getElementById('wikiDeleteRowsBtn');
    if (delRowsBtn) {
      delRowsBtn.addEventListener('click', function(e){ e.stopPropagation(); _wikiDeleteSelectedRows(wikiCurrentEntry.id, wikiCurrentSubTab); });
    }
    var delColsBtn = document.getElementById('wikiDeleteColsBtn');
    if (delColsBtn) {
      delColsBtn.addEventListener('click', function(e){ e.stopPropagation(); _wikiDeleteSelectedColumns(wikiCurrentEntry.id, wikiCurrentSubTab); });
    }
  }



}

/* === Wiki document-level event handlers (bound exactly once) === */
var _wikiInputTimer = null;
var _wikiPasteHandled = false;

function _wikiOnMouseUp() { wikiIsSelecting = false; }

// Delete/Backspace → clear selected cells
function _wikiOnKeyDown(e) {
  if (e.key !== 'Delete' && e.key !== 'Backspace') return;
  if (!wikiCurrentEntry) return;
  if (wikiSelectCells.length === 0) return;
  e.preventDefault();
  var tabName = wikiCurrentSubTab;
  var eid = wikiCurrentEntry.id;
  for (var s = 0; s < wikiSelectCells.length; s++) {
    var item = wikiSelectCells[s];
    var el = document.querySelector('.wiki-cell-editable[data-key="'+item.key+'"][data-tab="'+tabName+'"][data-eid="'+eid+'"]');
    if (el) { el.innerHTML = ''; }
    _saveWikiCell(item.key, tabName, eid, '');
  }
  _clearAllSelections();
}

// Manual cell editing auto-save (debounced)
function _wikiOnInput(e) {
  var td = e.target.closest ? e.target.closest('.wiki-cell-editable') : null;
  if (!td) return;
  clearTimeout(_wikiInputTimer);
  _wikiInputTimer = setTimeout(function() {
    _saveWikiCell(td.dataset.key, td.dataset.tab, td.dataset.eid, td.innerHTML);
  }, 800);
}

// Parse clipboard into rows of cells (Excel HTML table first, then TSV)
function _wikiParseClipboardTable(e) {
  var allRows = [];
  var html = e.clipboardData ? e.clipboardData.getData('text/html') : '';
  if (html && html.indexOf('<table') !== -1) {
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    var table = tempDiv.querySelector('table');
    if (table) {
      var trs = table.querySelectorAll('tr');
      for (var ri = 0; ri < trs.length; ri++) {
        var tds = trs[ri].querySelectorAll('td, th');
        var rowArr = [];
        for (var ci = 0; ci < tds.length; ci++) rowArr.push(tds[ci].textContent);
        if (rowArr.length) allRows.push(rowArr);
      }
    }
  }
  if (!allRows.length) {
    var text = (e.clipboardData ? e.clipboardData.getData('text/plain') : '') || '';
    if (text.indexOf('\t') !== -1) {
      var lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
      for (var li = 0; li < lines.length; li++) {
        if (lines[li] === '') continue;
        allRows.push(lines[li].split('\t'));
      }
    }
  }
  return allRows;
}

// Paste anchor: top-left of the current selection when there is one (Excel-like),
// otherwise the cell that received the paste event.
function _wikiPasteAnchor(e, fallbackKey) {
  if (!wikiSelectCells || !wikiSelectCells.length) return fallbackKey;
  var colLetters = _getWikiCols(wikiCurrentSubTab);
  var minCi = Infinity, minRow = Infinity;
  for (var s = 0; s < wikiSelectCells.length; s++) {
    var ci = colLetters.indexOf(wikiSelectCells[s].colLetter);
    if (ci === -1) continue;
    if (ci < minCi) minCi = ci;
    if (wikiSelectCells[s].rowNum < minRow) minRow = wikiSelectCells[s].rowNum;
  }
  if (minCi === Infinity || minRow === Infinity) return fallbackKey;
  return colLetters[minCi] + minRow;
}

// Write parsed rows into entry.cells starting at startKey, save, re-render and
// highlight the pasted region.
function _wikiApplyPasteRows(allRows, startKey) {
  if (!startKey || !wikiCurrentEntry) return;
  var startParsed = _parseCellKey(startKey);
  if (!startParsed) return;
  var startColIdx = _wikiColIndex(startParsed.colLetter);
  var startRow = startParsed.rowNum;
  var tabName = wikiCurrentSubTab;
  var eid = wikiCurrentEntry.id;
  var entry = _findWikiEntry(eid);
  if (!entry) return;
  if (!entry.cells[tabName]) entry.cells[tabName] = {};

  var maxCols = 1;
  for (var ri = 0; ri < allRows.length; ri++) {
    var cols = allRows[ri];
    if (cols.length > maxCols) maxCols = cols.length;
    for (var ci = 0; ci < cols.length; ci++) {
      entry.cells[tabName][_wikiColLetter(startColIdx + ci) + (startRow + ri)] = cols[ci];
    }
  }
  wikiSave();
  wikiRender();

  // Highlight the freshly pasted region (Excel-like feedback)
  var newSel = [];
  for (var hr = 0; hr < allRows.length; hr++) {
    for (var hc = 0; hc < maxCols; hc++) {
      var hCol = _wikiColLetter(startColIdx + hc);
      newSel.push({ key: hCol + (startRow + hr), colLetter: hCol, rowNum: startRow + hr });
    }
  }
  wikiSelectCells = newSel;
  _highlightSelectedCells(newSel);
  toast('Pasted ' + allRows.length + '×' + maxCols + ' cells');
}

// Paste — capture phase (intercepts before the contenteditable default)
function _wikiOnPaste(e) {
  if (_wikiPasteHandled) { _wikiPasteHandled = false; return; }
  var td = e.target.closest ? e.target.closest('.wiki-cell-editable') : null;
  var inWiki = e.target.closest ? !!e.target.closest('#wikiContent') : false;
  var hasSel = wikiSelectCells && wikiSelectCells.length > 0;
  if (!td && !(hasSel && inWiki)) return;

  // Image paste (only into a cell)
  if (td) {
    var items = e.clipboardData ? (e.clipboardData.items || []) : [];
    for (var i2 = 0; i2 < items.length; i2++) {
      if (items[i2].type.indexOf('image/') === 0) {
        e.preventDefault();
        _wikiPasteHandled = true;
        var blob = items[i2].getAsFile();
        var reader = new FileReader();
        reader.onload = function(ev) {
          td.innerHTML = '<img src="'+ev.target.result+'" style="max-width:100%;max-height:200px;display:block">';
          _saveWikiCell(td.dataset.key, td.dataset.tab, td.dataset.eid, td.innerHTML);
        };
        reader.readAsDataURL(blob);
        return;
      }
    }
  }

  // Excel / Sheets tabular data (HTML table or TSV)
  var allRows = _wikiParseClipboardTable(e);
  if (!allRows.length) return;

  e.preventDefault();
  e.stopPropagation();
  _wikiPasteHandled = true;

  // Detach the focused cell so the browser does not also insert raw text
  if (td) td.contentEditable = 'false';
  if (document.activeElement && document.activeElement.closest && document.activeElement.closest('.wiki-cell-editable')) {
    document.activeElement.blur();
  }

  _wikiApplyPasteRows(allRows, _wikiPasteAnchor(e, td ? td.dataset.key : null));
}

// Fallback paste — second chance if the primary handler bailed out
function _wikiOnPasteFallback(e) {
  if (_wikiPasteHandled) { _wikiPasteHandled = false; return; }
  var td = e.target.closest ? e.target.closest('.wiki-cell-editable') : null;
  var inWiki = e.target.closest ? !!e.target.closest('#wikiContent') : false;
  var hasSel = wikiSelectCells && wikiSelectCells.length > 0;
  if (!td && !(hasSel && inWiki)) return;
  var text = (e.clipboardData ? e.clipboardData.getData('text/plain') : '') || '';
  if (text.indexOf('\t') === -1) return;
  var allRows = [];
  var lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
  for (var li = 0; li < lines.length; li++) {
    if (lines[li] === '') continue;
    allRows.push(lines[li].split('\t'));
  }
  if (!allRows.length) return;
  e.preventDefault();
  e.stopPropagation();
  _wikiPasteHandled = true;
  _wikiApplyPasteRows(allRows, _wikiPasteAnchor(e, td ? td.dataset.key : null));
}

// Copy — multi-cell selection is emitted as TSV + HTML table so Excel/Sheets
// pastes it back as separate cells. Single cell falls through to the default.
function _wikiOnCopy(e) {
  if (!wikiCurrentEntry || !wikiSelectCells || wikiSelectCells.length < 2) return;
  if (!e.target.closest || !e.target.closest('#wikiContent')) return;
  var colLetters = _getWikiCols(wikiCurrentSubTab);
  var minCi = Infinity, maxCi = -1, minRow = Infinity, maxRow = -1;
  for (var s = 0; s < wikiSelectCells.length; s++) {
    var ci = colLetters.indexOf(wikiSelectCells[s].colLetter);
    if (ci === -1) continue;
    if (ci < minCi) minCi = ci;
    if (ci > maxCi) maxCi = ci;
    if (wikiSelectCells[s].rowNum < minRow) minRow = wikiSelectCells[s].rowNum;
    if (wikiSelectCells[s].rowNum > maxRow) maxRow = wikiSelectCells[s].rowNum;
  }
  if (minCi === Infinity) return;
  var cells = (wikiCurrentEntry.cells && wikiCurrentEntry.cells[wikiCurrentSubTab]) || {};
  var tsvRows = [];
  var htmlRows = [];
  for (var r = minRow; r <= maxRow; r++) {
    var tsvCells = [];
    var htmlCells = [];
    for (var c = minCi; c <= maxCi; c++) {
      var key = colLetters[c] + r;
      var v = cells[key] || '';
      tsvCells.push(String(v).replace(/\r\n/g, '\n'));
      htmlCells.push('<td>' + esc(v) + '</td>');
    }
    tsvRows.push(tsvCells.join('\t'));
    htmlRows.push('<tr>' + htmlCells.join('') + '</tr>');
  }
  e.preventDefault();
  e.clipboardData.setData('text/plain', tsvRows.join('\r\n'));
  e.clipboardData.setData('text/html', '<table><tbody>' + htmlRows.join('') + '</tbody></table>');
}

// Cut — copy the selection then clear the source cells
function _wikiOnCut(e) {
  if (!wikiCurrentEntry || !wikiSelectCells || wikiSelectCells.length < 2) return;
  if (!e.target.closest || !e.target.closest('#wikiContent')) return;
  _wikiOnCopy(e);
  var count = wikiSelectCells.length;
  var tabName = wikiCurrentSubTab;
  var eid = wikiCurrentEntry.id;
  for (var s = 0; s < wikiSelectCells.length; s++) {
    _saveWikiCell(wikiSelectCells[s].key, tabName, eid, '');
  }
  _clearAllSelections();
  wikiRender();
  toast('Cut ' + count + ' cells');
}

function _saveWikiCell(cellKey, tabName, entryId, value) {
  var entry = _findWikiEntry(entryId);
  if (!entry) return;
  if (!entry.cells[tabName]) entry.cells[tabName] = {};
  entry.cells[tabName][cellKey] = value;
  wikiSave();
}

function _findWikiEntry(entryId) {
  for (var i = 0; i < wikiEntries.length; i++) {
    if (wikiEntries[i].id === entryId) return wikiEntries[i];
  }
  return null;
}

function _parseCellKey(key) {
  var m = key.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { key: key, colLetter: m[1], rowNum: parseInt(m[2], 10) };
}

function _computeRangeCells(startKey, endKey, colLetters) {
  var start = _parseCellKey(startKey);
  var end = _parseCellKey(endKey);
  if (!start || !end) return [];
  var c1 = colLetters.indexOf(start.colLetter);
  var c2 = colLetters.indexOf(end.colLetter);
  if (c1 === -1 || c2 === -1) return [];
  var minCol = Math.min(c1, c2);
  var maxCol = Math.max(c1, c2);
  var minRow = Math.min(start.rowNum, end.rowNum);
  var maxRow = Math.max(start.rowNum, end.rowNum);
  var result = [];
  for (var r = minRow; r <= maxRow; r++) {
    for (var c = minCol; c <= maxCol; c++) {
      var k = colLetters[c] + r;
      result.push({ key: k, colLetter: colLetters[c], rowNum: r });
    }
  }
  return result;
}

function _highlightSelectedCells(cells) {
  var old = document.querySelectorAll('.wiki-cell-editable.wiki-cell-selected');
  for (var i = 0; i < old.length; i++) old[i].classList.remove('wiki-cell-selected');
  var eid = wikiCurrentEntry ? wikiCurrentEntry.id : '';
  var tabName = wikiCurrentSubTab;
  for (var j = 0; j < cells.length; j++) {
    var el = document.querySelector(
      '.wiki-cell-editable[data-key="'+cells[j].key+'"][data-tab="'+tabName+'"][data-eid="'+eid+'"]'
    );
    if (el) el.classList.add('wiki-cell-selected');
  }
}

function _clearAllSelections() {
  var old = document.querySelectorAll('.wiki-cell-editable.wiki-cell-selected');
  for (var i = 0; i < old.length; i++) old[i].classList.remove('wiki-cell-selected');
  wikiSelectCells = [];
  wikiSelectAnchor = null;
  wikiIsSelecting = false;
}

function wikiAddRow(entryId) {
  var entry = null;
  for (var i = 0; i < wikiEntries.length; i++) {
    if (wikiEntries[i].id === entryId) { entry = wikiEntries[i]; break; }
  }
  if (!entry) return;
  var tabs = entry.linkedTabs || [];
  for (var t = 0; t < tabs.length; t++) {
    var cells = entry.cells[tabs[t]] || {};
    var maxRow = 0;
    Object.keys(cells).forEach(function(key){
      var rowNum = parseInt(key.replace(/[A-Z]/g,''), 10);
      if (rowNum > maxRow) maxRow = rowNum;
    });
    var colLetters = _getWikiCols(tabs[t]);
    var newRow = maxRow + 1;
    for (var c = 0; c < colLetters.length; c++) {
      cells[colLetters[c] + newRow] = '';
    }
    entry.cells[tabs[t]] = cells;
  }
  wikiSave();
  wikiRender();
}

function wikiAddColumn(entryId) {
  var entry = null;
  for (var i = 0; i < wikiEntries.length; i++) {
    if (wikiEntries[i].id === entryId) { entry = wikiEntries[i]; break; }
  }
  if (!entry) return;
  var tabs = entry.linkedTabs || [];
  for (var t = 0; t < tabs.length; t++) {
    var cells = entry.cells[tabs[t]] || {};
    var currentCols = _getWikiCols(tabs[t]);
    var newColLetter = _wikiColLetter(currentCols.length);

    var maxRow = 0;
    Object.keys(cells).forEach(function(key){
      var rowNum = parseInt(key.replace(/[A-Z]/g,''), 10);
      if (rowNum > maxRow) maxRow = rowNum;
    });
    for (var row = 1; row <= maxRow; row++) {
      cells[newColLetter + row] = '';
    }
    entry.cells[tabs[t]] = cells;
  }
  wikiSave();
  wikiRender();
}

// --- Delete selected rows and columns ---
function _wikiDeleteSelectedRows(entryId, tabName) {
  var entry = _findWikiEntry(entryId);
  if (!entry || !entry.cells[tabName]) return;
  var cells = entry.cells[tabName];
  // Collect unique row numbers from selection
  var rowSet = {};
  for (var s = 0; s < wikiSelectCells.length; s++) {
    var rn = wikiSelectCells[s].rowNum;
    rowSet[rn] = true;
  }
  // Remove all cells belonging to selected rows
  Object.keys(cells).forEach(function(key){
    var rowNum = parseInt(key.replace(/[A-Z]/g,''), 10);
    if (rowSet[rowNum]) delete cells[key];
  });
  _clearAllSelections();
  wikiSave();
  wikiRender();
}

function _wikiDeleteSelectedColumns(entryId, tabName) {
  var entry = _findWikiEntry(entryId);
  if (!entry || !entry.cells[tabName]) return;
  var cells = entry.cells[tabName];
  // Collect unique column letters from selection
  var colSet = {};
  for (var s2 = 0; s2 < wikiSelectCells.length; s2++) {
    colSet[wikiSelectCells[s2].colLetter] = true;
  }
  // Remove all cells belonging to selected columns
  Object.keys(cells).forEach(function(key){
    var m = key.match(/^([A-Z]+)/);
    if (m && colSet[m[1]]) delete cells[key];
  });
  _clearAllSelections();
  wikiSave();
  wikiRender();
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(wikiRender, 600); });
} else {
  setTimeout(wikiRender, 600);
}

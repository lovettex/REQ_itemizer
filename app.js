const groups = [
  ['Glass frame',1,['GF - 1','GF - 2','GF - 3','GF - 4','GF - 5','GF - 6','GF - 7','GF - 8']],['Glass frame',2,['GF - 9','GF - 10','GF - 11','GF - 12','GF - 13']],['Glass frame',3,['GF - A','GF - B','GF - C','GF - D','GF - E','GF - F','GF - G','GF - H','GF - I']],['Glass frame',4,['GF - J','GF - K','GF - L','GF - M','GF - N','GF - O','GF - P','GF - Q']],
  ['Swing door frame',5,['SWING DF - A','SWING DF - B','SWING DF - C','SWING DF - D','SWING DF - E','SWING DF - F','SWING DF - G','SWING DF - H','SWING DF - I']],['Swing door frame',6,['SWING DF - J','SWING DF - K','SWING DF - L','SWING DF - M','SWING DF - N']],
  ['Swing door panel',7,['SWING DP - A1','SWING DP - A2','SWING DP - B1','SWING DP - B2','SWING DP - E']],['Swing door panel',8,['SWING DP - A3']],['Swing door panel',9,['SWING DP - C1','SWING DP - C2','SWING DP - D1']],['Swing door panel',11,['SWING DP - E']],
  ['Transom',12,['TS - 1','TS - 2','TS - 3','TS - 4','TS - 5','TS - 6']],['Transom',13,['TS - 1A','TS - 2A','TS - 3A']],['Mullion',14,['MU - 1','MU - 2','MU - 3','MU - 4','MU - 5','MU - 6','MU - 7','MU - 8']],['Mullion',15,['MU - 1','MU - 2','MU - 3','MU - 4','MU - 5','MU - 6']],
  ['Power column',16,['PC - 1','PC - 2','PC - 3','PC - 4','PC - 5','PC - 6','PC - 7','PC - 8','PC - 9']],['Square post',17,['SP - 1','SP - 2','SP - 3','SP - 4']],['Sliding door panel',18,['DP - 1','DP - 2','DP - 3','DP - 4','SLIDE DP - 5']],['Sliding door frame',19,['DF - 1','DF - 2','SLIDE DF - 3','DF - 4','SLIDE DF - 5']],
  ['Sliding door vertical',20,['DP-V A1','DP-V A2S','DP-V A3S','DP-V B1','DP-V B3S','DP-V C1','DP-V C2']],['Sliding door vertical',21,['DP-V C3','DP-V D1S','DP-V D2']],['Sliding door vertical',23,['DP-V A1','DP-V A2','DP-V A3','DP-V A4','DP-V A5']]
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
const categories = ['全部', ...new Set(products.map(x => x.category))];
const $ = id => document.getElementById(id);
const state = {query:'',category:'全部',a1:null,a2:null,inventoryA1:'',inventoryA2:'',pairs:read('t1-product-pairs'),projects:read('t1-projects')};
function read(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}}
function save(){localStorage.setItem('t1-product-pairs',JSON.stringify(state.pairs));localStorage.setItem('t1-projects',JSON.stringify(state.projects))}
function esc(s){return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function id(){return crypto.randomUUID()}
function inventoryOptions(){return (window.inventoryDescriptions||[]).map(d=>`<option value="${esc(d)}"></option>`).join('')}
function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200)}

function renderFilters(){ $('filters').innerHTML=categories.map(x=>`<button class="filter ${state.category===x?'active':''}" data-cat="${esc(x)}">${esc(x)}</button>`).join('');document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{state.category=b.dataset.cat;renderFilters();renderResults()}) }
function renderResults(){const q=state.query.toLowerCase().replace(/\s/g,'');const shown=products.filter(p=>(state.category==='全部'||p.category===state.category)&&(`${p.code}${p.category}`.toLowerCase().replace(/\s/g,'').includes(q)));$('resultCount').textContent=`${shown.length} 項結果`;$('empty').hidden=shown.length>0;$('results').innerHTML=shown.map((p,n)=>`<article class="card"><img src="${p.image}" alt="${esc(p.code)}" data-view="${products.indexOf(p)}" loading="${n>8?'lazy':'eager'}"><div class="card-body"><div class="code">${esc(p.code)}</div><div class="meta">${esc(p.category)} · 圖紙第 ${p.page} 頁</div><div class="actions"><button data-assign="a1" data-product="${products.indexOf(p)}">設為 A1</button><button data-assign="a2" data-product="${products.indexOf(p)}">設為 A2</button></div></div></article>`).join('');document.querySelectorAll('[data-view]').forEach(x=>x.onclick=()=>openViewer(products[x.dataset.view]));document.querySelectorAll('[data-assign]').forEach(x=>x.onclick=()=>{state[x.dataset.assign]=products[x.dataset.product];renderSlots();toast(`已設定為 ${x.dataset.assign.toUpperCase()}`)})}
function slotHtml(slot){const p=state[slot];if(!p)return `<div class="slot-label">ITEM ${slot.toUpperCase()}</div>從左側結果選擇「設為 ${slot.toUpperCase()}」`;return `<div class="slot-label">ITEM ${slot.toUpperCase()}</div><img src="${p.image}" alt=""><strong>${esc(p.code)}</strong><br><span class="meta">${esc(p.category)} · 第 ${p.page} 頁</span><br><button data-remove="${slot}">移除此項</button>`}
function renderSlots(){['a1','a2'].forEach(slot=>{const el=$(slot==='a1'?'slotA1':'slotA2');el.className=`slot ${state[slot]?'filled':''}`;el.innerHTML=slotHtml(slot)});$('inventoryOptions').innerHTML=inventoryOptions();$('inventoryA1').value=state.inventoryA1;$('inventoryA2').value=state.inventoryA2;$('savePair').disabled=!(state.a1&&state.a2);document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state[b.dataset.remove]=null;renderSlots()})}
const viewer={img:null,container:null,scale:1,tx:0,ty:0,iw:0,ih:0,cw:0,ch:0,panning:false,panSX:0,panSY:0,panTX:0,panTY:0,target:null};function viewerUpdate(a){if(!viewer.img)return;viewer.img.style.transition=a?'transform .45s cubic-bezier(.22,.61,.36,1)':'none';viewer.img.style.transform=`translate(${viewer.tx}px,${viewer.ty}px) scale(${viewer.scale})`}function viewerLabel(){const el=$('viewerZoomLevel');if(el)el.textContent=Math.round(viewer.scale*100)+'%'}function viewerShowRefocus(v){const btn=$('viewerRefocus');if(btn)btn.style.display=v?'':'none'}function viewerFit(anim){if(!viewer.iw||!viewer.ih)return;const s=Math.min(viewer.cw/viewer.iw,viewer.ch/viewer.ih);viewer.scale=s;viewer.tx=(viewer.cw-viewer.iw*s)/2;viewer.ty=(viewer.ch-viewer.ih*s)/2;viewer.target=null;viewerShowRefocus(false);viewerUpdate(anim);viewerLabel()}function viewerFocus(p,anim){if(!viewer.iw||!viewer.ih||!p||!p.pos)return;const pos=p.pos;const s=Math.min(viewer.cw*.8/(viewer.iw*pos.w),viewer.ch*.8/(viewer.ih*pos.h));const sc=Math.max(.35,Math.min(8,s));const cx=(pos.x+pos.w/2)*viewer.iw*sc;const cy=(pos.y+pos.h/2)*viewer.ih*sc;viewer.scale=sc;viewer.tx=viewer.cw/2-cx;viewer.ty=viewer.ch/2-cy;viewer.target=p;viewerShowRefocus(true);viewerUpdate(anim);viewerLabel()}function viewerZoomAt(mx,my,delta){const ns=Math.max(.35,Math.min(8,viewer.scale*(1+delta*.15)));viewer.tx=mx-(mx-viewer.tx)*(ns/viewer.scale);viewer.ty=my-(my-viewer.ty)*(ns/viewer.scale);viewer.scale=ns;viewerUpdate(false);viewerLabel()}function viewerSyncSize(){viewer.cw=viewer.container.clientWidth;viewer.ch=viewer.container.clientHeight;if(viewer.img&&viewer.img.complete&&viewer.img.naturalWidth){viewer.iw=viewer.img.naturalWidth;viewer.ih=viewer.img.naturalHeight;viewer.target?viewerFocus(viewer.target,false):viewerFit(false)}}function initViewer(){viewer.img=$('viewerImage');viewer.container=$('viewerContainer');if(!viewer.img||!viewer.container)return;viewer.container.addEventListener('wheel',e=>{e.preventDefault();const r=viewer.container.getBoundingClientRect();viewerZoomAt(e.clientX-r.left,e.clientY-r.top,-Math.sign(e.deltaY))},{passive:false});viewer.container.addEventListener('mousedown',e=>{if(e.button!==0)return;viewer.panning=true;viewer.panSX=e.clientX;viewer.panSY=e.clientY;viewer.panTX=viewer.tx;viewer.panTY=viewer.ty;viewer.container.classList.add('grabbing')});window.addEventListener('mousemove',e=>{if(!viewer.panning)return;viewer.tx=viewer.panTX+(e.clientX-viewer.panSX);viewer.ty=viewer.panTY+(e.clientY-viewer.panSY);viewerUpdate(false)});window.addEventListener('mouseup',()=>{viewer.panning=false;viewer.container.classList.remove('grabbing')});viewer.container.addEventListener('dblclick',()=>{viewer.target?viewerFocus(viewer.target,true):viewerFit(true)});new ResizeObserver(()=>viewerSyncSize()).observe(viewer.container);$('viewerToolbar').addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;const id=btn.id;if(id==='viewerZoomIn'){const cx=viewer.cw/2,cy=viewer.ch/2;viewerZoomAt(cx,cy,1)}else if(id==='viewerZoomOut'){const cx=viewer.cw/2,cy=viewer.ch/2;viewerZoomAt(cx,cy,-1)}else if(id==='viewerReset'){viewerFit(true)}else if(id==='viewerRefocus'){if(viewer.target)viewerFocus(viewer.target,true)}else if(id==='closeViewer'){$('viewer').close()}});$('viewer').addEventListener('close',()=>{viewer.target=null;viewerShowRefocus(false)})}
function openViewer(p){$('viewerTitle').textContent=`${p.code} · ${p.category}`;$('viewerInfo').textContent=`第 ${p.page} 頁 · ${p.category}｜滾輪縮放｜拖曳平移｜雙擊聚焦/全頁`;viewer.target=p;viewerShowRefocus(true);viewer.img.onload=null;viewer.img.onerror=null;const img=new Image();img.onload=()=>{viewer.iw=img.naturalWidth;viewer.ih=img.naturalHeight;viewer.cw=viewer.container.clientWidth;viewer.ch=viewer.container.clientHeight;const s=Math.min(viewer.cw/viewer.iw,viewer.ch/viewer.ih);viewer.scale=s;viewer.tx=(viewer.cw-viewer.iw*s)/2;viewer.ty=(viewer.ch-viewer.ih*s)/2;viewerLabel();viewerUpdate(false);viewer.img.src=img.src;requestAnimationFrame(()=>requestAnimationFrame(()=>viewerFocus(p,true)))};img.onerror=()=>{viewer.target=null;viewerShowRefocus(false);toast('無法載入圖面')};img.src=p.image;$('viewer').showModal()}

function descriptionLine(pair){let html=`A1 · ${esc(pair.a1.code)}${pair.inventoryA1?` (${esc(pair.inventoryA1)})`:''}<br>A2 · ${esc(pair.a2.code)}${pair.inventoryA2?` (${esc(pair.inventoryA2)})`:''}`;if(pair.qtn)html+=`<br>QTN · ${esc(pair.qtn)}`;if(pair.boq)html+=`<br>BOQ · ${esc(pair.boq)}`;return html}
function projectOptions(){return `<option value="">選擇 Project</option>${state.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}`}
function renderPairs(){const pageSize=10;let page=renderPairs._page||1;const sorted=[...state.pairs].sort((a,b)=>{const da=a.createdAt||'',db=b.createdAt||'';return da<db?1:da>db?-1:0});const total=state.pairs.length,totalPages=Math.max(1,Math.ceil(total/pageSize));if(page>totalPages)page=totalPages;renderPairs._page=page;const start=(page-1)*pageSize,end=Math.min(start+pageSize,total),pageItems=sorted.slice(start,end);$('savedCount').textContent=total?`${total} 組`:'';$('savedPairs').innerHTML=total?pageItems.map(pair=>`<div class="saved-item"><div class="saved-title">${esc(pair.name)}</div><div class="saved-desc">${descriptionLine(pair)}</div><div class="saved-options"><button data-pair-view="a1" data-pair="${pair.id}">放大 A1 圖面</button><button data-pair-view="a2" data-pair="${pair.id}">放大 A2 圖面</button><button data-pair-delete="${pair.id}">刪除配對</button></div><div class="copy-row"><select data-project-for="${pair.id}">${projectOptions()}</select><button data-copy="${pair.id}">複製到 Project</button></div></div>`).join(''):'<div class="saved-empty">尚未儲存配對。</div>';const pg=$('savedPagination');if(total<=pageSize){pg.innerHTML='';return}let btns='';for(let i=1;i<=totalPages;i++){btns+=`<button class="pg-btn ${i===page?'pg-active':''}" data-page="${i}">${i}</button>`}pg.innerHTML=btns;pg.querySelectorAll('.pg-btn').forEach(b=>b.addEventListener('click',()=>{renderPairs._page=parseInt(b.dataset.page);renderPairs()}))}

function projectInputs(p){return `<form class="project-form project-edit" data-project-edit="${p.id}"><label>Project<input name="name" required value="${esc(p.name)}"></label><label>Sales<input name="sales" list="salesList" autocomplete="off" value="${esc(p.sales||'')}" placeholder="選擇或輸入 Sales"></label><datalist id="salesList"><option value="Glen Tew"><option value="Gerry Lee"><option value="Eugene Ng"><option value="Jim Lim"><option value="Kelvin Tjia"><option value="Benjamin Seng"><option value="Lim Zhi Kang Louis"><option value="Bella"><option value="Jensen"><option value="Rayven Leong"><option value="Zac Lee"><option value="Naomi"></datalist><label>案件等級<select name="priority" data-priority-select><option value="">選擇等級</option><option value="REGULAR" ${p.priority==='REGULAR'?'selected':''}>REGULAR</option><option value="URGENT" ${p.priority==='URGENT'?'selected':''}>URGENT</option><option value="CERTAIN DEADLINE" ${p.priority==='CERTAIN DEADLINE'?'selected':''}>CERTAIN DEADLINE</option></select></label><label class="deadline-label" style="${p.priority==='CERTAIN DEADLINE'?'':'display:none'}">Deadline<input name="deadline" type="date" value="${esc(p.deadline||'')}" data-deadline-input></label><label>Address<input name="address" value="${esc(p.address)}"></label><label>Tenderer 1<input name="tenderer" value="${esc(p.tenderer)}"></label><label>Attn<input name="attn" value="${esc(p.attn)}"></label><label>Tel<input name="tel" value="${esc(p.tel)}"></label><label>Email<input name="email" type="email" value="${esc(p.email)}"></label><label>Mobile<input name="mobile" value="${esc(p.mobile)}"></label><label>Fax<input name="fax" value="${esc(p.fax)}"></label><button class="primary" type="submit">儲存修改</button></form>`}
const extraFields={PARTITION:[['legend','LEGEND'],['finishes','FINISHES'],['height','HEIGHT'],['transom','TRANSOM'],['mullion','MULLION'],['sizePc','SIZE PC'],['remark','REMARK IF ANY']],DOOR:[['legend','LEGEND'],['finishes','FINISHES'],['height','HEIGHT'],['noOfLeaf','NO OF LEAF'],['transom','TRANSOM'],['mullion','MULLION'],['hardware','HARDWARE'],['doorCloser','DOOR CLOSER'],['hwFinishes','HW FINISHES'],['remark','REMARK IF ANY']],OPERABLE_WALL:[['legend','LEGEND (Manual)'],['finishes','FINISHES'],['height','HEIGHT'],['type','TYPE'],['operate','OPERATE'],['country','COUNTRY'],['hwFinishes','HW FINISHES'],['remark','REMARK IF ANY']]};
function itemExtraSummary(item){const type=item.type||'',extra=item.extra||{};if(!type)return '<span class="item-type-badge none">尚未設定類別</span>';const badge=type==='OPERABLE_WALL'?'<span class="item-type-badge operable-wall">OW</span>':`<span class="item-type-badge ${type==='PARTITION'?'partition':'door'}">${type}</span>`;return `<span class="item-extra-summary">${badge} ${(extraFields[type]||[]).map(([key,label])=>`<span class="extra-kv"><em>${label}:</em> <strong>${esc(extra[key]||'—')}</strong></span>`).join(' ')}</span>`}
function itemExtraBody(project,item){const type=item.type||'',extra=item.extra||{};const formKey=`${project.id}|${item.id}`;if(type==='OPERABLE_WALL'){const fields=(extraFields.OPERABLE_WALL||[]).map(([key,label])=>`<label><span>${label}</span>${key==='remark'?`<textarea name="${key}">${esc(extra[key])}</textarea>`:`<input name="${key}" value="${esc(extra[key])}">`}</label>`).join('');return `<div class="extra-body"><div class="extra-fields">${fields}</div><button class="primary" type="submit">儲存項目資料</button></div>`}const isPartition=type==='PARTITION';if(!type)return `<div class="extra-body"><div class="type-tabs"><button class="type-tab partition" data-set-type="${formKey}|PARTITION">PARTITION</button><button class="type-tab door" data-set-type="${formKey}|DOOR">DOOR</button></div></div>`;const fields=(extraFields[type]||[]).map(([key,label])=>`<label><span>${label}</span>${key==='remark'?`<textarea name="${key}">${esc(extra[key])}</textarea>`:`<input name="${key}" value="${esc(extra[key])}">`}</label>`).join('');return `<div class="extra-body"><div class="type-tabs"><button class="type-tab partition ${isPartition?'active':''}" data-set-type="${formKey}|PARTITION">PARTITION</button><button class="type-tab door ${!isPartition?'active':''}" data-set-type="${formKey}|DOOR">DOOR</button></div><div class="extra-fields">${fields}</div><button class="primary" type="submit">儲存項目資料</button></div>`}
function renderProjects(){state.projects.forEach(p=>p.items=Array.isArray(p.items)?p.items:[]);$('projectCount').textContent=state.projects.length?`(${state.projects.length})`:'';const openIds=new Set();document.querySelectorAll('.project-card[open]').forEach(el=>{const pid=el.dataset.projectCard;if(pid)openIds.add(pid)});$('projectList').innerHTML=state.projects.length?state.projects.map(p=>`<details class="project-card" ${openIds.has(p.id)?'open':''} data-project-card="${p.id}"><summary${p.priority==='URGENT'&&p.status!=='Completed'?' style="background:#b2fc58;color:#000"':''}><span>${esc(p.name)}<span class="pc-count">${p.items.length} 項配對</span></span><span class="pc-qs"><select class="assign-qs-select" data-assign-qs="${p.id}"><option value="">QS</option><option value="Ben" ${p.assignedQs==='Ben'?'selected':''}>Ben</option><option value="Mary" ${p.assignedQs==='Mary'?'selected':''}>Mary</option><option value="Bella" ${p.assignedQs==='Bella'?'selected':''}>Bella</option><option value="Shih Min" ${p.assignedQs==='Shih Min'?'selected':''}>Shih Min</option></select><select class="assign-status-select" data-assign-status="${p.id}"><option value="">Status</option><option value="Pending info" ${p.status==='Pending info'?'selected':''}>Pending info</option><option value="Pending supplier quote" ${p.status==='Pending supplier quote'?'selected':''}>Pending supplier quote</option><option value="On the queue" ${p.status==='On the queue'?'selected':''}>On the queue</option><option value="Processing" ${p.status==='Processing'?'selected':''}>Processing</option><option value="Double check" ${p.status==='Double check'?'selected':''}>Double check</option><option value="Completed" ${p.status==='Completed'?'selected':''}>Completed</option><option value="On hold" ${p.status==='On hold'?'selected':''}>On hold</option></select></span></summary><div class="project-detail">
<div class="p-inner-tabs"><button class="p-inner-tab active" data-ptab="${p.id}" data-ptab-panel="info">基本資料</button><button class="p-inner-tab" data-ptab="${p.id}" data-ptab-panel="items">需求資訊</button></div>
<div class="p-inner-panel" data-ptab-panel="${p.id}|info">
${projectInputs(p)}<div class="project-info"><div>Sales: ${esc(p.sales||'-')}</div><div>等級: ${esc(p.priority||'-')}</div>${p.deadline?`<div>Deadline: ${esc(p.deadline)}</div>`:''}<div>QS: ${esc(p.assignedQs||'-')}</div><div>Status: ${esc(p.status||'-')}</div><div>Address: ${esc(p.address||'-')}</div><div>Tenderer: ${esc(p.tenderer||'-')}</div><div>Attn: ${esc(p.attn||'-')}</div><div>Tel: ${esc(p.tel||'-')}</div><div>Email: ${esc(p.email||'-')}</div><div>Mobile: ${esc(p.mobile||'-')}</div><div>Fax: ${esc(p.fax||'-')}</div></div></div>
<div class="p-inner-panel" data-ptab-panel="${p.id}|items" style="display:none">
${p.items.length?p.items.map((item,i)=>`<div class="project-item"><strong>${esc(item.pair.name)}</strong><br>${descriptionLine(item.pair)}<br><button data-up="${p.id}|${item.id}" ${i===0?'disabled':''}>上移</button><button data-down="${p.id}|${item.id}" ${i===p.items.length-1?'disabled':''}>下移</button><button class="project-delete" data-item-delete="${p.id}|${item.id}">刪除此項</button><button class="item-edit-btn" data-item-edit="${p.id}|${item.id}">${item.type?'編輯資料':'設定類別'}</button><div class="item-extra-display" data-item-summary="${p.id}|${item.id}">${itemExtraSummary(item)}</div><form class="project-extra" data-item-extra-key="${p.id}|${item.id}" style="display:none">${itemExtraBody(p,item)}</form></div>`).join(''):'<div class="project-empty">尚未加入配對。</div>'}</div>
<button class="project-delete" data-project-delete="${p.id}">刪除 Project</button></div></details>`).join(''):'<div class="project-empty">尚未儲存 Project。</div>';document.querySelectorAll('[data-project-edit]').forEach(form=>form.onsubmit=e=>{e.preventDefault();const p=state.projects.find(x=>x.id===form.dataset.projectEdit),f=new FormData(form);['name','sales','priority','deadline','address','tenderer','attn','tel','email','mobile','fax'].forEach(k=>{p[k]=f.get(k);if(k==='deadline'&&p[k])p[k]=p[k]+' EOD'});save();renderProjects();renderPairs();toast('Project 已更新')});document.querySelectorAll('[data-priority-select]').forEach(sel=>sel.onchange=()=>{const dl=sel.closest('form').querySelector('.deadline-label');if(dl)dl.style.display=sel.value==='CERTAIN DEADLINE'?'':'none'});document.querySelectorAll('[data-item-edit]').forEach(btn=>btn.onclick=()=>{const [projectId,itemId]=btn.dataset.itemEdit.split('|');const form=document.querySelector(`[data-item-extra-key="${projectId}|${itemId}"]`);const summary=document.querySelector(`[data-item-summary="${projectId}|${itemId}"]`);if(form.style.display==='none'){form.style.display='';summary.style.display='none';btn.textContent='收起'}else{form.style.display='none';summary.style.display='';btn.textContent=document.querySelector(`[data-item-summary="${projectId}|${itemId}"] .item-type-badge`)?.classList.contains('none')?'設定類別':'編輯資料'}});document.querySelectorAll('[data-project-delete]').forEach(b=>b.onclick=()=>{state.projects=state.projects.filter(p=>p.id!==b.dataset.projectDelete);save();renderProjects();renderPairs();toast('已刪除 Project')});document.querySelectorAll('[data-item-delete]').forEach(b=>b.onclick=()=>{const [projectId,itemId]=b.dataset.itemDelete.split('|');const p=state.projects.find(x=>x.id===projectId);p.items=p.items.filter(x=>x.id!==itemId);save();renderProjects();toast('已刪除項目')});[['data-up',-1],['data-down',1]].forEach(([attribute,delta])=>document.querySelectorAll(`[${attribute}]`).forEach(b=>b.onclick=()=>{const [projectId,itemId]=b.getAttribute(attribute).split('|');const p=state.projects.find(x=>x.id===projectId);const i=p.items.findIndex(x=>x.id===itemId);[p.items[i],p.items[i+delta]]=[p.items[i+delta],p.items[i]];save();renderProjects()})) }

// Event delegation for type tabs and extra forms (avoids re-rendering entire project list)
document.addEventListener('click',e=>{const btn=e.target.closest('[data-set-type]');if(!btn)return;e.preventDefault();const [projectId,itemId,newType]=btn.dataset.setType.split('|');const p=state.projects.find(x=>x.id===projectId);if(!p)return;const item=p.items.find(x=>x.id===itemId);if(!item)return;item.type=newType;item.extra={};save();const form=btn.closest('.project-extra');const isPartition=newType==='PARTITION';const fields=(extraFields[newType]||[]).map(([key,label])=>`<label><span>${label}</span>${key==='remark'?`<textarea name="${key}"></textarea>`:`<input name="${key}">`}</label>`).join('');const body=form.querySelector('.extra-body');body.innerHTML=`<div class="type-tabs"><button class="type-tab partition ${isPartition?'active':''}" data-set-type="${projectId}|${itemId}|PARTITION">PARTITION</button><button class="type-tab door ${!isPartition?'active':''}" data-set-type="${projectId}|${itemId}|DOOR">DOOR</button></div><div class="extra-fields">${fields}</div><button class="primary" type="submit">儲存項目資料</button>`});
document.addEventListener('submit',e=>{const form=e.target.closest('[data-item-extra-key]');if(!form)return;e.preventDefault();const [projectId,itemId]=form.dataset.itemExtraKey.split('|');const p=state.projects.find(x=>x.id===projectId);const item=p.items.find(x=>x.id===itemId);const fd=new FormData(form);item.extra=Object.fromEntries(fd.entries());save();renderProjects();toast('項目資料已儲存');});

$('search').oninput=e=>{state.query=e.target.value;renderResults()};$('clearSearch').onclick=()=>{$('search').value='';state.query='';renderResults()};$('inventoryA1').oninput=e=>state.inventoryA1=e.target.value;$('inventoryA2').oninput=e=>state.inventoryA2=e.target.value;$('resetPair').onclick=()=>{state.a1=null;state.a2=null;state.inventoryA1='';state.inventoryA2='';$('pairName').value='Item A';renderSlots()};$('savePair').onclick=()=>{state.pairs.unshift({id:id(),name:$('pairName').value.trim()||'未命名配對',a1:structuredClone(state.a1),a2:structuredClone(state.a2),inventoryA1:state.inventoryA1,inventoryA2:state.inventoryA2,qtn:$('qtnSearch').value.trim(),boq:$('boqSearch').value.trim(),createdAt:new Date().toISOString()});save();renderPairs();toast('配對已儲存')};document.addEventListener('change',e=>{const sel=e.target.closest('[data-priority-select]');if(!sel)return;const label=sel.closest('form').querySelector('.deadline-label');if(label)label.style.display=sel.value==='CERTAIN DEADLINE'?'':'none'});$('projectForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const deadline=f.get('deadline');state.projects.unshift({id:id(),name:f.get('name').trim(),assignedQs:'',status:'',sales:f.get('sales').trim(),priority:f.get('priority').trim(),deadline:deadline?deadline+' EOD':'',address:f.get('address').trim(),tenderer:f.get('tenderer').trim(),attn:f.get('attn').trim(),tel:f.get('tel').trim(),email:f.get('email').trim(),mobile:f.get('mobile').trim(),fax:f.get('fax').trim(),items:[]});save();e.target.reset();document.querySelector('[data-deadline-input]').closest('.deadline-label').style.display='none';renderProjects();renderPairs();toast('Project 已儲存')};$('exportPairs').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({pairs:state.pairs,projects:state.projects},null,2)],{type:'application/json'}));a.download='t1-configuration-backup.json';a.click();URL.revokeObjectURL(a.href)};$('importPairs').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!Array.isArray(d.pairs))throw Error();state.pairs=d.pairs;state.projects=Array.isArray(d.projects)?d.projects:[];save();renderPairs();renderProjects();toast('備份已匯入')}catch{toast('無法讀取備份檔')}e.target.value=''};$('exportProjects').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({projects:state.projects},null,2)],{type:'application/json'}));a.download='t1-projects-backup.json';a.click();URL.revokeObjectURL(a.href)};$('importProjects').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!Array.isArray(d.projects))throw Error();state.projects=d.projects;save();renderProjects();renderPairs();toast('Projects 已匯入')}catch{toast('無法讀取 Projects 備份')}e.target.value=''};$('viewer').addEventListener('click',e=>{if(e.target===$('viewer'))$('viewer').close()});initViewer();renderFilters();renderResults();renderSlots();renderPairs();renderProjects();

// Project searchable filter dropdown
(function(){const search=$('projectSearch'),dropdown=$('projectDropdown');if(!search||!dropdown)return;let selectedId='';function rebuild(items){dropdown.innerHTML=items.length?items.map(p=>`<div class="ps-item" data-pid="${p.id}">${esc(p.name)} ${p.assignedQs?`<small style="color:#7a97b0;font-weight:400">(${esc(p.assignedQs)})</small>`:''}</div>`).join(''):'<div class="ps-empty">無符合的 Project</div>';dropdown.querySelectorAll('.ps-item').forEach(el=>{el.addEventListener('click',()=>{selectedId=el.dataset.pid;const p=state.projects.find(x=>x.id===selectedId);search.value=p?p.name:'';dropdown.classList.remove('open');applyFilter()})})}function applyFilter(){document.querySelectorAll('.project-card').forEach(card=>{card.style.display=selectedId&&card.dataset.projectCard===selectedId?'block':'none'})}search.addEventListener('focus',()=>{rebuild(state.projects);dropdown.classList.add('open')});search.addEventListener('blur',()=>setTimeout(()=>dropdown.classList.remove('open'),200));search.addEventListener('input',()=>{const q=search.value.toLowerCase().trim();const filtered=state.projects.filter(p=>p.name.toLowerCase().includes(q)||(p.assignedQs||'').toLowerCase().includes(q));rebuild(filtered);dropdown.classList.add('open')});const prevRender2=renderProjects;renderProjects=function(){prevRender2();applyFilter()};applyFilter();if(!state.projects.length)selectedId=''})();

// Operable Wall searchable dropdowns
(function(){function setupSearchableDropdown(searchId,dropdownId,emptyId){const search=document.getElementById(searchId),dropdown=document.getElementById(dropdownId),empty=emptyId?document.getElementById(emptyId):null;if(!search||!dropdown)return;const allItems=dropdown.querySelectorAll('.ow-item');search.addEventListener('focus',()=>{dropdown.classList.add('open')});search.addEventListener('blur',()=>setTimeout(()=>dropdown.classList.remove('open'),180));search.addEventListener('input',()=>{const q=search.value.toLowerCase().trim();let visible=0;dropdown.querySelectorAll('.ow-group').forEach(g=>{let gVis=0;g.querySelectorAll('.ow-item').forEach(item=>{const match=!q||item.dataset.value.toLowerCase().includes(q);item.style.display=match?'':'none';if(match)gVis++});g.style.display=gVis?'':'none';visible+=gVis});const flatItems=dropdown.querySelectorAll(':scope > .ow-item');flatItems.forEach(item=>{const match=!q||item.dataset.value.toLowerCase().includes(q);item.style.display=match?'':'none';if(match)visible++});if(empty)empty.hidden=visible>0;dropdown.classList.add('open')});allItems.forEach(item=>{item.addEventListener('click',()=>{search.value=item.dataset.value;dropdown.classList.remove('open');toast(`已選擇: ${item.dataset.value}`)})})}setupSearchableDropdown('operableWallSearch','operableWallDropdown','owEmpty');setupSearchableDropdown('sourcingSearch','sourcingDropdown','sourcingEmpty');})();

// Operable Wall form — populate project select and copy to project
(function(){const select=$('owProjectSelect'),copyBtn=$('owCopyBtn');if(!select||!copyBtn)return;function refreshProjects(){const cur=select.value;select.innerHTML='<option value="">選擇 Project</option>'+state.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');if(cur)select.value=cur}refreshProjects();const prevRender=renderProjects;renderProjects=function(){prevRender();refreshProjects()};copyBtn.addEventListener('click',()=>{const pid=select.value;if(!pid){toast('請先選擇 Project');return}const p=state.projects.find(x=>x.id===pid);if(!p){toast('找不到 Project');return}const sourcing=$('sourcingSearch').value.trim();const product=$('operableWallSearch').value.trim();if(!sourcing&&!product){toast('請先選擇 Sourcing 或 Operable Wall 產品');return}p.items.push({id:id(),pair:{name:(sourcing||product),a1:{code:sourcing||'—',category:'Operable Wall',page:0,image:''},a2:{code:product||'—',category:'Operable Wall',page:0,image:''},inventoryA1:'',inventoryA2:''},type:'OPERABLE_WALL',extra:{legend:$('owLegend').value.trim(),finishes:$('owFinishes').value.trim(),height:$('owHeight').value.trim(),type:$('owType').value.trim(),operate:$('owOperate').value.trim(),country:$('owCountry').value.trim(),hwFinishes:$('owHwFinishes').value.trim(),remark:$('owRemark').value.trim()}});save();renderProjects();toast(`已複製到 ${p.name}`)})})();

// Assigned QS per-project card (delegated)
document.addEventListener('change',e=>{const sel=e.target.closest('[data-assign-qs]');if(!sel)return;const p=state.projects.find(x=>x.id===sel.dataset.assignQs);if(!p)return;p.assignedQs=sel.value;save()});
document.addEventListener('change',e=>{const sel=e.target.closest('[data-assign-status]');if(!sel)return;const p=state.projects.find(x=>x.id===sel.dataset.assignStatus);if(!p)return;p.status=sel.value;save()});

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

// Delegated clicks for saved-pairs actions
document.addEventListener('click',e=>{const btn=e.target.closest('[data-pair-view]');if(!btn)return;const pair=state.pairs.find(p=>p.id===btn.dataset.pair);openViewer(pair[btn.dataset.pairView])});
document.addEventListener('click',e=>{const btn=e.target.closest('[data-pair-delete]');if(!btn)return;state.pairs=state.pairs.filter(p=>p.id!==btn.dataset.pairDelete);save();renderPairs();toast('已刪除配對')});
document.addEventListener('click',e=>{const btn=e.target.closest('[data-copy]');if(!btn)return;const select=document.querySelector(`[data-project-for="${btn.dataset.copy}"]`);const project=state.projects.find(p=>p.id===select.value);const pair=state.pairs.find(p=>p.id===btn.dataset.copy);if(!project){toast('請先選擇 Project');return}project.items.push({id:id(),pair:{name:pair.name,a1:structuredClone(pair.a1),a2:structuredClone(pair.a2),inventoryA1:pair.inventoryA1,inventoryA2:pair.inventoryA2,qtn:pair.qtn||'',boq:pair.boq||''}});save();renderProjects();toast(`已複製到 ${project.name}`)});

// Project inner tab switching
document.addEventListener('click',e=>{const btn=e.target.closest('[data-ptab]');if(!btn)return;const pid=btn.dataset.ptab;document.querySelectorAll(`[data-ptab="${pid}"]`).forEach(t=>t.classList.remove('active'));btn.classList.add('active');const panel=btn.dataset.ptabPanel;document.querySelectorAll(`[data-ptab-panel="${pid}|info"],[data-ptab-panel="${pid}|items"]`).forEach(p=>{p.style.display=p.dataset.ptabPanel===`${pid}|${panel}`?'':'none'});});

/* Item Image scan — Listed Projects 內每個 project 的 PARTITION / DOOR / OW 分頁
 *
 * - 貼上截圖（Ctrl+V）或點「🖼️ Image scan」選檔 → OCR.Space 辨識 → 依該分頁的欄位標籤
 *   （LEGEND / HEIGHT / VERTICAL SECTION / GLASS 1 …，實際標籤取自 app.js 的 extraFields）
 *   填入「目前開啟編輯的那一筆」項目；若沒有開啟的項目，就新增一筆並直接展開其輸入框。
 * - 只填有辨識到的欄位；新新增的項目會同時寫入資料，開啟中的項目則填在輸入框，確認後按
 *   「儲存項目資料」才寫入（避免覆蓋正在編輯的內容）。
 * - 沒有指定分頁開啟時貼上，會提示先切到 PARTITION / DOOR / OW。
 */
(function () {
  'use strict';

  var TYPE_PANEL = { PARTITION: 'partition', DOOR: 'door', OPERABLE_WALL: 'ow' };
  var TYPE_LABEL = { PARTITION: 'PARTITION', DOOR: 'DOOR', OPERABLE_WALL: 'OW' };

  // 各欄位的別名（比對前會正規化：只留英數與中文）。
  // 額外收錄 OCR 常見的縮寫／掉字寫法與中文標籤，因為掃描圖常是規格表而非制式表單。
  var ALIASES = {
    PARTITION: {
      legend: ['legend', 'legend manual', 'legend no', '圖例', '代號', '代号'],
      finishes: ['finish', 'frame finish', 'frame finishes', 'surface finish', '表面處理', '表面处理', '塗裝', '涂装', '飾面', '饰面'],
      height: ['ht', 'overall height', '高度'],
      verticalSection: ['vertical', 'vertical section', 'vert section', 'vert. section', 'v section', 'vsection', 'vs', '垂直剖面', '垂直剖', '竖剖', '豎剖'],
      horizontalSection: ['horizontal', 'horizontal section', 'horiz section', 'horiz. section', 'h section', 'hsection', 'hs', '水平剖面', '水平剖', '横剖', '橫剖'],
      transom: ['transoms', 'horizontal bar', '橫檔', '横档', '橫料'],
      mullion: ['mullions', 'vertical bar', '豎框', '竖框', '立柱'],
      glass1: ['glass', 'glass 1', 'glass1', 'glass no 1', 'glass type 1', 'glazing 1', 'glazing', '玻璃1', '玻璃 1', '玻璃'],
      glass2: ['glass 2', 'glass2', 'glass no 2', 'glass type 2', 'glazing 2', '玻璃2', '玻璃 2'],
      squarePost: ['square post', 'sq post', 'sqpost', 'post', '方通', '方柱'],
      powerColumn: ['power column', 'power col', 'powercolumn', '電源柱', '电源柱'],
      sizePc: ['size pc', 'sizepc', 'pc size', 'size', '尺寸', '規格', '规格'],
      remark: ['remark', 'remarks', 'remark if any', 'note', 'notes', '備註', '备注', '說明', '说明', '注意']
    },
    DOOR: {
      legend: ['legend', 'legend manual', 'legend no', '圖例', '代號', '代号'],
      finishes: ['finish', 'frame finish', 'frame finishes', 'surface finish', '表面處理', '表面处理', '飾面', '饰面'],
      height: ['ht', 'overall height', '高度'],
      noOfLeaf: ['no of leaf', 'no. of leaf', 'no of leaves', 'leaf', 'leaf qty', 'door leaf', 'panel qty', '門扇數量', '门扇数量', '扇數', '扇数', '門扇', '门扇'],
      doorFrame: ['door frame', 'df', 'frame', '門框', '门框'],
      doorPanel: ['door panel', 'dp', 'panel', 'door leaf panel', '門板', '门板', '門扇板'],
      transom: ['transoms', 'horizontal bar', '橫檔', '横档'],
      mullion: ['mullions', 'vertical bar', '豎框', '竖框'],
      glass1: ['glass', 'glass 1', 'glass1', 'glass type 1', 'glazing 1', '玻璃1', '玻璃 1', '玻璃'],
      glass2: ['glass 2', 'glass2', 'glass type 2', 'glazing 2', '玻璃2', '玻璃 2'],
      hardware: ['hardwares', 'ironmongery', 'hw', '五金', '五金配件'],
      lock: ['lockset', 'lock set', 'locks', '鎖', '锁', '門鎖', '门锁'],
      doorCloser: ['closer', 'door closers', 'overhead closer', '閉門器', '闭门器'],
      hwFinishes: ['hw finish', 'hw finishes', 'hardware finish', 'hardware finishes', '五金飾面', '五金饰面'],
      remark: ['remark', 'remarks', 'remark if any', 'note', 'notes', '備註', '备注', '說明', '说明']
    },
    OPERABLE_WALL: {
      legend: ['legend manual', 'legend', 'legend no', '圖例', '代號', '代号'],
      finishes: ['finish', 'surface finish', '表面處理', '表面处理', '飾面', '饰面'],
      height: ['ht', 'overall height', '高度'],
      type: ['model', 'series', 'system', '型號', '型号', '系列'],
      operate: ['operation', 'operating', 'operation mode', 'stacking', '操作方式', '運作', '运作', '開合方式'],
      country: ['origin', 'made in', '產地', '产地'],
      hwFinishes: ['hw finish', 'hw finishes', 'hardware finish', 'hardware finishes', '五金飾面', '五金饰面'],
      remark: ['remark', 'remarks', 'remark if any', 'note', 'notes', '備註', '备注', '說明', '说明']
    }
  };

  /** 取欄位定義（key, label）：優先用 app.js 的 extraFields，沒有就退回 T1.extraFields */
  function fieldDefs(type) {
    if (typeof extraFields !== 'undefined' && extraFields && extraFields[type]) return extraFields[type];
    var t1 = (window.T1 || {}).extraFields;
    return (t1 && t1[type]) || [];
  }

  /** 去掉空白、括號、標點並轉大寫，方便比對 OCR 標籤 */
  function norm(s) {
    return (window.T1.imageScan && window.T1.imageScan.normLabel)
      ? window.T1.imageScan.normLabel(s)
      : String(s || '').toUpperCase().replace(/[^A-Z0-9\u4e00-\u9fff]/g, '');
  }

  /** 欄位標籤 + 別名 → [[標籤文字, key], ...]（給比對與前綴切分器共用） */
  function candidateLabels(type) {
    var list = fieldDefs(type).map(function (d) { return [d[1], d[0]]; });
    var aliases = ALIASES[type] || {};
    Object.keys(aliases).forEach(function (key) {
      aliases[key].forEach(function (a) { list.push([a, key]); });
    });
    return list;
  }

  /** labelText → item.extra 的 key（有冒號時的比對；允許 OCR 掉字） */
  function makeItemLabelMatcher(type) {
    var entries = candidateLabels(type)
      .map(function (p) { return { key: p[1], text: norm(p[0]) }; })
      .filter(function (e) { return !!e.text; });
    return function (labelText) {
      var n = norm(labelText);
      if (!n || n.length < 2) return null;
      var i;
      // 1) 完全等於欄位標籤或別名
      for (i = 0; i < entries.length; i++) if (entries[i].text === n) return entries[i].key;
      // 2) OCR 標籤是欄位標籤的前綴（LEGEND → LEGEND (Manual)、GLASS → GLASS 1）
      for (i = 0; i < entries.length; i++) {
        if (n.length >= 3 && entries[i].text.length > n.length && entries[i].text.indexOf(n) === 0) return entries[i].key;
      }
      return null;
    };
  }

  /** 沒有冒號時用來切開「標籤 值」的切分器（表格 OCR 最常見的排版） */
  function makeItemSplitter(type) {
    return (window.T1.imageScan && window.T1.imageScan.makePrefixSplitter)
      ? window.T1.imageScan.makePrefixSplitter(candidateLabels(type), { minLen: 4 })
      : null;
  }

  /** OCR 文字 → { key: value }（依 type 的欄位標籤） */
  function parseItemFields(text, type) {
    return window.T1.imageScan.parseLabeled(text, makeItemLabelMatcher(type), {
      continueKeys: [],
      splitByLabel: makeItemSplitter(type),
      splitterFirst: true // 規格表常是「標籤 值」單一空白，先切標籤才不會把 GLASS 1 切成 GLASS
    });
  }

  // --- 目標項目 -------------------------------------------------------------

  /** 目前開啟編輯表單的項目（在指定分頁、指定 project 內） */
  function findOpenItem(projectId, type) {
    var panel = document.querySelector('[data-ptab-panel="' + projectId + '|' + TYPE_PANEL[type] + '"]');
    if (!panel) return null;
    var forms = Array.prototype.slice.call(panel.querySelectorAll('.project-extra'));
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].style.display === 'none') continue;
      var key = forms[i].dataset.itemExtraKey || '';
      var parts = key.split('|');
      if (parts[0] === projectId) return parts[1];
    }
    return null;
  }

  /** 目前開啟的 PARTITION / DOOR / OW 分頁（回傳 { projectId, type } 或 null） */
  function activeScanTarget() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('.p-inner-panel[data-ptab-panel]'));
    for (var i = 0; i < panels.length; i++) {
      var attr = panels[i].dataset.ptabPanel || '';
      var sep = attr.lastIndexOf('|');
      if (sep < 0) continue;
      var type = Object.keys(TYPE_PANEL).filter(function (t) { return TYPE_PANEL[t] === attr.slice(sep + 1); })[0];
      if (!type) continue;
      if (panels[i].style.display === 'none' || panels[i].offsetParent === null) continue;
      var card = panels[i].closest('.project-card');
      if (!card || card.style.display === 'none') continue;
      return { projectId: attr.slice(0, sep), type: type };
    }
    return null;
  }

  function statusEl(projectId, type) {
    return document.querySelector('[data-item-image-status="' + projectId + '|' + type + '"]');
  }

  function setStatus(projectId, type, text, kind) {
    var el = statusEl(projectId, type);
    if (!el) return;
    el.textContent = text || '';
    el.className = 'image-scan-status' + (kind ? ' ' + kind : '');
  }

  function previewEl(projectId, type) {
    return document.querySelector('[data-item-image-preview="' + projectId + '|' + type + '"]');
  }

  /** 顯示／清除該分頁的縮圖預覽（與 New Project 的 Image scan 相同） */
  function setPreview(projectId, type, dataUrl) {
    var img = previewEl(projectId, type);
    if (!img) return;
    if (!dataUrl) { img.hidden = true; img.removeAttribute('src'); return; }
    img.src = dataUrl;
    img.hidden = false;
  }
  var lastPreview = {}; // "pid|TYPE" → dataURL（renderProjects 後重新顯示用）
  function targetKey(projectId, type) { return projectId + '|' + type; }

  // --- 填入 -----------------------------------------------------------------

  function highlight(el) {
    el.classList.remove('item-scan-filled');
    void el.offsetWidth;
    el.classList.add('item-scan-filled');
  }

  /** 把欄位值填進某筆項目的輸入框（不寫入資料，等使用者按儲存） */
  function fillItemForm(projectId, itemId, values) {
    var form = document.querySelector('[data-item-extra-key="' + projectId + '|' + itemId + '"]');
    if (!form) return 0;
    var filled = 0;
    Object.keys(values).forEach(function (key) {
      var el = form.querySelector('[name="' + key + '"]');
      if (!el) return;
      el.value = values[key];
      el.dispatchEvent(new Event('input', { bubbles: true }));
      highlight(el);
      filled++;
    });
    return filled;
  }

  // --- 主流程 ---------------------------------------------------------------

  function applyScan(target, file) {
    var projectId = target.projectId, type = target.type;
    var imageScan = window.T1.imageScan;
    if (!imageScan) { setStatus(projectId, type, 'Image scan 模組未載入', 'error'); return Promise.resolve(0); }
    setStatus(projectId, type, '辨識中…');

    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function (e) { resolve(e.target.result); };
      reader.onerror = function () { resolve(null); };
      reader.readAsDataURL(file);
    })
      .then(function (dataUrl) {
        if (!dataUrl) throw new Error('無法讀取檔案');
        return imageScan.prepareImage(dataUrl);
      })
      .then(function (prepared) {
        lastPreview[targetKey(projectId, type)] = prepared;
        setPreview(projectId, type, prepared);
        return imageScan.callOcr(prepared);
      })
      .then(function (text) {
        var values = parseItemFields(text, type);
        var keys = Object.keys(values).filter(function (k) { return values[k]; });
        if (!keys.length) {
          var examples = fieldDefs(type).slice(0, 4).map(function (d) { return d[1]; }).join(' / ');
          setStatus(projectId, type, '辨識成功但找不到 ' + TYPE_LABEL[type] + ' 可對應的欄位（例如 ' + examples + '）', 'warn');
          if (typeof toast === 'function') toast('Image scan：找不到 ' + TYPE_LABEL[type] + ' 可對應的欄位');
          return 0;
        }

        var p = state.projects.find(function (x) { return x.id === projectId; });
        if (!p) throw new Error('找不到 Project');

        var itemId = findOpenItem(projectId, type);
        var created = false;
        if (!itemId) {
          // 沒有開啟中的項目 → 新增一筆（資料直接寫入，輸入框同時展開）
          var name = values.legend || values.type || ('Image scan ' + (p.items.filter(function (i) { return i.type === type; }).length + 1));
          p.items.push({
            id: id(),
            pair: { name: name, a1: null, a2: null, inventoryA1: '', inventoryA2: '', qtn: '', boq: '' },
            type: type,
            extra: values
          });
          save();
          itemId = p.items[p.items.length - 1].id;
          created = true;
          renderProjects();
          // 展開剛新增項目的編輯表單
          setTimeout(function () {
            var btn = document.querySelector('[data-item-edit="' + projectId + '|' + itemId + '"]');
            if (btn) btn.click();
          }, 30);
        }

        var filled = 0;
        setTimeout(function () {
          filled = fillItemForm(projectId, itemId, values);
          // renderProjects 會重建 DOM → 重新套用縮圖與狀態
          setPreview(projectId, type, lastPreview[targetKey(projectId, type)]);
          var labelList = keys.map(function (k) {
            var def = fieldDefs(type).filter(function (d) { return d[0] === k; })[0];
            return def ? def[1] : k;
          }).join('、');
          setStatus(projectId, type,
            (created ? '已新增 1 筆並填入 ' : '已填入 ') + keys.length + ' 個欄位：' + labelList +
            '（確認後按「儲存項目資料」' + (created ? '）' : '儲存）'), 'ok');
          if (typeof toast === 'function') toast('Image scan：' + (created ? '已新增項目並填入 ' : '已填入 ') + keys.length + ' 個欄位');
        }, created ? 150 : 0);
        return keys.length;
      })
      .catch(function (err) {
        var msg = (err && err.message) ? err.message : String(err);
        setStatus(projectId, type, '掃描失敗：' + msg, 'error');
        if (typeof toast === 'function') toast('Image scan 掃描失敗: ' + msg);
        return 0;
      });
  }

  function pickImageFromClipboard(dt) {
    if (!dt) return null;
    var items = dt.items || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && /^image\//.test(items[i].type || '')) {
        var f = items[i].getAsFile();
        if (f) return f;
      }
    }
    var files = dt.files || [];
    for (var j = 0; j < files.length; j++) if (/^image\//.test(files[j].type || '')) return files[j];
    return null;
  }

  function isListedProjectsVisible() {
    var el = document.querySelector('[data-project-tab-panel="saved"]');
    if (!el || el.style.display === 'none') return false;
    return (typeof el.checkVisibility === 'function') ? el.checkVisibility() : !!el.offsetWidth;
  }

  function isNewProjectVisible() {
    var el = document.querySelector('[data-project-tab-panel="new"]');
    if (!el || el.style.display === 'none') return false;
    return (typeof el.checkVisibility === 'function') ? el.checkVisibility() : !!el.offsetWidth;
  }

  var pendingTarget = null; // 「選擇圖片」用
  var fileInput = null;

  function ensureFileInput() {
    if (fileInput) return fileInput;
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.hidden = true;
    fileInput.id = 'itemImageScanInput';
    fileInput.addEventListener('change', function () {
      var f = this.files && this.files[0];
      var target = pendingTarget;
      pendingTarget = null;
      this.value = '';
      if (f && target) applyScan(target, f);
    });
    document.body.appendChild(fileInput);
    return fileInput;
  }

  function targetFromAttr(attr) {
    var sep = String(attr || '').lastIndexOf('|');
    if (sep < 0) return null;
    return { projectId: attr.slice(0, sep), type: attr.slice(sep + 1) };
  }

  function init() {
    // 點「選擇圖片」或貼上區塊 → 選圖（該分頁即為目標）
    document.addEventListener('click', function (e) {
      var pick = e.target.closest('[data-item-image-pick], [data-item-image-drop]');
      if (pick) {
        if (e.target.closest('button') && !e.target.closest('[data-item-image-pick]')) return; // 清除鈕另處理
        pendingTarget = targetFromAttr(pick.dataset.itemImagePick || pick.dataset.itemImageDrop);
        if (pendingTarget) ensureFileInput().click();
        return;
      }
      // 「清除」→ 清掉該分頁的縮圖與狀態
      var clear = e.target.closest('[data-item-image-clear]');
      if (clear) {
        var t = targetFromAttr(clear.dataset.itemImageClear);
        if (t) {
          lastPreview[targetKey(t.projectId, t.type)] = null;
          setPreview(t.projectId, t.type, null);
          setStatus(t.projectId, t.type, '');
        }
        return;
      }
      // 「＋ 手動新增」→ 新增一筆空白項目並展開輸入框
      var addBtn = e.target.closest('[data-item-add]');
      if (!addBtn) return;
      var attr2 = addBtn.dataset.itemAdd || '';
      var sep2 = attr2.lastIndexOf('|');
      if (sep2 < 0) return;
      var projectId = attr2.slice(0, sep2), type = attr2.slice(sep2 + 1);
      var p = state.projects.find(function (x) { return x.id === projectId; });
      if (!p) return;
      var n = p.items.filter(function (i) { return i.type === type; }).length + 1;
      var itemId = id();
      p.items.push({
        id: itemId,
        pair: { name: '手動新增 ' + n, a1: null, a2: null, inventoryA1: '', inventoryA2: '', qtn: '', boq: '' },
        type: type,
        extra: {}
      });
      save();
      renderProjects();
      setTimeout(function () {
        var btn2 = document.querySelector('[data-item-edit="' + projectId + '|' + itemId + '"]');
        if (btn2) btn2.click();
        setStatus(projectId, type, '已手動新增 1 筆，請直接在下方輸入框填寫後按「儲存項目資料」', 'ok');
      }, 30);
      if (typeof toast === 'function') toast('已新增 1 筆 ' + TYPE_LABEL[type] + ' 項目');
    });

    // 鍵盤：在貼上區按 Enter / 空白 = 選圖
    document.addEventListener('keydown', function (e) {
      var zone = e.target.closest && e.target.closest('[data-item-image-drop]');
      if (!zone) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      pendingTarget = targetFromAttr(zone.dataset.itemImageDrop);
      if (pendingTarget) ensureFileInput().click();
    });

    // 拖入圖片
    ['dragenter', 'dragover'].forEach(function (ev) {
      document.addEventListener(ev, function (e) {
        var zone = e.target.closest && e.target.closest('[data-item-image-drop]');
        if (!zone) return;
        e.preventDefault();
        zone.classList.add('is-over');
      });
    });
    ['dragleave', 'dragend'].forEach(function (ev) {
      document.addEventListener(ev, function (e) {
        var zone = e.target.closest && e.target.closest('[data-item-image-drop]');
        if (zone) zone.classList.remove('is-over');
      });
    });
    document.addEventListener('drop', function (e) {
      var zone = e.target.closest && e.target.closest('[data-item-image-drop]');
      if (!zone) return;
      e.preventDefault();
      zone.classList.remove('is-over');
      var target = targetFromAttr(zone.dataset.itemImageDrop);
      var files = (e.dataTransfer && e.dataTransfer.files) || [];
      if (!target) return;
      for (var i = 0; i < files.length; i++) {
        if (/^image\//.test(files[i].type || '')) { applyScan(target, files[i]); return; }
      }
      if (files.length) applyScan(target, files[0]);
    });

    // 貼上截圖：New Project 由 imageScan.js 處理；Listed Projects 交給這裡
    document.addEventListener('paste', function (e) {
      if (!isListedProjectsVisible() || isNewProjectVisible()) return;
      var file = pickImageFromClipboard(e.clipboardData);
      if (!file) return;
      var target = activeScanTarget();
      if (!target) {
        toast('請先切到 PARTITION / DOOR / OW 分頁，再貼上截圖');
        return;
      }
      e.preventDefault();
      applyScan(target, file);
    });
  }

  window.T1.itemImageScan = {
    parseItemFields: parseItemFields,
    makeItemLabelMatcher: makeItemLabelMatcher,
    makeItemSplitter: makeItemSplitter,
    candidateLabels: candidateLabels,
    findOpenItem: findOpenItem,
    activeScanTarget: activeScanTarget,
    applyScan: applyScan
  };

  if (typeof document !== 'undefined') init();
})();

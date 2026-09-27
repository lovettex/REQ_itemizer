/* Image scan — 貼上截圖（或選檔／拖入）→ OCR.Space API → 自動填入 New Project 表單
 *
 * - 貼圖：New Project tab 顯示時，直接按 Ctrl+V 貼上截圖即可（也可點區塊選檔或拖入）。
 * - 辨識：OCR.Space 免費 API（https://api.ocr.space/parse/image），送出前會自動縮圖／壓縮，
 *   確保 base64 在免費方案 1MB 上限內。
 * - 填表：解析 OCR 文字中的 Project / Sales / Address / Tenderer / Attn / Tel / Email / Mobile / Fax
 *   標籤，寫入 New Project 表單對應的輸入框（不覆蓋沒辨識到的欄位）。
 */
(function () {
  'use strict';

  window.T1 = window.T1 || {};

  // --- OCR.Space 設定 -------------------------------------------------------
  var OCR_API_KEY = 'K87036576688957';                 // OCR.Space 免費 API key
  var OCR_ENDPOINT = 'https://api.ocr.space/parse/image';
  var OCR_LANGUAGE = 'auto';                           // 英文可改 'eng'；auto 由 Engine 2 自動判斷（含中文）
  var OCR_ENGINE = '2';                                // 2 = 官方預設（速度與準度平衡）
  var OCR_MAX_BASE64 = 950000;                         // 免費方案單檔 1MB，base64 後留一點空間
  var OCR_MAX_DIM = 2200;                              // 送出前的最長邊（過大先縮圖）
  var MAX_FILE_BYTES = 12 * 1024 * 1024;               // 原始檔上限（避免讀入過大檔案）

  // 要填入的欄位（= New Project 表單 input 的 name）＋ 顯示名稱（狀態列用）
  var TARGET_FIELDS = ['name', 'sales', 'address', 'tenderer', 'attn', 'tel', 'email', 'mobile', 'fax'];
  var FIELD_LABELS = { name: 'Project', sales: 'Sales', address: 'Address', tenderer: 'Tenderer', attn: 'Attn', tel: 'Tel', email: 'Email', mobile: 'Mobile', fax: 'Fax' };

  // --- 標籤 → 欄位 ----------------------------------------------------------
  // 先比對完整標籤字串（已去掉冒號），再決定填入哪個欄位；越特殊者排越前面。
  var LABEL_MAP = [
    [/^(?:project\s*(?:name|title)|project)$/i, 'name'],
    // 註：刻意不把 "Project No / Ref" 對應到 name，避免把編號填進 Project 名稱欄
    [/^(?:project\s*(?:address|site|location)|site\s*address)$/i, 'address'],
    [/^(?:sales(?:\s*(?:person|executive|rep|representative|engineer|manager|admin))?|salesperson|sales\s*in\s*charge)$/i, 'sales'],
    [/^(?:address|addr\.?|location)$/i, 'address'],
    [/^(?:tenderer\s*\d*|tender(?:er)?\s*\d*|main\s*con(?:tractor)?|contractor|company)$/i, 'tenderer'],
    [/^(?:attn\.?|attention|contact(?:\s*(?:person|name))?|pic)$/i, 'attn'],
    [/^(?:e[\-\s]?mail(?:\s*address)?)$/i, 'email'],
    [/^(?:mobile(?:\s*(?:no\.?|number|phone))?|handphone|hp|cell(?:ular)?(?:\s*(?:no\.?|number))?)$/i, 'mobile'],
    [/^(?:fax(?:\s*(?:no\.?|number))?|facsimile)$/i, 'fax'],
    [/^(?:tel(?:ephone)?(?:\s*(?:no\.?|number))?|phone(?:\s*(?:no\.?|number))?|contact\s*no\.?)$/i, 'tel'],
    // 中文標籤
    [/^(?:案名|專案名稱|項目名稱|工程名稱)$/, 'name'],
    [/^(?:地址|地點|案址)$/, 'address'],
    [/^(?:業務|業務人員|負責業務)$/, 'sales'],
    [/^(?:投標方|承包商|承建商|公司)$/, 'tenderer'],
    [/^(?:聯絡人|联系人|收件人|attention)$/, 'attn'],
    [/^(?:電話|电话|聯絡電話)$/, 'tel'],
    [/^(?:電子郵件|电子邮件|電郵|信箱)$/, 'email'],
    [/^(?:手機|手机|行動電話)$/, 'mobile'],
    [/^(?:傳真|传真)$/, 'fax']
  ];

  /** 把一行文字開頭的標籤字串對應到表單欄位；找不到回傳 null */
  function labelToField(label) {    var s = String(label || '').replace(/[\s.。:：*]+$/, '').trim();
    if (!s) return null;
    for (var i = 0; i < LABEL_MAP.length; i++) {
      if (LABEL_MAP[i][0].test(s)) return LABEL_MAP[i][1];
    }
    return null;
  }

  // 地址續行判斷用：句子開頭字（避免把「Please contact us…」接到地址後面）
  var CONT_STOP = /^(?:please|pls|kindly|for|note|thanks|thank|regards|if|should|we|our|you|your|contact|attached|attachment|see|refer|best|hi|dear|from|to|subject|date|re)\b/i;

  /**
   * 泛用解析：逐行找「標籤: 值」，用 matchLabel(label文字) 決定要放進哪個欄位（回傳 key 或 null）。
   * opts.continueKeys: 允許值續行的欄位（例如 address）。
   * 同一欄位以第一次出現為準；支援全形冒號、「值在下一行」與空白對齊。
   */
  function parseLabeled(text, matchLabel, opts) {
    var out = {};
    var contKeys = (opts && opts.continueKeys) || [];
    var raw = String(text || '').replace(/\r/g, '');
    // 保留原始空白（判斷「標籤   值」用），比對標籤時再正規化
    var raws = raw.split('\n').map(function (l) { return l.replace(/^[ \t]+|[ \t]+$/g, ''); }).filter(Boolean);

    for (var i = 0; i < raws.length; i++) {
      var line = raws[i].replace(/\s+/g, ' ');
      var field = null;
      var value = '';

      // (a)「標籤: 值」／「標籤：值」
      var m = line.match(/^(.{1,40}?)\s*[:：]\s*(.+)$/);
      if (m) {
        field = matchLabel(m[1]);
        value = m[2].trim();
      } else {
        // (b)「標籤:」值在下一行
        var m2 = line.match(/^(.{1,40}?)\s*[:：]\s*$/);
        if (m2) {
          var f2 = matchLabel(m2[1]);
          var next = raws[i + 1] ? raws[i + 1].replace(/\s+/g, ' ') : '';
          if (f2 && next && !/[:：]/.test(next) && !matchLabel(next)) {
            field = f2;
            value = next.trim();
            i++;
          }
        } else {
          // (c) 沒有冒號：標籤與值之間有兩個以上空白（OCR 常見的欄位排版），
          //     或只有一個空白但值以數字／+／( 開頭（例如「Mobile 019-8887777」）
          var m3 = raws[i].match(/^(.{1,40}?)\s{2,}(.+)$/) || raws[i].match(/^(.{1,40}?)\s(\+?[\d(].*)$/);
          if (m3) {
            field = matchLabel(m3[1]);
            value = m3[2].replace(/\s+/g, ' ').trim();
          }
        }
      }

      if (!field || !value) continue;
      if (out[field]) continue; // 第一次出現為準
      out[field] = value;

      // 允許續行的欄位（地址常被截成兩行：下一行沒有標籤、沒有冒號、不是電話／句子）
      if (contKeys.indexOf(field) !== -1 && i + 1 < raws.length) {
        var cont = raws[i + 1].replace(/\s+/g, ' ');
        if (cont && cont.length <= 80 && cont.indexOf('@') === -1 &&
            !/[:：]/.test(cont) &&                          // 有冒號 → 可能是下一個欄位
            !/^[\d+()\-\s]{6,}$/.test(cont) &&             // 純電話號碼
            !/(?:\+\d|\d{2,}[\s-]\d{3,})/.test(cont) &&    // 內含電話樣式
            !CONT_STOP.test(cont) &&                       // 句子開頭（Please / For / Note…）
            !matchLabel(cont)) {
          out[field] += /[,;]$/.test(out[field]) ? ' ' + cont : ', ' + cont;
          i++;
        }
      }
    }

    return out;
  }

  /**
   * New Project 表單用：解析 OCR 文字 → { name, sales, address, ... }
   * 另有 email 備援（沒有 Email 標籤時，抓整段文字中第一個 email）。
   */
  function parseFields(text) {
    var out = parseLabeled(text, labelToField, { continueKeys: ['address'] });
    if (!out.email) {
      var e = String(text || '').match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
      if (e) out.email = e[0];
    }
    return out;
  }

  /** 把解析結果寫進 New Project 表單；回傳填入的欄位數 */
  function fillForm(fields) {
    if (typeof document === 'undefined') return 0;
    var form = document.getElementById('projectForm');
    if (!form) return 0;
    var filled = 0;
    TARGET_FIELDS.forEach(function (field) {
      var value = fields && fields[field];
      if (!value) return;
      var el = form.querySelector('[name="' + field + '"]');
      if (!el) return;
      el.value = value;
      // 讓 app.js 的事件（例如 priority→deadline）與其他監聽者看到變更
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.classList.remove('image-scan-filled');
      void el.offsetWidth; // 重新觸發高亮動畫
      el.classList.add('image-scan-filled');
      filled++;
    });
    return filled;
  }

  // --- OCR 呼叫 -------------------------------------------------------------

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) { resolve(e.target.result); };
      reader.onerror = function () { reject(new Error('無法讀取檔案')); };
      reader.readAsDataURL(file);
    });
  }

  /** 縮圖 + 壓縮，讓 base64 長度落在免費方案上限內（回傳 data URL） */
  function prepareImage(dataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth, h = img.naturalHeight;
          if (!w || !h) throw new Error('圖片尺寸無效');
          var k = Math.min(1, OCR_MAX_DIM / Math.max(w, h));
          var baseW = Math.max(1, Math.round(w * k)), baseH = Math.max(1, Math.round(h * k));

          function draw(targetW, targetH, type, quality) {
            var canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff'; // 透明 PNG 先鋪白底，OCR 較準
            ctx.fillRect(0, 0, targetW, targetH);
            ctx.drawImage(img, 0, 0, targetW, targetH);
            return canvas.toDataURL(type, quality);
          }

          var out = draw(baseW, baseH, 'image/png');
          if (out.length > OCR_MAX_BASE64) out = draw(baseW, baseH, 'image/jpeg', 0.9);
          var scale = 1;
          while (out.length > OCR_MAX_BASE64 && scale > 0.35) {
            scale -= 0.15;
            out = draw(Math.max(1, Math.round(baseW * scale)), Math.max(1, Math.round(baseH * scale)), 'image/jpeg', 0.85);
          }
          resolve(out);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = function () { reject(new Error('無法讀取圖片內容')); };
      img.src = dataUrl;
    });
  }

  function _errText(v) {
    if (!v) return '';
    if (Array.isArray(v)) return v.filter(Boolean).join(' / ');
    return String(v);
  }

  /** 呼叫 OCR.Space，回傳辨識出的純文字 */
  function callOcr(dataUrl) {
    var body = new FormData();
    body.append('apikey', OCR_API_KEY);
    body.append('base64Image', dataUrl);
    body.append('language', OCR_LANGUAGE);
    body.append('OCREngine', OCR_ENGINE);
    body.append('scale', 'true');
    body.append('isTable', 'false');
    body.append('isOverlayRequired', 'false');

    return fetch(OCR_ENDPOINT, { method: 'POST', body: body }).then(function (resp) {
      if (!resp.ok) throw new Error('OCR 服務回應 ' + resp.status);
      return resp.json();
    }).then(function (res) {
      var msg = _errText(res && res.ErrorMessage) || _errText(res && res.ErrorDetails);
      var pages = (res && res.ParsedResults) || [];
      var text = pages.map(function (p) { return (p && p.ParsedText) || ''; }).join('\n').trim();
      if (res && (res.IsErroredOnProcessing || res.OCRExitCode === '4' || (!text && msg))) {
        throw new Error(msg || 'OCR 辨識失敗（請換一張較清晰的截圖）');
      }
      if (!text) throw new Error('OCR 沒有辨識到文字（請確認截圖包含表單文字）');
      return text;
    });
  }

  // --- UI -------------------------------------------------------------------

  var ui = null;

  function $(id) { return document.getElementById(id); }

  function isNewProjectVisible() {
    var el = document.querySelector('[data-project-tab-panel="new"]');
    if (!el) return false;
    if (el.style.display === 'none') return false;
    if (typeof el.checkVisibility === 'function') return el.checkVisibility();
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function setStatus(text, kind) {
    if (!ui || !ui.status) return;
    ui.status.textContent = text || '';
    ui.status.className = 'image-scan-status' + (kind ? ' ' + kind : '');
  }

  function setPreview(dataUrl) {
    if (!ui || !ui.preview) return;
    if (!dataUrl) { ui.preview.hidden = true; ui.preview.removeAttribute('src'); return; }
    ui.preview.src = dataUrl;
    ui.preview.hidden = false;
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
    for (var j = 0; j < files.length; j++) {
      if (/^image\//.test(files[j].type || '')) return files[j];
    }
    return null;
  }

  /** 主要流程：檔案 → 縮圖 → OCR → 解析 → 填表 */
  function handleImage(file) {
    if (!file) return Promise.resolve(0);
    if (!/^image\//.test(file.type || '')) {
      setStatus('只支援圖片檔（PNG / JPG）', 'error');
      if (typeof toast === 'function') toast('Image scan 只支援圖片檔');
      return Promise.resolve(0);
    }
    if (file.size > MAX_FILE_BYTES) {
      setStatus('圖片過大（上限 12MB）', 'error');
      if (typeof toast === 'function') toast('Image scan：圖片過大');
      return Promise.resolve(0);
    }
    if (ui && ui.drop) ui.drop.classList.add('is-busy');
    setStatus('辨識中…');
    return readFileAsDataUrl(file)
      .then(function (dataUrl) {
        return prepareImage(dataUrl).then(function (prepared) {
          setPreview(prepared);
          return callOcr(prepared);
        });
      })
      .then(function (text) {
        var fields = parseFields(text);
        var n = fillForm(fields);
        if (n > 0) {
          setStatus('已填入 ' + n + ' 個欄位：' + TARGET_FIELDS.filter(function (f) { return fields[f]; }).map(function (f) { return FIELD_LABELS[f] || f; }).join('、'), 'ok');
          if (typeof toast === 'function') toast('Image scan：已填入 ' + n + ' 個欄位');
        } else {
          setStatus('辨識成功但找不到可對應的欄位（請確認截圖含 Project / Sales / Tel 等標籤）', 'warn');
          if (typeof toast === 'function') toast('Image scan：找不到可對應的資料欄位');
        }
        return n;
      })
      .catch(function (err) {
        var msg = (err && err.message) ? err.message : String(err);
        setStatus('掃描失敗：' + msg, 'error');
        if (typeof toast === 'function') toast('Image scan 掃描失敗: ' + msg);
        return 0;
      })
      .then(function (n) {
        if (ui && ui.drop) ui.drop.classList.remove('is-busy');
        return n;
      });
  }

  function clearImage() {
    setPreview(null);
    setStatus('');
    if (ui && ui.input) ui.input.value = '';
  }

  function init() {
    if (typeof document === 'undefined') return;
    var zone = $('imageScanDrop');
    var pickBtn = $('imageScanPick');
    var input = $('imageScanInput');
    var preview = $('imageScanPreview');
    var status = $('imageScanStatus');
    var clearBtn = $('imageScanClear');
    if (!zone || !input) return;
    ui = { drop: zone, input: input, preview: preview, status: status, clear: clearBtn };

    // 選擇圖片
    function pick() { input.click(); }
    if (pickBtn) pickBtn.addEventListener('click', pick);
    zone.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      pick();
    });
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
    });
    input.addEventListener('change', function () {
      if (this.files && this.files[0]) handleImage(this.files[0]);
      this.value = '';
    });
    if (clearBtn) clearBtn.addEventListener('click', function (e) { e.stopPropagation(); clearImage(); });

    // 拖入圖片
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('is-over'); });
    });
    ['dragleave', 'dragend'].forEach(function (ev) {
      zone.addEventListener(ev, function () { zone.classList.remove('is-over'); });
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('is-over');
      var files = (e.dataTransfer && e.dataTransfer.files) || [];
      for (var i = 0; i < files.length; i++) {
        if (/^image\//.test(files[i].type || '')) { handleImage(files[i]); return; }
      }
      if (files.length) handleImage(files[0]);
    });

    // 貼上截圖（New Project tab 顯示時直接 Ctrl+V）
    document.addEventListener('paste', function (e) {
      if (!isNewProjectVisible()) return;
      var file = pickImageFromClipboard(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      handleImage(file);
    });
  }

  // 供測試／除錯使用
  window.T1.imageScan = {
    apiKey: OCR_API_KEY,
    endpoint: OCR_ENDPOINT,
    parseFields: parseFields,
    parseLabeled: parseLabeled,
    labelToField: labelToField,
    fillForm: fillForm,
    prepareImage: prepareImage,
    callOcr: callOcr,
    handleImage: handleImage
  };

  init();
})();

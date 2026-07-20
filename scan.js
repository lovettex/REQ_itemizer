/* Excel scan - populate Project form from .xlsx/.xls/.csv */
/* Scans all cells for label-value pairs (vertical) then falls back to header-row (horizontal) */
(function() {
  'use strict';

  if (typeof XLSX === 'undefined') return;

  const scanBtn = document.getElementById('scanBtn');
  const fileInput = document.getElementById('excelScanInput');
  const form = document.getElementById('projectForm');
  if (!scanBtn || !fileInput || !form) return;

  // --- Field definitions: label keywords + special handling ---
  const FIELD_DEFS = [
    { name: 'name',     keywords: ['project name', 'project:', 'project no', '案名', '案號'] },
    { name: 'sales',    keywords: ['sales', '業務', 'sales person', 'sales rep', 'in charge'] },
    { name: 'priority', keywords: ['priority', '等級', '案件等級', '優先級'], isPriority: true },
    { name: 'deadline', keywords: ['deadline', '交期', '期限', 'due date', 'delivery date', 'quotation submission date', 'submission date'], isDate: true },
    { name: 'address',  keywords: ['address', '地址', 'site address', 'location', '地點', 'project address'] },
    { name: 'tenderer', keywords: ['tenderer 1:', 'tenderer:', '投標方', 'main con', 'main contractor'] },
    { name: 'attn',     keywords: ['attn:', 'attention:', '聯絡人', 'contact person:'] },
    { name: 'tel',      keywords: ['tel:', 'telephone:', '電話', 'phone:', 'contact no:'] },
    { name: 'email',    keywords: ['email:', 'e-mail:', '電子郵件', 'mail:'] },
    { name: 'mobile',   keywords: ['mobile:', '手機', 'handphone:', 'hp:', 'cell:'] },
    { name: 'fax',      keywords: ['fax:', '傳真', 'facsimile:'] }
  ];

  // ---------- helpers ----------

  /** Get a cell's display text, or '' if empty/missing */
  function cellText(sheet, row, col) {
    const addr = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[addr];
    if (!cell) return '';
    // Serial-date number → YYYY-MM-DD
    if (cell.t === 'n' && cell.z && /[dy]/.test(cell.z)) {
      try {
        const d = XLSX.SSF.parse_date_code(cell.v);
        if (d && d.y) {
          return d.y + '-' + String(d.m).padStart(2,'0') + '-' + String(d.d).padStart(2,'0');
        }
      } catch (_) {}
    }
    // Real Date object
    if (cell.v instanceof Date) {
      const d = cell.v;
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }
    const raw = cell.w !== undefined ? cell.w : (cell.v !== undefined ? String(cell.v) : '');
    return String(raw).trim();
  }

  function isEmpty(v) {
    return !v || v === '-' || v === '—' || v === '–';
  }

  /** Set a single form field, dispatching events so app.js handlers see the change */
  function setField(name, raw) {
    const el = form.querySelector(`[name="${name}"]`);
    if (!el) return;

    let val = raw.trim();

    if (name === 'priority') {
      const lower = val.toLowerCase();
      if (lower.includes('urgent')) val = 'URGENT';
      else if (lower.includes('certain') || lower.includes('deadline')) val = 'CERTAIN DEADLINE';
      else if (lower.includes('regular')) val = 'REGULAR';
      else return;
    }

    el.value = val;
    // Dispatch events so app.js event delegation (priority→deadline visibility, etc.) fires
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ---------- vertical mode: label-value pairs anywhere in the sheet ----------

  function scanVertical(sheet) {
    const ref = sheet['!ref'];
    if (!ref) return false;
    const range = XLSX.utils.decode_range(ref);
    const done = new Set(); // fields already set

    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c < range.e.c; c++) {
        const label = cellText(sheet, r, c).toLowerCase();
        if (!label) continue;

        for (const def of FIELD_DEFS) {
          if (done.has(def.name) && def.name !== 'tenderer') continue;

          if (!def.keywords.some(kw => label.includes(kw))) continue;
          let val = cellText(sheet, r, c + 1);
          if (isEmpty(val)) {
            continue;
          }
          setField(def.name, val);
          done.add(def.name);
          break;
        }
      }
    }

    // Cascade: if Tenderer 1 wasn't found, try Tenderer 2 / 3
    if (!done.has('tenderer')) {
      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c < range.e.c; c++) {
          const label = cellText(sheet, r, c).toLowerCase();
          if (!label.includes('tenderer 2:') && !label.includes('tenderer 3:')) continue;
          const val = cellText(sheet, r, c + 1);
          if (!isEmpty(val)) {
            setField('tenderer', val);
            done.add('tenderer');
            break;
          }
        }
        if (done.has('tenderer')) break;
      }
    }

    return done.size > 0;
  }

  // ---------- horizontal mode: header row + data rows ----------

  function scanHorizontal(sheet) {
    const ref = sheet['!ref'];
    if (!ref) return false;
    const range = XLSX.utils.decode_range(ref);

    // Find a header row (first 20 rows) with ≥2 keyword matches
    let headerRow = -1;
    for (let r = range.s.r; r <= Math.min(range.e.r, 20) && headerRow < 0; r++) {
      let matches = 0;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const val = cellText(sheet, r, c).toLowerCase();
        if (!val) continue;
        if (FIELD_DEFS.some(def => def.keywords.some(kw => val.includes(kw)))) matches++;
      }
      if (matches >= 2) headerRow = r;
    }
    if (headerRow < 0) return false;

    // Map header columns → field names
    const colMap = {};
    for (let c = range.s.c; c <= range.e.c; c++) {
      const val = cellText(sheet, headerRow, c).toLowerCase();
      if (!val) continue;
      for (const def of FIELD_DEFS) {
        if (def.keywords.some(kw => val.includes(kw))) {
          colMap[c] = def.name;
          break;
        }
      }
    }
    if (!Object.keys(colMap).length) return false;

    // Read the first data row below the header
    const dataRow = headerRow + 1;
    let filled = false;
    for (const [col, name] of Object.entries(colMap)) {
      const val = cellText(sheet, dataRow, parseInt(col));
      if (isEmpty(val)) continue;
      setField(name, val);
      filled = true;
    }
    return filled;
  }

  // ---------- main entry point ----------

  function scanExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });

        let found = false;
        for (const name of workbook.SheetNames) {
          const sheet = workbook.Sheets[name];
          if (!sheet || !sheet['!ref']) continue;
          if (scanVertical(sheet)) { found = true; break; }
          if (scanHorizontal(sheet)) { found = true; break; }
        }

        if (found) {
          toast('Excel 掃描完成，已填入表單');
        } else {
          toast('找不到可對應的資料欄位');
        }
      } catch (err) {
        toast('掃描失敗: ' + err.message);
      }
    };
    reader.onerror = function() { toast('無法讀取檔案'); };
    reader.readAsArrayBuffer(file);
  }

  // ---------- UI wiring ----------

  scanBtn.addEventListener('click', function() { fileInput.click(); });
  fileInput.addEventListener('change', function() {
    if (!this.files || !this.files[0]) return;
    scanExcel(this.files[0]);
    this.value = '';
  });
})();

/* ================================================================
   Item scanner — reads PARTITION / DOOR sections from Glazing System
   sheet and creates items in the selected project's 需求資訊 tab.
   ================================================================ */
(function() {
  'use strict';

  if (typeof XLSX === 'undefined' || !window.T1) return;

  const itemInput = document.getElementById('itemScanInput');
  if (!itemInput) return;

  // Excel header text (trimmed, uppercase) → extra field key
  const HEADER_TO_KEY = {
    'LEGEND': 'legend',
    'FRAME FINISHES': 'finishes',
    'HEIGHT': 'height',
    'VERTICAL SECTION': 'verticalSection',
    'HORIZONTAL SECTION': 'horizontalSection',
    'TRANSOM': 'transom',
    'MULLION': 'mullion',
    'GLASS 1': 'glass1',
    'GLASS 2': 'glass2',
    'SQUARE POST': 'squarePost',
    'POWER COLUMN': 'powerColumn',
    'SIZE PC': 'sizePc',
    'NO OF LEAF': 'noOfLeaf',
    'DOOR FRAME': 'doorFrame',
    'DOOR PANEL': 'doorPanel',
    'HARDWARE': 'hardware',
    'LOCK': 'lock',
    'DOOR CLOSER': 'doorCloser',
    'HW FINISHES': 'hwFinishes',
    'REMARK IF ANY': 'remark'
  };

  /** Get display text from a sheet cell */
  function cellText(sheet, row, col) {
    const addr = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[addr];
    if (!cell) return '';
    const raw = cell.w !== undefined ? cell.w : (cell.v !== undefined ? String(cell.v) : '');
    return String(raw).trim();
  }

  function isEmpty(v) {
    return !v || v === '-' || v === '—' || v === '–';
  }

  /** Detect section marker in column A */
  function detectSection(text) {
    const t = text.trim().toUpperCase();
    if (t === 'PARTITION' || t.startsWith('PARTITION')) return 'PARTITION';
    if (t === 'DOOR' || t.startsWith('DOOR')) return 'DOOR';
    return null;
  }

  /**
   * Scan a single sheet for PARTITION / DOOR sections.
   * Returns array of { type, extra, name } objects.
   */
  function scanItemsFromSheet(sheet) {
    const ref = sheet['!ref'];
    if (!ref) return [];
    const range = XLSX.utils.decode_range(ref);
    const items = [];

    let currentType = null;      // 'PARTITION' | 'DOOR' | null
    let headerColMap = null;     // { colIndex: fieldKey, ... } | null

    for (let r = range.s.r; r <= range.e.r; r++) {
      const colA = cellText(sheet, r, 0);

      // Check section marker
      const sectionType = detectSection(colA);
      if (sectionType) {
        currentType = sectionType;
        // Build column map from the NEXT row (header row)
        const headerRow = r + 1;
        if (headerRow > range.e.r) { currentType = null; continue; }
        headerColMap = {};
        for (let c = range.s.c; c <= range.e.c; c++) {
          const h = cellText(sheet, headerRow, c).toUpperCase().trim();
          if (!h) continue;
          const key = HEADER_TO_KEY[h];
          if (key) headerColMap[c] = key;
        }
        r = headerRow; // skip header row (for-loop r++ will land on first data row)
        continue;
      }

      // Inside a section: data row
      if (currentType && headerColMap) {
        if (!colA || isEmpty(colA)) {
          // Empty legend = end of section
          currentType = null;
          headerColMap = null;
          continue;
        }

        const extra = {};
        for (const [col, key] of Object.entries(headerColMap)) {
          const val = cellText(sheet, r, parseInt(col));
          if (!isEmpty(val)) extra[key] = val;
        }

        items.push({
          type: currentType,
          extra: extra,
          name: colA
        });
      }
    }

    return items;
  }

  /** Read file → scan → create items in project */
  function scanItemsFromExcel(file, projectId) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let items = [];
        for (const name of workbook.SheetNames) {
          const sheet = workbook.Sheets[name];
          if (!sheet || !sheet['!ref']) continue;
          items = scanItemsFromSheet(sheet);
          if (items.length > 0) break;
        }

        if (items.length > 0) {
          let created = 0;
          items.forEach(it => {
            if (window.T1.createItem(projectId, it.type, it.extra, it.name)) created++;
          });
          if (created > 0) {
            // Need to re-render so user sees the new items
            if (typeof renderProjects === 'function') renderProjects();
            toast(`已掃描並新增 ${created} 個需求項目`);
          } else {
            toast('找不到指定的 Project');
          }
        } else {
          toast('找不到 PARTITION 或 DOOR 項目資料');
        }
      } catch (err) {
        toast('掃描失敗: ' + err.message);
      }
    };
    reader.onerror = function() { toast('無法讀取檔案'); };
    reader.readAsArrayBuffer(file);
  }

  // ---------- UI: event delegation ----------

  // Click: open file picker, storing projectId on the input element
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-scan-items]');
    if (!btn) return;
    e.preventDefault();
    itemInput._scanProjectId = btn.dataset.scanItems;
    itemInput.click();
  });

  // Change: read file and scan
  itemInput.addEventListener('change', function() {
    if (!this.files || !this.files[0]) return;
    const projectId = this._scanProjectId;
    this._scanProjectId = null;
    if (!projectId) return;
    scanItemsFromExcel(this.files[0], projectId);
    this.value = '';
  });
})();

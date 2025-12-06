

// === Backend Apps Script for Stock Admin ===
// Spreadsheet ID where update_stock_daily_akhir and assign_rider_daily live:
const STOCK_SS_ID = SPREADSHEET_STG_REFILL;

// Sheet names (per your confirmation)
const SHEET_STOCK = 'update_stock_daily_akhir';
const SHEET_ASSIGN = 'assign_rider_daily';

// Utility: convert plain date-ish string to ISO-date (yyyy-mm-dd)
function _toISODate(v){
  if(!v) return '';
  try {
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    // keep only date portion in local timezone (no time)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  } catch(e){ return String(v); }
}

// === 1) Save stock daily (frontend calls google.script.run.saveStockDaily(payload)) ===
// payload:
// {
//   outlet, tgl, jenis, source, products:[{product,depan,belakang,totalOutlet,mutDepan,mutBelakang,totalMutasi,grandTotal}], mutasiDepan, mutasiBelakang, admin
// }
function saveStockDaily(payload){
  if(!payload) throw new Error('Payload kosong.');
  const ss = SpreadsheetApp.openById(STOCK_SS_ID);
  const sh = ss.getSheetByName(SHEET_STOCK) || ss.insertSheet(SHEET_STOCK);

  // Ensure header exists
  if(sh.getLastRow() === 0){
    const header = [
      'tanggal','outlet','admin','jenis_stock','mutasi_dari','produk',
      'kulkas_depan','kulkas_belakang','total_outlet',
      'mutasi_depan','mutasi_belakang','total_mutasi','grand_total','timestamp_saved'
    ];
    sh.appendRow(header);
  }

  const tgl = _toISODate(payload.tgl || new Date());
  const outlet = payload.outlet || '';
  const admin = payload.admin || '';
  const jenis = payload.jenis || 'new_stock';
  const source = payload.source || '';
  const now = new Date();

  const rows = (payload.products || []).map(p=>{
    const depan = Number(p.depan || 0);
    const belakang = Number(p.belakang || 0);
    const totalOutlet = Number(p.totalOutlet || (depan+belakang));
    const mutDepan = Number(p.mutDepan || 0);
    const mutBelakang = Number(p.mutBelakang || 0);
    const totalMutasi = Number(p.totalMutasi || (mutDepan + mutBelakang));
    const grand = Number(p.grandTotal || (totalOutlet + totalMutasi));
    return [
      tgl, outlet, admin, jenis, source, String(p.product || ''),
      depan, belakang, totalOutlet,
      mutDepan, mutBelakang, totalMutasi, grand,
      Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
    ];
  });

  if(rows.length === 0){
    throw new Error('Tidak ada product untuk disimpan.');
  }

  // Append rows in batch
  sh.getRange(sh.getLastRow()+1, 1, rows.length, rows[0].length).setValues(rows);


  // =====================
  // CLEAR CACHE AGAR DATA LANGSUNG REFRESH
  // =====================
  try {
    const cache = CacheService.getScriptCache();

    cache.removeAll([
      `latest_${outlet}_${tgl}`,
      `latest_${outlet}_`,
      `latest_${outlet}`
    ]);

  } catch (e) {
    console.log("Cache clear failed:", e);
  }

  return { success: true, message: 'OK', saved: rows.length };
}


function getLatestStockForOutlet(outlet, date) {
  if (!outlet) throw new Error("Parameter outlet wajib.");

  const isoDate = date ? _toISODate(date) : "";
  const cacheKey = `latest_${outlet}_${isoDate}`;
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);

  if (cached) return JSON.parse(cached);

  // 1. LOAD SHEET
  const ss = SpreadsheetApp.openById(STOCK_SS_ID);
  const sh = ss.getSheetByName(SHEET_STOCK);
  if (!sh) return [];

  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return [];

  const data = sh.getRange(2, 1, lastRow - 1, 13).getValues();

  // 2. MAP → filter outlet & tanggal
  const rows = data
    .map(r => ({
      tanggal: _toISODate(r[0]),
      outlet: r[1],
      produk: String(r[5] || "").trim(),

      kulkas_depan: Number(r[6] || 0),
      kulkas_belakang: Number(r[7] || 0),
      total_outlet: Number(r[8] || 0),

      mutasi_depan: Number(r[9] || 0),
      mutasi_belakang: Number(r[10] || 0),
      total_mutasi: Number(r[11] || 0),

      grand_total: Number(r[12] || 0)
    }))
    .filter(r =>
      r.outlet === outlet &&
      r.produk &&
      (!isoDate || r.tanggal === isoDate)    // ⬅ FILTER EXACT TANGGAL
    );

  if (rows.length === 0) return [];

  // 3. AKUMULASI PER PRODUK
  const sum = {};

  rows.forEach(r => {
    if (!sum[r.produk]) {
      sum[r.produk] = {
        produk: r.produk,
        total_lama: 0,
        total_baru: 0,
        total_outlet: 0,
        total_mutasi: 0,
        grand_total: 0
      };
    }

    sum[r.produk].total_lama   += (r.kulkas_depan + r.mutasi_depan);
    sum[r.produk].total_baru   += (r.kulkas_belakang + r.mutasi_belakang);
    sum[r.produk].total_outlet += r.total_outlet;
    sum[r.produk].total_mutasi += r.total_mutasi;
    sum[r.produk].grand_total  += r.grand_total;
  });

  // 4. URUT SESUAI MASTER
  let order = [];
  try {
    const master = getMasterData();
    if (master && master.products) {
      order = master.products.map(p => p.product || p.name);
    }
  } catch (e) {}

  let result = [];
  if (order.length) {
    order.forEach(prod => {
      if (sum[prod]) result.push(sum[prod]);
    });

    Object.keys(sum).forEach(prod => {
      if (!order.includes(prod)) result.push(sum[prod]);
    });
  } else {
    result = Object.keys(sum)
      .sort()
      .map(prod => sum[prod]);
  }

  // 5. CACHE
  cache.put(cacheKey, JSON.stringify(result), 30);

  return result;
}



// === 3) Save assign rider (frontend calls saveAssignRider(payloadArray)) ===
// payloadArray is an array of { date, outlet, rider, product, stok_lama, stok_baru, total }
function saveAssignRider(rows){
  if(!rows || !rows.length) throw new Error('Tidak ada data assign untuk disimpan.');
  const ss = SpreadsheetApp.openById(STOCK_SS_ID);
  const sh = ss.getSheetByName(SHEET_ASSIGN) || ss.insertSheet(SHEET_ASSIGN);

  // Ensure header exists
  if(sh.getLastRow() === 0){
    const header = ['tanggal','outlet','rider','produk','stok_lama','stok_baru','total','timestamp_saved'];
    sh.appendRow(header);
  }

  const now = new Date();
  const toWrite = rows.map(r=>{
    return [
      _toISODate(r.date || new Date()),
      r.outlet || '',
      r.rider || '',
      String(r.product || ''),
      Number(r.stok_lama || 0),
      Number(r.stok_baru || 0),
      Number(r.total || 0),
      Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
    ];
  });

  sh.getRange(sh.getLastRow()+1, 1, toWrite.length, toWrite[0].length).setValues(toWrite);
  return { success: true, message: 'assign_saved', count: toWrite.length };
}

/* ========================
   OPTIONAL: helper to preview latest stock quickly (dev)
   google.script.run.withSuccessHandler(...).getLatestStockForOutlet('Ciledug');
   ======================== */

// === end backend ===

/* ============================
   RIDER SALES
============================ */
// ✅ Simpan data penjualan rider + timestamp
function saveRiderData(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_PRD);
  const sheet = ss.getSheetByName('sales');
  const timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  // === 1️⃣ AUTO HEADER JIKA SHEET BARU ===
  if (sheet.getLastRow() === 0) {
    const headers = [
      "Tanggal Input Sistem", "Outlet", "Nama Rider", "Location", "No Gerobak",
      "Tanggal Laporan", "Produk", "Harga", "Stok Lama", "Stok Baru", "Total Awal",
      "Sisa Lama", "Sisa Baru", "Total Sisa", "Terjual", "Pendapatan", "Cash", "QR",
      "Cash Diterima", "Cashbon", "Plus", "Minus", "Notes Rider", "Catatan",
      "Admin Checked By", "Konfirmasi Kehadiran"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // === 2️⃣ SIAPKAN ROW DATA SEKALIGUS ===
  const rows = data.products.map(prod => ([
    new Date(),                  // 1. Timestamp sistem
    data.outlet, 
    data.riderName,              // Nama Rider
    data.location,
    data.noGerobak,
    data.date,
    prod.product,
    prod.price,
    prod.oldStock,
    prod.newStock,
    prod.totalStart,
    prod.remainOld,
    prod.remainNew,
    prod.totalRemain,
    prod.sold,
    prod.revenue,
    prod.cash,
    prod.qr,
    data.cashDiterima,
    data.cashbon,
    data.plus,
    data.minus,
    data.notesRider,
    prod.notes,                  
    data.adminChecked,
    data.kehadiran
  ]));

  // === 3️⃣ TULIS KE SHEET SEKALI, SUPER FAST ===
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

  return `✅ Data Rider "${data.riderName}" (${data.products.length} produk) berhasil disimpan`;
}


// fungsi API analytics admin
function getSalesData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_PRD);
  const sheet = ss.getSheetByName('sales');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const json = data.map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });

  return ContentService
    .createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}

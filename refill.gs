/* ============================
   CONFIG
============================ */
// Pastikan variabel ini ada di file Config atau didefinisikan di sini
// var SPREADSHEET_PRD_REFILL = "MASUKKAN_ID_SPREADSHEET_DISINI"; 

/* ============================
   REFILL PRODUCT
============================ */
function saveRefillData(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_PRD_REFILL);
    const sheet = ss.getSheetByName('refill_product');

    if (!sheet) throw new Error("Sheet 'refill_product' tidak ditemukan.");

    // HEADER otomatis
    if (sheet.getLastRow() === 0) {
      const headers = ["Timestamp","Outlet","Admin","Rider","Product","Qty","Notes"];
      sheet.getRange(1,1,1,headers.length).setValues([headers]);
    }

    // Gunakan Date Object agar GSheet mengenali sebagai tanggal
    const timestamp = new Date(); 

    // 🚀 Kumpulkan semua row
    const rows = payload.items.map(item => ([
      timestamp,
      payload.outlet,
      payload.adminName,
      payload.riderName,
      item.product,
      item.qty,     // Ini akan menyimpan string '1/4' atau angka
      item.note || ""
    ]));

    // 🚀 Tulis sekaligus
    const start = sheet.getLastRow() + 1;
    const range = sheet.getRange(start, 1, rows.length, rows[0].length);
    range.setValues(rows);
    
    // Format kolom Timestamp
    // PERBAIKAN: mm (kecil) = menit, MM (besar) = bulan.
    sheet.getRange(start, 1, rows.length, 1).setNumberFormat("yyyy-MM-dd hh:mm:ss");

    return "success";
  } catch (e) {
    Logger.log("Error saveRefillData: " + e.toString());
    throw new Error(e.toString());
  }
}

function getRefillHistory(startDate, endDate, role, fullname) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_PRD_REFILL);
    const sheet = ss.getSheetByName('refill_product');
    
    if (!sheet) return [];
    const values = sheet.getDataRange().getDisplayValues(); // PAKAI getDisplayValues (Biar semua jadi string)
    
    if (values.length <= 1) return [];

    const results = [];
    
    // Bersihkan nama user yang request (hapus spasi & lowercase)
    const myNameClean = String(fullname || "").trim().toLowerCase();

    // Loop dari bawah (terbaru)
    for (let i = values.length - 1; i >= 1; i--) { 
      const row = values[i];
      if (!row || row.length < 6) continue;

      // Ambil data (semua sudah jadi string karena getDisplayValues)
      const rawTs = row[0];  // Timestamp
      const outlet = row[1];
      const admin = row[2];
      const rider = row[3];
      const product = row[4];
      const qty = row[5];
      const notes = row[6];

      if (!rawTs) continue;

      // --- LOGIC BARU: STRING SLICING (Lebih Aman) ---
      // Format di sheet kamu: "2025-12-11 18:35:13"
      // Kita ambil 10 huruf pertama saja: "2025-12-11"
      let dateYMD = "";
      
      if (rawTs.length >= 10) {
        dateYMD = rawTs.substring(0, 10); 
      } else {
        continue; // Skip jika format kacau
      }

      // Filter Tanggal (String vs String)
      // "2025-12-11" >= "2025-12-11" adalah TRUE. Aman.
      if (startDate && dateYMD < startDate) continue;
      if (endDate && dateYMD > endDate) continue;

      // Filter Rider
      const rowRiderClean = String(rider || "").trim().toLowerCase();
      
      // 1. Jika yang login RIDER, wajib sama namanya
      if (role === "rider" && rowRiderClean !== myNameClean) continue;
      
      // 2. Jika ADMIN, filternya nanti di frontend, tapi kita return saja datanya
      
      results.push({
        date: rawTs, // Balikin timestamp aslinya
        outlet: outlet,
        admin: admin,
        rider: rider, 
        product: product,
        qty: qty,
        notes: notes
      });
    }

    return results;

  } catch (e) {
    Logger.log("ERROR: " + e.toString());
    throw new Error(e.message);
  }
}

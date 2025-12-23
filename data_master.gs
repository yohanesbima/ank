/* ============================
   MASTER DATA (data_master.gs)
============================ */

const SS_ID = SPREADSHEET_PRD;

function getMasterData() {

  const ss = SpreadsheetApp.openById(SS_ID);

  /* ============================
     PRODUK (tbl_product_price)
  ============================= */
  const sheetProduct = ss.getSheetByName('tbl_product_price');
  const prodData = sheetProduct?.getDataRange().getValues() || [];
  const products = prodData.length > 1
    ? prodData.slice(1).map(r => ({
        product: r[0] || "",
        price: r[1] || 0
      }))
    : [];


  /* ============================
     ADMIN (tbl_user_admin)
  ============================= */
  const sheetAdmin = ss.getSheetByName('tbl_user_admin');
  const adminData = sheetAdmin?.getDataRange().getValues() || [];

  const admins = adminData.length > 1
    ? adminData
        .slice(1)
        .filter(r => (r[1] || "").toString().trim().toLowerCase() === "aktif")
        .map(r => r[0])
        .sort()                                // ← SORT
    : [];


  /* ============================
     RIDER (tbl_user_rider)
     kol A = name
     kol B = status
     kol C = admin assignment
     kol D = outlet
  ============================= */
  const sheetRider = ss.getSheetByName('tbl_user_rider');
  const riderRaw = sheetRider?.getDataRange().getValues() || [];

  const riders = [];
  const ridersWithMeta = [];

  if (riderRaw.length > 1) {
    riderRaw.slice(1).forEach(r => {
      const name   = r[0] || "";
      const status = (r[1] || "").toString();
      const admin  = r[2] || "";
      const outlet = r[3] || "";

      const meta = { name, status, admin, outlet };
      ridersWithMeta.push(meta);

      if (status.trim().toLowerCase() === "aktif" && name) {
        riders.push(name);
      }
    });
  }

  // sort riders
  riders.sort();
  ridersWithMeta.sort((a,b) => (a.name||"").localeCompare(b.name||""));


  /* ============================
     OUTLETS
     dari:
     - tbl_location kol A
     - rider metadata kol D
     - + enforce Rawamangun / Ciledug
  ============================= */
//   const sheetLoc = ss.getSheetByName('tbl_location');
//   const locData = sheetLoc?.getDataRange().getValues() || [];
  
// const locations = locData.length > 1
//   ? locData.slice(1).map(r => ({
//       name: r[0],     // lokasi
//       outlet: r[1]    // outlet lokasi
//     }))
//   : [];

//   const outletSet = new Set(locations);

//   // tambahkan outlet dari rider metadata
//   ridersWithMeta.forEach(r => { if (r.outlet) outletSet.add(r.outlet); });

//   // mandatory outlets
//   outletSet.add("Rawamangun");
//   outletSet.add("Ciledug");

//   const outlets = Array.from(outletSet).sort();   // ← SORT
const sheetLoc = ss.getSheetByName('tbl_location');
const locData = sheetLoc?.getDataRange().getValues() || [];

// daftar lokasi tetap jadi array object
const locations = locData.length > 1
  ? locData.slice(1).map(r => ({
      name: r[0],
      outlet: r[1]
    }))
  : [];

// OUTLET untuk dropdown = STRING SAJA
const outletSet = new Set();

// ambil outlet dari kolom lokasi
locations.forEach(loc => {
  if (loc.outlet) outletSet.add(loc.outlet);
});

// tambahkan outlet dari rider metadata
ridersWithMeta.forEach(r => {
  if (r.outlet) outletSet.add(r.outlet);
});

// mandatory
outletSet.add("Rawamangun");
outletSet.add("Ciledug");

// convert jadi array
const outlets = Array.from(outletSet).sort();


  /* ============================
     NO GEROBAK (optional)
  ============================= */
  const sheetGerobak = ss.getSheetByName('tbl_nogerobak');
  const gerData = sheetGerobak?.getDataRange().getValues() || [];

  const gerobakList = gerData.length > 1
    ? gerData.slice(1).map(r => r[0])
    : [];


  return {
    products,
    admins,
    riders,
    ridersWithMeta,
    outlets,
    locations,
    gerobakList
  };
}


// ===== getAssignedAdmin: cari admin assignment di tbl_user_rider kol C (index 2) =====
function getAssignedAdmin(riderName) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName('tbl_user_rider');
  if (!sheet) return "";
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rider = (data[i][0] || "").toString();
    const status = (data[i][1] || "").toString();
    const admin = (data[i][2] || "").toString();
    if (!rider) continue;
    if (rider.toLowerCase() === riderName.toLowerCase() && status.toString().trim().toLowerCase() === "aktif") {
      return admin || "";
    }
  }
  return "";
}


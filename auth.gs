/* ============================================================
   LOGIN SYSTEM – CHECK LOGIN
============================================================ */
function checkLogin(role, name, password) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_PRD)
    .getSheetByName('users');
  
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const [sheetRole, sheetName, sheetPass, sheetFullName, sheetStatus] = data[i];

    // Cek login + status aktif
    if (
      sheetRole === role &&
      sheetName === name &&
      sheetPass === password &&
      sheetStatus === "Aktif"
    ) {
      const props = PropertiesService.getUserProperties();

      props.setProperty("username", sheetName);
      props.setProperty("role", sheetRole);
      props.setProperty("fullname", sheetFullName || sheetName);

      return {
        success: true,
        role: sheetRole,
        name: sheetName
      };
    }
  }

  return {
    success: false,
    message: "Nama / password salah atau akun tidak aktif!"
  };
}

/* ============================================================
   USER SESSION
============================================================ */
// ✅ Ambil FULLNAME user yang sedang login
function getUserName() {
  const props = PropertiesService.getUserProperties();
  const savedFullName = props.getProperty("fullname");
  const savedUsername = props.getProperty("username");

  // Kalau fullname udah tersimpan langsung balikin
  if (savedFullName) return savedFullName;

  // Kalau belum tersimpan, cari di sheet berdasarkan username
  if (savedUsername) {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_PRD).getSheetByName('users');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const [role, username, pass, fullname] = data[i];
      if (username === savedUsername) {
        props.setProperty("fullname", fullname || username);
        return fullname || username;
      }
    }
  }

  return "Rider";
}

function getUserLoginInfo() {
  const props = PropertiesService.getUserProperties();

  return {
    username: props.getProperty("username") || "",
    role: props.getProperty("role") || "",
    fullname: props.getProperty("fullname") || ""
  };
}

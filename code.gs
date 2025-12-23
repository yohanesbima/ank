/* ============================================================
   DOGET – DEFAULT LOGIN PAGE & API ROUTING
============================================================ */
function doGet(e) {
  // Endpoint API Dashboard Admin
  if (e && e.parameter.action === "getSalesData") {
    return getSalesData();
  }
  const faviconUrl =
    "https://raw.githubusercontent.com/yohanesbima/ank/main/WhatsApp%20Image%202025-11-09%20at%2003.17.03.png";
  return HtmlService.createTemplateFromFile("login")
    .evaluate()
    .setTitle("Atasnama Kopi - Express")
    .setFaviconUrl(faviconUrl)
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ============================================================
   TEMPLATE INCLUDE – untuk <?!= include('css'); ?>
============================================================ */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ✅ Ambil HTML sesuai role
function getPage(feature) {
  let fileName = "login";
  if (feature === "rider") fileName = "rider";
  if (feature === "refill") fileName = "delivery_refill";
  if (feature === "stock_admin") fileName = "stock_admin";

  // createTemplateFromFile -> evaluate -> getContent()  (kembalikan string HTML)
  const htmlString = HtmlService
    .createTemplateFromFile(fileName)
    .evaluate()
    .getContent();

  return htmlString;
}



var LOGO_PNG ='https://raw.githubusercontent.com/yohanesbima/ank/main/WhatsApp%20Image%202025-11-09%20at%2003.17.03.png'
var SPREADSHEET_PRD ='106dVl1K7ppZ8VVKc1wfghLZAWjdPnOG8VtXKwQ-efmQ' 
var SPREADSHEET_PRD_REFILL ='1Z0Ha5klMdPLVoXiINzW6tKCNPV4rhrQnoZ_bk1SndP4'

var SPREADSHEET_STG ='15ZhHBeTiAQ_sGqURrCyHcHv7Yxrx_StYxiBXSToAr1k'
var SPREADSHEET_STG_REFILL ='15ZhHBeTiAQ_sGqURrCyHcHv7Yxrx_StYxiBXSToAr1k'

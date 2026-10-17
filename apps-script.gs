/**
 * Confirmações de presença · Formatura Luiza Shansis Tarta
 *
 * Como usar:
 * 1. Crie uma planilha nova no Google Sheets (ex.: "Confirmações · Formatura Luiza").
 * 2. Menu Extensões > Apps Script. Apague o que estiver lá e cole este código.
 * 3. Salve e clique em Implantar > Nova implantação > tipo "App da Web".
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 4. Autorize o acesso e copie a URL do app da web (termina em /exec).
 * 5. Cole essa URL em SCRIPT_URL, no arquivo src/App.jsx do convite.
 * 6. Compartilhe a planilha com tartaluiza@gmail.com (como Leitor ou Editor).
 */

const SHEET_NAME = "Confirmações";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Nome", "WhatsApp", "Confirmado em"]);
    sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#E6ECE4");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 260);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 170);
  }
  return sheet;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const name = String(data.name || "").trim();
    if (!name) {
      return ContentService.createTextOutput("sem nome");
    }
    const phone = String(data.phone || "").trim();
    const now = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm");
    getSheet_().appendRow([name, phone, now]);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

/* Abrir a URL /exec no navegador mostra "online": serve para testar a implantação. */
function doGet() {
  return ContentService.createTextOutput("online");
}

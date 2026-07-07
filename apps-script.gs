const SHEET_NAMES = {
  tables: "tables",
  messages: "messages",
};

const HEADERS = {
  tables: ["table_id", "date", "owner_name"],
  messages: ["table_id", "user_name", "message"],
};

function doGet(event) {
  const params = event.parameter || {};
  const action = params.action;
  let result;

  try {
    ensureSheets_();

    if (action === "get") {
      result = getData_(params.table_id);
    } else if (action === "createOrUpdateTable") {
      result = createOrUpdateTable_(params);
    } else if (action === "addMessage") {
      result = addMessage_(params);
    } else {
      result = { ok: false, error: "Unknown action" };
    }
  } catch (error) {
    result = { ok: false, error: error.message };
  }

  return output_(result, params.callback);
}

function getData_(tableId) {
  if (!tableId) throw new Error("table_id is required");

  const tables = getRows_(SHEET_NAMES.tables);
  const messages = getRows_(SHEET_NAMES.messages);

  return {
    ok: true,
    table: tables.find((row) => row.table_id === tableId) || null,
    messages: messages.filter((row) => row.table_id === tableId),
  };
}

function createOrUpdateTable_(params) {
  const tableId = clean_(params.table_id);
  const date = clean_(params.date);
  const ownerName = clean_(params.owner_name);

  if (!tableId || !date || !ownerName) {
    throw new Error("table_id, date, owner_name are required");
  }

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.tables);
  const values = sheet.getDataRange().getValues();
  const existingRow = values.findIndex((row, index) => index > 0 && row[0] === tableId);

  if (existingRow >= 1) {
    sheet.getRange(existingRow + 1, 1, 1, 3).setValues([[tableId, date, ownerName]]);
  } else {
    sheet.appendRow([tableId, date, ownerName]);
  }

  return { ok: true };
}

function addMessage_(params) {
  const tableId = clean_(params.table_id);
  const userName = clean_(params.user_name);
  const message = clean_(params.message);

  if (!tableId || !userName || !message) {
    throw new Error("table_id, user_name, message are required");
  }

  SpreadsheetApp.getActive()
    .getSheetByName(SHEET_NAMES.messages)
    .appendRow([tableId, userName, message]);

  return { ok: true };
}

function ensureSheets_() {
  Object.keys(SHEET_NAMES).forEach((key) => {
    const sheetName = SHEET_NAMES[key];
    const headers = HEADERS[key];
    const spreadsheet = SpreadsheetApp.getActive();
    const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const hasHeaders = headers.every((header, index) => firstRow[index] === header);
    const hasLegacyTableHeaders =
      key === "tables" &&
      firstRow[0] === "table_id" &&
      firstRow[1] === "owner_name" &&
      firstRow[2] === "wish";

    if (!hasHeaders) {
      if (hasLegacyTableHeaders && sheet.getLastRow() > 1) {
        const legacyRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
        const migratedRows = legacyRows.map((row) => [row[0], currentDate_(), row[1]]);
        sheet.getRange(2, 1, migratedRows.length, 3).setValues(migratedRows);
      }

      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  });
}

function getRows_(sheetName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values.shift() || [];

  return values
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => {
      return headers.reduce((record, header, index) => {
        if (header === "date" && row[index] instanceof Date) {
          record[header] = Utilities.formatDate(row[index], "Asia/Seoul", "yyyy-MM-dd");
        } else {
          record[header] = row[index] == null ? "" : String(row[index]);
        }
        return record;
      }, {});
    });
}

function output_(data, callback) {
  const json = JSON.stringify(data);
  const body = callback ? `${callback}(${json});` : json;
  const mime = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
  return ContentService.createTextOutput(body).setMimeType(mime);
}

function clean_(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function currentDate_() {
  return Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
}

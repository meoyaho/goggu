const SHEET_NAMES = {
  tables: "tables",
  messages: "messages",
};

const HEADERS = {
  tables: ["table_id", "date", "owner_name", "blessing", "decoration_json"],
  messages: ["table_id", "user_name", "message", "created_at"],
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
  const blessing = clean_(params.blessing);
  const decorationJson = clean_(params.decoration_json);

  if (!tableId || !date || !ownerName || !blessing || !decorationJson) {
    throw new Error("table_id, date, owner_name, blessing, decoration_json are required");
  }

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.tables);
  const values = sheet.getDataRange().getValues();
  const existingRow = values.findIndex((row, index) => index > 0 && row[0] === tableId);

  if (existingRow >= 1) {
    sheet.getRange(existingRow + 1, 1, 1, 5).setValues([[tableId, date, ownerName, blessing, decorationJson]]);
  } else {
    sheet.appendRow([tableId, date, ownerName, blessing, decorationJson]);
  }

  return { ok: true };
}

function addMessage_(params) {
  const tableId = clean_(params.table_id);
  const userName = clean_(params.user_name);
  const message = clean_(params.message);
  const createdAt = clean_(params.created_at) || new Date().toISOString();

  if (!tableId || !userName || !message) {
    throw new Error("table_id, user_name, message are required");
  }

  SpreadsheetApp.getActive()
    .getSheetByName(SHEET_NAMES.messages)
    .appendRow([tableId, userName, message, createdAt]);

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
    const hasThreeColumnTableHeaders =
      key === "tables" &&
      firstRow[0] === "table_id" &&
      firstRow[1] === "date" &&
      firstRow[2] === "owner_name" &&
      !firstRow[3];
    const hasThreeColumnMessageHeaders =
      key === "messages" &&
      firstRow[0] === "table_id" &&
      firstRow[1] === "user_name" &&
      firstRow[2] === "message" &&
      !firstRow[3];

    if (!hasHeaders) {
      if (hasLegacyTableHeaders && sheet.getLastRow() > 1) {
        const legacyRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
        const migratedRows = legacyRows.map((row) => [row[0], currentDate_(), row[1], "사고 없이 대박 기원", defaultDecorationJson_()]);
        sheet.getRange(2, 1, migratedRows.length, 5).setValues(migratedRows);
      }

      if (hasThreeColumnTableHeaders && sheet.getLastRow() > 1) {
        const tableRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
        const migratedRows = tableRows.map((row) => [row[0], row[1], row[2], "사고 없이 대박 기원", defaultDecorationJson_()]);
        sheet.getRange(2, 1, migratedRows.length, 5).setValues(migratedRows);
      }

      if (hasThreeColumnMessageHeaders && sheet.getLastRow() > 1) {
        const messageRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
        const migratedRows = messageRows.map((row) => [row[0], row[1], row[2], ""]);
        sheet.getRange(2, 1, migratedRows.length, 4).setValues(migratedRows);
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

function defaultDecorationJson_() {
  return '{"pig":"gold","food":"fruit","incense":"single","extra":"flowers"}';
}

const SHEETS_SCHEMA = [
  {
    name: 'Config',
    headers: ['Key', 'Value'],
  },
  {
    name: 'Stores',
    headers: [
      'StoreID',
      'StoreName',
      'StoreType',
      'IsActive',
      'SizeOptionsOverride',
      'SugarOptionsOverride',
      'IceOptionsOverride',
      'CreatedAt',
    ],
  },
  {
    name: 'Products',
    headers: [
      'ProductID',
      'StoreID',
      'ProductName',
      'Price',
      'Category',
      'HasSizeOption',
      'HasSugarOption',
      'HasIceOption',
      'AllowNote',
      'IsActive',
    ],
  },
  {
    name: 'CurrentOrder',
    headers: [
      'OrderSessionID',
      'StoreType',
      'StoreID',
      'Status',
      'CreatedBy',
      'CreatedAt',
      'ClosedAt',
    ],
  },
  {
    name: 'Orders',
    headers: [
      'OrderID',
      'OrderSessionID',
      'StoreType',
      'UserName',
      'ProductID',
      'ProductName',
      'Price',
      'Size',
      'Sugar',
      'Ice',
      'Note',
      'CreatedAt',
      'UpdatedAt',
      'Status',
    ],
  },
];

const CONFIG_DEFAULTS = [
  ['MaxNoteLength', '15'],
  ['DefaultDrinkSizeOptions', '大杯|中杯|小杯'],
  ['DefaultDrinkSugarOptions', '正常|半糖|三分糖|一分糖|無糖'],
  ['DefaultDrinkIceOptions', '正常冰|少冰|微冰|去冰|溫|熱'],
  ['LastOrderId', '0'],
];

function initSpreadsheet(spreadsheetId) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  SHEETS_SCHEMA.forEach((schema) => {
    const sheet = ensureSheet(spreadsheet, schema.name);
    ensureHeaders(sheet, schema.headers);

    if (schema.name === 'Config') {
      ensureConfigDefaults(sheet, CONFIG_DEFAULTS);
    }
  });
}

function ensureSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

function ensureHeaders(sheet, headers) {
  const currentWidth = Math.max(sheet.getLastColumn(), headers.length);
  const existingRow = sheet
    .getRange(1, 1, 1, currentWidth)
    .getValues()[0];
  const nextRow = existingRow.slice(0, headers.length);
  let changed = false;

  headers.forEach((header, index) => {
    const existing = nextRow[index];
    if (existing === '' || existing === null) {
      nextRow[index] = header;
      changed = true;
    }
  });

  if (changed || currentWidth < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([nextRow]);
  }
}

function ensureConfigDefaults(sheet, defaults) {
  const lastRow = sheet.getLastRow();
  const existingValues = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, 2).getValues()
    : [];

  const existingKeys = {};
  existingValues.forEach(([key]) => {
    if (key !== '' && key !== null) {
      existingKeys[String(key)] = true;
    }
  });

  const rowsToAppend = defaults.filter(([key]) => !existingKeys[key]);

  if (rowsToAppend.length > 0) {
    sheet
      .getRange(lastRow + 1, 1, rowsToAppend.length, 2)
      .setValues(rowsToAppend);
  }
}

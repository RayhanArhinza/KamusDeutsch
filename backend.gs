function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  const json = [];
  
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue; // Skip rows with no ID
    json.push({
      id: rows[i][0].toString(),
      german: rows[i][1] || '',
      indonesian: rows[i][2] || '',
      category: rows[i][3] || '',
      article: rows[i][4] || '',
      gender: rows[i][5] || '',
      example: rows[i][6] || ''
    });
  }
  
  Logger.log('Fetched data: ' + JSON.stringify(json));
  return ContentService.createTextOutput(JSON.stringify(json)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  let data;
  
  try {
    data = JSON.parse(e.postData.contents);
    Logger.log('Received payload: ' + JSON.stringify(data));
  } catch (error) {
    Logger.log('Error parsing JSON: ' + error);
    return ContentService.createTextOutput("Invalid JSON payload").setMimeType(ContentService.MimeType.TEXT);
  }
  
  if (!data.action) {
    Logger.log('Missing action in payload');
    return ContentService.createTextOutput("Missing action").setMimeType(ContentService.MimeType.TEXT);
  }
  
  switch(data.action) {
    case 'create':
      return handleCreate(sheet, data);
    case 'update':
      return handleUpdate(sheet, data);
    case 'delete':
      return handleDelete(sheet, data);
    default:
      Logger.log('Invalid action: ' + data.action);
      return ContentService.createTextOutput("Invalid action: " + data.action).setMimeType(ContentService.MimeType.TEXT);
  }
}

function handleCreate(sheet, data) {
  if (!data.german || !data.indonesian) {
    Logger.log('Missing german or indonesian fields');
    return ContentService.createTextOutput("Missing required fields").setMimeType(ContentService.MimeType.TEXT);
  }
  const id = new Date().getTime().toString();
  sheet.appendRow([
    id,
    data.german,
    data.indonesian,
    data.category || '',
    data.article || '',
    data.gender || '',
    data.example || ''
  ]);
  Logger.log('Created entry with ID: ' + id);
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}

function handleUpdate(sheet, data) {
  if (!data.id || !data.german || !data.indonesian) {
    Logger.log('Missing id, german, or indonesian fields');
    return ContentService.createTextOutput("Missing required fields").setMimeType(ContentService.MimeType.TEXT);
  }
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].toString() === data.id.toString()) {
      sheet.getRange(i + 1, 2).setValue(data.german);
      sheet.getRange(i + 1, 3).setValue(data.indonesian);
      sheet.getRange(i + 1, 4).setValue(data.category || '');
      sheet.getRange(i + 1, 5).setValue(data.article || '');
      sheet.getRange(i + 1, 6).setValue(data.gender || '');
      sheet.getRange(i + 1, 7).setValue(data.example || '');
      Logger.log('Updated entry with ID: ' + data.id);
      return ContentService.createTextOutput("Updated").setMimeType(ContentService.MimeType.TEXT);
    }
  }
  
  Logger.log('Entry not found for ID: ' + data.id);
  return ContentService.createTextOutput("Entry not found").setMimeType(ContentService.MimeType.TEXT);
}

function handleDelete(sheet, data) {
  if (!data.id) {
    Logger.log('Missing id in delete payload');
    return ContentService.createTextOutput("Missing ID").setMimeType(ContentService.MimeType.TEXT);
  }
  const rows = sheet.getDataRange().getValues();
  let found = false;
  
  // First pass: delete matching row
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      Logger.log('Deleted entry with ID: ' + data.id);
      found = true;
      break;
    }
  }
  
  // Second pass: clean up empty rows
  const updatedRows = sheet.getDataRange().getValues();
  for (let i = updatedRows.length - 1; i > 0; i--) {
    let isEmpty = true;
    for (let j = 0; j < 7; j++) {
      if (updatedRows[i][j]) {
        isEmpty = false;
        break;
      }
    }
    if (isEmpty) {
      sheet.deleteRow(i + 1);
      Logger.log('Cleaned up empty row at index: ' + (i + 1));
    }
  }
  
  if (found) {
    return ContentService.createTextOutput("Deleted").setMimeType(ContentService.MimeType.TEXT);
  }
  Logger.log('Entry not found for ID: ' + data.id);
  return ContentService.createTextOutput("Entry not found").setMimeType(ContentService.MimeType.TEXT);
}
const SHEET_ID = '1WflZIKfQXXmh8hWrjP9yx-4dsEHBafzceMRUEbng5Ck';
const SHEET_NAMES = ['FL_dataset1', 'FL_dataset2'];

function output(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function editorPassword() {
  return PropertiesService.getScriptProperties().getProperty('EDITOR_PASSWORD') || '';
}

function validPassword(value) {
  const expected = editorPassword();
  return expected !== '' && String(value || '') === expected;
}

function datasetName(value) {
  return SHEET_NAMES.indexOf(value) >= 0 ? value : SHEET_NAMES[0];
}

function doGet(e) {
  try {
    if (e.parameter.action === 'authenticate') {
      return validPassword(e.parameter.password)
        ? output({ ok: true })
        : output({ ok: false, error: 'Incorrect editor password.' });
    }
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(datasetName(e.parameter.dataset));
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const records = rows.slice(1).map(function(row) {
      const record = {};
      headers.forEach(function(header, index) {
        record[header] = row[index] !== undefined ? String(row[index]) : '';
      });
      return record;
    });
    return output({ ok: true, records: records });
  } catch (err) {
    return output({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!validPassword(data.password)) return output({ ok: false, error: 'Unauthorized' });
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(datasetName(data.dataset));
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];

    function column(names) {
      for (let index = 0; index < names.length; index++) {
        const found = headers.indexOf(names[index]);
        if (found >= 0) return found;
      }
      return -1;
    }

    const idColumn = column(['id', 'ID']);
    const statusColumn = column(['status', 'Status']);
    const noteColumn = column(['note', 'Note']);
    const reviewerColumn = column(['reviewed_by', 'Reviewed by']);
    const reviewedAtColumn = column(['reviewed_at', 'Reviewed at']);
    if (idColumn < 0) return output({ ok: false, error: 'ID column not found' });

    for (let index = 1; index < rows.length; index++) {
      if (String(rows[index][idColumn]) === String(data.id)) {
        const sheetRow = index + 1;
        if (statusColumn >= 0) sheet.getRange(sheetRow, statusColumn + 1).setValue(data.status || '');
        if (noteColumn >= 0) sheet.getRange(sheetRow, noteColumn + 1).setValue(data.note || '');
        if (reviewerColumn >= 0) sheet.getRange(sheetRow, reviewerColumn + 1).setValue(data.reviewed_by || '');
        if (reviewedAtColumn >= 0) sheet.getRange(sheetRow, reviewedAtColumn + 1).setValue(new Date().toISOString());
        return output({ ok: true });
      }
    }
    return output({ ok: false, error: 'ID not found' });
  } catch (err) {
    return output({ ok: false, error: err.message });
  }
}

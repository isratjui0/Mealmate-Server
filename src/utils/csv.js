/**
 * Helper to escape CSV cell content
 */
export const escapeCsvField = (field) => {
  if (field === null || field === undefined) {
    return '';
  }
  const stringValue = String(field);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * Generate CSV string from headers and row objects
 * @param {Array<{ key: string, label: string }>} columns
 * @param {Array<Object>} dataRows
 */
export const generateCsv = (columns, dataRows) => {
  const headerLine = columns.map((col) => escapeCsvField(col.label)).join(',');
  const rowLines = dataRows.map((row) => {
    return columns.map((col) => escapeCsvField(row[col.key])).join(',');
  });

  return [headerLine, ...rowLines].join('\r\n');
};

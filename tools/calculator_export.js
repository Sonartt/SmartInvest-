// ========== EXPORT AND SHARING MODULE ==========
// CSV, PDF, Excel export capabilities
// Created: January 29, 2026

/**
 * Export calculation results to CSV
 */
function exportToCSV(data, filename = 'financial_calculation.csv') {
  let csv = '';
  
  // Handle different data formats
  if (Array.isArray(data)) {
    // Array of objects
    if (data.length > 0 && typeof data[0] === 'object') {
      const headers = Object.keys(data[0]);
      csv = headers.join(',') + '\n';
      
      data.forEach(row => {
        csv += headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',') + '\n';
      });
    }
  } else if (typeof data === 'object') {
    // Single object - convert to key-value pairs
    csv = 'Field,Value\n';
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value !== 'object') {
        csv += `${key},${value}\n`;
      } else if (Array.isArray(value)) {
        csv += `${key},"${JSON.stringify(value)}"\n`;
      }
    });
  }
  
  // Create download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export to Excel using SheetJS (xlsx)
 * Requires: <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
 */
function exportToExcel(data, filename = 'financial_calculation.xlsx', sheetName = 'Results') {
  if (typeof XLSX === 'undefined') {
    console.error('SheetJS library not loaded. Include: https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js');
    return;
  }
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  let ws;
  if (Array.isArray(data)) {
    ws = XLSX.utils.json_to_sheet(data);
  } else if (typeof data === 'object') {
    // Convert object to array of key-value pairs
    const arr = Object.entries(data).map(([key, value]) => ({
      Field: key,
      Value: typeof value === 'object' ? JSON.stringify(value) : value
    }));
    ws = XLSX.utils.json_to_sheet(arr);
  }
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate download
  XLSX.writeFile(wb, filename);
}

/**
 * Export multiple calculations to Excel with multiple sheets
 */
function exportMultiSheetExcel(datasets, filename = 'financial_analysis.xlsx') {
  if (typeof XLSX === 'undefined') {
    console.error('SheetJS library not loaded');
    return;
  }
  
  const wb = XLSX.utils.book_new();
  
  // datasets = [{name: 'Summary', data: {...}}, {name: 'Details', data: [...]}, ...]
  datasets.forEach(dataset => {
    let ws;
    if (Array.isArray(dataset.data)) {
      ws = XLSX.utils.json_to_sheet(dataset.data);
    } else {
      const arr = Object.entries(dataset.data).map(([key, value]) => ({
        Field: key,
        Value: typeof value === 'object' ? JSON.stringify(value) : value
      }));
      ws = XLSX.utils.json_to_sheet(arr);
    }
    
    XLSX.utils.book_append_sheet(wb, ws, dataset.name);
  });
  
  XLSX.writeFile(wb, filename);
}

/**
 * Generate PDF report using jsPDF
 * Requires: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
 */
function exportToPDF(title, sections, filename = 'financial_report.pdf') {
  if (typeof window.jspdf === 'undefined') {
    console.error('jsPDF library not loaded. Include: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  let y = 20;
  const lineHeight = 7;
  const pageHeight = doc.internal.pageSize.height;
  
  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(title, 20, y);
  y += lineHeight * 2;
  
  // Date
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
  y += lineHeight * 2;
  
  // Sections
  sections.forEach(section => {
    // Check if we need a new page
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
    
    // Section header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(section.title, 20, y);
    y += lineHeight;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Section content
    if (typeof section.content === 'string') {
      const lines = doc.splitTextToSize(section.content, 170);
      lines.forEach(line => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += lineHeight;
      });
    } else if (Array.isArray(section.content)) {
      // Table data
      section.content.forEach(row => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        
        if (typeof row === 'object') {
          const text = Object.entries(row)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          const lines = doc.splitTextToSize(text, 170);
          lines.forEach(line => {
            doc.text(line, 25, y);
            y += lineHeight;
          });
        } else {
          doc.text(String(row), 25, y);
          y += lineHeight;
        }
      });
    } else if (typeof section.content === 'object') {
      // Key-value pairs
      Object.entries(section.content).forEach(([key, value]) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        
        const displayValue = typeof value === 'number' 
          ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : String(value);
        
        doc.text(`${key}: ${displayValue}`, 25, y);
        y += lineHeight;
      });
    }
    
    y += lineHeight; // Space between sections
  });
  
  // Save
  doc.save(filename);
}

/**
 * Generate shareable link with calculation parameters
 */
function generateShareableLink(calculationType, parameters) {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    calc: calculationType,
    data: btoa(JSON.stringify(parameters)) // Base64 encode
  });
  
  const shareUrl = `${baseUrl}?${params.toString()}`;
  
  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      return shareUrl;
    });
  }
  
  return shareUrl;
}

/**
 * Load calculation from URL parameters
 */
function loadFromShareableLink() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('calc') && params.has('data')) {
    try {
      const calculationType = params.get('calc');
      const data = JSON.parse(atob(params.get('data')));
      
      return {
        type: calculationType,
        parameters: data
      };
    } catch (e) {
      console.error('Error loading shared calculation:', e);
      return null;
    }
  }
  
  return null;
}

/**
 * Save calculation to local storage
 */
function saveCalculationToHistory(calculationType, parameters, result, name = null) {
  const calculation = {
    id: Date.now(),
    type: calculationType,
    name: name || `${calculationType} - ${new Date().toLocaleString()}`,
    parameters,
    result,
    timestamp: new Date().toISOString()
  };
  
  // Get existing history
  let history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
  
  // Add new calculation
  history.unshift(calculation);
  
  // Keep only last 50
  history = history.slice(0, 50);
  
  // Save
  localStorage.setItem('calculationHistory', JSON.stringify(history));
  
  return calculation.id;
}

/**
 * Load calculation history
 */
function loadCalculationHistory(limit = 10) {
  const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
  return history.slice(0, limit);
}

/**
 * Delete calculation from history
 */
function deleteFromHistory(id) {
  let history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
  history = history.filter(calc => calc.id !== id);
  localStorage.setItem('calculationHistory', JSON.stringify(history));
}

/**
 * Clear all history
 */
function clearCalculationHistory() {
  localStorage.removeItem('calculationHistory');
}

/**
 * Email results (requires server-side endpoint)
 */
async function emailResults(email, subject, calculationData) {
  try {
    const response = await fetch('/api/email-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: email,
        subject: subject,
        data: calculationData
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error emailing results:', error);
    throw error;
  }
}

/**
 * Print-friendly format
 */
function printResults(title, data) {
  const printWindow = window.open('', '', 'height=600,width=800');
  
  let html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
          h2 { color: #0066cc; margin-top: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #0066cc; color: white; }
          .number { text-align: right; }
          .footer { margin-top: 30px; font-size: 0.9em; color: #666; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  `;
  
  if (Array.isArray(data)) {
    // Table format
    if (data.length > 0 && typeof data[0] === 'object') {
      html += '<table><thead><tr>';
      Object.keys(data[0]).forEach(key => {
        html += `<th>${key}</th>`;
      });
      html += '</tr></thead><tbody>';
      
      data.forEach(row => {
        html += '<tr>';
        Object.values(row).forEach(value => {
          const isNumber = typeof value === 'number';
          const displayValue = isNumber 
            ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : value;
          html += `<td class="${isNumber ? 'number' : ''}">${displayValue}</td>`;
        });
        html += '</tr>';
      });
      
      html += '</tbody></table>';
    }
  } else if (typeof data === 'object') {
    // Key-value format
    html += '<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>';
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value !== 'object') {
        const isNumber = typeof value === 'number';
        const displayValue = isNumber 
          ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : value;
        html += `<tr><td>${key}</td><td class="${isNumber ? 'number' : ''}">${displayValue}</td></tr>`;
      }
    });
    
    html += '</tbody></table>';
  }
  
  html += `
        <div class="footer">
          <p>SmartInvest Financial Calculator | ${window.location.href}</p>
        </div>
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close</button>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    exportToCSV,
    exportToExcel,
    exportMultiSheetExcel,
    exportToPDF,
    generateShareableLink,
    loadFromShareableLink,
    saveCalculationToHistory,
    loadCalculationHistory,
    deleteFromHistory,
    clearCalculationHistory,
    emailResults,
    printResults
  };
}

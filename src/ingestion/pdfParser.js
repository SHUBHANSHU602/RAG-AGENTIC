const fs = require('fs');
const PDFParser = require('pdf2json');

async function loadPDF(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', errData => reject(errData.parserError));

    pdfParser.on('pdfParser_dataReady', pdfData => {
      const pages = pdfData.Pages || [];
      let fullText = '';

      pages.forEach(page => {
        page.Texts.forEach(textItem => {
          textItem.R.forEach(r => {
              try {
          fullText += decodeURIComponent(r.T.replace(/%(?![0-9A-Fa-f]{2})/g, '%25')) + ' ';
        } catch {
          fullText += r.T + ' '; // fallback: use raw text if decode fails
        }
          });
        });
        fullText += '\n';
      });

      console.log(`Loaded ${pages.length} page(s) from PDF`);

      resolve([{
        pageContent: fullText.trim(),
        metadata: { source: filePath, pages: pages.length }
      }]);
    });

    pdfParser.loadPDF(filePath);
  });
}

module.exports = { loadPDF };
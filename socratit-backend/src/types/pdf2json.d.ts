// Type definitions for pdf2json
declare module 'pdf2json' {
  class PDFParser {
    constructor();

    on(event: 'pdfParser_dataError', callback: (errData: { parserError: string }) => void): void;
    on(event: 'pdfParser_dataReady', callback: (pdfData: any) => void): void;

    loadPDF(pdfFilePath: string): void;
  }

  export = PDFParser;
}

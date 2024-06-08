import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export async function imposeBookletDuplex(inputPath, outputPath) {
  const existingPdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  const totalPages = pdfDoc.getPageCount();
  const blankPageCount = (4 - (totalPages % 4)) % 4;
  for (let i = 0; i < blankPageCount; i++) {
    pdfDoc.addPage();
  }

  const bookletPdfDoc = await PDFDocument.create();
  const newTotalPages = pdfDoc.getPageCount();
  
  for (let i = 0; i < newTotalPages / 4; i++) {
    const [copiedPage1] = await bookletPdfDoc.copyPages(pdfDoc, [newTotalPages - 1 - (i * 2)]);
    const [copiedPage2] = await bookletPdfDoc.copyPages(pdfDoc, [i * 2]);
    const [copiedPage3] = await bookletPdfDoc.copyPages(pdfDoc, [i * 2 + 1]);
    const [copiedPage4] = await bookletPdfDoc.copyPages(pdfDoc, [newTotalPages - 2 - (i * 2)]);
    
    bookletPdfDoc.addPage(copiedPage1);
    bookletPdfDoc.addPage(copiedPage2);
    bookletPdfDoc.addPage(copiedPage3);
    bookletPdfDoc.addPage(copiedPage4);
  }

  const bookletPdfBytes = await bookletPdfDoc.save();
  fs.writeFileSync(outputPath, bookletPdfBytes);
}

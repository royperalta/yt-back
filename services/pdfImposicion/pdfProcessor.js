import fs from 'fs/promises';
import { PDFDocument, rgb } from 'pdf-lib';

// Función para ajustar el brillo y contraste
export async function adjustPdfBrightnessContrast(filePath, brightness, contrast) {
  const existingPdfBytes = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1 - contrast, 1 - contrast, 1 - contrast),
      opacity: brightness
    });
  });

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(filePath, pdfBytes);
}

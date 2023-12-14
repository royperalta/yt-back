import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'fs';

async function removePage(inputPath, outputPath, pagesToRemove) {

  try {
    // Leer el archivo PDF existente
    const pdfBuffer = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Verificar si el índice de la página a eliminar es válido
    /*   if (pageIndexToRemove < 0 || pageIndexToRemove >= pdfDoc.getPageCount()) {
          throw new Error('Índice de página no válido');
      } */
    let errorPage = ""

    // Remove specified pages in reverse order
    pagesToRemove.sort((a, b) => b - a).forEach((pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= pdfDoc.getPageCount()) {
        pdfDoc.removePage(pageNumber - 1); // Adjust for 0-based index
      } else {
        errorPage += `Page ${pageNumber} does not exist in the PDF. `
      }
    });

    // Guardar el nuevo PDF en un archivo de salida
    const modifiedPdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, modifiedPdfBytes);
    return { errorPage: errorPage, status: true }
  } catch (error) {
    return { messageError: error, status: false }
  }

  //console.log(`Página ${pageIndexToRemove + 1} eliminada con éxito`);

}

export { removePage }

// Ejemplo de uso
/* const inputPath = './pdf/book.pdf';
const outputPath = './outputNuevo.pdf';
const pageIndexToRemove = 1; // Índice de la página a eliminar (0-indexed)

removePage(inputPath, outputPath, pageIndexToRemove)
  .catch(error => console.error(error)); */

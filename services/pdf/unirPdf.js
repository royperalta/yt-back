import { PDFDocument } from 'pdf-lib';
import { promises as fsPromises } from 'fs';

async function mergePDFs(pdfPaths, outputPath) {
   try {
    const mergedPdf = await PDFDocument.create();

        for (const file of pdfPaths) {
            const pdfDoc = await PDFDocument.load(file.buffer);

            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        // Guardar el documento fusionado en el servidor
        const mergedPdfBytes = await mergedPdf.save();
       
        await fsPromises.writeFile(outputPath, mergedPdfBytes); 
        return {status:true}
   } catch (error) {
    console.log("error" +error)
    return {status:false}
   }
}

/* // Example usage
const inputPaths = ['path/to/first.pdf', 'path/to/second.pdf'];
const outputPath = 'path/to/merged.pdf';

mergePDFs(inputPaths, outputPath)
    .then(() => console.log('PDFs merged successfully'))
    .catch((error) => console.error('Error merging PDFs:', error)); */
export { mergePDFs }
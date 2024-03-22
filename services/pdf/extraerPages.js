import { PDFDocument } from 'pdf-lib';

async function extraerPaginas(inicio,fin,pdfBuffer) {   

    // Cargar el documento PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Validar que las páginas de inicio y fin son válidas
    if (inicio <= 0 || fin > pdfDoc.getPageCount() || inicio > fin) {
        return res.status(400).json({ error: 'Rango de páginas no válido' });
    }

    // Crear un nuevo documento con las páginas deseadas
    const newPdfDoc = await PDFDocument.create();
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, [inicio - 1], { rotate: 0 });
    copiedPages.forEach((page) => newPdfDoc.addPage(page));

    // Convertir el nuevo documento a base64
    const newPdfBytes = await newPdfDoc.save();
    return newPdfBytes    
}

export { extraerPaginas }
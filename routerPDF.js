import express from "express";
const routerPDF = express.Router()
import multer from "multer";
import { removePage } from "./services/pdf/removePages.js";
import { mergePDFs } from "./services/pdf/unirPdf.js";
import fs from 'fs';
import { extraerPaginas } from "./services/pdf/extraerPages.js";


// Configuración de multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: './pdf/removePDF', // Directorio donde se guardarán los archivos
    filename: function (req, file, cb) {
        // Se renombra el archivo para evitar conflictos
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const storageMerge = multer.memoryStorage();

const uploadMerge = multer({ storage: storageMerge })

// Configurar multer para manejar la carga de archivos
const storagePdf = multer.memoryStorage();
const upLoadPdf = multer({storage:storagePdf})



routerPDF.post('/load', upload.single('file'), async (req, res) => {
    try {


        let removePages = JSON.parse(req.body.removePages)

        let inputPath = `./pdf/removePDF/${req.file.filename}`
        let outputPath = `./pdf-generate/${req.file.filename}`

        let result = await removePage(inputPath, outputPath, removePages)
        console.log(result)
        if (result.status) {
            // console.log(result)
            res.sendFile(`./pdf-generate/${req.file.filename}`, { root: '.' }, (err) => {
                if (err) {
                    res.status(500).send("Error al enviar el archivo")
                } else {
                    fs.unlinkSync(`./pdf/removePDF/${req.file.filename}`)  // borra el archivo una vez
                    fs.unlinkSync(`./pdf-generate/${req.file.filename}`)  // borra el archivo una vez
                }
            })
        } else {
            return res.status(500).json(result)
        }

    } catch (error) {
        res.status(400).json({ error: `Error en la solicitud ${error}` })
    }

})

routerPDF.post('/merge', uploadMerge.array('pdfFiles'), async (req, res) => {
    try {
        const uploadedFiles = req.files;
        const mergedPdfPath = './pdf/unirPDF/merged/pdfUnido.pdf';

        const merge = await mergePDFs(uploadedFiles, mergedPdfPath)

        /* // Crear un nuevo documento PDF fusionando los archivos cargados
        const mergedPdf = await PDFDocument.create();

        for (const file of uploadedFiles) {
            const pdfDoc = await PDFDocument.load(file.buffer);

            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        // Guardar el documento fusionado en el servidor
        const mergedPdfBytes = await mergedPdf.save();
       
        await fsPromises.writeFile(mergedPdfPath, mergedPdfBytes); */

        // Enviar el archivo fusionado como respuesta al cliente
        if (merge.status) {
            console.log("Creado")
            res.sendFile(mergedPdfPath, { root: '.' }, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    // Eliminar el archivo fusionado después de enviarlo
                    //  fs.unlinkSync(mergedPdfPath)
                }
            });
        } else {
            res.status(400).json({ error: 'Error en el método' })
        }
    } catch (error) {
        console.error('Error merging PDFs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

routerPDF.post('/extraer-paginas', upLoadPdf.single('pdfFile'), async (req, res) => {
    try {
        const { inicio, fin } = req.body;
    
        // Obtener el archivo PDF de multer
        const pdfBuffer = req.file.buffer;
    
        extraerPaginas(inicio,fin,pdfBuffer)
        
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
});


export { routerPDF }
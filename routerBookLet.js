import express from 'express';
const routerBookLet = express.Router()
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { imposeBooklet } from './services/pdfImposicion/booklet.js';
import { imposeBookletDuplex } from './services/pdfImposicion/bookletDuplex.js';
import { adjustPdfBrightnessContrast } from './services/pdfImposicion/pdfProcessor.js';

import { PDFDocument, rgb } from 'pdf-lib';


// Configuración de Multer para el almacenamiento del archivo PDF


// Configurar almacenamiento de Multer para cargar archivos
const upload = multer({ dest: 'uploads/' });
// Configurar almacenamiento de Multer para cargar archivos
//const upload = multer({ storage: multer.memoryStorage() });

// Endpoint para cargar el archivo y devolver el archivo reorganizado
routerBookLet.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo');
  }

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `booklet_${req.file.filename}.pdf`);

  try {
    await imposeBooklet(inputPath, outputPath);
    res.download(outputPath, 'booklet.pdf', err => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        res.status(500).send('Error al descargar el archivo');
      }
      // Elimina los archivos temporales después de la descarga
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error('Error al crear el archivo de cuadernillo:', err);
    res.status(500).send('Error al crear el archivo de cuadernillo');
  }
});

routerBookLet.post('/uploadDuplex', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo');
  }

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `booklet_${req.file.filename}.pdf`);

  try {
    await imposeBookletDuplex(inputPath, outputPath);
    res.download(outputPath, 'booklet.pdf', err => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        res.status(500).send('Error al descargar el archivo');
      }
      // Elimina los archivos temporales después de la descarga
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error('Error al crear el archivo de cuadernillo:', err);
    res.status(500).send('Error al crear el archivo de cuadernillo');
  }
});

routerBookLet.post('/changeColor', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo');
  }

  const brightness = parseFloat(req.body.brightness);
  const contrast = parseFloat(req.body.contrast);
  
  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `booklet_${req.file.filename}.pdf`);

  try {
    await adjustPdfBrightnessContrast(inputPath, brightness, contrast);
    await imposeBooklet(inputPath, outputPath);

    res.download(outputPath, 'booklet.pdf', async (err) => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        res.status(500).send('Error al descargar el archivo');
      }
      
      // Elimina los archivos temporales después de la descarga
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (error) {
        console.error('Error al eliminar los archivos temporales:', error);
      }
    });
  } catch (error) {
    console.error('Error al procesar el archivo PDF:', error);
    res.status(500).send('Error al procesar el archivo PDF');
  }
});

routerBookLet.post('/uploadChangeBackground', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo');
  }

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `modified_${req.file.filename}.pdf`);

  try {
    // Leer el archivo PDF
    const existingPdfBytes = fs.readFileSync(inputPath);

    // Cargar el PDF
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Obtener las páginas del documento
    const pages = pdfDoc.getPages();

    // Establecer el fondo para cada página
    pages.forEach((page) => {
      const { width, height } = page.getSize();

      // Dibujar un rectángulo del tamaño de la página con el color de fondo deseado
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(1, 1, 0), // Fondo blanco
      });
    });

    // Guardar el PDF modificado
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    // Enviar el archivo modificado al cliente
    res.download(outputPath, `modified_${req.file.originalname}`, (err) => {
      if (err) {
        console.error('Error al enviar el archivo:', err);
        res.status(500).send('Error al enviar el archivo');
      }

      // Eliminar archivos temporales
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    res.status(500).send('Error al procesar el archivo');
  }
});




export { routerBookLet }
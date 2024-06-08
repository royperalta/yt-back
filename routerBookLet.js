import express from 'express';
const routerBookLet = express.Router()
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { imposeBooklet } from './services/pdfImposicion/booklet.js';
import { imposeBookletDuplex } from './services/pdfImposicion/bookletDuplex.js';

// Configurar almacenamiento de Multer para cargar archivos
const upload = multer({ dest: 'uploads/' });

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






export { routerBookLet }
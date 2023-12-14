import express from "express";
const routerPDF = express.Router()
import multer from "multer";
import fs from 'fs'
import { removePage } from "./services/pdf/removePages.js";



// Configuración de multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: './pdf/', // Directorio donde se guardarán los archivos
    filename: function (req, file, cb) {
        // Se renombra el archivo para evitar conflictos
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });


routerPDF.post('/load', upload.single('file'), async (req, res) => {
    try {
     
       
        let removePages = JSON.parse(req.body.removePages)
       
        let inputPath = `./pdf/${req.file.filename}`
        let outputPath = `./pdf-generate/${req.file.filename}`
        
        let result = await removePage(inputPath, outputPath, removePages)
       
        if (result.status) {
           // console.log(result)
            res.sendFile(`./pdf-generate/${req.file.filename}`, { root: '.' }, (err) => {
                if (err) {
                    res.status(500).send("Error al enviar el archivo")
                } else {
                    fs.unlinkSync(`./pdf/${req.file.filename}`)  // borra el archivo una vez
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


export { routerPDF }
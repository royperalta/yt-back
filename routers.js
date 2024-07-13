import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import { idVideo } from './services/id.js';
import { extraerUrlAudio } from './services/limpiarUrl.js';
import { readdir } from 'fs/promises';
import { crearCarpetaUnica, eliminarCarpetaRecursiva } from './services/crearCarpeta.js';
import isTikTokUrl from './services/validarLink.js';
import { isValidURL } from './services/isValidURL.js';

const router = express.Router();

const ytDlpPath = './extensiones/yt-dlp';
const cookiesPath = './youtube-cookies.txt'; // Ruta al archivo de cookies
const downloadPath = './descargas'; // Ruta a la carpeta de descargas

router.get('/', (req, res) => {
    res.status(200).json({ status: true, message: "envivo.top" });
});

// Ruta para obtener la imagen de un video
router.post('/imagen', async (req, res) => {
    try {
        const link = req.body.url;

        if (!isValidURL(link)) {
            return res.status(400).json({ error: 'URL inválida' });
        }

        const url = extraerUrlAudio(link);
        const args = [
            '--skip-download',
            '--get-thumbnail',
            '--cookies', cookiesPath,
            url,
        ];

        let thumbnailUrl = "";

        const ytDlpProcess = spawn(ytDlpPath, args);

        ytDlpProcess.stdout.on('data', (data) => {
            thumbnailUrl = data.toString().trim();
            console.log(`URL de la miniatura del video: ${thumbnailUrl}`);
            res.status(200).json({ img: thumbnailUrl });
        });

        ytDlpProcess.stderr.on('data', (data) => {
            console.error(`Error al obtener la miniatura: ${data}`);
            res.status(500).json({ error: 'Error al obtener la miniatura' });
        });

        ytDlpProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`El proceso de yt-dlp terminó con código de salida ${code}`);
                res.status(500).json({ error: 'Error en el proceso de yt-dlp' });
            }
        });
    } catch (error) {
        console.error('Error en la solicitud de imagen:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para descargar audio o video
router.post("/descargar", async (req, res) => {
    try {
        const { mp3, link } = req.body;

        if (!isValidURL(link)) {
            return res.status(400).json({ error: 'URL inválida' });
        }

        const idCarpeta = crearCarpetaUnica();
        const urlAudio = extraerUrlAudio(link);

        let outputTemplate = `./descargas/${idCarpeta}/%(title)s - %(id)s.%(ext)s`;

        if (isTikTokUrl(link)) {
            outputTemplate = `./descargas/${idCarpeta}/%(id)s.%(ext)s`;
        }

        const args = [
            '-x', // Descargar audio/video
            '--cookies', cookiesPath,
            ...(mp3 ? ['--audio-format', 'mp3'] : []),
            '--output', outputTemplate,
            urlAudio
        ];

        const ytDlpProcess = spawn(ytDlpPath, args);

        ytDlpProcess.on('close', async (code) => {
            if (code === 0) {
                const titleFile = await findDownloadedFile(idCarpeta);
                res.status(200).json({
                    success: true,
                    message: 'Descarga completada con éxito',
                    id: urlAudio,
                    title: titleFile,
                    idCarpeta: idCarpeta
                });
            } else {
                eliminarCarpetaRecursiva(idCarpeta);
                res.status(500).json({ error: `Error al descargar: ${code}` });
            }
        });

        ytDlpProcess.stderr.on('data', (data) => {
            console.error(`Error en yt-dlp: ${data}`);
            res.status(500).json({ error: 'Error en el proceso de descarga' });
        });

    } catch (error) {
        console.error('Error al descargar:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para descargar archivo por ID
router.get('/download/:id/:idcarpeta/:mp3', (req, res) => {
    try {
        const { id, idcarpeta, mp3 } = req.params;
        const carpetaDescargas = `${downloadPath}/${idcarpeta}`;

        fs.readdir(carpetaDescargas, (err, archivos) => {
            if (err) {
                console.error(`Error al leer la carpeta ${carpetaDescargas}: ${err}`);
                return res.status(500).json({ error: 'Error al leer la carpeta de descargas' });
            }

            const archivoDescarga = archivos.find(archivo => archivo.includes(id) && ((mp3 === 'true') ? archivo.includes('.mp3') : true));

            if (!archivoDescarga) {
                return res.status(404).json({ error: 'Archivo no encontrado' });
            }

            const filePath = `${carpetaDescargas}/${archivoDescarga}`;
            res.download(filePath, (err) => {
                if (err) {
                    console.error(`Error al descargar el archivo ${filePath}: ${err}`);
                    return res.status(500).json({ error: 'Error al descargar el archivo' });
                }
            });
        });
    } catch (error) {
        console.error('Error al descargar archivo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función para encontrar el archivo descargado por ID de carpeta
async function findDownloadedFile(idCarpeta) {
    try {
        const archivos = await readdir(`${downloadPath}/${idCarpeta}`);
        const archivoMp3 = archivos.find(archivo => archivo.includes('.mp3'));
        return encodeURIComponent(archivoMp3);
    } catch (error) {
        console.error('Error al encontrar el archivo descargado:', error);
        throw new Error('Error al encontrar el archivo descargado');
    }
}

export { router };

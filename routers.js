import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import { idVideo } from './services/id.js';
import { extraerUrlAudio } from './services/limpiarUrl.js';
import { readdir } from 'fs/promises';
import { crearCarpetaUnica } from './services/crearCarpeta.js';
import isTikTokUrl from './services/validarLink.js';
import { isValidURL } from './services/isValidURL.js';

const router = express.Router();
const ytDlpPath = './extensiones/yt-dlp';
const cookiesPath = './youtube-cookies.txt';

router.get('/', (req, res) => {
    res.status(200).json({ status: true, message: "envivo.top" });
});

router.post('/imagen', async (req, res) => {
    const link = req.body.url;

    if (!isValidURL(link)) {
        console.log("Error con la URL");
        return res.status(400).json({ error: 'Link inválido' });
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
        res.status(400).json({ error: 'Error al obtener la miniatura' });
    });

    ytDlpProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`El proceso de yt-dlp terminó con código de salida ${code}`);
        }
    });
});

router.post("/descargar", async (req, res) => {
    try {
        const { mp3, link } = req.body;
        const idCarpeta = crearCarpetaUnica();

        let outputTemplate;
        let downloadFunction;

        if (mp3) {
            if (isTikTokUrl(link)) {
                outputTemplate = `./descargas/${idCarpeta}/%(id)s.%(ext)s`;
                downloadFunction = downloadAudioTiktok;
            } else {
                outputTemplate = `./descargas/${idCarpeta}/%(title)s - %(id)s.%(ext)s`;
                downloadFunction = downloadAudio;
            }
        } else {
            if (isTikTokUrl(link)) {
                outputTemplate = `./descargas/${idCarpeta}/%(id)s.%(ext)s`;
                downloadFunction = downloadVideoTiktok;
            } else {
                outputTemplate = `./descargas/${idCarpeta}/%(title)s - %(id)s.%(ext)s`;
                downloadFunction = downloadVideo;
            }
        }

        const videoId = await getVideoId(ytDlpPath, link, idCarpeta);
        await downloadFunction(ytDlpPath, link, '--output', outputTemplate);

        const titleFile = await findDownloadedFile(videoId, idCarpeta);

        const response = {
            success: true,
            message: 'Descarga completada con éxito',
            id: videoId,
            title: titleFile,
            idCarpeta: idCarpeta
        };

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(400).send(`Se produjo un error: ${error.message || error}`);
    }
});

router.get('/download/:id/:idcarpeta/:mp3', async (req, res) => {
    try {
        const { id, idcarpeta, mp3 } = req.params;

        const carpetaPath = `./descargas/${idcarpeta}`;

        fs.readdir(carpetaPath, (err, archivos) => {
            if (err) {
                console.error('Error al leer la carpeta de descarga:', err);
                return res.status(500).json({ error: 'Error al leer la carpeta de descarga' });
            }

            const archivoEncontrado = archivos.find(archivo => archivo.includes(id) && archivo.includes(mp3 === 'true' ? '.mp3' : '.mp4'));

            if (!archivoEncontrado) {
                return res.status(404).json({ error: 'Archivo no encontrado' });
            }

            res.download(`${carpetaPath}/${archivoEncontrado}`);
        });
    } catch (error) {
        console.error('Error al descargar el archivo:', error);
        res.status(500).json({ error: 'Error al descargar el archivo' });
    }
});

router.post('/image', async (req, res) => {
    try {
        const { url } = req.body;
        const id = await idVideo(url);
        const outputImage = `./descargas/%(id)s.%(ext)s`;

        const commandImage = spawn(ytDlpPath, [
            '--skip-download', '--write-thumbnail', '-o', outputImage, '--cookies', cookiesPath, url
        ]);

        commandImage.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        commandImage.on('close', (code) => {
            if (code === 0) {
                console.log("Descarga de imagen exitosa");
                res.status(200).json({ id: id });
            } else {
                console.error(`Error al descargar imagen. Código de salida: ${code}`);
                res.status(500).json({ error: 'Error al descargar imagen' });
            }
        });
    } catch (error) {
        console.error('Error al procesar la solicitud de imagen:', error);
        res.status(400).json({ error: 'Error al procesar la solicitud de imagen' });
    }
});

router.post('/eliminar', async (req, res) => {
    try {
        const { idCarpeta } = req.body;
        eliminarCarpetaRecursiva(idCarpeta);
        res.status(200).json({ message: 'Carpeta eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar la carpeta:', error);
        res.status(500).json({ error: 'Error al eliminar la carpeta' });
    }
});

function eliminarCarpetaRecursiva(idCarpeta) {
    try {
        const carpetaPath = `./descargas/${idCarpeta}`;

        if (fs.existsSync(carpetaPath)) {
            fs.readdirSync(carpetaPath).forEach(archivo => {
                const filePath = `${carpetaPath}/${archivo}`;
                if (fs.lstatSync(filePath).isDirectory()) {
                    eliminarCarpetaRecursiva(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            });
            fs.rmdirSync(carpetaPath);
            console.log(`Carpeta ${idCarpeta} eliminada`);
        } else {
            console.log(`La carpeta ${idCarpeta} no existe`);
        }
    } catch (error) {
        console.error(`Error al eliminar la carpeta ${idCarpeta}:`, error);
    }
}

async function getVideoId(ytDlpPath, link, idCarpeta) {
    try {
        const commandId = spawn(ytDlpPath, ['-x', '--get-id', '--cookies', cookiesPath, link]);
        let videoId = '';

        commandId.stdout.on('data', (data) => {
            videoId += data.toString().replace('\n', '');
        });

        return new Promise((resolve, reject) => {
            commandId.on('close', (code) => {
                if (code === 0) {
                    resolve(videoId);
                } else {
                    eliminarCarpetaRecursiva(idCarpeta);
                    reject(new Error(`Error al obtener el ID del video. Código de salida: ${code}`));
                }
            });

            commandId.on('error', (err) => {
                console.error(`Error al iniciar el proceso: ${err.message}`);
                reject(err);
            });
        });
    } catch (error) {
        throw new Error(`Se produjo un error: ${error.message || error}`);
    }
}

async function downloadAudio(ytDlpPath, link, outputOption, outputTemplate) {
    try {
        const command = spawn(ytDlpPath, [
            '-x', '--audio-format', 'mp3',
            outputOption, outputTemplate,
            '--cookies', cookiesPath,
            link
        ]);

        return new Promise((resolve, reject) => {
            command.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Error al descargar el audio: ${code}`));
                }
            });

            command.on('error', (error) => {
                reject(new Error(`Error al ejecutar el comando: ${error.message}`));
            });
        });
    } catch (error) {
        throw new Error(`Se produjo un error: ${error.message || error}`);
    }
}

async function downloadVideo(ytDlpPath, link, outputOption, outputTemplate) {
    try {
        const command = spawn(ytDlpPath, [
            outputOption, outputTemplate,
            '--cookies', cookiesPath,
            link
        ]);

        return new Promise((resolve, reject) => {
            command.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Error al descargar el video: ${code}`));
                }
            });

            command.on('error', (error) => {
                reject(new Error(`Error al ejecutar el comando: ${error.message}`));
            });
        });
    } catch (error) {
        throw new Error(`Se produjo un error: ${error.message || error}`);
    }
}

async function downloadAudioTiktok(ytDlpPath, link, outputOption, outputTemplate) {
    try {
        const command = spawn(ytDlpPath, [
            '--audio-format', 'mp3',
            outputOption, outputTemplate,
            '--cookies', cookiesPath,
            link
        ]);

        return new Promise((resolve, reject) => {
            command.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Error al descargar el audio de TikTok: ${code}`));
                }
            });

            command.on('error', (error) => {
                reject(new Error(`Error al ejecutar el comando: ${error.message}`));
            });
        });
    } catch (error) {
        throw new Error(`Se produjo un error: ${error.message || error}`);
    }
}

async function downloadVideoTiktok(ytDlpPath, link, outputOption, outputTemplate) {
    try {
        const command = spawn(ytDlpPath, [
            outputOption, outputTemplate,
            '--cookies', cookiesPath,
            link
        ]);

        return new Promise((resolve, reject) => {
            command.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Error al descargar el video de TikTok: ${code}`));
                }
            });

            command.on('error', (error) => {
                reject(new Error(`Error al ejecutar el comando: ${error.message}`));
            });
        });
    } catch (error) {
        throw new Error(`Se produjo un error: ${error.message || error}`);
    }
}

async function findDownloadedFile(videoId, idCarpeta) {
    try {
        const carpetaPath = `./descargas/${idCarpeta}`;

        const archivos = await readdir(carpetaPath);
        const archivoEncontrado = archivos.find(archivo => archivo.includes(videoId));

        if (!archivoEncontrado) {
            throw new Error('Archivo no encontrado');
        }

        return archivoEncontrado;
    } catch (error) {
        throw new Error(`Se produjo un error al encontrar el archivo: ${error.message || error}`);
    }
}

export default router;

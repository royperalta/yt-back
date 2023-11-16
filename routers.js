import express from 'express'
import { spawn } from 'child_process'
import fs from 'fs'

import { idVideo } from './services/id.js'
import path from 'path'
import { extraerUrlAudio } from './services/limpiarUrl.js'
import { readdir } from 'fs/promises'
const router = express.Router()
const ytDlpPath = './extensiones/yt-dlp';
const downloadPath = './descargas'

////INICIA NUEVO--------------------

router.post('/imagen', async (req, res) => {


    const { url } = req.body
    // Reemplaza 'URL_DEL_PLAYLIST' con la URL real del playlist de YouTube que deseas analizar.h

    // Ejemplo de uso: const urlCompleta = url;
    const urlAudio = extraerUrlAudio(url);
    console.log(urlAudio)
    // Resultado: https://youtu.be/wXhTHyIgQ_U

    // Ruta al archivo yt-dlp.exe


    // Argumentos para yt-dlp (obtener títulos de un playlist)
    const args = [
        '--skip-download',
        '--get-thumbnail',
        urlAudio,
    ];
    let thumbnailUrl = ""
    // Crear el proceso de yt-dlp
    const ytDlpProcess = spawn(ytDlpPath, args);

    // Capturar la salida estándar
    ytDlpProcess.stdout.on('data', (data) => {
        thumbnailUrl = data.toString().trim();
        console.log(`URL de la miniatura del video: ${thumbnailUrl}`);
        res.status(200).json({ img: thumbnailUrl })
        // Puedes hacer lo que desees con la URL de la miniatura aquí
    });

    // Capturar errores
    ytDlpProcess.stderr.on('data', (data) => {
        console.error(`Error al obtener la miniatura: ${data}`);
    });

    // Manejar la finalización del proceso
    ytDlpProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`El proceso de yt-dlp terminó con código de salida ${code}`);
        }
    });


})


/* router.post("/descargar", (req, res) => {
    const { link } = req.body
    // Ejemplo de uso: const urlCompleta = url;
    const urlAudio = extraerUrlAudio(link);
    // Resultado: https://youtu.be/wXhTHyIgQ_U

    // Ruta al archivo yt-dlp.exe
    const ytDlpPath = './extensiones/yt-dlp';

    // Definir el formato de salida y la ruta de descarga
    const outputFormat = '--audio-format';
    const formatType = 'mp3';

    const outputOption = '--output';
    const downloadPath = 'descargas/';
    const outputTemplate = `${downloadPath}/%(title)s - %(id)s.%(ext)s`;

    //Obtener el ID
    const commandId = spawn(ytDlpPath, [
        '-x', '--get-id', // Descargar solo el audio    
        urlAudio // La URL del video de YouTube
    ]);

    const commandTitle = spawn(ytDlpPath, [
        '-x', '--no-warnings', '--get-filename',
        urlAudio
    ]);

    let title = ``
    commandTitle.stdout.on('data', (data) => {
        title = decodeURIComponent(data.toString().trim().split('.')[0]);
        console.log(title);
    });

    commandTitle.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    // Crear el comando para descargar el audio con yt-dlp
    const command = spawn(ytDlpPath, [
        '-x', // Descargar solo el audio
        outputFormat, formatType, // Definir el formato de salida

        outputOption, outputTemplate, // Definir la ruta de descarga
        urlAudio // La URL del video de YouTube
    ]);

    // Mostrar la salida de yt-dlp en la consola
    let videoId = ``
    commandId.stdout.on('data', (data) => {
        videoId += data.toString().replace('\n', '');
    })

    command.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    // Mostrar los errores en la consola
    command.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    // Cuando el proceso finaliza, enviar una respuesta al cliente
    command.on('close', async (code) => {

        if (code === 0) {

            const archivos = await fs.promises.readdir('./descargas');
            let titleFile = null;

            archivos.forEach(archivo => {
                if (archivo.includes(videoId) && archivo.includes('.mp3')) {
                    titleFile = encodeURIComponent(archivo);
                }
            });

            const response = {
                success: true,
                message: 'Descarga completada con éxito',
                id: `${videoId}`,
                title: `${titleFile}`
            };
            res.json(response);
        } else {
            res.status(500).send(`Se produjo un error: ${code}`);
        }
    });


}) */


router.post("/descargar", async (req, res) => {
    try {
        const { link } = req.body;

        const urlAudio = extraerUrlAudio(link);
        const ytDlpPath = './extensiones/yt-dlp'; // Reemplaza con la ruta absoluta a yt-dlp

        const outputFormat = '--audio-format';
        const formatType = 'mp3';
        const outputOption = '--output';
        const downloadPath = '/ruta/absoluta/a/descargas'; // Reemplaza con la ruta absoluta a la carpeta de descargas
        const outputTemplate = `${downloadPath}/%(title)s - %(id)s.%(ext)s`;

        const videoId = await getVideoId(ytDlpPath, urlAudio);
        const title = await getVideoTitle(ytDlpPath, urlAudio);

        await downloadAudio(ytDlpPath, urlAudio, outputFormat, formatType, outputOption, outputTemplate);

        const titleFile = await findDownloadedFile(videoId, downloadPath);

        const response = {
            success: true,
            message: 'Descarga completada con éxito',
            id: videoId,
            title: titleFile
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send(`Se produjo un error: ${error.message || error}`);
    }
});


////-----------------------------------------------ANTIGUO INICIA ---------------

router.post('/download', async (req, res) => {
    try {
        // Obtener la URL del cuerpo de la solicitud


        const link = req.body.url;
        const url = extraerUrlAudio(link)
        // Obtener el ID
        const videoId = await getVideoId(ytDlpPath, url);

        // Crear el comando para descargar el audio con yt-dlp
        const title = await getVideoTitle(ytDlpPath, url);

        await downloadAudio(ytDlpPath, url);

        // Obtener el título del archivo descargado
        const titleFile = await findDownloadedFile(videoId);

        const response = {
            success: true,
            message: 'Descarga completada con éxito',
            id: videoId,
            title: title
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send(`Se produjo un error: ${error.message || error}`);
    }
});

async function getVideoId(ytDlpPath, url) {
    const commandId = spawn(ytDlpPath, ['-x', '--get-id', url]);
    return new Promise((resolve, reject) => {
        let videoId = '';
        commandId.stdout.on('data', (data) => {
            videoId += data.toString().replace('\n', '');
        });

        commandId.on('close', (code) => {
            if (code === 0) {
                resolve(videoId);
            } else {
                reject(new Error(`Error al obtener el ID del video: ${code}`));
            }
        });
    });
}

async function getVideoTitle(ytDlpPath, url) {
    const commandTitle = spawn(ytDlpPath, ['-x', '--no-warnings', '--get-filename', url]);
    return new Promise((resolve, reject) => {
        let title = '';
        commandTitle.stdout.on('data', (data) => {
            title = decodeURIComponent(data.toString().trim().split('.')[0]);
        });

        commandTitle.on('close', (code) => {
            if (code === 0) {
                resolve(title);
            } else {
                reject(new Error(`Error al obtener el título del video: ${code}`));
            }
        });
    });
}

async function downloadAudio(ytDlpPath, url) {
    const outputFormat = '--audio-format';
    const formatType = 'mp3';
    const outputOption = '--output';
    const outputTemplate = `${downloadPath}/%(title)s - %(id)s.%(ext)s`;

    const command = spawn(ytDlpPath, [
        '-x',
        outputFormat, formatType,
        outputOption, outputTemplate,
        url
    ]);

    return new Promise((resolve, reject) => {
        command.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Error al descargar el audio: ${code}`));
            }
        });
    });
}

async function findDownloadedFile(videoId) {
    const archivos = await readdir(downloadPath);
    let titleFile = null;

    archivos.forEach((archivo) => {
        if (archivo.includes(videoId) && archivo.includes('.mp3')) {
            titleFile = encodeURIComponent(archivo);
        }
    });

    return titleFile;
}

/* router.post('/download', (req, res) => {
    // Obtener la URL del cuerpo de la solicitud
    const { url } = req.body;

    // Definir el formato de salida y la ruta de descarga
    const outputFormat = '--audio-format';
    const formatType = 'mp3';

    const outputOption = '--output';
    const downloadPath = 'descargas/';
    const outputTemplate = `${downloadPath}/%(title)s - %(id)s.%(ext)s`;

    //Obtener el ID
    const commandId = spawn('yt-dlp', [
        '-x', '--get-id', // Descargar solo el audio    
        url // La URL del video de YouTube
    ]);

    const commandTitle = spawn('yt-dlp', [
        '-x', '--no-warnings', '--get-filename',
        url
    ]);

    let title = ``
    commandTitle.stdout.on('data', (data) => {
        title = decodeURIComponent(data.toString().trim().split('.')[0]);
        console.log(title);
    });

    commandTitle.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    // Crear el comando para descargar el audio con yt-dlp
    const command = spawn('yt-dlp', [
        '-x', // Descargar solo el audio
        outputFormat, formatType, // Definir el formato de salida

        outputOption, outputTemplate, // Definir la ruta de descarga
        url // La URL del video de YouTube
    ]);

    // Mostrar la salida de yt-dlp en la consola
    let videoId = ``
    commandId.stdout.on('data', (data) => {
        videoId += data.toString().replace('\n', '');
    })

    command.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    // Mostrar los errores en la consola
    command.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    // Cuando el proceso finaliza, enviar una respuesta al cliente
    command.on('close', async (code) => {

        if (code === 0) {

            const archivos = await fs.promises.readdir('./descargas');
            let titleFile = null;

            archivos.forEach(archivo => {
                if (archivo.includes(videoId) && archivo.includes('.mp3')) {
                    titleFile = encodeURIComponent(archivo);
                }
            });

            const response = {
                success: true,
                message: 'Descarga completada con éxito',
                id: `${videoId}`,
                title: `${titleFile}`
            };
            res.json(response);
        } else {
            res.status(500).send(`Se produjo un error: ${code}`);
        }
    });

}) */

router.get('/download/:filename', (req, res) => {
    try {
        const filePath = `${req.params.filename}`
        fs.readdir('./descargas', (err, archivos) => {
            if (err) throw err;
            archivos.forEach(archivo => {
                if (archivo.includes(filePath) && archivo.includes('.mp3')) {
                    //console.log(`./descargas/${archivo}`)
                    //console.log(encodeURIComponent(filePath))
                    // res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(archivo)}"`);
                    res.download(`./descargas/${archivo}`)
                    return;
                }
            })
        })
    } catch (error) {
        console.log(error)
    }
    // res.download(filePath)

})
router.post('/image/', async (req, res) => {
    console.log("fgdfg")
    const { url } = req.body
    let id = await idVideo(url)
    console.log('id', id)
    const downloadPath = 'descargas/';
    const outputImage = `${downloadPath}/%(id)s.%(ext)s`;
    const thumbnailOption = '--write-thumbnail';
    const outputOption = '--output';

    /*   const commandImage = spawn('yt-dlp', [
          thumbnailOption, outputOption, outputImage, url
      ]) */

    const commandImage = spawn('yt-dlp', [
        '--skip-download', '--write-thumbnail', '-o', outputImage, url
    ])
    commandImage.stdout.on('data', (data) => {
        console.log(data.toString())
    })

    commandImage.on('close', async (code) => {
        if (code === 0) {
            console.log("Exitosos")
            res.status(200).json({ id: id })
        }
    })

})

router.post('/eliminar', async (req, res) => {
    try {
        const id = req.body.id;

        // Validar que el ID proporcionado es seguro (por ejemplo, evitar manipulación de directorios)
        if (!id || id.includes('..')) {
            return res.status(400).send('ID inválido');
        }

        const dirPath = './descargas';
        const files = await fs.promises.readdir(dirPath);

        const filesToDelete = files.filter((file) => file.includes(id));

        if (filesToDelete.length === 0) {
            return res.status(404).send(`No se encontraron archivos con id ${id}`);
        }

        for (const file of filesToDelete) {
            const filePath = path.join(dirPath, file);
            await fs.promises.unlink(filePath);
            console.log(`El archivo ${file} ha sido eliminado correctamente.`);
        }

        res.send(`Archivo(s) con id ${id} eliminado(s) correctamente.`);
    } catch (error) {
        console.error('Error al eliminar el archivo:', error.message);
        res.status(500).send('Error interno del servidor al eliminar el archivo.');
    }
});






export { router }


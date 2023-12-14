import express from 'express'
import { spawn } from 'child_process'
import fs from 'fs'
import { idVideo } from './services/id.js'
import { extraerUrlAudio } from './services/limpiarUrl.js'
import { readdir } from 'fs/promises'
import { crearCarpetaUnica } from './services/crearCarpeta.js'
import isTikTokUrl from './services/validarLink.js'
import { isValidURL } from './services/isValidURL.js'
const router = express.Router()
const ytDlpPath = './extensiones/yt-dlp';

////INICIA NUEVO--------------------

router.get('/',(req,res)=>{
    res.status(200).json({status:true,message:"envivo.top"})
})

router.post('/imagen', async (req, res) => {
    const link = req.body.url

    if (!isValidURL(link)) {
        console.log("error con la url")
        return res.status(400).json({ error: 'link inválido' })
    }

    const url = extraerUrlAudio(link)
    const args = [
        '--skip-download',
        '--get-thumbnail',
        url,
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
    try {
        ytDlpProcess.stderr.on('data', (data) => {
            try {
                console.error(`Error al obtener la miniatura: ${data}`);
            } catch (error) {

            }
        });
    } catch (error) {
        res.status(400).send({ "error": data });
    }

    try {
        // Manejar la finalización del proceso
        ytDlpProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`El proceso de yt-dlp terminó con código de salida ${code}`);

            }
        });
    } catch (error) {
        res.status(400).send({ "error": error });
    }


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
        const { mp3 } = req.body;
        const link = extraerUrlAudio(req.body.link)
        if (mp3) {
            let idCarpeta = crearCarpetaUnica()
            // const urlAudio = extraerUrlAudio(link);
            const ytDlpPath = './extensiones/yt-dlp'; // Reemplaza con la ruta absoluta a yt-dlp

            const outputFormat = '--audio-format';
            const formatType = 'mp3';
            const outputOption = '--output';
            //const downloadPath = './descargas'; // Reemplaza con la ruta absoluta a la carpeta de descargas
            

            const videoId = await getVideoId(ytDlpPath, link,idCarpeta);
            //const title = await getVideoTitle(ytDlpPath, urlAudio);

            if (isTikTokUrl(link)) {
                console.log("Por tiktok mp3")
                const outputTemplate = `./descargas/${idCarpeta}/%(id)s.%(ext)s`;
                try {
                    await downloadAudioTiktok(ytDlpPath, link, outputFormat, formatType, outputOption, outputTemplate);
                } catch (error) {
                    eliminarCarpetaRecursiva(idCarpeta)
                    return res.status(400).json({ error: error })
                }
            } else {
                const outputTemplate = `./descargas/${idCarpeta}/%(title)s - %(id)s.%(ext)s`;
                try {
                    await downloadAudio(ytDlpPath, link, outputFormat, formatType, outputOption, outputTemplate);
                } catch (error) {
                    eliminarCarpetaRecursiva(idCarpeta)
                    return res.status(400).json({ error: error })
                }

            }


            const titleFile = await findDownloadedFile(videoId, idCarpeta);
            console.log(titleFile)
            const response = {
                success: true,
                message: 'Descarga completada con éxito',
                id: videoId,
                title: titleFile,
                idCarpeta: idCarpeta
            };

            return res.status(200).json(response);
        } else {

            if (isTikTokUrl(link)) {
                let idCarpeta = crearCarpetaUnica()
                //await downloadAudio(ytDlpPath, link, outputOption, outputTemplate);
                try {
                    console.log("Video de tiktok")
                    
                    // const urlAudio = extraerUrlAudio(link);
                    const ytDlpPath = './extensiones/yt-dlp'; // Reemplaza con la ruta absoluta a yt-dlp
                    //const formatType = 'mp3';
                    const outputOption = '--output';

                    const outputTemplate = `./descargas/${idCarpeta}/%(id)s.%(ext)s`;

                    const videoId = await getVideoId(ytDlpPath, link);
                    const title = await getVideoTitle(ytDlpPath, link);
                    console.log("Descargar video de tiktok")
                    await downloadVideoTiktok(ytDlpPath, link, outputOption, outputTemplate)
                    const titleFile = await findDownloadedFile(videoId, idCarpeta);
                    const response = {
                        success: true,
                        message: 'Descarga completada con éxito',
                        id: videoId,
                        title: titleFile,
                        idCarpeta: idCarpeta
                    };

                    return res.status(200).json(response);
                } catch (error) {
                    eliminarCarpetaRecursiva(idCarpeta)
                    return res.status(400).json({ error: error })
                }




            } else {
                let idCarpeta = crearCarpetaUnica()
                // const urlAudio = extraerUrlAudio(link);
                try {
                    const ytDlpPath = './extensiones/yt-dlp'; // Reemplaza con la ruta absoluta a yt-dlp
                //const formatType = 'mp3';
                const outputOption = '--output';

                const outputTemplate = `./descargas/${idCarpeta}/%(title)s - %(id)s.%(ext)s`;

                const videoId = await getVideoId(ytDlpPath, link);


                //await downloadAudio(ytDlpPath, link, outputOption, outputTemplate);
                await downloadVideo(ytDlpPath, link, outputOption, outputTemplate)
                const titleFile = await findDownloadedFile(videoId, idCarpeta);
                console.log(titleFile)
                const response = {
                    success: true,
                    message: 'Descarga completada con éxito',
                    id: videoId,
                    title: titleFile,
                    idCarpeta: idCarpeta
                };

                res.json(response);
                } catch (error) {
                    eliminarCarpetaRecursiva(idCarpeta)
                    return res.status(400).json({error:error})
                }
            }

        }

    } catch (error) {
        console.error(error);
        res.status(400).send(`Se produjo un error: ${error.message || error}`);
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
        res.status(400).json(`Se produjo un error: ${error.message || error}`);
    }
});

async function getVideoId(ytDlpPath, url,idCarpeta) {

    const commandId = spawn(ytDlpPath, ['-x', '--get-id', url]);
    return new Promise((resolve, reject) => {
        let videoId = '';

        // Capturar mensajes de stdout
        commandId.stdout.on('data', (data) => {
            videoId += data.toString().replace('\n', '');
        });

        // Capturar mensajes de stderr (puede ser útil para manejar mensajes de error)
        commandId.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        // Manejar el cierre del proceso
        commandId.on('close', (code) => {
            if (code === 0) {
                resolve(videoId);
            } else {
                eliminarCarpetaRecursiva(idCarpeta)
                reject(new Error(`Error al obtener el ID del video. Código de salida: ${code}`));
                return new Error
            }
        });

        // Manejar errores al iniciar el proceso
        commandId.on('error', (err) => {
            console.error(`Error al iniciar el proceso: ${err.message}`);
            reject(err);
        });
    });

}

async function getVideoTitle(ytDlpPath, url) {
    try {
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
                    res.status(400).json({ "error": "error" });
                }
            });
        });
    } catch (error) {
        res.status(500).send(`Se produjo un error: ${error.message || error}`);
    }
}

async function downloadAudio(ytDlpPath, link, outputFormat, formatType, outputOption, outputTemplate) {

    try {
        const command = spawn(ytDlpPath, [
            '-x',
            outputFormat, formatType,
            outputOption, outputTemplate,
            link
        ]);

        return new Promise((resolve, reject) => {
            command.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Error al descargar el audio: ${code}`));
                    res.status(400).json({ "error": "error" });
                }
            });
        });
    } catch (error) {
        res.status(500).send(`Se produjo un error: ${error.message || error}`);
    }
}

async function findDownloadedFile(videoId, idCarpeta) {
    try {
        const archivos = await readdir(`./descargas/${idCarpeta}`);
        let titleFile = null;

        archivos.forEach((archivo) => {
            if (archivo.includes(videoId)) {
                titleFile = encodeURIComponent(archivo);
            }
        });

        return titleFile;
    } catch (error) {
        res.status(400).json(`Se produjo un error: ${error.message || error}`);
    }
}

async function downloadVideo(ytDlpPath, link, outputOption, outputTemplate) {
    try {
        console.log(ytDlpPath, link, outputTemplate)
        const command = spawn(ytDlpPath, [
            link,'-f', 'mp4', outputOption, outputTemplate
        ])
        console.log("Estoy aqui")
        return new Promise((resolve, reject) => {
            command.on('close', (code) => {
                if (code === 0) {
                    resolve()
                } else {
                    reject(new Error(`Error al descargar audio ${code}`))
                    res.status(500).send({ "error": "error" });
                }
            })
        })
    } catch (error) {
        res.status(500).send(`Se produjo un error: ${error.message || error}`);
    }
}

async function downloadVideoTiktok(ytDlpPath, link, outputOption, outputTemplate) {
    console.log("Ejecutando comando");

    const commandArgs = [
        '--replace-in-metadata', 'title', '[^a-zA-Z0-9]', ' ',
        link, outputOption, outputTemplate
    ];
    console.log(`Ejecutando comando: ${ytDlpPath} ${commandArgs.join(' ')}`);
    const command = spawn(ytDlpPath, commandArgs);

    // Capturar y mostrar la salida estándar en tiempo real
    command.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    // Capturar y mostrar la salida de error en tiempo real
    command.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    return new Promise((resolve, reject) => {
        command.on('close', (code) => {
            if (code === 0) {
                console.log(`Código de salida: ${code}`);
                resolve();
            } else {
                console.error(`Fallo descarga. Código de salida: ${code}`);
                reject(new Error(`Error al descargar video ${code}`));
            }
        });
    });
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

router.get('/download/:id/:idcarpeta/:mp3', (req, res) => {
    console.log(req.params.mp3)
    try {
        const { mp3 } = req.params
        console.log("Es mp3", mp3)
        if (mp3 === 'true') {
            const fileId = `${req.params.id}`
            const idCarpeta = `${req.params.idcarpeta}`

            fs.readdir(`./descargas/${idCarpeta}`, (err, archivos) => {
                if (err) throw err;
                archivos.forEach(archivo => {
                    console.log("RESTST")
                    if (archivo.includes(fileId) && archivo.includes('.mp3')) {
                        res.download(`./descargas/${idCarpeta}/${archivo}`)
                        return
                    } else {
                        res.status(500).send({ "error": "error" });
                    }
                })
            })
        } else {
            try {
                const fileId = `${req.params.id}`
                const idCarpeta = `${req.params.idcarpeta}`
                console.log("Estoy por aqui")
                fs.readdir(`./descargas/${idCarpeta}`, (err, archivos) => {
                    if (err) throw err;
                    archivos.forEach(archivo => {
                        const filePath = `./descargas/${idCarpeta}/${archivo}`
                        if (fs.existsSync(filePath.normalize())) {
                            console.log("Estoy aqui")
                            return res.download(filePath)
                        } else {
                            console.log(`no de encontro el archivo ${filePath}`)
                            res.status(400).send({ "error": "error" });
                        }
                    })
                })
            } catch (error) {
                console.log("Error de archivo")
            }
        }
    } catch (error) {
        res.status(400).json({ error: error })
    }
    // res.download(filePath)

})
router.post('/image/', async (req, res) => {
    try {
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
            } else {
                res.status(500).send({ "error": "error" });
            }
        })
    } catch (error) {
        res.status(400).json({ error: error })
    }

})

router.post('/eliminar', async (req, res) => {
    try {

        const { idCarpeta } = req.body

        eliminarCarpetaRecursiva(idCarpeta)
        /* const id = req.body.id;

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

        res.send(`Archivo(s) con id ${id} eliminado(s) correctamente.`); */
    } catch (error) {
        console.error('Error al eliminar el archivo:', error.message);
        res.status(500).send('Error interno del servidor al eliminar el archivo.');
    }
});


function eliminarCarpetaRecursiva(idCarpeta) {

    try {
        const ruta = `./descargas/${idCarpeta}`
        if (fs.existsSync(ruta)) {
            fs.readdirSync(ruta).forEach((archivo, index) => {
                const file = `${ruta}/${archivo}`
                if (fs.lstatSync(file).isDirectory()) {//si es una carpeta recursividad
                    eliminarCarpetaRecursiva(file)
                } else {
                    fs.unlinkSync(file)
                }
            })
            fs.rmdirSync(ruta)
            console.log("carpeta eliminada")
        } else {
            console.log("no existe la carpeta")
        }
    } catch (error) {
        res.status(500).send({ error: error });
    }

}

function downloadAudioTiktok(ytDlpPath, link, outputFormat, formatType, outputOption, outputTemplate) {
    try {
        const command = spawn(ytDlpPath, [
            '-x', '--replace-in-metadata', 'title,uploader', '[^a-zA-Z0-9]', '',
            outputFormat, formatType,
            outputOption, outputTemplate,
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
        });
    } catch (error) {
        return error
    }

}


export { router }


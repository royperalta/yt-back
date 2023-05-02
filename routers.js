import express from 'express'
import { exec, spawn } from 'child_process'
import fs from 'fs'
import { stderr, stdout } from 'process'
import iconv from 'iconv-lite'
import { idVideo } from './services/id.js'
const router = express.Router()

router.post('/download', (req, res) => {
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

})

router.get('/downloads/:filename', (req, res) => {
    const filePath = `${req.params.filename}`
    fs.readdir('./descargas', (err, archivos) => {
        if (err) throw err;
        archivos.forEach(archivo => {
            if (archivo.includes(filePath) && archivo.includes('.mp3')) {
                //console.log(`./descargas/${archivo}`)
                //console.log(encodeURIComponent(filePath))
                // res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(archivo)}"`);
                res.download(`./descargas/${archivo}`)
            }
        })
    })
    // res.download(filePath)

})
router.post('/image/', async (req, res) => {
    const { url } = req.body
    let id =await  idVideo(url)
    console.log('id',id)
    const downloadPath = 'descargas/';
    const outputImage = `${downloadPath}/%(id)s.%(ext)s`;
    const thumbnailOption = '--write-thumbnail';
    const outputOption = '--output';

  /*   const commandImage = spawn('yt-dlp', [
        thumbnailOption, outputOption, outputImage, url
    ]) */

    const commandImage = spawn('yt-dlp', [
        '--write-thumbnail', '-o', outputImage, url
    ])
    commandImage.stdout.on('data', (data) => {
        console.log(data.toString())
    })

    commandImage.on('close', async (code) => {
        if(code === 0){
            console.log("Exitosos")
            res.status(200).json({id:id})
        }
    })

})





export { router }


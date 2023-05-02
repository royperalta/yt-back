
import { exec, spawn } from 'child_process'
import { promisify } from 'util'

export async function datos(url) {

    console.log(url)
    const commandId = spawn('yt-dlp', [
        '-x', '--get-title', // Descargar solo el audio    
        url // La URL del video de YouTube
    ]);
    let title = ``
    commandId.stdout.on('data', data => {
        title += data.toString()
    })
    console.log(title)


    commandId.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
    });
    console.log('fin')
}
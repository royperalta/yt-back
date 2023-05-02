import { exec, spawn } from 'child_process'

export async function idVideo(url) {
  return new Promise((resolve, reject) => {
    const commandId = spawn('yt-dlp', [
      '-x', '--get-id', // Descargar solo el audio
      url // La URL del video de YouTube
    ])

    let videoId = ''

    commandId.stdout.on('data', (data) => {
      videoId += data.toString().replace('\n', '')
    })

    commandId.on('exit', () => {
      resolve(videoId)
    })

    commandId.on('error', (err) => {
      reject(err)
    })
  })
}

import express from 'express'

const router = express.Router()

router.post('/download', (req, res) => {
   const body = req.body
   console.log(body)
   const command = `yt-dlp -i -x --audio-format mp3 ${body.url}` 
   res.send("OK")
})


export { router }


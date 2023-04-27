import express from 'express'

const router = express.Router()

router.post('/download', (req, res) => {
   const body = req.body
   console.log(body)
})


export { router }


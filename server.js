import express from 'express'
import dotenv from 'dotenv'

import { router } from './routers.js'
import cors from 'cors'
const app = express()

dotenv.config({path:'.env'})



app.use(express.json())
app.use('/images',express.static('./descargas'))
app.use(cors())
app.use('/api',router)


const PORT = process.env.PORT || 9200


app.listen(PORT,()=>{
    console.log(`Funcionando en el puerto: ${PORT}`)
})
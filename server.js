import express from 'express'
import dotenv from 'dotenv'
import { router } from './routers.js'
const app = express()

dotenv.config({path:'.env'})

app.use(express.json())
app.use('/api',router)

const PORT = process.env.PORT || 20000


app.listen(PORT,()=>{
    console.log(`Funcionando en el puerto: ${PORT}`)
})
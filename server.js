import express from 'express'
import dotenv from 'dotenv'
import https from 'https'
import http from 'http'
import fs from 'fs'
import { router } from './routers.js'
import cors from 'cors'

const app = express()

dotenv.config({ path: '.env' })

app.use(express.json())
app.use('/images', express.static('./descargas'))
app.use(cors())
app.use('/api', router)

const PORT = process.env.PORT || 9200


if (process.env.NODE_ENV === 'production') {
    const httpsOptions = {
        key: fs.readFileSync('/etc/ssl/virtualmin/169985749449668/ssl.key'), // Reemplaza con la ruta a tu clav>
        cert: fs.readFileSync('/etc/ssl/virtualmin/169985749449668/ssl.cert'), // Reemplaza con la ruta a tu ce>
    };
    
    const httpsServer = https.createServer(app, httpsOptions)   
    httpsServer.listen(PORT, () => {
        console.log('El servidor está corriendo en el puerto ' + PORT);
    });
} else {
    const httpServer = http.createServer(app)
    httpServer.listen(PORT, () => {
        console.log('El servidor está corriendo en el puerto ' + PORT);
    });
}

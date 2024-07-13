import express from 'express'
import dotenv from 'dotenv'
import https from 'https'
import http from 'http'
import fs from 'fs'
import cookieParser from 'cookie-parser';
import { router } from './routers.js'
import cors from 'cors'
import { routerPDF } from './routerPDF.js'
import { routerLogin } from './routerLogin.js'
import { routerBookLet } from './routerBookLet.js'
import connectDB from './lib/mongoose.js';

connectDB();
const app = express()

// Middleware para analizar cookies
app.use(cookieParser());

dotenv.config({ path: '.env' })

app.use(express.json())
app.use('/images', express.static('./descargas'))
const allowedOrigins = ['http://localhost:3000', 'https://envivo.top:9300','https://envivo.top'];

app.use(cors({
  origin: function(origin, callback) {
    // Permite solicitudes desde cualquier dominio si no se proporciona el encabezado 'Origin'
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'El acceso desde el origen no está permitido';
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true // Permite enviar cookies en la solicitud
}));
app.use('/api', router)
app.use('/api/pdf',routerPDF)
app.use('/api/user',routerLogin) 
app.use('/api/booklet',routerBookLet)

const PORT = process.env.PORT || 9200


if (process.env.NODE_ENV === 'production') {  

    const httpsOptions = {
        key: fs.readFileSync('/etc/ssl/virtualmin/169985648837673/ssl.key'), // Reemplaza con la ruta a tu clav>
          cert: fs.readFileSync('/etc/ssl/virtualmin/169985648837673/ssl.cert'), // Reemplaza con la ruta a tu ce>
        };
        

      /*   const httpsOptions = {
          key: fs.readFileSync('/etc/letsencrypt/live/envivo.top/privkey.pem'), // Ruta a tu clave privada
          cert: fs.readFileSync('/etc/letsencrypt/live/envivo.top/fullchain.pem'), // Ruta a tu certificado
        };
         */

    const httpsServer = https.createServer(httpsOptions, app)
    httpsServer.listen(PORT, () => {
        console.log('El servidor está corriendo en el puerto ' + PORT);
    });
} else {
    const httpServer = http.createServer(app)
    httpServer.listen(PORT, () => {
        console.log('El servidor está corriendo en el puerto ' + PORT);
    });
}

import fs from 'fs'
import crypto from 'crypto'


export function crearCarpetaUnica(){

    const idBuffer = crypto.randomBytes(6);
    const idUnico = idBuffer.toString('hex')
    
    const carpetNueva = `./descargas/${idUnico}`

    if(!fs.existsSync(carpetNueva)){
        fs.mkdirSync(carpetNueva)
        console.log(`Carpeta creada ${carpetNueva}`)
        return idUnico
    }else{
        console.log("La carpeta existe")
    }

}


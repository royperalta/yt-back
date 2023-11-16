export function extraerUrlAudio(urlCompleta) {
    // Expresión regular para extraer la URL del audio
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

  
    // Coincidencia con la expresión regular
    const match = urlCompleta.match(regex);
  
    // Si hay una coincidencia, devuelve la URL del audio
    // Si no hay coincidencia, devuelve null
    return match ? match[0] : null;
  }
  
 
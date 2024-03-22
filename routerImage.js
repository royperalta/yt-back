import { fromPath } from "pdf2pic";
import * as fs from "fs";

const options = {
  density: 200,
  saveFilename: "untitled",
  savePath: "./imagenes",
  format: "png"
};

const pdfFilePath = "./vowel.pdf";
const outputId = "document_page"; // Identificador para las imágenes de salida

const convert = fromPath(pdfFilePath, options);

// Obtén el número total de páginas en el PDF
const totalPages = convert.numberOfPages;

// Configura la carpeta de salida
const outputFolderPath = `./imagenes/${outputId}`;
fs.mkdirSync(outputFolderPath, { recursive: true });

// Utiliza el método bulk para convertir todas las páginas
convert.bulk(-1, { responseType: "image" })
  .then((resolve) => {
    console.log(`Todas las páginas del PDF se han convertido como imágenes en la carpeta: ${outputFolderPath}`);
    return resolve;
  })
  .catch((error) => {
    console.error("Error al convertir PDF a imágenes:", error);
  });

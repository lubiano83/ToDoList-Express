import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// Configurar Multer para almacenar archivos temporalmente
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "src/public/profile");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadProfile = multer({ storage: profileStorage });

// Middleware para convertir imágenes a .webp
const convertToWebp = async (req, res, next) => {
  if (!req.file) return next(); // Si no hay imagen, continuar con la siguiente función

  const inputPath = req.file.path; // Ruta original de la imagen
  const outputPath = inputPath.replace(/\.\w+$/, ".webp"); // Cambia la extensión a .webp

  try {
    await sharp(inputPath)
      .webp({ quality: 80 }) // Convertir a webp con calidad 80
      .toFile(outputPath);

    fs.unlinkSync(inputPath); // Elimina la imagen original

    // Actualiza el nombre del archivo en `req.file`
    req.file.filename = path.basename(outputPath);
    req.file.path = outputPath;

    next();
  } catch (error) {
    console.error("Error al convertir la imagen a .webp:", error);
    next(error);
  }
};

export { uploadProfile, convertToWebp };
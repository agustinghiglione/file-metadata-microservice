// server.js - File Metadata Microservice for FreeCodeCamp
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear carpeta 'uploads' si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuración de Multer para manejo de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Guardar en carpeta 'uploads'
  },
  filename: function (req, file, cb) {
    // Mantener el nombre original con timestamp para evitar duplicados
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrar tipos de archivo (opcional, pero buena práctica)
const fileFilter = (req, file, cb) => {
  // Aceptar todos los tipos de archivo para este proyecto
  cb(null, true);
};

// Configurar multer con límites
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10MB
    files: 1 // Solo un archivo por request
  }
});

// Middleware
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static('public'));

// Ruta principal - Página de inicio con formulario
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint para subir archivos - ¡IMPORTANTE: 'upfile' es el nombre requerido!
app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  try {
    // Verificar si se subió un archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Obtener metadata del archivo
    const fileMetadata = {
      name: req.file.originalname,     // Nombre original del archivo
      type: req.file.mimetype,         // Tipo MIME (ej: image/jpeg, application/pdf)
      size: req.file.size              // Tamaño en bytes
    };
    
    // Eliminar el archivo después de procesar (opcional, para ahorrar espacio)
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
    
    // Responder con el formato EXACTO requerido por FreeCodeCamp
    res.json(fileMetadata);
    
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Server error processing file' });
  }
});

// Ruta para pruebas
app.get('/api/info', (req, res) => {
  res.json({
    service: 'File Metadata Microservice',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/fileanalyse',
      info: 'GET /api/info'
    },
    note: 'Upload a file using form with input field name="upfile"'
  });
});

// Manejar errores de Multer (archivo muy grande, etc.)
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB' });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

// Iniciar servidor
const listener = app.listen(PORT, () => {
  console.log(`📁 File Metadata Microservice running on port ${listener.address().port}`);
  console.log(`🏠 Homepage: http://localhost:${PORT}/`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/fileanalyse`);
  console.log('\n⚠️  IMPORTANTE: El formulario debe tener un input con name="upfile"');
});

module.exports = app;
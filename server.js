// server.js - OPTIMIZADO para Render y FreeCodeCamp
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuración CORS más permisiva para FreeCodeCamp
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  optionsSuccessStatus: 200
}));

// Middleware para logging (útil para debug)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar Multer - SIMPLE y en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('upfile'); // ¡IMPORTANTE: 'upfile' exactamente como FreeCodeCamp pide!

// Middleware personalizado para manejar Multer errors
const handleFileUpload = (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // Error de Multer (tamaño, etc.)
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err) {
      // Error desconocido
      return res.status(500).json({ error: 'Unknown upload error' });
    }
    next();
  });
};

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'File Metadata Microservice',
    timestamp: new Date().toISOString()
  });
});

// Endpoint PRINCIPAL - Versión optimizada
app.post('/api/fileanalyse', handleFileUpload, (req, res) => {
  try {
    console.log('File upload request received');
    
    // Verificar si hay archivo
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded. Field must be named "upfile".' });
    }
    
    console.log('File details:', {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size
    });
    
    // Respuesta EXACTA como FreeCodeCamp requiere
    const response = {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size
    };
    
    console.log('Sending response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint de prueba simple (sin file upload)
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    upload_endpoint: 'POST /api/fileanalyse',
    required_field: 'upfile',
    example_response: {
      name: "example.txt",
      type: "text/plain", 
      size: 1234
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Iniciar servidor en el puerto que Render asigna
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check: GET /api/health`);
  console.log(`✅ File upload: POST /api/fileanalyse`);
  console.log(`✅ Field name must be: upfile`);
});
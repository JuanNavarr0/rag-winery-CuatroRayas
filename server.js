// server.js
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Creamos la app de Express
const app = express();
const PORT = 4000; // Puerto a usar

app.use(cors());
app.use(express.json());

// CONFIGURAR MULTER para subir archivos a carpeta 'uploads'
const upload = multer({
  dest: 'uploads/' // carpeta temporal
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend activo en el puerto 4000');
});

// RUTA PARA EJECUTAR rag.py al recibir un "query"
app.post('/query', (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro "query".' });
  }

  try {
    // Cambiamos la ruta para apuntar a la ubicación correcta de rag.py
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'rag.py'), // Cambiado a ruta relativa
      '--query',
      query
    ]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Error en rag.py (código ${code}): ${errorString}`);
        return res.status(500).json({
          error: 'Error ejecutando rag.py',
          details: errorString || `Código de salida: ${code}`,
        });
      }

      try {
        const result = JSON.parse(dataString.trim());
        res.json(result);
      } catch (error) {
        console.error('Error procesando la salida de rag.py:', error.message);
        console.error('Salida de rag.py:', dataString.trim());
        return res.status(500).json({
          error: 'Error procesando la salida de rag.py',
          details: error.message,
        });
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Error ejecutando rag.py:', err.message);
      res.status(500).json({
        error: 'Error ejecutando rag.py',
        details: err.message,
      });
    });
  } catch (err) {
    console.error('Error inesperado en /query:', err.message);
    res.status(500).json({
      error: 'Error inesperado en /query.',
      details: err.message,
    });
  }
});

// RUTA PARA SUBIR ARCHIVOS (EXCEL, CSV...) => /upload
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }
    // el archivo subido está en req.file
    console.log('Archivo subido:', req.file);

    // renombramos/movemos a la carpeta final
    const tempPath = req.file.path;
    const originalName = req.file.originalname;
    const targetPath = path.join(__dirname, 'uploads', originalName);

    fs.rename(tempPath, targetPath, (err) => {
      if (err) throw err;
      console.log('Archivo guardado en:', targetPath);

      // Opcional: Llamamos a excel_loader.py para procesar el .xls => JSON
      const outputJSON = path.join(__dirname, 'uploads', `${originalName}.json`);
      const pyProcess = spawn('python3', [
        path.join(__dirname, 'src', 'rag', 'excel_loader.py'), // Cambiado a ruta relativa
        targetPath,
        outputJSON
      ]);

      let pyOut = '';
      let pyErr = '';

      pyProcess.stdout.on('data', (data) => {
        pyOut += data.toString();
      });
      pyProcess.stderr.on('data', (data) => {
        pyErr += data.toString();
      });

      pyProcess.on('close', (code) => {
        console.log('excel_loader.py cerrado con código:', code);
        if (code !== 0) {
          console.error('Error en excel_loader:', pyErr);
          return res.status(500).json({ error: 'Error procesando Excel', details: pyErr });
        }

        console.log('excel_loader.py output:', pyOut);

        // OPCIONAL: Podrías aquí fusionar el outputJSON con tu documentos_texto.json
        // e invocar a rag.py o a su constructor para regenerar embeddings, etc.

        return res.json({
          message: 'Archivo subido y procesado con excel_loader.py',
          filename: originalName,
          loaderOutput: pyOut
        });
      });
    });
  } catch (err) {
    console.error('Error en /upload:', err);
    return res.status(500).json({ error: 'Error al subir el archivo', details: err.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
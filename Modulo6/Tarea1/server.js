import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3002;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/ask', async (req, res) => {
  const texto = req.body?.texto?.trim();

  if (!texto) {
    return res.status(400).json({ error: 'Debes enviar un texto de ayuda o descripción de activo fijo.' });
  }

  const prompt = `Usa el siguiente texto de la aplicación de activos fijos para responder de forma breve y clara para un usuario no técnico:\n\n${texto}`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama respondió con error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return res.json({ respuesta: data.response || '' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'No se pudo contactar con Ollama. Asegúrate de que el servicio esté corriendo en http://localhost:11434.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor web ejecutándose en http://localhost:${PORT}`);
  console.log(`Usando Ollama con el modelo: ${OLLAMA_MODEL}`);
});

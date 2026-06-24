import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const API_BASE_URL = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL || 'http://localhost:8081'

function HomePage() {
  const [backendMessage, setBackendMessage] = useState<string>('Cargando...')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/health`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        setBackendMessage(data.message || 'Backend conectado')
      })
      .catch((err) => {
        setError(err.message)
        setBackendMessage('No se pudo conectar con el backend')
      })
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <h1>Activa360</h1>
      <p>Frontend React conectado con Spring Boot + Keycloak.</p>
      <p><strong>Backend:</strong> {backendMessage}</p>
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

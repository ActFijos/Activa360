import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../keycloak-config';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  fuente?: string;
}

export const AgenteMcp: React.FC = () => {
  const { username } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `¡Hola ${username || 'Usuario'}! Soy el Agente Avanzado de Activa360. 🧠\n\nEstoy conectado mediante **MCP** a las bases de datos transaccionales de inventario y utilizo **Chroma DB (RAG)** para resolver tus dudas sobre manuales, políticas y procedimientos.\n\n¿Qué deseas consultar hoy?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    { label: '📊 Estadísticas del Inventario', query: 'Dame estadísticas globales de los activos' },
    { label: '📖 ¿Qué es el SCAF?', query: '¿Qué es el sistema SCAF y cuáles son sus objetivos?' },
    { label: '🔍 Buscar Computadoras en Sistemas', query: 'Busca activos de la categoría Sistemas/TI' },
    { label: '❓ ¿Quién autoriza una baja SABS?', query: '¿Quién puede autorizar una Baja SABS según el manual?' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsgId = Math.random().toString(36).substring(7);
    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:3000/asistente-ia-mcp/preguntar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-username': username || 'admin',
        },
        body: JSON.stringify({
          pregunta: textToSend,
          modulo: 'Ayuda',
          pantalla: 'Agente MCP',
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo establecer conexión con el backend.');
      }

      const data = await res.json();

      const botMsgId = Math.random().toString(36).substring(7);
      const botMessage: Message = {
        id: botMsgId,
        sender: 'bot',
        text: data.respuesta,
        timestamp: new Date(),
        fuente: data.fuente,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMsgId = Math.random().toString(36).substring(7);
      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          sender: 'bot',
          text: `⚠️ **Error de conexión:** No se pudo comunicar con el Agente MCP. Asegúrate de que el backend de NestJS esté corriendo.\n\n*(Detalle: ${err.message})*`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1rem' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          🧠 Agente Avanzado (IA + MCP + Chroma)
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
          Orquestador inteligente con RAG documental y ejecución de herramientas de activos fijos.
        </p>
      </div>

      {/* Chat Container */}
      <div
        style={{
          flexGrow: 1,
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #cfd8dc',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        
        {/* Messages Body */}
        <div
          style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            backgroundColor: '#fafbfc',
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    backgroundColor: isUser ? '#1e88e5' : '#ffffff',
                    color: isUser ? '#ffffff' : '#263238',
                    padding: '0.85rem 1.2rem',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: isUser ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
                    border: isUser ? 'none' : '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                >
                  <div style={{ whiteSpace: 'pre-line', fontSize: '0.92rem', lineHeight: '1.45' }}>
                    {msg.text}
                  </div>
                  
                  {!isUser && msg.fuente && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#78909c',
                        borderTop: '1px solid #eee',
                        paddingTop: '0.3rem',
                        marginTop: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>ℹ️</span>
                      <strong>Fuente:</strong> {msg.fuente}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: '0.7rem',
                      alignSelf: 'flex-end',
                      color: isUser ? 'rgba(255,255,255,0.7)' : '#90a4ae',
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '0.85rem 1.2rem',
                  borderRadius: '16px 16px 16px 4px',
                  border: '1px solid #e0e0e0',
                  color: '#78909c',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Pensando</span>
                <span className="dot-typing">...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid #eceff1',
            backgroundColor: '#ffffff',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.query)}
              disabled={isTyping}
              style={{
                backgroundColor: '#f1f3f4',
                border: '1px solid #e0e0e0',
                borderRadius: '20px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                color: '#5f6368',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e8eaed')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f1f3f4')}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #cfd8dc', backgroundColor: '#ffffff', display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Pregunta algo al agente de activos o consulta el manual..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(input);
            }}
            disabled={isTyping}
            style={{
              flexGrow: 1,
              padding: '0.75rem 1.2rem',
              border: '1px solid #cfd8dc',
              borderRadius: '8px',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={isTyping}
            style={{
              backgroundColor: '#1e88e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

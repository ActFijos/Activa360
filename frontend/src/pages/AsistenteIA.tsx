import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../keycloak-config';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  toolUsed?: string;
  params?: any;
}

export const AsistenteIA: React.FC = () => {
  const { username } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `¡Hola ${username || 'Usuario'}! Soy tu Asistente IA de Activa360. 🤖\n\nPuedo ayudarte a buscar activos fijos, consultar estadísticas por área, o revisar el historial completo de movimientos, asignaciones y mantenimientos.\n\n¿En qué te puedo colaborar hoy?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    { label: '📊 ¿Qué activos tiene Sistemas?', query: '¿Qué activos tiene Sistemas?' },
    { label: '🔍 Buscar activo ACT-2026-001', query: 'Busca el activo QR ACT-2026-001' },
    { label: '📋 Historial de ACT-2026-006', query: 'Muéstrame el historial de movimientos de ACT-2026-006' },
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
      const res = await fetch('http://localhost:3000/asistente-ia/preguntar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-username': username || 'admin',
        },
        body: JSON.stringify({
          pregunta: textToSend,
          modulo: 'Ayuda',
          pantalla: 'Asistente IA',
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
        toolUsed: data.toolUtilizada,
        params: data.parametrosTool,
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
          text: `⚠️ **Error de conexión:** No pude comunicarme con el motor del Asistente IA. Por favor, asegúrate de que el servidor backend de NestJS esté corriendo.\n\n*(Detalle: ${err.message})*`,
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
          🤖 Asistente IA Inteligente
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
          Realiza consultas utilizando lenguaje natural conectadas directamente con el inventario del SCAF.
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
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  maxWidth: '85%',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Avatar for Bot */}
                {!isUser && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#1e88e5',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      boxShadow: '0 2px 8px rgba(30, 136, 229, 0.3)',
                    }}
                  >
                    🤖
                  </div>
                )}

                {/* Message Bubble */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div
                    style={{
                      padding: '0.85rem 1.1rem',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: isUser ? '#1e88e5' : '#ffffff',
                      color: isUser ? '#ffffff' : '#263238',
                      boxShadow: isUser ? '0 3px 10px rgba(30, 136, 229, 0.2)' : '0 2px 10px rgba(0,0,0,0.04)',
                      border: isUser ? 'none' : '1px solid #e0e0e0',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {msg.text}

                    {/* Meta information of Tool Used */}
                    {msg.toolUsed && (
                      <div
                        style={{
                          marginTop: '0.6rem',
                          paddingTop: '0.5rem',
                          borderTop: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid #eceff1',
                          fontSize: '0.75rem',
                          color: isUser ? 'rgba(255, 255, 255, 0.8)' : '#78909c',
                          fontStyle: 'italic',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        ⚙️ Ejecutado: <strong>{msg.toolUsed}</strong>
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#90a4ae',
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      marginRight: isUser ? '4px' : '0',
                      marginLeft: isUser ? '0' : '4px',
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Avatar for User */}
                {isUser && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#546e7a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      boxShadow: '0 2px 8px rgba(84, 110, 122, 0.3)',
                    }}
                  >
                    {username ? username.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', alignSelf: 'flex-start' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#1e88e5',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                🤖
              </div>
              <div
                style={{
                  padding: '0.75rem 1.1rem',
                  borderRadius: '16px 16px 16px 4px',
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>Consultando sistema de activos fijos</span>
                <span className="dot-jump">.</span>
                <span className="dot-jump" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="dot-jump" style={{ animationDelay: '0.4s' }}>.</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #eceff1',
            display: 'flex',
            gap: '0.6rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {suggestionChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(chip.query)}
              disabled={isTyping}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                border: '1px solid #cfd8dc',
                backgroundColor: '#ffffff',
                color: '#37474f',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              className="suggestion-item"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #eceff1',
            display: 'flex',
            gap: '0.75rem',
          }}
        >
          <input
            type="text"
            placeholder="Pregúntale al asistente... Ej: ¿Cuántos activos hay en Sistemas?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            style={{
              flexGrow: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #b0bec5',
              borderRadius: '8px',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#1e88e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>Enviar</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>

      </div>

      {/* Dynamic Dot Jumps Styles (Inject once) */}
      <style>{`
        @keyframes dotJump {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .dot-jump {
          display: inline-block;
          animation: dotJump 1.4s infinite both;
        }
        .suggestion-item:hover {
          background-color: #e3f2fd !important;
          border-color: #90caf9 !important;
          color: #1565c0 !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatService } from './chatService';
import { welcomeChatResponse } from '@/constants/mockData';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: Array<{
    content: string;
    document_name: string;
    similarity: number;
  }>;
}

export default function ChatWidget() {
  const CHAT_WIDTH = 420;
  const CHAT_HEIGHT = 600;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // ── 可拖动定位 ──────────────────────────────────
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // 初始化位置（右下角）
  useEffect(() => {
    setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
    setChatPos({
      x: Math.max(0, window.innerWidth - 420),
      y: Math.max(0, window.innerHeight - 600),
    });
  }, []);

  // 聊天窗口跟随按钮位置
  useEffect(() => {
    setChatPos({
      x: Math.max(0, Math.min(window.innerWidth - CHAT_WIDTH, position.x - CHAT_WIDTH + 56)),
      y: Math.max(0, Math.min(window.innerHeight - CHAT_HEIGHT, position.y - CHAT_HEIGHT)),
    });
  }, [position, CHAT_WIDTH, CHAT_HEIGHT]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragOffset.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
    dragStartPos.current = { x: clientX, y: clientY };
  }, [position]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStartPos.current.x;
    const dy = clientY - dragStartPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved.current = true;
    }
    const newX = Math.max(0, Math.min(window.innerWidth - 56, clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 56, clientY - dragOffset.current.y));
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };
    const onTouchEnd = () => handleDragEnd();
    if (isDragging) {
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // 点击打开聊天（仅在未拖动时触发）
  const handleButtonClick = () => {
    if (!hasMoved.current) {
      setIsOpen(true);
    }
  };

  // ── 聊天逻辑 ──────────────────────────────────

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化会话和欢迎消息
  useEffect(() => {
    const initSession = async () => {
      const id = await chatService.createSession();
      setSessionId(id);

      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        type: 'assistant',
        content: welcomeChatResponse.answer,
        timestamp: new Date(),
        references: welcomeChatResponse.references,
      };
      setMessages([welcomeMessage]);
    };
    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen, sessionId]);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(inputValue, sessionId || '');
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        references: response.references,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '抱歉，发生了错误。请重试。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const [chatPos, setChatPos] = useState({ x: 0, y: 0 });

  return (
    <>
      {/* 浮窗按钮 - 可拖动 */}
      {!isOpen && (
        <button
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onClick={handleButtonClick}
          title="拖动移动位置，点击打开聊天"
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            transition: isDragging ? 'none' : 'box-shadow 0.3s ease',
            userSelect: 'none',
            touchAction: 'none',
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.4)';
            }
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* 聊天框 - 可拖动 */}
      {isOpen && (
        <div
          onMouseDown={(e) => {
            // 只在头部区域允许拖动整个聊天窗口
            if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
              e.preventDefault();
              handleDragStart(e.clientX, e.clientY);
            }
          }}
          onTouchStart={(e) => {
            if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
              const touch = e.touches[0];
              handleDragStart(touch.clientX, touch.clientY);
            }
          }}
          style={{
            position: 'fixed',
            left: `${chatPos.x}px`,
            top: `${chatPos.y}px`,
            width: `${CHAT_WIDTH}px`,
            height: `${CHAT_HEIGHT}px`,
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 5px 40px rgba(0, 0, 0, 0.16)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
          }}>
          {/* 头部 - 拖动把手 */}
          <div
            data-drag-handle
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>⋮⋮</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>畜舍智能助手</h3>
            </div>
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setMessages([]);
                setSessionId(null);
              }}
              title="关闭"
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ✕
            </button>
          </div>

          {/* 消息列表 */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {messages.length === 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '16px', fontWeight: 500, color: '#4b5563', margin: '8px 0' }}>有什么我可以帮助你的吗？</p>
                <p style={{ fontSize: '12px', color: '#d1d5db', margin: '8px 0' }}>关于畜牧监测、数据分析等问题</p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  maxWidth: '80%',
                  wordBreak: 'break-word',
                  backgroundColor: message.type === 'user' ? '#4f46e5' : '#f3f4f6',
                  color: message.type === 'user' ? 'white' : '#1f2937',
                  borderBottomRightRadius: message.type === 'user' ? '4px' : '12px',
                  borderBottomLeftRadius: message.type === 'user' ? '12px' : '4px',
                }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{message.content}</p>
                  {message.references && message.references.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: `1px solid ${message.type === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(31,41,55,0.1)'}`,
                    }}>
                      <p style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        margin: '0 0 8px 0',
                        opacity: 0.8,
                      }}>参考资料：</p>
                      {message.references.map((ref, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12px',
                          padding: '6px 0',
                          borderBottom: idx < message.references!.length - 1 ? `1px solid ${message.type === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(31,41,55,0.05)'}` : 'none',
                        }}>
                          <span style={{
                            fontWeight: 500,
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginRight: '8px',
                            opacity: 0.9,
                          }}>
                            {ref.document_name}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            opacity: 0.7,
                            whiteSpace: 'nowrap',
                          }}>
                            {(ref.similarity * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginTop: '4px',
                  padding: '0 4px',
                }}>
                  {message.timestamp.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#f3f4f6',
                  borderBottomLeftRadius: '4px',
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#6b7280',
                      animation: 'bounce 1.4s infinite 0s',
                    }} />
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#6b7280',
                      animation: 'bounce 1.4s infinite 0.2s',
                    }} />
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#6b7280',
                      animation: 'bounce 1.4s infinite 0.4s',
                    }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#fafafa',
            borderRadius: '0 0 12px 12px',
          }}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题..."
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              disabled={isLoading}
              rows={3}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4f46e5';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              style={{
                padding: '10px 16px',
                background: isLoading || !inputValue.trim() ? 'rgba(79, 70, 229, 0.6)' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isLoading && inputValue.trim()) {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.transform = 'translateY(-2px)';
                  btn.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && inputValue.trim()) {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.transform = 'translateY(0)';
                  btn.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% {
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
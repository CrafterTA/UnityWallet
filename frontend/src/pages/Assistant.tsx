import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, MessageSquare, Bot, Lightbulb, TrendingUp, DollarSign, Sparkles, X, Minimize2, Maximize2, Minimize } from 'lucide-react'
import { analyticsApi } from '@/api/analytics'
import toast from 'react-hot-toast'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function Assistant() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của SoviPay.\n\nTôi có thể giúp bạn:\n• Kiểm tra số dư và giao dịch\n• Giải thích về blockchain và crypto\n• Trả lời câu hỏi thường\n• Hỗ trợ sử dụng ví\n\nBạn cần giúp gì?',
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickQuestions = [
    {
      icon: TrendingUp,
      text: 'Tôi có bao nhiêu XLM?',
      query: 'Tôi có bao nhiêu XLM?',
    },
    {
      icon: DollarSign,
      text: 'Giao dịch gần đây của tôi',
      query: 'Giao dịch gần đây của tôi',
    },
    {
      icon: Lightbulb,
      text: 'Blockchain là gì?',
      query: 'Blockchain là gì?',
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputMessage.trim()
    if (!messageText) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await analyticsApi.askAssistant(messageText)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.answer,
        type: 'assistant',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Assistant error:', error)
      toast.error('Failed to get response from assistant')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I\'m having trouble responding right now. Please try again later.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        >
          <Bot className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          {/* Pulse ring effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/30 to-yellow-500/30 animate-ping" />
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed transition-all duration-300 ${
      isFullscreen 
        ? 'inset-0 w-screen h-screen z-[9999]' 
        : 'bottom-6 right-6 w-96 max-h-[80vh] md:w-[500px] lg:w-[600px] xl:w-[700px] z-50'
    }`}>
      {/* Chatbox Header */}
      <div className={`bg-gradient-to-r from-red-500 to-yellow-500 p-4 text-white shadow-lg ${
        isFullscreen ? 'rounded-none' : 'rounded-t-2xl'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-white/80">Financial Helper</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className={`bg-white dark:bg-slate-800 overflow-hidden flex flex-col ${
            isFullscreen ? 'rounded-none' : 'rounded-b-2xl'
          } shadow-2xl`} style={{
            maxHeight: isFullscreen ? 'calc(100vh - 80px)' : 'calc(80vh - 120px)',
            height: isFullscreen ? 'calc(100vh - 80px)' : 'calc(80vh - 180px)',
            minHeight: isFullscreen ? 'calc(100vh - 80px)' : 'calc(80vh - 180px)'
          }}>
            <div className="overflow-y-auto p-4 space-y-3 flex-1" style={{
              minHeight: isFullscreen ? 'calc(100vh - 200px)' : 'calc(80vh - 240px)',
              maxHeight: isFullscreen ? 'calc(100vh - 200px)' : 'calc(80vh - 240px)'
            }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                          <Bot className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">AI</span>
                      </div>
                    )}
                    
                    <div className="leading-relaxed whitespace-pre-wrap">
                      {message.content.split('\n').map((line, index) => {
                        // Handle bullet points
                        if (line.trim().startsWith('•')) {
                          return (
                            <div key={index} className="flex items-start gap-2 mb-1">
                              <span className="text-red-500 dark:text-red-400 mt-1 flex-shrink-0">•</span>
                              <span className="flex-1">{line.replace('•', '').trim()}</span>
                            </div>
                          )
                        }
                        // Handle bold text
                        if (line.includes('**')) {
                          const parts = line.split(/(\*\*.*?\*\*)/g)
                          return (
                            <div key={index} className="mb-2">
                              {parts.map((part, partIndex) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <strong key={partIndex} className="font-bold text-slate-900 dark:text-slate-100">
                                      {part.slice(2, -2)}
                                    </strong>
                                  )
                                }
                                return <span key={partIndex}>{part}</span>
                              })}
                            </div>
                          )
                        }
                        // Regular lines
                        return (
                          <div key={index} className={line.trim() ? 'mb-2' : 'mb-1'}>
                            {line}
                          </div>
                        )
                      })}
                    </div>
                    
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                        <Bot className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">AI</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Questions */}
              {messages.length === 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center">Quick questions:</p>
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question.text)}
                      className="w-full text-left p-2 bg-slate-50 dark:bg-slate-600 hover:bg-slate-100 dark:hover:bg-slate-500 rounded-lg transition-colors text-xs flex items-center gap-2"
                    >
                      <div className="w-5 h-5 bg-red-500/20 rounded flex items-center justify-center">
                        <question.icon className="w-3 h-3 text-red-500" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200">{question.text}</span>
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input - Always visible when not minimized */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex-shrink-0 min-h-[80px]">
              <div className="flex gap-2 h-full items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Hỏi tôi bất cứ điều gì..."
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 h-10"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-3 py-2 bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-10 min-w-[40px]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Assistant

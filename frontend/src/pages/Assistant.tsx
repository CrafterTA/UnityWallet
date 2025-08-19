import { useState } from 'react'
import { Send, MessageCircle, Lightbulb, TrendingUp, DollarSign } from 'lucide-react'
import { analyticsApi } from '@/api/analytics'
import toast from 'react-hot-toast'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hi! I\'m your financial assistant. I can help you understand your spending patterns, find savings opportunities, and answer questions about your finances. What would you like to know?',
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const quickQuestions = [
    {
      icon: TrendingUp,
      text: 'How much did I spend on travel this month?',
      query: 'travel spending',
    },
    {
      icon: DollarSign,
      text: 'How can I save money?',
      query: 'save money',
    },
    {
      icon: Lightbulb,
      text: 'What\'s my credit score?',
      query: 'credit score',
    },
  ]

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
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Financial Assistant</h1>
        <p className="text-white/70">Ask me anything about your finances</p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto mb-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white ml-4'
                  : 'bg-white/10 backdrop-blur-sm border border-white/20 mr-4'
              }`}
            >
              {message.type === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Assistant</span>
                </div>
              )}
              
              <p className={`text-sm leading-relaxed ${
                message.type === 'user' ? 'text-white' : 'text-white'
              }`}>
                {message.content}
              </p>
              
              <p className={`text-xs mt-2 ${
                message.type === 'user' ? 'text-white/70' : 'text-white/60'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mr-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-white/80">Assistant</span>
              </div>
              <div className="flex space-x-1 mt-2">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-white/80 mb-3">Quick questions:</p>
          <div className="space-y-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question.text)}
                className="w-full text-left p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:border-white/30 hover:bg-white/20 transition-all duration-200 flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <question.icon className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm text-white/80">{question.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your finances..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-white/60 backdrop-blur-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Assistant

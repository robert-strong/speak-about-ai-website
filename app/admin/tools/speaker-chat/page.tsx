"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Bot, Send, Loader2, User, Sparkles, FileText, Copy, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import ReactMarkdown from 'react-markdown'

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function AIContentStudioPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Chat states
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Blog Writer states
  const [semrushUrl, setSemrushUrl] = useState("")
  const [blogStyle, setBlogStyle] = useState("professional")
  const [personalizedBlog, setPersonalizedBlog] = useState("")
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false)
  const [isPushingToContentful, setIsPushingToContentful] = useState(false)
  const [copied, setCopied] = useState(false)

  // Check authentication
  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)

    // Add welcome message for chat
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm your AI assistant for managing the speaker database. I can help you:\n\n🔍 **Search** - Find speakers by location, expertise, topics, industries\n➕ **Add** - Add new speakers to the database\n💡 **Recommend** - Get speaker suggestions for events\n\nTry asking about speakers in a specific city, or say \"add a new speaker\" to get started!",
        timestamp: new Date()
      }
    ])
  }, [router])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoadingChat) return

    const userMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoadingChat(true)

    try {
      const response = await fetch("/api/admin/tools/speaker-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-admin-bypass": "dev-admin-access"
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation: messages
        })
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please try again.",
        variant: "destructive"
      })

      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoadingChat(false)
    }
  }

  const handlePersonalizeBlog = async () => {
    if (!semrushUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the SEMrush article URL.",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingBlog(true)
    setPersonalizedBlog("")

    try {
      const response = await fetch("/api/admin/tools/blog-writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-admin-bypass": "dev-admin-access"
        },
        body: JSON.stringify({
          semrush_url: semrushUrl,
          style: blogStyle
        })
      })

      if (!response.ok) {
        throw new Error("Failed to enhance blog")
      }

      const data = await response.json()
      setPersonalizedBlog(data.blog)

      toast({
        title: "Success",
        description: "Article enhanced successfully with intelligent internal links!"
      })
    } catch (error) {
      console.error("Error enhancing blog:", error)
      toast({
        title: "Error",
        description: "Failed to enhance article. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingBlog(false)
    }
  }

  const handlePushToContentful = async () => {
    if (!personalizedBlog.trim()) {
      toast({
        title: "No Content",
        description: "Please enhance an article first.",
        variant: "destructive"
      })
      return
    }

    setIsPushingToContentful(true)

    try {
      const response = await fetch("/api/admin/tools/push-to-contentful", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-admin-bypass": "dev-admin-access"
        },
        body: JSON.stringify({
          content: personalizedBlog
        })
      })

      if (!response.ok) {
        throw new Error("Failed to push to Contentful")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: `Article pushed to Contentful! ${data.url ? `View: ${data.url}` : ""}`
      })
    } catch (error) {
      console.error("Error pushing to Contentful:", error)
      toast({
        title: "Error",
        description: "Failed to push to Contentful. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsPushingToContentful(false)
    }
  }

  const handleCopyBlog = () => {
    navigator.clipboard.writeText(personalizedBlog)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Blog content copied to clipboard"
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestedQueries = [
    "Show me AI speakers in New York",
    "Find speakers in San Francisco",
    "Who are our speakers in London?",
    "Find machine learning experts",
    "Add a new speaker"
  ]

  const handleSuggestedQuery = (query: string) => {
    setInputMessage(query)
  }

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Content Studio</h1>
                <p className="mt-1 text-gray-600">Intelligent speaker search and AI-powered article enhancement with automatic internal linking</p>
              </div>
            </div>
          </div>

          {/* Side by Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-600" />
                    Speaker Chat
                  </CardTitle>
                  <CardDescription>
                    Query your speaker database with natural language
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="h-[calc(100vh-22rem)] flex flex-col">
                <CardContent className="flex-1 flex flex-col p-6">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                            <AvatarFallback>
                              <Bot className="h-4 w-4 text-white" />
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 max-h-[600px] overflow-y-auto overflow-x-hidden ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {message.role === "user" ? (
                            <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
                          ) : (
                            <div className="text-sm prose prose-sm max-w-none prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-gray-900 break-words overflow-wrap-anywhere prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:break-words">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}
                          <p className={`text-xs mt-1 ${
                            message.role === "user" ? "text-blue-100" : "text-gray-500"
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {message.role === "user" && (
                          <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                            <AvatarFallback>
                              <User className="h-4 w-4 text-white" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {isLoadingChat && (
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                          <AvatarFallback>
                            <Bot className="h-4 w-4 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggested Queries */}
                  {messages.length === 1 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Try asking:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQueries.map((query, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors"
                            onClick={() => handleSuggestedQuery(query)}
                          >
                            {query}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about your speakers..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoadingChat}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoadingChat || !inputMessage.trim()}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Blog Writer Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    SEO Blog Writer
                  </CardTitle>
                  <CardDescription>
                    AI-powered article enhancement with automatic speaker detection and intelligent internal linking
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-6">
                {/* Input Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Article Enhancement</CardTitle>
                    <CardDescription>AI automatically detects relevant speakers and blog posts from your database</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="bg-purple-50 border-purple-200">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-purple-900">
                        Our AI intelligently searches your speaker database and existing blog posts to add relevant internal links - no manual selection needed!
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="semrush-url">SEMrush Article URL</Label>
                      <Input
                        id="semrush-url"
                        placeholder="https://static.semrush.com/contentshake/articles/..."
                        value={semrushUrl}
                        onChange={(e) => setSemrushUrl(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Enter the full SEMrush static URL to fetch the article with images
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="style">Writing Style</Label>
                      <Select value={blogStyle} onValueChange={setBlogStyle}>
                        <SelectTrigger id="style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional & Technical</SelectItem>
                          <SelectItem value="conversational">Conversational & Friendly</SelectItem>
                          <SelectItem value="thought-leadership">Thought Leadership</SelectItem>
                          <SelectItem value="educational">Educational & Instructive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handlePersonalizeBlog}
                      disabled={isGeneratingBlog || !semrushUrl.trim()}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                      {isGeneratingBlog ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enhancing Article...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Enhance Article with AI
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Output Card */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Enhanced Article</CardTitle>
                        <CardDescription>With intelligent internal links - ready for Contentful</CardDescription>
                      </div>
                      {personalizedBlog && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyBlog}
                            className="flex items-center gap-2"
                          >
                            {copied ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            {copied ? "Copied!" : "Copy"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handlePushToContentful}
                            disabled={isPushingToContentful}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                          >
                            {isPushingToContentful ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Pushing...
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4" />
                                Push to Contentful
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {personalizedBlog ? (
                      <Textarea
                        value={personalizedBlog}
                        onChange={(e) => setPersonalizedBlog(e.target.value)}
                        className="min-h-[350px] font-mono text-sm"
                      />
                    ) : (
                      <div className="min-h-[350px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Your enhanced article will appear here</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

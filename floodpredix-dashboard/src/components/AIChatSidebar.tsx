import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, Camera, Mic } from "lucide-react";
import { chatCompletion, type ChatMessage } from "@/lib/openrouter";
import api from "@/lib/api";
import type { LatestData } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageUI {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [latestData, setLatestData] = useState<LatestData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch latest data for context
  const fetchLatestData = useCallback(async () => {
    try {
      const response = await api.getLatestData("PROTOTYPE");
      if (response.success && response.data) {
        setLatestData(response.data as LatestData);
      }
    } catch (error) {
      console.error("Failed to fetch latest data for AI chat:", error);
    }
  }, []);

  useEffect(() => {
    fetchLatestData();
    const interval = setInterval(fetchLatestData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchLatestData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const generateSystemPrompt = useCallback(() => {
    const waterLevel = latestData?.waterLevel || 0;
    const rainfall = latestData?.rainfall || 0;
    const humidity = latestData?.humidity || 0;

    return `You are a flood prediction AI assistant for FloodGuard monitoring system.
Analyze current water levels, rainfall, and humidity data to provide:
- Flood risk assessments
- Probability predictions
- Scenario analysis
- Actionable recommendations

Current data:
- Water Level: ${waterLevel.toFixed(3)}m (${(waterLevel * 100).toFixed(1)}cm)
- Rainfall: ${rainfall.toFixed(1)}mm
- Humidity: ${humidity.toFixed(0)}%

Risk thresholds:
- Danger: Water level < 5cm
- Caution: Water level 5-10cm
- Safe: Water level > 10cm

Provide clear, concise, and actionable insights.`;
  }, [latestData]);

  const handleSendMessage = async () => {
    if (input.trim() === "" || loading) return;

    const userMessage: ChatMessageUI = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const systemPrompt = generateSystemPrompt();
      const chatMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        { role: "user", content: input },
      ];

      const aiResponse = await chatCompletion(chatMessages);

      if (aiResponse && aiResponse.choices && aiResponse.choices.length > 0) {
        const content =
          aiResponse.choices[0]?.message?.content ||
          "I'm sorry, I couldn't generate a response.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content, timestamp: new Date() },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I couldn't get a response from the AI. Please check your API configuration.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : "An error occurred while communicating with the AI.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-primary shadow-lg hover:bg-primary/90 z-50 transition-all duration-300 group"
        size="lg"
        title="Ask Flood AI"
      >
        <Bot className="h-6 w-6 text-black group-hover:scale-110 transition-transform" />
      </Button>

      {/* Right Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-[#1a2c22] border-l border-[#254632] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#254632] bg-[#1a2c22]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Flood AI</h2>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Assistant Online
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50 text-primary" />
                  <p className="text-sm">Start a conversation with Flood AI</p>
                  <p className="text-xs mt-2 opacity-70">
                    Ask about flood risks, predictions, or scenarios
                  </p>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Bot className="h-5 w-5 text-primary shrink-0 mt-1" />
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-black"
                        : "bg-[#254632] text-white"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ ...props }) => (
                              <h1
                                className="text-lg font-bold mb-2 mt-4 first:mt-0"
                                {...props}
                              />
                            ),
                            h2: ({ ...props }) => (
                              <h2
                                className="text-base font-semibold mb-2 mt-3 first:mt-0"
                                {...props}
                              />
                            ),
                            h3: ({ ...props }) => (
                              <h3
                                className="text-sm font-semibold mb-1 mt-2 first:mt-0"
                                {...props}
                              />
                            ),
                            p: ({ ...props }) => (
                              <p className="mb-2 last:mb-0" {...props} />
                            ),
                            ul: ({ ...props }) => (
                              <ul
                                className="list-disc list-inside mb-2 space-y-1"
                                {...props}
                              />
                            ),
                            ol: ({ ...props }) => (
                              <ol
                                className="list-decimal list-inside mb-2 space-y-1"
                                {...props}
                              />
                            ),
                            li: ({ ...props }) => (
                              <li className="ml-2" {...props} />
                            ),
                            strong: ({ ...props }) => (
                              <strong className="font-semibold" {...props} />
                            ),
                            em: ({ ...props }) => (
                              <em className="italic" {...props} />
                            ),
                            code: ({ className, children, ...props }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code
                                  className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono"
                                  {...props}
                                >
                                  {children}
                                </code>
                              ) : (
                                <code
                                  className="block bg-black/30 p-2 rounded text-xs font-mono overflow-x-auto mb-2"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                            pre: ({ ...props }) => (
                              <pre
                                className="bg-black/30 p-2 rounded text-xs font-mono overflow-x-auto mb-2"
                                {...props}
                              />
                            ),
                            blockquote: ({ ...props }) => (
                              <blockquote
                                className="border-l-2 border-primary/50 pl-3 italic my-2"
                                {...props}
                              />
                            ),
                            hr: ({ ...props }) => (
                              <hr
                                className="border-t border-white/20 my-3"
                                {...props}
                              />
                            ),
                            a: ({ ...props }) => (
                              <a
                                className="text-primary underline hover:text-primary/80"
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                              />
                            ),
                            table: ({ ...props }) => (
                              <div className="overflow-x-auto my-2">
                                <table
                                  className="min-w-full border-collapse border border-white/20"
                                  {...props}
                                />
                              </div>
                            ),
                            th: ({ ...props }) => (
                              <th
                                className="border border-white/20 px-2 py-1 bg-white/10 font-semibold text-left"
                                {...props}
                              />
                            ),
                            td: ({ ...props }) => (
                              <td
                                className="border border-white/20 px-2 py-1"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs text-primary font-semibold">
                        U
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-start justify-start gap-3">
                  <Bot className="h-5 w-5 text-primary shrink-0 mt-1 animate-pulse" />
                  <div className="bg-[#254632] text-white rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm italic">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[#254632] bg-[#1a2c22]">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
                title="Attach image"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
                title="Voice input"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask anything about flood data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="flex-1 bg-[#0f172a] border-[#334155] text-white placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="bg-primary hover:bg-primary/90 text-black"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI can make mistakes.
            </p>
          </div>
        </div>
      </div>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

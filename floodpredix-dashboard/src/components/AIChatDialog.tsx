import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X } from "lucide-react";
import { chatCompletion, type ChatMessage } from "@/lib/openrouter";
// ScrollArea not available, using div with overflow instead

interface AIChatDialogProps {
  waterLevel: number;
  rainfall: number;
  humidity: number;
}

interface ChatMessageUI {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIChatDialog({
  waterLevel,
  rainfall,
  humidity,
}: AIChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const systemPrompt = `You are a flood prediction AI assistant for FloodGuard monitoring system. 
Analyze current water levels, rainfall, and humidity data to provide:
- Flood risk assessments
- Probability predictions
- Scenario analysis
- Actionable recommendations

Current data:
- Water Level: ${waterLevel.toFixed(3)}m (${(waterLevel * 100).toFixed(1)}cm)
- Rainfall: ${rainfall.toFixed(1)}mm
- Humidity: ${humidity.toFixed(1)}%

Risk thresholds:
- Danger: Water level < 5cm
- Caution: Water level 5-10cm
- Safe: Water level > 10cm

Provide clear, concise, and actionable insights.`;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessageUI = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const chatMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        { role: "user", content: input },
      ];

      const response = await chatCompletion(chatMessages);
      const assistantMessage: ChatMessageUI = {
        role: "assistant",
        content: response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessageUI = {
        role: "assistant",
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : "Failed to get AI response. Please check your API key configuration.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-primary shadow-lg hover:bg-primary/90 z-50"
        size="lg"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#1e293b] border-[#334155] max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">Ask Flood AI</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Get AI-powered insights about flood risks and predictions
            </DialogDescription>
          </DialogHeader>

          {/* Messages Area */}
          <div className="flex-1 pr-4 mb-4 overflow-y-auto max-h-[400px]">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation with Flood AI</p>
                  <p className="text-sm mt-2">
                    Ask about flood risks, predictions, or scenarios
                  </p>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-[#0f172a] text-white border border-[#334155]"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#0f172a] text-white border border-[#334155] rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about flood risks, predictions..."
              disabled={loading}
              className="bg-[#0f172a] border-[#334155] text-white flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


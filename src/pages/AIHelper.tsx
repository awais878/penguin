import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MOCK_RESPONSES = [
  "That's a great question! Based on common academic resources, I'd suggest reviewing the fundamentals first. This feature will provide real AI-powered answers soon!",
  "I understand you're looking for help with this topic. When fully integrated, I'll be able to search through uploaded resources and provide contextual answers.",
  "Great study question! In the full version, I'll analyze your course materials and provide targeted study recommendations.",
  "I'd be happy to help explain that concept. Once connected to an AI backend, I'll provide detailed explanations with references to your uploaded materials.",
];

export default function AIHelper() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Mock response with delay
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
    
    const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-4">
            <Sparkles className="h-3 w-3" />
            Coming Soon
          </div>
          <h1 className="text-2xl font-bold mb-2">AI Study Helper</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Ask questions about your study materials and get AI-powered explanations. 
            This is a preview — real AI integration is coming soon.
          </p>
        </div>

        {/* Chat area */}
        <div className="border rounded-lg overflow-hidden">
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Ask me anything about your studies
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg px-4 py-2.5 text-sm text-muted-foreground">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask a study question..."
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

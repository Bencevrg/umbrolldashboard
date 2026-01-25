import { useRef, useEffect, useState } from 'react';
import { Send, Bot, Trash2, Copy, Zap, Brain } from 'lucide-react';
import Markdown from 'react-markdown';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/partner';

const WEBHOOK_URLS = {
  quick: 'https://bencevrg.app.n8n.cloud/webhook/87270230-ca97-4dad-812a-9c90c1394484',
  thinking: 'https://bencevrg.app.n8n.cloud/webhook/abbd5cc8-81b1-433d-9d70-52efce34799d',
};

type ChatMode = 'quick' | 'thinking';

const getSessionId = (): string => {
  const STORAGE_KEY = 'chat_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
};

interface ChatPageProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onClearChat: () => void;
}

export const ChatPage = ({ messages, setMessages, onClearChat }: ChatPageProps) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('quick');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URLS[chatMode], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          sessionId: getSessionId(),
        }),
      });

      const data = await response.text();
      
      // Parse JSON response and extract output field
      let content = 'Válasz érkezett.';
      try {
        const parsed = JSON.parse(data);
        // Handle array format: [{"output": "..."}]
        if (Array.isArray(parsed) && parsed.length > 0) {
          content = parsed[0].output || parsed[0].message || JSON.stringify(parsed[0]);
        } else {
          content = parsed.output || parsed.message || data;
        }
      } catch {
        content = data;
      }
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Hiba történt az üzenet küldése közben. Kérlek próbáld újra.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Adatok Chat</h2>
          <p className="text-muted-foreground">Kérdezz az adataidról</p>
        </div>
        <div className="flex items-center gap-3">
          <ToggleGroup 
            type="single" 
            value={chatMode} 
            onValueChange={(value) => value && setChatMode(value as ChatMode)}
            className="bg-muted rounded-lg p-1"
          >
            <ToggleGroupItem 
              value="quick" 
              aria-label="Gyors mód"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 py-1.5 text-sm"
            >
              <Zap className="h-4 w-4 mr-1.5" />
              Gyors
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="thinking" 
              aria-label="Gondolkodó mód"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 py-1.5 text-sm"
            >
              <Brain className="h-4 w-4 mr-1.5" />
              Gondolkodó
            </ToggleGroupItem>
          </ToggleGroup>
          {messages.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearChat}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Csevegés törlése
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 border rounded-lg bg-card overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Üdvözöllek!</p>
              <p className="text-sm">Tedd fel kérdéseidet az adataiddal kapcsolatban.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                          toast({
                            description: "Szöveg vágólapra másolva!",
                          });
                        }}
                        className="self-start p-1 rounded hover:bg-muted-foreground/20 transition-colors text-muted-foreground hover:text-foreground"
                        title="Másolás vágólapra"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-3 shadow-sm',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div className="text-sm leading-relaxed max-w-none">
                          <Markdown
                            components={{
                              h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h3>,
                              h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h4>,
                              p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              ul: ({ children }) => <ul className="my-2 pl-5 list-disc space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="my-2 pl-5 list-decimal space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                              code: ({ children }) => <code className="bg-muted-foreground/20 px-1.5 py-0.5 rounded text-xs">{children}</code>,
                              pre: ({ children }) => <pre className="bg-muted-foreground/10 p-3 rounded-lg overflow-x-auto my-2">{children}</pre>,
                              blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-4 italic my-2">{children}</blockquote>,
                            }}
                          >
                            {message.content.replace(/\\n/g, '\n')}
                          </Markdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 items-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Írd be az üzeneted..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

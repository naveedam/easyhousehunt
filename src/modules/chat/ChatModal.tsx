import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enquiryId: string | null;
  propertyTitle?: string;
  participants?: { id: string; name: string; role: string }[];
}

export default function ChatModal({ open, onOpenChange, enquiryId, propertyTitle, participants = [] }: ChatModalProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useChat(enquiryId);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(text);
    setText('');
  };

  const getSenderInfo = (senderId: string) => {
    const p = participants.find(p => p.id === senderId);
    return p || { name: senderId === user?.id ? 'You' : 'Other', role: 'unknown' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="font-heading text-base">
            {propertyTitle || 'Chat'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Private conversation · Messages are not shared publicly
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 py-2 min-h-[300px] max-h-[50vh]" ref={scrollRef}>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                const sender = getSenderInfo(msg.sender_id);
                return (
                  <div key={msg.id} className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px] text-muted-foreground">{sender.name}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-auto">
                        {sender.role}
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        'rounded-xl px-3 py-2 max-w-[80%] text-sm',
                        isMe
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t flex gap-2">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

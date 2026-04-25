import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  sender_id: string;
  message: string;
  sender_name: string | null;
  sender_phone: string | null;
  created_at: string;
}

export default function ChatModal({
  propertyId,
  propertyTitle,
  receiverId,
  onClose,
}: {
  propertyId: string;
  propertyTitle: string;
  receiverId: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [step, setStep] = useState<"intro" | "chat">("intro");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("chat_" + propertyId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          if (payload.new.property_id === propertyId) {
            setMessages(prev => [...prev, payload.new]);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [propertyId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data);
      if (data.length > 0) setStep("chat");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    if (!receiverId) { alert("This property has no owner account yet."); return; }
    const { error } = await supabase.from("messages").insert({
      property_id: propertyId,
      sender_id: user.id,
      receiver_id: receiverId || null,
      message: newMessage.trim(),
      sender_name: senderName || user.email?.split("@")[0] || null,
      sender_phone: senderPhone || null,
      read: false,
    });
    if (error) { console.error("Message insert error:", error); alert(error.message); } else { setNewMessage(""); setStep("chat"); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{height: "560px"}}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold">
            {propertyTitle[0]}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{propertyTitle}</p>
            <p className="text-xs text-gray-400">Property Owner</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Intro */}
        {step === "intro" && (
          <div className="flex-1 flex flex-col justify-center px-6 space-y-4">
            <p className="text-center text-gray-300 text-sm">
              Introduce yourself to the owner of<br />
              <span className="text-orange-400 font-semibold">{propertyTitle}</span>
            </p>
            <div>
              <label className="text-xs text-gray-400">Your Name</label>
              <input className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. Rahul Sharma" value={senderName} onChange={e => setSenderName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Phone Number</label>
              <input className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. 9876543210" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Message *</label>
              <textarea className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 h-20 resize-none"
                placeholder="Hi, I'm interested in this property. Is it still available?"
                value={newMessage} onChange={e => setNewMessage(e.target.value)} />
            </div>
            <button onClick={sendMessage} disabled={!newMessage.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 py-3 rounded-xl font-semibold">
              Send Enquiry
            </button>
          </div>
        )}

        {/* Chat */}
        {step === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {messages.map(msg => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${isMine ? "bg-orange-500 text-white rounded-br-sm" : "bg-gray-700 text-gray-100 rounded-bl-sm"}`}>
                      {!isMine && msg.sender_name && <p className="text-xs text-orange-300 font-semibold mb-1">{msg.sender_name}</p>}
                      {!isMine && msg.sender_phone && <p className="text-xs text-gray-400 mb-1">📞 {msg.sender_phone}</p>}
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${isMine ? "text-orange-200" : "text-gray-500"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="px-3 py-3 border-t border-gray-700 flex gap-2">
              <input
                className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage} disabled={!newMessage.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold">
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

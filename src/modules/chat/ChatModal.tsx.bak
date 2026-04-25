import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ChatModal({
  propertyId,
  receiverId,
  onClose,
}: {
  propertyId: string;
  receiverId: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);

  // ----------------------------
  // INIT
  // ----------------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    fetchMessages();
  }, []);

  // ----------------------------
  // FETCH MESSAGES
  // ----------------------------
  const fetchMessages = async () => {
    const { data, error } = await (supabase as any)
      .from("messages")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true });

    if (!error) setMessages(data || []);
  };

  // ----------------------------
  // SEND MESSAGE
  // ----------------------------
  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const payload = {
      property_id: propertyId,
      sender_id: user.id,
      receiver_id: receiverId,
      message: newMessage,
    };

    const { error } = await (supabase as any)
      .from("messages")
      .insert([payload]);

    if (!error) {
      setNewMessage("");
      fetchMessages();
    }
  };

  // ----------------------------
  // REALTIME (optional but useful)
  // ----------------------------
  useEffect(() => {
    const channel = supabase
      .channel("chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.new.property_id === propertyId) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-[#020617] w-full max-w-md p-4 rounded">

        {/* HEADER */}
        <div className="flex justify-between mb-4">
          <h2>Chat</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* MESSAGES */}
        <div className="h-80 overflow-y-auto mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 ${
                msg.sender_id === user?.id
                  ? "text-right"
                  : "text-left"
              }`}
            >
              <span className="bg-[#1e293b] px-3 py-2 rounded inline-block">
                {msg.message}
              </span>
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 p-2 bg-[#1e293b] rounded"
            placeholder="Type message..."
          />
          <button
            onClick={sendMessage}
            className="bg-orange-500 px-4 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
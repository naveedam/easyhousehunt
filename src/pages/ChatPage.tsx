import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ChatPage() {
  const { id } = useParams(); // property id

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUser();
    fetchMessages();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("property_id", id)
      .order("created_at", { ascending: true });

    if (!error) setMessages(data || []);
  }

  async function sendMessage() {
    if (!text.trim() || !user) return;

    const { error } = await supabase.from("messages").insert([
      {
        property_id: id!,
        sender_id: user.id,
        receiver_id: user.id, // TEMP (we’ll fix owner later)
        message: text,
      },
    ]);

    if (!error) {
      setText("");
      fetchMessages();
    }
  }

  return (
    <div className="p-6 text-white h-screen flex flex-col">
      <h1 className="text-xl mb-4">Chat</h1>

      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.length === 0 && <p>No messages yet</p>}

        {messages.map((msg) => (
          <div key={msg.id} className="bg-gray-700 p-2 rounded">
            {msg.message}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 p-2 text-black"
          placeholder="Type message..."
        />
        <button
          onClick={sendMessage}
          className="bg-orange-500 px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
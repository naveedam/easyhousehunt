import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Message = {
  id: string;
  property_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
};

export default function ChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [user, setUser] = useState<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {
      fetchConversations(user.id);
    }
  };

  // -----------------------------
  // FETCH CONVERSATIONS
  // -----------------------------
  const fetchConversations = async (userId: string) => {
    const { data, error } = await (supabase as any)
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const map: any = {};

    data.forEach((msg: Message) => {
      const otherUser =
        msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

      const key = `${msg.property_id}_${otherUser}`;

      if (!map[key]) {
        map[key] = {
          property_id: msg.property_id,
          otherUser,
          lastMessage: msg.message,
          updatedAt: msg.created_at,
        };
      }
    });

    setConversations(Object.values(map));
  };

  // -----------------------------
  // OPEN CHAT
  // -----------------------------
  const openChat = async (conv: any) => {
    setSelectedChat(conv);

    const { data, error } = await (supabase as any)
      .from("messages")
      .select("*")
      .eq("property_id", conv.property_id)
      .or(
        `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setMessages(data);
  };

  // -----------------------------
  // SEND MESSAGE
  // -----------------------------
  const sendMessage = async () => {
    if (!newMsg.trim()) return;

    const { error } = await (supabase as any).from("messages").insert([
      {
        property_id: selectedChat.property_id,
        sender_id: user.id,
        receiver_id: selectedChat.otherUser,
        message: newMsg,
      },
    ]);

    if (error) {
      console.error(error);
      return;
    }

    setNewMsg("");
    openChat(selectedChat);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="flex flex-col h-screen bg-[#020617] text-white">

      {/* HEADER */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex gap-3 items-center">

          {/* BACK */}
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-orange-400 hover:underline"
          >
            ← Back
          </button>

          {/* HOME */}
          <button
            onClick={() => navigate("/")}
            className="text-sm text-green-400 hover:underline"
          >
            Home
          </button>

        </div>

        <h2 className="text-lg font-semibold">Inbox</h2>
      </div>

      <div className="flex flex-1">

        {/* LEFT - CONVERSATIONS */}
        <div className="w-[320px] border-r border-gray-800 p-4 overflow-y-auto">

          {conversations.map((c, i) => (
            <div
              key={i}
              onClick={() => openChat(c)}
              className="p-3 mb-3 bg-[#1e293b] rounded cursor-pointer hover:bg-[#334155]"
            >
              <p className="text-sm text-gray-400">
                Property: {c.property_id.slice(0, 6)}
              </p>
              <p>{c.lastMessage}</p>
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="text-gray-500">No conversations yet</p>
          )}
        </div>

        {/* RIGHT - CHAT */}
        <div className="flex-1 flex flex-col">

          {!selectedChat ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a conversation
            </div>
          ) : (
            <>
              {/* MESSAGES */}
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`mb-3 ${
                      m.sender_id === user.id
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    <span className="bg-[#1e293b] px-3 py-2 rounded inline-block">
                      {m.message}
                    </span>
                  </div>
                ))}
              </div>

              {/* INPUT */}
              <div className="p-3 border-t border-gray-800 flex gap-2">
                <input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
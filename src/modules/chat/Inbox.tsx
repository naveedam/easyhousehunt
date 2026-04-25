import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ChatModal from "./ChatModal";

interface Thread {
  property_id: string;
  property_title: string;
  other_user_id: string;
  last_message: string;
  last_time: string;
  unread: number;
}

export default function Inbox({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchThreads(); }, []);

  const fetchThreads = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("id, property_id, sender_id, receiver_id, message, created_at, sender_name, properties(title)")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const map = new Map<string, Thread>();
    data.forEach((msg: any) => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const key = `${msg.property_id}_${otherId}`;
      if (!map.has(key)) {
        map.set(key, {
          property_id: msg.property_id,
          property_title: msg.properties?.title || "Property",
          other_user_id: otherId,
          last_message: msg.message,
          last_time: msg.created_at,
          unread: (!msg.read && msg.receiver_id === user.id) ? 1 : 0,
        });
      }
    });

    setThreads(Array.from(map.values()));
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{height: "560px"}}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="font-bold text-lg">Messages</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">x</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
        ) : threads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
            <p className="text-4xl">📭</p>
            <p>No messages yet</p>
            <p className="text-sm text-gray-500">Connect with owners to start a conversation</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
            {threads.map(thread => (
              <div
                key={`${thread.property_id}_${thread.other_user_id}`}
                onClick={() => setActiveThread(thread)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {thread.property_title[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-sm truncate">{thread.property_title}</p>
                    <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {new Date(thread.last_time).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{thread.last_message}</p>
                </div>
                {thread.unread > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {thread.unread}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {activeThread && (
        <ChatModal
          propertyId={activeThread.property_id}
          propertyTitle={activeThread.property_title}
          receiverId={activeThread.other_user_id}
          onClose={() => { setActiveThread(null); fetchThreads(); }}
        />
      )}
    </div>
  );
}

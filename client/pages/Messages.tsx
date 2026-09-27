import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@server/_generated/api";
import type { Id } from "@server/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, MessageCircle, MessageSquarePlus, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type ThreadSummary = {
  partnerId: Id<"users">;
  partner: string;
  lastBody: string;
  lastAt: number;
  unread: number;
};

type Member = { _id: Id<"users">; name: string; isAnonymous: boolean };

type MessageRow = {
  _id: Id<"messages">;
  fromId: Id<"users">;
  body: string;
  readAt?: number;
  createdAt: number;
};

export default function Messages() {
  const [active, setActive] = useState<Id<"users"> | null>(null);
  const [composer, setComposer] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const inbox = useQuery(api.community.listInbox) as ThreadSummary[] | undefined;
  const members = useQuery(api.community.listMembers) as Member[] | undefined;
  const thread = useQuery(
    api.community.listThread,
    active ? { partnerId: active } : "skip",
  ) as MessageRow[] | undefined;
  const sendMessage = useMutation(api.community.sendMessage);
  const markRead = useMutation(api.community.markThreadRead);

  useEffect(() => {
    if (active && thread?.some((m) => m.readAt === undefined)) {
      void markRead({ partnerId: active });
    }
  }, [active, thread, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.length]);

  const handleSend = async () => {
    const text = composer.trim();
    if (!text || !active) return;
    setComposer("");
    try {
      await sendMessage({ toId: active, body: text });
    } catch {
      toast.error("Message failed to send. Check your connection and retry.");
    }
  };

  const activePartner =
    inbox?.find((t) => t.partnerId === active)?.partner ??
    members?.find((m) => m._id === active)?.name ??
    "Conversation";

  const filteredMembers = (members ?? []).filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#111111]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#111111]/60">
              Community messages
              <span className="border-2 border-[#111111] bg-[#7cc4f2] px-1.5 py-0.5 text-[#111111]">
                Direct &amp; private
              </span>
            </p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight">
              Talk to your neighbors
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-2 border-[#111111] bg-white shadow-[3px_3px_0_0_#111111] hover:shadow-none"
              onClick={() => {
                setActive(null);
                setShowPicker(true);
              }}
            >
              <MessageSquarePlus className="size-4" /> New message
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-2 border-[#111111] bg-white shadow-[3px_3px_0_0_#111111] hover:shadow-none"
            >
              <Link to="/dashboard">Back</Link>
            </Button>
          </div>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-[300px_1fr]">
          {/* Thread list */}
          <aside
            className={`sw-card h-fit bg-white p-0 ${active ? "hidden md:block" : ""}`}
          >
            <p className="border-b-2 border-[#111111] bg-[#ffd02f] px-4 py-2.5 text-sm font-black uppercase tracking-widest">
              Conversations
            </p>
            {inbox === undefined && (
              <p className="p-4 text-xs font-semibold text-[#111111]/60">Loading…</p>
            )}
            {inbox !== undefined && inbox.length === 0 && (
              <p className="p-4 text-xs font-semibold leading-relaxed text-[#111111]/60">
                No conversations yet. Use “New message” to reach a neighbor or coordinator.
              </p>
            )}
            {inbox?.map((t) => (
              <button
                key={t.partnerId}
                onClick={() => {
                  setActive(t.partnerId);
                  setShowPicker(false);
                }}
                className={`flex w-full items-start gap-3 border-b-2 border-[#111111]/10 p-3 text-left hover:bg-[#f4f2ec] ${
                  active === t.partnerId ? "bg-[#f4f2ec]" : ""
                }`}
              >
                <div className="flex size-9 shrink-0 items-center justify-center border-2 border-[#111111] bg-[#7cc4f2]">
                  <MessageCircle className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-black">{t.partner}</span>
                    {t.unread > 0 && (
                      <span className="shrink-0 border-2 border-[#111111] bg-[#ff5c39] px-1.5 text-[10px] font-black text-white">
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] font-semibold text-[#111111]/60">
                    {t.lastBody}
                  </p>
                </div>
              </button>
            ))}
          </aside>

          {/* Conversation / picker / empty state */}
          <section className="sw-card flex min-h-[480px] flex-col bg-white p-0">
            {active === null && !showPicker && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex size-14 items-center justify-center border-2 border-[#111111] bg-[#f4f2ec]">
                  <MessageCircle className="size-6" />
                </div>
                <p className="text-sm font-black uppercase tracking-wider">Pick a conversation</p>
                <p className="max-w-xs text-xs font-semibold leading-relaxed text-[#111111]/60">
                  Coordinate evacuations, share ground reports or ask for help — privately.
                </p>
              </div>
            )}

            {showPicker && active === null && (
              <div className="flex flex-col p-4">
                <p className="text-sm font-black uppercase tracking-wider">Start a conversation</p>
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members…"
                  className="mt-3 border-2 border-[#111111] font-semibold"
                />
                <div className="mt-3 max-h-80 divide-y-2 divide-[#111111]/10 overflow-y-auto border-2 border-[#111111]">
                  {filteredMembers.length === 0 && (
                    <p className="p-3 text-xs font-semibold text-[#111111]/60">
                      No members match. Others appear here once they join.
                    </p>
                  )}
                  {filteredMembers.map((m) => (
                    <button
                      key={m._id}
                      onClick={() => {
                        setActive(m._id);
                        setShowPicker(false);
                      }}
                      className="flex w-full items-center gap-3 bg-white p-3 text-left hover:bg-[#f4f2ec]"
                    >
                      <div className="flex size-8 items-center justify-center border-2 border-[#111111] bg-[#d9e8c5] text-xs font-black uppercase">
                        {m.name.slice(0, 2)}
                      </div>
                      <span className="text-sm font-bold">{m.name}</span>
                      {m.isAnonymous && (
                        <span className="ml-auto border border-[#111111] px-1 text-[9px] font-bold uppercase">
                          Guest
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {active !== null && (
              <>
                <div className="flex items-center gap-3 border-b-2 border-[#111111] bg-[#f4f2ec] px-4 py-2.5">
                  <button
                    className="border-2 border-[#111111] bg-white p-1 shadow-[2px_2px_0_0_#111111] hover:shadow-none md:hidden"
                    onClick={() => setActive(null)}
                    title="Back to conversations"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <p className="text-sm font-black uppercase tracking-wider">{activePartner}</p>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  {thread?.length === 0 && (
                    <p className="text-xs font-semibold text-[#111111]/60">
                      No messages yet — say hello.
                    </p>
                  )}
                  {thread?.map((m) => {
                    const mine = m.fromId !== active;
                    return (
                      <div
                        key={m._id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] border-2 border-[#111111] px-3 py-2 text-xs font-semibold leading-relaxed shadow-[3px_3px_0_0_#111111] ${
                            mine ? "bg-[#ffd02f]" : "bg-[#f4f2ec]"
                          }`}
                        >
                          {m.body}
                          <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-[#111111]/50">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {mine && m.readAt !== undefined ? " · read" : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div className="flex gap-2 border-t-2 border-[#111111] p-3">
                  <Input
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Type a message…"
                    className="border-2 border-[#111111] font-semibold"
                  />
                  <Button
                    className="border-2 border-[#111111] bg-[#111111] px-3 text-white shadow-[3px_3px_0_0_#ffd02f] hover:shadow-none"
                    onClick={() => void handleSend()}
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

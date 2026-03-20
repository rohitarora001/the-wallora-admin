import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Send, ShieldCheck, UserCircle } from "lucide-react";

type TicketStatus = "Open" | "InProgress" | "Resolved" | "Closed";

interface SupportMessage {
  id: string;
  body: string;
  senderType: "Customer" | "Admin";
  senderName: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  customerEmail: string;
  customerName: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

const STATUS_OPTIONS: { label: string; value: TicketStatus }[] = [
  { label: "Open",        value: "Open" },
  { label: "In Progress", value: "InProgress" },
  { label: "Resolved",    value: "Resolved" },
  { label: "Closed",      value: "Closed" },
];

const STATUS_BADGE: Record<TicketStatus, string> = {
  Open:       "bg-blue-100 text-blue-700",
  InProgress: "bg-yellow-100 text-yellow-700",
  Resolved:   "bg-green-100 text-green-700",
  Closed:     "bg-slate-100 text-slate-600",
};

export default function SupportTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: ticket, isLoading } = useQuery<SupportTicket>({
    queryKey: ["admin-ticket", id],
    queryFn: () => api.get(`/support/admin/tickets/${id}`),
    enabled: !!id,
  });

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !ticket) return;
    setSending(true);
    try {
      await api.post(`/support/admin/tickets/${ticket.id}/replies`, { message: reply });
      setReply("");
      qc.invalidateQueries({ queryKey: ["admin-ticket", id] });
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast({ title: "Reply sent", description: "The customer will be notified by email." });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/support/admin/tickets/${ticket.id}/status`, { status });
      qc.invalidateQueries({ queryKey: ["admin-ticket", id] });
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast({ title: "Status updated" });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed.", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  if (!ticket) return <div className="text-center py-20 text-sm text-slate-500">Ticket not found.</div>;

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <button onClick={() => navigate("/support")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" />Back to tickets
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-slate-900">{ticket.subject}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {ticket.ticketNumber} · <strong>{ticket.customerName}</strong> ({ticket.customerEmail}) ·{" "}
              {new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[ticket.status]}`}>
              {ticket.status === "InProgress" ? "In Progress" : ticket.status}
            </span>
          </div>
        </div>

        {/* Status changer */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <span className="text-xs text-slate-500 mr-1">Set status:</span>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              disabled={updatingStatus || ticket.status === opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-40 ${
                ticket.status === opt.value
                  ? STATUS_BADGE[opt.value]
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="bg-white rounded-lg border p-5 mb-4 space-y-4">
        {ticket.messages.map(msg => {
          const isAdmin = msg.senderType === "Admin";
          return (
            <div key={msg.id} className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? "bg-[#1d283a]" : "bg-slate-200"}`}>
                {isAdmin
                  ? <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  : <UserCircle className="w-3.5 h-3.5 text-slate-500" />}
              </div>
              <div className={`max-w-[80%] ${isAdmin ? "items-end" : ""}`}>
                <div className={`rounded-xl px-3.5 py-3 ${isAdmin ? "bg-[#1d283a] text-white" : "bg-slate-100 text-slate-800"}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                </div>
                <p className={`text-[10px] mt-1 text-slate-400 ${isAdmin ? "text-right" : "text-left"}`}>
                  {msg.senderName} · {new Date(msg.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply form */}
      {ticket.status !== "Closed" ? (
        <form onSubmit={handleReply} className="bg-white rounded-lg border p-5">
          <p className="text-xs font-semibold text-slate-700 mb-3">Reply as {user?.firstName ?? "Support Team"}</p>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            rows={4}
            maxLength={3000}
            placeholder="Type your reply to the customer…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-800"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-slate-400">{reply.length}/3000</span>
            <Button type="submit" disabled={sending || !reply.trim()} size="sm" className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending…" : "Send Reply"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-center text-sm text-slate-400 py-4">This ticket is closed.</p>
      )}
    </div>
  );
}

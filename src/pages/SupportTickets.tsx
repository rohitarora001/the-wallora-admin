import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type TicketStatus = "Open" | "InProgress" | "Resolved" | "Closed";

interface TicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  customerEmail: string;
  customerName: string;
  status: TicketStatus;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_FILTERS: { label: string; value: TicketStatus | "All" }[] = [
  { label: "All",         value: "All" },
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

const STATUS_LABEL: Record<TicketStatus, string> = {
  Open: "Open", InProgress: "In Progress", Resolved: "Resolved", Closed: "Closed",
};

export default function SupportTickets() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "All">("All");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tickets", status, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: "1", pageSize: "50" });
      if (status !== "All") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      return api.get<{ items: TicketSummary[]; totalCount: number }>(`/support/admin/tickets?${params}`);
    },
  });

  const tickets = data?.items ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Support Tickets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data?.totalCount ?? 0} total tickets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tickets, emails…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === f.value
                  ? "bg-[#1d283a] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-sm text-slate-500">Loading…</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500">No tickets found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Ticket</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Messages</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map(t => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/support/${t.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.ticketNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-xs">{t.customerName}</p>
                    <p className="text-[11px] text-slate-400">{t.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="truncate text-slate-700 text-xs">{t.subject}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{t.messageCount}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(t.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

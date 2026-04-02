import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";

import api from "../../api/client";
import { StatusCard } from "../../components/StatusCard";
import { Table, StatusBadge } from "../../components/Table";

interface StatsResponse {
  total_books: number;
  available_copies: number;
  overdue_loans: number;
}

interface LoanItem {
  id: number;
  book_id: string;
  member_id: string;
  due_date: string;
  status: string;
}

export function DashboardPage() {
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["book-stats"],
    queryFn: async () => (await api.get("/books/stats")).data,
  });

  const { data: overdue } = useQuery<LoanItem[]>({
    queryKey: ["overdue"],
    queryFn: async () => (await api.get("/loans/overdue")).data,
  });

  const chartData = [
    { label: "Total", value: stats?.total_books ?? 0 },
    { label: "Available", value: stats?.available_copies ?? 0 },
    { label: "Overdue", value: stats?.overdue_loans ?? 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
        <StatusCard label="Total Books" value={stats?.total_books ?? 0} sparkline="▲ +4%" />
        <StatusCard label="Available" value={stats?.available_copies ?? 0} sparkline="Stable" />
        <StatusCard label="Overdue Loans" value={stats?.overdue_loans ?? 0} sparkline="▼ -2%" />
      </section>
      <section style={{ background: "rgba(33,33,33,0.8)", borderRadius: "1rem", padding: "1.5rem" }}>
        <h3>Inventory Snapshot</h3>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <XAxis dataKey="label" stroke="#888" />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#1f6aa5" fill="#1f6aa533" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section>
        <h3>Overdue Loans</h3>
        <Table
          headers={["Loan ID", "Book", "Member", "Due Date", "Status"]}
          rows={
            overdue && overdue.length > 0 ? (
              overdue.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.id}</td>
                  <td>{loan.book_id}</td>
                  <td>{loan.member_id}</td>
                  <td>{new Date(loan.due_date).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={loan.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No overdue items 🎉</td>
              </tr>
            )
          }
        />
      </section>
    </div>
  );
}

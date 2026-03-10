"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { date: string; exams: number; corrections: number }[];
}

export function ActivityChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCorrections" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" fontSize={12} tick={{ fill: "#64748b" }} />
        <YAxis fontSize={12} tick={{ fill: "#64748b" }} />
        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
        <Area type="monotone" dataKey="exams" name="Exámenes" stroke="#4f46e5" fill="url(#colorExams)" strokeWidth={2} />
        <Area type="monotone" dataKey="corrections" name="Correcciones" stroke="#10b981" fill="url(#colorCorrections)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

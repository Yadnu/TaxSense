"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const PLACEHOLDER_DATA = [
  { label: "Gross Income",      value: 0, fill: "hsl(217 91% 60%)" },
  { label: "Deductions",        value: 0, fill: "hsl(142 71% 45%)" },
  { label: "Taxable Income",    value: 0, fill: "hsl(38 92% 50%)"  },
  { label: "Federal Tax",       value: 0, fill: "hsl(0 84% 60%)"   },
  { label: "California Tax",    value: 0, fill: "hsl(0 72% 51%)"   },
];

function EmptyState() {
  return (
    <div className="flex h-[180px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border">
      <div className="flex items-end gap-1.5">
        {[40, 60, 45, 25, 20].map((h, i) => (
          <div
            key={i}
            className="w-8 animate-pulse rounded-t bg-muted"
            style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground/60">
        Chart will populate after uploading documents
      </p>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const { label } = payload[0].payload;
  const value = payload[0].value;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="font-numeric text-sm font-bold text-foreground">
        ${value.toLocaleString()}
      </p>
    </div>
  );
}

interface DashboardChartProps {
  data?: Array<{ label: string; value: number }>;
}

export function DashboardChart({ data }: DashboardChartProps) {
  const isEmpty = !data || data.every((d) => d.value === 0);

  if (isEmpty) return <EmptyState />;

  const chartData = PLACEHOLDER_DATA.map((item, i) => ({
    ...item,
    value: data?.[i]?.value ?? item.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

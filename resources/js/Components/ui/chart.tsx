import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { cn } from "cn"
import { BULAN, formatRupiah } from "./format"

/* -------------------------------------------------------------------------- */
/*  shadcn chart primitives (Recharts 2)                                      */
/* -------------------------------------------------------------------------- */

type ChartConfig = Record<string, { label?: React.ReactNode; color?: string; icon?: React.ComponentType }>

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error("useChart must be used within a <ChartContainer />")
  return ctx
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
}) {
  const uid = React.useId()
  const chartId = `chart-${id || uid.replace(/:/g, "")}`
  const vars = Object.entries(config)
    .filter(([, c]) => c.color)
    .map(([k, c]) => `--color-${k}: ${c.color};`)
    .join(" ")
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <style dangerouslySetInnerHTML={{ __html: `[data-chart=${chartId}] { ${vars} }` }} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  labelFormatter,
  valueFormatter = (v: number) => v.toLocaleString("id-ID"),
  className,
}: {
  active?: boolean
  payload?: Array<{ dataKey?: string | number; name?: string; value?: number; color?: string; payload?: any }>
  label?: React.ReactNode
  hideLabel?: boolean
  labelFormatter?: (label: React.ReactNode, payload: any[]) => React.ReactNode
  valueFormatter?: (value: number) => React.ReactNode
  className?: string
}) {
  const { config } = useChart()
  if (!active || !payload?.length) return null
  return (
    <div
      className={cn(
        "grid min-w-32 gap-1.5 rounded-lg border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg",
        className
      )}
    >
      {!hideLabel && <div className="font-medium">{labelFormatter ? labelFormatter(label, payload) : label}</div>}
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? "value")
        const c = config[key]
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: item.color ?? `var(--color-${key})` }} />
            <span className="text-muted-foreground">{c?.label ?? item.name}</span>
            <span className="ms-auto font-medium tabular-nums">{valueFormatter(Number(item.value))}</span>
          </div>
        )
      })}
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  payload,
  className,
}: {
  payload?: Array<{ dataKey?: string | number; value?: string; color?: string }>
  className?: string
}) {
  const { config } = useChart()
  if (!payload?.length) return null
  return (
    <div className={cn("flex items-center justify-center gap-4 pt-3", className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value ?? "value")
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-[2px]" style={{ background: item.color }} />
            {config[key]?.label ?? item.value}
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  IncomeChart – totalPemasukan per bulan from laporan_pembayarans           */
/* -------------------------------------------------------------------------- */

type IncomeRow = { bulan: number; tahun: number; totalPemasukan: number }

const compactRupiah = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jt` : v >= 1000 ? `${v / 1000} rb` : String(v)

function IncomeChart({
  data,
  color = "var(--chart-1)",
  className,
}: {
  /** One row per month, in the order shown left to right. */
  data: IncomeRow[]
  /** Defaults to chart-1 (HIG Blue). */
  color?: string
  className?: string
}) {
  const rows = data.map((d) => ({ ...d, label: BULAN[d.bulan - 1]?.slice(0, 3) ?? String(d.bulan) }))
  return (
    <ChartContainer
      config={{ totalPemasukan: { label: "Pemasukan", color } }}
      className={cn("aspect-auto h-64 w-full", className)}
      aria-label="Grafik pemasukan per bulan"
    >
      <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={compactRupiah} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              valueFormatter={formatRupiah}
              labelFormatter={(_l, p) => {
                const r = p?.[0]?.payload as IncomeRow | undefined
                return r ? `${BULAN[r.bulan - 1]} ${r.tahun}` : _l
              }}
            />
          }
        />
        <Bar dataKey="totalPemasukan" fill="var(--color-totalPemasukan)" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ChartContainer>
  )
}

const { Bar: ChartBar, BarChart: ChartBarChart, Line: ChartLine, LineChart: ChartLineChart, CartesianGrid: ChartGrid, XAxis: ChartXAxis, YAxis: ChartYAxis } = RechartsPrimitive

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  IncomeChart,
  ChartBar,
  ChartBarChart,
  ChartLine,
  ChartLineChart,
  ChartGrid,
  ChartXAxis,
  ChartYAxis,
}
export type { ChartConfig, IncomeRow }

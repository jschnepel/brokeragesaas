interface BarGroup {
  label: string;
  values: { name: string; value: number; color: string }[];
}

interface ParallelBarChartProps {
  groups: BarGroup[];
  format?: (v: number) => string;
}

const ParallelBarChart: React.FC<ParallelBarChartProps> = ({ groups, format }) => {
  const fmt = format ?? ((v: number) => `${v}`);

  return (
    <div className="space-y-8">
      {groups.map((group, gi) => {
        const maxVal = Math.max(...group.values.map(v => v.value));
        return (
          <div key={gi}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-[2px] h-3 bg-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#0C1C2E]/50">
                {group.label}
              </span>
            </div>
            <div className="space-y-2">
              {group.values.map((bar, bi) => {
                const pct = maxVal > 0 ? (bar.value / maxVal) * 100 : 0;
                return (
                  <div key={bi} className="flex items-center gap-3 group/bar">
                    <span className="text-[10px] text-[#0C1C2E]/60 w-28 shrink-0 truncate font-medium">
                      {bar.name}
                    </span>
                    <div className="flex-1 h-5 bg-[#F9F8F6] overflow-hidden">
                      <div
                        className="h-full rounded-r-sm transition-all duration-700 group-hover/bar:opacity-80"
                        style={{ width: `${pct}%`, backgroundColor: bar.color }}
                      />
                    </div>
                    <span className="text-[10px] font-serif text-[#0C1C2E] w-20 text-right shrink-0 font-medium">
                      {fmt(bar.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ParallelBarChart;

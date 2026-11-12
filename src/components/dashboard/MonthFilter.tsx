import { useMemo } from "react";

export interface MonthOption {
  value: string; // "2026-11" or "all"
  label: string; // "Nov 2026" or "All Time"
}

interface MonthFilterProps {
  value: string;
  onChange: (value: string) => void;
  /** Number of months to show in dropdown (default: 12) */
  monthsBack?: number;
}

export default function MonthFilter({ value, onChange, monthsBack = 12 }: MonthFilterProps) {
  const options = useMemo(() => {
    const result: MonthOption[] = [{ value: "all", label: "All Time" }];
    const now = new Date();
    
    for (let i = 0; i < monthsBack; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      result.push({ value: val, label });
    }
    
    return result;
  }, [monthsBack]);

  return (
    <select
      className="month-filter"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

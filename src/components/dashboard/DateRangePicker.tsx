export type DashboardRange = "7d" | "30d" | "90d" | "all";

interface DateRangePickerProps {
  value: DashboardRange;
  onChange: (range: DashboardRange) => void;
}

const OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All time" },
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="date-range-picker" role="tablist" aria-label="Date range">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={value === opt.value ? "active" : ""}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

type ProgressBarProps = {
  value: number
  max: number
  label: string
  color?: string
}

export function ProgressBar({ value, max, label, color }: ProgressBarProps) {
  const percent = max <= 0 ? 0 : Math.min(100, (value / max) * 100)

  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
    >
      <div
        className="progress__fill"
        style={{ width: `${percent}%`, background: color }}
      />
    </div>
  )
}

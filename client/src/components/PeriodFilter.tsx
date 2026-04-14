import type { Period } from '../types';

interface Props {
  value: Period;
  onChange: (period: Period) => void;
}

const OPTIONS: { label: string; value: Period }[] = [
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
  { label: '180 dias', value: 180 },
  { label: '1 ano', value: 365 },
  { label: 'Tudo', value: 'all' },
];

export function PeriodFilter({ value, onChange }: Props) {
  return (
    <div className="period-filter">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={value === opt.value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

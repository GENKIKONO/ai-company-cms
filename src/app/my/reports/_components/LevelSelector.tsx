'use client';

import { type ReportLevel } from '../_types';

interface LevelSelectorProps {
  value: ReportLevel;
  onChange: (level: ReportLevel) => void;
  disabled?: boolean;
}

const LEVELS: Array<{ value: ReportLevel; label: string; description: string }> = [
  { value: 'basic', label: 'ベーシック', description: '基本的なKPIと概要' },
  { value: 'advanced', label: 'アドバンスト', description: '詳細分析と改善提案' }
];

export function LevelSelector({ value, onChange, disabled }: LevelSelectorProps) {
  return (
    <div className="flex gap-2">
      {LEVELS.map((level) => (
        <button
          key={level.value}
          type="button"
          onClick={() => onChange(level.value)}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${value === level.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={level.description}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}

'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatPeriodLabel } from '../_types';

interface MonthSelectorProps {
  year: number;
  month: number;
  onSelect: (year: number, month: number) => void;
  availableMonths?: Array<{ year: number; month: number; hasReport: boolean }>;
  disabled?: boolean;
}

export function MonthSelector({
  year,
  month,
  onSelect,
  availableMonths,
  disabled
}: MonthSelectorProps) {
  const handlePrevMonth = () => {
    if (disabled) return;
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    onSelect(newYear, newMonth);
  };

  const handleNextMonth = () => {
    if (disabled) return;
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;

    // Don't allow future months
    const now = new Date();
    if (newYear > now.getFullYear() || (newYear === now.getFullYear() && newMonth > now.getMonth() + 1)) {
      return;
    }

    onSelect(newYear, newMonth);
  };

  const handleYearChange = (newYear: number) => {
    if (disabled) return;
    onSelect(newYear, month);
  };

  const currentMonthInfo = availableMonths?.find(m => m.year === year && m.month === month);
  const now = new Date();
  const isCurrentOrFuture = year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1);

  return (
    <div className="flex items-center gap-4">
      {/* Year Selector */}
      <select
        value={year}
        onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
      >
        {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
          <option key={y} value={y}>{y}年</option>
        ))}
      </select>

      {/* Month Navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={disabled}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="前月"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>

        <div className="min-w-[120px] text-center">
          <span className="text-lg font-semibold text-gray-900">
            {formatPeriodLabel(year, month)}
          </span>
          {currentMonthInfo && (
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
              currentMonthInfo.hasReport
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {currentMonthInfo.hasReport ? 'レポート有' : '未生成'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          disabled={disabled || isCurrentOrFuture}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="次月"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Quick Month Pills */}
      <div className="hidden md:flex gap-1">
        {Array.from({ length: 6 }, (_, i) => {
          const m = month - 3 + i;
          let targetMonth = m;
          let targetYear = year;

          if (m <= 0) {
            targetMonth = 12 + m;
            targetYear = year - 1;
          } else if (m > 12) {
            targetMonth = m - 12;
            targetYear = year + 1;
          }

          // Skip future months
          if (targetYear > now.getFullYear() ||
              (targetYear === now.getFullYear() && targetMonth > now.getMonth() + 1)) {
            return null;
          }

          const isSelected = targetYear === year && targetMonth === month;
          const info = availableMonths?.find(x => x.year === targetYear && x.month === targetMonth);

          return (
            <button
              key={`${targetYear}-${targetMonth}`}
              type="button"
              onClick={() => onSelect(targetYear, targetMonth)}
              disabled={disabled}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-colors
                ${isSelected
                  ? 'bg-blue-600 text-white'
                  : info?.hasReport
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {targetMonth}月
            </button>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
}

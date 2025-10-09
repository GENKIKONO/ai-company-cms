import clsx from 'clsx';

export default function StatCard({
  title, 
  value, 
  subtitle, 
  className,
}: {
  title: string; 
  value: string; 
  subtitle?: string; 
  className?: string;
}) {
  return (
    <div className={clsx(
      'snap-center min-w-[85%] sm:min-w-0',
      'rounded-2xl border border-gray-200 bg-white shadow-sm',
      'p-4 sm:p-6',
      'transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
      className
    )}>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-base font-semibold text-gray-800">{title}</div>
      {subtitle && (
        <div className="mt-1 text-sm text-gray-500 leading-6">{subtitle}</div>
      )}
    </div>
  );
}
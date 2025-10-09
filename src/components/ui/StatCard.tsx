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
      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-7 sm:leading-8 tracking-normal whitespace-nowrap">{value}</div>
      <div className="mt-1 text-[15px] sm:text-base lg:text-lg font-semibold text-gray-800 leading-7 sm:leading-8 break-keep [text-wrap:balance]">{title}</div>
      {subtitle && (
        <div className="mt-1 text-[13px] sm:text-sm text-gray-500 leading-6 break-keep [text-wrap:pretty]">{subtitle}</div>
      )}
    </div>
  );
}
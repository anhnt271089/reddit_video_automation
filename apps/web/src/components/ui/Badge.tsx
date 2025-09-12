import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'info'
    | 'warning';
}

const badgeVariants = {
  variant: {
    default:
      'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    secondary:
      'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
    destructive:
      'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    outline: 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
    success:
      'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
    info: 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100',
    warning:
      'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
  },
};

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1',
        badgeVariants.variant[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };

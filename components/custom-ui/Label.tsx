import type React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={`block text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 ${className ?? ''}`}
      {...props}
    >
      {children}
    </label>
  );
}
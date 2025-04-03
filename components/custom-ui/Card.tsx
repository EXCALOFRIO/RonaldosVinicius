import type React from 'react';

// Simple wrapper components using Tailwind classes

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow-lg overflow-hidden ${className ?? ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col space-y-1.5 p-5 md:p-6 bg-muted/40 dark:bg-muted/20 border-b ${className ?? ''}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    // Using h3 as a sensible default, adjust if needed
    <h3 className={`text-xl md:text-2xl font-semibold leading-none tracking-tight ${className ?? ''}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm md:text-base text-muted-foreground pt-1 ${className ?? ''}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 md:p-6 lg:p-8 ${className ?? ''}`} {...props}>
      {children}
    </div>
  );
}
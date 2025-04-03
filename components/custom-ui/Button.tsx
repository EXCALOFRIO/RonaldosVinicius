import type React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'icon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({
  className,
  variant = 'primary',
  size = 'default',
  children,
  ...props
}: ButtonProps) {
  // Base styles
  let baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  // Variant styles
  let variantClasses = '';
  switch (variant) {
    case 'secondary':
      variantClasses = 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      break;
    case 'outline':
      variantClasses =
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
      break;
    case 'ghost':
      variantClasses = 'hover:bg-accent hover:text-accent-foreground';
      break;
    case 'destructive':
        variantClasses = 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
        break;
    case 'icon': // Special case for icon buttons often used with ghost
        variantClasses = 'hover:bg-accent hover:text-accent-foreground';
        break;
    case 'primary': // Default
    default:
      variantClasses = 'bg-primary text-primary-foreground hover:bg-primary/90';
      break;
  }

  // Size styles
  let sizeClasses = '';
   switch (size) {
    case 'sm':
      sizeClasses = 'h-9 rounded-md px-3';
      break;
    case 'lg':
      sizeClasses = 'h-11 rounded-md px-8'; // Match shadcn lg
      break;
    case 'icon':
        sizeClasses = 'h-10 w-10'; // Match shadcn icon size
        if (variant === 'icon') variantClasses = 'hover:bg-accent hover:text-accent-foreground'; // Ensure hover for icon variant specifically
        break;
    case 'default':
    default:
      sizeClasses = 'h-10 px-4 py-2'; // Match shadcn default
      break;
  }
   // Specific override for icon variant + icon size
   if (variant === 'icon' && size === 'icon') {
     sizeClasses = 'h-10 w-10';
     variantClasses = 'hover:bg-accent hover:text-accent-foreground';
   }


  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
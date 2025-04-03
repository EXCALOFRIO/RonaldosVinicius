import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { ChevronDown, Check } from 'lucide-react';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface SelectContextProps {
  isOpen: boolean;
  selectedValue: string | undefined;
  selectedLabel: ReactNode | undefined;
  toggleOpen: () => void;
  handleSelect: (value: string, label: ReactNode) => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  contentId: string;
  listboxId: string;
}

const SelectContext = createContext<SelectContextProps | null>(null);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('useSelectContext must be used within a Select provider');
  }
  return context;
};

interface SelectProps {
  children: ReactNode;
  defaultValue?: string;
  defaultLabel?: ReactNode;
  onValueChange?: (value: string) => void; // Añadido para notificar al padre
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

interface SelectContentProps {
  children: ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Select({ children, defaultValue, defaultLabel, onValueChange }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(defaultValue);
  const [selectedLabel, setSelectedLabel] = useState<ReactNode | undefined>(defaultLabel);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const contentId = React.useId();
  const listboxId = React.useId();

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback((value: string, label: ReactNode) => {
    setSelectedValue(value);
    setSelectedLabel(label);
    setIsOpen(false);
    triggerRef.current?.focus();
    onValueChange?.(value); // Notificar al padre
  }, [onValueChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const contextValue: SelectContextProps = {
    isOpen,
    selectedValue,
    selectedLabel,
    toggleOpen,
    handleSelect,
    triggerRef,
    contentId,
    listboxId,
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { toggleOpen, isOpen, triggerRef, contentId } = useSelectContext();
    const combinedRef = React.useCallback((node: HTMLButtonElement) => {
      triggerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }, [triggerRef, ref]);

    return (
      <button
        ref={combinedRef}
        type="button"
        onClick={toggleOpen}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? contentId : undefined}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const { selectedLabel } = useSelectContext();
  return (
    <span className={cn(!selectedLabel && "text-muted-foreground", className)}>
      {selectedLabel ?? placeholder ?? 'Select...'}
    </span>
  );
}
SelectValue.displayName = 'SelectValue';

export function SelectContent({ children, className }: SelectContentProps) {
  const { isOpen, contentId, listboxId } = useSelectContext();
  if (!isOpen) return null;

  return (
    <div
      id={contentId}
      className={cn(
        'absolute z-50 mt-1 min-w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
        'top-full left-0',
        className
      )}
    >
      <div role="listbox" id={listboxId} className="p-1 max-h-60 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
SelectContent.displayName = 'SelectContent';

export function SelectItem({ value, children, className, disabled }: SelectItemProps) {
  const { handleSelect, selectedValue } = useSelectContext();
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (!disabled) handleSelect(value, children);
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      data-disabled={disabled ? '' : undefined}
      data-selected={isSelected ? '' : undefined}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-base outline-none',
        !disabled && 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      tabIndex={disabled ? -1 : 0}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
}
SelectItem.displayName = 'SelectItem';
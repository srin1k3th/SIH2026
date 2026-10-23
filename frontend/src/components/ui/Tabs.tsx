import * as TabsPrimitive from '@radix-ui/react-tabs';
import clsx from 'clsx';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={clsx(
        'inline-flex items-center gap-1 border-b border-border w-full text-sm text-primary-muted',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={clsx(
        'inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all duration-150',
        'border-b-2 border-transparent -mb-[1px]',
        'text-primary-muted hover:text-primary',
        'data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:font-semibold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={clsx('mt-4 focus-visible:outline-none', className)}
      {...props}
    />
  );
}

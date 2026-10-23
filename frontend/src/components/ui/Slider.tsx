import * as SliderPrimitive from '@radix-ui/react-slider';
import clsx from 'clsx';

export function Slider({ className, ...props }: SliderPrimitive.SliderProps) {
  return (
    <SliderPrimitive.Root
      className={clsx(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200">
        <SliderPrimitive.Range className="absolute h-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-accent bg-white shadow-md ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" />
    </SliderPrimitive.Root>
  );
}

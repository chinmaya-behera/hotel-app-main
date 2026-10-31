import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'brand' | 'accent' | 'ghost' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant;
  size?: Size;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  /** when set, renders a Next.js Link styled as a button */
  href?: string;
  children: ReactNode;
}

export function Button({
  variant = 'ghost',
  size = 'md',
  iconLeft: IconLeft,
  iconRight: IconRight,
  href,
  className,
  style,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn('btn', `btn-${variant}`, `btn-${size}`, className);
  const content = (
    <>
      {IconLeft && <IconLeft className="h-4 w-4 shrink-0" aria-hidden />}
      <span>{children}</span>
      {IconRight && <IconRight className="h-4 w-4 shrink-0" aria-hidden />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} style={style}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} style={style} {...rest}>
      {content}
    </button>
  );
}

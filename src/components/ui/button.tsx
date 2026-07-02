// SPDX-License-Identifier: WTFPL
import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'secondary' };

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return <button className={cn('btn', variant, className)} {...props} />;
}

// SPDX-License-Identifier: WTFPL
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card glow', className)} {...props} />;
}

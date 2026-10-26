'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useDemo } from '@/lib/store';
import { accentVars } from '@/lib/utils';
import type { RoleMeta } from '@/types/demo';

export function RoleCard({ role, index }: { role: RoleMeta; index: number }) {
  const { state } = useDemo();
  const Icon = role.icon;

  return (
    <Link
      href={role.path}
      className="role-card group"
      style={accentVars(role)}
      aria-label={`Open the ${role.name} dashboard`}
    >
      <div className="flex items-start justify-between">
        <span className="icon-tile h-12 w-12">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <span className="font-display text-3xl text-white/15 transition group-hover:text-white/40" aria-hidden>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div>
        <h3 className="font-display text-xl leading-snug text-white">{role.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-mist-300">{role.tagline}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {role.scopes.map((s) => (
          <Badge key={s} icon={false}>
            {s}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-1 text-sm font-semibold">
        <span className="accent-text inline-flex items-center gap-1.5">
          Enter dashboard
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
        </span>
        {state.persona === role.id ? (
          <Badge tone="accent">Last viewed</Badge>
        ) : (
          <span className="text-[11px] font-medium text-mist-500">{role.surface === 'mobile' ? 'Mobile-first' : 'Desktop'}</span>
        )}
      </div>
    </Link>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Compass, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TopBar } from '@/components/shared/TopBar';
import { RoleCard } from '@/components/home/RoleCard';
import { quickLinkById, quickLinks, roles } from '@/lib/roles';
import { accentVars } from '@/lib/utils';
import type { RoleMeta } from '@/types/demo';

const roleText = (r: RoleMeta) => [r.name, r.short, r.tagline, r.id, ...r.keywords, ...r.scopes].join(' ').toLowerCase();

export function HomeView() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filteredRoles = roles.filter((r) => terms.every((t) => roleText(r).includes(t)));
  const filteredLinks = quickLinks.filter((l) => terms.every((t) => `${l.name} ${l.keywords}`.toLowerCase().includes(t)));
  const total = filteredRoles.length + filteredLinks.length;
  const firstTarget = filteredRoles[0]?.path ?? filteredLinks[0]?.href;
  const firstName = filteredRoles[0]?.name ?? filteredLinks[0]?.name;

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && firstTarget) router.push(firstTarget);
    if (e.key === 'Escape') {
      setQuery('');
      e.currentTarget.blur();
    }
  }

  const guest = quickLinkById.guest;
  const site = quickLinkById.site;
  const GuestIcon = guest.icon;
  const SiteIcon = site.icon;

  return (
    <>
      <TopBar active="home" showRail={false} />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:pt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/[0.08] pb-6">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Portal login
            </h1>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button href={guest.href} size="md" variant="accent" style={accentVars(guest)} iconLeft={GuestIcon}>
              Guest Portal
            </Button>
            <Button href={site.href} size="md" variant="subtle" style={accentVars(site)} iconLeft={SiteIcon}>
              Public Hotel Website
            </Button>
          </div>
        </div>

        <div className="mt-6 max-w-xl">
          <label htmlFor="role-search" className="sr-only">
            Search roles or jump to a page
          </label>
          <div className="search-box flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-850/80 px-4 py-3 shadow-panel">
            <Search className="h-5 w-5 shrink-0 text-mist-400" aria-hidden />
            <input
              id="role-search"
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              placeholder="Find a role: refund, rooms, alerts…"
              className="w-full bg-transparent text-sm text-white placeholder:text-mist-500 focus:outline-none"
            />
            {query ? (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="text-mist-400 hover:text-white">
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <kbd className="kbd">/</kbd>
            )}
          </div>
          {terms.length > 0 && (
            <p className="mt-2 text-xs text-mist-400" aria-live="polite">
              {total === 0 ? 'No matches.' : `${total} match${total === 1 ? '' : 'es'}. Press Enter to open ${firstName}.`}
            </p>
          )}
        </div>

        <section className="mt-8" aria-labelledby="roles-heading">
          <h2 id="roles-heading" className="mb-4 font-display text-xl text-white">
            Staff roles
          </h2>

          {terms.length > 0 && filteredLinks.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-mist-400">Jump to:</span>
              {filteredLinks.map((l) => (
                <Button key={l.id} href={l.href} size="sm" variant="accent" style={accentVars(l)} iconLeft={l.icon}>
                  {l.name}
                </Button>
              ))}
            </div>
          )}

          {filteredRoles.length === 0 ? (
            <div className="panel grid place-items-center gap-3 py-14 text-center">
              <Compass className="h-6 w-6 text-mist-500" aria-hidden />
              <p className="text-sm text-mist-300">No roles match “{query}”.</p>
              <Button size="sm" variant="ghost" onClick={() => setQuery('')}>
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredRoles.map((role) => (
                <RoleCard key={role.id} role={role} index={roles.indexOf(role)} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

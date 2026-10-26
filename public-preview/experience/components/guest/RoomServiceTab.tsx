'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { menuItems } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import { GuestSectionHeader, GuestSheet, QuantityStepper } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { MenuItem } from '@/types/demo';

const CATEGORIES: MenuItem['category'][] = ['Starters', 'Mains', 'Drinks', 'Desserts'];

export function RoomServiceTab({ room }: GuestTabProps) {
  const { placeRoomServiceOrder } = useDemo();
  const [category, setCategory] = useState<MenuItem['category']>('Mains');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const shown = menuItems.filter((m) => m.category === category);
  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const item = menuItems.find((m) => m.id === id)!;
          return { itemId: id, name: item.name, qty, price: item.price };
        }),
    [cart],
  );
  const total = cartLines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const count = cartLines.reduce((sum, l) => sum + l.qty, 0);

  function setQty(id: string, n: number) {
    setCart((c) => ({ ...c, [id]: n }));
  }

  function placeOrder() {
    const ref = placeRoomServiceOrder(room, cartLines, note || undefined);
    setConfirmed(ref);
    setCart({});
    setNote('');
    setCartOpen(false);
    window.setTimeout(() => setConfirmed(null), 6000);
  }

  return (
    <div className="space-y-5 pb-4">
      {confirmed && (
        <div className="guest-card flex items-start gap-2 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          <p>
            Order placed · Reference <span className="font-semibold">{confirmed}</span>. Track delivery from the Requests tab.
          </p>
        </div>
      )}

      <GuestSectionHeader title="Room service" hint="Delivered to your room, charged to your folio" />

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className="guest-chip-btn shrink-0 rounded-full px-4 py-2 text-xs font-semibold"
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="space-y-2.5">
        {shown.map((item) => (
          <li key={item.id} className="guest-card flex items-center justify-between gap-3 px-3.5 py-3.5">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                {item.name}
                {item.veg && <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Vegetarian" aria-label="Vegetarian" />}
              </p>
              {item.desc && <p className="guest-muted mt-0.5 text-xs">{item.desc}</p>}
              <p className="mt-1 text-xs font-semibold" style={{ color: 'rgb(var(--a))' }}>
                {money(item.price)}
              </p>
            </div>
            <QuantityStepper value={cart[item.id] ?? 0} onChange={(n) => setQty(item.id, n)} />
          </li>
        ))}
      </ul>

      {count > 0 && (
        <div className="sticky bottom-2 z-30 flex justify-center">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="btn-accent flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-xl"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            View cart · {count} item{count > 1 ? 's' : ''} · {money(total)}
          </button>
        </div>
      )}

      {cartOpen && (
        <GuestSheet
          title="Your order"
          onClose={() => setCartOpen(false)}
          footer={
            <button
              type="button"
              disabled={cartLines.length === 0}
              onClick={placeOrder}
              className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
            >
              <UtensilsCrossed className="h-4 w-4" aria-hidden />
              Place order · {money(total)}
            </button>
          }
        >
          {cartLines.length === 0 ? (
            <p className="guest-muted text-sm">Your cart is empty.</p>
          ) : (
            <ul className="space-y-3">
              {cartLines.map((l) => (
                <li key={l.itemId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="guest-muted text-xs">{money(l.price)} each</p>
                  </div>
                  <QuantityStepper value={l.qty} onChange={(n) => setQty(l.itemId, n)} />
                </li>
              ))}
              <li className="guest-border flex items-center justify-between border-t pt-3 text-sm font-semibold">
                <span>Total</span>
                <span>{money(total)}</span>
              </li>
              <li>
                <label htmlFor="rs-note" className="guest-muted mb-1 block text-xs font-medium">
                  Delivery note (optional)
                </label>
                <textarea
                  id="rs-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. no onions, please knock softly"
                  className="guest-field w-full px-3 py-2 text-sm"
                />
              </li>
            </ul>
          )}
        </GuestSheet>
      )}
    </div>
  );
}

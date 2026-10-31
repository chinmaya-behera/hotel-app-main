'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { EyeOff, ImagePlus, PackageSearch, Send, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';

const CATEGORIES = ['Electronics', 'Accessories', 'Clothing', 'Valuables', 'Jewelry', 'Documents', 'Other'];
const SENSITIVE_CATEGORIES = ['Valuables', 'Jewelry', 'Documents'];

const today = () => new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** Shrinks a chosen image to a small JPEG data URL so it fits comfortably in localStorage. */
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not open that image'));
      img.onload = () => {
        const scale = Math.min(1, 360 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Image tools unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function LostFoundManager({ title, hint, icon }: { title: string; hint?: string; icon: LucideIcon }) {
  const { state, addLostFoundItem } = useDemo();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [sensitive, setSensitive] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const nameOk = name.trim().length >= 3;
  const locationOk = location.trim().length >= 2;

  function pickCategory(next: string) {
    setCategory(next);
    // Documents, valuables and jewelry default to restricted; Front Desk can still override.
    setSensitive(SENSITIVE_CATEGORIES.includes(next));
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    try {
      setPhoto(await downscale(file));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not use that photo');
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!nameOk || !locationOk) return;
    addLostFoundItem({
      name: name.trim(),
      category,
      foundLocation: location.trim(),
      foundDate: today(),
      sensitive,
      photo: sensitive ? undefined : (photo ?? undefined),
    });
    setName('');
    setLocation('');
    setPhoto(null);
    setSensitive(false);
    setCategory(CATEGORIES[0]);
    setTried(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  const recent = state.lostFound.slice(0, 6);

  return (
    <Panel title={title} hint={hint} icon={icon}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <div>
          <label htmlFor="lf-name" className="mb-1 block text-xs font-medium text-mist-300">
            Item
          </label>
          <input
            id="lf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Silver watch, black strap"
            className="field w-full"
            aria-invalid={tried && !nameOk}
          />
          {tried && !nameOk && <p className="mt-1 text-xs text-rose-400">Describe the item (3+ characters).</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="lf-cat" className="mb-1 block text-xs font-medium text-mist-300">
              Category
            </label>
            <select id="lf-cat" value={category} onChange={(e) => pickCategory(e.target.value)} className="field w-full">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lf-loc" className="mb-1 block text-xs font-medium text-mist-300">
              Found at
            </label>
            <input
              id="lf-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Pool deck"
              className="field w-full"
              aria-invalid={tried && !locationOk}
            />
          </div>
        </div>
        {tried && !locationOk && <p className="text-xs text-rose-400">Say where it was found.</p>}

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-mist-200">
          <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} className="mt-1 h-4 w-4" />
          <span>
            Sensitive item
            <span className="block text-xs text-mist-400">Guests see no photo; they are told to ask Front Desk.</span>
          </span>
        </label>

        {sensitive ? (
          <p className="flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-3 py-2 text-xs text-amber-100">
            <EyeOff className="h-4 w-4 shrink-0" aria-hidden /> No photo is stored or shown for sensitive items.
          </p>
        ) : (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Choose a photo of the item"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            {photo ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="Selected item preview" className="h-24 w-24 rounded-xl border border-white/10 object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => {
                    setPhoto(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-white/20 bg-ink-800 text-white"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" iconLeft={ImagePlus} onClick={() => fileRef.current?.click()}>
                Add photo
              </Button>
            )}
            {photoError && <p className="mt-1 text-xs text-rose-400">{photoError}</p>}
          </div>
        )}

        <Button type="submit" variant="accent" iconLeft={Send} className="w-full">
          Publish to guests
        </Button>
      </form>

      <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-4" aria-label="Recently logged items">
        {recent.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
              {item.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photo} alt="" className="h-full w-full object-cover" />
              ) : item.sensitive ? (
                <EyeOff className="h-4 w-4 text-mist-400" aria-hidden />
              ) : (
                <PackageSearch className="h-4 w-4 text-mist-400" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{item.name}</p>
              <p className="truncate text-xs text-mist-400">
                {item.foundLocation} · {item.foundDate}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge tone={item.sensitive ? 'warning' : 'success'}>{item.sensitive ? 'Restricted' : 'Visible to guests'}</Badge>
              {item.claimed && <Badge tone="info">Claimed · Room {item.claimedRoom}</Badge>}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

import type { DemoState, DiningMenuItem, GuestHistoryEntry, OrderLine, RoleId, WorkItem } from '../types/demo';

export const CUISINES = ['Chinese', 'Continental', 'Indian', 'Italian', 'Mediterranean', 'International', 'Other'] as const;
export const MEAL_PERIODS = [
  { id: 'breakfast', label: 'Breakfast', hours: '05:00–10:59' },
  { id: 'lunch', label: 'Lunch', hours: '11:00–17:59' },
  { id: 'dinner', label: 'Dinner', hours: '18:00–04:59' },
] as const;
// Explicit cuisine metadata for the original catalog, including older saved menus.
const ORIGINAL_CUISINES: Record<string, string> = {
  'din-bk-1': 'Continental', 'din-bk-2': 'Continental', 'din-bk-3': 'Indian',
  'din-st-1': 'Chinese', 'din-st-2': 'Continental', 'din-st-3': 'Italian', 'din-st-4': 'Indian',
  'din-mc-1': 'Continental', 'din-mc-2': 'Continental', 'din-mc-3': 'Italian',
  'din-in-1': 'Indian', 'din-in-2': 'Indian', 'din-in-3': 'Indian',
  'din-co-1': 'Italian', 'din-co-2': 'Mediterranean',
  'din-ch-1': 'Chinese', 'din-ch-2': 'Chinese',
  'din-sn-1': 'Continental', 'din-sn-2': 'Continental',
  'din-de-1': 'Continental', 'din-de-2': 'Italian',
  'din-bv-1': 'International', 'din-bv-2': 'International', 'din-bv-3': 'International',
  'din-sp-1': 'International', 'din-sp-2': 'Mediterranean',
};
export function dishCuisine(item?: Pick<DiningMenuItem, 'id' | 'cuisine' | 'category'>): string {
  if (!item) return 'Uncategorised';
  return item.cuisine?.trim() || ORIGINAL_CUISINES[item.id] || CUISINES.find(c => c.toLowerCase() === item.category.toLowerCase().replace(' cuisine', '')) || 'Uncategorised';
}
export function snapshotOrderLines(lines: OrderLine[], menu: DiningMenuItem[]): OrderLine[] {
  const catalog = new Map(menu.map(d => [d.id, d]));
  return lines.map(line => {
    const dish = catalog.get(line.itemId);
    return { ...line, dishName: dish?.name || line.dishName || line.name, cuisine: dish ? dishCuisine(dish) : line.cuisine || 'Uncategorised', menuCategory: dish?.category || line.menuCategory };
  });
}
export function scheduledDiningTime(day: 'today' | 'tomorrow', slot: string, now = new Date()): string | undefined {
  const dateLabel = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const value = (name: string) => parts.find(p => p.type === name)?.value;
    return `${value('year')}-${value('month')}-${value('day')}`;
  };
  const date = new Date(dateLabel(now) + 'T12:00:00+05:30');
  if (day === 'tomorrow') date.setUTCDate(date.getUTCDate() + 1);
  const time = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(slot);
  if (!time || Number(time[1]) < 1 || Number(time[1]) > 12 || Number(time[2]) > 59) return undefined;
  const hour = Number(time[1]) % 12 + (time[3] === 'PM' ? 12 : 0);
  return `${dateLabel(date)}T${String(hour).padStart(2, '0')}:${time[2]}:00+05:30`;
}
export function patchDiningMirrors(items: DemoState['items'], roleId: RoleId, itemId: string, patch: Partial<WorkItem>, historyEntry?: GuestHistoryEntry): DemoState['items'] {
  const current = items[roleId]?.find(item => item.id === itemId);
  if (!current) return items;
  return Object.fromEntries(Object.entries(items).map(([key, list]) => [key, list.map(item =>
    (key === roleId && item.id === itemId) || (current.orderLines?.length && !!current.ref && item.ref === current.ref && item.room === current.room && item.category === current.category)
      ? { ...item, ...patch, history: historyEntry ? [...(item.history || []), historyEntry] : item.history }
      : item
  )])) as DemoState['items'];
}
export function orderTimestamp(order: WorkItem): number | undefined {
  const value = order.requestedServiceAt || order.orderedAt || order.createdAt;
  if (!value || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}
export function mealPeriod(order: WorkItem): typeof MEAL_PERIODS[number]['id'] | 'unknown' {
  const timestamp = orderTimestamp(order);
  let hour: number | undefined;
  if (timestamp !== undefined) hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23' }).format(timestamp));
  else {
    const clock = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec((order.createdAt || '').trim());
    if (clock && Number(clock[2]) < 60 && (clock[3] ? Number(clock[1]) >= 1 && Number(clock[1]) <= 12 : Number(clock[1]) < 24)) hour = clock[3] ? Number(clock[1]) % 12 + (/pm/i.test(clock[3]) ? 12 : 0) : Number(clock[1]);
  }
  if (hour === undefined) return 'unknown';
  return hour >= 5 && hour < 11 ? 'breakfast' : hour >= 11 && hour < 18 ? 'lunch' : 'dinner';
}
export const cancelledOrder = (order: WorkItem) => /cancelled|canceled|rejected/i.test(order.status);
export const completedOrder = (order: WorkItem) => /delivered|completed|closed/i.test(order.status) && !cancelledOrder(order);
export function diningFeedbackPatch(order: WorkItem, rating: number, comment: string | undefined, dishes: Record<string, { rating: number; comment?: string }>, now: string): Partial<WorkItem> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw Error('Choose a rating from 1 to 5.');
  if (!completedOrder(order)) throw Error('Feedback is available after delivery.');
  const allowed = new Set(order.orderLines?.map(l => l.itemId));
  const feedback = { ...(order.dishFeedback || {}) };
  for (const [itemId, value] of Object.entries(dishes)) {
    if (!allowed.has(itemId) || !Number.isInteger(value.rating) || value.rating < 1 || value.rating > 5) throw Error('Choose a valid rating for an ordered dish.');
    feedback[itemId] = { rating: value.rating, comment: value.comment?.trim().slice(0, 1000), submittedAt: now };
  }
  return { feedback: { rating, comment: comment?.trim().slice(0, 1000) }, dishFeedback: feedback };
}
export interface DishInsights {
  key: string; itemId: string; name: string; cuisine: string; category: string;
  units: number; value: number; orders: WorkItem[]; active: number; completed: number; cancelled: number;
  averageRating?: number; reviews: Array<{ reference: string; rating: number; comment?: string; at: string }>;
}
export function dishInsights(orders: WorkItem[], menu: DiningMenuItem[]): DishInsights[] {
  const catalog = new Map(menu.map(item => [item.id, item])), result = new Map<string, DishInsights>();
  const unique = new Map(orders.map(order => [order.ref || order.id, order]));
  for (const order of unique.values()) {
    const seen = new Set<string>();
    for (const line of order.orderLines || []) {
      if (!Number.isFinite(line.qty) || line.qty <= 0 || !Number.isFinite(line.price) || line.price < 0) continue;
      const dish = catalog.get(line.itemId), cuisine = line.cuisine || dishCuisine(dish), key = `${cuisine}:${line.itemId}`;
      let row = result.get(key);
      if (!row) {
        row = { key, itemId: line.itemId, name: line.dishName || dish?.name || line.name, cuisine, category: line.menuCategory || dish?.category || 'Not recorded', units: 0, value: 0, orders: [], active: 0, completed: 0, cancelled: 0, reviews: [] };
        result.set(key, row);
      }
      if (!cancelledOrder(order)) { row.units += line.qty; row.value += line.qty * line.price; }
      if (seen.has(key)) continue;
      seen.add(key); row.orders.push(order);
      if (cancelledOrder(order)) row.cancelled++;
      else if (completedOrder(order)) row.completed++;
      else row.active++;
      const review = order.dishFeedback?.[line.itemId];
      if (completedOrder(order) && review && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5) row.reviews.push({ reference: order.ref || order.id, rating: review.rating, comment: review.comment, at: review.submittedAt });
    }
  }
  for (const row of result.values()) if (row.reviews.length) row.averageRating = row.reviews.reduce((sum, review) => sum + review.rating, 0) / row.reviews.length;
  return [...result.values()].sort((a, b) => b.orders.length - a.orders.length || a.name.localeCompare(b.name));
}

export const REPAIR_CATEGORIES = ['Furniture', 'Plumbing', 'Appliances', 'Electrical', 'HVAC', 'Lifts & elevators', 'Building & fixtures', 'Other'] as const;
export function repairCategory(task: WorkItem): string {
  if (task.repairCategory && REPAIR_CATEGORIES.includes(task.repairCategory as typeof REPAIR_CATEGORIES[number])) return task.repairCategory;
  const classify = (text: string) => {
    if (/\b(tap|leak|pipe|drain|toilet|plumbing|flush|faucet|shower)\b/i.test(text)) return 'Plumbing';
    if (/\b(chair|table|sofa|bed|wardrobe|furniture|desk|cabinet|upholstery)\b/i.test(text)) return 'Furniture';
    if (/\b(fridge|refrigerator|oven|dishwasher|kettle|appliance|washing machine|dryer|television|tv)\b/i.test(text)) return 'Appliances';
    if (/\b(hvac|ac|air conditioning|air conditioner|ventilation|thermostat|chiller)\b/i.test(text)) return 'HVAC';
    if (/\b(lift|elevator)\b/i.test(text)) return 'Lifts & elevators';
    if (/\b(electrical|light|lighting|socket|wiring|power|circuit|generator)\b/i.test(text)) return 'Electrical';
    if (/\b(door|window|wall|ceiling|tile|roof|paint|lock|fixture)\b/i.test(text)) return 'Building & fixtures';
  };
  return classify(task.title) || classify(task.description || '') || 'Other';
}

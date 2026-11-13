import type { OrderLine, WorkItem } from '../types/demo';
import { CUISINES, MEAL_PERIODS } from './department-insights.ts';

type SampleDish = readonly [name: string, price: number];
type SamplePair = readonly [SampleDish, SampleDish];
// Standalone manager showcase snapshots. These do not create guest orders,
// change the shared catalog, or post folio charges.
const DISHES: Record<typeof MEAL_PERIODS[number]['id'], Record<typeof CUISINES[number], SamplePair>> = {
  breakfast: {
    Chinese: [['Ginger Vegetable Congee', 320], ['Scallion Pancakes', 280]],
    Continental: [['Classic Eggs Benedict & Avocado', 550], ['Artisan Continental Bakery Basket', 420]],
    Indian: [['Crisp Mysore Masala Dosa', 380], ['Idli & Medu Vada Breakfast', 290]],
    Italian: [['Lemon Ricotta Pancakes', 440], ['Spinach & Parmesan Frittata', 420]],
    Mediterranean: [['Labneh & Za’atar Flatbread', 380], ['Shakshuka with Sourdough', 460]],
    International: [['Granola & Yogurt Bowl', 340], ['Seasonal Fruit Plate', 280]],
    Other: [['Japanese Tamagoyaki Breakfast', 390], ['Miso Soup & Rice Set', 320]],
  },
  lunch: {
    Chinese: [['Sichuan Kung Pao Chicken', 680], ['Chili Garlic Hakka Noodles', 480]],
    Continental: [['The Grand Azure Club Sandwich', 720], ['Pan-Seared Atlantic Salmon Fillet', 1150]],
    Indian: [['Royal Dal Makhani & Jeera Rice', 580], ['Tandoori Malai Paneer Tikka', 480]],
    Italian: [['Wild Mushroom & Truffle Fettuccine', 720], ['Truffle Wild Mushroom Risotto', 850]],
    Mediterranean: [['Pan-Roasted Mediterranean Sea Bass', 1250], ['Greek Village Salad', 460]],
    International: [['Roasted Vegetable Grain Bowl', 520], ['Grilled Vegetable Wrap', 420]],
    Other: [['Teriyaki Chicken Rice Bowl', 620], ['Avocado Sushi Rolls', 540]],
  },
  dinner: {
    Chinese: [['Ginger & Sesame Tofu', 560], ['Chili Crisp Vegetable Noodles', 520]],
    Continental: [['Prime Wagyu Beef Burger', 980], ['Herb-Roasted Chicken', 920]],
    Indian: [['Old Delhi Murgh Makhani', 780], ['Awadhi Dum Gosht Biryani', 890]],
    Italian: [['Wood-Fired Margherita Pizza', 680], ['Penne Arrabbiata', 590]],
    Mediterranean: [['Gourmet Mezze & Cheese Board', 1200], ['Grilled Sea Bass with Lemon', 1250]],
    International: [['Chargrilled Vegetable Platter', 620], ['Lentil & Quinoa Supper Bowl', 540]],
    Other: [['Thai Green Curry & Jasmine Rice', 690], ['Japanese Vegetable Tempura', 580]],
  },
};

export function createDiningShowcase(now: number): WorkItem[] {
  const result: WorkItem[] = [];
  const dateFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
  for (const [mealIndex, meal] of MEAL_PERIODS.entries()) {
    for (const [cuisineIndex, cuisine] of CUISINES.entries()) {
      const pair = DISHES[meal.id][cuisine];
      for (let variant = 0; variant < 3; variant++) {
        const suffix = `${meal.id}-${cuisine.toLowerCase()}-${variant + 1}`;
        const parts = dateFormatter.formatToParts(new Date(now - (variant + 1) * 86400000));
        const part = (type: string) => parts.find(p => p.type === type)!.value;
        const at = `${part('year')}-${part('month')}-${part('day')}T${['08', '13', '20'][mealIndex]}:${String(15 + cuisineIndex * 5).padStart(2, '0')}:00+05:30`;
        const dishLine = (index: 0 | 1, qty: number): OrderLine => ({
          itemId: `demo-dish-${meal.id}-${cuisine.toLowerCase()}-${index}`, name: pair[index][0], dishName: pair[index][0], qty, price: pair[index][1], cuisine, menuCategory: meal.label,
        });
        const lines = variant === 0 ? [dishLine(0, 2)] : variant === 1 ? [dishLine(0, 1), dishLine(1, 1)] : [dishLine(1, 2 + cuisineIndex % 2)];
        const status = variant === 2 && (mealIndex + cuisineIndex) % 4 === 0 ? 'Preparing' : variant === 2 && (mealIndex + cuisineIndex) % 4 === 1 ? 'Cancelled' : 'Delivered';
        result.push({
          id: `demo-dining-${suffix}`, ref: `DEMO-DIN-${suffix.toUpperCase()}`, title: `Sample ${meal.label.toLowerCase()} order · ${cuisine}`, meta: `${meal.label} · ${cuisine} · showcase only`,
          department: 'Food & Beverages', category: 'room_service', status, demoSource: 'dining-showcase',
          room: String(201 + cuisineIndex * 10 + variant), assignee: 'Demo dining team', createdAt: at, orderedAt: at, orderLines: lines,
          amount: lines.reduce((sum, line) => sum + line.qty * line.price, 0),
          description: 'Sample order for the manager showcase. No guest request or folio charge was created.',
          feedback: status === 'Delivered' ? { rating: 4 + variant % 2, comment: 'Demo service review: courteous and timely delivery.' } : undefined,
          dishFeedback: status === 'Delivered' ? Object.fromEntries(lines.map((line, index) => [line.itemId, {
            rating: 4 + (variant + index + cuisineIndex) % 2,
            comment: `Demo review: ${index === 0 ? 'well balanced flavours and thoughtful presentation' : 'freshly prepared with a generous portion'}.`, submittedAt: new Date(Date.parse(at) + 3600000).toISOString(),
          }])) : undefined,
          history: [{ at, status, note: 'Demonstration record' }],
        });
      }
    }
  }
  return result;
}

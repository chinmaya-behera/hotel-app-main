'use client';

import { useState } from 'react';
import { Clock3, UtensilsCrossed } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cancelledOrder, completedOrder, dishInsights, MEAL_PERIODS, mealPeriod, orderTimestamp } from '@/lib/department-insights';
import { createDiningShowcase } from '@/lib/dining-showcase';
import { managerOrders } from '@/lib/manager-workflows';
import { useManagerClock } from './ManagerCases';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const meals = [...MEAL_PERIODS, { id: 'unknown', label: 'Unscheduled', hours: '' }];

export function OrderingInsights({ activeLive = false }: { activeLive?: boolean }) {
  const { state } = useDemo();
  const [source, setSource] = useState(activeLive ? 'live' : 'showcase');
  const [meal, setMeal] = useState('all');
  const [cuisine, setCuisine] = useState('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(activeLive ? 'active' : 'all');
  const [period, setPeriod] = useState('all');
  const now = useManagerClock();
  const [showcase] = useState(() => createDiningShowcase(Date.now()));
  const orders = source === 'showcase' ? showcase : managerOrders(state);
  const query = search.trim().toLowerCase();
  const visible = orders.filter(order => {
    const at = orderTimestamp(order);
    const orderStatus = cancelledOrder(order) ? 'cancelled' : completedOrder(order) ? 'delivered' : 'active';
    return (status === 'all' || status === orderStatus) &&
      (period === 'all' || at !== undefined && at >= now - Number(period) * 86400000 && at <= now) &&
      [order.ref, order.room, order.title].join(' ').toLowerCase().includes(query);
  });
  const groups = meals.filter(period => meal === 'all' || meal === period.id).map(period => {
    const orders = visible.filter(order => mealPeriod(order) === period.id);
    const dishes = dishInsights(orders, state.diningMenu || []);
    const cuisineNames = [...new Set(dishes.map(dish => dish.cuisine))].sort();
    const rows = cuisineNames.map(name => {
      const items = dishes.filter(dish => dish.cuisine === name);
      const distinct = [...new Map(items.flatMap(item => item.orders).map(order => [order.ref || order.id, order])).values()];
      const delivered = distinct.filter(completedOrder).length;
      const cancelled = distinct.filter(cancelledOrder).length;
      const ratings = items.flatMap(item => item.reviews);
      return {
        name, orders: distinct.length, active: distinct.length - delivered - cancelled, delivered, cancelled,
        units: items.reduce((sum, item) => sum + item.units, 0),
        revenue: items.reduce((sum, item) => sum + item.value, 0),
        rating: ratings.length ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length : undefined,
        popularity: orders.length ? Math.round(100 * distinct.length / orders.length) : 0,
      };
    });
    return { ...period, rows };
  });
  const cuisines = [...new Set(groups.flatMap(group => group.rows.map(row => row.name)))].sort();
  const selectedCuisine = cuisines.includes(cuisine) ? cuisine : 'all';
  const filtered = groups.map(group => ({ ...group, rows: group.rows.filter(row => selectedCuisine === 'all' || row.name === selectedCuisine) })).filter(group => group.rows.length);
  return <section className="dm-panel">
    <div className="dm-panel-heading"><div><h2>Ordering overview</h2><p>Compare demand, delivery and guest ratings by cuisine.</p></div><span className="dm-status"><Clock3 size={13}/> Hotel time · IST</span></div>
    <div className="dm-toolbar">
      <select aria-label="Order data source" value={source} onChange={event => setSource(event.target.value)}><option value="showcase">Demo showcase</option><option value="live">Live orders</option></select>
      <input aria-label="Search dining orders" placeholder="Search order reference or room" value={search} onChange={event => setSearch(event.target.value)}/>
      <select aria-label="Order reporting period" value={period} onChange={event => setPeriod(event.target.value)}><option value="all">All dates</option><option value="7">Past 7 days</option><option value="30">Past 30 days</option></select>
      <select aria-label="Filter dining orders" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All orders</option><option value="active">Active orders</option><option value="delivered">Delivered orders</option><option value="cancelled">Cancelled orders</option></select>
      <select aria-label="Meal period" value={meal} onChange={event => setMeal(event.target.value)}><option value="all">All meal periods</option>{meals.map(period => <option key={period.id} value={period.id}>{period.label}</option>)}</select>
      <select aria-label="Cuisine" value={selectedCuisine} onChange={event => setCuisine(event.target.value)}><option value="all">All cuisines</option>{cuisines.map(name => <option key={name}>{name}</option>)}</select>
    </div>
    {source === 'showcase' && <p className="dm-insight-note">Demo showcase · {showcase.length} sample orders. Select Live orders to review guest activity.</p>}
    {filtered.map(group => <section key={group.id} className="dm-meal-group" aria-label={group.label + ' cuisine totals'}>
      <div className="dm-meal-heading"><h3>{group.label}</h3>{group.hours && <span>{group.hours} IST</span>}</div>
      <div className="dm-table-wrap"><table className="dm-table">
        <thead><tr>{['Cuisine', 'Orders', 'Units', 'Active', 'Delivered', 'Cancelled', 'Subtotal', 'Popularity', 'Rating'].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{group.rows.map(row => <tr key={row.name}>
          <th scope="row">{row.name}</th><td>{row.orders}</td><td>{row.units}</td><td>{row.active}</td>
          <td>{row.delivered}</td><td>{row.cancelled}</td><td>{currency.format(row.revenue)}</td><td>{row.popularity}%</td>
          <td>{row.rating === undefined ? 'Unrated' : row.rating.toFixed(1) + ' / 5'}</td>
        </tr>)}</tbody>
      </table></div>
    </section>)}
    {!filtered.length && <div className="dm-empty"><UtensilsCrossed size={24}/><h3>No matching cuisine orders</h3></div>}
    <p className="dm-insight-note">Mixed-cuisine orders count once in each cuisine they contain. Units and subtotals exclude cancellations. Subtotals are before tax. Popularity is the share of orders in the meal period.</p>
  </section>;
}

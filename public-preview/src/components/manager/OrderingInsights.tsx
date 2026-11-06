'use client';

import { useMemo, useState } from 'react';
import { UtensilsCrossed, Star, Clock3 } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { managerOrders } from '@/lib/manager-workflows';
import { MEAL_PERIODS, dishInsights, mealPeriod, orderTimestamp, cancelledOrder, type DishInsights } from '@/lib/department-insights';
import { managerDate, useManagerClock } from './ManagerCases';

const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

function DishCard({ dish, denominator }: { dish: DishInsights; denominator: number }) {
  const frequency = denominator ? Math.round(dish.orders.length / denominator * 100) : 0;
  return <article className="dm-dish-insight">
    <div className="dm-record-title"><div><small className="dm-reference">{dish.category}</small><h4>{dish.name}</h4></div><span className="dm-rating"><Star size={13}/>{dish.averageRating === undefined ? 'Unrated' : `${dish.averageRating.toFixed(1)} / 5`}</span></div>
    <dl className="dm-dish-metrics">
      <div><dt>Orders</dt><dd>{dish.orders.length}</dd></div><div><dt>Units ordered</dt><dd>{dish.units}</dd></div><div><dt>Item value</dt><dd>{money(dish.value)}</dd></div>
      <div><dt>Order frequency</dt><dd>{frequency}%</dd></div><div><dt>Dish ratings</dt><dd>{dish.reviews.length}</dd></div><div><dt>Written reviews</dt><dd>{dish.reviews.filter(r => r.comment).length}</dd></div>
    </dl>
    <p className="dm-insight-status">{dish.active} active <span>·</span> {dish.completed} delivered <span>·</span> {dish.cancelled} cancelled / rejected</p>
    <details className="dm-insight-details"><summary>View orders & reviews</summary>
      <p className="dm-subtle">Frequency: {dish.orders.length} of {denominator} orders in this meal and cuisine. Units and item value exclude cancellations; values include dish options, before tax.</p>
      <h5>Customer dish reviews</h5>
      {dish.reviews.length ? dish.reviews.map(r => <blockquote key={r.reference}><strong>{r.rating} / 5</strong><p>{r.comment || 'Rating only — no written review.'}</p><small>{r.reference} · {managerDate(r.at)}</small></blockquote>) : <p className="dm-subtle">No dish ratings yet. Guests can rate each dish after delivery in My Activity.</p>}
      <h5>Order records</h5>
      {dish.orders.map(order => <div className="dm-insight-order" key={order.ref || order.id}><div><strong>{order.ref || order.id}</strong><span>{order.status}</span></div><small>{order.room ? `Room ${order.room} · ` : ''}{managerDate(order.requestedServiceAt || order.orderedAt || order.createdAt)}</small><ul>{order.orderLines?.filter(line => line.itemId === dish.itemId).map((line, index) => <li key={index}>{line.qty} × {line.name} · {money(line.qty * line.price)}</li>)}</ul>{order.description && <p><b>Guest instructions:</b> {order.description}</p>}{order.feedback && <p><b>Order service feedback:</b> {order.feedback.rating} / 5{order.feedback.comment ? ` · ${order.feedback.comment}` : ''}</p>}</div>)}
    </details>
  </article>;
}

export function OrderingInsights() {
  const { state } = useDemo();
  const [meal, setMeal] = useState('all'), [cuisine, setCuisine] = useState('all');
  const [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [period, setPeriod] = useState('all');
  const now = useManagerClock();
  const orders = useMemo(() => managerOrders(state), [state]);
  const dateFiltered = orders.filter(order => period === 'all' || (orderTimestamp(order) !== undefined && orderTimestamp(order)! >= now - Number(period) * 86400000 && orderTimestamp(order)! <= now));
  const statusFiltered = dateFiltered.filter(order => status === 'all' || (status === 'active' ? !cancelledOrder(order) && !/delivered|completed|closed/i.test(order.status) : /delivered|completed|closed/i.test(order.status) && !cancelledOrder(order)));
  const meals = MEAL_PERIODS.map(m => ({ ...m, orders: statusFiltered.filter(order => mealPeriod(order) === m.id) }));
  const selectedMeals = meals.filter(m => meal === 'all' || meal === m.id);
  const allDishes = dishInsights(selectedMeals.flatMap(m => m.orders), state.diningMenu || []);
  const cuisines = [...new Set(allDishes.map(dish => dish.cuisine))].sort();
  const effectiveCuisine = cuisines.includes(cuisine) ? cuisine : 'all';
  const query = search.trim().toLowerCase();
  const groups = selectedMeals.map(m => {
    const dishes = dishInsights(m.orders, state.diningMenu || []);
    return { ...m, cuisines: [...new Set(dishes.map(dish => dish.cuisine))].sort().filter(c => effectiveCuisine === 'all' || c === effectiveCuisine).map(c => {
      const rows = dishes.filter(d => d.cuisine === c);
      const denominator = new Set(rows.flatMap(d => d.orders.map(o => o.ref || o.id))).size;
      return { name: c, denominator, dishes: rows.filter(d => !query || `${d.name} ${d.cuisine} ${d.category} ${d.orders.map(o => `${o.ref || ''} ${o.room || ''}`).join(' ')}`.toLowerCase().includes(query)) };
    }).filter(c => c.dishes.length) };
  }).filter(m => m.cuisines.length);
  const rows = groups.flatMap(m => m.cuisines.flatMap(c => c.dishes));
  const references = new Set(rows.flatMap(d => d.orders.map(o => o.ref || o.id)));
  const visibleOrders = statusFiltered.filter(o => references.has(o.ref || o.id));
  const reviews = rows.flatMap(d => d.reviews);
  const unitemised = selectedMeals.flatMap(m => m.orders).filter(o => !o.orderLines?.length && (!query || `${o.ref} ${o.title} ${o.room}`.toLowerCase().includes(query)));
  const noLines = unitemised.length;
  return <>
    <div className="dm-metric-strip"><div><small>Itemised orders in view</small><strong>{visibleOrders.length}</strong></div><div><small>Units ordered · excl. cancelled</small><strong>{rows.reduce((sum, d) => sum + d.units, 0)}</strong></div><div><small>Recorded item value · excl. cancelled</small><strong>{money(rows.reduce((sum, d) => sum + d.value, 0))}</strong></div><div><small>Average dish rating · {reviews.length} ratings</small><strong>{reviews.length ? `${(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} / 5` : 'Unrated'}</strong></div></div>
    <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Ordering overview</h2><p>Meal service → cuisine → dish performance. Understand what guests order and how they rate it.</p></div><span className="dm-status"><Clock3 size={13}/> Hotel time · IST</span></div>
      <div className="dm-toolbar"><input aria-label="Search dining orders" placeholder="Search dish, cuisine, reference or room" value={search} onChange={e => setSearch(e.target.value)}/><select aria-label="Order reporting period" value={period} onChange={e => setPeriod(e.target.value)}><option value="all">All dates</option><option value="7">Past 7 days</option><option value="30">Past 30 days</option></select><select aria-label="Filter dining orders" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All orders</option><option value="active">Active orders</option><option value="completed">Delivered orders</option></select></div>
      <div className="dm-meal-tabs" aria-label="Meal service"><button aria-pressed={meal === 'all'} onClick={() => { setMeal('all'); setCuisine('all'); }}><strong>All meals</strong><small>{statusFiltered.length} {statusFiltered.length === 1 ? 'order' : 'orders'}</small></button>{meals.map(m => <button key={m.id} aria-pressed={meal === m.id} onClick={() => { setMeal(m.id); setCuisine('all'); }}><strong>{m.label}</strong><small>{m.hours} · {m.orders.length}</small></button>)}</div>
      <div className="dm-category-chips dm-insight-cuisines" aria-label="Order cuisines"><button aria-pressed={effectiveCuisine === 'all'} onClick={() => setCuisine('all')}>All cuisines</button>{cuisines.map(c => <button key={c} aria-pressed={effectiveCuisine === c} onClick={() => setCuisine(c)}>{c}</button>)}</div>
      <p className="dm-insight-note">Meal time uses scheduled service time, or the time the order was placed. Legacy clock-only records appear under All dates. Dish averages use guest dish ratings, separately from service feedback and catalog demo scores.{period !== 'all' ? ` ${orders.filter(o => orderTimestamp(o) === undefined).length} orders without a recorded date are excluded; future scheduled service is outside the past period.` : ''}{noLines ? ` ${noLines} orders have no dish details and cannot be included in dish metrics.` : ''}</p>
      {!groups.length && <div className="dm-empty"><UtensilsCrossed size={25}/><h3>No matching dish orders</h3><p>Orders will appear by meal and cuisine when guests place them. Try another meal or clear the filters.</p></div>}
      {groups.map(m => <section className="dm-meal-group" key={m.id} aria-label={`${m.label} orders`}><div className="dm-meal-heading"><h3>{m.label}</h3><span>{m.hours} IST</span></div>{m.cuisines.map(c => <section className="dm-cuisine-group" key={c.name} aria-label={`${m.label} ${c.name}`}><div className="dm-cuisine-heading"><h4>{c.name}</h4><small>{c.dishes.length} {c.dishes.length === 1 ? 'dish' : 'dishes'} shown · {c.denominator} {c.denominator === 1 ? 'order' : 'orders'} in cuisine</small></div><div className="dm-insights-grid">{c.dishes.map(d => <DishCard key={d.key} dish={d} denominator={c.denominator}/>)}</div></section>)}</section>)}
      {effectiveCuisine === 'all' && noLines > 0 && <section className="dm-meal-group"><h3>Orders without dish details</h3><p className="dm-subtle">These historical orders remain available, but cannot contribute to cuisine or dish metrics.</p>{unitemised.map(order => <article className="dm-insight-order" key={order.ref || order.id}><div><strong>{order.ref || order.id} · {order.title}</strong><span>{order.status}</span></div><p>{order.meta}</p><small>{managerDate(order.createdAt)}</small></article>)}</section>}
      <p className="dm-insight-note">Mixed-cuisine orders count once in each cuisine they contain; the total order count is deduplicated. Item values are recorded subtotals, before tax, and do not represent collected revenue.</p>
    </section>
  </>;
}

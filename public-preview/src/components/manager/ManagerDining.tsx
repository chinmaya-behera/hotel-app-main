'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { MENU_ALLERGENS } from '@/lib/manager-workflows';
import type { AllergenType, DietaryType, DiningMenuItem } from '@/types/demo';
import { CUISINES, dishCuisine } from '@/lib/department-insights';
export { OrderingInsights as OrderingOverview } from './OrderingInsights';

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
function DishPhoto({ item }: { item: DiningMenuItem }) {
  const [failed, setFailed] = useState(false);
  return item.image && !failed ? <img src={item.image} alt={item.name} loading="lazy" onError={() => setFailed(true)}/> : <UtensilsCrossed size={32} aria-label="Dish photo unavailable"/>;
}

export function DiningKitchenMenu() {
  const { state, departmentManagerCommand } = useDemo();
  const [search, setSearch] = useState(''), [category, setCategory] = useState('all'), [diet, setDiet] = useState('all');
  const [selected, setSelected] = useState<DiningMenuItem | 'new' | null>(null);
  const [deleting, setDeleting] = useState<DiningMenuItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null), confirmation = useRef<HTMLDialogElement>(null), listId = useId();
  const record = selected && selected !== 'new' ? selected : null;
  const menu = state.diningMenu ?? [];
  const categories = [...new Set([...(state.diningCategories ?? []), ...menu.map(item => item.category)])];
  const visible = menu.filter(item => (category === 'all' || item.category === category) && (diet === 'all' || item.dietary === diet) && `${item.name} ${dishCuisine(item)} ${item.category} ${item.ingredients.join(' ')} ${item.allergens.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const open = (item: NonNullable<typeof selected>) => { setSelected(item); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); setSelected(null); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const f = new FormData(event.currentTarget), text = (name: string) => String(f.get(name) || '').trim();
    if (departmentManagerCommand({ type: 'menu-save', menuId: record?.id, item: { name: text('name'), category: text('category'), cuisine: text('cuisine'), price: Number(text('price')), dietary: text('dietary') as DietaryType, image: text('image'), desc: text('description'), ingredients: text('ingredients').split(',').map(v => v.trim()).filter(Boolean), allergens: f.getAll('allergens') as AllergenType[], isAvailable: f.get('available') === 'on' } })) close();
  };
  const remove = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (deleting && departmentManagerCommand({ type: 'menu-delete', menuId: deleting.id })) { confirmation.current?.close(); setDeleting(null); }
  };
  return <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Dining & kitchen menu</h2><p>Manage dishes, ingredients, dietary tags, allergens, pricing and guest-menu availability.</p><small className="dm-subtle">{menu.length} dishes · {menu.filter(item => item.isAvailable).length} available · {categories.length} categories</small></div><button className="dm-primary" onClick={() => open('new')}><Plus size={16}/> Add new dish</button></div>
    <div className="dm-category-chips" aria-label="Dining menu categories"><button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All categories</button>{categories.map(c => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div>
    <div className="dm-toolbar"><input aria-label="Search dining menu" placeholder="Search dish, ingredient or allergen" value={search} onChange={e => setSearch(e.target.value)}/><select aria-label="Filter dietary type" value={diet} onChange={e => setDiet(e.target.value)}><option value="all">All dietary types</option><option value="veg">Vegetarian</option><option value="non_veg">Non-vegetarian</option><option value="vegan">Vegan</option></select></div>
    <div className="dm-menu-grid">{visible.map(item => <article className="dm-menu-card" key={item.id}><div className="dm-menu-image"><DishPhoto key={item.image} item={item}/><span className="dm-menu-diet">{item.dietary.replace('_', '-')}</span><span className="dm-menu-category">{item.category}</span></div><div className="dm-menu-content"><div className="dm-record-title"><h3>{item.name}</h3><strong>{money(item.price)}</strong></div><small className="dm-subtle">{dishCuisine(item)} cuisine</small><p>{item.desc}</p><small><b>Ingredients:</b> {item.ingredients.join(', ') || 'Not listed'}</small><div className="dm-allergen-tags">{item.allergens.length ? item.allergens.map(a => <span key={a}>{a}</span>) : <span>No allergens listed</span>}</div><div className="dm-menu-actions"><button className="dm-text-button" role="switch" aria-checked={item.isAvailable} aria-label={`Availability for ${item.name}`} onClick={() => departmentManagerCommand({ type: 'menu-availability', menuId: item.id, available: !item.isAvailable })}>{item.isAvailable ? '● Available' : '○ Unavailable'}</button><button className="dm-small-button" aria-label={`Edit ${item.name}`} onClick={() => open(item)}><Pencil size={13}/> Edit</button><button className="dm-icon-button" aria-label={`Delete ${item.name}`} onClick={() => { setDeleting(item); confirmation.current?.showModal(); }}><Trash2 size={14}/></button></div></div></article>)}</div>
    {!visible.length && <div className="dm-empty"><p>No dishes match these filters.</p></div>}
    <dialog className="dm-dialog dm-menu-dialog" ref={dialog} onClose={() => setSelected(null)} aria-labelledby="menu-editor-title"><form key={selected ? record?.id || 'new' : 'closed'} onSubmit={submit}><div className="dm-dialog-heading"><h2 id="menu-editor-title">{record ? 'Edit dish' : 'Add new dish'}</h2><button className="dm-icon-button" type="button" aria-label="Close menu editor" onClick={close}><X size={19}/></button></div><label className="dm-field">Dish name<input name="name" required maxLength={150} defaultValue={record?.name}/></label><div className="dm-form-grid"><label className="dm-field">Menu category<input name="category" list={listId} required maxLength={80} defaultValue={record?.category || categories[0]}/><datalist id={listId}>{categories.map(c => <option key={c} value={c}/>)}</datalist></label><label className="dm-field">Price (INR)<input name="price" type="number" min="0" max="1000000" step="0.01" required defaultValue={record?.price ?? 0}/></label></div><div className="dm-form-grid"><label className="dm-field">Dietary type<select name="dietary" defaultValue={record?.dietary || 'veg'}><option value="veg">Vegetarian</option><option value="non_veg">Non-vegetarian</option><option value="vegan">Vegan</option></select></label><label className="dm-field">Dish image URL<input name="image" type="url" placeholder="https://…" defaultValue={record?.image}/></label></div><label className="dm-field">Cuisine<input name="cuisine" required maxLength={80} list={listId + '-cuisine'} defaultValue={record ? dishCuisine(record) : 'Indian'}/><datalist id={listId + '-cuisine'}>{CUISINES.map(c => <option key={c} value={c}/>)}</datalist></label><label className="dm-field">Description<textarea name="description" maxLength={1000} defaultValue={record?.desc}/></label><label className="dm-field">Ingredients (comma separated)<textarea name="ingredients" maxLength={2000} defaultValue={record?.ingredients.join(', ')}/></label><fieldset className="dm-allergen-options"><legend>Listed allergens</legend>{MENU_ALLERGENS.map(a => <label className="dm-check-label" key={a}><input type="checkbox" name="allergens" value={a} defaultChecked={record?.allergens.includes(a)}/>{a}</label>)}</fieldset><label className="dm-check-label"><input type="checkbox" name="available" defaultChecked={record?.isAvailable ?? true}/> Available on the guest dining menu</label><div className="dm-dialog-actions"><button className="dm-secondary" type="button" onClick={close}>Cancel</button><button className="dm-primary" type="submit">Save dish</button></div></form></dialog>
    <dialog className="dm-dialog" ref={confirmation} onClose={() => setDeleting(null)} aria-labelledby="delete-dish-title"><form onSubmit={remove}><h2 id="delete-dish-title">Remove this dish?</h2><p className="dm-dialog-description">{deleting?.name} will be removed from the shared menu. Existing order records keep their dish details.</p><div className="dm-dialog-actions"><button type="button" className="dm-secondary" onClick={() => confirmation.current?.close()}>Cancel</button><button type="submit" className="dm-primary">Remove dish</button></div></form></dialog>
  </section>;
}

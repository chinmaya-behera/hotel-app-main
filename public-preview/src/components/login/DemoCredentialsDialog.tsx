'use client';

import { useRef } from 'react';
import { KeyRound, X } from 'lucide-react';
import './demo-credentials.css';

export function DemoCredentialsDialog<T extends { id: string; name: string; email: string; pass: string }>({ accounts, onSelect }: { accounts: readonly T[]; onSelect: (account: T) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <><button type="button" className="demo-credentials-trigger" onClick={() => dialog.current?.showModal()}><KeyRound size={16}/> View demo login credentials</button><dialog className="demo-credentials-dialog" ref={dialog} aria-labelledby="demo-credentials-title"><div className="demo-credentials-heading"><div><p>EXPLORE THE GRAND ADP</p><h2 id="demo-credentials-title">Choose a demo workspace</h2></div><button type="button" aria-label="Close demo credentials" onClick={() => dialog.current?.close()}><X size={22}/></button></div><p className="demo-credentials-intro">These public demo credentials use synthetic hotel records. Choose Autofill, then press Sign In.</p><div className="demo-credentials-list">{accounts.map(account => <article key={account.id}><div><strong>{account.name}</strong><span>{account.email}</span><code>Password: {account.pass}</code></div><button type="button" aria-label={`Autofill ${account.name}`} onClick={() => { onSelect(account); dialog.current?.close(); document.getElementById('submitBtn')?.focus(); }}>Autofill</button></article>)}</div></dialog></>;
}

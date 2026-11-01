import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RoleDashboard } from '@/components/staff/RoleDashboard';
import { roleBySlug, roles } from '@/lib/roles';

export const dynamicParams = false;

export function generateStaticParams() {
  const primary = roles.map((r) => ({ role: r.slug }));
  const legacy = [
    { role: 'dispatcher' },
    { role: 'supervisor' },
    { role: 'duty-manager' },
    { role: 'executive' },
  ];
  return [...primary, ...legacy];
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params;
  const meta = roleBySlug(role);
  return { title: meta ? `${meta.name} · Grand Azure Demo` : 'Grand Azure Demo' };
}

export default async function StaffRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const meta = roleBySlug(role);
  if (!meta) notFound();
  return <RoleDashboard roleId={meta.id} />;
}

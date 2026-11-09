import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RoleDashboard } from '@/components/staff/RoleDashboard';
import { roleBySlug } from '@/lib/roles';

export function generateStaticParams() {
  return [
    { role: 'fulfiller' },
    { role: 'dispatcher-supervisor' },
    { role: 'department-manager' },
    { role: 'front-desk' },
    { role: 'finance' },
    { role: 'security' },
    { role: 'general-manager' },
    { role: 'admin' },
    { role: 'dispatcher' },
    { role: 'supervisor' },
    { role: 'duty-manager' },
    { role: 'executive' },
  ];
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

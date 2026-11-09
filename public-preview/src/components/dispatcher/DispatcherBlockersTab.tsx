'use client';

import { DispatcherEscalationsTab } from './DispatcherEscalationsTab';
import type { WorkItem, DispatcherDepartment } from '@/types/demo';
import { useDemo } from '@/lib/store';

interface DispatcherBlockersTabProps {
  onOpenEscalate?: () => void;
  tasks?: WorkItem[];
  department?: DispatcherDepartment;
}

export function DispatcherBlockersTab({
  onOpenEscalate,
  tasks: propTasks,
  department,
}: DispatcherBlockersTabProps) {
  const { state } = useDemo();
  const activeDept = department || state.activeDispatcherDept || 'Housekeeping';

  return (
    <DispatcherEscalationsTab
      department={activeDept}
      tasks={propTasks}
      onOpenEscalateModal={onOpenEscalate}
    />
  );
}

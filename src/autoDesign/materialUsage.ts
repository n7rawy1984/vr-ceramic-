import type { DesignMaterials, MaterialRole, MaterialRoleUsage } from './model.ts';

/** Track the role selected by a rule, not matching IDs: two roles can share one material. */
export function materialUsageTracker(materials: DesignMaterials) {
  const usage: MaterialRoleUsage[] = (['primary','secondary','accent','feature'] as const).flatMap(role => {
    const assignment = materials[role];
    return assignment ? [{role, assignment: structuredClone(assignment), status: 'unused' as const, destinations: [], reasons: []}] : [];
  });
  return {
    record(role: MaterialRole | undefined, destination: string, outcome: 'used' | 'constrained', reason?: string) {
      const entry = usage.find(u => u.role === role);
      if (!entry) return;
      if (outcome === 'used') { entry.status = 'used'; if (!entry.destinations.includes(destination)) entry.destinations.push(destination); }
      else if (entry.status !== 'used') entry.status = 'constrained';
      if (reason && !entry.reasons.includes(reason)) entry.reasons.push(reason);
    },
    finish(preserved: { floor?: boolean; walls?: boolean }) {
      for (const entry of usage) if (entry.status === 'unused') entry.reasons.push(
        preserved.floor && preserved.walls ? 'Floor and Walls are preserved. Unlock an intended surface to use a new material.' :
        entry.role === 'feature' ? 'Not used by the current wall choices. Enable an unlocked Feature Wall to use this role.' :
        'Not used by the current concept. Choose a compatible floor pattern, Center, Center Frame or Feature Wall; preserved surfaces keep their current materials.',
      );
      return usage;
    },
  };
}

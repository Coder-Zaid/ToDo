export interface RoleDefinition {
  id: string;
  code: string; // "G", "A", "P", "C", "E"
  badge: string; // "TODO", "CTO", "LEAD", "NEURO", "SCALE"
  name: string;
  tagline: string;
  roleTitle: string;
}

export const ROLES: RoleDefinition[] = [
  {
    id: "general",
    code: "G",
    badge: "TODO",
    name: "General",
    tagline: "Daily Tasks & Errands",
    roleTitle: "Personal Focus",
  },
  {
    id: "agrowvision",
    code: "A",
    badge: "CTO",
    name: "AgrowVision",
    tagline: "Biomaterials & Hyacinth Pulping R&D",
    roleTitle: "Chief Technology Officer",
  },
  {
    id: "itsprelude",
    code: "P",
    badge: "LEAD",
    name: "ITSPRELUDE",
    tagline: "LuxeDrape AI VTON & Distributed Systems",
    roleTitle: "Tech Lead & Systems Head",
  },
  {
    id: "neuvera",
    code: "N",
    badge: "NEUVERA",
    name: "Neuvera",
    tagline: "Neurotechnology & Digital Attention Platform",
    roleTitle: "Lead Neurotech Developer",
  },
  {
    id: "enterprise",
    code: "E",
    badge: "SCALE",
    name: "EzyBite & Enterprise",
    tagline: "Module 7 AI Forecasting & ScaleTech ERP",
    roleTitle: "Lead Systems Architect",
  },
];

export function getRoleClosestDeadline(roleId: string, tasks?: any[]): number | null {
  if (!tasks || tasks.length === 0) return null;

  const roleTasks = tasks.filter((t) => {
    if (t.completed) return false;
    if (roleId === "general") {
      return !t.role || t.role === "general";
    }
    if (roleId === "neuvera") {
      return t.role === "neuvera" || t.role === "curemind";
    }
    return t.role === roleId;
  });

  const deadlines = roleTasks
    .map((t) => t.deadline)
    .filter((d): d is number => typeof d === "number" && d > 0);

  if (deadlines.length === 0) return null;
  return Math.min(...deadlines);
}

export function sortRolesByDeadline(roles: RoleDefinition[], tasks?: any[]): RoleDefinition[] {
  if (!tasks || tasks.length === 0) return [...roles];

  return [...roles].sort((a, b) => {
    const deadA = getRoleClosestDeadline(a.id, tasks);
    const deadB = getRoleClosestDeadline(b.id, tasks);

    // 1. Roles with deadlines sorted by earliest first
    if (deadA !== null && deadB !== null) {
      if (deadA !== deadB) {
        return deadA - deadB;
      }
    }
    // 2. Role with a deadline takes priority over role without a deadline
    if (deadA !== null && deadB === null) return -1;
    if (deadA === null && deadB !== null) return 1;

    // 3. If neither has a deadline, rank roles with uncompleted tasks above idle ones
    const countA = tasks.filter(
      (t) =>
        !t.completed &&
        (a.id === "general"
          ? !t.role || t.role === "general"
          : a.id === "neuvera"
          ? t.role === "neuvera" || t.role === "curemind"
          : t.role === a.id)
    ).length;

    const countB = tasks.filter(
      (t) =>
        !t.completed &&
        (b.id === "general"
          ? !t.role || t.role === "general"
          : b.id === "neuvera"
          ? t.role === "neuvera" || t.role === "curemind"
          : t.role === b.id)
    ).length;

    if (countA > 0 && countB === 0) return -1;
    if (countA === 0 && countB > 0) return 1;

    // 4. Default static order as fallback tie-breaker
    return roles.indexOf(a) - roles.indexOf(b);
  });
}

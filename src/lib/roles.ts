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
    id: "curemind",
    code: "C",
    badge: "NEURO",
    name: "CureMind & Neuvera",
    tagline: "LIF Spiking Neural Networks & Digital Health",
    roleTitle: "AI Neuroscience Researcher",
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

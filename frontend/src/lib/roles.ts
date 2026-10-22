import { Role } from '@/types';

export interface Persona {
  role: Role;
  name: string;
  departmentOrInstitution: string;
}

export const PERSONAS: Record<Role, Persona> = {
  officer: {
    role: 'officer',
    name: 'Demo Officer',
    departmentOrInstitution: 'AICTE Scrutiny & Approval Bureau',
  },
  institution: {
    role: 'institution',
    name: 'Kaveri College of Engineering',
    departmentOrInstitution: 'Applicant Institution (APP-2026-0155)',
  },
};

export const INSTITUTION_APP_ID = 'APP-2026-0155';

export function isRouteAllowedForRole(pathname: string, role: Role): boolean {
  if (role === 'officer') return true;

  // Institution permissions:
  // Allowed: /applications, /applications/new, /applications/:id (in read-mostly mode)
  if (pathname === '/' || pathname === '/applications' || pathname === '/applications/new') {
    return true;
  }
  if (pathname.startsWith('/applications/')) {
    return true;
  }
  // Disallowed for institution: /documents/:id, /rules, /audit, /eval
  return false;
}

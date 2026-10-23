import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role } from '@/types';
import { PERSONAS, Persona, isRouteAllowedForRole } from '@/lib/roles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';

interface RoleContextType {
  role: Role;
  persona: Persona;
  isOfficer: boolean;
  setRole: (newRole: Role) => void;
  toggleRole: () => void;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    const saved = localStorage.getItem('veriaph_role');
    return saved === 'institution' ? 'institution' : 'officer';
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { info } = useToast();

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem('veriaph_role', newRole);

    // Permission check for current route
    if (!isRouteAllowedForRole(location.pathname, newRole)) {
      info(`Switched to Institution view. Redirected to My Applications.`);
      navigate('/applications');
    } else if (newRole === 'institution' && location.pathname === '/') {
      navigate('/applications');
    }
  };

  const toggleRole = () => {
    setRole(role === 'officer' ? 'institution' : 'officer');
  };

  // Guard routes on direct navigation or URL changes
  useEffect(() => {
    if (!isRouteAllowedForRole(location.pathname, role)) {
      info(`Access restricted for Institution role. Redirected to My Applications.`);
      navigate('/applications');
    }
  }, [location.pathname, role, navigate, info]);

  const value = {
    role,
    persona: PERSONAS[role],
    isOfficer: role === 'officer',
    setRole,
    toggleRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}

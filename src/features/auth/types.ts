export type TenantRole = 'owner' | 'user' | 'tecnico';
export type SystemRole = 'user' | 'super_admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'full';
  whatsappLimit: number;
  creditsLimit: number;
  creditsUsed: number;
}

export interface TenantRef {
  id: string;
  name: string;
  role: TenantRole;
}

export interface AuthMe {
  user: AuthUser;
  tenant: Tenant;
  tenantRole: TenantRole;
  systemRole: SystemRole;
  availableTenants: TenantRef[];
}

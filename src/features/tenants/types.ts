import type { TenantRole } from '@/features/auth/types';

export interface TenantMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  picture?: string;
  role: TenantRole;
  joinedAt: string;
}

export interface MyTenant {
  id: string;
  name: string;
  role: TenantRole;
}

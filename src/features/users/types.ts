export interface AdminUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  systemRole: 'user' | 'super_admin';
  lastLogin?: string;
  createdAt: string;
}

export interface AdminTenantSettings {
  plan: 'free' | 'full';
  whatsappLimit: number;
  creditsLimit: number;
  creditsUsed: number;
}

export interface AdminTenant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: AdminTenantSettings;
}

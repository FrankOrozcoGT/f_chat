export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  plan: 'free' | 'full';
  role: 'free' | 'full' | 'admin';
  whatsappLimit: number;
  creditsLimit: number;
  creditsUsed: number;
  billingPeriodStart: string;
  lastLogin?: string;
  createdAt: string;
}

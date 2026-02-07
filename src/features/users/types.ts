export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  plan: 'free' | 'full';
  role: 'free' | 'full' | 'admin';
  lastLogin?: string;
  createdAt: string;
}

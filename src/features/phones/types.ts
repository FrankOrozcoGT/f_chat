export type PhoneStatus = 'connected' | 'disconnected' | 'pending';

export interface Phone {
  id: string;
  phoneNumber?: string;
  instanceName: string;
  status: PhoneStatus;
  qrCode?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  lastConnected?: string;
}

export interface CreatePhoneResponse {
  phone: Phone;
  qrCode: string;
}

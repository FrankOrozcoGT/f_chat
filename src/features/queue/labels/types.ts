export interface ContactLabel {
  id: string;
  label: string;
  clientId: string | null;
  groupJid: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ContactLabelsResponse = ContactLabel[];

export interface CreateContactLabelDto {
  label: string;
  clientId?: string;
  groupJid?: string;
}

export interface UpdateContactLabelDto {
  label?: string;
  clientId?: string;
  groupJid?: string;
}

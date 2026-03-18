export interface ShippingLocation {
  id: string;
  tenantId: string;
  name: string;
  isFreeShipping: boolean;
  shippingCost: number;
}

export interface CreateShippingLocationDto {
  name: string;
  isFreeShipping: boolean;
  shippingCost: number;
}

export interface UpdateShippingLocationDto {
  name?: string;
  isFreeShipping?: boolean;
  shippingCost?: number;
}

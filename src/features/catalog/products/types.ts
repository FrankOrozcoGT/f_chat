export interface ProductDiscount {
  id: string;
  productId: string;
  clientId: string | null;
  discountPrice: number;
  client?: {
    id: string;
    phoneNumber: string;
    name: string | null;
    profilePicUrl: string | null;
    location: string | null;
    metadata: object | null;
    firstContactAt: string;
    lastContactAt: string;
  } | null;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  basePrice: number;
  description: string | null;
  imageUrl: string | null;
  discounts: ProductDiscount[];
}

export interface CreateProductDto {
  name: string;
  basePrice: number;
  description?: string;
}

export interface UpdateProductDto {
  name?: string;
  basePrice?: number;
  description?: string;
}

export interface CreateDiscountDto {
  discountPrice: number;
  clientId?: string;
}

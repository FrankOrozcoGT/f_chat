import type { Product } from '../products/types';

export interface PromotionProduct {
  id: string;
  promotionId: string;
  productId: string;
  product: Product;
}

export interface PromotionDiscount {
  id: string;
  promotionId: string;
  clientId: string;
  discountPrice: number;
  client: {
    id: string;
    phoneNumber: string;
    name: string | null;
    profilePicUrl: string | null;
    location: string | null;
    metadata: object | null;
    firstContactAt: string;
    lastContactAt: string;
  };
}

export interface Promotion {
  id: string;
  tenantId: string;
  name: string | null;
  description: string | null;
  specialPrice: number;
  createdAt: string;
  promotionProducts: PromotionProduct[];
  promotionDiscounts: PromotionDiscount[];
}

export interface CreatePromotionDto {
  name?: string;
  description?: string;
  specialPrice: number;
  productIds: string[];
}

export interface UpdatePromotionDto {
  name?: string;
  description?: string;
  specialPrice?: number;
  productIds?: string[];
}

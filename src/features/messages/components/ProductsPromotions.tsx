// Products & Promotions card for HITL Panel
// Shows products with prices/discounts and promotions extracted from conversation analysis

import { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Tag, Percent } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import type { Product, Promotion, ClientDiscount, ClientPromotionDiscount } from '../types';

interface ProductsPromotionsProps {
  products: Product[];
  promotions: Promotion[];
  clientDiscounts: ClientDiscount[];
  clientPromotionDiscounts: ClientPromotionDiscount[];
}

export const ProductsPromotions = ({
  products,
  promotions,
  clientDiscounts,
  clientPromotionDiscounts,
}: ProductsPromotionsProps) => {
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);
  const [isPromotionsExpanded, setIsPromotionsExpanded] = useState(true);

  const hasProducts = products.length > 0 || clientDiscounts.length > 0;
  const hasPromotions = promotions.length > 0 || clientPromotionDiscounts.length > 0;

  if (!hasProducts && !hasPromotions) return null;

  // Build a map of client-specific discount per product
  const clientDiscountMap = new Map(
    clientDiscounts.map((d) => [d.productId, d.discountPrice])
  );

  // Build a map of client-specific promo discount per promotion
  const clientPromoDiscountMap = new Map(
    clientPromotionDiscounts.map((d) => [d.promotionId, d.discountPrice])
  );

  const formatPrice = (price: number) =>
    `Q${price.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card variant="default" className="p-4 md:p-6">
      {/* Products section */}
      {hasProducts && (
        <div>
          <button
            onClick={() => setIsProductsExpanded(!isProductsExpanded)}
            className="flex items-center justify-between w-full mb-3"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-accent-blue" />
              <h4 className="text-sm font-semibold text-text-primary">
                Productos ({products.length})
              </h4>
            </div>
            {isProductsExpanded ? (
              <ChevronUp className="w-4 h-4 text-text-secondary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            )}
          </button>

          {isProductsExpanded && (
            <div className="space-y-2 mb-4">
              {products.map((product) => {
                const clientPrice = clientDiscountMap.get(product.id);
                const hasDiscount = clientPrice != null;

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-bg-tertiary border border-border-primary"
                  >
                    <span className="text-sm text-text-primary truncate mr-2">
                      {product.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasDiscount && (
                        <span className="text-xs text-text-tertiary line-through">
                          {formatPrice(product.basePrice)}
                        </span>
                      )}
                      <Badge variant={hasDiscount ? 'success' : 'default'} size="sm">
                        {formatPrice(hasDiscount ? clientPrice : product.basePrice)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Promotions section */}
      {hasPromotions && (
        <div>
          <button
            onClick={() => setIsPromotionsExpanded(!isPromotionsExpanded)}
            className="flex items-center justify-between w-full mb-3"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent-orange" />
              <h4 className="text-sm font-semibold text-text-primary">
                Promociones ({promotions.length})
              </h4>
            </div>
            {isPromotionsExpanded ? (
              <ChevronUp className="w-4 h-4 text-text-secondary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            )}
          </button>

          {isPromotionsExpanded && (
            <div className="space-y-2">
              {promotions.map((promo) => {
                const clientPrice = clientPromoDiscountMap.get(promo.id);
                const hasDiscount = clientPrice != null;
                const productNames = promo.promotionProducts
                  .map((pp) => pp.product.name)
                  .join(', ');

                return (
                  <div
                    key={promo.id}
                    className="p-2.5 rounded-lg bg-bg-tertiary border border-border-primary"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary truncate mr-2">
                        {promo.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasDiscount && (
                          <span className="text-xs text-text-tertiary line-through">
                            {formatPrice(promo.specialPrice)}
                          </span>
                        )}
                        <Badge variant={hasDiscount ? 'success' : 'warning'} size="sm">
                          {hasDiscount ? (
                            <>
                              <Percent className="w-3 h-3" />
                              {formatPrice(clientPrice)}
                            </>
                          ) : (
                            formatPrice(promo.specialPrice)
                          )}
                        </Badge>
                      </div>
                    </div>
                    {productNames && (
                      <p className="text-xs text-text-secondary truncate">
                        {productNames}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/contexts/DataContext';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=800';

export function ProductCard({
  product,
  onReserve,
}: {
  product: Product;
  onReserve?: (product: Product) => void;
}) {
  const imageSrc = product.image_url || FALLBACK_IMAGE;

  return (
    <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className="w-28 sm:w-32 bg-secondary/20">
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
          </div>
          <div className="p-5 flex items-center justify-between gap-4 flex-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-lg font-bold text-primary">{product.price}€</span>
              {onReserve && (
                <Button
                  onClick={() => onReserve(product)}
                  className="rounded-xl"
                  size="sm"
                >
                  Reserve
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


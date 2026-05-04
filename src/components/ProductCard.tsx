import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageOff } from 'lucide-react';
import type { Product } from '@/contexts/DataContext';

export function ProductCard({
  product,
  onReserve,
}: {
  product: Product;
  onReserve?: (product: Product) => void;
}) {
  const quantity = product.quantity ?? 0;
  const outOfStock = quantity <= 0;

  return (
    <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className="w-28 sm:w-32 bg-secondary/20 flex items-center justify-center text-muted-foreground shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center">
                <ImageOff size={28} strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="p-5 flex items-center justify-between gap-4 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}
              <div className="mt-2">
                {outOfStock ? (
                  <Badge variant="secondary" className="rounded-lg">
                    Sold out
                  </Badge>
                ) : (
                  <Badge className="bg-success/10 text-success border-0 rounded-lg">
                    {quantity} in stock
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-lg font-bold text-primary">{product.price}€</span>
              {onReserve && (
                <Button
                  onClick={() => onReserve(product)}
                  className="rounded-xl"
                  size="sm"
                  disabled={outOfStock}
                >
                  {outOfStock ? 'Unavailable' : 'Reserve'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


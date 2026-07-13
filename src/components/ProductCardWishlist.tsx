import ProductCard from "./ProductCard";
import { ProductNode } from "@/lib/graphql";

interface ProductCardWishlistProps {
  product: ProductNode & { activeRegion?: string };
  activeRegion?: string;
  onRemoved?: (productId: number) => void;
}

export default function ProductCardWishlist({ product, activeRegion, onRemoved }: ProductCardWishlistProps) {
  return (
    <ProductCard
      product={product}
      activeRegion={activeRegion}
      variant="wishlist"
      onRemovedFromWishlist={onRemoved}
    />
  );
}
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { IntentType } from "@/lib/personalization-engine";
import { storefrontApiRequest, PRODUCTS_QUERY, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

interface ProductGridProps {
  intent: IntentType;
}

const ProductGrid = ({ intent }: ProductGridProps) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await storefrontApiRequest(PRODUCTS_QUERY, { first: 12 });
        if (data?.data?.products?.edges) {
          setProducts(data.data.products.edges);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success(`Added ${product.node.title} to cart`);
  };

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8 flex items-center justify-center gap-3 py-20">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading products…</span>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
              No Products Yet
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your store doesn't have any products. Tell the chat what products you'd like to create (e.g. "Add a 27-inch gaming monitor for $449").
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">
            Popular Monitors
          </h2>
          <p className="text-muted-foreground text-lg">
            Curated picks based on your preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map((product, index) => {
            const price = product.node.priceRange.minVariantPrice;
            const image = product.node.images.edges[0]?.node;

            return (
              <motion.div
                key={product.node.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group relative rounded-xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all duration-300"
              >
                <Link to={`/product/${product.node.handle}`}>
                  <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                    {image ? (
                      <img
                        src={image.url}
                        alt={image.altText || product.node.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-6xl opacity-20 group-hover:scale-110 transition-transform duration-500">
                        🖥️
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-5">
                  <Link to={`/product/${product.node.handle}`}>
                    <h3 className="font-display font-semibold text-foreground text-lg mb-1 hover:text-primary transition-colors">
                      {product.node.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.node.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-display font-bold text-foreground">
                      {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isCartLoading}
                      onClick={() => handleAddToCart(product)}
                      className="rounded-lg border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                    >
                      {isCartLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;

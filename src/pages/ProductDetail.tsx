import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY } from "@/lib/shopify";
import { useCartStore, type ShopifyProduct } from "@/stores/cartStore";

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<ShopifyProduct["node"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
        if (data?.data?.productByHandle) {
          setProduct(data.data.productByHandle);
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };
    if (handle) fetchProduct();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Product Not Found</h1>
          <Link to="/" className="text-primary hover:underline">← Back to store</Link>
        </div>
      </div>
    );
  }

  const variant = product.variants.edges[selectedVariantIdx]?.node;
  const images = product.images.edges;

  const handleAddToCart = async () => {
    if (!variant) return;
    const shopifyProduct: ShopifyProduct = { node: product };
    await addItem({
      product: shopifyProduct,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success(`Added ${product.title} to cart`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 pt-8 pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to store
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="aspect-square rounded-xl bg-secondary/50 overflow-hidden mb-4">
              {images[selectedImage]?.node ? (
                <img
                  src={images[selectedImage].node.url}
                  alt={images[selectedImage].node.altText || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">🖥️</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === i ? "border-primary" : "border-border"
                    }`}
                  >
                    <img src={img.node.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              {product.title}
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

            {variant && (
              <p className="text-3xl font-display font-bold text-foreground mb-6">
                {variant.price.currencyCode} {parseFloat(variant.price.amount).toFixed(2)}
              </p>
            )}

            {/* Variant selector */}
            {product.options.map((option) => (
              <div key={option.name} className="mb-6">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {option.name}
                </label>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    const variantIdx = product.variants.edges.findIndex(
                      (v) => v.node.selectedOptions.some((o) => o.name === option.name && o.value === value)
                    );
                    const isSelected = selectedVariantIdx === variantIdx;
                    return (
                      <button
                        key={value}
                        onClick={() => variantIdx >= 0 && setSelectedVariantIdx(variantIdx)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <Button
              size="lg"
              className="w-full rounded-xl gap-2"
              disabled={isCartLoading || !variant?.availableForSale}
              onClick={handleAddToCart}
            >
              {isCartLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </>
              )}
            </Button>

            {variant && !variant.availableForSale && (
              <p className="text-sm text-destructive mt-3 text-center">This variant is currently out of stock</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

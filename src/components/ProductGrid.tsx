import { motion } from "framer-motion";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IntentType } from "@/lib/personalization-engine";

interface Product {
  id: string;
  name: string;
  spec: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  tags: IntentType[];
  badge?: string;
}

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "VX27 Gaming Elite",
    spec: '27" 240Hz IPS | 1ms GtG',
    price: 449,
    rating: 4.8,
    reviews: 1243,
    tags: ["gaming"],
    badge: "Best Seller",
  },
  {
    id: "2",
    name: "ProVision 4K Studio",
    spec: '32" 4K UHD | USB-C 90W',
    price: 699,
    rating: 4.9,
    reviews: 867,
    tags: ["productivity", "creative"],
    badge: "Editor's Choice",
  },
  {
    id: "3",
    name: "ClearView Essential",
    spec: '24" 1080p IPS | 75Hz',
    price: 179,
    originalPrice: 249,
    rating: 4.5,
    reviews: 3421,
    tags: ["budget", "student"],
    badge: "Best Value",
  },
  {
    id: "4",
    name: "UltraWide 34QR",
    spec: '34" WQHD Curved | 144Hz',
    price: 549,
    rating: 4.7,
    reviews: 612,
    tags: ["gaming", "developer"],
  },
  {
    id: "5",
    name: "ColorMaster Pro 27",
    spec: '27" 4K | 100% DCI-P3 | ΔE<1',
    price: 899,
    rating: 4.9,
    reviews: 432,
    tags: ["creative"],
    badge: "Pro Choice",
  },
  {
    id: "6",
    name: "DualView SE24",
    spec: '24" FHD | Borderless | VESA',
    price: 159,
    originalPrice: 199,
    rating: 4.4,
    reviews: 2089,
    tags: ["budget", "student", "developer"],
  },
  {
    id: "7",
    name: "DevStation 32:9",
    spec: '49" Dual QHD | 120Hz | KVM',
    price: 1299,
    rating: 4.6,
    reviews: 341,
    tags: ["developer", "productivity"],
    badge: "Premium",
  },
  {
    id: "8",
    name: "StudyBuddy 22",
    spec: '22" FHD | Eye-Care | Built-in Speakers',
    price: 129,
    originalPrice: 169,
    rating: 4.3,
    reviews: 5612,
    tags: ["student", "budget"],
    badge: "Campus Pick",
  },
  {
    id: "9",
    name: "ARC 49 SuperUltra",
    spec: '49" Dual QHD | 240Hz | HDR1000',
    price: 1599,
    rating: 4.8,
    reviews: 278,
    tags: ["gaming", "creative"],
    badge: "Flagship",
  },
];

interface ProductGridProps {
  intent: IntentType;
}

const ProductGrid = ({ intent }: ProductGridProps) => {
  const sortedProducts = [...PRODUCTS].sort((a, b) => {
    const aMatch = a.tags.includes(intent) ? 1 : 0;
    const bMatch = b.tags.includes(intent) ? 1 : 0;
    if (bMatch !== aMatch) return bMatch - aMatch;
    return b.rating - a.rating;
  });

  // Show 6 products max
  const displayProducts = sortedProducts.slice(0, 6);

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
          {displayProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group relative rounded-xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all duration-300"
            >
              <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                <div className="text-6xl opacity-20 group-hover:scale-110 transition-transform duration-500">
                  🖥️
                </div>
                {product.badge && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                    {product.badge}
                  </span>
                )}
                {product.tags.includes(intent) && intent !== "default" && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary animate-pulse-glow" />
                )}
              </div>

              <div className="p-5">
                <h3 className="font-display font-semibold text-foreground text-lg mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{product.spec}</p>

                <div className="flex items-center gap-1.5 mb-4">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(product.rating) ? "fill-primary text-primary" : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {product.rating} ({product.reviews.toLocaleString()})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-bold text-foreground">
                      ${product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;

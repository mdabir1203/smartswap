import { motion } from "framer-motion";
import { Truck, RotateCcw, Shield, Headphones } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Truck, label: "Free Shipping", sub: "On orders $99+" },
  { icon: RotateCcw, label: "30-Day Returns", sub: "Hassle-free" },
  { icon: Shield, label: "3-Year Warranty", sub: "Full coverage" },
  { icon: Headphones, label: "24/7 Support", sub: "Expert help" },
];

const TrustBar = () => {
  return (
    <section className="py-12 border-y border-border bg-card/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_ITEMS.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;

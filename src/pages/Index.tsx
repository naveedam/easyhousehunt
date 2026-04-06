import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Shield, Zap, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="font-heading text-4xl md:text-6xl font-bold leading-tight mb-6">
              Find Your Perfect
              <br />
              <span className="text-accent">Rental Home</span>
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-lg">
              Discover verified properties, connect with landlords, and move in hassle-free. Your dream home is just a search away.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-heading font-semibold text-base px-8">
                <Link to="/search">
                  <Search className="h-5 w-5 mr-2" /> Browse Properties
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-heading">
                <Link to="/auth">
                  List Your Property <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Verified Properties', desc: 'Every listing is verified by our team for authenticity and accuracy.' },
            { icon: Zap, title: 'Instant Move-in', desc: 'Select properties available for immediate move-in with zero hassle.' },
            { icon: MapPin, title: 'Map-Based Search', desc: 'Explore neighborhoods on an interactive map to find the perfect location.' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-card rounded-xl border p-6 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg gradient-hero flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16">
        <div className="bg-card rounded-2xl border p-8 md:p-12 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">Are you a Landlord?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            List your property for free and reach thousands of verified tenants.
          </p>
          <Button asChild size="lg" className="font-heading">
            <Link to="/auth">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

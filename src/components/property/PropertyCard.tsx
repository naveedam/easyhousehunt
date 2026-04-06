import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, BedDouble, Maximize, CheckCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface PropertyCardProps {
  id: string;
  title: string;
  address: string;
  rent: number;
  bhk: number;
  area_sqft: number | null;
  furnishing: string;
  property_type: string;
  is_verified: boolean;
  is_instant_move_in: boolean;
  image_url?: string;
}

export default function PropertyCard({
  id, title, address, rent, bhk, area_sqft, furnishing,
  property_type, is_verified, is_instant_move_in, image_url,
}: PropertyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/property/${id}`}>
        <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 group cursor-pointer">
          <div className="relative h-48 bg-muted overflow-hidden">
            {image_url ? (
              <img src={image_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <BedDouble className="h-12 w-12" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex gap-1">
              {is_verified && (
                <Badge className="bg-primary text-primary-foreground text-xs gap-1">
                  <CheckCircle className="h-3 w-3" /> Verified
                </Badge>
              )}
              {is_instant_move_in && (
                <Badge className="bg-accent text-accent-foreground text-xs gap-1">
                  <Zap className="h-3 w-3" /> Instant
                </Badge>
              )}
            </div>
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="capitalize text-xs">{property_type}</Badge>
            </div>
          </div>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-heading font-semibold text-base line-clamp-1">{title}</h3>
              <span className="font-heading font-bold text-primary whitespace-nowrap ml-2">
                ₹{rent.toLocaleString('en-IN')}/mo
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {address}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" /> {bhk} BHK</span>
              {area_sqft && <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> {area_sqft} sqft</span>}
              <span className="capitalize">{furnishing.replace('-', ' ')}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

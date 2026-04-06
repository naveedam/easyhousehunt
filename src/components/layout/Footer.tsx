import { Home } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-heading text-lg font-bold text-primary">
            <Home className="h-5 w-5" />
            RentEase
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RentEase. Find your perfect home.
          </p>
        </div>
      </div>
    </footer>
  );
}

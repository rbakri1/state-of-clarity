import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-gray-200 dark:text-gray-800">404</h1>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Page not found</h2>
        
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition font-medium"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          
          <Link
            href="/briefs"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
          >
            <Search className="w-4 h-4" />
            Browse briefs
          </Link>
        </div>
      </div>
    </div>
  );
}

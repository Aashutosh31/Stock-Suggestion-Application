import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-surface-3 text-muted">
          <Compass className="size-6" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-1 text-sm text-muted">
          The page you were looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button asChild>
            <Link to="/">Back to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/screener">Open screener</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

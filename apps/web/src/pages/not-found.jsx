import { Link } from "@/routing";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <main className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">404</p>
    <h1 className="text-4xl font-bold">Page not found</h1>
    <p className="max-w-md text-muted-foreground">
      The page may have moved, or the address may be incorrect.
    </p>
    <Link to="/">
      <Button>Return home</Button>
    </Link>
  </main>
);

export default NotFound;

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream">
      <div className="mx-auto max-w-md px-8 text-center">
        <p className="text-label uppercase tracking-xl text-gold font-bold">
          Page Not Found
        </p>
        <h1 className="mt-4 text-7xl font-serif font-medium tracking-tight text-navy">
          404
        </h1>
        <p className="mt-6 text-narrative text-navy/60 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="bg-navy px-8 py-3 text-label uppercase tracking-md font-bold text-white hover:bg-navy/90 transition-colors duration-300"
          >
            Back to Home
          </Link>
          <Link
            href="/phoenix"
            className="text-sm font-semibold text-navy/50 hover:text-gold transition-colors duration-300"
          >
            Explore Communities <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

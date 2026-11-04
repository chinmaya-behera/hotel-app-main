import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-4xl text-white">This page is not part of the demo</h1>
        <p className="mt-3 text-sm text-mist-300">Head back to the control dashboard and pick a role.</p>
        <Button href="/" variant="brand" size="lg" className="mt-6">
          Back to demo home
        </Button>
      </div>
    </main>
  );
}

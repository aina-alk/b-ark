import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          ORL Consultation Intelligente
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Assistant IA pour médecins ORL
        </p>
      </div>

      <div className="flex gap-4">
        <Button>Commencer</Button>
        <Button variant="outline">En savoir plus</Button>
      </div>
    </div>
  );
}

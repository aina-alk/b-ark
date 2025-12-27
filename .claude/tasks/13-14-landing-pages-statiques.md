# Task 13: Landing Page

> **Durée estimée** : 1.5h  
> **Phase** : UI Base  
> **Feature PRD** : Page d'accueil publique

## Objectif

Créer une landing page professionnelle présentant l'application aux médecins ORL.

## Scope

### Inclus ✅
- Hero section avec CTA
- Features section (3-4 features clés)
- Section "Comment ça marche"
- CTA final vers inscription
- Footer avec liens légaux

---

## Implémentation

### Structure de la page

**app/(public)/page.tsx**
```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  FileText, 
  Clock, 
  Shield, 
  ArrowRight,
  Stethoscope,
  CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ORL Consult</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>Essai gratuit</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            L'assistant IA qui pense<br />
            <span className="text-primary">comme un chirurgien ORL</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Dictez, transcrivez, générez. Vos comptes-rendus, ordonnances et courriers 
            en moins de 6 minutes au lieu de 15.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Mic}
              title="Dictée vocale"
              description="Dictez naturellement, le vocabulaire ORL est reconnu à plus de 95%"
            />
            <FeatureCard
              icon={FileText}
              title="CR automatiques"
              description="Consultation ou opératoire, le contexte est détecté automatiquement"
            />
            <FeatureCard
              icon={Clock}
              title="Gain de temps"
              description="Passez de 15 à 6 minutes par patient, gagnez 1-2h par jour"
            />
            <FeatureCard
              icon={Shield}
              title="Données sécurisées"
              description="Hébergement HDS certifié, conforme RGPD santé"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Comment ça marche
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number={1}
              title="Dictez"
              description="Parlez naturellement après votre consultation ou intervention"
            />
            <StepCard
              number={2}
              title="Validez"
              description="L'IA génère les documents, vous ajustez si nécessaire"
            />
            <StepCard
              number={3}
              title="Exportez"
              description="PDF, email au confrère, tout en quelques clics"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à gagner du temps ?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Rejoignez les ORL qui ont déjà adopté l'assistant IA.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              Créer mon compte
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 ORL Consultation Intelligente. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground">
                Confidentialité
              </Link>
              <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground">
                CGU
              </Link>
              <Link href="/legal/mentions" className="text-muted-foreground hover:text-foreground">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="p-6 rounded-lg border bg-background">
      <Icon className="h-10 w-10 text-primary mb-4" />
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
```

---

## Critères de succès

- [ ] Page accessible sur `/`
- [ ] CTAs redirigent vers login/register
- [ ] Design responsive
- [ ] Performance (pas d'images lourdes MVP)

---

# Task 14: Pages Statiques (404, 500)

> **Durée estimée** : 1h  
> **Phase** : UI Base

## Objectif

Créer les pages d'erreur personnalisées et les pages légales.

## Implémentation

### Page 404

**app/not-found.tsx**
```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Cette page n'existe pas
        </p>
        <Link href="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

### Page Error (500)

**app/error.tsx**
```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry (Task 41)
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2">Oups !</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Une erreur est survenue
        </p>
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    </div>
  );
}
```

### Page Global Error

**app/global-error.tsx**
```typescript
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              Erreur critique
            </h1>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              L'application a rencontré un problème.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Recharger
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### Pages Légales (placeholder)

**app/(public)/legal/privacy/page.tsx**
```typescript
export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Politique de confidentialité</h1>
      <div className="prose prose-gray">
        <p>Dernière mise à jour : Décembre 2024</p>
        <h2>1. Collecte des données</h2>
        <p>[À compléter avant la release]</p>
        <h2>2. Utilisation des données</h2>
        <p>[À compléter avant la release]</p>
        <h2>3. Hébergement HDS</h2>
        <p>Vos données de santé sont hébergées chez un hébergeur certifié HDS (Hébergeur de Données de Santé).</p>
      </div>
    </div>
  );
}
```

---

## Critères de succès

- [ ] 404 affichée sur route inexistante
- [ ] Error boundary catch les erreurs
- [ ] Pages légales accessibles

# Task 20-21: Transcription Whisper & Détection Contexte

> **Durée estimée** : 3.5h  
> **Phase** : Core - Consultation  
> **Feature PRD** : Épic 1 - US-001, US-002 (Transcription & Détection contexte)

## Contexte

L'audio enregistré est envoyé à l'API Whisper d'OpenAI pour transcription. Ensuite, le texte est analysé pour détecter automatiquement s'il s'agit d'une consultation ou d'une intervention chirurgicale.

## Objectif

Implémenter l'appel à Whisper API et la détection automatique du contexte médical.

## Scope

### Inclus ✅
- API Route pour transcription Whisper
- Affichage streaming de la transcription
- Éditeur de transcription
- Détection contexte (consultation vs intervention)
- Indicateur visuel du contexte détecté
- Correction manuelle du contexte

### Exclus ❌
- Génération du CR (Task 22)
- Stockage long terme de l'audio

---

## Implémentation

### Étape 1 : API Route Whisper

**app/api/transcribe/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convertir le File en format compatible avec OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'fr',
      prompt: 'Transcription médicale ORL. Vocabulaire: otoscopie, rhinoscopie, pharynx, larynx, tympan, amygdales, végétations, septoplastie, FESS, paracentèse.',
    });

    return NextResponse.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
```

### Étape 2 : API Route Détection Contexte

**app/api/detect-context/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CONTEXT_DETECTION_PROMPT = `Tu es un assistant médical spécialisé ORL. Analyse le texte suivant et détermine s'il s'agit d'une CONSULTATION ou d'une INTERVENTION chirurgicale.

Critères pour INTERVENTION:
- Mention d'anesthésie (générale, locale, sédation)
- Vocabulaire chirurgical (incision, dissection, suture, hémostase)
- Termes de bloc opératoire (installation, drapage, bistouri)
- Types d'interventions: amygdalectomie, septoplastie, FESS, paracentèse, pose d'aérateurs

Critères pour CONSULTATION:
- Examen clinique (otoscopie, rhinoscopie, palpation)
- Symptômes du patient (douleur, vertiges, acouphènes, surdité)
- Diagnostic et prescription
- Suivi post-opératoire simple

Réponds UNIQUEMENT avec un JSON valide:
{
  "context": "consultation" | "intervention",
  "confidence": 0.0-1.0,
  "keywords_detected": ["mot1", "mot2", ...]
}`;

export async function POST(request: NextRequest) {
  try {
    const { transcription } = await request.json();

    if (!transcription) {
      return NextResponse.json(
        { error: 'No transcription provided' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Rapide et économique pour cette tâche
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `${CONTEXT_DETECTION_PROMPT}\n\nTexte à analyser:\n${transcription}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Parser le JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        context: 'unknown',
        confidence: 0,
        keywords_detected: [],
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Context detection error:', error);
    return NextResponse.json(
      { context: 'unknown', confidence: 0, keywords_detected: [] },
      { status: 200 } // Retourner unknown plutôt qu'une erreur
    );
  }
}
```

### Étape 3 : Hook useTranscription

**src/features/consultation/hooks/use-transcription.ts**
```typescript
import { useMutation } from '@tanstack/react-query';
import { useConsultationStore } from '@/stores/consultation-store';

interface TranscriptionResult {
  text: string;
}

interface ContextResult {
  context: 'consultation' | 'intervention' | 'unknown';
  confidence: number;
  keywords_detected: string[];
}

export function useTranscription() {
  const { 
    setTranscription, 
    setContextDetected, 
    setIsTranscribing,
    draft 
  } = useConsultationStore();

  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      setIsTranscribing(true);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      return response.json() as Promise<TranscriptionResult>;
    },
    onSuccess: async (data) => {
      setTranscription(data.text);
      
      // Détecter le contexte automatiquement
      try {
        const contextResponse = await fetch('/api/detect-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcription: data.text }),
        });
        
        const contextResult: ContextResult = await contextResponse.json();
        setContextDetected(contextResult.context);
      } catch {
        setContextDetected('unknown');
      }
      
      setIsTranscribing(false);
    },
    onError: () => {
      setIsTranscribing(false);
    },
  });

  return {
    transcribe: transcribeMutation.mutate,
    isTranscribing: transcribeMutation.isPending,
    error: transcribeMutation.error,
  };
}
```

### Étape 4 : Composant Transcription Editor

**src/features/consultation/components/transcription-step.tsx**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, ArrowLeft, Stethoscope, Scissors, HelpCircle } from 'lucide-react';
import { useConsultationStore } from '@/stores/consultation-store';
import { useTranscription } from '../hooks/use-transcription';
import { cn } from '@/lib/utils';

export function TranscriptionStep() {
  const {
    draft,
    isTranscribing,
    setTranscription,
    setContextDetected,
    completeStep,
    setStep,
  } = useConsultationStore();

  const { transcribe } = useTranscription();
  const [localTranscription, setLocalTranscription] = useState(draft.transcription);

  // Lancer la transcription automatiquement si on a un audio
  useEffect(() => {
    if (draft.audioBlob && !draft.transcription && !isTranscribing) {
      transcribe(draft.audioBlob);
    }
  }, [draft.audioBlob, draft.transcription, isTranscribing, transcribe]);

  // Sync avec le store
  useEffect(() => {
    setLocalTranscription(draft.transcription);
  }, [draft.transcription]);

  const handleContinue = () => {
    setTranscription(localTranscription);
    completeStep('transcription');
    setStep('generation');
  };

  const contextOptions = [
    { value: 'consultation', label: 'Consultation', icon: Stethoscope, color: 'text-blue-600' },
    { value: 'intervention', label: 'Intervention', icon: Scissors, color: 'text-orange-600' },
    { value: 'unknown', label: 'Non déterminé', icon: HelpCircle, color: 'text-gray-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Transcription en cours */}
      {isTranscribing && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Transcription en cours...</p>
                <p className="text-sm text-muted-foreground">
                  Analyse de l'enregistrement audio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcription terminée */}
      {!isTranscribing && (
        <>
          {/* Contexte détecté */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Type de document
                {draft.contextDetected !== 'unknown' && (
                  <Badge variant="outline" className="ml-2">
                    Détecté automatiquement
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={draft.contextDetected}
                onValueChange={(v) => setContextDetected(v as any)}
                className="grid grid-cols-3 gap-4"
              >
                {contextOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={cn(
                      'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                      draft.contextDetected === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:bg-muted/50'
                    )}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <option.icon className={cn('h-5 w-5', option.color)} />
                    <span>{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Éditeur de transcription */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={localTranscription}
                onChange={(e) => setLocalTranscription(e.target.value)}
                placeholder="La transcription apparaîtra ici, ou saisissez manuellement..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Vous pouvez modifier la transcription avant de continuer
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('recording')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button 
          onClick={handleContinue} 
          disabled={!localTranscription.trim() || isTranscribing}
        >
          Générer le CR
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### Étape 5 : Installation OpenAI SDK

```bash
pnpm add openai @anthropic-ai/sdk
```

### Étape 6 : Variables d'environnement

Ajouter dans `.env.local` :
```env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Critères de succès

### Fonctionnels
- [ ] Transcription Whisper retourne le texte
- [ ] Vocabulaire médical ORL reconnu
- [ ] Contexte détecté automatiquement
- [ ] Édition de la transcription possible
- [ ] Correction manuelle du contexte

### Techniques
- [ ] Latence transcription < 10s pour 3min audio
- [ ] Gestion des erreurs API
- [ ] Détection contexte fiable (> 90%)

### Métriques PRD
- [ ] Précision transcription > 95%
- [ ] Détection contexte > 98%

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 18-19 | Audio enregistré disponible |

### Bloque

| Task | Raison |
|------|--------|
| 22 | Génération CR utilise la transcription |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **API Routes Next.js** : Transcription et détection sont gérées côté frontend (pas via Xano)
- **Clés API** : `OPENAI_API_KEY` et `ANTHROPIC_API_KEY` dans `.env.local`
- **Format audio** : Whisper accepte `webm/opus`, pas besoin de conversion
- **Sauvegarde Xano** : La transcription n'est pas encore sauvegardée à cette étape (fait en Task 22-23)

### 💡 Suggestions

- Utiliser `claude-3-haiku` pour la détection contexte (rapide et économique)
- Ajouter le prompt médical ORL à Whisper pour améliorer la reconnaissance
- Implémenter un retry en cas d'échec de l'API OpenAI

---

## 📡 Architecture API

### API Routes Next.js (ce task)

| Route | Méthode | Description | API externe |
|-------|---------|-------------|-------------|
| `/api/transcribe` | POST | Transcription audio → texte | OpenAI Whisper |
| `/api/detect-context` | POST | Détection consultation/intervention | Anthropic Claude |

### Endpoints Xano (utilisés plus tard)

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/consultation-update/{consultation_id}/transcription` | PATCH | Sauvegarder la transcription | ✅ Bearer |

### Variables d'environnement requises

```env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

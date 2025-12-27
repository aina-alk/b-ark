# Task 22-23: Génération CR Claude & Éditeur/Validation

> **Durée estimée** : 4.5h  
> **Phase** : Core - Consultation  
> **Feature PRD** : Épic 2 - US-004, US-005 (CR Consultation)

## Contexte

C'est ici que la magie opère ! La transcription est envoyée à Claude pour générer un compte-rendu structuré. Le médecin peut ensuite éditer, régénérer et valider le document.

## Objectif

Implémenter la génération de CR via Claude API avec streaming, et l'éditeur de validation.

## Scope

### Inclus ✅
- API Route pour génération CR (streaming)
- Prompt spécialisé ORL
- Affichage streaming du CR généré
- Éditeur par sections
- Bouton régénérer
- Validation et sauvegarde

### Exclus ❌
- CR opératoire (Task 24-25)
- Export PDF (Task 30)

---

## Implémentation

### Étape 1 : Prompt CR Consultation

**src/features/ai/prompts/cr-consultation.ts**
```typescript
export const CR_CONSULTATION_SYSTEM_PROMPT = `Tu es un assistant médical spécialisé en ORL. Tu génères des comptes-rendus de consultation structurés et professionnels.

RÈGLES IMPORTANTES:
1. Tu DOCUMENTES, tu ne DIAGNOSTIQUES pas - le médecin valide toujours
2. Tu utilises le vocabulaire médical ORL approprié
3. Tu structures le CR selon le format standard
4. Tu extrais les informations de la transcription sans inventer
5. Si une information manque, tu laisses la section vide ou indiques "Non précisé"

FORMAT DE SORTIE (JSON):
{
  "motif": "Motif de consultation",
  "antecedents_pertinents": ["Antécédent 1", "Antécédent 2"],
  "examen_clinique": {
    "otoscopie": "Description ou 'Non réalisée'",
    "rhinoscopie": "Description ou 'Non réalisée'",
    "oropharynx": "Description ou 'Non réalisé'",
    "autres": "Autres examens si mentionnés"
  },
  "examens_complementaires": ["Examen 1", "Examen 2"],
  "conclusion": "Diagnostic ou impression clinique",
  "cat": "Conduite à tenir détaillée"
}

VOCABULAIRE ORL À UTILISER:
- Otoscopie: tympan, CAE, marteau, enclume, perforation, otite, cholestéatome
- Rhinoscopie: cloison nasale, cornets, méats, polypes, déviation septale
- Pharynx: amygdales, voile du palais, luette, paroi postérieure
- Examens: audiogramme, tympanogramme, TDM, IRM, fibroscopie`;

export const CR_CONSULTATION_USER_PROMPT = (transcription: string, patientInfo: string) => `
Génère un compte-rendu de consultation ORL à partir de la transcription suivante.

INFORMATIONS PATIENT:
${patientInfo}

TRANSCRIPTION DU MÉDECIN:
${transcription}

Génère le CR au format JSON spécifié. Sois précis et professionnel.`;
```

### Étape 2 : API Route Génération CR (Streaming)

**app/api/generate-cr/route.ts**
```typescript
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CR_CONSULTATION_SYSTEM_PROMPT, CR_CONSULTATION_USER_PROMPT } from '@/features/ai/prompts/cr-consultation';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcription, patientInfo, contextType } = await request.json();

    if (!transcription) {
      return new Response(
        JSON.stringify({ error: 'No transcription provided' }),
        { status: 400 }
      );
    }

    // Utiliser le bon prompt selon le contexte
    const systemPrompt = contextType === 'intervention' 
      ? CR_OPERATOIRE_SYSTEM_PROMPT  // À créer pour Task 24
      : CR_CONSULTATION_SYSTEM_PROMPT;

    const userPrompt = contextType === 'intervention'
      ? CR_OPERATOIRE_USER_PROMPT(transcription, patientInfo)
      : CR_CONSULTATION_USER_PROMPT(transcription, patientInfo);

    // Streaming response
    const stream = await anthropic.messages.stream({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Créer un ReadableStream pour le client
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('CR generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Generation failed' }),
      { status: 500 }
    );
  }
}
```

### Étape 3 : Hook useGenerateCR

**src/features/consultation/hooks/use-generate-cr.ts**
```typescript
import { useState, useCallback } from 'react';
import { useConsultationStore } from '@/stores/consultation-store';

interface CRContent {
  motif: string;
  antecedents_pertinents: string[];
  examen_clinique: {
    otoscopie: string;
    rhinoscopie: string;
    oropharynx: string;
    autres: string;
  };
  examens_complementaires: string[];
  conclusion: string;
  cat: string;
}

export function useGenerateCR() {
  const [streamedText, setStreamedText] = useState('');
  const [parsedCR, setParsedCR] = useState<CRContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { draft, setGeneratedCR, setIsGenerating: setStoreGenerating } = useConsultationStore();

  const generate = useCallback(async () => {
    if (!draft.transcription) return;

    setIsGenerating(true);
    setStoreGenerating(true);
    setStreamedText('');
    setError(null);

    try {
      const patientInfo = draft.patientIpp 
        ? `IPP: ${draft.patientIpp}` 
        : 'Patient non identifié';

      const response = await fetch('/api/generate-cr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: draft.transcription,
          patientInfo,
          contextType: draft.contextDetected,
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamedText(fullText);
      }

      // Parser le JSON final
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as CRContent;
        setParsedCR(parsed);
        setGeneratedCR(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de génération');
    } finally {
      setIsGenerating(false);
      setStoreGenerating(false);
    }
  }, [draft, setGeneratedCR, setStoreGenerating]);

  return {
    generate,
    streamedText,
    parsedCR,
    isGenerating,
    error,
  };
}
```

### Étape 4 : Composant Generation Step

**src/features/consultation/components/generation-step.tsx**
```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { useConsultationStore } from '@/stores/consultation-store';
import { useGenerateCR } from '../hooks/use-generate-cr';

export function GenerationStep() {
  const { draft, completeStep, setStep } = useConsultationStore();
  const { generate, streamedText, parsedCR, isGenerating, error } = useGenerateCR();

  // Générer automatiquement au montage
  useEffect(() => {
    if (!draft.generatedCR && !isGenerating) {
      generate();
    }
  }, []);

  const handleContinue = () => {
    if (parsedCR) {
      completeStep('generation');
      setStep('validation');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Génération du compte-rendu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Génération en cours...</span>
              </div>
              
              {/* Affichage streaming */}
              <div className="bg-muted rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                {streamedText || 'Analyse de la transcription...'}
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={generate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            </div>
          )}

          {parsedCR && !isGenerating && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✓ Compte-rendu généré avec succès
                </p>
              </div>

              {/* Aperçu du CR */}
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Motif</p>
                  <p>{parsedCR.motif}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Conclusion</p>
                  <p>{parsedCR.conclusion}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">CAT</p>
                  <p>{parsedCR.cat}</p>
                </div>
              </div>

              <Button variant="outline" onClick={generate} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Régénérer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('transcription')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button onClick={handleContinue} disabled={!parsedCR || isGenerating}>
          Éditer et valider
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### Étape 5 : Composant Validation/Édition

**src/features/consultation/components/validation-step.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, Loader2, FileText, Pill, Mail } from 'lucide-react';
import { useConsultationStore } from '@/stores/consultation-store';
import { useMutation } from '@tanstack/react-query';
import { xano } from '@/lib/xano';
import { toast } from 'sonner';

export function ValidationStep() {
  const router = useRouter();
  const { draft, setStep, reset } = useConsultationStore();
  const [editedCR, setEditedCR] = useState(draft.generatedCR || {});

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Créer la consultation (POST /consultation - singulier)
      const consultation = await xano.post('/consultation', {
        patient_id: draft.patientId,
        date: new Date().toISOString(),
        motif: editedCR.motif,
        transcription: draft.transcription,
        context_detected: draft.contextDetected,
        status: 'validated',
      });

      // 2. Créer le document CR (POST /document - singulier)
      await xano.post('/document', {
        consultation_id: consultation.id,
        patient_id: draft.patientId,
        type: 'cr_consultation',
        title: `CR Consultation - ${new Date().toLocaleDateString('fr-FR')}`,
        content: editedCR,
        validated: true,
        validated_at: new Date().toISOString(),
      });

      return consultation;
    },
    onSuccess: (consultation) => {
      toast.success('Consultation enregistrée !');
      reset();
      router.push(`/consultations/${consultation.id}`);
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement');
    },
  });

  const updateField = (path: string, value: string) => {
    setEditedCR((prev) => {
      const keys = path.split('.');
      const newCR = { ...prev };
      let current: any = newCR;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newCR;
    });
  };

  return (
    <div className="space-y-6">
      {/* Sections éditables */}
      <Card>
        <CardHeader>
          <CardTitle>Motif de consultation</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={editedCR.motif || ''}
            onChange={(e) => updateField('motif', e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Examen clinique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Otoscopie</Label>
            <Textarea
              value={editedCR.examen_clinique?.otoscopie || ''}
              onChange={(e) => updateField('examen_clinique.otoscopie', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Rhinoscopie</Label>
            <Textarea
              value={editedCR.examen_clinique?.rhinoscopie || ''}
              onChange={(e) => updateField('examen_clinique.rhinoscopie', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Oropharynx</Label>
            <Textarea
              value={editedCR.examen_clinique?.oropharynx || ''}
              onChange={(e) => updateField('examen_clinique.oropharynx', e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conclusion</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editedCR.conclusion || ''}
            onChange={(e) => updateField('conclusion', e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conduite à tenir</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editedCR.cat || ''}
            onChange={(e) => updateField('cat', e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Actions post-validation */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col">
              <Pill className="h-5 w-5 mb-2" />
              <span>Ordonnance</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <Mail className="h-5 w-5 mb-2" />
              <span>Courrier</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <FileText className="h-5 w-5 mb-2" />
              <span>Export PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('generation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Valider et enregistrer
        </Button>
      </div>
    </div>
  );
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Génération CR streaming fonctionne
- [ ] CR structuré selon le format attendu
- [ ] Édition par section possible
- [ ] Régénération possible
- [ ] Validation sauvegarde en base

### Techniques
- [ ] Streaming < 15s pour génération complète
- [ ] JSON valide en sortie
- [ ] Pas d'hallucinations (vérifier que le contenu vient de la transcription)

### Métriques PRD
- [ ] Taux d'acceptation CR > 75% sans modification majeure

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 20-21 | Transcription et contexte disponibles |
| 07 | Endpoints consultations/documents |

### Bloque

| Task | Raison |
|------|--------|
| 27-29 | Documents utilisent le même pattern |
| 30 | Export PDF du CR |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Endpoints singuliers** : Utiliser `/consultation` et `/document` (pas le pluriel)
- **Génération Claude** : Via API route Next.js `/api/generate-cr` (pas Xano)
- **Streaming** : Utiliser `claude-3-sonnet` pour la génération (meilleur rapport qualité/coût)
- **Format JSON** : Le CR doit être parsé depuis la réponse Claude

### 💡 Suggestions

- Implémenter un mode "édition rapide" pour corrections mineures
- Ajouter historique des régénérations
- Permettre de sauvegarder comme brouillon avant validation

---

## 📡 Architecture API

### API Routes Next.js (génération)

| Route | Méthode | Description | API externe |
|-------|---------|-------------|-------------|
| `/api/generate-cr` | POST | Génération CR streaming | Anthropic Claude |

### Endpoints Xano (sauvegarde)

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/consultation` | POST | Créer une consultation | ✅ Bearer |
| `/consultation/{consultation_id}` | PATCH | Modifier une consultation | ✅ Bearer |
| `/document` | POST | Créer un document | ✅ Bearer |
| `/document/{document_id}` | PATCH | Modifier un document | ✅ Bearer |
| `/documents/{id}/validate` | PATCH | Valider un document | ✅ Bearer |
| `/consultation-update/{consultation_id}/validate` | PATCH | Valider une consultation | ✅ Bearer |

# Task 24-25: Intervention - Workflow CR Opératoire

> **Durée estimée** : 4h  
> **Phase** : Core - Intervention  
> **Feature PRD** : Épic 3 - US-006, US-007 (CR Opératoire)

## Contexte

Le workflow d'intervention est similaire à celui de consultation, mais génère un compte-rendu opératoire (CRO) avec une structure différente : indication, technique, incidents, suites.

## Objectif

Adapter le workflow consultation pour les interventions chirurgicales avec templates spécifiques.

## Scope

### Inclus ✅
- Page `/intervention/new`
- Sélection type d'intervention
- Prompt CRO spécialisé
- Templates par type d'intervention
- Génération et validation CRO

### Exclus ❌
- Ordonnances post-op (Task 28)
- Intégration bloc opératoire

---

## Implémentation

### Étape 1 : Types d'interventions

**src/features/intervention/data/intervention-types.ts**
```typescript
export const INTERVENTION_TYPES = [
  { value: 'amygdalectomie', label: 'Amygdalectomie', category: 'Pharynx' },
  { value: 'adenoidectomie', label: 'Adénoïdectomie', category: 'Pharynx' },
  { value: 'amygdalectomie_adenoidectomie', label: 'Amygdalectomie + Adénoïdectomie', category: 'Pharynx' },
  { value: 'septoplastie', label: 'Septoplastie', category: 'Nez' },
  { value: 'rhinoseptoplastie', label: 'Rhinoseptoplastie', category: 'Nez' },
  { value: 'turbinoplastie', label: 'Turbinoplastie', category: 'Nez' },
  { value: 'fess', label: 'FESS (Chirurgie endoscopique des sinus)', category: 'Sinus' },
  { value: 'meatomie', label: 'Méatotomie moyenne', category: 'Sinus' },
  { value: 'paracentese', label: 'Paracentèse', category: 'Oreille' },
  { value: 'aerateurs', label: 'Pose d\'aérateurs transtympaniques', category: 'Oreille' },
  { value: 'tympanoplastie', label: 'Tympanoplastie', category: 'Oreille' },
  { value: 'mastoïdectomie', label: 'Mastoïdectomie', category: 'Oreille' },
  { value: 'thyroidectomie', label: 'Thyroïdectomie', category: 'Cou' },
  { value: 'parotidectomie', label: 'Parotidectomie', category: 'Glandes' },
  { value: 'autre', label: 'Autre intervention', category: 'Autre' },
] as const;

export type InterventionType = typeof INTERVENTION_TYPES[number]['value'];
```

### Étape 2 : Prompt CR Opératoire

**src/features/ai/prompts/cr-operatoire.ts**
```typescript
export const CR_OPERATOIRE_SYSTEM_PROMPT = `Tu es un assistant médical spécialisé en chirurgie ORL. Tu génères des comptes-rendus opératoires structurés et professionnels.

RÈGLES IMPORTANTES:
1. Tu DOCUMENTES l'intervention, le chirurgien valide toujours
2. Tu utilises le vocabulaire chirurgical ORL approprié
3. Tu structures le CRO selon le format standard
4. Tu extrais les informations de la transcription sans inventer
5. Si une information manque, indique "Non précisé dans la dictée"

FORMAT DE SORTIE (JSON):
{
  "date_intervention": "Date de l'intervention",
  "type_intervention": "Type d'intervention réalisée",
  "indication": "Indication opératoire",
  "anesthesie": "Type d'anesthésie (AG, AL, sédation)",
  "installation": "Position du patient, installation",
  "technique": "Description détaillée de la technique opératoire",
  "constatations": "Constatations per-opératoires",
  "incidents": "Incidents ou difficultés rencontrées (ou 'Aucun')",
  "hemostase": "Type d'hémostase réalisée",
  "duree": "Durée opératoire si mentionnée",
  "suites_immediates": "État du patient en fin d'intervention",
  "consignes_postop": "Consignes post-opératoires"
}

VOCABULAIRE CHIRURGICAL:
- Installation: décubitus dorsal, billot sous les épaules, têtière, etc.
- Anesthésie: AG avec IOT, AL avec sédation, bloc locorégional
- Technique: dissection, électrocoagulation, laser, radiofréquence
- Hémostase: bipolaire, tamponnement, Surgicel, etc.`;

export const CR_OPERATOIRE_USER_PROMPT = (transcription: string, patientInfo: string, interventionType: string) => `
Génère un compte-rendu opératoire pour cette intervention ORL.

TYPE D'INTERVENTION: ${interventionType}

INFORMATIONS PATIENT:
${patientInfo}

TRANSCRIPTION DU CHIRURGIEN:
${transcription}

Génère le CRO au format JSON spécifié. Sois précis et professionnel.`;
```

### Étape 3 : Page Nouvelle Intervention

**app/(authenticated)/intervention/new/page.tsx**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { ConsultationStepper } from '@/features/consultation/components/consultation-stepper';
import { PatientSelection } from '@/features/consultation/components/patient-selection';
import { AudioRecorder } from '@/features/consultation/components/audio-recorder';
import { InterventionTypeSelector } from '@/features/intervention/components/intervention-type-selector';
import { InterventionGenerationStep } from '@/features/intervention/components/intervention-generation-step';
import { InterventionValidationStep } from '@/features/intervention/components/intervention-validation-step';
import { useConsultationStore } from '@/stores/consultation-store';

export default function NewInterventionPage() {
  const { currentStep, reset, setContextDetected } = useConsultationStore();
  const [interventionType, setInterventionType] = useState<string | null>(null);

  useEffect(() => {
    reset();
    setContextDetected('intervention');
  }, [reset, setContextDetected]);

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6">Nouveau Compte-Rendu Opératoire</h1>
      
      <ConsultationStepper />

      <div className="mt-8">
        {currentStep === 'patient' && (
          <div className="space-y-6">
            <InterventionTypeSelector
              value={interventionType}
              onChange={setInterventionType}
            />
            <PatientSelection />
          </div>
        )}
        {currentStep === 'recording' && <AudioRecorder />}
        {currentStep === 'transcription' && <TranscriptionStep />}
        {currentStep === 'generation' && (
          <InterventionGenerationStep interventionType={interventionType} />
        )}
        {currentStep === 'validation' && <InterventionValidationStep />}
      </div>
    </div>
  );
}
```

### Étape 4 : Sélecteur Type Intervention

**src/features/intervention/components/intervention-type-selector.tsx**
```typescript
'use client';

import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { INTERVENTION_TYPES } from '../data/intervention-types';
import { cn } from '@/lib/utils';

interface Props {
  value: string | null;
  onChange: (value: string) => void;
}

export function InterventionTypeSelector({ value, onChange }: Props) {
  // Grouper par catégorie
  const grouped = INTERVENTION_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof INTERVENTION_TYPES[number][]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type d'intervention</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value || ''} onValueChange={onChange}>
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, types]) => (
              <div key={category}>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">
                  {category}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {types.map((type) => (
                    <Label
                      key={type.value}
                      htmlFor={type.value}
                      className={cn(
                        'flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors text-sm',
                        value === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:bg-muted/50'
                      )}
                    >
                      <RadioGroupItem value={type.value} id={type.value} />
                      {type.label}
                    </Label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
```

### Étape 5 : Validation CRO

**src/features/intervention/components/intervention-validation-step.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useConsultationStore } from '@/stores/consultation-store';
import { useMutation } from '@tanstack/react-query';
import { xano } from '@/lib/xano';
import { toast } from 'sonner';

export function InterventionValidationStep() {
  const router = useRouter();
  const { draft, setStep, reset } = useConsultationStore();
  const [editedCRO, setEditedCRO] = useState(draft.generatedCR || {});

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Créer l'intervention (POST /intervention - singulier)
      const intervention = await xano.post('/intervention', {
        patient_id: draft.patientId,
        date: new Date().toISOString(),
        type_intervention: editedCRO.type_intervention,
        transcription: draft.transcription,
        indication: editedCRO.indication,
        technique: editedCRO.technique,
        status: 'validated',
        duration_minutes: editedCRO.duree ? parseInt(editedCRO.duree) : null,
        anesthesia_type: editedCRO.anesthesie,
      });

      // 2. Créer le document CRO (POST /document - singulier)
      await xano.post('/document', {
        intervention_id: intervention.id,
        patient_id: draft.patientId,
        type: 'cr_operatoire',
        title: `CRO ${editedCRO.type_intervention} - ${new Date().toLocaleDateString('fr-FR')}`,
        content: editedCRO,
        validated: true,
        validated_at: new Date().toISOString(),
      });

      return intervention;
    },
    onSuccess: (intervention) => {
      toast.success('Intervention enregistrée !');
      reset();
      router.push(`/interventions/${intervention.id}`);
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement');
    },
  });

  const updateField = (field: string, value: string) => {
    setEditedCRO((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Indication opératoire</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editedCRO.indication || ''}
            onChange={(e) => updateField('indication', e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anesthésie et installation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Type d'anesthésie</Label>
            <Input
              value={editedCRO.anesthesie || ''}
              onChange={(e) => updateField('anesthesie', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Installation</Label>
            <Textarea
              value={editedCRO.installation || ''}
              onChange={(e) => updateField('installation', e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technique opératoire</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editedCRO.technique || ''}
            onChange={(e) => updateField('technique', e.target.value)}
            className="min-h-[200px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incidents et hémostase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Incidents / Difficultés</Label>
            <Textarea
              value={editedCRO.incidents || 'Aucun'}
              onChange={(e) => updateField('incidents', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Hémostase</Label>
            <Input
              value={editedCRO.hemostase || ''}
              onChange={(e) => updateField('hemostase', e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suites immédiates</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editedCRO.suites_immediates || ''}
            onChange={(e) => updateField('suites_immediates', e.target.value)}
          />
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
- [ ] Sélection type d'intervention
- [ ] CRO généré avec structure spécifique
- [ ] Templates par type d'intervention
- [ ] Validation sauvegarde en base

### Techniques
- [ ] Réutilisation du workflow consultation
- [ ] Prompt adapté chirurgie

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 18-23 | Workflow consultation comme base |

### Bloque

| Task | Raison |
|------|--------|
| 28 | Ordonnances post-op |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Endpoints singuliers** : Utiliser `/intervention` et `/document` (pas le pluriel)
- **Réutilisation** : Réutiliser le store et composants du workflow consultation
- **Context** : Forcer `contextDetected: 'intervention'` au montage de la page
- **Types** : Récupérer les types via `/interventions/type` ou utiliser les constantes locales

### 💡 Suggestions

- Charger les types d'intervention depuis l'API pour faciliter les mises à jour
- Ajouter des templates pré-remplis par type d'intervention

---

## 📡 Endpoints API utilisés (swagger)

### CRUD Interventions

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/intervention` | GET | Liste des interventions | ✅ Bearer |
| `/intervention` | POST | Créer une intervention | ✅ Bearer |
| `/intervention/{intervention_id}` | GET | Récupérer une intervention | ✅ Bearer |
| `/intervention/{intervention_id}` | PATCH | Modifier une intervention | ✅ Bearer |
| `/intervention/{intervention_id}` | DELETE | Supprimer une intervention | ✅ Bearer |
| `/intervention-validate/{intervention_id}` | PATCH | Valider une intervention | ✅ Bearer |

### Relations

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/interventions-per-patient/{patient_id}` | GET | Interventions d'un patient | ✅ Bearer |
| `/interventions/type` | GET | Types d'interventions disponibles | ✅ Bearer |

### Documents

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/document` | POST | Créer un document (CRO) | ✅ Bearer |

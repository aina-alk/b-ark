# Task 18-19: Consultation - Workflow & Recording Audio

> **Durée estimée** : 3.5h  
> **Phase** : Core - Consultation  
> **Feature PRD** : Épic 1 - Transcription vocale (US-001, US-003)

## Contexte

C'est le cœur de l'application ! Le workflow de consultation guide le médecin de la sélection du patient jusqu'à la validation du CR. Cette tâche implémente le stepper et l'enregistrement audio.

## Objectif

Créer le workflow complet de consultation avec stepper visuel et enregistrement audio via MediaRecorder API.

## Scope

### Inclus ✅
- Page `/consultation/new`
- Composant Stepper (5 étapes)
- Sélection patient (existant ou nouveau IPP)
- Enregistrement audio avec visualisation
- Stockage temporaire de l'audio (Blob)
- Saisie manuelle alternative

### Exclus ❌
- Transcription Whisper (Task 20)
- Détection contexte (Task 21)
- Génération CR (Task 22)

---

## Implémentation

### Étape 1 : Types et Store

**src/features/consultation/types.ts**
```typescript
export type ConsultationStep = 
  | 'patient'
  | 'recording'
  | 'transcription'
  | 'generation'
  | 'validation';

export interface ConsultationDraft {
  patientId: number | null;
  patientIpp: number | null;
  audioBlob: Blob | null;
  transcription: string;
  contextDetected: 'consultation' | 'intervention' | 'unknown';
  generatedCR: Record<string, unknown> | null;
}
```

**src/stores/consultation-store.ts**
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ConsultationStep, ConsultationDraft } from '@/features/consultation/types';

interface ConsultationState {
  // Navigation
  currentStep: ConsultationStep;
  completedSteps: ConsultationStep[];
  
  // Draft data
  draft: ConsultationDraft;
  
  // Recording state
  isRecording: boolean;
  recordingDuration: number;
  
  // Loading states
  isTranscribing: boolean;
  isGenerating: boolean;
  
  // Actions
  setStep: (step: ConsultationStep) => void;
  completeStep: (step: ConsultationStep) => void;
  setPatient: (patientId: number, ipp: number) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setTranscription: (text: string) => void;
  setContextDetected: (context: 'consultation' | 'intervention' | 'unknown') => void;
  setGeneratedCR: (cr: Record<string, unknown>) => void;
  setIsRecording: (isRecording: boolean) => void;
  setRecordingDuration: (duration: number) => void;
  setIsTranscribing: (isTranscribing: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  reset: () => void;
}

const initialDraft: ConsultationDraft = {
  patientId: null,
  patientIpp: null,
  audioBlob: null,
  transcription: '',
  contextDetected: 'unknown',
  generatedCR: null,
};

export const useConsultationStore = create<ConsultationState>()(
  devtools(
    (set) => ({
      currentStep: 'patient',
      completedSteps: [],
      draft: initialDraft,
      isRecording: false,
      recordingDuration: 0,
      isTranscribing: false,
      isGenerating: false,

      setStep: (step) => set({ currentStep: step }),
      
      completeStep: (step) => set((state) => ({
        completedSteps: [...new Set([...state.completedSteps, step])],
      })),
      
      setPatient: (patientId, ipp) => set((state) => ({
        draft: { ...state.draft, patientId, patientIpp: ipp },
      })),
      
      setAudioBlob: (blob) => set((state) => ({
        draft: { ...state.draft, audioBlob: blob },
      })),
      
      setTranscription: (text) => set((state) => ({
        draft: { ...state.draft, transcription: text },
      })),
      
      setContextDetected: (context) => set((state) => ({
        draft: { ...state.draft, contextDetected: context },
      })),
      
      setGeneratedCR: (cr) => set((state) => ({
        draft: { ...state.draft, generatedCR: cr },
      })),
      
      setIsRecording: (isRecording) => set({ isRecording }),
      setRecordingDuration: (duration) => set({ recordingDuration: duration }),
      setIsTranscribing: (isTranscribing) => set({ isTranscribing }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      
      reset: () => set({
        currentStep: 'patient',
        completedSteps: [],
        draft: initialDraft,
        isRecording: false,
        recordingDuration: 0,
        isTranscribing: false,
        isGenerating: false,
      }),
    }),
    { name: 'consultation-store' }
  )
);
```

### Étape 2 : Composant Stepper

**src/features/consultation/components/consultation-stepper.tsx**
```typescript
'use client';

import { cn } from '@/lib/utils';
import { Check, User, Mic, FileText, Sparkles, CheckCircle } from 'lucide-react';
import { useConsultationStore } from '@/stores/consultation-store';
import type { ConsultationStep } from '../types';

const steps: { id: ConsultationStep; label: string; icon: React.ElementType }[] = [
  { id: 'patient', label: 'Patient', icon: User },
  { id: 'recording', label: 'Dictée', icon: Mic },
  { id: 'transcription', label: 'Transcription', icon: FileText },
  { id: 'generation', label: 'Génération', icon: Sparkles },
  { id: 'validation', label: 'Validation', icon: CheckCircle },
];

export function ConsultationStepper() {
  const { currentStep, completedSteps, setStep } = useConsultationStore();

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  const canNavigateTo = (stepId: ConsultationStep) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    // Peut naviguer vers les étapes complétées ou l'étape courante
    return completedSteps.includes(stepId) || stepIndex <= currentIndex;
  };

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isClickable = canNavigateTo(step.id);

          return (
            <li key={step.id} className="flex-1 relative">
              {/* Ligne de connexion */}
              {index > 0 && (
                <div
                  className={cn(
                    'absolute left-0 top-5 -translate-y-1/2 w-full h-0.5 -ml-1/2',
                    isCompleted || index <= currentIndex
                      ? 'bg-primary'
                      : 'bg-muted'
                  )}
                  style={{ width: 'calc(100% - 2.5rem)', left: '-50%', marginLeft: '1.25rem' }}
                />
              )}

              {/* Step indicator */}
              <button
                onClick={() => isClickable && setStep(step.id)}
                disabled={!isClickable}
                className={cn(
                  'relative z-10 flex flex-col items-center group',
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCurrent
                      ? 'border-primary bg-background text-primary'
                      : 'border-muted bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </span>
                <span
                  className={cn(
                    'mt-2 text-sm font-medium',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

### Étape 3 : Sélection Patient

**src/features/consultation/components/patient-selection.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Search, UserPlus, ArrowRight } from 'lucide-react';
import { xano } from '@/lib/xano';
import { useConsultationStore } from '@/stores/consultation-store';
import type { Patient, PaginatedResponse } from '@/types/xano';

export function PatientSelection() {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [searchIpp, setSearchIpp] = useState('');
  const [newIpp, setNewIpp] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { setPatient, completeStep, setStep } = useConsultationStore();

  // Recherche patient existant par IPP
  const { data: foundPatient, isLoading: isSearching } = useQuery({
    queryKey: ['patients', 'by-ipp', searchIpp],
    queryFn: () => xano.get<Patient>('/patient-by-ipp', { ipp: parseInt(searchIpp) }),
    enabled: searchIpp.length >= 3 && !isNaN(parseInt(searchIpp)),
  });

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleContinue = async () => {
    if (mode === 'existing' && selectedPatient) {
      setPatient(selectedPatient.id, selectedPatient.ipp);
      completeStep('patient');
      setStep('recording');
    } else if (mode === 'new' && newIpp) {
      // Créer le patient d'abord (POST /patient)
      try {
        const newPatient = await xano.post<Patient>('/patient', {
          ipp: parseInt(newIpp),
          allergies: [],
          antecedents: [],
        });
        setPatient(newPatient.id, newPatient.ipp);
        completeStep('patient');
        setStep('recording');
      } catch (error) {
        // Gérer l'erreur (IPP déjà existant, etc.)
        console.error('Erreur création patient:', error);
      }
    }
  };

  const canContinue = 
    (mode === 'existing' && selectedPatient) || 
    (mode === 'new' && newIpp.length >= 4);

  return (
    <div className="space-y-6">
      <RadioGroup
        value={mode}
        onValueChange={(v) => setMode(v as 'existing' | 'new')}
        className="grid grid-cols-2 gap-4"
      >
        <Label
          htmlFor="existing"
          className={cn(
            'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
            mode === 'existing' ? 'border-primary bg-primary/5' : 'border-muted'
          )}
        >
          <RadioGroupItem value="existing" id="existing" />
          <Search className="h-5 w-5" />
          <span>Patient existant</span>
        </Label>
        
        <Label
          htmlFor="new"
          className={cn(
            'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
            mode === 'new' ? 'border-primary bg-primary/5' : 'border-muted'
          )}
        >
          <RadioGroupItem value="new" id="new" />
          <UserPlus className="h-5 w-5" />
          <span>Nouveau patient</span>
        </Label>
      </RadioGroup>

      {mode === 'existing' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rechercher par IPP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Entrez l'IPP du patient..."
                value={searchIpp}
                onChange={(e) => setSearchIpp(e.target.value)}
                className="pl-10"
              />
            </div>

            {isSearching && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Recherche...
              </div>
            )}

            {foundPatient && (
              <button
                onClick={() => handleSelectPatient(foundPatient)}
                className={cn(
                  'w-full p-3 text-left border rounded-lg transition-colors',
                  selectedPatient?.id === foundPatient.id
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:bg-muted/50'
                )}
              >
                <div className="font-medium">IPP: {foundPatient.ipp}</div>
                {foundPatient.allergies.length > 0 && (
                  <div className="text-sm text-destructive">
                    Allergies: {foundPatient.allergies.join(', ')}
                  </div>
                )}
              </button>
            )}

            {searchIpp.length >= 3 && !isSearching && !foundPatient && (
              <p className="text-muted-foreground text-sm">
                Aucun patient trouvé avec cet IPP
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nouveau patient</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="newIpp">IPP (Identifiant Patient Permanent)</Label>
              <Input
                id="newIpp"
                placeholder="Ex: 10042"
                value={newIpp}
                onChange={(e) => setNewIpp(e.target.value.replace(/\D/g, ''))}
              />
              <p className="text-sm text-muted-foreground">
                Entrez l'IPP tel qu'il apparaît dans votre logiciel métier
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!canContinue}>
          Continuer
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### Étape 4 : Composant Audio Recorder

**src/features/consultation/components/audio-recorder.tsx**
```typescript
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Pause, Play, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useConsultationStore } from '@/stores/consultation-store';
import { cn } from '@/lib/utils';

export function AudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const {
    isRecording,
    recordingDuration,
    draft,
    setIsRecording,
    setRecordingDuration,
    setAudioBlob,
    completeStep,
    setStep,
  } = useConsultationStore();

  // Formater la durée en MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Démarrer l'enregistrement
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Arrêter le stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // Collecter les données toutes les secondes
      setIsRecording(true);
      setRecordingDuration(0);

      // Timer pour afficher la durée
      timerRef.current = setInterval(() => {
        setRecordingDuration(recordingDuration + 1);
      }, 1000);
    } catch (error) {
      console.error('Erreur accès microphone:', error);
      // TODO: Afficher un toast d'erreur
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Pause/Resume
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingDuration(recordingDuration + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    setIsPaused(!isPaused);
  };

  // Supprimer l'enregistrement
  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  // Continuer vers transcription
  const handleContinue = () => {
    if (draft.audioBlob) {
      completeStep('recording');
      setStep('transcription');
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Update timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(recordingDuration + 1);
      }, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [isRecording, isPaused, recordingDuration, setRecordingDuration]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
            {/* Indicateur visuel */}
            <div
              className={cn(
                'w-32 h-32 rounded-full flex items-center justify-center transition-all',
                isRecording
                  ? 'bg-destructive/10 animate-pulse'
                  : audioUrl
                  ? 'bg-green-100'
                  : 'bg-muted'
              )}
            >
              <Mic
                className={cn(
                  'h-12 w-12',
                  isRecording ? 'text-destructive' : 'text-muted-foreground'
                )}
              />
            </div>

            {/* Durée */}
            <div className="text-3xl font-mono font-bold">
              {formatDuration(recordingDuration)}
            </div>

            {/* Contrôles */}
            <div className="flex items-center gap-4">
              {!isRecording && !audioUrl && (
                <Button size="lg" onClick={startRecording}>
                  <Mic className="mr-2 h-5 w-5" />
                  Démarrer la dictée
                </Button>
              )}

              {isRecording && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePause}
                  >
                    {isPaused ? (
                      <Play className="h-5 w-5" />
                    ) : (
                      <Pause className="h-5 w-5" />
                    )}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={stopRecording}
                  >
                    <Square className="mr-2 h-5 w-5" />
                    Arrêter
                  </Button>
                </>
              )}

              {audioUrl && !isRecording && (
                <>
                  <audio src={audioUrl} controls className="max-w-full" />
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={deleteRecording}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Ou saisie manuelle */}
            {!isRecording && !audioUrl && (
              <p className="text-sm text-muted-foreground">
                Ou{' '}
                <button
                  onClick={() => {
                    // Passer directement à la transcription avec mode manuel
                    completeStep('recording');
                    setStep('transcription');
                  }}
                  className="text-primary hover:underline"
                >
                  saisissez manuellement
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('patient')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button onClick={handleContinue} disabled={!draft.audioBlob}>
          Transcrire
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### Étape 5 : Page Nouvelle Consultation

**app/(authenticated)/consultation/new/page.tsx**
```typescript
'use client';

import { useEffect } from 'react';
import { ConsultationStepper } from '@/features/consultation/components/consultation-stepper';
import { PatientSelection } from '@/features/consultation/components/patient-selection';
import { AudioRecorder } from '@/features/consultation/components/audio-recorder';
import { useConsultationStore } from '@/stores/consultation-store';

export default function NewConsultationPage() {
  const { currentStep, reset } = useConsultationStore();

  // Reset au montage
  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6">Nouvelle Consultation</h1>
      
      <ConsultationStepper />

      <div className="mt-8">
        {currentStep === 'patient' && <PatientSelection />}
        {currentStep === 'recording' && <AudioRecorder />}
        {currentStep === 'transcription' && (
          <div>Transcription - Task 20</div>
        )}
        {currentStep === 'generation' && (
          <div>Génération CR - Task 22</div>
        )}
        {currentStep === 'validation' && (
          <div>Validation - Task 23</div>
        )}
      </div>
    </div>
  );
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Stepper affiche les 5 étapes
- [ ] Navigation entre étapes fonctionne
- [ ] Recherche patient par IPP fonctionne
- [ ] Création nouveau patient fonctionne
- [ ] Enregistrement audio démarre/arrête
- [ ] Audio playback fonctionne
- [ ] Saisie manuelle accessible

### Techniques
- [ ] MediaRecorder API fonctionne sur Chrome/Firefox
- [ ] Store Zustand persiste entre les étapes
- [ ] Cleanup des ressources audio
- [ ] Pas de fuite mémoire

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 08 | TanStack Query pour recherche patients |
| 11 | Auth guards pour page protégée |
| 16-17 | API patients disponible |

### Bloque

| Task | Raison |
|------|--------|
| 20 | Transcription utilise l'audio enregistré |
| 21-23 | Suite du workflow |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Endpoints singuliers** : Utiliser `/patient` (singulier) et `/patient-by-ipp` pour la recherche
- **MediaRecorder** : Format `audio/webm;codecs=opus` pour meilleure compatibilité
- **Audio Blob** : Stocké temporairement dans le store Zustand, ne pas persister en localStorage
- **Création consultation** : `POST /consultation` sera appelé après validation (pas pendant le workflow)

### 💡 Suggestions

- Gérer l'erreur si l'IPP est déjà utilisé lors de la création patient (afficher toast)
- Ajouter une visualisation audio (waveform) pendant l'enregistrement

---

## 📡 Endpoints API utilisés (swagger)

### Patients (recherche/création)

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/patient-by-ipp` | GET | Rechercher un patient par IPP (`?ipp=...`) | ✅ Bearer |
| `/patient` | POST | Créer un nouveau patient | ✅ Bearer |

### Consultations (utilisés plus tard dans le workflow)

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/consultation` | POST | Créer une nouvelle consultation | ✅ Bearer |
| `/consultation/{consultation_id}` | GET | Récupérer une consultation | ✅ Bearer |
| `/consultation/{consultation_id}` | PATCH | Modifier une consultation | ✅ Bearer |
| `/consultation-update/{consultation_id}/transcription` | PATCH | Mettre à jour la transcription | ✅ Bearer |
| `/consultation-update/{consultation_id}/validate` | PATCH | Valider une consultation | ✅ Bearer |
| `/consultations` | GET | Liste des consultations | ✅ Bearer |
| `/consultations/recent` | GET | Consultations récentes | ✅ Bearer |
| `/consultations/today` | GET | Consultations du jour | ✅ Bearer |
| `/consultations/patient/{patient_id}` | GET | Consultations d'un patient | ✅ Bearer |

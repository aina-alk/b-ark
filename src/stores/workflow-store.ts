import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type WorkflowStep =
  | 'patient_selection'
  | 'recording'
  | 'transcription'
  | 'generation'
  | 'editing'
  | 'validation';

type ContextType = 'consultation' | 'intervention' | 'unknown';

interface WorkflowState {
  // State
  currentStep: WorkflowStep;
  contextDetected: ContextType;
  patientId: number | null;
  consultationId: number | null;
  interventionId: number | null;
  transcription: string;
  isRecording: boolean;
  isGenerating: boolean;

  // Actions
  setStep: (step: WorkflowStep) => void;
  setContext: (context: ContextType) => void;
  setPatient: (patientId: number | null) => void;
  setConsultation: (consultationId: number | null) => void;
  setIntervention: (interventionId: number | null) => void;
  setTranscription: (transcription: string) => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'patient_selection' as WorkflowStep,
  contextDetected: 'unknown' as ContextType,
  patientId: null,
  consultationId: null,
  interventionId: null,
  transcription: '',
  isRecording: false,
  isGenerating: false,
};

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      setContext: (context) => set({ contextDetected: context }),
      setPatient: (patientId) => set({ patientId }),
      setConsultation: (consultationId) => set({ consultationId }),
      setIntervention: (interventionId) => set({ interventionId }),
      setTranscription: (transcription) => set({ transcription }),
      setIsRecording: (isRecording) => set({ isRecording }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      reset: () => set(initialState),
    }),
    { name: 'workflow-store' }
  )
);

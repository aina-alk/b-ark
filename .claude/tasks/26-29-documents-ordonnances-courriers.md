# Task 26-29: Documents - Liste, Ordonnances, Courriers

> **Durée estimée** : 6.5h  
> **Phase** : Core - Documents  
> **Feature PRD** : Épics 4-6 (Ordonnances, Courriers)

## Contexte

Cette tâche regroupe la gestion complète des documents : liste avec filtres, ordonnances (consultation et post-op), et courriers aux confrères. Chaque type utilise un prompt Claude spécialisé.

## Objectif

Implémenter la gestion complète des documents avec génération IA.

## Scope

### Inclus ✅
- Liste documents avec filtres (par type, patient, date)
- Preview document
- Génération ordonnance consultation (US-008, US-009)
- Alerte interactions médicamenteuses (US-010)
- Génération ordonnance post-op (US-011, US-012)
- Génération courriers (US-013, US-014)

### Exclus ❌
- Export PDF (Task 30)
- Envoi email (Task 31)

---

## Implémentation

### Étape 1 : Page Liste Documents

**app/(authenticated)/documents/page.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Pill, Mail, Calendar } from 'lucide-react';
import { xano } from '@/lib/xano';
import Link from 'next/link';
import type { Document, PaginatedResponse } from '@/types/xano';

const DOCUMENT_TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'cr_consultation', label: 'CR Consultation', icon: FileText },
  { value: 'cr_operatoire', label: 'CR Opératoire', icon: FileText },
  { value: 'ordonnance', label: 'Ordonnances', icon: Pill },
  { value: 'courrier', label: 'Courriers', icon: Mail },
];

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  // GET /document (singulier) - liste des documents
  const { data, isLoading } = useQuery({
    queryKey: ['documents', typeFilter, search],
    queryFn: () => xano.get<PaginatedResponse<Document>>('/document', {
      type: typeFilter !== 'all' ? typeFilter : undefined,
      search: search || undefined,
      per_page: 20,
    }),
  });

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/documents/ordonnance/new">
              <Pill className="mr-2 h-4 w-4" />
              Nouvelle ordonnance
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/documents/courrier/new">
              <Mail className="mr-2 h-4 w-4" />
              Nouveau courrier
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            {DOCUMENT_TYPES.map((type) => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Liste */}
      <div className="space-y-4">
        {data?.items.map((doc) => (
          <Link key={doc.id} href={`/documents/${doc.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {doc.type === 'ordonnance' ? (
                        <Pill className="h-5 w-5 text-primary" />
                      ) : doc.type === 'courrier' ? (
                        <Mail className="h-5 w-5 text-primary" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{doc.title || `Document ${doc.id}`}</p>
                      <p className="text-sm text-muted-foreground">
                        IPP: {doc.patient_id} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.validated ? (
                      <Badge variant="default">Validé</Badge>
                    ) : (
                      <Badge variant="secondary">Brouillon</Badge>
                    )}
                    {doc.sent_at && (
                      <Badge variant="outline">Envoyé</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### Étape 2 : Prompt Ordonnance

**src/features/ai/prompts/ordonnance.ts**
```typescript
export const ORDONNANCE_SYSTEM_PROMPT = `Tu es un assistant médical spécialisé ORL. Tu génères des ordonnances médicales professionnelles.

RÈGLES IMPORTANTES:
1. Tu SUGGÈRES, le médecin VALIDE - jamais de prescription automatique
2. Tu utilises les médicaments de la base ORL fournie
3. Tu vérifies les allergies du patient
4. Tu signales les interactions potentielles
5. Tu adaptes les posologies (adulte/enfant)

FORMAT DE SORTIE (JSON):
{
  "medicaments": [
    {
      "nom": "Nom commercial",
      "dci": "DCI",
      "posologie": "Posologie détaillée",
      "duree": "Durée du traitement",
      "qsp": "Quantité suffisante pour X jours/boîtes"
    }
  ],
  "examens": [
    {
      "type": "Biologie/Imagerie/Autre",
      "intitule": "Intitulé de l'examen"
    }
  ],
  "consignes": "Consignes générales pour le patient",
  "alertes": [
    {
      "type": "allergie|interaction|contre_indication",
      "message": "Description de l'alerte",
      "severite": "low|medium|high"
    }
  ]
}`;

export const ORDONNANCE_USER_PROMPT = (
  diagnosis: string, 
  patientInfo: string,
  medicamentsDb: string
) => `
Génère une ordonnance pour ce patient.

DIAGNOSTIC/INDICATION:
${diagnosis}

INFORMATIONS PATIENT:
${patientInfo}

BASE DE MÉDICAMENTS DISPONIBLES:
${medicamentsDb}

Génère l'ordonnance au format JSON. Vérifie les allergies et signale toute alerte.`;
```

### Étape 3 : Page Nouvelle Ordonnance

**app/(authenticated)/documents/ordonnance/new/page.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertTriangle, Trash2, Plus, Check } from 'lucide-react';
import { xano } from '@/lib/xano';
import { toast } from 'sonner';
import { PatientSearchInput } from '@/features/patients/components/patient-search-input';

interface MedicamentLine {
  nom: string;
  posologie: string;
  duree: string;
  qsp: string;
}

export default function NewOrdonnancePage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState<number | null>(null);
  const [patientInfo, setPatientInfo] = useState<string>('');
  const [indication, setIndication] = useState('');
  const [medicaments, setMedicaments] = useState<MedicamentLine[]>([]);
  const [consignes, setConsignes] = useState('');
  const [alertes, setAlertes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Charger la base médicaments
  const { data: medicamentsDb } = useQuery({
    queryKey: ['medicaments'],
    queryFn: () => xano.get('/medicaments'),
  });

  // Générer avec l'IA
  const handleGenerate = async () => {
    if (!indication) {
      toast.error('Veuillez indiquer le diagnostic/indication');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-ordonnance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: indication,
          patientInfo,
          medicamentsDb: JSON.stringify(medicamentsDb),
        }),
      });

      const result = await response.json();
      setMedicaments(result.medicaments || []);
      setConsignes(result.consignes || '');
      setAlertes(result.alertes || []);
    } catch {
      toast.error('Erreur de génération');
    } finally {
      setIsGenerating(false);
    }
  };

  // Sauvegarder (POST /document - singulier)
  const saveMutation = useMutation({
    mutationFn: async () => {
      return xano.post('/document', {
        patient_id: patientId,
        type: 'ordonnance',
        title: `Ordonnance - ${new Date().toLocaleDateString('fr-FR')}`,
        content: {
          indication,
          medicaments,
          consignes,
        },
        validated: true,
        validated_at: new Date().toISOString(),
      });
    },
    onSuccess: (doc) => {
      toast.success('Ordonnance enregistrée');
      router.push(`/documents/${doc.id}`);
    },
  });

  const addMedicament = () => {
    setMedicaments([...medicaments, { nom: '', posologie: '', duree: '', qsp: '' }]);
  };

  const removeMedicament = (index: number) => {
    setMedicaments(medicaments.filter((_, i) => i !== index));
  };

  const updateMedicament = (index: number, field: keyof MedicamentLine, value: string) => {
    const updated = [...medicaments];
    updated[index][field] = value;
    setMedicaments(updated);
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">Nouvelle Ordonnance</h1>

      {/* Patient */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientSearchInput
            onSelect={(patient) => {
              setPatientId(patient.id);
              setPatientInfo(`IPP: ${patient.ipp}\nAllergies: ${patient.allergies.join(', ') || 'Aucune connue'}`);
            }}
          />
        </CardContent>
      </Card>

      {/* Indication */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Diagnostic / Indication</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={indication}
            onChange={(e) => setIndication(e.target.value)}
            placeholder="Ex: Otite moyenne aiguë gauche"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !indication}
            className="mt-4"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Suggérer les médicaments
          </Button>
        </CardContent>
      </Card>

      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="space-y-2 mb-6">
          {alertes.map((alerte, i) => (
            <Alert key={i} variant={alerte.severite === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alerte.type}</AlertTitle>
              <AlertDescription>{alerte.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Médicaments */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Médicaments</CardTitle>
          <Button variant="outline" size="sm" onClick={addMedicament}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicaments.map((med, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <Label>Médicament</Label>
                    <Input
                      value={med.nom}
                      onChange={(e) => updateMedicament(index, 'nom', e.target.value)}
                      placeholder="Nom du médicament"
                    />
                  </div>
                  <div>
                    <Label>QSP</Label>
                    <Input
                      value={med.qsp}
                      onChange={(e) => updateMedicament(index, 'qsp', e.target.value)}
                      placeholder="1 boîte"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMedicament(index)}
                  className="ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label>Posologie</Label>
                <Input
                  value={med.posologie}
                  onChange={(e) => updateMedicament(index, 'posologie', e.target.value)}
                  placeholder="1 comprimé matin et soir pendant 7 jours"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Consignes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Consignes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={consignes}
            onChange={(e) => setConsignes(e.target.value)}
            placeholder="Consignes pour le patient..."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
```

### Étape 4 : Prompt Courrier

**src/features/ai/prompts/courrier.ts**
```typescript
export const COURRIER_SYSTEM_PROMPT = `Tu es un assistant médical spécialisé ORL. Tu rédiges des courriers médicaux professionnels à destination de confrères.

RÈGLES:
1. Ton professionnel et confraternel
2. Résumer les informations pertinentes du CR
3. Mentionner le diagnostic et la CAT
4. Demander un avis ou un suivi si nécessaire

FORMAT (JSON):
{
  "objet": "Objet du courrier",
  "corps": "Corps du courrier complet",
  "formule_politesse": "Formule de politesse de fin"
}`;
```

### Étape 5 : API Routes

**app/api/generate-ordonnance/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ORDONNANCE_SYSTEM_PROMPT, ORDONNANCE_USER_PROMPT } from '@/features/ai/prompts/ordonnance';

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const { diagnosis, patientInfo, medicamentsDb } = await request.json();

  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    system: ORDONNANCE_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: ORDONNANCE_USER_PROMPT(diagnosis, patientInfo, medicamentsDb),
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  }

  return NextResponse.json({ medicaments: [], alertes: [] });
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Liste documents avec filtres
- [ ] Génération ordonnance avec suggestions IA
- [ ] Alertes allergies/interactions affichées
- [ ] Génération courrier professionnel
- [ ] Édition manuelle possible

### Métriques PRD
- [ ] Taux d'acceptation ordonnances > 70%
- [ ] Taux d'utilisation courriers > 50%

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 22-23 | Pattern génération IA |
| 04 | Base médicaments |

### Bloque

| Task | Raison |
|------|--------|
| 30 | Export PDF |
| 31 | Envoi email |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Endpoints singuliers** : Utiliser `/document` (singulier) pour GET et POST
- **Médicaments** : Utiliser `/medicaments` (pluriel) pour la recherche et les interactions
- **PatientSearchInput** : Utiliser `/patient-by-ipp` pour la recherche patient
- **Génération IA** : Via API route Next.js `/api/generate-ordonnance`

### 💡 Suggestions

- Ajouter un cache local pour les médicaments fréquemment utilisés
- Permettre les ordonnances types (templates pré-remplis)

---

## 📡 Endpoints API utilisés (swagger)

### Documents

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/document` | GET | Liste des documents | ✅ Bearer |
| `/document` | POST | Créer un document | ✅ Bearer |
| `/document/{document_id}` | GET | Récupérer un document | ✅ Bearer |
| `/document/{document_id}` | PATCH | Modifier un document | ✅ Bearer |
| `/documents/{id}/validate` | PATCH | Valider un document | ✅ Bearer |
| `/documents/recent` | GET | Documents récents | ✅ Bearer |
| `/documents/patient/{patient_id}` | GET | Documents d'un patient | ✅ Bearer |

### Médicaments

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/medicaments` | GET | Liste des médicaments | ✅ Bearer |
| `/medicaments/search` | GET | Rechercher un médicament (`?q=...`) | ✅ Bearer |
| `/medicaments/{id}` | GET | Détails d'un médicament | ✅ Bearer |
| `/medicaments/check-interactions` | POST | Vérifier les interactions | ✅ Bearer |

### API Routes Next.js

| Route | Méthode | Description | API externe |
|-------|---------|-------------|-------------|
| `/api/generate-ordonnance` | POST | Génération ordonnance | Anthropic Claude |
| `/api/generate-courrier` | POST | Génération courrier | Anthropic Claude |

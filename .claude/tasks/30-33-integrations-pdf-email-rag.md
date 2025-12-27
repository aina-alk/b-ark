# Task 30-33: Integrations - PDF, Email, RAG

> **Durée estimée** : 7h  
> **Phase** : Integrations  
> **Feature PRD** : Épic 9 - US-019, US-020 (Export Documents)

## Contexte

Ces tâches intègrent les services externes : génération PDF côté client avec react-pdf, envoi email via Resend, et amélioration du RAG pour les médicaments et protocoles.

## Objectif

Permettre l'export PDF des documents et l'envoi par email aux confrères.

---

## Task 30 : Export PDF (react-pdf) — 2h

### Installation

```bash
pnpm add @react-pdf/renderer
```

### Template PDF CR Consultation

**src/features/pdf/templates/cr-consultation-pdf.tsx**
```typescript
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Enregistrer une police
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2',
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 11,
    padding: 40,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #e5e5e5',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  text: {
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
  signature: {
    marginTop: 40,
    textAlign: 'right',
  },
});

interface CRConsultationPDFProps {
  data: {
    patientIpp: number;
    date: string;
    doctorName: string;
    doctorRpps?: string;
    content: {
      motif: string;
      examen_clinique: Record<string, string>;
      conclusion: string;
      cat: string;
    };
  };
}

export function CRConsultationPDF({ data }: CRConsultationPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Compte-Rendu de Consultation</Text>
          <Text style={styles.subtitle}>
            Patient IPP: {data.patientIpp} • Date: {new Date(data.date).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* Motif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motif de consultation</Text>
          <Text style={styles.text}>{data.content.motif}</Text>
        </View>

        {/* Examen clinique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Examen clinique</Text>
          {Object.entries(data.content.examen_clinique).map(([key, value]) => (
            <Text key={key} style={styles.text}>
              <Text style={{ fontWeight: 'bold' }}>{key}: </Text>
              {value}
            </Text>
          ))}
        </View>

        {/* Conclusion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conclusion</Text>
          <Text style={styles.text}>{data.content.conclusion}</Text>
        </View>

        {/* CAT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conduite à tenir</Text>
          <Text style={styles.text}>{data.content.cat}</Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <Text>{data.doctorName}</Text>
          {data.doctorRpps && <Text style={{ fontSize: 9 }}>RPPS: {data.doctorRpps}</Text>}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré par ORL Consultation Intelligente • Validé par {data.doctorName}
        </Text>
      </Page>
    </Document>
  );
}
```

### Composant Export Button

**src/features/pdf/components/export-pdf-button.tsx**
```typescript
'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { CRConsultationPDF } from '../templates/cr-consultation-pdf';
import { OrdonnancePDF } from '../templates/ordonnance-pdf';

interface ExportPDFButtonProps {
  type: 'cr_consultation' | 'cr_operatoire' | 'ordonnance' | 'courrier';
  data: any;
  filename: string;
}

export function ExportPDFButton({ type, data, filename }: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);

    try {
      let doc;
      switch (type) {
        case 'cr_consultation':
          doc = <CRConsultationPDF data={data} />;
          break;
        case 'ordonnance':
          doc = <OrdonnancePDF data={data} />;
          break;
        // Ajouter autres types...
        default:
          doc = <CRConsultationPDF data={data} />;
      }

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      
      // Télécharger
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isGenerating}>
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Télécharger PDF
    </Button>
  );
}
```

---

## Task 31 : Envoi Email (Resend) — 1.5h

### Installation

```bash
pnpm add resend
```

### API Route Email

**app/api/send-email/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, documentType, documentContent, pdfBase64, senderName } = await request.json();

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Document médical</h2>
          <p>Cher confrère,</p>
          <p>Veuillez trouver ci-joint ${documentType === 'courrier' ? 'un courrier' : 'un document'} concernant notre patient commun.</p>
          <p>Bien confraternellement,</p>
          <p><strong>${senderName}</strong></p>
          <hr style="margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">
            Ce message a été envoyé via ORL Consultation Intelligente.
          </p>
        </div>
      `,
      attachments: pdfBase64 ? [
        {
          filename: `${documentType}-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBase64,
        },
      ] : [],
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    return NextResponse.json({ error: 'Email sending failed' }, { status: 500 });
  }
}
```

### Composant Send Email

**src/features/email/components/send-email-dialog.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { useAuth } from '@/features/auth/context/auth-context';

interface SendEmailDialogProps {
  documentType: string;
  documentData: any;
  PdfComponent: React.ComponentType<{ data: any }>;
}

export function SendEmailDialog({ documentType, documentData, PdfComponent }: SendEmailDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(`${documentType} - Patient IPP ${documentData.patientIpp}`);

  const sendMutation = useMutation({
    mutationFn: async () => {
      // Générer le PDF en base64
      const blob = await pdf(<PdfComponent data={documentData} />).toBlob();
      const buffer = await blob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject,
          documentType,
          pdfBase64: base64,
          senderName: user?.name,
        }),
      });

      if (!response.ok) throw new Error('Envoi échoué');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Email envoyé avec succès');
      setOpen(false);
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="mr-2 h-4 w-4" />
          Envoyer par email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Envoyer le document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="email">Email du destinataire</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dr.confrere@email.fr"
            />
          </div>
          <div>
            <Label htmlFor="subject">Objet</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={() => sendMutation.mutate()} 
            disabled={!email || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Task 32-33 : RAG Médicaments & Protocoles — 3.5h

### Endpoint Recherche Médicaments Avancée

**app/api/search-medicaments/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { xano } from '@/lib/xano';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || '';
  const classe = request.nextUrl.searchParams.get('classe');

  // Recherche dans Xano
  const results = await xano.get('/medicaments/search', {
    q: query,
    classe,
  });

  return NextResponse.json(results);
}
```

### Vérification Interactions

**app/api/check-interactions/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { xano } from '@/lib/xano';

export async function POST(request: NextRequest) {
  const { medicamentIds, patientAllergies } = await request.json();

  // Récupérer les médicaments sélectionnés
  const medicaments = await Promise.all(
    medicamentIds.map((id: number) => xano.get(`/medicaments/${id}`))
  );

  const alertes: any[] = [];

  // Vérifier allergies
  for (const med of medicaments) {
    for (const allergie of patientAllergies) {
      if (med.contre_indications.some((ci: string) => 
        ci.toLowerCase().includes(allergie.toLowerCase())
      )) {
        alertes.push({
          type: 'allergie',
          medicament: med.nom,
          message: `Allergie connue: ${allergie}`,
          severite: 'high',
        });
      }
    }
  }

  // Vérifier interactions entre médicaments
  for (let i = 0; i < medicaments.length; i++) {
    for (let j = i + 1; j < medicaments.length; j++) {
      const med1 = medicaments[i];
      const med2 = medicaments[j];

      // Vérifier si med1 interagit avec med2
      if (med1.interactions.some((inter: string) =>
        med2.dci.toLowerCase().includes(inter.toLowerCase()) ||
        med2.nom.toLowerCase().includes(inter.toLowerCase())
      )) {
        alertes.push({
          type: 'interaction',
          medicament1: med1.nom,
          medicament2: med2.nom,
          message: `Interaction potentielle entre ${med1.nom} et ${med2.nom}`,
          severite: 'medium',
        });
      }
    }
  }

  return NextResponse.json({
    alertes,
    safe: alertes.filter(a => a.severite === 'high').length === 0,
  });
}
```

### Composant Recherche Médicaments

**src/features/medicaments/components/medicament-search.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Pill, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MedicamentSearchProps {
  onSelect: (medicament: any) => void;
  selectedIds?: number[];
}

export function MedicamentSearch({ onSelect, selectedIds = [] }: MedicamentSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: results } = useQuery({
    queryKey: ['medicaments-search', search],
    queryFn: async () => {
      const res = await fetch(`/api/search-medicaments?q=${search}`);
      return res.json();
    },
    enabled: search.length >= 2,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un médicament..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>Aucun médicament trouvé</CommandEmpty>
            <CommandGroup heading="Médicaments">
              {results?.map((med: any) => (
                <CommandItem
                  key={med.id}
                  onSelect={() => {
                    onSelect(med);
                    setOpen(false);
                    setSearch('');
                  }}
                  disabled={selectedIds.includes(med.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{med.nom}</p>
                      <p className="text-xs text-muted-foreground">{med.dci}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {med.classe}
                    </Badge>
                    {!selectedIds.includes(med.id) && (
                      <Plus className="h-4 w-4" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

---

## Critères de succès

### Task 30 - PDF
- [ ] PDF générés côté client
- [ ] Templates professionnels
- [ ] Téléchargement fonctionnel

### Task 31 - Email
- [ ] Envoi via Resend
- [ ] PDF en pièce jointe
- [ ] Confirmation envoi

### Task 32-33 - RAG
- [ ] Recherche médicaments rapide
- [ ] Détection allergies
- [ ] Alertes interactions

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 26-29 | Documents à exporter |
| 04 | Base médicaments |

### Bloque

| Task | Raison |
|------|--------|
| 41 | Deployment avec toutes les features |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **PDF** : Généré côté client avec `@react-pdf/renderer`, pas d'API Xano
- **Email** : Via API route Next.js `/api/send-email` qui utilise Resend
- **Médicaments** : Utiliser les endpoints Xano `/medicaments/*`

### 💡 Suggestions

- Ajouter un cache pour les templates PDF
- Permettre la prévisualisation avant envoi email

---

## 📡 Endpoints API utilisés (swagger)

### Médicaments (Xano)

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/medicaments` | GET | Liste des médicaments | ✅ Bearer |
| `/medicaments/search` | GET | Rechercher (`?q=...`) | ✅ Bearer |
| `/medicaments/{id}` | GET | Détails d'un médicament | ✅ Bearer |
| `/medicaments/check-interactions` | POST | Vérifier interactions | ✅ Bearer |

### API Routes Next.js

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/send-email` | POST | Envoi email via Resend |
| `/api/search-medicaments` | GET | Proxy recherche médicaments |
| `/api/check-interactions` | POST | Proxy vérification interactions |

### Variables d'environnement requises

```env
RESEND_API_KEY="re_..."
EMAIL_FROM="ORL Consult <noreply@orlconsult.fr>"
```

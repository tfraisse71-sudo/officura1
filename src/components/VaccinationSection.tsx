import { useState } from "react";
import { Syringe, Calendar, AlertCircle, CheckCircle2, XCircle, Loader2, Info, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VaccineOverdue {
  name: string;
  dueAge: string;
  note: string;
  canCatchUp?: boolean;
  catchUpInfo?: string;
}

interface VaccineUpcoming {
  name: string;
  nextAge: string;
  note: string;
}

interface VaccineNotCatchable {
  name: string;
  reason: string;
}

interface VaccineAnalysis {
  enRetard: VaccineOverdue[];
  aVenir: VaccineUpcoming[];
  nonRattrapables: VaccineNotCatchable[];
  recommandations: string[];
}

export const VaccinationSection = () => {
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completedVaccines, setCompletedVaccines] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<VaccineAnalysis | null>(null);

  // Liste complète des vaccins selon le calendrier vaccinal français 2024-2025
  const vaccines = [
    // Vaccins obligatoires du nourrisson
    { id: "dtcp", label: "DTCP (Diphtérie-Tétanos-Coqueluche-Polio)", category: "Obligatoire" },
    { id: "hepatiteB", label: "Hépatite B", category: "Obligatoire" },
    { id: "pneumocoque", label: "Pneumocoque (Prevenar)", category: "Obligatoire" },
    { id: "meningocoqueC", label: "Méningocoque C", category: "Obligatoire" },
    { id: "ror", label: "ROR (Rougeole-Oreillons-Rubéole)", category: "Obligatoire" },
    
    // Vaccins recommandés
    { id: "meningocoqueB", label: "Méningocoque B (Bexsero)", category: "Recommandé" },
    { id: "meningocoqueACWY", label: "Méningocoque ACWY", category: "Recommandé" },
    { id: "hpv", label: "HPV (Papillomavirus)", category: "Recommandé" },
    { id: "varicelle", label: "Varicelle", category: "Recommandé" },
    { id: "bcg", label: "BCG (Tuberculose)", category: "Recommandé" },
    { id: "hepatiteA", label: "Hépatite A", category: "Recommandé" },
    
    // Vaccins pour adultes/seniors
    { id: "grippe", label: "Grippe (annuel)", category: "Adulte/Senior" },
    { id: "zona", label: "Zona (Shingrix)", category: "Adulte/Senior" },
    { id: "pneumocoqueAdulte", label: "Pneumocoque adulte (Prevenar 20)", category: "Adulte/Senior" },
    { id: "covid", label: "COVID-19", category: "Adulte/Senior" },
    { id: "vrs", label: "VRS (Virus Respiratoire Syncytial)", category: "Adulte/Senior" },
  ];

  const handleCalculate = async () => {
    if (!age) {
      toast.error("Veuillez entrer un âge");
      return;
    }

    setIsLoading(true);
    setShowResults(false);
    setAnalysis(null);

    try {
      const completedLabels = vaccines
        .filter(v => completedVaccines.includes(v.id))
        .map(v => v.label);

      const { data, error } = await supabase.functions.invoke('analyze-vaccines', {
        body: { 
          age: parseInt(age), 
          completedVaccines: completedLabels,
          sex 
        }
      });

      if (error) {
        console.error('Error analyzing vaccines:', error);
        toast.error("Erreur lors de l'analyse");
        return;
      }

      if (data?.success && data?.data) {
        setAnalysis(data.data);
        setShowResults(true);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVaccineToggle = (vaccineId: string) => {
    setCompletedVaccines(prev => 
      prev.includes(vaccineId) 
        ? prev.filter(id => id !== vaccineId)
        : [...prev, vaccineId]
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 border-primary/20 shadow-md">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="age-input" className="block text-xs sm:text-sm font-medium mb-2">
                Âge (années)
              </label>
              <Input
                id="age-input"
                type="number"
                min="0"
                max="120"
                placeholder="Ex : 35"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">
                Sexe (optionnel)
              </label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="homme">Homme</SelectItem>
                  <SelectItem value="femme">Femme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-medium mb-3">Vaccins déjà réalisés (optionnel)</p>
            
            {/* Vaccins obligatoires */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Vaccins obligatoires (nourrisson)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {vaccines.filter(v => v.category === "Obligatoire").map((vaccine) => (
                  <div key={vaccine.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={vaccine.id}
                      checked={completedVaccines.includes(vaccine.id)}
                      onCheckedChange={() => handleVaccineToggle(vaccine.id)}
                    />
                    <label
                      htmlFor={vaccine.id}
                      className="text-xs sm:text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {vaccine.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Vaccins recommandés */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Vaccins recommandés</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {vaccines.filter(v => v.category === "Recommandé").map((vaccine) => (
                  <div key={vaccine.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={vaccine.id}
                      checked={completedVaccines.includes(vaccine.id)}
                      onCheckedChange={() => handleVaccineToggle(vaccine.id)}
                    />
                    <label
                      htmlFor={vaccine.id}
                      className="text-xs sm:text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {vaccine.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Vaccins adultes/seniors */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Vaccins adultes / seniors</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {vaccines.filter(v => v.category === "Adulte/Senior").map((vaccine) => (
                  <div key={vaccine.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={vaccine.id}
                      checked={completedVaccines.includes(vaccine.id)}
                      onCheckedChange={() => handleVaccineToggle(vaccine.id)}
                    />
                    <label
                      htmlFor={vaccine.id}
                      className="text-xs sm:text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {vaccine.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleCalculate} className="w-full sm:w-auto gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {isLoading ? "Analyse en cours..." : "Analyser"}
          </Button>
        </div>
      </Card>

      {isLoading && (
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Analyse de la situation vaccinale...
            </p>
          </div>
        </Card>
      )}

      {showResults && analysis && (
        <>
          {/* Vaccins en retard rattrapables */}
          {analysis.enRetard && analysis.enRetard.length > 0 && (
            <Card className="p-4 sm:p-6 shadow-md border-warning/30">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                  <h3 className="text-base sm:text-lg font-semibold">Vaccins en retard (rattrapables)</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {analysis.enRetard.map((vaccine, idx) => (
                    <div key={idx} className="p-3 bg-warning/5 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{vaccine.name}</p>
                          <p className="text-xs text-muted-foreground">Prévu à {vaccine.dueAge}</p>
                          {vaccine.note && (
                            <p className="text-xs text-muted-foreground mt-1">{vaccine.note}</p>
                          )}
                          {vaccine.catchUpInfo && (
                            <p className="text-xs text-primary mt-1">💉 {vaccine.catchUpInfo}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="border-warning text-warning text-[10px] sm:text-xs w-fit">
                          À rattraper
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Vaccins non rattrapables */}
          {analysis.nonRattrapables && analysis.nonRattrapables.length > 0 && (
            <Card className="p-4 sm:p-6 shadow-md border-muted">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <h3 className="text-base sm:text-lg font-semibold">Vaccins non rattrapables</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {analysis.nonRattrapables.map((vaccine, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{vaccine.name}</p>
                          <p className="text-xs text-muted-foreground">{vaccine.reason}</p>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground text-[10px] sm:text-xs w-fit">
                          Trop tard
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Vaccins à venir */}
          {analysis.aVenir && analysis.aVenir.length > 0 && (
            <Card className="p-4 sm:p-6 shadow-md border-success/30">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  <h3 className="text-base sm:text-lg font-semibold">Vaccins à venir</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {analysis.aVenir.map((vaccine, idx) => (
                    <div key={idx} className="p-3 bg-success/5 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{vaccine.name}</p>
                          <p className="text-xs text-muted-foreground">Prévu à {vaccine.nextAge}</p>
                          {vaccine.note && (
                            <p className="text-xs text-muted-foreground mt-1">{vaccine.note}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="border-success text-success text-[10px] sm:text-xs w-fit">
                          À prévoir
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Recommandations personnalisées */}
          {analysis.recommandations && analysis.recommandations.length > 0 && (
            <Card className="p-4 sm:p-6 shadow-md border-primary/30">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-base sm:text-lg font-semibold">Recommandations personnalisées</h3>
                </div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {analysis.recommandations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="p-3 sm:p-4 bg-muted/30 border-muted">
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Cette analyse est basée sur le calendrier vaccinal français officiel. 
                Consultez votre médecin ou pharmacien pour un avis personnalisé.
              </p>
            </div>
          </Card>

          {/* Sources */}
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Source : Calendrier vaccinal officiel - Santé publique France • Dernière MAJ : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </>
      )}

      {!showResults && !isLoading && (
        <Card className="p-6 sm:p-8 text-center border-muted">
          <Syringe className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Entrez votre âge et vos vaccins déjà réalisés pour obtenir une analyse personnalisée.
          </p>
        </Card>
      )}
    </div>
  );
};

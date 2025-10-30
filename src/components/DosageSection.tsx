import { useState, useMemo, useEffect } from "react";
import { Search, Info, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMedicationData } from "@/hooks/useMedicationData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const DosageSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMed, setSelectedMed] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dosageData, setDosageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const medications = useMedicationData();

  const suggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return medications
      .filter(med => 
        med.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(term)
      )
      .slice(0, 10);
  }, [searchTerm, medications]);

  useEffect(() => {
    const fetchDosageInfo = async () => {
      if (!selectedMed) {
        setDosageData([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('medication-dosage', {
          body: { medicationName: selectedMed }
        });

        if (error) throw error;

        setDosageData(data?.dosages || []);
      } catch (error: any) {
        console.error('Error fetching dosage info:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les posologies. Veuillez réessayer.",
          variant: "destructive",
        });
        setDosageData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDosageInfo();
  }, [selectedMed, toast]);

  const handleSelectMed = (med: string) => {
    setSelectedMed(med);
    setSearchTerm(med);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-primary/20 shadow-md">
        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="med-dosage" className="block text-sm font-medium mb-2">
              Rechercher un médicament
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="med-dosage"
                type="text"
                placeholder="Ex : paracétamol, amoxicilline..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedMed(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto">
                {suggestions.map((med, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectMed(med)}
                    className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors text-sm"
                  >
                    {med}
                  </button>
                ))}
              </Card>
            )}
          </div>
        </div>
      </Card>

      {selectedMed && (
        <Card className="p-6 shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                Posologies : {selectedMed}
              </h3>
              <Badge variant="outline">Source : RCP ANSM</Badge>
            </div>
            
            {loading && (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Recherche des posologies officielles...</p>
              </Card>
            )}

            {!loading && dosageData.length === 0 && (
              <Card className="p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Les données de posologie pour ce médicament ne sont pas encore disponibles.
                </p>
              </Card>
            )}

            {!loading && dosageData.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Âge</TableHead>
                    <TableHead>Poids</TableHead>
                    <TableHead>Voie</TableHead>
                    <TableHead>Dose/prise</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead>Max/prise</TableHead>
                    <TableHead>Max/24h</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dosageData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.age}</TableCell>
                      <TableCell>{row.poids}</TableCell>
                      <TableCell>{row.voie}</TableCell>
                      <TableCell>{row.dosePrise}</TableCell>
                      <TableCell>{row.frequence}</TableCell>
                      <TableCell>{row.doseMaxPrise}</TableCell>
                      <TableCell className="font-medium">{row.doseMax24h}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}

            <Card className="p-4 bg-warning/10 border-warning/30">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Ces posologies sont issues des RCP ANSM. Elles doivent être adaptées au contexte clinique individuel.
                  Consulter un professionnel de santé en cas de doute.
                </p>
              </div>
            </Card>
          </div>
        </Card>
      )}

      {!selectedMed && (
        <Card className="p-8 text-center border-muted">
          <p className="text-muted-foreground">
            Recherchez un médicament pour afficher les posologies recommandées.
          </p>
        </Card>
      )}
    </div>
  );
};

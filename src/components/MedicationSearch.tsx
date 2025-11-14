import { useState, useMemo } from "react";
import { Search, AlertCircle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMedicationData } from "@/hooks/useMedicationData";
import { MedicationResults } from "./MedicationResults";

export const MedicationSearch = () => {
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [selectedMode, setSelectedMode] = useState("indications");
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);
  const [selectedMed1, setSelectedMed1] = useState<string | null>(null);
  const [selectedMed2, setSelectedMed2] = useState<string | null>(null);

  const medications = useMedicationData();

  const suggestions1 = useMemo(() => {
    if (searchTerm1.length < 2) return [];
    const term = searchTerm1.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return medications
      .filter(med => 
        med.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(term)
      )
      .slice(0, 10);
  }, [searchTerm1, medications]);

  const suggestions2 = useMemo(() => {
    if (searchTerm2.length < 2) return [];
    const term = searchTerm2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return medications
      .filter(med => 
        med.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(term)
      )
      .slice(0, 10);
  }, [searchTerm2, medications]);

  const handleSelectMed1 = (med: string) => {
    setSelectedMed1(med);
    setSearchTerm1(med);
    setShowSuggestions1(false);
  };

  const handleSelectMed2 = (med: string) => {
    setSelectedMed2(med);
    setSearchTerm2(med);
    setShowSuggestions2(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-primary/20 shadow-md">
        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="med1" className="block text-sm font-medium mb-2">
              Médicament ou DCI
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="med1"
                type="text"
                placeholder="Ex : paracétamol, Doliprane..."
                value={searchTerm1}
                onChange={(e) => {
                  setSearchTerm1(e.target.value);
                  setSelectedMed1(null);
                  setShowSuggestions1(true);
                }}
                onFocus={() => setShowSuggestions1(true)}
                className="pl-10"
              />
            </div>
            {showSuggestions1 && suggestions1.length > 0 && (
              <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto">
                {suggestions1.map((med, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectMed1(med)}
                    className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors text-sm"
                  >
                    {med}
                  </button>
                ))}
              </Card>
            )}
          </div>

          <Tabs value={selectedMode} onValueChange={setSelectedMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 gap-2 h-auto">
              <TabsTrigger value="indications">Indications</TabsTrigger>
              <TabsTrigger value="contre-indications">Contre-indications</TabsTrigger>
              <TabsTrigger value="conseils-prise">Conseils de prise</TabsTrigger>
              <TabsTrigger value="grossesse">Grossesse</TabsTrigger>
              <TabsTrigger value="allaitement">Allaitement</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
            </TabsList>
          </Tabs>

          {selectedMode === "interactions" && (
            <div className="relative">
              <label htmlFor="med2" className="block text-sm font-medium mb-2">
                Deuxième médicament
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="med2"
                  type="text"
                  placeholder="Ex : warfarine, aspirine..."
                  value={searchTerm2}
                  onChange={(e) => {
                    setSearchTerm2(e.target.value);
                    setSelectedMed2(null);
                    setShowSuggestions2(true);
                  }}
                  onFocus={() => setShowSuggestions2(true)}
                  className="pl-10"
                />
              </div>
              {showSuggestions2 && suggestions2.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto">
                  {suggestions2.map((med, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectMed2(med)}
                      className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors text-sm"
                    >
                      {med}
                    </button>
                  ))}
                </Card>
              )}
            </div>
          )}
        </div>
      </Card>

      {selectedMed1 && (
        <MedicationResults
          medication1={selectedMed1}
          medication2={selectedMode === "interactions" ? selectedMed2 : null}
          mode={selectedMode}
        />
      )}

      <Card className="p-4 bg-muted/30 border-muted">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Informations officielles</p>
            <p>
              Les informations affichées proviennent des sources officielles françaises (ANSM, CRAT, HAS).
              Elles ne remplacent pas l'avis d'un professionnel de santé.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

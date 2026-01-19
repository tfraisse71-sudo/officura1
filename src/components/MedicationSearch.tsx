import { useState, useMemo, useEffect, useRef } from "react";
import { Search, AlertCircle, Info, Leaf, Pill } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMedicationData } from "@/hooks/useMedicationData";
import { MedicationResults } from "./MedicationResults";
import { EquivalenceResults } from "./EquivalenceResults";
import { supabase } from "@/integrations/supabase/client";

// Liste des plantes médicinales courantes pour l'autocomplétion
const COMMON_PLANTS = [
  "Millepertuis",
  "Ginkgo biloba",
  "Valériane",
  "Échinacée",
  "Ginseng",
  "Curcuma",
  "Ail",
  "Réglisse",
  "Sauge",
  "Passiflore",
  "Aubépine",
  "Mélisse",
  "Griffonia",
  "Rhodiola",
  "Ashwagandha",
  "Chardon-marie",
  "Artichaut",
  "Boldo",
  "Pissenlit",
  "Fenouil",
  "Camomille",
  "Thé vert",
  "Guarana",
  "Maté",
  "Kava",
  "Harpagophytum",
  "Cassis",
  "Ortie",
  "Prêle",
  "Reine-des-prés",
  "Saule blanc",
  "Canneberge",
  "Pamplemousse",
  "Cranberry",
  "Lavande",
  "Romarin",
  "Thym",
  "Eucalyptus",
  "Plantain",
  "Sureau",
  "Propolis",
  "Gelée royale",
];

export const MedicationSearch = () => {
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [selectedMode, setSelectedMode] = useState("indications-conseils");
  const [interactionType, setInteractionType] = useState<"medication" | "phytotherapy">("medication");
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);
  const [selectedMed1, setSelectedMed1] = useState<string | null>(null);
  const [selectedMed2, setSelectedMed2] = useState<string | null>(null);
  const [aiSuggestions1, setAiSuggestions1] = useState<string[]>([]);
  const [aiSuggestions2, setAiSuggestions2] = useState<string[]>([]);
  const [isLoadingAi1, setIsLoadingAi1] = useState(false);
  const [isLoadingAi2, setIsLoadingAi2] = useState(false);
  const [highlightedIndex1, setHighlightedIndex1] = useState(-1);
  const [highlightedIndex2, setHighlightedIndex2] = useState(-1);
  
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  const medications = useMedicationData();

  const suggestions1 = useMemo(() => {
    if (searchTerm1.length < 2) return [];
    const term = searchTerm1.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const localResults = medications
      .filter(med => 
        med.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(term)
      )
      .slice(0, 10);
    
    // Combine local results with AI suggestions
    const combined = [...localResults, ...aiSuggestions1.filter(ai => !localResults.includes(ai))];
    return combined.slice(0, 10);
  }, [searchTerm1, medications, aiSuggestions1]);

  // Suggestions for second input (medications or plants depending on mode)
  const suggestions2 = useMemo(() => {
    if (searchTerm2.length < 2) return [];
    const term = searchTerm2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (interactionType === "phytotherapy") {
      // Filter plant suggestions
      return COMMON_PLANTS
        .filter(plant => 
          plant.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(term)
        )
        .slice(0, 10);
    }
    
    const localResults = medications
      .filter(med => 
        med.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(term)
      )
      .slice(0, 10);
    
    const combined = [...localResults, ...aiSuggestions2.filter(ai => !localResults.includes(ai))];
    return combined.slice(0, 10);
  }, [searchTerm2, medications, aiSuggestions2, interactionType]);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex1(-1);
  }, [suggestions1]);

  useEffect(() => {
    setHighlightedIndex2(-1);
  }, [suggestions2]);

  // Fetch AI suggestions when local results are insufficient
  useEffect(() => {
    const fetchAiSuggestions = async () => {
      if (searchTerm1.length < 2) {
        setAiSuggestions1([]);
        return;
      }
      
      const term = searchTerm1.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const localResults = medications.filter(med => 
        med.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(term)
      );
      
      // Only call AI if we have less than 5 local results
      if (localResults.length < 5) {
        setIsLoadingAi1(true);
        try {
          const { data, error } = await supabase.functions.invoke('search-medications', {
            body: { searchTerm: searchTerm1.slice(0, 2) }
          });
          
          if (!error && data?.medications) {
            setAiSuggestions1(data.medications);
          }
        } catch (error) {
          console.error('Error fetching AI suggestions:', error);
        } finally {
          setIsLoadingAi1(false);
        }
      } else {
        setAiSuggestions1([]);
      }
    };

    const timeoutId = setTimeout(fetchAiSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm1, medications]);

  useEffect(() => {
    const fetchAiSuggestions = async () => {
      if (searchTerm2.length < 2) {
        setAiSuggestions2([]);
        return;
      }
      
      const term = searchTerm2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const localResults = medications.filter(med => 
        med.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(term)
      );
      
      // Only call AI if we have less than 5 local results
      if (localResults.length < 5) {
        setIsLoadingAi2(true);
        try {
          const { data, error } = await supabase.functions.invoke('search-medications', {
            body: { searchTerm: searchTerm2.slice(0, 2) }
          });
          
          if (!error && data?.medications) {
            setAiSuggestions2(data.medications);
          }
        } catch (error) {
          console.error('Error fetching AI suggestions:', error);
        } finally {
          setIsLoadingAi2(false);
        }
      } else {
        setAiSuggestions2([]);
      }
    };

    const timeoutId = setTimeout(fetchAiSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm2, medications]);

  const handleSelectMed1 = (med: string) => {
    setSelectedMed1(med);
    setSearchTerm1(med);
    setShowSuggestions1(false);
    setHighlightedIndex1(-1);
  };

  const handleSelectMed2 = (med: string) => {
    setSelectedMed2(med);
    setSearchTerm2(med);
    setShowSuggestions2(false);
    setHighlightedIndex2(-1);
  };

  const handleKeyDown1 = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions1 || suggestions1.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex1(prev => (prev < suggestions1.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex1(prev => (prev > 0 ? prev - 1 : suggestions1.length - 1));
    } else if (e.key === "Enter" && highlightedIndex1 >= 0) {
      e.preventDefault();
      handleSelectMed1(suggestions1[highlightedIndex1]);
    } else if (e.key === "Escape") {
      setShowSuggestions1(false);
      setHighlightedIndex1(-1);
    }
  };

  const handleKeyDown2 = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions2 || suggestions2.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex2(prev => (prev < suggestions2.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex2(prev => (prev > 0 ? prev - 1 : suggestions2.length - 1));
    } else if (e.key === "Enter" && highlightedIndex2 >= 0) {
      e.preventDefault();
      handleSelectMed2(suggestions2[highlightedIndex2]);
    } else if (e.key === "Escape") {
      setShowSuggestions2(false);
      setHighlightedIndex2(-1);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-3 sm:p-4 md:p-6 border-border/50 shadow-lg bg-card/80 backdrop-blur-sm relative z-20">
        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <label htmlFor="med1" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
              Médicament ou DCI
            </label>
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                ref={input1Ref}
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
                onClick={handleInputClick}
                onKeyDown={handleKeyDown1}
                className="pl-8 sm:pl-10 text-sm"
              />
            </div>
            {showSuggestions1 && suggestions1.length > 0 && (
              <Card className="absolute z-[100] w-full mt-1 max-h-60 overflow-auto border-border/50 bg-card shadow-lg">
                {suggestions1.map((med, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectMed1(med)}
                    className={`w-full text-left px-3 sm:px-4 py-2.5 hover:bg-primary/20 hover:text-primary transition-all duration-200 text-xs sm:text-sm border-b border-border/30 last:border-0 ${
                      idx === highlightedIndex1 ? "bg-primary/20 text-primary" : ""
                    }`}
                  >
                    {med}
                  </button>
                ))}
              </Card>
            )}
          </div>

          <Tabs value={selectedMode} onValueChange={(value) => {
            setSelectedMode(value);
            // Reset search term 2 when changing mode
            if (value !== "interactions") {
              setSearchTerm2("");
              setSelectedMed2(null);
            }
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-1.5 h-auto p-1 bg-secondary/50 backdrop-blur-sm rounded-lg">
              <TabsTrigger value="indications-conseils" className="text-[10px] sm:text-xs py-2 sm:py-2.5 px-1 sm:px-3 rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all duration-200">Indications</TabsTrigger>
              <TabsTrigger value="contre-indications" className="text-[10px] sm:text-xs py-2 sm:py-2.5 px-1 sm:px-3 rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all duration-200">Contre-ind.</TabsTrigger>
              <TabsTrigger value="grossesse" className="text-[10px] sm:text-xs py-2 sm:py-2.5 px-1 sm:px-3 rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all duration-200">Grossesse</TabsTrigger>
              <TabsTrigger value="allaitement" className="text-[10px] sm:text-xs py-2 sm:py-2.5 px-1 sm:px-3 rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all duration-200">Allaitement</TabsTrigger>
              <TabsTrigger value="interactions" className="text-[10px] sm:text-xs py-2 sm:py-2.5 px-1 sm:px-3 rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all duration-200">Interactions</TabsTrigger>
              <TabsTrigger value="equivalence" className="text-[10px] sm:text-xs py-2 sm:py-2.5 px-1 sm:px-3 rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all duration-200">Équivalence</TabsTrigger>
            </TabsList>
          </Tabs>

          {selectedMode === "interactions" && (
            <div className="space-y-3">
              {/* Toggle between medication and phytotherapy */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setInteractionType("medication");
                    setSearchTerm2("");
                    setSelectedMed2(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border transition-all duration-200 text-xs sm:text-sm ${
                    interactionType === "medication"
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Pill className="h-4 w-4" />
                  <span>Médicament</span>
                </button>
                <button
                  onClick={() => {
                    setInteractionType("phytotherapy");
                    setSearchTerm2("");
                    setSelectedMed2(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border transition-all duration-200 text-xs sm:text-sm ${
                    interactionType === "phytotherapy"
                      ? "bg-green-500/20 border-green-500 text-green-400"
                      : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Leaf className="h-4 w-4" />
                  <span>Phytothérapie</span>
                </button>
              </div>

              {/* Second input field */}
              <div className="relative">
                <label htmlFor="med2" className="block text-xs sm:text-sm font-medium mb-2">
                  {interactionType === "medication" ? "Deuxième médicament" : "Plante / Phytothérapie"}
                </label>
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    ref={input2Ref}
                    id="med2"
                    type="text"
                    placeholder={interactionType === "medication" 
                      ? "Ex : warfarine, aspirine..." 
                      : "Ex : millepertuis, ginkgo, valériane..."
                    }
                    value={searchTerm2}
                    onChange={(e) => {
                      setSearchTerm2(e.target.value);
                      setSelectedMed2(null);
                      if (interactionType === "medication") {
                        setShowSuggestions2(true);
                      }
                    }}
                    onFocus={() => {
                      if (interactionType === "medication") {
                        setShowSuggestions2(true);
                      }
                    }}
                    onClick={handleInputClick}
                    onKeyDown={interactionType === "medication" ? handleKeyDown2 : undefined}
                    className="pl-8 sm:pl-10 text-sm"
                  />
                </div>
                {interactionType === "medication" && showSuggestions2 && suggestions2.length > 0 && (
                  <Card className="absolute z-[100] w-full mt-1 max-h-60 overflow-auto border-border/50 bg-card shadow-lg">
                    {suggestions2.map((med, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectMed2(med)}
                        className={`w-full text-left px-3 sm:px-4 py-2.5 hover:bg-primary/20 hover:text-primary transition-all duration-200 text-xs sm:text-sm border-b border-border/30 last:border-0 ${
                          idx === highlightedIndex2 ? "bg-primary/20 text-primary" : ""
                        }`}
                      >
                        {med}
                      </button>
                    ))}
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {selectedMed1 && selectedMode === "equivalence" && (
        <EquivalenceResults medication={selectedMed1} />
      )}

      {selectedMed1 && selectedMode !== "equivalence" && (
        <MedicationResults
          medication1={selectedMed1}
          medication2={selectedMode === "interactions" ? (interactionType === "phytotherapy" ? searchTerm2 : selectedMed2) : null}
          mode={selectedMode === "interactions" && interactionType === "phytotherapy" ? "phytotherapie" : selectedMode}
        />
      )}

      <Card className="p-4 bg-secondary/30 border-border/50 backdrop-blur-sm relative z-0">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Informations officielles</p>
            <p>
              Synthèse fondée sur les recommandations des autorités sanitaires (ANSM, HAS, Santé publique France, OMS, Institut Pasteur) et la littérature scientifique spécialisée.
              Ces informations ne remplacent pas l'avis d'un professionnel de santé.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
import { useState, useEffect } from "react";
import { Globe, AlertTriangle, Syringe, Shield, Droplets, Info, Loader2, FileDown, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TravelData {
  vaccinsObligatoires: { name: string; note: string }[];
  vaccinsRecommandes: { name: string; note: string }[];
  prophylaxies: {
    name: string;
    zone: string;
    traitement: string;
    duree: string;
    contrindications: string;
  }[];
  conseils: string[];
  sources?: { name: string; url: string }[];
}

export const TravelSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [travelData, setTravelData] = useState<TravelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch country suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const { data } = await supabase.functions.invoke('search-countries', {
          body: { searchTerm }
        });

        if (data?.success && data?.countries) {
          setSuggestions(data.countries);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSelectCountry = async (country: string) => {
    setSearchTerm(country);
    setShowSuggestions(false);
    setSelectedCountry(country);
    setIsLoading(true);
    setTravelData(null);

    try {
      const { data, error } = await supabase.functions.invoke('travel-recommendations', {
        body: { country }
      });

      if (error) {
        console.error('Error fetching travel recommendations:', error);
        toast.error("Erreur lors de la récupération des recommandations");
        return;
      }

      if (data?.success && data?.data) {
        setTravelData(data.data);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.length >= 2) {
      handleSelectCountry(searchTerm);
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedCountry || !travelData) return;
    
    setIsGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-travel-pdf', {
        body: { country: selectedCountry, travelData }
      });

      if (error) {
        console.error('Error generating PDF:', error);
        toast.error("Erreur lors de la génération du PDF");
        return;
      }

      if (data?.success && data?.html) {
        // Create a blob from the HTML and download it
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || `prevention-voyage-${selectedCountry}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success("Document généré ! Ouvrez-le dans votre navigateur et imprimez en PDF.");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 border-primary/20 shadow-md">
        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="country-search" className="block text-xs sm:text-sm font-medium mb-2">
              Pays de destination
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                id="country-search"
                type="text"
                placeholder="Ex : Sénégal, Thaïlande, Brésil..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="pl-8 sm:pl-10 text-sm"
              />
            </div>
            
            {/* Suggestions dropdown */}
            {showSuggestions && searchTerm.length >= 2 && (suggestions.length > 0 || isLoadingSuggestions) && (
              <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-background border shadow-lg">
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Recherche...</span>
                  </div>
                ) : (
                  suggestions.map((country, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectCountry(country)}
                      className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors text-sm"
                    >
                      {country}
                    </button>
                  ))
                )}
              </Card>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              Tapez 2 lettres pour voir les suggestions
            </p>
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Recherche des recommandations pour {selectedCountry}...
            </p>
          </div>
        </Card>
      )}

      {travelData && !isLoading && (
        <div className="space-y-3 sm:space-y-4">
          {travelData.vaccinsObligatoires && travelData.vaccinsObligatoires.length > 0 && (
            <Card className="p-4 sm:p-6 shadow-md border-destructive/30">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                  <h3 className="text-base sm:text-lg font-semibold">Vaccinations obligatoires</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {travelData.vaccinsObligatoires.map((vaccine, idx) => (
                    <div key={idx} className="p-2 sm:p-3 bg-destructive/5 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{vaccine.name}</p>
                          <p className="text-xs text-muted-foreground">{vaccine.note}</p>
                        </div>
                        <Badge className="bg-destructive text-[10px] sm:text-xs w-fit">Obligatoire</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {travelData.vaccinsRecommandes && travelData.vaccinsRecommandes.length > 0 && (
            <Card className="p-4 sm:p-6 shadow-md border-warning/30">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <Syringe className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                  <h3 className="text-base sm:text-lg font-semibold">Vaccinations recommandées</h3>
                </div>
                <div className="space-y-2">
                  {travelData.vaccinsRecommandes.map((vaccine, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 p-2 sm:p-3 bg-warning/5 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-xs sm:text-sm">{vaccine.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{vaccine.note}</p>
                      </div>
                      <Badge variant="outline" className="border-warning text-warning text-[10px] sm:text-xs w-fit">
                        Recommandé
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {travelData.prophylaxies && travelData.prophylaxies.length > 0 && (
            <Card className="p-4 sm:p-6 shadow-md border-primary/30">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-base sm:text-lg font-semibold">Prophylaxies antipaludiques</h3>
                </div>
                {travelData.prophylaxies.map((prophylaxie, idx) => (
                  <div key={idx} className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-primary/5 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{prophylaxie.name}</p>
                      <p className="text-xs text-muted-foreground">{prophylaxie.zone}</p>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <div>
                        <span className="font-medium">Traitement : </span>
                        <span>{prophylaxie.traitement}</span>
                      </div>
                      <div>
                        <span className="font-medium">Durée : </span>
                        <span>{prophylaxie.duree}</span>
                      </div>
                      {prophylaxie.contrindications && (
                        <div className="text-destructive">
                          <span className="font-medium">⚠️ </span>
                          <span>{prophylaxie.contrindications}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {travelData.conseils && travelData.conseils.length > 0 && (
            <Card className="p-4 sm:p-6 shadow-md">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  <h3 className="text-base sm:text-lg font-semibold">Conseils pratiques</h3>
                </div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {travelData.conseils.map((conseil, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                      <span className="text-accent mt-0.5">•</span>
                      <span>{conseil}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Sources Section */}
          <Card className="p-4 sm:p-6 shadow-md bg-muted/20">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-semibold">Sources officielles</h3>
                <Button 
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Générer PDF</span>
                </Button>
              </div>
              
              {travelData.sources && travelData.sources.length > 0 ? (
                <div className="space-y-2">
                  {travelData.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span>{source.name}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <a
                    href="https://www.pasteur.fr/fr/centre-medical/preparer-son-voyage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span>Institut Pasteur - Centre médical</span>
                  </a>
                  <a
                    href="https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span>Ministère des Affaires étrangères</span>
                  </a>
                  <a
                    href="https://www.santepubliquefrance.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span>Santé Publique France</span>
                  </a>
                </div>
              )}
              
              <p className="text-[10px] sm:text-xs text-muted-foreground pt-2 border-t">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-muted/30 border-muted">
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Ces recommandations ne remplacent pas une consultation en médecine des voyages. 
                Consultez un professionnel de santé 4 à 6 semaines avant le départ.
              </p>
            </div>
          </Card>
        </div>
      )}

      {!selectedCountry && !isLoading && (
        <Card className="p-6 sm:p-8 text-center border-muted">
          <Globe className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Recherchez un pays de destination pour obtenir les recommandations vaccinales et de prévention.
          </p>
        </Card>
      )}
    </div>
  );
};

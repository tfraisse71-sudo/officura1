import { ExternalLink, Clock, Loader2, Pill, Building2, AlertTriangle, CheckCircle2, Package, Leaf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EquivalenceResultsProps {
  medication: string;
}

interface MedicationAnalysis {
  originalName: string;
  dci: string;
  dosage: string;
  form: string;
}

interface GenericMed {
  name: string;
  note?: string;
}

interface EquivalentMed {
  name: string;
  form?: string;
  laboratory?: string;
  note?: string;
}

interface IndicationEquivalent {
  name: string;
  productType: string;
  indication: string;
  activePrinciple?: string;
  note?: string;
}

interface EquivalenceData {
  medicationAnalysis: MedicationAnalysis;
  generics: GenericMed[];
  brandEquivalents: EquivalentMed[];
  indicationEquivalents?: IndicationEquivalent[];
  excipientWarnings: string[];
  summary: string[];
  substitutionAdvice: string;
}

export const EquivalenceResults = ({ medication }: EquivalenceResultsProps) => {
  const [data, setData] = useState<EquivalenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEquivalences = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: result, error: fetchError } = await supabase.functions.invoke('medication-equivalence', {
          body: { medicationName: medication }
        });

        if (fetchError) throw fetchError;
        if (result.error) throw new Error(result.error);

        setData(result);
      } catch (err: any) {
        console.error('Error fetching equivalences:', err);
        setError(err.message || "Impossible de récupérer les équivalences");
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les équivalences. Veuillez réessayer.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEquivalences();
  }, [medication, toast]);

  if (loading) {
    return (
      <Card className="p-4 sm:p-6 md:p-8 text-center">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
        <p className="text-sm sm:text-base text-muted-foreground">Recherche des équivalences strictes...</p>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-4 sm:p-6 md:p-8 text-center border-destructive/30">
        <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-3 sm:mb-4 text-destructive" />
        <p className="text-sm sm:text-base text-muted-foreground">
          {error || "Données non disponibles"}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="p-3 sm:p-4 md:p-6 shadow-md">
        <div className="space-y-3 sm:space-y-4">
          {/* Header - Medication Analysis */}
          <div className="bg-primary/5 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-3">
              Équivalences strictes de {data.medicationAnalysis.originalName}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">DCI : </span>
                <span className="font-medium">{data.medicationAnalysis.dci}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Dosage : </span>
                <span className="font-medium">{data.medicationAnalysis.dosage}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Forme : </span>
                <span className="font-medium">{data.medicationAnalysis.form}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          {data.summary.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Points clés
              </h4>
              <ul className="space-y-1 sm:space-y-1.5">
                {data.summary.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm flex items-start gap-2">
                    <span className="text-primary mt-0.5 sm:mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Generics - Simplified display */}
          {data.generics.length > 0 && (
            <div className="bg-secondary/30 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
                <Pill className="h-4 w-4 text-accent" />
                Génériques disponibles
              </h4>
              <div className="space-y-2">
                {data.generics.map((generic, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        Générique
                      </Badge>
                      <span className="text-sm font-medium">{generic.name}</span>
                    </div>
                    {generic.note && (
                      <span className="text-xs text-muted-foreground">{generic.note}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand Equivalents - Full list with forms */}
          {data.brandEquivalents.length > 0 && (
            <Accordion type="single" collapsible defaultValue="brands">
              <AccordionItem value="brands" className="border-none">
                <AccordionTrigger className="text-left text-sm sm:text-base hover:no-underline py-3 px-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    <span>Spécialités équivalentes ({data.brandEquivalents.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.brandEquivalents.map((brand, idx) => (
                      <div key={idx} className="bg-card border border-border/50 rounded-lg p-3 text-sm hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{brand.name}</p>
                            {brand.form && (
                              <Badge variant="outline" className="text-[10px] font-normal">
                                {brand.form}
                              </Badge>
                            )}
                            {brand.laboratory && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {brand.laboratory}
                              </p>
                            )}
                          </div>
                        </div>
                        {brand.note && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {brand.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Indication Equivalents - Parapharmacy alternatives */}
          {data.indicationEquivalents && data.indicationEquivalents.length > 0 && (
            <Accordion type="single" collapsible defaultValue="indication">
              <AccordionItem value="indication" className="border-none">
                <AccordionTrigger className="text-left text-sm sm:text-base hover:no-underline py-3 px-4 bg-emerald-500/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-500" />
                    <span>Équivalents par indication ({data.indicationEquivalents.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <p className="text-xs text-muted-foreground mb-3 italic">
                    Produits avec la même indication thérapeutique mais une composition différente (médicaments, dispositifs médicaux, compléments alimentaires, parapharmacie)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.indicationEquivalents.map((equiv, idx) => (
                      <div key={idx} className="bg-card border border-emerald-500/30 rounded-lg p-3 text-sm hover:border-emerald-500/50 transition-colors">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-foreground">{equiv.name}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] font-normal shrink-0 ${
                                equiv.productType === 'Dispositif médical' ? 'border-blue-500 text-blue-500' :
                                equiv.productType === 'Complément alimentaire' ? 'border-green-500 text-green-500' :
                                equiv.productType === 'Homéopathie' ? 'border-purple-500 text-purple-500' :
                                'border-primary text-primary'
                              }`}
                            >
                              {equiv.productType === 'Dispositif médical' && <Package className="h-2.5 w-2.5 mr-1" />}
                              {equiv.productType === 'Complément alimentaire' && <Leaf className="h-2.5 w-2.5 mr-1" />}
                              {equiv.productType}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Indication : </span>{equiv.indication}
                          </p>
                          {equiv.activePrinciple && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Composant : </span>{equiv.activePrinciple}
                            </p>
                          )}
                          {equiv.note && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 italic">
                              {equiv.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Excipient Warnings */}
          {data.excipientWarnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium mb-2 text-sm sm:text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Excipients à effet notoire
              </h4>
              <ul className="space-y-1 sm:space-y-1.5">
                {data.excipientWarnings.map((warning, idx) => (
                  <li key={idx} className="text-xs sm:text-sm flex items-start gap-2 text-amber-700 dark:text-amber-400">
                    <span className="mt-0.5 sm:mt-1">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Substitution Advice */}
          {data.substitutionAdvice && (
            <div className="bg-primary/5 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium mb-2 text-sm sm:text-base">Conseil de substitution</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">{data.substitutionAdvice}</p>
            </div>
          )}

          {/* Sources */}
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs sm:text-sm font-medium">Sources officielles</h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 sm:gap-2 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-2 h-auto"
                asChild
              >
                <a href="https://base-donnees-publique.medicaments.gouv.fr/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Base publique médicaments
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 sm:gap-2 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-2 h-auto"
                asChild
              >
                <a href="https://ansm.sante.fr/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  ANSM
                </a>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground pt-2">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

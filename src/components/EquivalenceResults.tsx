import { Clock, Loader2, Pill, Building2, AlertTriangle, CheckCircle2, Package, Leaf, ShieldCheck, FlaskConical } from "lucide-react";
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
  verificationNote?: string;
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
        <p className="text-sm sm:text-base text-muted-foreground">Recherche des équivalences sur les sources officielles...</p>
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

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'Dispositif médical':
        return <Package className="h-3 w-3" />;
      case 'Complément alimentaire':
        return <Leaf className="h-3 w-3" />;
      case 'Homéopathie':
        return <FlaskConical className="h-3 w-3" />;
      default:
        return <Pill className="h-3 w-3" />;
    }
  };

  const getProductTypeColor = (type: string) => {
    switch (type) {
      case 'Dispositif médical':
        return 'border-blue-500 text-blue-500 bg-blue-500/10';
      case 'Complément alimentaire':
        return 'border-green-500 text-green-500 bg-green-500/10';
      case 'Homéopathie':
        return 'border-purple-500 text-purple-500 bg-purple-500/10';
      default:
        return 'border-primary text-primary bg-primary/10';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card - Medication Analysis */}
      <Card className="p-4 sm:p-5 shadow-md border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
              {data.medicationAnalysis.originalName}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="bg-muted/50 rounded-md px-3 py-1.5">
                <span className="text-muted-foreground text-xs">DCI</span>
                <p className="font-semibold text-primary">{data.medicationAnalysis.dci}</p>
              </div>
              <div className="bg-muted/50 rounded-md px-3 py-1.5">
                <span className="text-muted-foreground text-xs">Dosage</span>
                <p className="font-semibold">{data.medicationAnalysis.dosage}</p>
              </div>
              <div className="bg-muted/50 rounded-md px-3 py-1.5">
                <span className="text-muted-foreground text-xs">Forme</span>
                <p className="font-semibold">{data.medicationAnalysis.form}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Verification Note */}
      {data.verificationNote && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span>{data.verificationNote}</span>
        </div>
      )}

      {/* Summary */}
      {data.summary.length > 0 && (
        <Card className="p-4 shadow-sm">
          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Points clés
          </h4>
          <ul className="space-y-1.5">
            {data.summary.map((item, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Main Content - 3 Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Section 1: Génériques */}
        <Card className="p-4 shadow-md border-accent/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-md bg-accent/20">
              <Pill className="h-4 w-4 text-accent" />
            </div>
            <h4 className="font-bold text-sm sm:text-base">Génériques</h4>
            <Badge variant="secondary" className="ml-auto text-xs">
              {data.generics.length}
            </Badge>
          </div>
          
          {data.generics.length > 0 ? (
            <div className="space-y-2">
              {data.generics.map((generic, idx) => (
                <div key={idx} className="bg-accent/10 rounded-lg p-3">
                  <p className="font-semibold text-sm">{generic.name}</p>
                  {generic.note && (
                    <p className="text-xs text-muted-foreground mt-1">{generic.note}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Aucun générique référencé</p>
          )}
        </Card>

        {/* Section 2: Spécialités équivalentes */}
        <Card className="p-4 shadow-md border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-md bg-primary/20">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <h4 className="font-bold text-sm sm:text-base">Spécialités</h4>
            <Badge variant="secondary" className="ml-auto text-xs">
              {data.brandEquivalents.length}
            </Badge>
          </div>
          
          {data.brandEquivalents.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.brandEquivalents.map((brand, idx) => (
                <div key={idx} className="bg-primary/5 border border-primary/20 rounded-lg p-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{brand.name}</p>
                      {brand.form && (
                        <Badge variant="outline" className="text-[10px] mt-1">
                          {brand.form}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {brand.laboratory && (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {brand.laboratory}
                    </p>
                  )}
                  {brand.note && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{brand.note}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Aucune spécialité équivalente</p>
          )}
        </Card>

        {/* Section 3: Équivalents par indication */}
        <Card className="p-4 shadow-md border-emerald-500/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-md bg-emerald-500/20">
              <Package className="h-4 w-4 text-emerald-500" />
            </div>
            <h4 className="font-bold text-sm sm:text-base">Par indication</h4>
            <Badge variant="secondary" className="ml-auto text-xs bg-emerald-500/10 text-emerald-600">
              {data.indicationEquivalents?.length || 0}
            </Badge>
          </div>
          
          <p className="text-[10px] text-muted-foreground mb-3 italic">
            Produits avec même indication thérapeutique (parapharmacie, DM, compléments)
          </p>
          
          {data.indicationEquivalents && data.indicationEquivalents.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.indicationEquivalents.map((equiv, idx) => (
                <div key={idx} className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="font-semibold text-sm">{equiv.name}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-[9px] shrink-0 ${getProductTypeColor(equiv.productType)}`}
                    >
                      {getProductTypeIcon(equiv.productType)}
                      <span className="ml-1">{equiv.productType}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Indication : </span>{equiv.indication}
                  </p>
                  {equiv.activePrinciple && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium">Composant : </span>{equiv.activePrinciple}
                    </p>
                  )}
                  {equiv.note && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 italic">
                      {equiv.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Aucun équivalent par indication</p>
          )}
        </Card>
      </div>

      {/* Excipient Warnings */}
      {data.excipientWarnings.length > 0 && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800">
          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Excipients à effet notoire
          </h4>
          <ul className="space-y-1">
            {data.excipientWarnings.map((warning, idx) => (
              <li key={idx} className="text-xs flex items-start gap-2 text-amber-700 dark:text-amber-400">
                <span className="mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Substitution Advice */}
      {data.substitutionAdvice && (
        <Card className="p-4 bg-primary/5">
          <h4 className="font-semibold mb-2 text-sm">Conseil de substitution</h4>
          <p className="text-xs text-muted-foreground">{data.substitutionAdvice}</p>
        </Card>
      )}

      {/* Sources & Footer */}
      <Card className="p-4">
        <h4 className="text-xs font-semibold mb-2">Sources</h4>
        <p className="text-xs text-muted-foreground">
          Synthèse fondée sur les recommandations des autorités sanitaires (ANSM, HAS) et la littérature scientifique spécialisée.
        </p>
        
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-3 pt-3 border-t">
          <Clock className="h-2.5 w-2.5" />
          <span>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
        </div>
      </Card>
    </div>
  );
};

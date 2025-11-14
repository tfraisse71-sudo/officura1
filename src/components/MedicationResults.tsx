import { ExternalLink, Download, Clock, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MedicationResultsProps {
  medication1: string;
  medication2: string | null;
  mode: string;
}

export const MedicationResults = ({ medication1, medication2, mode }: MedicationResultsProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMedicationInfo = async () => {
      setLoading(true);
      try {
        if (mode === "interactions" && medication2) {
          const { data: result, error } = await supabase.functions.invoke('medication-interactions', {
            body: { medication1, medication2 }
          });

          if (error) throw error;
          
          setData({
            ...result,
            title: `Interactions entre ${medication1} et ${medication2}`,
            sources: [
              { name: "Thesaurus ANSM", url: "https://ansm.sante.fr/thesaurus" },
            ]
          });
        } else if (mode !== "interactions") {
          const { data: result, error } = await supabase.functions.invoke('medication-info', {
            body: { medicationName: medication1, mode }
          });

          if (error) throw error;

          let title = "";
          let sources: { name: string; url: string }[] = [];

          switch (mode) {
            case "indications-conseils":
              title = `${medication1} - Indications et Conseils de prise`;
              sources = [
                { name: "RCP ANSM", url: "https://ansm.sante.fr" },
                { name: "Vidal", url: "https://www.vidal.fr" },
              ];
              break;
            case "contre-indications":
              title = `Contre-indications de ${medication1}`;
              sources = [
                { name: "RCP ANSM", url: "https://ansm.sante.fr" },
                { name: "Notice", url: "https://ansm.sante.fr" },
              ];
              break;
            case "grossesse":
              title = `${medication1} - Utilisation pendant la grossesse`;
              sources = [
                { name: "CRAT", url: "https://www.lecrat.fr" },
                { name: "RCP ANSM", url: "https://ansm.sante.fr" },
              ];
              break;
            case "allaitement":
              title = `${medication1} - Utilisation pendant l'allaitement`;
              sources = [
                { name: "CRAT", url: "https://www.lecrat.fr" },
              ];
              break;
          }

          setData({
            ...result,
            title,
            sources
          });
        }
      } catch (error: any) {
        console.error('Error fetching medication info:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les informations. Veuillez réessayer.",
          variant: "destructive",
        });
        setData({
          severity: "medium",
          title: `Informations non disponibles`,
          summary: ["Les données ne sont pas disponibles pour le moment."],
          details: [],
          sources: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMedicationInfo();
  }, [medication1, medication2, mode, toast]);

  if (loading) {
    return (
      <Card className="p-4 sm:p-6 md:p-8 text-center">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
        <p className="text-sm sm:text-base text-muted-foreground">Recherche des informations officielles...</p>
      </Card>
    );
  }

  if (!data) return null;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-severity-critical text-white text-[10px] sm:text-xs">CI Absolue</Badge>;
      case "high":
        return <Badge className="bg-severity-high text-white text-[10px] sm:text-xs">Assoc. déconseillée</Badge>;
      case "medium":
        return <Badge className="bg-severity-medium text-white text-[10px] sm:text-xs">Prudence</Badge>;
      case "low":
        return <Badge className="bg-severity-low text-white text-[10px] sm:text-xs">Précaution</Badge>;
      case "safe":
        return <Badge className="bg-severity-safe text-white text-[10px] sm:text-xs">Compatible</Badge>;
      default:
        return null;
    }
  };

  if (mode === "interactions" && !medication2) {
    return (
      <Card className="p-4 sm:p-6 md:p-8 text-center border-muted">
        <p className="text-sm sm:text-base text-muted-foreground">
          Veuillez sélectionner un deuxième médicament pour vérifier les interactions.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="p-3 sm:p-4 md:p-6 shadow-md">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 w-full">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">{data.title}</h3>
              {getSeverityBadge(data.severity)}
            </div>
            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              PDF
            </Button>
          </div>

          {data.summary.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium mb-2 text-sm sm:text-base">Points clés</h4>
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

          {data.details.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              {data.details.map((detail, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger className="text-left text-sm sm:text-base">
                    {detail.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs sm:text-sm text-muted-foreground">{detail.content}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs sm:text-sm font-medium">Sources officielles</h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {data.sources.map((source, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="gap-1 sm:gap-2 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-2 h-auto"
                  asChild
                >
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {source.name}
                  </a>
                </Button>
              ))}
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

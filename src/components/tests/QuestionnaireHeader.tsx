import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";

interface QuestionnaireHeaderProps {
  title: string;
  onBack: () => void;
}

export const QuestionnaireHeader = ({ title, onBack }: QuestionnaireHeaderProps) => {
  return (
    <div className="space-y-4">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux tests
      </Button>
      
      <h2 className="text-xl sm:text-2xl font-semibold">
        Vérification des critères – {title}
      </h2>
      
      <Card className="p-4 bg-secondary/30 border-warning/30 backdrop-blur-sm">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cet outil aide le professionnel de santé à vérifier les critères réglementaires 
            ou conditions de réalisation d'un test en officine.
            <br />
            <strong className="text-foreground">Il ne constitue pas un diagnostic.</strong>
            <br />
            La décision finale revient au professionnel de santé.
          </p>
        </div>
      </Card>
    </div>
  );
};

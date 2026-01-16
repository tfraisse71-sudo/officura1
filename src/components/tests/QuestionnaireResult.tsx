import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface QuestionnaireResultProps {
  success: boolean;
  message: string;
  subMessage?: string;
  warnings?: string[];
  onReset: () => void;
}

export const QuestionnaireResult = ({
  success,
  message,
  subMessage,
  warnings = [],
  onReset,
}: QuestionnaireResultProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`p-6 sm:p-8 backdrop-blur-sm border-2 ${
        success 
          ? "bg-success/10 border-success/50" 
          : "bg-destructive/10 border-destructive/50"
      }`}>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {success ? (
              <div className="p-4 rounded-full bg-success/20">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
            ) : (
              <div className="p-4 rounded-full bg-destructive/20">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
            )}
          </div>
          
          <h3 className={`text-xl sm:text-2xl font-bold ${
            success ? "text-success" : "text-destructive"
          }`}>
            {success ? "✔️ Critères réunis" : "❌ Critères non réunis"}
          </h3>
          
          <p className="text-sm sm:text-base text-foreground/90">
            {message}
          </p>
          
          {subMessage && (
            <p className="text-sm text-muted-foreground italic">
              ➜ {subMessage}
            </p>
          )}
          
          {warnings.length > 0 && (
            <div className="space-y-2 mt-4">
              {warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 justify-center text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{warning}</span>
                </div>
              ))}
            </div>
          )}
          
          <Button 
            onClick={onReset}
            variant="outline"
            className="mt-6 gap-2 border-border/50"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface QuestionnaireQuestionProps {
  question: string;
  questionNumber: number;
  onAnswer: (answer: boolean) => void;
  isAgeQuestion?: boolean;
  ageOptions?: { label: string; value: string }[];
  onAgeAnswer?: (value: string) => void;
}

export const QuestionnaireQuestion = ({
  question,
  questionNumber,
  onAnswer,
  isAgeQuestion = false,
  ageOptions,
  onAgeAnswer,
}: QuestionnaireQuestionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 sm:p-6 bg-card/50 border-border/50 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-semibold text-primary">
              {questionNumber}
            </span>
            <p className="text-sm sm:text-base font-medium pt-1">{question}</p>
          </div>
          
          {isAgeQuestion && ageOptions ? (
            <div className="flex flex-wrap gap-2 ml-11">
              {ageOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  onClick={() => onAgeAnswer?.(option.value)}
                  className="border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 ml-11">
              <Button
                onClick={() => onAnswer(true)}
                className="flex-1 bg-success hover:bg-success/90"
              >
                Oui
              </Button>
              <Button
                onClick={() => onAnswer(false)}
                variant="outline"
                className="flex-1 border-border/50 hover:bg-destructive/20 hover:border-destructive/50"
              >
                Non
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

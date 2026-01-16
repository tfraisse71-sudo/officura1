import { useState } from "react";
import { QuestionnaireHeader } from "./QuestionnaireHeader";
import { QuestionnaireQuestion } from "./QuestionnaireQuestion";
import { QuestionnaireResult } from "./QuestionnaireResult";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface TrodAngineQuestionnaireProps {
  onBack: () => void;
}

type Phase = "preliminary" | "scoring" | "result";

const preliminaryQuestions = [
  {
    question: "Angine érythémateuse ou érythémato-pultacée observée ?",
    expectedAnswer: true,
    stopMessage: "Type d'angine non compatible avec le TROD. Orientation médicale recommandée."
  },
  {
    question: "Patient âgé de 3 ans ou plus ?",
    expectedAnswer: true,
    stopMessage: "Patient trop jeune (< 3 ans). Orientation médicale recommandée."
  }
];

const scoringQuestions = [
  {
    question: "Fièvre > 38 °C ?",
    points: 1
  },
  {
    question: "Absence de toux ?",
    points: 1
  },
  {
    question: "Adénopathies cervicales antérieures sensibles ?",
    points: 1
  },
  {
    question: "Atteinte amygdalienne (augmentation de volume ou exsudat) ?",
    points: 1
  }
];

const ageOptions = [
  { label: "3-14 ans", value: "3-14", points: 1 },
  { label: "15-44 ans", value: "15-44", points: 0 },
  { label: "≥ 45 ans", value: "45+", points: -1 }
];

export const TrodAngineQuestionnaire = ({ onBack }: TrodAngineQuestionnaireProps) => {
  const [phase, setPhase] = useState<Phase>("preliminary");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [scoringStep, setScoringStep] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    subMessage?: string;
    score?: number;
  } | null>(null);

  const handlePreliminaryAnswer = (answer: boolean) => {
    const config = preliminaryQuestions[currentQuestion];
    
    if (answer !== config.expectedAnswer) {
      setResult({
        success: false,
        message: config.stopMessage || "Critères préliminaires non réunis."
      });
      setPhase("result");
      return;
    }

    if (currentQuestion === preliminaryQuestions.length - 1) {
      setPhase("scoring");
      setCurrentQuestion(0);
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleScoringAnswer = (answer: boolean) => {
    if (answer) {
      setScore(prev => prev + scoringQuestions[scoringStep].points);
    }

    if (scoringStep === scoringQuestions.length - 1) {
      // Move to age question
      setScoringStep(prev => prev + 1);
    } else {
      setScoringStep(prev => prev + 1);
    }
  };

  const handleAgeAnswer = (value: string) => {
    const ageOption = ageOptions.find(opt => opt.value === value);
    const finalScore = score + (ageOption?.points || 0);
    
    if (finalScore >= 2) {
      setResult({
        success: true,
        message: "Les critères sont réunis pour réaliser un TROD angine.",
        subMessage: "Le test peut être réalisé selon le protocole en vigueur.",
        score: finalScore
      });
    } else {
      setResult({
        success: false,
        message: "Score Mac Isaac insuffisant pour indication du TROD.",
        subMessage: "Pas d'indication à réaliser le test. Orientation symptomatique.",
        score: finalScore
      });
    }
    setPhase("result");
  };

  const handleReset = () => {
    setPhase("preliminary");
    setCurrentQuestion(0);
    setScore(0);
    setScoringStep(0);
    setResult(null);
  };

  const getTotalQuestions = () => {
    return preliminaryQuestions.length + scoringQuestions.length + 1; // +1 for age
  };

  const getCurrentStep = () => {
    if (phase === "preliminary") return currentQuestion + 1;
    return preliminaryQuestions.length + scoringStep + 1;
  };

  const progress = (getCurrentStep() / getTotalQuestions()) * 100;
  const isAgeQuestion = phase === "scoring" && scoringStep === scoringQuestions.length;

  return (
    <div className="space-y-6">
      <QuestionnaireHeader title="TROD Angine (Score Mac Isaac)" onBack={onBack} />
      
      {phase !== "result" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {phase === "preliminary" ? "Questions préliminaires" : "Calcul du score Mac Isaac"}
            </span>
            <span>Étape {getCurrentStep()} / {getTotalQuestions()}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {phase === "scoring" && !isAgeQuestion && (
        <Card className="p-4 bg-primary/10 border-primary/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Score actuel : {score} points</span>
          </div>
        </Card>
      )}
      
      {phase === "result" && result ? (
        <div className="space-y-4">
          {result.score !== undefined && (
            <Card className="p-4 bg-card/50 border-border/50 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Score Mac Isaac final</p>
                <p className="text-3xl font-bold text-primary">{result.score}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  (Score ≥ 2 = indication au TROD)
                </p>
              </div>
            </Card>
          )}
          <QuestionnaireResult
            success={result.success}
            message={result.message}
            subMessage={result.subMessage}
            onReset={handleReset}
          />
        </div>
      ) : phase === "preliminary" ? (
        <QuestionnaireQuestion
          question={preliminaryQuestions[currentQuestion].question}
          questionNumber={currentQuestion + 1}
          onAnswer={handlePreliminaryAnswer}
        />
      ) : isAgeQuestion ? (
        <QuestionnaireQuestion
          question="Âge du patient ?"
          questionNumber={scoringStep + 1}
          onAnswer={() => {}}
          isAgeQuestion={true}
          ageOptions={ageOptions}
          onAgeAnswer={handleAgeAnswer}
        />
      ) : (
        <QuestionnaireQuestion
          question={scoringQuestions[scoringStep].question}
          questionNumber={scoringStep + 1}
          onAnswer={handleScoringAnswer}
        />
      )}
    </div>
  );
};

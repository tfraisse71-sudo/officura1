import { useState } from "react";
import { QuestionnaireHeader } from "./QuestionnaireHeader";
import { QuestionnaireQuestion } from "./QuestionnaireQuestion";
import { QuestionnaireResult } from "./QuestionnaireResult";
import { Progress } from "@/components/ui/progress";

interface TestGrippeCovidQuestionnaireProps {
  onBack: () => void;
}

interface QuestionConfig {
  question: string;
  type: "stop_if_no" | "stop_if_yes" | "warning_if_no" | "warning_if_yes" | "continue";
  stopMessage?: string;
  warningMessage?: string;
  isUrgent?: boolean;
}

const questions: QuestionConfig[] = [
  {
    question: "Symptômes respiratoires aigus présents (toux, fièvre, maux de gorge, courbatures) ?",
    type: "stop_if_no",
    stopMessage: "Absence de symptômes respiratoires. Test non pertinent."
  },
  {
    question: "Symptômes apparus depuis moins de 4 jours ?",
    type: "warning_if_no",
    warningMessage: "Symptômes > 4 jours : fiabilité du test diminuée"
  },
  {
    question: "Présence de signes de gravité (détresse respiratoire, confusion, cyanose) ?",
    type: "stop_if_yes",
    stopMessage: "Signes de gravité présents.",
    isUrgent: true
  },
  {
    question: "Saturation basse connue ou pathologie respiratoire sévère (BPCO sévère, insuffisance respiratoire) ?",
    type: "stop_if_yes",
    stopMessage: "Pathologie respiratoire sévère. Orientation médicale recommandée."
  },
  {
    question: "Patient à risque de forme grave (âge > 65 ans, immunodépression, comorbidités) ?",
    type: "warning_if_yes",
    warningMessage: "Patient à risque : vigilance accrue requise"
  },
  {
    question: "Test grippe ou COVID positif récent (< 10 jours) ?",
    type: "warning_if_yes",
    warningMessage: "Test positif récent : intérêt limité d'un nouveau test"
  },
  {
    question: "Consentement du patient obtenu ?",
    type: "stop_if_no",
    stopMessage: "Consentement requis pour réaliser le test."
  }
];

export const TestGrippeCovidQuestionnaire = ({ onBack }: TestGrippeCovidQuestionnaireProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    subMessage?: string;
    warnings?: string[];
    isUrgent?: boolean;
  } | null>(null);

  const handleAnswer = (answer: boolean) => {
    const config = questions[currentQuestion];
    let shouldStop = false;
    let newWarnings = [...warnings];

    switch (config.type) {
      case "stop_if_no":
        if (!answer) shouldStop = true;
        break;
      case "stop_if_yes":
        if (answer) shouldStop = true;
        break;
      case "warning_if_no":
        if (!answer && config.warningMessage) {
          newWarnings.push(config.warningMessage);
        }
        break;
      case "warning_if_yes":
        if (answer && config.warningMessage) {
          newWarnings.push(config.warningMessage);
        }
        break;
    }

    setWarnings(newWarnings);

    if (shouldStop) {
      setResult({
        success: false,
        message: config.stopMessage || "Conditions non réunies.",
        subMessage: config.isUrgent 
          ? "Orientation médicale URGENTE recommandée." 
          : "Une orientation médicale est recommandée.",
        isUrgent: config.isUrgent
      });
      return;
    }

    if (currentQuestion === questions.length - 1) {
      setResult({
        success: true,
        message: "Les conditions de réalisation sont réunies.",
        subMessage: "Le test peut être réalisé selon le protocole en vigueur.",
        warnings: newWarnings
      });
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setWarnings([]);
    setResult(null);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <QuestionnaireHeader title="Test antigénique Grippe / COVID" onBack={onBack} />
      
      {!result && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestion + 1} / {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {result ? (
        <QuestionnaireResult
          success={result.success}
          message={result.message}
          subMessage={result.subMessage}
          warnings={result.warnings}
          onReset={handleReset}
        />
      ) : (
        <QuestionnaireQuestion
          question={questions[currentQuestion].question}
          questionNumber={currentQuestion + 1}
          onAnswer={handleAnswer}
        />
      )}
    </div>
  );
};

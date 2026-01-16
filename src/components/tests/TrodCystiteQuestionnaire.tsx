import { useState } from "react";
import { QuestionnaireHeader } from "./QuestionnaireHeader";
import { QuestionnaireQuestion } from "./QuestionnaireQuestion";
import { QuestionnaireResult } from "./QuestionnaireResult";
import { Progress } from "@/components/ui/progress";

interface TrodCystiteQuestionnaireProps {
  onBack: () => void;
}

interface QuestionConfig {
  question: string;
  expectedAnswer: boolean;
  stopMessage?: string;
  isUrgent?: boolean;
}

const questions: QuestionConfig[] = [
  {
    question: "La personne est-elle une femme ?",
    expectedAnswer: true,
    stopMessage: "Test réservé aux femmes. Orientation médicale recommandée."
  },
  {
    question: "A-t-elle entre 16 et 65 ans ?",
    expectedAnswer: true,
    stopMessage: "Âge hors critères (16-65 ans requis). Orientation médicale recommandée."
  },
  {
    question: "Présente-t-elle des symptômes urinaires évocateurs (brûlures, pollakiurie, urgenturie) ?",
    expectedAnswer: true,
    stopMessage: "Absence de symptômes évocateurs. Test non indiqué."
  },
  {
    question: "Consentement obtenu pour la réalisation du test ?",
    expectedAnswer: true,
    stopMessage: "Consentement requis pour réaliser le test."
  },
  {
    question: "Grossesse connue ou non exclue ?",
    expectedAnswer: false,
    stopMessage: "Grossesse = critère d'exclusion. Orientation médicale recommandée."
  },
  {
    question: "Symptômes gynécologiques associés (leucorrhées, prurit, dyspareunie) ?",
    expectedAnswer: false,
    stopMessage: "Symptômes gynécologiques associés. Orientation médicale recommandée."
  },
  {
    question: "Trois cystites ou plus sur les 12 derniers mois ?",
    expectedAnswer: false,
    stopMessage: "Cystites récidivantes. Orientation médicale recommandée."
  },
  {
    question: "Cystite récente non résolue (< 15 jours) ?",
    expectedAnswer: false,
    stopMessage: "Cystite récente non résolue. Orientation médicale recommandée."
  },
  {
    question: "Anomalie connue de l'appareil urinaire ?",
    expectedAnswer: false,
    stopMessage: "Anomalie urologique connue. Orientation médicale recommandée."
  },
  {
    question: "Immunodépression ou traitement immunosuppresseur ?",
    expectedAnswer: false,
    stopMessage: "Immunodépression. Orientation médicale recommandée."
  },
  {
    question: "Port d'un cathéter urinaire ?",
    expectedAnswer: false,
    stopMessage: "Cathéter urinaire en place. Orientation médicale recommandée."
  },
  {
    question: "Insuffisance rénale sévère connue ?",
    expectedAnswer: false,
    stopMessage: "Insuffisance rénale sévère. Orientation médicale recommandée."
  },
  {
    question: "Antibiothérapie en cours ?",
    expectedAnswer: false,
    stopMessage: "Antibiothérapie en cours. Orientation médicale recommandée."
  },
  {
    question: "Prise de fluoroquinolones dans les 3 derniers mois ?",
    expectedAnswer: false,
    stopMessage: "Prise récente de fluoroquinolones. Orientation médicale recommandée."
  },
  {
    question: "Fièvre > 38 °C ou douleurs lombaires ?",
    expectedAnswer: false,
    stopMessage: "Signes évocateurs de pyélonéphrite. Orientation médicale URGENTE.",
    isUrgent: true
  }
];

export const TrodCystiteQuestionnaire = ({ onBack }: TrodCystiteQuestionnaireProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    subMessage?: string;
    isUrgent?: boolean;
  } | null>(null);

  const handleAnswer = (answer: boolean) => {
    const config = questions[currentQuestion];
    
    if (answer !== config.expectedAnswer) {
      setResult({
        success: false,
        message: config.stopMessage || "Critères non réunis.",
        subMessage: config.isUrgent 
          ? "Orientation médicale urgente recommandée." 
          : "Une orientation médicale est recommandée.",
        isUrgent: config.isUrgent
      });
      return;
    }

    if (currentQuestion === questions.length - 1) {
      setResult({
        success: true,
        message: "Les critères réglementaires sont réunis.",
        subMessage: "Le test peut être réalisé selon le protocole en vigueur."
      });
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setResult(null);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <QuestionnaireHeader title="TROD Cystite" onBack={onBack} />
      
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

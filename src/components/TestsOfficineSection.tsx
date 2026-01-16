import { useState } from "react";
import { TestTube, Droplets, ThermometerSun } from "lucide-react";
import { TestCard } from "./tests/TestCard";
import { TrodCystiteQuestionnaire } from "./tests/TrodCystiteQuestionnaire";
import { TrodAngineQuestionnaire } from "./tests/TrodAngineQuestionnaire";
import { TestGrippeCovidQuestionnaire } from "./tests/TestGrippeCovidQuestionnaire";
import { Card } from "./ui/card";

type ActiveTest = null | "cystite" | "angine" | "grippe-covid";

export const TestsOfficineSection = () => {
  const [activeTest, setActiveTest] = useState<ActiveTest>(null);

  if (activeTest === "cystite") {
    return <TrodCystiteQuestionnaire onBack={() => setActiveTest(null)} />;
  }

  if (activeTest === "angine") {
    return <TrodAngineQuestionnaire onBack={() => setActiveTest(null)} />;
  }

  if (activeTest === "grippe-covid") {
    return <TestGrippeCovidQuestionnaire onBack={() => setActiveTest(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TestCard
          title="TROD Cystite"
          description="Vérification des critères réglementaires pour la réalisation du test rapide d'orientation diagnostique de la cystite chez la femme."
          icon={Droplets}
          onClick={() => setActiveTest("cystite")}
        />
        <TestCard
          title="TROD Angine"
          description="Calcul du score Mac Isaac et vérification des conditions pour réaliser un test rapide d'orientation diagnostique de l'angine."
          icon={TestTube}
          onClick={() => setActiveTest("angine")}
        />
        <TestCard
          title="Test Grippe / COVID"
          description="Vérification des conditions de réalisation du test antigénique rapide pour la grippe et le COVID-19."
          icon={ThermometerSun}
          onClick={() => setActiveTest("grippe-covid")}
        />
      </div>

      <Card className="p-4 bg-secondary/30 border-border/50 backdrop-blur-sm">
        <p className="text-xs sm:text-sm text-center text-muted-foreground">
          Sources : HAS – Assurance Maladie – Protocoles officiels
        </p>
      </Card>
    </div>
  );
};

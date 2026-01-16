import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface TestCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export const TestCard = ({ title, description, icon: Icon, onClick }: TestCardProps) => {
  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-sm text-muted-foreground">
          {description}
        </CardDescription>
        <Button 
          onClick={onClick} 
          className="w-full bg-primary hover:bg-primary/90 shadow-glow"
        >
          Vérifier les critères
        </Button>
      </CardContent>
    </Card>
  );
};

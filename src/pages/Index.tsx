import { Calculator, Syringe, Plane } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MedicationSearch } from "@/components/MedicationSearch";
import { DosageSection } from "@/components/DosageSection";
import { VaccinationSection } from "@/components/VaccinationSection";
import { TravelSection } from "@/components/TravelSection";
import logo from "@/assets/medisafe-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={logo} alt="MediSafe" className="h-8 sm:h-10 md:h-12 w-auto" />
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Version 1.0</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">MAJ : {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <Tabs defaultValue="medicament" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1.5 sm:gap-2 p-1">
            <TabsTrigger value="medicament" className="gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              Médicament
            </TabsTrigger>
            <TabsTrigger value="posologie" className="gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
              Posologie
            </TabsTrigger>
            <TabsTrigger value="vaccins" className="gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Syringe className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mes </span>Vaccins
            </TabsTrigger>
            <TabsTrigger value="voyage" className="gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Plane className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Prévention </span>Voyage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medicament" className="space-y-3 sm:space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-1.5 sm:mb-2">Recherche Médicament</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Consultez les contre-indications, informations grossesse/allaitement et interactions médicamenteuses.
              </p>
            </div>
            <MedicationSearch />
          </TabsContent>

          <TabsContent value="posologie" className="space-y-3 sm:space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-1.5 sm:mb-2">Posologie</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Consultez les posologies recommandées par tranche d'âge et de poids.
              </p>
            </div>
            <DosageSection />
          </TabsContent>

          <TabsContent value="vaccins" className="space-y-3 sm:space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-1.5 sm:mb-2">Mes Vaccins</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Vérifiez votre situation vaccinale selon le calendrier vaccinal français officiel.
              </p>
            </div>
            <VaccinationSection />
          </TabsContent>

          <TabsContent value="voyage" className="space-y-3 sm:space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-1.5 sm:mb-2">Prévention Voyage</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Recommandations vaccinales et prophylaxies par pays de destination.
              </p>
            </div>
            <TravelSection />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-8 sm:mt-10 md:mt-12">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <Card className="p-3 sm:p-4 bg-muted/30 border-muted mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-center leading-relaxed">
              <strong>Avertissement :</strong> MediSafe ne remplace pas l'avis d'un professionnel de santé. 
              Les informations présentées sont issues de sources officielles françaises (ANSM, CRAT, HAS, Santé publique France) 
              et sont fournies à titre indicatif.
            </p>
          </Card>
          <div className="text-center text-xs sm:text-sm text-muted-foreground space-y-1">
            <p className="leading-relaxed">Sources : ANSM • CRAT • HAS • Santé publique France • OMS • Institut Pasteur</p>
            <p className="leading-relaxed">© 2025 MediSafe • Application conforme RGPD • Aucune donnée personnelle collectée</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

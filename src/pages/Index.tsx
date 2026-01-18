import { Calculator, Syringe, Plane, TestTube } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MedicationSearch } from "@/components/MedicationSearch";
import { DosageSection } from "@/components/DosageSection";
import { VaccinationSection } from "@/components/VaccinationSection";
import { TravelSection } from "@/components/TravelSection";
import { TestsOfficineSection } from "@/components/TestsOfficineSection";
import logo from "@/assets/medisafe-logo.png";
const Index = () => {
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <img alt="MediSafe" className="h-16 sm:h-20 md:h-24 w-auto drop-shadow-lg object-cover border-primary-foreground" src="/lovable-uploads/3c1c070f-1f51-4d5b-8b3e-3f2670229449.png" />
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
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto gap-1.5 sm:gap-2 p-1.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
            <TabsTrigger value="medicament" className="gap-1 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300">
              Médicament
            </TabsTrigger>
            <TabsTrigger value="posologie" className="gap-1 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300">
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
              Posologie
            </TabsTrigger>
            <TabsTrigger value="vaccins" className="gap-1 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300">
              <Syringe className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mes </span>Vaccins
            </TabsTrigger>
            <TabsTrigger value="voyage" className="gap-1 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300">
              <Plane className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Prévention </span>Voyage
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-1 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300">
              <TestTube className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tests </span>Officine
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

          <TabsContent value="tests" className="space-y-3 sm:space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-1.5 sm:mb-2">Tests en officine</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Vérifiez les critères réglementaires avant de pratiquer un test au comptoir.
              </p>
            </div>
            <TestsOfficineSection />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 glass mt-8 sm:mt-10 md:mt-12 relative">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <Card className="p-3 sm:p-4 bg-secondary/30 border-border/50 mb-3 sm:mb-4 backdrop-blur-sm">
            <p className="text-xs sm:text-sm text-center leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Avertissement :</strong> MediSafe ne remplace pas l'avis d'un professionnel de santé. 
              Les informations présentées sont fournies à titre indicatif dans le cadre d'une aide à la pratique officinale.
            </p>
          </Card>
          <div className="text-center text-xs sm:text-sm text-muted-foreground space-y-2">
            <p className="leading-relaxed">
              <a href="/a-propos" className="text-primary hover:underline font-medium">
                Cadre scientifique et réglementaire
              </a>
            </p>
            <p className="leading-relaxed">© 2025 MediSafe • Application conforme RGPD • Aucune donnée personnelle collectée</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;
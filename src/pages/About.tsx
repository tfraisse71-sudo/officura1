import { Link } from "react-router-dom";
import { ArrowLeft, Shield, BookOpen, Brain, TestTube, Lock, AlertTriangle, Scale, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const About = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/">
                <img src="/lovable-uploads/3c1c070f-1f51-4d5b-8b3e-3f2670229449.png" alt="Offi·cura" className="h-12 sm:h-16 md:h-20 w-auto drop-shadow-lg" />
              </Link>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Retour à l'accueil</span>
                <span className="sm:hidden">Retour</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-10 max-w-4xl">
        <div className="space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Cadre scientifique et réglementaire
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Informations sur le positionnement professionnel, les sources et les limites d'utilisation d'Offi·cura
            </p>
          </div>

          {/* Section 1: Présentation générale */}
          <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  1. Présentation générale
                </h2>
                <div className="text-sm sm:text-base text-muted-foreground space-y-2 leading-relaxed">
                  <p>
                    Offi·cura est un <strong className="text-foreground">outil d'aide à la pratique officinale</strong> conçu 
                    pour accompagner les professionnels de santé dans leur exercice quotidien.
                  </p>
                  <p>
                    Destiné aux pharmaciens et préparateurs en pharmacie, cet outil vise à faciliter l'accès 
                    à des informations médicales synthétisées et structurées.
                  </p>
                  <p className="font-medium text-foreground bg-secondary/50 p-3 rounded-lg border-l-4 border-primary">
                    Offi·cura ne se substitue ni au jugement clinique du professionnel, ni aux recommandations 
                    officielles des autorités sanitaires, ni à la prescription médicale.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Nature des informations */}
          <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  2. Nature des informations fournies
                </h2>
                <div className="text-sm sm:text-base text-muted-foreground space-y-2 leading-relaxed">
                  <p>
                    Les informations présentées sur Offi·cura sont fournies <strong className="text-foreground">à titre indicatif</strong> dans 
                    le cadre d'une aide à la pratique officinale.
                  </p>
                  <p>
                    Elles visent à synthétiser et structurer des données issues de sources reconnues, 
                    afin de faciliter la prise de décision au comptoir.
                  </p>
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <p className="font-semibold text-destructive">
                      Les informations fournies ne constituent pas un diagnostic médical.
                    </p>
                    <p className="mt-2 text-sm">
                      La décision finale appartient toujours au professionnel de santé, qui reste 
                      seul juge de la conduite à tenir en fonction du contexte clinique.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3: Cadre scientifique et sources */}
          <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  3. Cadre scientifique et sources
                </h2>
                <div className="text-sm sm:text-base text-muted-foreground space-y-3 leading-relaxed">
                  <p>
                    Les contenus proposés par Offi·cura résultent d'une <strong className="text-foreground">synthèse indépendante</strong>, 
                    élaborée à partir des recommandations des autorités sanitaires et de la littérature scientifique.
                  </p>
                  <p>
                    Les références institutionnelles prises en compte incluent notamment :
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <li className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>ANSM (Agence nationale de sécurité du médicament)</span>
                    </li>
                    <li className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>HAS (Haute Autorité de Santé)</span>
                    </li>
                    <li className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Santé publique France</span>
                    </li>
                    <li className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Assurance Maladie</span>
                    </li>
                    <li className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>OMS (Organisation mondiale de la Santé)</span>
                    </li>
                    <li className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Institut Pasteur</span>
                    </li>
                  </ul>
                  <p className="font-medium text-foreground bg-secondary/50 p-3 rounded-lg border-l-4 border-blue-500 mt-4">
                    Les contenus ne constituent pas une reproduction de bases de données ou de contenus éditoriaux tiers. 
                    Ils sont reformulés et adaptés à un usage officinal.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 4: Référentiels spécialisés */}
          <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500 shrink-0">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  4. Référentiels spécialisés
                </h2>
                <div className="text-sm sm:text-base text-muted-foreground space-y-2 leading-relaxed">
                  <p>
                    Pour les thématiques sensibles telles que la <strong className="text-foreground">grossesse</strong>, 
                    l'<strong className="text-foreground">allaitement</strong> ou les situations cliniques particulières, 
                    les informations sont issues de référentiels cliniques spécialisés.
                  </p>
                  <p className="font-medium text-foreground bg-secondary/50 p-3 rounded-lg border-l-4 border-pink-500">
                    Données issues des recommandations en vigueur et de la littérature scientifique spécialisée.
                  </p>
                  <p>
                    Ces synthèses visent à fournir une aide pratique tout en respectant le cadre 
                    déontologique et réglementaire de la profession.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 5: Utilisation de l'IA */}
          <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500 shrink-0">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  5. Utilisation de l'intelligence artificielle
                </h2>
                <div className="text-sm sm:text-base text-muted-foreground space-y-2 leading-relaxed">
                  <p>
                    Offi·cura utilise des technologies d'intelligence artificielle pour <strong className="text-foreground">structurer, 
                    hiérarchiser et synthétiser</strong> l'information médicale.
                  </p>
                  <div className="space-y-2 mt-3">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-green-500 text-xs">✓</span>
                      </div>
                      <p>L'IA permet d'organiser et de présenter l'information de manière claire et accessible</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-destructive text-xs">✗</span>
                      </div>
                      <p>L'IA n'est pas une source médicale et ne génère pas de données cliniques</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-destructive text-xs">✗</span>
                      </div>
                      <p>L'IA ne prend aucune décision autonome concernant la prise en charge des patients</p>
                    </div>
                  </div>
                  <p className="font-medium text-foreground bg-secondary/50 p-3 rounded-lg border-l-4 border-violet-500 mt-3">
                    L'intelligence artificielle est un outil d'aide à la structuration de l'information, 
                    jamais un décideur ni un prescripteur.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 6: Tests et vaccination */}
          <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500 shrink-0">
                <TestTube className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  6. Tests en officine et vaccination
                </h2>
                <div className="text-sm sm:text-base text-muted-foreground space-y-2 leading-relaxed">
                  <p>
                    Les modules dédiés aux <strong className="text-foreground">tests en officine</strong> et à 
                    la <strong className="text-foreground">vaccination</strong> ont pour objectif de vérifier 
                    des critères réglementaires ou des conditions de réalisation.
                  </p>
                  <p>
                    Ces outils permettent au pharmacien de s'assurer de l'éligibilité d'un patient à un test 
                    ou à une vaccination selon les protocoles en vigueur.
                  </p>
                  <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20 mt-3">
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Ces modules n'établissent pas de diagnostic et ne remplacent pas un avis médical lorsque celui-ci est requis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 7: Données et confidentialité */}
          <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500 shrink-0">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  7. Données et confidentialité
                </h2>
                <div className="text-sm sm:text-base text-muted-foreground space-y-2 leading-relaxed">
                  <p>
                    Offi·cura a été conçu dans le respect du <strong className="text-foreground">RGPD</strong> et 
                    des principes de protection des données personnelles.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div className="bg-green-500/10 p-3 rounded-lg text-center border border-green-500/20">
                      <p className="font-semibold text-green-600 dark:text-green-400">Aucune collecte</p>
                      <p className="text-xs mt-1">de données de santé à caractère personnel</p>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-lg text-center border border-green-500/20">
                      <p className="font-semibold text-green-600 dark:text-green-400">Aucun stockage</p>
                      <p className="text-xs mt-1">des informations saisies par l'utilisateur</p>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-lg text-center border border-green-500/20">
                      <p className="font-semibold text-green-600 dark:text-green-400">Analyse instantanée</p>
                      <p className="text-xs mt-1">sans conservation des données</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 8: Limites de l'outil */}
          <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  8. Limites de l'outil
                </h2>
                <div className="text-sm sm:text-base text-muted-foreground space-y-2 leading-relaxed">
                  <p>
                    Comme tout outil d'aide à la décision, Offi·cura présente des limites qu'il convient de prendre en compte :
                  </p>
                  <ul className="space-y-2 mt-3">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                      <p><strong className="text-foreground">Évolution des recommandations :</strong> les recommandations scientifiques 
                      et réglementaires évoluent régulièrement. Offi·cura s'efforce de maintenir ses contenus à jour, mais 
                      la consultation des textes officiels reste recommandée.</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                      <p><strong className="text-foreground">Qualité des données saisies :</strong> la pertinence des résultats 
                      dépend directement de l'exactitude des informations fournies par l'utilisateur.</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                      <p><strong className="text-foreground">Complémentarité :</strong> Offi·cura ne remplace pas la consultation 
                      directe des textes officiels, des RCP ou des bases de données institutionnelles.</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 9: Responsabilité */}
          <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-slate-500/10 text-slate-500 shrink-0">
                <Scale className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  9. Responsabilité
                </h2>
                <div className="text-sm sm:text-base text-muted-foreground space-y-2 leading-relaxed">
                  <p>
                    L'utilisation d'Offi·cura s'effectue <strong className="text-foreground">sous la responsabilité 
                    du professionnel de santé</strong>, qui reste seul décisionnaire de la conduite à tenir 
                    vis-à-vis de ses patients.
                  </p>
                  <div className="bg-secondary/50 p-4 rounded-lg border border-border mt-3">
                    <p>
                      Offi·cura et ses concepteurs ne peuvent être tenus responsables d'une mauvaise interprétation 
                      des informations fournies, d'un usage inapproprié de l'outil ou de décisions prises sur 
                      la base des synthèses proposées.
                    </p>
                  </div>
                  <p>
                    En cas de doute clinique, le recours à un avis médical ou la consultation des sources 
                    officielles demeure indispensable.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 10: Conclusion */}
          <Card className="p-5 sm:p-6 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border-primary/20">
            <div className="space-y-4 text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                En résumé
              </h2>
              <div className="text-sm sm:text-base text-muted-foreground space-y-3 leading-relaxed max-w-2xl mx-auto">
                <p>
                  Offi·cura est un <strong className="text-foreground">outil d'aide à la pratique officinale</strong> qui 
                  vise à améliorer la lisibilité, l'accessibilité et la sécurité de l'information médicale 
                  au quotidien.
                </p>
                <p>
                  En synthétisant et en structurant les données issues des référentiels reconnus, Offi·cura 
                  accompagne le pharmacien dans sa mission de conseil et de prévention.
                </p>
                <p className="font-semibold text-primary text-base sm:text-lg pt-2">
                  Offi·cura ne remplace pas l'expertise du professionnel de santé.
                </p>
              </div>
            </div>
          </Card>

          <Separator className="my-6" />

          {/* Back to home */}
          <div className="text-center">
            <Link to="/">
              <Button variant="outline" size="lg" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 glass mt-8 sm:mt-10 relative">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            <p>© 2025 Offi·cura • Application conforme RGPD • Aucune donnée personnelle collectée</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;

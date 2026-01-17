import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medicationName } = await req.json();
    
    if (!medicationName) {
      throw new Error('Medication name is required');
    }

    console.log(`Searching equivalences for: ${medicationName}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

const systemPrompt = `Tu es un expert pharmacien français spécialisé dans les équivalences médicamenteuses.

## RÈGLES DE VÉRIFICATION OBLIGATOIRES - TRÈS IMPORTANT

### SOURCES OFFICIELLES EXCLUSIVES
Tu dois OBLIGATOIREMENT vérifier CHAQUE information sur ces sources AVANT de la communiquer :
1. **Base de données publique des médicaments** : base-donnees-publique.medicaments.gouv.fr
   - C'est la SEULE source de référence pour vérifier l'existence d'un médicament et ses dosages
2. **Répertoire des génériques ANSM** : ansm.sante.fr/documents/reference/repertoire-des-generiques
3. **RCP officiels** : accessibles via la base de données publique

### RÈGLES ABSOLUES DE PRÉCISION
1. **AUCUNE INVENTION** : Ne JAMAIS inventer un médicament ou un dosage
2. **VÉRIFICATION SYSTÉMATIQUE** : Si tu n'es pas 100% CERTAIN qu'un produit existe avec ce dosage exact en France, NE LE MENTIONNE PAS
3. **QUALITÉ > QUANTITÉ** : Mieux vaut 2 équivalents vérifiés que 10 douteux
4. **DOSAGES EXACTS** : Ne jamais approximer les dosages

### ERREURS CONNUES À ÉVITER ABSOLUMENT
- ❌ KARDEGIC existe UNIQUEMENT en 75mg et 160mg (JAMAIS 100mg, 300mg, 500mg)
- ❌ ASPIRINE PROTECT existe en 100mg et 300mg
- ❌ Ne confonds pas acide acétylsalicylique (aspirine) et paracétamol
- ❌ Vérifie TOUJOURS la molécule active réelle d'un médicament

### VÉRIFICATION DES MOLÉCULES
AVANT d'affirmer qu'un médicament contient une molécule, VÉRIFIE sur le RCP officiel.
Exemple d'erreur à éviter : ODDIBIL contient du BOLDO, pas du fumaria (fumeterre).

## CATÉGORIES D'ÉQUIVALENCES

### 1. ÉQUIVALENCES STRICTES (même molécule + même dosage)
- Molécule active (DCI) IDENTIQUE
- Dosage IDENTIQUE au mg près
- La forme galénique peut varier (comprimé, sachet, etc.)

### 2. GÉNÉRIQUES
- Liste UN SEUL générique représentatif
- Mentionne "Disponible auprès de multiples laboratoires" si c'est le cas

### 3. ÉQUIVALENTS PAR INDICATION
Pour les alternatives de parapharmacie avec MÊME INDICATION THÉRAPEUTIQUE :
- Autres médicaments avec molécule différente mais même indication
- Dispositifs médicaux
- Compléments alimentaires
- Produits homéopathiques

IMPORTANT : Ces produits doivent avoir la même indication thérapeutique PRINCIPALE.

## FORMAT DE RÉPONSE
Utilise la fonction display_equivalences avec des données VÉRIFIÉES UNIQUEMENT.`;

    const toolFunction = {
      type: "function",
      function: {
        name: "display_equivalences",
        description: "Affiche les équivalences strictes d'un médicament après vérification sur les sources officielles",
        parameters: {
          type: "object",
          properties: {
            medicationAnalysis: {
              type: "object",
              properties: {
                originalName: { type: "string", description: "Nom du médicament original" },
                dci: { type: "string", description: "Dénomination Commune Internationale (molécule active) VÉRIFIÉE sur le RCP" },
                dosage: { type: "string", description: "Dosage EXACT de la molécule active" },
                form: { type: "string", description: "Forme galénique" },
              },
              required: ["originalName", "dci", "dosage", "form"]
            },
            generics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Nom générique représentatif (un seul exemple suffit)" },
                  note: { type: "string", description: "Note comme 'Disponible auprès de nombreux laboratoires'" }
                },
                required: ["name"]
              },
              description: "UN SEUL générique représentatif (pas toute la liste des laboratoires)"
            },
            brandEquivalents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Nom de la spécialité avec dosage VÉRIFIÉ" },
                  form: { type: "string", description: "Forme galénique (comprimé, sachet, etc.)" },
                  laboratory: { type: "string", description: "Laboratoire fabricant" },
                  note: { type: "string", description: "Notes éventuelles (gastro-résistant, etc.)" }
                },
                required: ["name", "form"]
              },
              description: "Spécialités de marque avec MÊME molécule et MÊME dosage (vérifiées)"
            },
            indicationEquivalents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Nom du produit" },
                  productType: { type: "string", enum: ["Médicament", "Dispositif médical", "Complément alimentaire", "Homéopathie"], description: "Type de produit" },
                  indication: { type: "string", description: "Indication thérapeutique commune" },
                  activePrinciple: { type: "string", description: "Principe actif ou composant principal VÉRIFIÉ" },
                  note: { type: "string", description: "Pourquoi c'est une alternative valable" }
                },
                required: ["name", "productType", "indication"]
              },
              description: "Produits ayant la même indication thérapeutique mais molécule différente"
            },
            excipientWarnings: {
              type: "array",
              items: { type: "string" },
              description: "Excipients à effet notoire à signaler"
            },
            summary: {
              type: "array",
              items: { type: "string" },
              description: "Points clés vérifiés sur les équivalences"
            },
            substitutionAdvice: {
              type: "string",
              description: "Conseil de substitution pour le pharmacien"
            },
            verificationNote: {
              type: "string",
              description: "Note sur la vérification effectuée (ex: 'Données vérifiées sur base-donnees-publique.medicaments.gouv.fr')"
            }
          },
          required: ["medicationAnalysis", "generics", "brandEquivalents", "indicationEquivalents", "excipientWarnings", "summary", "substitutionAdvice", "verificationNote"]
        }
      }
    };

    // Utiliser le modèle flash pour des réponses rapides
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Recherche les équivalences pour le médicament : "${medicationName}"
          
INSTRUCTIONS IMPORTANTES :
1. Vérifie d'abord que ce médicament existe en France
2. Identifie sa molécule active EXACTE et son dosage EXACT via le RCP officiel
3. Ne liste que des équivalents dont tu es CERTAIN de l'existence et des dosages
4. Pour les équivalents par indication, propose des alternatives de parapharmacie pertinentes` }
        ],
        tools: [toolFunction],
        tool_choice: { type: "function", function: { name: "display_equivalences" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse));

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'display_equivalences') {
      throw new Error('Invalid AI response format');
    }

    const equivalenceData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(equivalenceData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in medication-equivalence function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

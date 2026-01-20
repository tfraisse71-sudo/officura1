import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EDITORIAL_RULES = `
## RÈGLES ÉDITORIALES OBLIGATOIRES (Medisafe)

### INTERDICTION FORMELLE DU COPIÉ-COLLÉ
- ❌ Ne JAMAIS copier mot pour mot des contenus de sites tiers
- ❌ Ne JAMAIS reprendre la structure exacte, tableaux ou formulations de sites institutionnels
- ❌ Ne JAMAIS reformuler de manière trop proche du texte source
- ✅ Tous les contenus doivent être REFORMULÉS, SYNTHÉTISÉS et ADAPTÉS à un usage officinal

### MÉTHODE DE RÉDACTION
- Synthétiser l'information essentielle
- Hiérarchiser les messages (priorité officinale)
- Langage clair, professionnel et concis
- Phrases courtes, lisibles au comptoir
- L'objectif est une AIDE À LA DÉCISION, pas une reproduction documentaire

### GESTION DES SOURCES
🔹 Sources pouvant être citées explicitement : ANSM, HAS, Santé publique France, OMS, Institut Pasteur
🔹 Sources à citer de manière INDIRECTE (CRAT, ameli) :
   - ❌ Ne JAMAIS afficher leur nom comme source directe
   - ✅ Utiliser : "Synthèse fondée sur les recommandations en vigueur et la littérature scientifique spécialisée"

### POSITIONNEMENT ÉDITORIAL
- Contenu présenté comme une synthèse indépendante
- Ne jamais se positionner comme alternative à un site institutionnel
- L'IA est un outil de structuration et de synthèse, pas une source

### MENTION DE SÉCURITÉ (sujets sensibles)
Pour grossesse, allaitement, tests : "Informations fournies à titre indicatif dans le cadre d'une aide à la pratique officinale. La décision finale revient au professionnel de santé."
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medicationName, mode } = await req.json();
    console.log(`Fetching ${mode} info for medication: ${medicationName}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = "";
    let toolFunction: any = {};
    
    switch (mode) {
      case "contre-indications":
        systemPrompt = `Tu es un expert médical français spécialisé dans l'analyse des contre-indications médicamenteuses.
        
${EDITORIAL_RULES}

### MISSION SPÉCIFIQUE
Fournis une SYNTHÈSE des contre-indications du médicament demandé, reformulée et adaptée à la pratique officinale.

### CLASSIFICATION DE SÉVÉRITÉ
- critical : Contre-indication ABSOLUE (ne jamais utiliser)
- high : Association DÉCONSEILLÉE (rapport bénéfice/risque défavorable)
- medium : Précaution d'emploi (surveillance nécessaire)
- low : À prendre en compte (risque mineur)
- safe : Pas de contre-indication connue

### FORMAT
- Synthétise et reformule les informations avec tes propres mots
- Phrases courtes et actionnables pour le comptoir
- Cite les sources autorisées (ANSM, HAS) de manière générique`;
        
        toolFunction = {
          name: "extract_contraindications",
          description: "Synthétiser les contre-indications d'un médicament français",
          parameters: {
            type: "object",
            properties: {
              severity: {
                type: "string",
                enum: ["critical", "high", "medium", "low", "safe"],
                description: "Niveau de sévérité global basé sur les CI les plus graves"
              },
              summary: {
                type: "array",
                items: { type: "string" },
                description: "Liste de 3-5 points clés SYNTHÉTISÉS et REFORMULÉS"
              },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" }
                  }
                },
                description: "Détails reformulés avec langage professionnel"
              }
            },
            required: ["severity", "summary", "details"],
            additionalProperties: false
          }
        };
        break;

      case "grossesse":
        systemPrompt = `Tu es un expert médical français spécialisé dans l'utilisation des médicaments pendant la grossesse.
        
${EDITORIAL_RULES}

### MISSION SPÉCIFIQUE
Fournis une SYNTHÈSE sur l'utilisation pendant la grossesse, reformulée et adaptée à la pratique officinale.

### CLASSIFICATION
- critical : Médicament CONTRE-INDIQUÉ pendant la grossesse
- high : Médicament DÉCONSEILLÉ (à éviter si possible)
- medium : Utilisation POSSIBLE avec précautions
- low : Médicament utilisable (données rassurantes)
- safe : Médicament de choix pendant la grossesse

### IMPORTANT
- Distinguer les trimestres si applicable
- Mentionner les risques connus de manière synthétique
- Terminer par : "Synthèse fondée sur les recommandations en vigueur et la littérature scientifique spécialisée."
- Ajouter la mention de sécurité pour sujets sensibles`;
        
        toolFunction = {
          name: "extract_pregnancy_info",
          description: "Synthétiser les informations sur l'usage pendant la grossesse",
          parameters: {
            type: "object",
            properties: {
              severity: {
                type: "string",
                enum: ["critical", "high", "medium", "low", "safe"]
              },
              summary: {
                type: "array",
                items: { type: "string" },
                description: "Points clés SYNTHÉTISÉS et REFORMULÉS"
              },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" }
                  }
                }
              }
            },
            required: ["severity", "summary", "details"],
            additionalProperties: false
          }
        };
        break;

      case "allaitement":
        systemPrompt = `Tu es un expert médical français spécialisé dans l'utilisation des médicaments pendant l'allaitement.
        
${EDITORIAL_RULES}

### MISSION SPÉCIFIQUE
Fournis une SYNTHÈSE sur l'utilisation pendant l'allaitement, reformulée et adaptée à la pratique officinale.

### CLASSIFICATION
- critical : Médicament CONTRE-INDIQUÉ pendant l'allaitement
- high : Allaitement DÉCONSEILLÉ sous ce traitement
- medium : Utilisation POSSIBLE avec précautions/surveillance du nourrisson
- low : Compatible avec l'allaitement (données rassurantes)
- safe : Médicament compatible, de choix pendant l'allaitement

### IMPORTANT
- Synthétiser le passage dans le lait maternel si pertinent
- Signaler les effets potentiels sur le nourrisson
- Terminer par : "Synthèse fondée sur les recommandations en vigueur et la littérature scientifique spécialisée."
- Ajouter la mention de sécurité pour sujets sensibles`;
        
        toolFunction = {
          name: "extract_breastfeeding_info",
          description: "Synthétiser les informations sur l'usage pendant l'allaitement",
          parameters: {
            type: "object",
            properties: {
              severity: {
                type: "string",
                enum: ["critical", "high", "medium", "low", "safe"]
              },
              summary: {
                type: "array",
                items: { type: "string" }
              },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" }
                  }
                }
              }
            },
            required: ["severity", "summary", "details"],
            additionalProperties: false
          }
        };
        break;

      case "indications-conseils":
        systemPrompt = `Tu es un expert médical français spécialisé dans l'analyse des indications thérapeutiques et modalités de prise.
        
${EDITORIAL_RULES}

### MISSION SPÉCIFIQUE
Fournis une SYNTHÈSE des indications et conseils de prise, reformulée et adaptée à la pratique officinale.

### INFORMATIONS À FOURNIR (synthétisées)
- Indications principales
- Moment de prise (avant/pendant/après repas)
- Précautions de prise pratiques
- Durée de traitement si applicable

### CLASSIFICATION
- safe : pour les indications validées
- medium : pour les mises en garde importantes
- high/critical : si précautions majeures`;
        
        toolFunction = {
          name: "extract_indications_and_advice",
          description: "Synthétiser les indications et conseils de prise",
          parameters: {
            type: "object",
            properties: {
              severity: {
                type: "string",
                enum: ["critical", "high", "medium", "low", "safe"]
              },
              summary: {
                type: "array",
                items: { type: "string" },
                description: "Points clés SYNTHÉTISÉS sur indications et conseils de prise"
              },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" }
                  }
                },
                description: "Détails reformulés avec langage professionnel"
              }
            },
            required: ["severity", "summary", "details"],
            additionalProperties: false
          }
        };
        break;

      default:
        throw new Error(`Mode non supporté: ${mode}`);
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Fournis une SYNTHÈSE REFORMULÉE pour le médicament français: ${medicationName}

RAPPELS IMPORTANTS :
- SYNTHÉTISE et REFORMULE avec tes propres mots (jamais de copié-collé)
- Phrases courtes et actionnables pour le comptoir
- Pour les sources sensibles (type référentiels grossesse/allaitement) : utilise "Synthèse fondée sur les recommandations en vigueur et la littérature scientifique spécialisée"
- L'objectif est une aide à la décision, pas une reproduction documentaire` }
        ],
        tools: [{
          type: "function",
          function: toolFunction
        }],
        tool_choice: { type: "function", function: { name: toolFunction.name } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Extracted data:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in medication-info function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      severity: 'medium',
      summary: ['Erreur lors de la récupération des données'],
      details: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

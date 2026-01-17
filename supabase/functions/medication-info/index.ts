import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VERIFICATION_RULES = `
## RÈGLES DE VÉRIFICATION OBLIGATOIRES

### SOURCES OFFICIELLES EXCLUSIVES - NE JAMAIS UTILISER D'AUTRES SOURCES
1. **ANSM** (Agence Nationale de Sécurité du Médicament) : ansm.sante.fr
2. **Base de données publique des médicaments** : base-donnees-publique.medicaments.gouv.fr
   - RCP (Résumé des Caractéristiques du Produit) : source principale
   - Notice patient
3. **CRAT** (Centre de Référence sur les Agents Tératogènes) : lecrat.fr
   - Source UNIQUE pour grossesse et allaitement
4. **Thésaurus ANSM des interactions médicamenteuses**

### RÈGLES ABSOLUES
- JAMAIS de sources étrangères (FDA, EMA générique, sites américains, etc.)
- JAMAIS d'informations non vérifiées ou approximatives
- En cas de doute, indiquer "Information à vérifier auprès d'un professionnel de santé"
- Citer systématiquement la source utilisée dans les détails
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
        
${VERIFICATION_RULES}

### MISSION SPÉCIFIQUE
Recherche les CONTRE-INDICATIONS officielles du médicament demandé UNIQUEMENT à partir du RCP officiel français.

### CLASSIFICATION DE SÉVÉRITÉ (selon le RCP)
- critical : Contre-indication ABSOLUE (ne jamais utiliser)
- high : Association DÉCONSEILLÉE (rapport bénéfice/risque défavorable)
- medium : Précaution d'emploi (surveillance nécessaire)
- low : À prendre en compte (risque mineur)
- safe : Pas de contre-indication connue

### FORMAT
Cite toujours la source (Section 4.3 du RCP pour les CI).`;
        
        toolFunction = {
          name: "extract_contraindications",
          description: "Extraire les contre-indications officielles d'un médicament français",
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
                description: "Liste de 3-5 points clés sur les contre-indications (issus du RCP)"
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
                description: "Détails avec mention de la source (ex: 'Selon RCP section 4.3')"
              }
            },
            required: ["severity", "summary", "details"],
            additionalProperties: false
          }
        };
        break;

      case "grossesse":
        systemPrompt = `Tu es un expert médical français spécialisé dans l'utilisation des médicaments pendant la grossesse.
        
${VERIFICATION_RULES}

### MISSION SPÉCIFIQUE
Recherche les informations sur l'utilisation pendant la GROSSESSE UNIQUEMENT sur :
1. **CRAT (lecrat.fr)** : source PRIORITAIRE et de référence
2. **RCP section 4.6** : Fertilité, grossesse et allaitement

### CLASSIFICATION (selon CRAT)
- critical : Médicament CONTRE-INDIQUÉ pendant la grossesse
- high : Médicament DÉCONSEILLÉ (à éviter si possible)
- medium : Utilisation POSSIBLE avec précautions
- low : Médicament utilisable (données rassurantes)
- safe : Médicament de choix pendant la grossesse

### IMPORTANT
- Distinguer les trimestres si applicable
- Mentionner les risques tératogènes connus
- Toujours recommander l'avis médical`;
        
        toolFunction = {
          name: "extract_pregnancy_info",
          description: "Extraire les informations officielles sur l'usage pendant la grossesse",
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
                description: "Points clés issus du CRAT et du RCP"
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
        
${VERIFICATION_RULES}

### MISSION SPÉCIFIQUE
Recherche les informations sur l'utilisation pendant l'ALLAITEMENT UNIQUEMENT sur :
1. **CRAT (lecrat.fr)** : source PRIORITAIRE et de référence
2. **RCP section 4.6** : Fertilité, grossesse et allaitement

### CLASSIFICATION (selon CRAT)
- critical : Médicament CONTRE-INDIQUÉ pendant l'allaitement
- high : Allaitement DÉCONSEILLÉ sous ce traitement
- medium : Utilisation POSSIBLE avec précautions/surveillance du nourrisson
- low : Compatible avec l'allaitement (données rassurantes)
- safe : Médicament compatible, de choix pendant l'allaitement

### IMPORTANT
- Mentionner le passage dans le lait maternel si connu
- Signaler les effets potentiels sur le nourrisson
- Toujours recommander l'avis médical`;
        
        toolFunction = {
          name: "extract_breastfeeding_info",
          description: "Extraire les informations officielles sur l'usage pendant l'allaitement",
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
        
${VERIFICATION_RULES}

### MISSION SPÉCIFIQUE
Recherche les INDICATIONS OFFICIELLES et les CONSEILS DE PRISE du médicament selon le RCP :
1. **Section 4.1** : Indications thérapeutiques
2. **Section 4.2** : Posologie et mode d'administration
3. **Notice patient** : Conseils pratiques de prise

### INFORMATIONS À FOURNIR
- Indications AMM officielles
- Moment de prise (avant/pendant/après repas)
- Précautions de prise (avec eau, à éviter avec certains aliments, etc.)
- Durée de traitement recommandée si applicable

### CLASSIFICATION
- safe : pour les indications validées AMM
- medium : pour les mises en garde importantes
- high/critical : si usage hors AMM signalé`;
        
        toolFunction = {
          name: "extract_indications_and_advice",
          description: "Extraire les indications officielles AMM et conseils de prise",
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
                description: "Points clés sur indications et conseils de prise"
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
                description: "Détails avec référence au RCP"
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
          { role: 'user', content: `Fournis les informations officielles VÉRIFIÉES pour le médicament français: ${medicationName}

RAPPEL IMPORTANT :
- Utilise UNIQUEMENT les sources officielles françaises (ANSM, RCP, CRAT)
- Vérifie chaque information avant de la communiquer
- En cas de doute, indique-le clairement` }
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

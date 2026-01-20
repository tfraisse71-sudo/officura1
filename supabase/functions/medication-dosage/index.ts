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
- ❌ Ne JAMAIS reprendre la structure exacte ou formulations de sites institutionnels
- ✅ Tous les contenus doivent être REFORMULÉS et ADAPTÉS à un usage officinal

### MÉTHODE DE RÉDACTION
- Synthétiser l'information essentielle
- Langage clair, professionnel et concis
- Phrases courtes, lisibles au comptoir
- L'objectif est une AIDE À LA DÉCISION

### GESTION DES SOURCES
🔹 Sources citables : ANSM, HAS
🔹 Présenter comme : "Synthèse fondée sur les référentiels cliniques reconnus"

### POSITIONNEMENT
- Contenu présenté comme une synthèse indépendante
- L'IA est un outil de structuration et de synthèse
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medicationName } = await req.json();
    console.log(`Fetching dosage info for medication: ${medicationName}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Tu es un expert médical français spécialisé dans les posologies médicamenteuses.

${EDITORIAL_RULES}

### RÈGLES DE PRÉCISION
- Les posologies doivent être exactes et correspondre aux données officielles françaises
- Ne JAMAIS inventer ou approximer une posologie
- En cas de doute, indiquer "À confirmer avec le professionnel de santé"

### FORMAT DES POSOLOGIES (synthétisé)
Pour chaque tranche d'âge/poids, fournir de manière concise :
- Voie d'administration
- Dose par prise
- Fréquence d'administration
- Doses maximales (par prise et par 24h)
- Notes pratiques importantes

### PRÉCISIONS IMPORTANTES
- Distinguer adultes et enfants clairement
- Mentionner les adaptations si applicable (insuffisance rénale/hépatique)
- Signaler les contre-indications d'âge`;

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
          { role: 'user', content: `Fournis les posologies SYNTHÉTISÉES pour le médicament français: ${medicationName}

INSTRUCTIONS :
1. Fournis les posologies par tranche d'âge et de poids
2. Inclus les doses maximales et les précautions
3. REFORMULE les informations de manière concise
4. Phrases courtes et actionnables pour le comptoir` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_dosages",
            description: "Synthétiser les posologies d'un médicament français",
            parameters: {
              type: "object",
              properties: {
                dosages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      age: { 
                        type: "string",
                        description: "Tranche d'âge (ex: Adulte, Enfant 6-12 ans, Nourrisson)"
                      },
                      poids: { 
                        type: "string",
                        description: "Tranche de poids si applicable (ex: >50kg, 15-25kg)"
                      },
                      voie: { 
                        type: "string",
                        description: "Voie d'administration (Orale, IV, IM, Rectale, etc.)"
                      },
                      dosePrise: { 
                        type: "string",
                        description: "Dose par prise (ex: 500mg, 10mg/kg)"
                      },
                      frequence: { 
                        type: "string",
                        description: "Fréquence d'administration (ex: 3x/jour, toutes les 6h)"
                      },
                      doseMaxPrise: { 
                        type: "string",
                        description: "Dose maximale par prise"
                      },
                      doseMax24h: { 
                        type: "string",
                        description: "Dose maximale par 24h"
                      },
                      notes: { 
                        type: "string",
                        description: "Notes pratiques SYNTHÉTISÉES (espacement minimum, précautions)"
                      }
                    },
                    required: ["age", "poids", "voie", "dosePrise", "frequence", "doseMaxPrise", "doseMax24h", "notes"]
                  }
                }
              },
              required: ["dosages"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_dosages" } }
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
    console.log('Extracted dosages:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in medication-dosage function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      dosages: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

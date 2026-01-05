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
    console.log(`Fetching dosage info for medication: ${medicationName}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Tu es un expert médical français spécialisé dans les posologies médicamenteuses.
    
RÈGLE ABSOLUE : Utilise UNIQUEMENT les sources officielles françaises :
- RCP officiels sur base-donnees-publique.medicaments.gouv.fr
- ANSM (Agence Nationale de Sécurité du Médicament)
- N'utilise JAMAIS d'informations provenant de sources étrangères (FDA, posologies américaines, etc.)
- Les posologies doivent correspondre aux AMM françaises

Recherche et fournis les posologies officielles du médicament français demandé selon le RCP.
Fournis des informations détaillées par tranche d'âge/poids incluant la voie d'administration, dose par prise, fréquence, dose max par prise et dose max par 24h.`;

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
          { role: 'user', content: `Fournis les posologies officielles complètes pour le médicament: ${medicationName}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_dosages",
            description: "Extraire les posologies d'un médicament",
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
                        description: "Tranche d'âge (ex: Adulte, Enfant 6-12 ans)"
                      },
                      poids: { 
                        type: "string",
                        description: "Tranche de poids si applicable (ex: >50kg, 15-25kg)"
                      },
                      voie: { 
                        type: "string",
                        description: "Voie d'administration (Orale, IV, IM, etc.)"
                      },
                      dosePrise: { 
                        type: "string",
                        description: "Dose par prise (ex: 500mg, 10mg/kg)"
                      },
                      frequence: { 
                        type: "string",
                        description: "Fréquence d'administration (ex: 3x/j, toutes les 6h)"
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
                        description: "Notes importantes (espacement, précautions)"
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

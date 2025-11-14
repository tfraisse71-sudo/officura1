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
    const { medicationName, mode } = await req.json();
    console.log(`Fetching ${mode} info for medication: ${medicationName}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build the appropriate prompt based on mode
    let systemPrompt = "";
    let toolFunction: any = {};
    
    switch (mode) {
      case "contre-indications":
        systemPrompt = `Tu es un expert médical spécialisé dans l'analyse des contre-indications médicamenteuses. 
        Recherche et fournis les contre-indications officielles du médicament demandé selon les sources françaises (ANSM, RCP).
        Classe la sévérité comme: critical (CI absolue), high (association déconseillée), medium (prudence), low (précaution), safe (compatible).`;
        
        toolFunction = {
          name: "extract_contraindications",
          description: "Extraire les contre-indications d'un médicament",
          parameters: {
            type: "object",
            properties: {
              severity: {
                type: "string",
                enum: ["critical", "high", "medium", "low", "safe"],
                description: "Niveau de sévérité de la contre-indication"
              },
              summary: {
                type: "array",
                items: { type: "string" },
                description: "Liste de 3-5 points clés résumant les contre-indications"
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
                description: "Détails approfondis sur les contre-indications"
              }
            },
            required: ["severity", "summary", "details"],
            additionalProperties: false
          }
        };
        break;

      case "grossesse":
        systemPrompt = `Tu es un expert médical spécialisé dans l'utilisation des médicaments pendant la grossesse.
        Recherche les informations officielles du CRAT et de l'ANSM sur l'utilisation de ce médicament pendant la grossesse.
        Classe la sévérité comme: critical (CI absolue), high (association déconseillée), medium (prudence), low (précaution), safe (compatible).`;
        
        toolFunction = {
          name: "extract_pregnancy_info",
          description: "Extraire les informations sur l'usage pendant la grossesse",
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
                description: "Points clés sur l'utilisation pendant la grossesse"
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
        systemPrompt = `Tu es un expert médical spécialisé dans l'utilisation des médicaments pendant l'allaitement.
        Recherche les informations officielles du CRAT sur l'utilisation de ce médicament pendant l'allaitement.
        Classe la sévérité comme: critical (CI absolue), high (association déconseillée), medium (prudence), low (précaution), safe (compatible).`;
        
        toolFunction = {
          name: "extract_breastfeeding_info",
          description: "Extraire les informations sur l'usage pendant l'allaitement",
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

      case "indications":
        systemPrompt = `Tu es un expert médical spécialisé dans l'analyse des indications thérapeutiques.
        Recherche et fournis les indications officielles du médicament selon l'ANSM et le RCP.
        Liste toutes les pathologies et conditions pour lesquelles ce médicament est indiqué.
        Classe la sévérité comme: critical, high, medium, low, safe (utilise "safe" pour les indications validées).`;
        
        toolFunction = {
          name: "extract_indications",
          description: "Extraire les indications thérapeutiques d'un médicament",
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
                description: "Liste de 3-5 points clés des principales indications"
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
                description: "Détails approfondis sur les indications par pathologie"
              }
            },
            required: ["severity", "summary", "details"],
            additionalProperties: false
          }
        };
        break;

      case "conseils-prise":
        systemPrompt = `Tu es un expert médical spécialisé dans les modalités de prise des médicaments.
        Recherche et fournis les conseils officiels de prise du médicament : pendant/en dehors des repas, avec/sans eau, moment de la journée, précautions particulières.
        Classe la sévérité comme: critical (consignes strictes), high (important), medium (recommandé), low (conseil), safe (flexible).`;
        
        toolFunction = {
          name: "extract_administration_advice",
          description: "Extraire les conseils de prise et d'administration",
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
                description: "Liste de 3-5 points clés sur les modalités de prise"
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
                description: "Détails sur les moments de prise, interactions alimentaires, etc."
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
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Fournis les informations officielles pour le médicament: ${medicationName}` }
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

    // Extract the tool call result
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

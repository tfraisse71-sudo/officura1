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

    const systemPrompt = `Tu es un expert en pharmacologie française. Tu recherches les équivalences strictes d'un médicament.

RÈGLE ABSOLUE : Utilise UNIQUEMENT les médicaments officiellement autorisés en France :
- Source principale : base-donnees-publique.medicaments.gouv.fr
- Répertoire des génériques de l'ANSM
- N'inclus JAMAIS de médicaments étrangers ou non commercialisés en France
- Tous les noms de médicaments doivent être des spécialités françaises avec AMM valide

Une équivalence stricte signifie :
- MÊME molécule(s) active(s) (DCI identique)
- MÊME dosage
- Forme galénique similaire (comprimé, gélule, etc.)

Tu dois identifier :
1. La DCI et le dosage du médicament français recherché
2. Les génériques officiels disponibles en France (répertoire ANSM)
3. Les autres spécialités de marque françaises avec la même composition
4. Les différences éventuelles (excipients à effet notoire, forme galénique, conditionnement)`;

    const toolFunction = {
      type: "function",
      function: {
        name: "display_equivalences",
        description: "Affiche les équivalences strictes d'un médicament",
        parameters: {
          type: "object",
          properties: {
            medicationAnalysis: {
              type: "object",
              properties: {
                originalName: { type: "string", description: "Nom du médicament original" },
                dci: { type: "string", description: "Dénomination Commune Internationale (molécule active)" },
                dosage: { type: "string", description: "Dosage de la molécule active" },
                form: { type: "string", description: "Forme galénique" },
              },
              required: ["originalName", "dci", "dosage", "form"]
            },
            generics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Nom du générique" },
                  laboratory: { type: "string", description: "Laboratoire fabricant" },
                  differences: { type: "string", description: "Différences éventuelles (excipients, etc.)" }
                },
                required: ["name", "laboratory"]
              },
              description: "Liste des génériques disponibles"
            },
            brandEquivalents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Nom de la spécialité" },
                  laboratory: { type: "string", description: "Laboratoire fabricant" },
                  differences: { type: "string", description: "Différences éventuelles" }
                },
                required: ["name", "laboratory"]
              },
              description: "Autres spécialités de marque équivalentes"
            },
            excipientWarnings: {
              type: "array",
              items: { type: "string" },
              description: "Excipients à effet notoire à signaler"
            },
            summary: {
              type: "array",
              items: { type: "string" },
              description: "Points clés à retenir sur les équivalences"
            },
            substitutionAdvice: {
              type: "string",
              description: "Conseil de substitution pour le pharmacien"
            }
          },
          required: ["medicationAnalysis", "generics", "brandEquivalents", "excipientWarnings", "summary", "substitutionAdvice"]
        }
      }
    };

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
          { role: 'user', content: `Recherche les équivalences strictes pour le médicament : "${medicationName}"` }
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

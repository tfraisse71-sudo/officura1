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
    const { searchTerm } = await req.json();
    console.log(`Searching for medications starting with: ${searchTerm}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Tu es un expert pharmaceutique français spécialisé dans la pharmacopée française.
    
RÈGLE ABSOLUE : Tu ne dois fournir QUE des médicaments officiellement autorisés en France par l'ANSM (Agence Nationale de Sécurité du Médicament).
- Utilise UNIQUEMENT les noms commerciaux français présents dans la base de données publique des médicaments (base-donnees-publique.medicaments.gouv.fr)
- N'inclus JAMAIS de médicaments étrangers, américains, ou non commercialisés en France
- Les noms doivent correspondre exactement aux spécialités françaises (ex: DOLIPRANE, EFFERALGAN, SPASFON, etc.)

Recherche et fournis une liste de médicaments français qui commencent par les lettres données.
Limite ta réponse à 10 médicaments maximum.`;

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
          { role: 'user', content: `Liste les médicaments français qui commencent par: ${searchTerm}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "list_medications",
            description: "Lister les médicaments français",
            parameters: {
              type: "object",
              properties: {
                medications: {
                  type: "array",
                  items: { type: "string" },
                  description: "Liste des noms de médicaments"
                }
              },
              required: ["medications"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "list_medications" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte", medications: [] }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants", medications: [] }), {
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
    console.log('Extracted medications:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-medications function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      medications: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

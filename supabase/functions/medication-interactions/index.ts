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
    const { medication1, medication2 } = await req.json();
    console.log(`Checking interactions between: ${medication1} and ${medication2}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Tu es un expert pharmacologue français spécialisé dans les interactions médicamenteuses.

## RÈGLES DE VÉRIFICATION OBLIGATOIRES

### SOURCE UNIQUE ET OBLIGATOIRE
**Thésaurus ANSM des interactions médicamenteuses** (ansm.sante.fr)
- C'est la SEULE référence officielle en France pour les interactions
- Disponible en PDF sur le site de l'ANSM
- Mis à jour régulièrement

### CLASSIFICATION OFFICIELLE ANSM (à respecter strictement)
1. **Contre-indication (critical)** : Association INTERDITE
   - Risque majeur pour le patient
   - Pas d'alternative possible dans l'association
   
2. **Association déconseillée (high)** : À ÉVITER
   - Rapport bénéfice/risque défavorable
   - Si indispensable, surveillance étroite

3. **Précaution d'emploi (medium)** : POSSIBLE avec surveillance
   - Association possible sous conditions
   - Adaptation posologique ou surveillance biologique

4. **À prendre en compte (low)** : INFORMATION
   - Risque d'addition d'effets indésirables
   - Pas de mesure particulière mais vigilance

5. **Pas d'interaction connue (safe)** : Aucune interaction référencée

### RÈGLES ABSOLUES
- N'utilise JAMAIS de sources étrangères (FDA, interactions américaines, etc.)
- Vérifie l'interaction par les DCI (molécules actives), pas les noms commerciaux
- Cite le mécanisme d'interaction si connu
- En cas de doute, classe en "medium" et recommande l'avis du pharmacien

### FORMAT DE RÉPONSE
- Toujours mentionner la classification ANSM exacte
- Expliquer le mécanisme si connu
- Proposer une conduite à tenir`;

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
          { 
            role: 'user', 
            content: `Analyse les interactions entre "${medication1}" et "${medication2}".

INSTRUCTIONS :
1. Identifie les molécules actives (DCI) de chaque médicament
2. Recherche l'interaction dans le Thésaurus ANSM
3. Classe selon la classification officielle ANSM
4. Explique le mécanisme et la conduite à tenir

Si aucune interaction n'est référencée dans le Thésaurus ANSM, indique-le clairement.` 
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_interactions",
            description: "Extraire les interactions médicamenteuses selon le Thésaurus ANSM",
            parameters: {
              type: "object",
              properties: {
                severity: {
                  type: "string",
                  enum: ["critical", "high", "medium", "low", "safe"],
                  description: "Classification ANSM : critical=CI, high=Déconseillée, medium=Précaution, low=À prendre en compte, safe=Pas d'interaction"
                },
                summary: {
                  type: "array",
                  items: { type: "string" },
                  description: "Points clés sur l'interaction (DCI concernées, classification ANSM, risque principal)"
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
                  description: "Détails : mécanisme, conduite à tenir, alternatives si besoin"
                }
              },
              required: ["severity", "summary", "details"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_interactions" } }
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
    console.error('Error in medication-interactions function:', error);
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

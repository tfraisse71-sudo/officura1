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
- ✅ Tous les contenus doivent être REFORMULÉS, SYNTHÉTISÉS et ADAPTÉS à un usage officinal

### MÉTHODE DE RÉDACTION
- Synthétiser l'information essentielle
- Hiérarchiser les messages (priorité officinale)
- Langage clair, professionnel et concis
- Phrases courtes, lisibles au comptoir
- L'objectif est une AIDE À LA DÉCISION, pas une reproduction documentaire

### GESTION DES SOURCES
🔹 Sources pouvant être citées : ANSM, HAS, Santé publique France
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
    const { medication1, medication2 } = await req.json();
    console.log(`Checking interactions between: ${medication1} and ${medication2}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Tu es un expert pharmacologue français spécialisé dans les interactions médicamenteuses.

${EDITORIAL_RULES}

### CLASSIFICATION OFFICIELLE (à respecter)
1. **Contre-indication (critical)** : Association INTERDITE - Risque majeur
2. **Association déconseillée (high)** : À ÉVITER - Rapport bénéfice/risque défavorable
3. **Précaution d'emploi (medium)** : POSSIBLE avec surveillance
4. **À prendre en compte (low)** : INFORMATION - Vigilance recommandée
5. **Pas d'interaction connue (safe)** : Aucune interaction référencée

### RÈGLES DE RÉDACTION
- Identifie les molécules actives (DCI), pas les noms commerciaux
- SYNTHÉTISE le mécanisme d'interaction avec tes propres mots
- Propose une conduite à tenir claire et actionnable
- En cas de doute, classe en "medium" et recommande l'avis du pharmacien`;

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
          { 
            role: 'user', 
            content: `Analyse et SYNTHÉTISE les interactions entre "${medication1}" et "${medication2}".

INSTRUCTIONS :
1. Identifie les molécules actives (DCI) de chaque médicament
2. Classe selon la classification officielle
3. REFORMULE le mécanisme et la conduite à tenir avec tes propres mots
4. Phrases courtes et actionnables pour le comptoir

Si aucune interaction n'est connue, indique-le clairement.` 
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_interactions",
            description: "Synthétiser les interactions médicamenteuses",
            parameters: {
              type: "object",
              properties: {
                severity: {
                  type: "string",
                  enum: ["critical", "high", "medium", "low", "safe"],
                  description: "Classification : critical=CI, high=Déconseillée, medium=Précaution, low=À prendre en compte, safe=Pas d'interaction"
                },
                summary: {
                  type: "array",
                  items: { type: "string" },
                  description: "Points clés SYNTHÉTISÉS (DCI, classification, risque principal)"
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
                  description: "Détails REFORMULÉS : mécanisme, conduite à tenir, alternatives"
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

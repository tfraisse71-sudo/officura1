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

    const systemPrompt = `Tu es un expert en pharmacologie française. Tu recherches TOUTES les équivalences d'un médicament basées sur la MÊME MOLÉCULE et le MÊME DOSAGE.

RÈGLES ABSOLUES DE PRÉCISION :
1. VÉRIFIE SOIGNEUSEMENT la composition EXACTE du médicament recherché avant de répondre
2. Ne confonds JAMAIS les médicaments entre eux
3. Si tu n'es pas CERTAIN à 100% de la composition exacte, indique-le clairement
4. NE FABRIQUE PAS d'informations

EXEMPLES DE COMPOSITIONS À CONNAÎTRE :
- ODDIBIL = Fumaria officinalis (fumeterre) - PAS d'acide ursodésoxycholique
- DELURSAN, URSOLVAN = Acide ursodésoxycholique
- DOLIPRANE = Paracétamol
- KARDEGIC, ASPIRINE, RESITUNE = Acide acétylsalicylique (aspirine)

SOURCES OBLIGATOIRES (France uniquement) :
- base-donnees-publique.medicaments.gouv.fr (source principale)
- Répertoire des génériques de l'ANSM
- RCP officiels des médicaments
- N'inclus JAMAIS de médicaments étrangers ou non commercialisés en France

CRITÈRES D'ÉQUIVALENCE (IMPORTANT) :
- MÊME molécule active (DCI identique) - obligatoire
- MÊME dosage - obligatoire  
- La forme galénique peut être DIFFÉRENTE (comprimé, sachet, poudre, effervescent, etc.)
- INCLURE toutes les spécialités contenant cette molécule à ce dosage

POUR LES GÉNÉRIQUES :
- Ne liste qu'UN SEUL générique représentatif (ex: "PARACETAMOL 500mg comprimé")
- N'énumère PAS tous les laboratoires (ils sont tous équivalents)
- Mentionne simplement "Disponible en générique" dans le summary

POUR LES SPÉCIALITÉS DE MARQUE :
- Liste TOUTES les spécialités françaises avec la même molécule et le même dosage
- INCLURE les différentes formes : sachets, comprimés, effervescents, etc.
- Exemple pour aspirine 100mg : KARDEGIC 100mg, ASPIRINE PROTECT 100mg, RESITUNE 100mg, etc.

PROCESSUS :
1. Identifie d'abord la DCI EXACTE et le dosage du médicament
2. Recherche TOUTES les spécialités françaises avec cette DCI et ce dosage
3. Regroupe par type (princeps, génériques, autres marques)`;


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
                  name: { type: "string", description: "Nom de la spécialité avec dosage" },
                  form: { type: "string", description: "Forme galénique (comprimé, sachet, etc.)" },
                  laboratory: { type: "string", description: "Laboratoire fabricant" },
                  note: { type: "string", description: "Notes éventuelles (gastro-résistant, etc.)" }
                },
                required: ["name", "form"]
              },
              description: "TOUTES les spécialités de marque avec même molécule et même dosage (toutes formes)"
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

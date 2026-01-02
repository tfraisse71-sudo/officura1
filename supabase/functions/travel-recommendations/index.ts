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
    const { country } = await req.json();
    
    if (!country) {
      return new Response(
        JSON.stringify({ error: 'Country is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Fetching travel recommendations for:', country);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en médecine des voyages et santé internationale. Tu fournis des recommandations sanitaires précises pour les voyageurs français.

Pour chaque pays, tu dois fournir:
1. Les vaccinations obligatoires (exigées pour l'entrée)
2. Les vaccinations recommandées
3. Les informations sur le paludisme (zones à risque, prophylaxie recommandée)
4. Les conseils pratiques de prévention
5. Les sources officielles avec leurs URLs EXACTES et FONCTIONNELLES

IMPORTANT pour les sources:
- Utilise UNIQUEMENT des URLs qui existent réellement et sont accessibles
- Pour l'Institut Pasteur: https://www.pasteur.fr/fr/centre-medical/preparer-son-voyage
- Pour Santé Publique France: https://www.santepubliquefrance.fr
- Pour le Ministère des Affaires étrangères: https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/conseils-par-pays-destination/
- Pour l'OMS: https://www.who.int/fr

Réponds UNIQUEMENT avec un JSON valide sans markdown, dans ce format exact:
{
  "vaccinsObligatoires": [
    { "name": "Nom du vaccin", "note": "Détails" }
  ],
  "vaccinsRecommandes": [
    { "name": "Nom du vaccin", "note": "Détails" }
  ],
  "prophylaxies": [
    {
      "name": "Paludisme",
      "zone": "Description des zones à risque",
      "traitement": "Traitements recommandés",
      "duree": "Durée du traitement",
      "contrindications": "Contre-indications principales"
    }
  ],
  "conseils": ["Conseil 1", "Conseil 2", "..."],
  "sources": [
    { "name": "Institut Pasteur - Centre médical", "url": "https://www.pasteur.fr/fr/centre-medical/preparer-son-voyage" },
    { "name": "Diplomatie.gouv.fr - Conseils voyageurs", "url": "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/" }
  ]
}

Si le paludisme n'est pas présent dans le pays, retourne un tableau prophylaxies vide.
Base tes recommandations sur les sources officielles françaises (Institut Pasteur, Santé Publique France, BEH).
Fournis TOUJOURS au moins 3 sources avec des URLs valides.`
          },
          {
            role: 'user',
            content: `Quelles sont les recommandations sanitaires et vaccinales pour un voyage en ${country} ?`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Trop de requêtes, veuillez réessayer.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits insuffisants.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response:', content);

    // Parse JSON from response
    let recommendations;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      recommendations = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Invalid AI response format');
    }

    return new Response(
      JSON.stringify({ success: true, data: recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in travel-recommendations function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

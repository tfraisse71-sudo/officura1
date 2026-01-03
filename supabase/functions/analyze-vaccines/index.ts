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
    const { age, completedVaccines, sex } = await req.json();
    
    if (age === undefined || age === null) {
      return new Response(
        JSON.stringify({ error: 'Age is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing vaccines for age:', age, 'completed:', completedVaccines, 'sex:', sex);

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
            content: `Tu es un expert en vaccination et calendrier vaccinal français 2024-2025. Tu analyses la situation vaccinale d'un patient en te basant sur les dernières recommandations officielles.

NOUVEAUX VACCINS ET MISES À JOUR 2024-2025 :
1. PNEUMOCOQUE - PREVENAR 20 (PCV20) :
   - Remplace progressivement Prevenar 13
   - Nourrissons : schéma 2+1 (2, 4, 11 mois)
   - Adultes 65+ ans : 1 dose recommandée (même si déjà vacciné Prevenar 13)
   - Personnes à risque (immunodéprimés, pathologies chroniques) : recommandé à tout âge
   - Peut être proposé aux adultes non vaccinés

2. MÉNINGOCOQUE B (Bexsero) :
   - Maintenant recommandé pour tous les nourrissons (2021+)
   - Rattrapage possible jusqu'à 24 ans

3. MÉNINGOCOQUE ACWY :
   - Recommandé à 11-14 ans
   - Obligatoire pour certains voyages

4. VRS (Virus Respiratoire Syncytial) - NOUVEAU 2024 :
   - Abrysvo ou Arexvy pour les 60+ ans
   - Beyfortus pour les nourrissons (anticorps monoclonaux)

5. COVID-19 :
   - Rappels recommandés pour 65+ ans et personnes à risque (automne)

RÈGLES DE RATTRAPAGE :
- Haemophilus influenzae b : UNIQUEMENT jusqu'à 5 ans
- Pneumocoque nourrisson : schéma adapté jusqu'à 2 ans, MAIS Prevenar 20 possible chez l'adulte à risque
- Méningocoque C : jusqu'à 24 ans
- HPV : 11-14 ans (2 doses), 15-19 ans rattrapage (3 doses), jusqu'à 26 ans pour HSH
- ROR : rattrapage possible à tout âge
- DTP : rappels à 25, 45, 65 ans puis tous les 10 ans

VACCINS ADULTES (nouveautés incluses) :
- DTP tous les 20 ans (puis 10 ans après 65)
- Grippe annuelle dès 65 ans
- Zona (Shingrix) dès 65 ans - 2 doses
- Pneumocoque (Prevenar 20) dès 65 ans ou si à risque
- VRS dès 60 ans (nouveau 2024)
- COVID rappel annuel si 65+ ou à risque

Réponds UNIQUEMENT avec un JSON valide sans markdown :
{
  "enRetard": [
    { "name": "Nom vaccin", "dueAge": "âge prévu", "note": "explication", "canCatchUp": true, "catchUpInfo": "comment rattraper" }
  ],
  "aVenir": [
    { "name": "Nom vaccin", "nextAge": "âge prévu", "note": "explication" }
  ],
  "nonRattrapables": [
    { "name": "Nom vaccin", "reason": "explication pourquoi trop tard" }
  ],
  "nouveauxVaccins": [
    { "name": "Nom vaccin", "indication": "pour qui", "note": "explication" }
  ],
  "recommandations": ["conseil personnalisé 1", "conseil personnalisé 2"]
}`
          },
          {
            role: 'user',
            content: `Patient de ${age} ans, sexe: ${sex || 'non précisé'}.

VACCINS DÉJÀ RÉALISÉS ET À JOUR: ${completedVaccines && completedVaccines.length > 0 ? completedVaccines.join(', ') : 'aucun indiqué'}.

IMPORTANT: Les vaccins cochés ci-dessus signifient que le patient est À JOUR pour ces vaccins (y compris les rappels nécessaires pour son âge). Ne les mets PAS dans "enRetard".

Analyse la situation vaccinale de ce patient selon le calendrier vaccinal français officiel:
- "enRetard": UNIQUEMENT les vaccins NON cochés qui auraient dû être faits et qui peuvent encore être rattrapés
- "aVenir": Les prochains vaccins/rappels à prévoir (y compris les futurs rappels des vaccins déjà faits)
- "nonRattrapables": Les vaccins NON cochés dont le délai est dépassé
- "recommandations": Conseils personnalisés`
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

    let analysis;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      analysis = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Invalid AI response format');
    }

    return new Response(
      JSON.stringify({ success: true, data: analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-vaccines function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

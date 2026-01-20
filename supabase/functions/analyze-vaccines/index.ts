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
    const { age, completedVaccines, sex, isPregnant } = await req.json();
    
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

    console.log('Analyzing vaccines for age:', age, 'completed:', completedVaccines, 'sex:', sex, 'isPregnant:', isPregnant);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en vaccination et calendrier vaccinal français. Tu analyses la situation vaccinale d'un patient en te basant sur les recommandations officielles.

## RÈGLES ÉDITORIALES OBLIGATOIRES (Medisafe)

### INTERDICTION FORMELLE DU COPIÉ-COLLÉ
- ❌ Ne JAMAIS copier mot pour mot des contenus de sites tiers
- ✅ Tous les contenus doivent être REFORMULÉS, SYNTHÉTISÉS et ADAPTÉS

### MÉTHODE DE RÉDACTION
- Synthétiser l'information essentielle
- Langage clair, professionnel et concis
- Phrases courtes, lisibles au comptoir
- L'objectif est une AIDE À LA DÉCISION

### GESTION DES SOURCES
🔹 Sources citables : Santé publique France, HAS
🔹 Ne jamais citer de source de manière directe dans le contenu

### MENTION DE SÉCURITÉ (obligatoire pour grossesse)
"Informations fournies à titre indicatif. La décision finale revient au professionnel de santé."

---

## RÈGLES TECHNIQUES

NOMENCLATURE IMPORTANTE :
- Le vaccin combiné Diphtérie-Tétanos-Coqueluche-Polio s'appelle "DTCP"
- N'utilise JAMAIS "DTP + Coqueluche" séparément
- Le vaccin DTCP inclut déjà la coqueluche

CALENDRIER VACCINAL 2024-2025 :

1. HPV (PAPILLOMAVIRUS) :
   - Vaccination systématique : 11-14 ans (2 doses)
   - RATTRAPAGE : possible de 15 à 26 ans révolus (3 doses) pour TOUS

2. PNEUMOCOQUE - PREVENAR 20 :
   - Nourrissons : schéma 2+1 (2, 4, 11 mois)
   - Adultes 65+ ans : 1 dose recommandée

3. MÉNINGOCOQUE B (Bexsero) :
   - Recommandé pour tous les nourrissons
   - Rattrapage possible jusqu'à 24 ans

4. VRS (NOUVEAU 2024) :
   - Abrysvo ou Arexvy pour les 60+ ans
   - RECOMMANDÉ pour femmes enceintes entre 32 et 36 SA

VACCINATIONS ET GROSSESSE :
- RECOMMANDÉS : Grippe, COVID-19, Coqueluche (20-36 SA), VRS (32-36 SA)
- CONTRE-INDIQUÉS : ROR, Varicelle, BCG, Fièvre jaune

RAPPELS ADULTES :
- DTCP : rappels à 25, 45, 65 ans puis tous les 10 ans
- Grippe : annuelle dès 65 ans
- Zona (Shingrix) : dès 65 ans

Réponds UNIQUEMENT avec un JSON valide sans markdown :
{
  "enRetard": [
    { "name": "Nom vaccin", "dueAge": "âge prévu", "note": "explication SYNTHÉTISÉE", "canCatchUp": true, "catchUpInfo": "comment rattraper" }
  ],
  "aVenir": [
    { "name": "Nom vaccin", "nextAge": "âge prévu", "note": "explication SYNTHÉTISÉE" }
  ],
  "nonRattrapables": [
    { "name": "Nom vaccin", "reason": "explication SYNTHÉTISÉE" }
  ],
  "nouveauxVaccins": [
    { "name": "Nom vaccin", "indication": "pour qui", "note": "explication SYNTHÉTISÉE" }
  ],
  "recommandations": ["conseil REFORMULÉ 1", "conseil REFORMULÉ 2"]
}`
          },
          {
            role: 'user',
            content: `Patient de ${age} ans, sexe: ${sex || 'non précisé'}${isPregnant ? ', ENCEINTE' : ''}.

VACCINS DÉJÀ RÉALISÉS ET À JOUR: ${completedVaccines && completedVaccines.length > 0 ? completedVaccines.join(', ') : 'aucun indiqué'}.

IMPORTANT: Les vaccins cochés signifient que le patient est À JOUR. Ne les mets PAS dans "enRetard".

${isPregnant ? `ATTENTION - PATIENTE ENCEINTE :
- Indique les vaccins RECOMMANDÉS pendant la grossesse
- Indique les vaccins CONTRE-INDIQUÉS
- Adapte les recommandations en conséquence` : ''}

Analyse la situation vaccinale avec des réponses SYNTHÉTISÉES et REFORMULÉES.`
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

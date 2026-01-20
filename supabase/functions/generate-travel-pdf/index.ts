import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TravelData {
  vaccinsObligatoires: { name: string; note: string }[];
  vaccinsRecommandes: { name: string; note: string }[];
  prophylaxies: {
    name: string;
    zone: string;
    traitement: string;
    duree: string;
    contrindications: string;
  }[];
  conseils: string[];
  sources?: { name: string; url: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country, travelData } = await req.json() as { country: string; travelData: TravelData };
    
    if (!country || !travelData) {
      return new Response(
        JSON.stringify({ error: 'Country and travelData are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating PDF summary for:', country);

    // Generate a well-formatted PDF content using AI
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
            content: `Tu es un expert en médecine des voyages. Tu dois créer un document synthétique et professionnel pour un voyageur.
Le document doit être clair, concis et formaté pour être facilement imprimable.

Crée un document COMPLET avec:
1. Un titre clair avec le pays et la date
2. Une section "Vaccinations obligatoires" avec tableau
3. Une section "Vaccinations recommandées" avec tableau
4. Une section "Prévention du paludisme" si applicable
5. Une section "Conseils pratiques" numérotés
6. Une section "Ressources utiles" avec les liens officiels
7. Un rappel de consulter un médecin avant le voyage

Utilise du HTML simple et propre (pas de CSS externe, styles inline basiques).
Les tableaux doivent avoir des bordures.
Utilise une police lisible.

Réponds UNIQUEMENT avec le HTML complet, prêt à être converti en PDF.`
          },
          {
            role: 'user',
            content: `Crée un document PDF synthétique pour un voyage en ${country} avec ces données:

VACCINS OBLIGATOIRES:
${travelData.vaccinsObligatoires?.map(v => `- ${v.name}: ${v.note}`).join('\n') || 'Aucun'}

VACCINS RECOMMANDÉS:
${travelData.vaccinsRecommandes?.map(v => `- ${v.name}: ${v.note}`).join('\n') || 'Aucun'}

PROPHYLAXIE PALUDISME:
${travelData.prophylaxies?.map(p => `
Zone: ${p.zone}
Traitement: ${p.traitement}
Durée: ${p.duree}
Contre-indications: ${p.contrindications}
`).join('\n') || 'Non applicable pour ce pays'}

CONSEILS:
${travelData.conseils?.map((c, i) => `${i + 1}. ${c}`).join('\n') || 'Aucun conseil spécifique'}

Date de génération: ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`
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
    let htmlContent = data.choices?.[0]?.message?.content;

    if (!htmlContent) {
      throw new Error('No content in AI response');
    }

    // Clean up HTML if wrapped in markdown
    htmlContent = htmlContent.trim();
    if (htmlContent.startsWith('```html')) {
      htmlContent = htmlContent.slice(7);
    } else if (htmlContent.startsWith('```')) {
      htmlContent = htmlContent.slice(3);
    }
    if (htmlContent.endsWith('```')) {
      htmlContent = htmlContent.slice(0, -3);
    }

    console.log('PDF HTML generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        html: htmlContent.trim(),
        filename: `prevention-voyage-${country.toLowerCase().replace(/\s+/g, '-')}.html`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-travel-pdf function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

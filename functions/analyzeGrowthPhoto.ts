import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dogId, photoUrl, dogBreed: rawDogBreed, dogBirthDate, currentWeight: rawCurrentWeight } = await req.json();
    if (!dogId || !photoUrl) return Response.json({ error: 'Missing dogId or photoUrl' }, { status: 400 });

    // Sanitize user-controlled strings before prompt injection
    const sanitize = (s: any, max = 500) => String(s || '').substring(0, max).replace(/[<>]/g, '');

    // Validate photo URL against allowlist to prevent SSRF
    const validateImageUrl = (url: string | undefined | null): string | null => {
      if (!url) return null;
      try {
        const parsed = new URL(url);
        const allowedHosts = ['base44.app', 'amazonaws.com', 's3.amazonaws.com'];
        if (!allowedHosts.some(h => parsed.hostname.endsWith(h))) return null;
        return url;
      } catch {
        return null;
      }
    };
    const safePhotoUrl = validateImageUrl(photoUrl);
    if (!safePhotoUrl) return Response.json({ error: 'Invalid photo URL' }, { status: 400 });
    const dogBreed = sanitize(rawDogBreed, 50);
    const safeWeight = typeof rawCurrentWeight === 'number' ? rawCurrentWeight : null;

    // Calculate age in months
    let ageMonths = null;
    if (dogBirthDate) {
      const birth = new Date(dogBirthDate);
      const now = new Date();
      ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    }

    const prompt = `Tu es un expert en morphologie canine. Analyse cette photo d'un chien (race: ${dogBreed || 'inconnue'}, âge: ${ageMonths ? ageMonths + ' mois' : 'inconnu'}, poids connu: ${safeWeight ? safeWeight + ' kg' : 'inconnu'}).

Évalue avec précision:
1. Le score de condition corporelle (BCS) sur 9 (1=très maigre, 5=idéal, 9=obèse)
2. Une estimation du poids en kg basée sur la morphologie visible (si le poids est connu, confirme ou corrige)
3. Une estimation de la hauteur au garrot en cm
4. Le stade de développement: puppy (<12 mois), adolescent (12-24 mois), adult (2-7 ans), senior (>7 ans)
5. Des observations détaillées sur la condition physique, la musculature, la silhouette

Réponds UNIQUEMENT en JSON avec ce format exact:
{
  "weight_kg": <nombre>,
  "height_cm": <nombre>,
  "body_condition_score": <1-9>,
  "growth_stage": "<puppy|adolescent|adult|senior>",
  "ai_notes": "<observations détaillées en français, 2-3 phrases>",
  "confidence": "<high|medium|low>"
}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [safePhotoUrl],
      response_json_schema: {
        type: "object",
        properties: {
          weight_kg: { type: "number" },
          height_cm: { type: "number" },
          body_condition_score: { type: "number" },
          growth_stage: { type: "string" },
          ai_notes: { type: "string" },
          confidence: { type: "string" }
        }
      }
    });

    return Response.json({ success: true, analysis: result });
  } catch (error) {
    console.error('analyzeGrowthPhoto error:', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
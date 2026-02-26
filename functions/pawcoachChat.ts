import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, systemPrompt } = await req.json();

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return Response.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pawcoach.app",
        "X-Title": "PawCoach",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return Response.json({ content });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
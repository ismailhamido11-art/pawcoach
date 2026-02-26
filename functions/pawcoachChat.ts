import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, systemPrompt, imageUrl } = await req.json();

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return Response.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 });

    let model = "deepseek/deepseek-chat";
    let lastUserMessage = messages[messages.length - 1];

    // If there's an image, use GPT-4o vision
    if (imageUrl) {
      model = "openai/gpt-4o";
      // Replace last user message with vision content
      const visionMessages = messages.slice(0, -1);
      visionMessages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl }
          },
          {
            type: "text",
            text: (lastUserMessage?.content || "Analyse cette image de mon chien.") + "\n\nNote: Décris ce que tu observes. Ne diagnostique jamais. Si tu vois des symptômes inquiétants, recommande de consulter un vétérinaire."
          }
        ]
      });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pawcoach.app",
          "X-Title": "PawCoach",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...visionMessages,
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
    }

    // Text-only with DeepSeek
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pawcoach.app",
        "X-Title": "PawCoach",
      },
      body: JSON.stringify({
        model,
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
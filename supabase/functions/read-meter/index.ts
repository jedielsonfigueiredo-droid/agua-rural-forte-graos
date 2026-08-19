// @ts-nocheck -- Supabase Edge Functions run in Deno, outside the Next.js runtime.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "vision-not-configured" }, 503);

  try {
    const { image, type = "water", previous = 0, multiplier = 1 } = await request.json();
    if (typeof image !== "string" || !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image)) {
      return json({ error: "invalid-image" }, 400);
    }
    if (image.length > 8_000_000) return json({ error: "image-too-large" }, 413);

    const isWater = type === "water";
    const prompt = isWater
      ? `Leia o hidrômetro desta foto. Priorize o contador mecânico retangular principal e ignore completamente os ponteiros circulares. Leia os algarismos da esquerda para a direita, identifique o multiplicador impresso junto ao visor (por exemplo X10) e calcule a leitura final em m³. O multiplicador cadastrado é ${Number(multiplier) || 1} e a leitura anterior é ${Number(previous) || 0}. Se houver rolete entre dois números, marque ambiguous=true e reduza confidence. Não invente algarismos.`
      : `Leia somente o valor acumulado do horímetro desta foto. Ignore rótulos, números de série e indicadores secundários. A leitura anterior é ${Number(previous) || 0}. Preserve casas decimais visíveis. Se algum dígito estiver ambíguo, marque ambiguous=true e reduza confidence.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        max_tokens: 180,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "meter_reading",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                display: { type: "string" },
                multiplier: { type: "number" },
                value: { type: "number" },
                confidence: { type: "number", minimum: 0, maximum: 100 },
                ambiguous: { type: "boolean" },
                reason: { type: "string" },
              },
              required: ["display", "multiplier", "value", "confidence", "ambiguous", "reason"],
            },
          },
        },
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image, detail: "high" } },
          ],
        }],
      }),
    });

    const payload = await response.json();
    if (!response.ok) return json({ error: "vision-provider-error" }, 502);
    const reading = JSON.parse(payload.choices?.[0]?.message?.content || "{}");
    const value = Number(reading.value);
    if (!Number.isFinite(value) || !String(reading.display || "").match(/\d/)) {
      return json({ error: "reading-not-found" }, 422);
    }

    const rawConfidence = Number(reading.confidence) || 0;
    return json({
      value: String(value),
      display: String(reading.display).replace(/[^\d.,]/g, ""),
      multiplier: Number(reading.multiplier) || 1,
      confidence: Math.round(rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence),
      ambiguous: Boolean(reading.ambiguous),
      reason: String(reading.reason || ""),
      source: "ai",
    });
  } catch {
    return json({ error: "processing-failed" }, 500);
  }
});

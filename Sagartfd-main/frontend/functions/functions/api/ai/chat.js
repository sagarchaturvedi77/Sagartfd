const TFD_SYSTEM_PROMPT = `
You are TFD-AI, the official AI assistant for The Financial Doctor and Sagar Chaturvedi.

Business rules:
- Speak only about The Financial Doctor, Sagar Chaturvedi, and the user's financial planning needs.
- Do not recommend, promote, compare, or name other advisory businesses, distributors, brokers, agencies, or competitor brands.
- Answer in the user's language: Hindi, English, or Hinglish.
- Cover mutual funds, SIP, STP, SWP, ELSS, PPF, NPS, tax planning, insurance, emergency fund, goal planning, retirement planning, and general finance questions.
- Ask clarifying questions when age, income, dependents, risk profile, time horizon, tax regime, or goal amount is missing.
- If the question is unrelated, politely refuse and bring the user back to finance, tax, insurance, or planning.

Compliance rules:
- Keep answers educational.
- Do not promise guaranteed returns.
- Do not give stock buy/sell/hold calls.
- Do not recommend specific mutual fund schemes unless approved data is provided.
- For tax, explain general rules and ask user to confirm with a qualified tax professional.
- Never ask for PAN, Aadhaar, OTP, card details, bank password, or full account number.
- Always add a short risk/disclaimer line for investment or insurance answers.

For onboarding or actual investing, direct users to:
https://www.assetplus.in/mfd/ARN-290298
or WhatsApp Sagar ji at +91 77738 05794.

You speak as TFD-AI, not as Sagar ji himself.
`;

const headers = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function sse(text) {
  return `data: ${String(text).replace(/\r/g, "").replace(/\n/g, "\ndata: ")}\n\n`;
}

function done(text) {
  return new Response(sse(text) + "event: done\ndata: [DONE]\n\n", {
    status: 200,
    headers,
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method === "GET") {
    return new Response("TFD AI function is live. Use POST for chat.", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (request.method !== "POST") {
    return done("Use POST for TFD-AI chat.");
  }

  try {
    const body = await request.json();
    const message = String(body.message || "").trim();

    if (!message) {
      return done("Please apna question type karein.");
    }

    if (!env.GEMINI_API_KEY) {
      return done("GEMINI_API_KEY Cloudflare environment me set nahi hai.");
    }

    const model = env.GEMINI_MODEL || "gemini-2.0-flash";

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: TFD_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
          },
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.log("Gemini error:", JSON.stringify(data));
      return done(
        "Sorry, abhi Gemini AI service connect nahi ho pa rahi hai. API key/model check karein."
      );
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        ?.join("") ||
      "Sorry, main abhi answer generate nahi kar pa raha hoon.";

    return done(answer);
  } catch (error) {
    console.log("AI function error:", error);
    return done("Sorry, abhi technical issue aa gaya hai. Kripya thoda baad try karein.");
  }
}

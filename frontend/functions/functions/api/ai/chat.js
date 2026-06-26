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

function sse(text) {
  return `data: ${String(text).replace(/\r/g, "").replace(/\n/g, "\ndata: ")}\n\n`;
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const message = String(body.message || "").trim();

    if (!message) {
      return new Response(sse("Please apna question type karein.") + "event: done\ndata: [DONE]\n\n", {
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(sse("GEMINI_API_KEY Cloudflare environment me set nahi hai.") + "event: done\ndata: [DONE]\n\n", {
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: env.GEMINI_MODEL || "gemini-3.5-flash",
        system_instruction: TFD_SYSTEM_PROMPT,
        input: message,
        generation_config: {
          temperature: 0.4,
          thinking_level: "low",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const detail = await geminiResponse.text();
      console.log("Gemini error:", detail);

      return new Response(
        sse("Sorry, abhi AI service connect nahi ho pa rahi hai. Thoda baad try karein ya Sagar ji se direct baat karein.") +
          "event: done\ndata: [DONE]\n\n",
        { headers: { "Content-Type": "text/event-stream" } }
      );
    }

    const data = await geminiResponse.json();
    const answer = data.output_text || "Sorry, main abhi answer generate nahi kar pa raha hoon.";

    return new Response(sse(answer) + "event: done\ndata: [DONE]\n\n", {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.log("AI function error:", error);

    return new Response(
      sse("Sorry, abhi technical issue aa gaya hai. Kripya thoda baad try karein.") +
        "event: done\ndata: [DONE]\n\n",
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }
}

export function onRequest() {
  return new Response("PING OK - Cloudflare function working", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

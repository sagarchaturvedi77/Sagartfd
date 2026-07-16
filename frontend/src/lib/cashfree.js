// Lazily loads Cashfree's Drop-in Checkout SDK (v3) once, and opens the
// hosted checkout for a given payment_session_id. Used by any page that
// needs to collect a Cashfree payment — not internship-specific.
let sdkPromise = null;

function loadCashfreeSdk() {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => (window.Cashfree ? resolve(window.Cashfree) : reject(new Error("Payment SDK failed to load")));
    script.onerror = () => reject(new Error("Could not load the payment SDK — check your connection and try again."));
    document.body.appendChild(script);
  });
  return sdkPromise;
}

export async function openCashfreeCheckout(paymentSessionId, cashfreeEnv, redirectTarget = "_self") {
  const CashfreeFactory = await loadCashfreeSdk();
  const cashfree = CashfreeFactory({ mode: cashfreeEnv === "production" ? "production" : "sandbox" });
  cashfree.checkout({ paymentSessionId, redirectTarget });
}

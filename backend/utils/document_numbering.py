"""Shared random document-number generator for certificates, letterheads,
offer/completion/experience letters, and invoices.

Deliberately NOT sequential (TFD/INT/2026/0001, 0002, 0003...) — a
predictable counter makes it trivial to enumerate/guess every document
ever issued (a real concern given these numbers feed a public
verification page), and also leaks business volume (e.g. invoice count)
to anyone who sees one number. Picks a random N-digit number instead and
retries on the rare collision, checked against the real collection so two
documents can never share a number.
"""
import random


async def generate_document_number(collection, number_field: str, code: str, year: int, digits: int = 6) -> str:
    prefix = f"TFD/{code}/{year}/"
    low, high = 10 ** (digits - 1), 10 ** digits - 1
    for _ in range(20):
        candidate = f"{prefix}{random.randint(low, high)}"
        exists = await collection.find_one({number_field: candidate}, {"_id": 1})
        if not exists:
            return candidate
    raise RuntimeError(f"Could not generate a unique {number_field} after 20 attempts")

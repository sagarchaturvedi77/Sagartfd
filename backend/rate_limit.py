"""Single shared slowapi Limiter instance — must be the same object
registered on app.state (server.py) and used by @limiter.limit(...)
decorators in route files, or the decorator's checks won't actually be
backed by the app's registered rate-limit state."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

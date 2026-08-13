from supabase import Client, create_client

from app.config.settings import settings

_client: Client | None = None


def get_db() -> Client:
    """Return a cached Supabase client (service role)."""
    global _client
    if _client is None:
        if not settings.supabase_url or not settings.supabase_service_key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_key: str = ""
    app_env: str = "development"
    openrouter_api_key: str = ""
    openrouter_model: str = "openrouter/free"
    coach_rate_limit_per_minute: int = 20
    coach_rate_limit_per_day: int = 200
    coach_max_message_length: int = 1000
    coach_max_context_messages: int = 20

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

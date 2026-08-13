from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_key: str = ""
    app_env: str = "development"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

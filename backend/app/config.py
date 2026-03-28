from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    google_client_id: str
    google_client_secret: str
    secret_key: str
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env"}


settings = Settings()

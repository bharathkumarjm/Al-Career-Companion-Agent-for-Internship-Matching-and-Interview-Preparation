from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    GROQ_API_KEY: str
    SECRET_KEY: str

    class Config:
        env_file = (".env", "backend/.env", "../.env")
        extra = "ignore"


settings = Settings()
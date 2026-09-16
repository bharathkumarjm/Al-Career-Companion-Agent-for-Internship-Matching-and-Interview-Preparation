from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    GROQ_API_KEY: str = ""
    SECRET_KEY: str = "InfosysAIInternship_2026_SecureKey_8392"

    class Config:
        env_file = (".env", "backend/.env", "../.env")
        extra = "ignore"


settings = Settings()
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "chunks"

    llm_base_url: str
    llm_api_key: str
    llm_model: str = "gpt-oss-120b"

    embedding_model: str = "BAAI/bge-small-en-v1.5"

    class Config:
        env_file = ".env"

settings = Settings()
from sentence_transformers import SentenceTransformer

class Embedder:
    def __init__(self, model_name: str):
        self.model = SentenceTransformer(model_name)

    def embed(self, texts: list[str]) -> list[list[float]]:
        # normalized embeddings help cosine distance
        vecs = self.model.encode(texts, normalize_embeddings=True).tolist()
        return vecs

    @property
    def dim(self) -> int:
        return self.model.get_sentence_embedding_dimension()
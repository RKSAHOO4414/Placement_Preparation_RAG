from qdrant_client.http import models as qm

def build_filter(collections: list[str]) -> qm.Filter | None:
    if not collections:
        return None
    return qm.Filter(
        must=[
            qm.FieldCondition(
                key="collection",
                match=qm.MatchAny(any=collections),
            )
        ]
    )
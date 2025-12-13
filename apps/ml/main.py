from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging

from services.sentiment import analyze_sentiment
from services.emotion import analyze_emotion
from services.toxicity import analyze_toxicity
from services.ner import extract_entities
from services.topics import assign_topics, train_topic_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DC Internet Listener ML Service")


class EnrichRequest(BaseModel):
    id: str
    text: str
    title: Optional[str] = None
    metadata: Optional[Dict] = None


class EnrichResponse(BaseModel):
    id: str
    language: str
    sentiment_label: str
    sentiment_score: float
    emotion_scores: Dict[str, float]
    toxicity_score: float
    entities: Dict[str, List[str]]
    keyphrases: List[str]
    embedding: Optional[List[float]] = None


class TopicBatchRequest(BaseModel):
    items: List[Dict[str, str]]  # [{id, text}, ...]


class TopicBatchResponse(BaseModel):
    assignments: Dict[str, List[Dict[str, any]]]  # {id: [{themeId, name, weight}]}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ml"}


@app.post("/nlp/enrich", response_model=EnrichResponse)
async def enrich_signal(request: EnrichRequest):
    """
    Enrich a single signal with NLP analysis:
    - Language detection
    - Sentiment analysis
    - Emotion classification
    - Toxicity detection
    - Named entity recognition
    - Keyphrase extraction
    - Embedding generation
    """
    try:
        combined_text = f"{request.title or ''} {request.text}".strip()

        # Detect language (simplified - assume English for MVP)
        language = "en"

        # Sentiment analysis
        sentiment_result = analyze_sentiment(combined_text)

        # Emotion analysis
        emotion_scores = analyze_emotion(combined_text)

        # Toxicity analysis
        toxicity_score = analyze_toxicity(combined_text)

        # Named entity recognition
        entities = extract_entities(combined_text)

        # Keyphrase extraction (simple for now - top words)
        keyphrases = extract_simple_keyphrases(combined_text)

        # TODO: Generate embedding with sentence-transformers
        # embedding = generate_embedding(combined_text)

        return EnrichResponse(
            id=request.id,
            language=language,
            sentiment_label=sentiment_result["label"],
            sentiment_score=sentiment_result["score"],
            emotion_scores=emotion_scores,
            toxicity_score=toxicity_score,
            entities=entities,
            keyphrases=keyphrases,
            embedding=None,  # TODO
        )

    except Exception as e:
        logger.error(f"Error enriching signal {request.id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/nlp/topics/batch", response_model=TopicBatchResponse)
async def batch_assign_topics(request: TopicBatchRequest):
    """
    Assign topics/themes to a batch of signals.
    Uses pre-trained topic model or trains one on-the-fly for small batches.
    """
    try:
        assignments = assign_topics([item["text"] for item in request.items])

        # Map back to IDs
        result = {}
        for i, item in enumerate(request.items):
            result[item["id"]] = assignments[i]

        return TopicBatchResponse(assignments=result)

    except Exception as e:
        logger.error(f"Error assigning topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def extract_simple_keyphrases(text: str, top_n: int = 5) -> List[str]:
    """Simple keyphrase extraction using word frequency (placeholder)"""
    from collections import Counter
    import re

    # Remove punctuation and lowercase
    words = re.findall(r'\b\w+\b', text.lower())

    # Remove common stopwords
    stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being'}
    words = [w for w in words if w not in stopwords and len(w) > 3]

    # Get top words
    counter = Counter(words)
    return [word for word, count in counter.most_common(top_n)]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

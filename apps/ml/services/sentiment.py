from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

# Load sentiment analysis model (cached globally)
sentiment_analyzer = None


def get_sentiment_analyzer():
    global sentiment_analyzer
    if sentiment_analyzer is None:
        logger.info("Loading sentiment analysis model...")
        sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )
    return sentiment_analyzer


def analyze_sentiment(text: str) -> dict:
    """
    Analyze sentiment of text.
    Returns: {label: 'positive' | 'negative', score: float}
    """
    if not text or len(text.strip()) == 0:
        return {"label": "neutral", "score": 0.5}

    try:
        analyzer = get_sentiment_analyzer()
        result = analyzer(text[:512])[0]  # Truncate to model max length

        # Map to our schema
        label = result["label"].lower()
        score = result["score"]

        # Normalize to positive/neutral/negative
        if label == "positive":
            return {"label": "positive", "score": score}
        elif label == "negative":
            return {"label": "negative", "score": score}
        else:
            return {"label": "neutral", "score": 0.5}

    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        return {"label": "neutral", "score": 0.5}

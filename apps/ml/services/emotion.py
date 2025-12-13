from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

# Load emotion classification model
emotion_classifier = None


def get_emotion_classifier():
    global emotion_classifier
    if emotion_classifier is None:
        logger.info("Loading emotion classification model...")
        emotion_classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=None
        )
    return emotion_classifier


def analyze_emotion(text: str) -> dict:
    """
    Analyze emotions in text.
    Returns: {joy: float, anger: float, fear: float, sadness: float, ...}
    """
    if not text or len(text.strip()) == 0:
        return {}

    try:
        classifier = get_emotion_classifier()
        results = classifier(text[:512])[0]

        # Convert to our schema
        emotions = {}
        for item in results:
            emotion = item["label"].lower()
            score = item["score"]
            emotions[emotion] = round(score, 3)

        return emotions

    except Exception as e:
        logger.error(f"Emotion analysis error: {e}")
        return {}

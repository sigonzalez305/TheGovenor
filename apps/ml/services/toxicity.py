from detoxify import Detoxify
import logging

logger = logging.getLogger(__name__)

# Load toxicity model
toxicity_model = None


def get_toxicity_model():
    global toxicity_model
    if toxicity_model is None:
        logger.info("Loading toxicity detection model...")
        toxicity_model = Detoxify('original')
    return toxicity_model


def analyze_toxicity(text: str) -> float:
    """
    Analyze toxicity of text.
    Returns: float between 0 and 1
    """
    if not text or len(text.strip()) == 0:
        return 0.0

    try:
        model = get_toxicity_model()
        result = model.predict(text)

        # Return overall toxicity score
        return round(result["toxicity"], 3)

    except Exception as e:
        logger.error(f"Toxicity analysis error: {e}")
        return 0.0

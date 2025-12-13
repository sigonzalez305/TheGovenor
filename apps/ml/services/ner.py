import spacy
import logging

logger = logging.getLogger(__name__)

# Load spaCy NER model
nlp = None


def get_nlp_model():
    global nlp
    if nlp is None:
        logger.info("Loading spaCy NER model...")
        nlp = spacy.load("en_core_web_sm")
    return nlp


def extract_entities(text: str) -> dict:
    """
    Extract named entities from text.
    Returns: {
        places: [str],
        organizations: [str],
        people: [str],
        addresses: [str]
    }
    """
    if not text or len(text.strip()) == 0:
        return {
            "places": [],
            "organizations": [],
            "people": [],
            "addresses": []
        }

    try:
        nlp_model = get_nlp_model()
        doc = nlp_model(text[:1000])  # Process first 1000 chars

        places = []
        organizations = []
        people = []
        addresses = []

        for ent in doc.ents:
            if ent.label_ in ["GPE", "LOC"]:
                places.append(ent.text)
            elif ent.label_ == "ORG":
                organizations.append(ent.text)
            elif ent.label_ == "PERSON":
                people.append(ent.text)
            elif ent.label_ in ["FAC", "ADDRESS"]:
                addresses.append(ent.text)

        return {
            "places": list(set(places)),
            "organizations": list(set(organizations)),
            "people": list(set(people)),
            "addresses": list(set(addresses))
        }

    except Exception as e:
        logger.error(f"NER error: {e}")
        return {
            "places": [],
            "organizations": [],
            "people": [],
            "addresses": []
        }

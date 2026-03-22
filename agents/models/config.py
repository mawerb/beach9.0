import os
from dotenv import find_dotenv, load_dotenv
from uagents_core.identity import Identity

load_dotenv(find_dotenv())


def _first_env(*keys: str) -> str | None:
    """Return the first non-empty env value for any of the given keys."""
    for key in keys:
        val = os.getenv(key)
        if val:
            return val
    return None


# Reply Curator (reply suggestions) — prefer REPLY_CURATOR_SEED_PHRASE; ALICE_* still works
REPLY_CURATOR_SEED = _first_env("REPLY_CURATOR_SEED_PHRASE", "ALICE_SEED_PHRASE")

# Synthesizer (synopsis + optional Mongo) — prefer SYNTHESIZER_SEED_PHRASE; BOB_* still works
SYNTHESIZER_SEED = _first_env("SYNTHESIZER_SEED_PHRASE", "BOB_SEED_PHRASE")

ORCHESTRATOR_SEED = os.getenv("ORCHESTRATOR_SEED_PHRASE")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "fetch_help")

REPLY_CURATOR_ADDRESS = Identity.from_seed(seed=REPLY_CURATOR_SEED, index=0).address
SYNTHESIZER_ADDRESS = Identity.from_seed(seed=SYNTHESIZER_SEED, index=0).address

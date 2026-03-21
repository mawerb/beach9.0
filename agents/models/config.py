import os
from dotenv import find_dotenv, load_dotenv
from uagents_core.identity import Identity

load_dotenv(find_dotenv())

ALICE_SEED = os.getenv("ALICE_SEED_PHRASE")
SYNOPSIS_SEED = os.getenv("BOB_SEED_PHRASE")
ORCHESTRATOR_SEED = os.getenv("ORCHESTRATOR_SEED_PHRASE")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "fetch_help")

ALICE_ADDRESS = Identity.from_seed(seed=ALICE_SEED, index=0).address
SYNOPSIS_ADDRESS = Identity.from_seed(seed=SYNOPSIS_SEED, index=0).address

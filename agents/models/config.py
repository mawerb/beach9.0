import os
from dotenv import find_dotenv, load_dotenv
from uagents_core.identity import Identity

load_dotenv(find_dotenv())

ALICE_SEED = os.getenv("ALICE_SEED_PHRASE")
SYNOPSIS_SEED = os.getenv("BOB_SEED_PHRASE")
ORCHESTRATOR_SEED = os.getenv("ORCHESTRATOR_SEED_PHRASE")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

ALICE_ADDRESS = Identity.from_seed(seed=ALICE_SEED, index=0).address
SYNOPSIS_ADDRESS = Identity.from_seed(seed=SYNOPSIS_SEED, index=0).address

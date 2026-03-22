reply-curator:
	python -m agents.reply_curator.reply_curator_fetchai_wrapped_agent

synthesizer:
	python -m agents.synthesizer.synthesizer_fetchai_wrapped_agent

# Backward-compatible aliases
alice: reply-curator

bob: synthesizer

orchestrator:
	python -m agents.orchestrator.orchestrator_fetchai_wrapped_agent

api:
	uvicorn agents.api.server:app --reload --port 8000

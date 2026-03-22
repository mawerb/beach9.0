alice:
	python -m agents.alice.alice_fetchai_wrapped_agent

bob:
	python -m agents.bob.bob_fetchai_wrapped_agent

orchestrator:
	python -m agents.orchestrator.orchestrator_fetchai_wrapped_agent

api:
	uvicorn agents.api.server:app --reload --port 8000

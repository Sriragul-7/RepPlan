from app.main import app


def test_health() -> None:
    client = app  # noqa: F841
    assert app.title == "RepPlan API"

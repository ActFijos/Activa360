from src.web.app import create_app


def test_web_dashboard_and_form_validation() -> None:
    app = create_app()
    client = app.test_client()

    response = client.get("/")
    assert response.status_code == 200
    assert b"Dashboard" in response.data

    invalid_response = client.post(
        "/register",
        data={
            "asset_id": "",
            "nombre": "",
            "responsable": "",
        },
    )
    assert invalid_response.status_code == 400
    assert b"El formulario contiene errores" in invalid_response.data

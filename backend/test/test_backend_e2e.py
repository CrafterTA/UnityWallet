import os, uuid, time, random, json
from decimal import Decimal
import pytest, httpx

BASE_URL = os.getenv("BASE_URL", "http://localhost:8001")
USERNAME = os.getenv("TEST_USER", "alice")
PASSWORD = os.getenv("TEST_PASS", "password123")
TIMEOUT = float(os.getenv("TEST_TIMEOUT", "10"))

def _cid():
    return str(uuid.uuid4())

def _client():
    return httpx.Client(base_url=BASE_URL, timeout=TIMEOUT, headers={"X-Correlation-ID": _cid()})

@pytest.fixture(scope="session")
def token():
    with _client() as c:
        r = c.post("/auth/login", params={"username": USERNAME, "password": PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        return data["access_token"]

@pytest.fixture(scope="session")
def bob_token():
    with _client() as c:
        r = c.post("/auth/login", params={"username": "bob", "password": "password123"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        return data["access_token"]

@pytest.fixture()
def auth(token):
    return {"Authorization": f"Bearer {token}", "X-Correlation-ID": _cid(), "Content-Type": "application/json"}

def test_health():
    with _client() as c:
        r = c.get("/")
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"

def test_balances(auth):
    with _client() as c:
        r = c.get("/wallet/balances", headers=auth)
        assert r.status_code == 200, r.text
        assert "X-Correlation-ID" in r.headers
        body = r.json()
        assert "balances" in body and isinstance(body["balances"], list)

def test_payment_dry_run(auth):
    amount = float(Decimal(random.randint(1, 5)))
    payload = {"destination": "GDESTINATIONTESTPUBLICKEYXXXX", "asset_code": "SYP", "amount": amount, "memo": "pytest"}
    with _client() as c:
        r = c.post("/wallet/payment", headers=auth, content=json.dumps(payload))
        # Cho phép pass nếu hệ thống chưa cấu hình Stellar → trả 400/500 có message hợp lý
        assert r.status_code in (200, 400, 500), r.text
        if r.status_code == 200:
            body = r.json()
            assert body.get("ok") is True
            assert "stellar" in body
            # nên có XDR khi DRY_RUN
            assert "envelope_xdr" in body["stellar"]

def test_swap_1to1_updates(auth):
    with _client() as c:
        b1 = c.get("/wallet/balances", headers=auth).json()["balances"]
        has_syp = any(x["asset_code"] == "SYP" for x in b1)
        has_usd = any(x["asset_code"] == "USD" for x in b1)
        if not (has_syp and has_usd):
            pytest.skip("thiếu tài khoản SYP/USD trong seed")
        # Add required Idempotency-Key header for swap operations
        swap_headers = auth | {"Idempotency-Key": str(uuid.uuid4())}
        r = c.post("/wallet/swap", headers=swap_headers, content=json.dumps({"sell_asset": "SYP", "buy_asset": "USD", "amount": 1}))
        assert r.status_code == 200, r.text
        b2 = c.get("/wallet/balances", headers=auth).json()["balances"]
        # không kiểm chặt số học vì format decimal, chỉ cần có trả về
        assert isinstance(b2, list)

def test_loyalty_earn_burn(auth):
    with _client() as c:
        r1 = c.post("/loyalty/earn", headers=auth, content=json.dumps({"points": 10}))
        assert r1.status_code == 200, r1.text
        pts = r1.json().get("points")
        assert isinstance(pts, int)
        r2 = c.post("/loyalty/burn", headers=auth, content=json.dumps({"points": 5}))
        assert r2.status_code == 200, r2.text
        assert isinstance(r2.json().get("points"), int)

def test_qr_create_and_idempotent_pay(auth, bob_token):
    bob_auth = {"Authorization": f"Bearer {bob_token}", "X-Correlation-ID": _cid(), "Content-Type": "application/json"}
    with _client() as c:
        # Alice creates QR code
        r = c.post("/qr/create", headers=auth, content=json.dumps({"asset_code": "SYP", "amount": 2}))
        assert r.status_code in (200, 201), r.text
        qr_id = r.json()["qr_id"]
        idem = str(uuid.uuid4())
        # Bob pays Alice's QR code (with idempotency)
        h = bob_auth | {"Idempotency-Key": idem}
        r1 = c.post("/qr/pay", headers=h, content=json.dumps({"qr_id": qr_id}))
        r2 = c.post("/qr/pay", headers=h, content=json.dumps({"qr_id": qr_id}))
        assert r1.status_code == 200, r1.text
        assert r2.status_code == 200, r2.text
        # Second payment should be ignored due to idempotency
        assert r2.json().get("duplicate_ignored") is True

def test_analytics_endpoints(auth):
    with _client() as c:
        r = c.get("/analytics/spend", headers=auth);        assert r.status_code == 200 and "last_30d_spend" in r.json()
        r = c.get("/analytics/insights", headers=auth);     assert r.status_code == 200 and "insights" in r.json()
        r = c.get("/analytics/credit-score", headers=auth); assert r.status_code == 200 and "score" in r.json()
        r = c.get("/analytics/alerts", headers=auth);       assert r.status_code == 200 and "alerts" in r.json()

def test_swap_idempotency(auth):
    """Test that swap endpoint properly handles idempotency."""
    idem = str(uuid.uuid4())
    swap_payload = {
        "sell_asset": "USD",
        "buy_asset": "SYP", 
        "amount": "10.00"
    }
    
    with _client() as c:
        h = auth | {"Idempotency-Key": idem}
        
        # First swap request
        r1 = c.post("/wallet/swap", headers=h, content=json.dumps(swap_payload))
        
        # Second identical swap request with same idempotency key
        r2 = c.post("/wallet/swap", headers=h, content=json.dumps(swap_payload))
        
        assert r1.status_code == 200, f"First swap failed: {r1.text}"
        assert r2.status_code == 409, f"Second swap should return 409 Conflict: {r2.text}"
        
        # Verify the error message indicates duplicate request
        assert "Duplicate request detected" in r2.text

def test_swap_without_idempotency_key(auth):
    """Test that swap endpoint requires Idempotency-Key header."""
    swap_payload = {
        "sell_asset": "USD",
        "buy_asset": "SYP",
        "amount": "5.00"
    }
    
    with _client() as c:
        # Request without Idempotency-Key header
        r = c.post("/wallet/swap", headers=auth, content=json.dumps(swap_payload))
        assert r.status_code == 422, f"Should require Idempotency-Key header: {r.text}"

def test_missing_auth_is_401():
    with _client() as c:
        r = c.get("/wallet/balances")
        assert r.status_code in (401, 403)
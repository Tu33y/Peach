import uuid
from locust import HttpUser, task, between

class MarketplaceLoadTestUser(HttpUser):
    # Simulate user pacing (between 1 and 3 seconds between actions)
    wait_time = between(1, 3)

    def on_start(self):
        # 1. Self-register unique user session
        self.username = f"user_{uuid.uuid4().hex[:8]}"
        self.password = "LoadTestPass123!"

        # Determine a random role
        # Most users are clients; some are providers
        import random
        self.role = "client" if random.random() > 0.3 else "provider"

        self.client.post("/api/v1/auth/register", json={
            "username": self.username,
            "password": self.password,
            "role": self.role
        })

        # 2. Login to retrieve token
        response = self.client.post("/api/v1/auth/login", json={
            "username": self.username,
            "password": self.password
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.headers = {}

    @task(3)
    def browse_and_search_services(self):
        # Fetch services list with custom search term
        self.client.get("/api/v1/services?query=lavatrice", headers=self.headers)

    @task(1)
    def retrieve_categories(self):
        self.client.get("/api/v1/categories", headers=self.headers)

    @task(2)
    def view_wallet_details(self):
        self.client.get("/api/v1/wallet/me", headers=self.headers)

    @task(1)
    def send_chat_message(self):
        # Simulate contacting mario_rossi demo contact
        self.client.post("/api/v1/messages", json={
            "recipient_id": "mario_rossi",
            "text": "Hello, I am interested in booking your service."
        }, headers=self.headers)

    @task(1)
    def read_chat_history(self):
        self.client.get("/api/v1/messages/mario_rossi", headers=self.headers)

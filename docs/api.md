# API Specifications (/api/v1/)

All endpoints are standardized under the `/api/v1/` prefix path.

## Endpoint Index

### 1. Authentication & Security
- `POST /auth/register`: Create a new Client or Provider account.
- `POST /auth/login`: Authenticate credentials, returning JWT access & refresh tokens (returns 2FA challenge status if active).
- `POST /auth/2fa/setup`: Generates TOTP secret and Google Authenticator-compatible QR code (Base64).
- `POST /auth/2fa/enable`: Verify TOTP validation code and enable 2FA challenge.
- `POST /auth/2fa/disable`: Disable 2FA after validation.

### 2. Services & Search
- `GET /categories`: Fetch list of all active platform service categories.
- `GET /services`: Highly customizable search of active services, supporting text FTS (query), category filters, price ranges, and sorting (price_asc, price_desc, date).
- `POST /services`: Create a new service (Providers & Admins only).
- `GET /services/{id}`: Detailed view of a single service, including coordinates.
- `PUT /services/{id}`: Edit service specifications.
- `DELETE /services/{id}`: Soft or hard delete of the service.

### 3. Orders & Escrow Bookings
- `POST /requests`: Client initiates order request for a service.
- `GET /requests`: Fetch order requests (filtered automatically based on User Role: Client, Provider, Admin).
- `PUT /requests/{id}/status`: Orchestrate service lifecycle state changes. Handles Ledger/Wallet balance mutations securely on the backend.
  - State workflow transitions: `pending` &rarr; `accepted` &rarr; `completed` | `cancelled` | `disputed`.

### 4. Communication & Chat
- `POST /messages`: Dispatch real-time or stored text messaging to another user.
- `GET /messages/{recipient_id}`: Retrieve full chat timeline history with a specific contact. Automatically sets unread flags to read.
- `GET /messages/contacts/recent`: List all user IDs of active chat threads.

### 5. Reputation & Review Management
- `POST /reviews`: Leave a 1-5 star review for a completed order. Updates average rating, transaction reliability level badge, and overall user reputation automatically.

### 6. Wallets & Financial Ledger
- `GET /wallet/me`: Fetch active wallet balances (available and locked escrow).
- `GET /wallet/transactions`: Retrieve complete personal ledger timeline of all deposits, escrow locks, releases, and refunds.
- `POST /wallet/deposit`: Mock deposit method simulating card load.

### 7. Global Administration Panel
- `GET /admin/users`: Display all user records.
- `PUT /admin/users/{user_id}/status`: Suspend or reinstate user accounts. Write an entry to the Audit Log.
- `GET /admin/reports`: List all user-generated reports.
- `PUT /admin/reports/{id}`: Process and close safety reports.
- `GET /admin/audit`: Display full system administration Audit Log timeline.
- `GET /admin/stats`: Get overview platform analytics (active users, transaction volume, revenue, profit).

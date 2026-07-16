# Database Design & Schema

LavoroHub utilizes **PostgreSQL** as its transactional engine, structured around a highly normalized relational database design to guarantee absolute data consistency and integrity.

## Entity-Relationship Diagram

The core entities are mapped using the following schema structure:

```mermaid
erDiagram
    users ||--|| profiles : "has"
    users ||--|| wallets : "owns"
    users ||--o{ services : "provides"
    users ||--o{ orders : "orders as client"
    users ||--o{ orders : "provides as provider"
    categories ||--o{ services : "groups"
    orders ||--o{ transactions : "generates ledger"
    wallets ||--o{ transactions : "applies to"
    orders ||--|| reviews : "receives"
    users ||--o{ reports : "reports"
    users ||--o{ reports : "is reported by"

    users {
        string id PK
        string username
        string password_hash
        string role
        string status
        string reliability_level
        boolean is_verified
        string two_factor_secret
        boolean two_factor_enabled
        timestamp created_at
    }

    profiles {
        string id PK
        string user_id FK
        text description
        string avatar_url
        float reputation_score
        float rating_average
        int services_count
        int days_on_platform
    }

    categories {
        string id PK
        string name
        text description
    }

    services {
        string id PK
        string provider_id FK
        string category_id FK
        string title
        text description
        float price
        boolean is_available
        string location_general
        float latitude
        float longitude
        timestamp created_at
    }

    orders {
        string id PK
        string client_id FK
        string provider_id FK
        string service_id FK
        float price
        float platform_fee
        string status
        timestamp created_at
        timestamp updated_at
    }

    wallets {
        string id PK
        string user_id FK
        float balance
        float escrow_balance
    }

    transactions {
        string id PK
        string wallet_id FK
        string order_id FK
        float amount
        string type
        string status
        float balance_before
        float balance_after
        timestamp created_at
    }

    reviews {
        string id PK
        string order_id FK
        string reviewer_id FK
        string reviewee_id FK
        int rating
        text comment
        timestamp created_at
    }
```

## Key Architectural Constraints
- **Ledger Immutability:** Any transaction recorded in the `transactions` table represents a non-modifiable record. Corrections or cancellations must be written as a separate offset/reversing transaction.
- **Cascading & Set Null Rules:** Relationships are carefully configured with safety in mind (e.g. services map to Category with `ondelete="SET NULL"`, avoiding cascade drops of active services if a category is edited).

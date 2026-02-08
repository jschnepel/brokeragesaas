# Leads Endpoint

## List Leads

```
GET /api/leads
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| limit | number | Results per page |
| offset | number | Pagination offset |

### Response

```json
{
  "leads": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "message": "Interested in...",
      "source": "property_page",
      "status": "new",
      "created_at": "2026-02-04T..."
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 25
  }
}
```

## Create Lead

```
POST /api/leads
```

### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "message": "Interested in...",
  "property_id": "uuid",
  "source": "contact_form"
}
```

### Response

```json
{
  "lead": {
    "id": "uuid",
    "name": "John Doe",
    "status": "new",
    "created_at": "2026-02-04T..."
  }
}
```

## Update Lead

```
PATCH /api/leads/:id
```

### Request Body

```json
{
  "status": "contacted"
}
```

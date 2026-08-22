# Lab 2 REST API Contract

## 1. Endpoints Overview
- `GET /api/requesters/active` - Retrieve list of active Development Requesters[cite: 2].
- `GET /api/categories` - Retrieve active ticket categories[cite: 2].
- `GET /api/related-systems` - Retrieve active related systems[cite: 2].
- `POST /api/tickets` - Create a new validated ticket for the active requester[cite: 2].
- `GET /api/tickets` - Retrieve paginated, filtered, and sorted tickets owned by the current requester[cite: 2].
- `GET /api/tickets/:id` - Retrieve details of a specific owned ticket[cite: 2].
- `POST /api/tickets/:id/attachments` - Upload a supporting attachment file[cite: 2].
- `DELETE /api/attachments/:id` - Soft-remove an attachment with a mandatory reason[cite: 2].
- `GET /api/attachments/:id/download` - Download an active attachment file[cite: 2].

## 2. Response Codes & Error Handling
- `200 OK`: Successful resource retrieval[cite: 2].
- `201 Created`: Resource successfully created[cite: 2].
- `400 Bad Input`: Validation failure or malformed payload[cite: 2].
- `403 Forbidden`: Cross-requester ownership violation[cite: 2].
- `404 Not Found`: Target resource does not exist[cite: 2].
- `500 Server Error`: Unexpected internal database or application error[cite: 2].
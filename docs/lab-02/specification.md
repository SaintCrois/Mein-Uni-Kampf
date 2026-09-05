# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
Build a professional and responsive Requester-facing ticketing application for TokTickIT featuring temporary Development Requester identity selection, ticket creation, paginated My Tickets searching/filtering, ticket details, and soft-removal attachment capabilities under the Zen Green theme.

## 2. Stakeholder Request Interpretation
The IT department needs a reliable ticketing system where Requesters can describe issues, assign categories and related systems, set requested priorities, attach supporting files, and securely track requests without cross-requester data visibility leaks.

## 3. Scope
### Included
- Development Requester selection mechanism (testing simulation only).
- Create Ticket workflow with inline validation and file upload constraints.
- My Tickets paginated list with search, sorting, and multi-parameter filters.
- Requester Ticket Detail view mode.
- Attachment lifecycle: uploading, viewing metadata, downloading active files, and reason-backed soft removal.

### Excluded
- Real authentication, login credentials, sessions, or user roles.
- IT Staff queues, ticket ownership reassignment, and IT Priority controls.
- Collaboration modules such as Public Comments, Internal Notes, or Actions Taken.
- Ticket lifecycle transitions past initial New status (resolving, closing, reopening).

## 4. Functional Requirements
- FR-01: The system shall provide a Development Requester selector displaying active users loaded from the database.
- FR-02: The system shall transactionally generate a unique official Ticket Number (`TKT-YYYY-######`) backend-side upon valid ticket submission. The client must never dictate this number.
- FR-03: The system shall assign an initial status of 'New' to every newly created ticket.
- FR-04: The system shall allow a Requester to view, search, filter, sort, and paginate through their owned tickets.
- FR-05: The system shall enforce data ownership rules so Requesters cannot access tickets or attachments belonging to other users.
- FR-06: The system shall support uploading up to 5 permitted files (JPG, PNG, WEBP, PDF) under 5 MiB ($5 \times 1024 \times 1024$ bytes) each per ticket. Upload validation is all-or-nothing; if one file is invalid, the entire request is rejected.
- FR-07: The system shall support soft-removal of attachments requiring a mandatory reason, retaining record metadata while blocking file downloads.

## 5. Business Rules
- BR-01: The official Ticket Number is generated automatically by the backend.
- BR-02: A new Ticket must always begin with the Current Status 'New'.
- BR-03: Lab 2 uses a Development Requester selector instead of authentication. After selection, the active requester ID is stored in client-side state and passed to the backend, which exclusively handles authorization. Because authentication is excluded from Lab 2, the requester ID is a simulated identity context and must not be treated as a security credential; all ownership checks must nevertheless be performed server-side.
- BR-04: The maximum active attachments allowed per ticket is 5. Soft-removed attachments do not count toward this limit.
- BR-05: Inactive Requesters must be excluded from the Development Requester selection dropdown.
- BR-06: The Requester-requested priority must be strictly one of: Low, Medium, High, Urgent.

## 6. UI Specification Summary
Conforms to the Zen Green Theme specification using primary green (`#006B3C`), secondary green (`#0B7A46`), pale green (`#EAF6EF`), and quiet near-white backgrounds (`#F5F7F6`), implementing responsive multi-column desktop and stacked mobile layouts.

## 7. Data Changes
Prisma schema models required:
- **Development Requester**: `id` (PK), `name` (String), `isActive` (Boolean).
- **Category**: `id` (PK), `name` (String), `isActive` (Boolean).
- **RelatedSystem**: `id` (PK), `name` (String), `isActive` (Boolean).
- **Ticket**: `id` (PK), `ticketNumber` (String, Unique), `requesterId` (FK), `categoryId` (FK), `relatedSystemId` (FK), `summary`, `description`, `status` (Enum: New, In Progress, Resolved, Closed), `priority` (Enum: Low, Medium, High, Urgent), `createdAt` (DateTime), `updatedAt` (DateTime).
- **Attachment**: `id` (PK), `ticketId` (FK), `fileName`, `fileSize` (Int), `mimeType`, `storageKey` (String), `isSoftRemoved` (Boolean), `removalReason` (String, nullable), `createdAt` (DateTime), `removedAt` (DateTime, nullable).

## 8. API Contract
REST API endpoints required:
- `GET /api/requesters/active`: Retrieves active requesters for the context selector.
- `GET /api/categories`: Retrieves active reference categories.
- `GET /api/related-systems`: Retrieves active reference systems.
- `POST /api/tickets`: Creates a new ticket.
- `GET /api/tickets`: Retrieves paginated tickets. 
  - **Query Params:** `page`, `pageSize`, `search`, `status`, `priority`, `categoryId`, `relatedSystemId`, `sortBy`, `sortOrder`.
  - **Response Shape:** `{ "items": [], "page": 1, "pageSize": 10, "totalItems": 42, "totalPages": 5 }`
- `GET /api/tickets/:ticketId`: Retrieves a specific ticket.
- `POST /api/tickets/:ticketId/attachments`: Uploads attachment files.
- `GET /api/tickets/:ticketId/attachments/:attachmentId/download`: Downloads an active attachment.
- `DELETE /api/tickets/:ticketId/attachments/:attachmentId`: Executes a soft removal of an attachment (requires removal reason; does not hard-delete).

*Note: Every endpoint requiring requester context receives the active requester ID through the Lab 2 development-context mechanism.*

## 9. Non-Functional Requirements
- NFR-01: All ownership checks must be enforced server-side.
- NFR-02: Client-side validation must not replace server-side validation.
- NFR-03: API errors must return consistent HTTP status codes and structured error responses.
- NFR-04: My Tickets queries must be paginated server-side.
- NFR-05: Attachment downloads must never expose soft-removed files.
- NFR-06: UI must remain usable at desktop and mobile breakpoints.
- NFR-07: Automated tests must cover validation, ownership enforcement, attachment limits, and ticket creation.

## 10. Acceptance Criteria
- AC-01: Given valid Ticket data, when the Requester submits the form, then one Ticket is saved with status 'New', and the official Ticket Number is displayed.
- AC-02: Given no Development Requester is selected, when the user attempts to route to My Tickets, then the app forces the Requester Selection screen to be displayed.
- AC-03: Given Requester B is the active context, when Requester B requests a ticket owned by Requester A, then the API must return 404 (preferred) or 403, and no ticket data or attachment metadata is returned.
- AC-04: Given a Requester attempts to attach >5 active files or a single file >5MB, when uploading, then the system blocks the action and displays an inline validation error.
- AC-05: Given Requester B is active, when B attempts to download or soft-remove an attachment belonging to Requester A, then the API rejects the request and does not expose the file.
- AC-06: Given an attachment has been soft-removed, when its download endpoint is requested, then the API rejects the download while retaining the attachment metadata and removal reason.

## 11. Definition of Done
All sprint implementation scope satisfied, acceptance criteria mapped to passing automated unit/API/UI/E2E test suites, visual interfaces conforming to Zen Green UI specifications, and complete documentation verified.

## 12. Assumptions and Decisions
Development Requester selector securely mocks session context requirements until proper authentication mechanics are introduced in Lab 3.

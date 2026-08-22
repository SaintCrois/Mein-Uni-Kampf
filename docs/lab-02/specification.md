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
- FR-02: The system shall generate a unique official Ticket Number backend-side upon valid ticket submission.
- FR-03: The system shall assign an initial status of 'New' to every newly created ticket.
- FR-04: The system shall allow a Requester to view, search, filter, sort, and paginate through their owned tickets.
- FR-05: The system shall enforce data ownership rules so Requesters cannot access tickets or attachments belonging to other users.
- FR-06: The system shall support uploading up to 5 permitted files (JPG, PNG, WEBP, PDF) under 5MB each per ticket.
- FR-07: The system shall support soft-removal of attachments requiring a mandatory reason, retaining record metadata while blocking file downloads.

## 5. Business Rules
- BR-01: The official Ticket Number is generated automatically by the backend and must be globally unique.
- BR-02: A new Ticket must always begin with the Current Status 'New'.
- BR-03: Lab 2 uses a Development Requester selector instead of authentication; selections are for testing simulation only.
- BR-04: The maximum active attachments allowed per ticket is 5, with an individual file size ceiling of 5MB.
- BR-05: Inactive Requesters must be excluded from the Development Requester selection dropdown.

## 6. UI Specification Summary
Conforms to the Zen Green Theme specification using primary green (`#006B3C`), secondary green (`#0B7A46`), pale green (`#EAF6EF`), and quiet near-white backgrounds (`#F5F7F6`), implementing responsive multi-column desktop and stacked mobile layouts.

## 7. Data Changes
Prisma schema models required: Development Requester, Ticket, Category, Related System, and Attachment. Includes foreign keys, database indexes on searchable fields, and soft-removal fields.

## 8. API Contract
REST API endpoints required for active requesters, reference categories, related systems, ticket creation, paginated list retrieval, owned detail retrieval, attachment uploads, downloads, and soft-removal.

## 9. Acceptance Criteria
- AC-01: Given valid Ticket data, when the Requester submits the form, then one Ticket is saved and the official Ticket Number is displayed.
- AC-02: Given no Development Requester is selected, when the user attempts to open My Tickets, then the Requester Selection screen is displayed.
- AC-03: Given Requester B is selected, when a Ticket belonging to Requester A is requested, then the data is not returned.

## 10. Definition of Done
All sprint implementation scope satisfied, acceptance criteria mapped to passing automated unit/API/UI/E2E test suites, visual interfaces conforming to Zen Green UI specifications, and complete documentation verified.

## 11. Assumptions and Decisions
Development Requester selector securely mocks session context requirements until proper authentication mechanics are introduced in Lab 3.

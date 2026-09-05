# Lab 2 UI Specification (Zen Green Theme)

## 1. Color Tokens & Theme
- **Primary green**: `#006B3C` — Used for application header, primary action buttons, and dominant brand elements.
- **Secondary green**: `#0B7A46` — Used for active tabs, focus accents, hover states, and interactive links.
- **Pale green**: `#EAF6EF` — Used for selected states, success alert backgrounds, and subtle section accents.
- **Page background**: `#F5F7F6` — Quiet near-white background across all views.
- **Surface / Cards**: `#FFFFFF` — White with subtle 1px border (`#DEE2E6`) and restrained shadow (`box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)`).
- **Text**: `#212529` / `#1B3B2B` — Dark charcoal-green for high contrast and comfortable readability.
- **Read-only background**: `#F3F6F4` with `#496157` text color for system-generated and view-mode fields.
- **Error**: `#DC3545` (dark red text and border) — Error feedback appears directly below the invalid input.
- **Warning**: `#FFC107` / `#856404` — Amber callouts and badges for warnings.
- **Success**: `#198754` — Green confirmation messages with explicit text indicators.

---

## 2. Component Hierarchy & Form States
- **Form Controls & Labels**:
  - Labels are positioned directly above inputs with `.form-label.fw-semibold`.
  - Required fields are indicated with a red asterisk (`*`), supported by explicit validation messages.
  - Inputs maintain consistent heights (`.form-control`, `.form-select`).
  - Read-only fields are visibly distinct using `#F3F6F4` shading with `readOnly` attribute.
  - Invalid controls show red border `.is-invalid` and render `.invalid-feedback` immediately underneath.
- **Button Hierarchy**:
  - **Primary**: `.btn.btn-success` (`#006B3C`) for primary submissions.
  - **Secondary**: `.btn.btn-outline-secondary` for navigation and clear filters.
  - **Tertiary / Utility**: `.btn.btn-light` / `.btn.btn-outline-light` on header navigation.
  - **Busy / Loading State**: Submit button displays "Creating..." or "Submitting..." and is disabled to prevent duplicate submissions.
- **Priority Badges**:
  - **Low**: `.bg-success-subtle.text-success-emphasis`
  - **Medium**: `.bg-warning-subtle.text-warning-emphasis`
  - **High**: `.bg-white.text-dark.border.border-danger`
  - **Urgent**: `.bg-danger-subtle.text-danger`

---

## 3. Screen Layouts & Navigation

### 3.1 Application Shell & Navigation
- Top navigation bar styled with Primary Green (`#006B3C`).
- Displays application branding: **TokTickIT IT Service Desk**.
- Shows the currently selected Development Requester name.
- Provides quick navigation actions: "My Tickets", "Create Ticket", and "Change Requester".

### 3.2 Development Requester Selection Screen
- Centered container (`max-width: 640px`) with clear testing-context disclaimer.
- Dropdown selector populated dynamically with active database requesters.
- "Continue" button enabled only after a valid requester is selected.

### 3.3 Create Ticket Screen
- Max-width 900px centered card.
- **System-Generated Section**: Read-only Ticket Number, Date, and Requester Name.
- **Request Details Section**: Category, Related System, Requested Priority dropdowns.
- **Summary & Description**: Single-line summary (max 150 chars) and multiline textarea description (max 2000 chars).
- **Attachments**: Multi-file input supporting JPG, PNG, WEBP, and PDF up to 5 MB each (max 5 active files).

### 3.4 My Tickets Screen
- Search bar for quick lookup by Ticket Number (`TKT-YYYY-XXXXXX`).
- Filter dropdowns for Category, Requested Priority, and Status.
- "Clear Filters" action to reset search criteria.
- Paginated/Responsive table with clickable rows navigating to Ticket Detail.
- Distinct states: Loading indicator, Empty list (no tickets created yet), and No Results (filters matched 0 tickets).

### 3.5 Ticket Detail Screen (View Mode)
- Full read-only view of ticket details (Ticket Number, Category, System, Priority, Status, Timestamps, Summary, Description).
- Attachments list with active download actions.
- "Back to My Tickets" button for easy navigation.

---

## 4. Responsive Breakpoints

| Viewport | Width Range | Layout Behavior |
| :--- | :--- | :--- |
| **Desktop** | $\ge 992\text{px}$ | Multi-column grid (`col-md-4`, `col-md-6`), centered cards with sensible max-widths. |
| **Tablet** | $768\text{px} - 991\text{px}$ | 2-column layout for filters and form fields; table wrapped in horizontal scroll container (`.table-responsive`). |
| **Mobile** | $< 768\text{px}$ | Single-column stacked fields, full-width touch-friendly buttons, no clipped labels or horizontal page overflow. |

---

## 5. Visual Inspection Checklist

| Check Item | Status | Verified Evidence / Screenshot |
| :--- | :---: | :--- |
| **Zen Green Color Palette** | PASS | Header uses `#006B3C`, backgrounds `#F5F7F6`, accents `#0B7A46`. |
| **Read-Only vs Editable Fields** | PASS | Read-only fields use `#F3F6F4` shading; editable fields have clear white background. |
| **Validation Error Placement** | PASS | Field-level `.invalid-feedback` renders immediately below each invalid control (`create-ticket/03-create-ticket-validation-errors.png`). |
| **Button States & Hierarchy** | PASS | Primary submit is green, disabled when loading/submitting. |
| **No Text Clipping or Overlap** | PASS | All text wraps cleanly on Desktop, Tablet, and Mobile viewports. |
| **No Horizontal Page Overflow** | PASS | Responsive containers and `.table-responsive` prevent layout breaks. |
| **Desktop Layout ($\ge 992\text{px}$)** | PASS | `artifacts/lab-02/screenshots/create-ticket/02-create-ticket-initial-desktop.png` |
| **Tablet Layout ($768\text{--}991\text{px}$)** | PASS | `artifacts/lab-02/screenshots/create-ticket/08-create-ticket-tablet.png` |
| **Mobile Layout ($< 768\text{px}$)** | PASS | `artifacts/lab-02/screenshots/create-ticket/09-create-ticket-mobile.png` |
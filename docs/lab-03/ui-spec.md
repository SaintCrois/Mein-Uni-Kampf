# Lab 3 UI Specification (Zen Green Theme Extensions)

## 1. Color Tokens & Brand System
Lab 3 preserves and extends the established **Zen Green** design tokens to ensure all new authentication, staff queue, and administration interfaces seamlessly integrate with the existing design system.

- **Primary Green**: `#006B3C` — Application header, main navigation, primary action buttons (`.btn-success`), and active state accents.
- **Secondary Green**: `#0B7A46` — Hover states, interactive link accents, and secondary button accents.
- **Pale Green**: `#EAF6EF` — Subtle card section accents, Public Comments container background, and active row highlights.
- **Page Background**: `#F5F7F6` — Quiet, low-fatigue near-white neutral background across all views.
- **Card Surface**: `#FFFFFF` — White cards with subtle 1px border (`#DEE2E6`) and minimal elevation (`box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)`).
- **Text (Body)**: `#212529` / `#1B3B2B` — Deep charcoal/green for high contrast and readability.
- **Read-Only / Disabled Surface**: `#F3F6F4` with `#496157` text.
- **Danger / Error**: `#DC3545` — Validation error messages, danger badges, and error alert banners.
- **Warning / Internal Accent**: `#D97706` / `#FEF3C7` — Specifically reserved for **Internal Notes** and warning callouts to strictly distinguish private staff notes from public comments.
- **Info / Neutral Badges**: `#0D6EFD` / `#CFE2FF` — Neutral operational badges and counter pills.

---

## 2. Typography, Badges & Interactive Controls

### Role Badges
- **Requester**: `.badge.bg-secondary` — Slate gray badge.
- **IT Staff**: `.badge.bg-primary` — Blue badge indicating technical staff.
- **Administrator**: `.badge.bg-dark` — Charcoal black badge indicating system governance.

### Status Badges
- **New**: `.badge.bg-info.text-dark` — Cyan/light blue.
- **Open**: `.badge.bg-primary` — Royal blue.
- **In Progress**: `.badge.bg-warning.text-dark` — Amber gold.
- **Waiting for Requester**: `.badge.bg-secondary` — Slate gray.
- **Resolved**: `.badge.bg-success` — Forest green (`#006B3C`).
- **Closed**: `.badge.bg-dark` — Charcoal.
- **Reopened**: `.badge.bg-danger` — Crimson.
- **Cancelled**: `.badge.bg-light.text-muted.border` — Muted gray with border.

### Priority Badges
- **Low**: `.badge.bg-success-subtle.text-success-emphasis`
- **Medium**: `.badge.bg-warning-subtle.text-warning-emphasis`
- **High**: `.badge.bg-white.text-dark.border.border-danger`
- **Urgent**: `.badge.bg-danger.text-white`

---

## 3. Application Shell & Role-Based Navigation

### Header & Identity
The top navigation bar (`#006B3C`) replaces the Lab 2 Development Requester selector with the authenticated user context:
- **Brand Title**: `TokTickIT IT Service Desk` (links to user's primary view).
- **User Context Pill**: Displays the authenticated user's name and prominent role badge (e.g., `Narin Chaiyo [Requester]`).
- **Logout Action**: Clean button (`.btn-outline-light.btn-sm`) triggering session invalidation.

### Role-Specific Nav Destinations
- **Requester**:
  - `My Tickets`
  - `Create Ticket`
- **IT Staff**:
  - `Ticket Queue`
- **Administrator**:
  - `User Management`

*Strict Rule: Navigation links to unauthorized sections are completely omitted from the DOM for unauthorized roles, supported by rigorous backend route protection.*

---

## 4. Screen Layouts & Specifications

### 4.1 Login Screen (`/login`)
- **Container**: Centered, distraction-free card (`max-width: 440px`) on `#F5F7F6` canvas.
- **Elements**:
  - Brand header with TokTickIT icon.
  - Email input (`type="email"`, required, autofocus).
  - Password input (`type="password"`, required).
  - "Sign In" button (`.btn-success.w-100`).
  - Loading State: Button shows spinner and `"Signing in..."` while inputs are disabled.
  - Error Feedback: Dismissible red alert (`"Invalid email or password"`) for invalid credentials or inactive accounts.

### 4.2 Mandatory Change Password Screen (`/change-password`)
- **Container**: Centered card (`max-width: 480px`).
- **Context Alert**: Amber alert box explaining: `"Your account was created with an initial password. Please set a new password to continue."`
- **Elements**:
  - Current password input.
  - New password input (minimum 8 characters).
  - Confirm new password input.
  - Inline validation feedback for length and mismatch.
  - "Update Password and Continue" button (`.btn-success.w-100`).

### 4.3 Requester Ticket Detail Extensions
Extends the read-only Lab 2 Ticket Detail view with communication and resolution controls:
- **"Problem Appears Resolved" Section**:
  - Switch/Button: `"Mark as Problem Appears Resolved"`.
  - Info badge notifying the requester: *"Indicates to IT Staff that the issue is fixed. IT Staff will review and formally close the ticket."*
- **Public Comments Section**:
  - Container with light green border and `#EAF6EF` header.
  - List of past comments displaying author name, role badge, timestamp, and message body.
  - New Comment textarea (max 2000 chars) with `"Post Public Comment"` button.

### 4.4 IT Staff Ticket Queue Screen (`/staff/tickets`)
- **Header**: Title `"IT Staff Ticket Queue"`, active ticket count badge, and Refresh button.
- **Filter & Search Bar**:
  - Search input: by Ticket Number (`TKT-...`) or Summary keyword.
  - Filter dropdowns: Status (All, New, Open, In Progress, etc.), Category, IT Priority, and Ownership (`All`, `Unassigned`, `Assigned to Me`).
  - "Clear Filters" action.
- **Queue Table (Desktop $\ge 992\text{px}$)**:
  - Columns: `Ticket No.`, `Created Date`, `Summary`, `Category`, `Requested Priority`, `IT Priority`, `Status`, `Owner`, `Actions`.
  - Column header sort toggles for Date and Ticket Number.
  - Action column with `"View Ticket"` button (`.btn-outline-success.btn-sm`).
- **Responsive Representation (Mobile & Tablet $< 992\text{px}$)**:
  - Multi-column table gracefully collapses into stacked card items displaying Ticket Number, Status/Priority badges, Summary, and Assignee.
- **Pagination Controls**:
  - Showing `X - Y of Z tickets` counter.
  - `Previous` and `Next` buttons with page number indicator.
- **Empty / No-Results States**:
  - Friendly placeholder alert: `"No tickets match the selected filters."` with `"Reset Filters"` shortcut.

### 4.5 IT Staff Ticket Detail Screen (`/staff/tickets/:id`)
- **Layout**: Two-column layout on desktop; single-column stacked on tablet/mobile.
- **Left Column: Ticket Information & Lifecycle Operations**:
  - Read-only Requester info, Category, System, and Original Description.
  - **Ownership Control**:
    - Displays current owner name (or `"Unassigned"`).
    - Quick actions: `"Claim Ticket"` (assigns to logged-in user) or Assignee dropdown to reassign to any active IT Staff.
  - **IT Priority Control**: Dropdown (`Low`, `Medium`, `High`, `Urgent`) editable by IT Staff.
  - **Status Transition Control**: Dropdown presenting strictly permitted next status options based on the BR-13 transition matrix, with an `"Update Status"` button.
  - **Requester Resolution Banner**: Displays alert if requester toggled `"Problem Appears Resolved"`.
  - **Attachments Section**: Full continuity with Lab 2 attachments (view filename, size, download active files).
- **Right Column: Communication Hub (Visually Separated)**:
  - **Public Comments Tab / Box**:
    - Styled with **Green Accent** (`#006B3C` header, `#EAF6EF` body).
    - Explicit helper label: *"Visible to Requester and Staff"*.
  - **Internal Notes Tab / Box**:
    - Styled with **Amber/Gold Accent** (`#D97706` header, `#FEF3C7` body).
    - Prominent lock icon and label: *"Strictly Private — Visible Only to IT Staff & Admin"*.
  - Independent submission inputs for Public Comments and Internal Notes to eliminate human error.

### 4.6 Administrator User Management Screen (`/admin/users`)
- **Header**: Title `"User Management"`, user counter, and `"Create New User"` primary button.
- **Search & Filter Controls**:
  - Search input: searches Name and Email.
  - Role filter dropdown: `All Roles`, `Requester`, `IT Staff`, `Administrator`.
- **User List Table**:
  - Columns: `Name`, `Email`, `Role` (colored badge), `Status` (Active green / Inactive gray), `Created Date`, `Actions`.
  - Action: `"Edit"` button opening the modal dialog.
- **Create User Modal**:
  - Fields: Full Name, Email Address, Role selection (`Requester`, `IT Staff`, `Administrator`), Initial Password, and Active checkbox (default checked).
  - Validation: Email format and uniqueness, required name, password $\ge 8$ chars.
- **Edit User Modal**:
  - Editable fields: Full Name, Email Address, Role, and Active toggle.
  - **Safety Guards**:
    - Active toggle is disabled with an explanatory tooltip if the user is editing their own account (*"You cannot deactivate your own account"*).
    - Active toggle and Role select are disabled if the user is the sole active Administrator (*"System must retain at least one active Administrator"*).
  - **Password Reset Action**: Button `"Set New Initial Password"` revealing a password input field that resets `mustChangePassword = true`.

---

## 5. Responsive Breakpoint Rules

| Viewport | Width Range | Layout Behavior |
| :--- | :--- | :--- |
| **Desktop** | $\ge 992\text{px}$ | Full multi-column tables, side-by-side Ticket Detail panels, modals width $500\text{--}600\text{px}$. |
| **Tablet** | $768\text{px} - 991\text{px}$ | Queue tables scroll or collapse secondary columns (Category, Created Date), Ticket Detail stacks left/right columns vertically. |
| **Mobile** | $< 768\text{px}$ | Queue table collapses into stacked cards, full-width buttons, modals occupy $95\%$ screen width, no horizontal body overflow. |

---

## 6. Visual Inspection Checklist

- [ ] **Color Contrast**: All text satisfies WCAG AA contrast against backgrounds (including badges and alerts).
- [ ] **Role Indicators**: Role badges (`Requester`, `IT Staff`, `Administrator`) are instantly recognizable.
- [ ] **Public vs Internal Separation**: Public Comments (green) and Internal Notes (amber) have high visual distinction.
- [ ] **Editable vs Read-Only Clarity**: Read-only fields have distinct background `#F3F6F4` and border styling.
- [ ] **Loading & Busy States**: Login, password change, ticket updates, and user saves show spinner and disabled button states.
- [ ] **Form Validation Alignment**: Field error messages appear directly below their associated inputs in red text.
- [ ] **Responsive Integrity**: No horizontal scrollbars or element clipping on Desktop (1280px), Tablet (800px), or Mobile (390px).
- [ ] **Accessible Inputs**: All inputs and controls have associated `<label htmlFor="...">` and visible focus outlines.

# Lab 4 UI Specification (Zen Green Theme Extensions)
## TokTickIT: Actions Taken, Dashboards, and Final Regression Hardening

---

## 1. Color Tokens & Brand System
Lab 4 strictly preserves and extends the **Zen Green** design language established in Lab 2 and refined in Lab 3 to ensure visual harmony, operational clarity, and ergonomic low-fatigue styling across all screens.

- **Primary Green**: `#006B3C` — Brand header, primary navigation active state, primary buttons (`.btn-success`), and key metric highlights.
- **Secondary Green**: `#0B7A46` — Button hover states, interactive link accents, and subtle borders.
- **Pale Green Accent**: `#EAF6EF` — Table header highlights, Public Comments container background, and metric card subtle fill.
- **Canvas / Page Background**: `#F5F7F6` — Quiet, low-contrast neutral gray background across all screens.
- **Card Surface**: `#FFFFFF` — Crisp white cards with 1px border (`#DEE2E6`) and minimal drop shadow (`box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)`).
- **Text (Body)**: `#212529` / `#1B3B2B` — Charcoal black / deep forest green for maximum contrast and legibility.
- **Text (Muted)**: `#6C757D` — Secondary metadata, timestamps, and placeholder text.
- **Read-Only / Disabled Surface**: `#F8F9FA` with `#495057` text.
- **Warning / Follow-Up Amber**: `#D97706` / `#FEF3C7` — Prominent accent color strictly reserved for **Follow-Up Required** badges, follow-up callout alerts, and Internal Notes.
- **Danger / Error Red**: `#DC3545` — Inline validation error messages, urgent priority badges, and cancellation confirmations.
- **Info / Blue**: `#0D6EFD` / `#CFE2FF` — Neutral metric counts, IT Staff role badges, and status chips.

---

## 2. Typography, Badges & Interactive Indicators

### 2.1. Role Badges
- **Requester**: `.badge.bg-secondary` — Slate gray badge.
- **IT Staff**: `.badge.bg-primary` — Royal blue badge.
- **Administrator**: `.badge.bg-dark` — Charcoal black badge.

### 2.2. Status Badges
Every ticket status possesses a distinctive color and text cue:
- **New**: `.badge.bg-info.text-dark` — Cyan.
- **Open**: `.badge.bg-primary` — Blue.
- **In Progress**: `.badge.bg-warning.text-dark` — Amber gold.
- **Waiting for Requester**: `.badge.bg-secondary` — Slate gray.
- **Resolved**: `.badge.bg-success` — Forest green (`#006B3C`).
- **Closed**: `.badge.bg-dark` — Charcoal black.
- **Reopened**: `.badge.bg-danger` — Crimson.
- **Cancelled**: `.badge.bg-light.text-muted.border` — Muted gray with border.

### 2.3. Priority Badges
- **Low**: `.badge.bg-success-subtle.text-success-emphasis`
- **Medium**: `.badge.bg-warning-subtle.text-warning-emphasis`
- **High**: `.badge.bg-white.text-dark.border.border-danger`
- **Urgent**: `.badge.bg-danger.text-white`

### 2.4. Actions Taken Badges
- **Follow-Up Required**: `.badge.bg-warning.text-dark.border.border-warning` — Prominent amber badge indicating that technical work requires subsequent inspection or customer follow-up.
- **Follow-Up Resolved / None**: `.badge.bg-light.text-muted` — Subtle gray indicator.
- **Attachment Reference**: `.badge.bg-light.text-dark.border` with paperclip icon (📎) indicating referenced diagnostic files.

---

## 3. Application Shell & Navigation

### 3.1. Header & Identity Bar
The application header (`#006B3C`) provides unified navigation across desktop, tablet, and mobile:
- **Brand Title**: `TokTickIT IT Service Desk` (links to role-appropriate home view).
- **Navigation Links**: Clean horizontal navigation with `.active` styling (white pill background with dark green text):
  - **Requester**:
    - `Dashboard` (`/dashboard`)
    - `My Tickets` (`/my-tickets`)
    - `Create Ticket` (`/create-ticket`)
  - **IT Staff**:
    - `Dashboard` (`/staff/dashboard`)
    - `Ticket Queue` (`/staff/tickets`)
  - **Administrator**:
    - `Dashboard` (`/admin/dashboard`)
    - `Ticket Queue` (`/staff/tickets`)
    - `User Management` (`/admin/users`)
- **User Context Pill**: Displays the authenticated user's name and role badge (e.g. `Somchai Jaidee [IT Staff]`).
- **Logout Action**: Secondary outlined button (`.btn-outline-light.btn-sm`) triggering clean session invalidation.

---

## 4. Screen Layouts & Specifications

### 4.1. Requester Dashboard (`/dashboard`)
- **Header**: Title `"Requester Dashboard"`, subtitle `"Overview of your support requests"`, and a prominent green `+ Create New Ticket` button.
- **Metric Cards Grid (4 Cards)**:
  1. **Open Tickets**: Total count of active tickets. Drill-down: navigates to `My Tickets` filtered by active tickets.
  2. **Waiting for Your Input**: Count of tickets in `Waiting for Requester` status. Accent border in warning amber. Drill-down: navigates to `My Tickets` with `status=Waiting for Requester`.
  3. **Recently Resolved**: Count of tickets in `Resolved` status. Accent border in green.
  4. **Action Needed**: Highlighted card showing tickets awaiting customer verification.
- **Recent Tickets Table**:
  - Columns: Ticket Number (clickable), Date, Summary, Category, Priority, Status Badge, Actions Taken Count, Action Link.
  - Hover row effect with subtle green highlight (`#EAF6EF`).
- **Empty State**:
  - When the requester has 0 tickets: centered illustration/icon, `"No support requests found"`, friendly guidance, and a large `Create Your First Ticket` call to action.

---

### 4.2. IT Staff Dashboard (`/staff/dashboard`)
- **Header**: Title `"IT Staff Operational Dashboard"`, subtitle `"Real-time service desk workload and triage"`, and a `Refresh` button.
- **Operational Metric Cards (Row 1 - 3 Cards)**:
  1. **Unassigned Tickets**: Large count in bold. Amber warning indicator if count $> 0$. Drill-down: opens Queue with `ownership=unassigned`.
  2. **My Assigned Tickets**: Count of active tickets assigned to current user. Drill-down: opens Queue with `ownership=mine`.
  3. **Follow-Up Required**: Count of active tickets possessing an Action Taken with `isFollowUpRequired === true`. Amber callout.
- **Queue Breakdown (Row 2 - 2 Columns)**:
  - **Left Card: Tickets by Status**: Horizontal bar or list showing count and badge for each of the 8 statuses. Clicking any status filters the Queue by that status.
  - **Right Card: Tickets by IT Priority**: Breakdown of active tickets by Urgent, High, Medium, Low. Urgent count highlighted in red.
- **Urgent & High Priority Backlog (Row 3)**:
  - Table of active tickets flagged as `Urgent` or `High` priority, ordered by oldest updated first.
  - Columns: Ticket Number, Summary, IT Priority Badge, Status Badge, Owner, Actions Taken Count, Quick Action (`View Details`).
- **Empty State**:
  - When queue is empty: green checkmark icon, `"All tickets resolved! Operational backlog is clear."`

---

### 4.3. Administrator Dashboard (`/admin/dashboard`)
- Inherits all operational cards and tables from the IT Staff Dashboard.
- **User Accounts Summary Row**:
  - 3 concise metric tiles placed at the top:
    1. **Total Users**: Total registered accounts.
    2. **Active Users**: Active accounts count.
    3. **Users by Role**: Mini breakdown badge pills: `Requesters: 16`, `IT Staff: 6`, `Admins: 2`.
  - Includes a direct link to `User Management` (`/admin/users`).

---

### 4.4. Actions Taken Section on Ticket Detail
Integrated directly on the Ticket Detail screen between Ticket Information and Communication tabs.

#### 4.4.1. IT Staff & Administrator View:
- **Card Header**: Title `"Actions Taken"` with counter badge (e.g. `[3 Actions]`), and `+ Add Action Taken` button (`.btn-success.btn-sm`).
- **Actions Taken Table / Timeline**:
  - Columns:
    - **Date / Time**: Formatted timestamp (e.g. `24/09/2026, 14:30`).
    - **Action Description**: Detailed explanation of technical work.
    - **Result**: Outcome or diagnostic finding.
    - **Performed By**: User name with role badge (`[IT Staff]` or `[Administrator]`).
    - **Follow-Up**: Badge (`Follow-Up Required` in amber or `None`). If required, the `followUpNote` is rendered directly beneath in a subtle callout box.
    - **Attachment Notes**: Text notes with paperclip icon pointing to files.
    - **Actions**: `Edit` button (`.btn-outline-secondary.btn-sm`) opening the edit modal.
- **Empty State**:
  - If 0 actions logged: light gray panel with text: `"No technical actions recorded yet. Click '+ Add Action Taken' to log initial triage or diagnostics."`

#### 4.4.2. "Add Action Taken" Modal Dialog:
- **Title**: `"Record Action Taken"`
- **Form Controls**:
  1. **Action Date / Time**: Datetime input pre-filled with current local timestamp.
  2. **Performed By**: Read-only field displaying the authenticated user's name and role (unforgeable).
  3. **Action Description**: Textarea (rows: 3, required, placeholder: `"Describe technical steps performed (e.g. diagnostic, configuration, hardware swap)..."`).
  4. **Result**: Textarea (rows: 2, required, placeholder: `"Document the immediate outcome or test result..."`).
  5. **Follow-Up Required**: Accessible checkbox (`"Requires subsequent follow-up or verification"`).
  6. **Follow-Up Note**: Textarea (rows: 2). Conditionally displayed/enabled when the follow-up checkbox is checked. Marked with mandatory red asterisk when visible.
  7. **Attachment Notes**: Text input (optional, placeholder: `"e.g. Review error-log.txt or screenshot-2.png"`).
- **Footer**: `Cancel` button and `Save Action Taken` button (`.btn-success`).
- **Saving State**: Button shows spinner and text `"Saving..."`, inputs are disabled to prevent duplicate submissions.

#### 4.4.3. "Edit Action Taken" Modal Dialog:
- Same fields pre-populated with existing record data.
- Performed By and Ticket Number remain read-only.
- Allows updating description, result, follow-up flags, follow-up notes, and attachment notes.

#### 4.4.4. Requester View (Read-Only):
- Transparently renders the Actions Taken table/list on the Requester's Ticket Detail view.
- Requesters can see what technical steps have been performed, the outcomes, and whether follow-up is pending.
- `+ Add Action Taken` and `Edit` buttons are strictly omitted from the DOM.

---

### 4.5. Ticket Workflow & Status Transition Controls
- **Location**: Top-right action bar of the Staff Ticket Detail view.
- **Status Dropdown / Button Group**:
  - Evaluates current ticket status and renders **only** the permitted next statuses according to the transition matrix (BR-11).
  - Example: For a ticket in `In Progress`, options rendered are:
    - `Waiting for Requester`
    - `Open` (Pause work)
    - `Resolved`
    - `Cancelled`
  - Disabled transitions are omitted from the selector.
- **Confirmation Prompts**:
  - Transitioning to `Cancelled` or `Closed` displays a modal confirmation dialog to prevent accidental terminal transitions.
- **Resolution Advisory Banner**:
  - When `requesterResolvedIndicator === true`, a prominent green alert banner is displayed at the top of the Staff Ticket Detail:
    - `"Requester has indicated this problem appears resolved. Please review the Actions Taken and formally resolve or close the ticket."`
    - Action button in banner: `Acknowledge & Mark Resolved`.

---

## 5. Responsive Behavior & Breakpoints

### 5.1. Desktop ($\ge 992\text{px}$)
- Full multi-column dashboard card layouts (4-column metric grids).
- Full table presentation for Actions Taken and Recent Tickets with all columns visible.
- Side-by-side or tabbed communication panels (Public Comments and Internal Notes).

### 5.2. Tablet ($768\text{px} - 991\text{px}$)
- Dashboard metric cards reflow into a 2x2 grid.
- Tables maintain horizontal padding with responsive wrapping.
- Modal dialogs occupy max 80% viewport width.

### 5.3. Mobile ($< 768\text{px}$)
- Navigation collapses into a clean mobile hamburger menu or stacked button row.
- Dashboard metric cards stack vertically (single-column, full-width).
- Actions Taken table transforms into responsive card items displaying Date, Performer, Description, and Badges in stacked blocks.
- Modals occupy full width (`w-100`) with thumb-friendly touch targets ($\ge 44\times 44\text{px}$).
- Zero horizontal page scrolling (`overflow-x: hidden`).

---

## 6. Accessibility & Usability Standards

- **Semantic Form Controls**: Every input and textarea has an explicit `<label htmlFor="...">` pairing.
- **Keyboard Navigability**: All interactive buttons, tabs, modal triggers, and dropdowns are fully navigable via `Tab`, `Enter`, `Space`, and `Escape`.
- **Visible Focus Rings**: High-contrast focus indicators (`outline: 2px solid #006B3C; outline-offset: 2px`) preserved on all focused elements.
- **Non-Color Status Cues**: Statuses and priorities pair color badges with distinct text labels and iconography (e.g. warning icons for follow-up).
- **ARIA Live Regions**: Dynamic alerts, saving spinners, and error banners utilize `role="alert"` or `aria-live="polite"` for screen reader announcements.
- **Error Placement**: Validation errors appear in high-contrast red text directly beneath the invalid input control.

---

## 7. Visual Inspection Checklist

- [ ] Zen Green brand palette (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`) consistently applied across all views.
- [ ] Role badges accurately color-coded (`Requester` slate, `IT Staff` blue, `Administrator` black).
- [ ] Status badges conform to standard color tokens across dashboards, queue, and detail screens.
- [ ] "Follow-Up Required" badge uses amber warning styling and prominently displays the follow-up note.
- [ ] Actions Taken table renders cleanly on desktop and stacks elegantly on mobile without horizontal clipping.
- [ ] Add/Edit Action Taken modals validate inputs inline and disable submit button during saving.
- [ ] Requester view of Actions Taken is strictly read-only with no modification triggers visible.
- [ ] Requester dashboard metrics match database reality and drill-down links navigate to filtered views.
- [ ] IT Staff dashboard reflects unassigned, assigned, priority, and follow-up counts accurately.
- [ ] Terminal status transitions (`Closed`, `Cancelled`) display confirmation prompts.
- [ ] Zero console errors, broken layout elements, or overlapping text on Desktop, Tablet, and Mobile viewports.

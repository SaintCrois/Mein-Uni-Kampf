# Lab 2 UI Specification (Zen Green Theme)

## 1. Color Tokens & Theme
- **Primary green**: `#006B3C` for app header, primary actions, and strong emphasis.
- **Secondary green**: `#0B7A46` for active tabs, focus accents, links, and hover states.
- **Pale green**: `#EAF6EF` for selected, success, and subtle section emphasis[cite: 2].
- **Page background**: `#F5F7F6` (quiet near-white)[cite: 2].
- **Surface/cards**: White with subtle border and restrained shadow[cite: 2].
- **Text**: Dark charcoal-green for comfortable reading[cite: 2].
- **Error**: Dark red text and border; message appears immediately below the field[cite: 2].

## 2. Screen Layouts & Component Rules
- **Development Requester Selector**: Dropdown showing active database-loaded users, clear testing-only notice, and a "Continue" button[cite: 2].
- **Create Ticket Form**: System-generated fields (Ticket Number, Date) near top as read-only (soft gray-green/warm ivory styling); input fields for Summary, Category, Related System, Requested Priority, Description, and Attachments[cite: 2].
- **My Tickets List**: Paginated table/cards displaying Ticket Number, Summary, Category, Priority, Status, Owner, and Last Updated, accompanied by search input and filter dropdowns[cite: 2].
- **Ticket Detail & Attachments**: Read-only header information, secure file upload controls, and soft-removal triggers requiring a reason[cite: 2].

## 3. Responsive Breakpoints
- **Desktop (>= 992px)**: Multi-column layouts centered with a sensible max width[cite: 2].
- **Tablet (768 - 991px)**: Two-column layout where practical with sufficient width for summary/description[cite: 2].
- **Mobile (< 768px)**: Fields stack vertically; touch-friendly buttons; no horizontal scrolling[cite: 2].
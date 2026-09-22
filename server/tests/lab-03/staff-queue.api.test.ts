import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

/**
 * Lab 3 - Issue 17: IT Staff Ticket Queue
 * Tests covering API-QUEUE-01, API-QUEUE-02, API-QUEUE-03, API-QUEUE-04,
 * authorization boundaries, sorting, pagination, and invalid parameter resilience.
 */
describe("Lab 3 - Issue 17: IT Staff Ticket Queue API", () => {
  const prisma = getPrisma();

  async function getSessionCookie(email: string): Promise<string[]> {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      });

    const rawCookies = loginRes.headers["set-cookie"] as unknown;
    const cookieArray: string[] = Array.isArray(rawCookies)
      ? rawCookies
      : typeof rawCookies === "string"
        ? [rawCookies]
        : [];
    return cookieArray;
  }

  // ---------------------------------------------------------------------------
  // Authorization & Access Control
  // ---------------------------------------------------------------------------
  describe("Authorization & Access Control", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const response = await request(app).get("/api/staff/tickets");
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects requests from a Requester with 403 Forbidden", async () => {
      const requesterCookie = await getSessionCookie("narin.chaiyo@example.com");

      const response = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", requesterCookie);

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/access denied/i);
    });

    it("allows IT Staff to access the queue with 200 OK", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("allows Administrator to access the queue with 200 OK", async () => {
      const adminCookie = await getSessionCookie("admin@example.com");

      const response = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", adminCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // API-QUEUE-01: Pagination & Metadata
  // ---------------------------------------------------------------------------
  describe("API-QUEUE-01: Pagination & Metadata", () => {
    it("returns paginated ticket list and correct metadata", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?page=1&pageSize=5")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("page", 1);
      expect(response.body).toHaveProperty("pageSize", 5);
      expect(response.body).toHaveProperty("totalItems");
      expect(response.body).toHaveProperty("totalPages");
      expect(typeof response.body.totalItems).toBe("number");
      expect(response.body.items.length).toBeLessThanOrEqual(5);

      if (response.body.items.length > 0) {
        const ticket = response.body.items[0];
        expect(ticket).toHaveProperty("id");
        expect(ticket).toHaveProperty("ticketNumber");
        expect(ticket).toHaveProperty("summary");
        expect(ticket).toHaveProperty("category");
        expect(ticket).toHaveProperty("requestedPriority");
        expect(ticket).toHaveProperty("currentStatus");
        expect(ticket).toHaveProperty("requester");
        expect(ticket.requester).toHaveProperty("name");
        expect(ticket.requester).toHaveProperty("email");
        expect(ticket).toHaveProperty("createdAt");
      }
    });

    it("handles page navigation correctly", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const page1Res = await request(app)
        .get("/api/staff/tickets?page=1&pageSize=2")
        .set("Cookie", staffCookie);

      const page2Res = await request(app)
        .get("/api/staff/tickets?page=2&pageSize=2")
        .set("Cookie", staffCookie);

      expect(page1Res.status).toBe(200);
      expect(page2Res.status).toBe(200);
      expect(page1Res.body.page).toBe(1);
      expect(page2Res.body.page).toBe(2);

      if (page1Res.body.items.length > 0 && page2Res.body.items.length > 0) {
        expect(page1Res.body.items[0].id).not.toBe(page2Res.body.items[0].id);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // API-QUEUE-02: Search by Ticket Number and Summary
  // ---------------------------------------------------------------------------
  describe("API-QUEUE-02: Search Functionality", () => {
    it("searches queue by ticket number keyword", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const sample = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });

      const response = await request(app)
        .get(`/api/staff/tickets?search=${sample.ticketNumber}`)
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      const found = response.body.items.some(
        (t: { ticketNumber: string }) => t.ticketNumber === sample.ticketNumber,
      );
      expect(found).toBe(true);
    });

    it("searches queue by summary keyword (case-insensitive)", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const sample = await prisma.ticket.findFirstOrThrow({ orderBy: { id: "asc" } });
      const word = sample.summary.split(" ")[0];

      const response = await request(app)
        .get(`/api/staff/tickets?search=${word.toLowerCase()}`)
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      for (const item of response.body.items) {
        const matchesSummary = item.summary.toLowerCase().includes(word.toLowerCase());
        const matchesNumber = item.ticketNumber.toLowerCase().includes(word.toLowerCase());
        expect(matchesSummary || matchesNumber).toBe(true);
      }
    });

    it("returns empty list when search keyword matches nothing", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?search=NONEXISTENT_KEYWORD_XYZ_99999")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
      expect(response.body.totalItems).toBe(0);
      expect(response.body.totalPages).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // API-QUEUE-03: Filtering by Status, Category, and IT Priority
  // ---------------------------------------------------------------------------
  describe("API-QUEUE-03: Filtering Criteria", () => {
    it("filters queue by single status", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?status=New")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      for (const item of response.body.items) {
        expect(item.currentStatus.name.toLowerCase()).toBe("new");
      }
    });

    it("filters queue by comma-separated statuses", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?status=New,Open")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      for (const item of response.body.items) {
        expect(["new", "open"]).toContain(item.currentStatus.name.toLowerCase());
      }
    });

    it("filters queue by categoryId", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });

      const response = await request(app)
        .get(`/api/staff/tickets?categoryId=${category.id}`)
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      for (const item of response.body.items) {
        expect(item.category.id).toBe(category.id);
      }
    });

    it("filters queue by itPriority", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");
      const priority = await prisma.priority.findFirstOrThrow({ where: { name: "High" } });

      const response = await request(app)
        .get(`/api/staff/tickets?itPriority=${priority.name}`)
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      for (const item of response.body.items) {
        expect(item.itPriority?.name.toLowerCase()).toBe("high");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // API-QUEUE-04: Filtering by Ownership
  // ---------------------------------------------------------------------------
  describe("API-QUEUE-04: Ownership Filtering", () => {
    it("filters queue for unassigned tickets only (ownership=unassigned)", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?ownership=unassigned")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      for (const item of response.body.items) {
        expect(item.owner).toBeNull();
        expect(item.ownerId ?? null).toBeNull();
      }
    });

    it("filters queue for tickets assigned to current staff member (ownership=mine)", async () => {
      const staff = await prisma.user.findUniqueOrThrow({
        where: { email: "somchai.jaidee@example.com" },
      });
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?ownership=mine")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      for (const item of response.body.items) {
        expect(item.owner?.id).toBe(staff.id);
      }
    });

    it("returns all tickets regardless of ownership when ownership=all", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?ownership=all")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
    });
  });

  // ---------------------------------------------------------------------------
  // Sorting & Display
  // ---------------------------------------------------------------------------
  describe("Sorting & Display", () => {
    it("sorts by createdAt in descending order by default", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?pageSize=10")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      const items = response.body.items;
      for (let i = 1; i < items.length; i++) {
        const prevDate = new Date(items[i - 1].createdAt).getTime();
        const currDate = new Date(items[i].createdAt).getTime();
        expect(prevDate).toBeGreaterThanOrEqual(currDate);
      }
    });

    it("sorts by ticketNumber ascending", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?sortBy=ticketNumber&sortOrder=asc&pageSize=10")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      const items = response.body.items;
      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].ticketNumber.localeCompare(items[i].ticketNumber)).toBeLessThanOrEqual(0);
      }
    });

    it("displays both assigned and unassigned tickets correctly", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?pageSize=20")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      const hasUnassigned = response.body.items.some((t: { owner: unknown }) => t.owner === null);
      const hasAssigned = response.body.items.some((t: { owner: unknown }) => t.owner !== null);

      // Verify that unassigned has null owner and assigned has full owner details
      for (const item of response.body.items) {
        if (item.owner) {
          expect(item.owner).toHaveProperty("id");
          expect(item.owner).toHaveProperty("name");
          expect(item.owner).toHaveProperty("email");
          expect(item.owner).toHaveProperty("role");
        } else {
          expect(item.owner).toBeNull();
        }
      }
      expect(hasUnassigned || hasAssigned).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Resilience to Invalid Query Parameters
  // ---------------------------------------------------------------------------
  describe("Invalid Query Parameter Resilience", () => {
    it("handles invalid page numbers safely by falling back to page 1", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const resNegative = await request(app)
        .get("/api/staff/tickets?page=-5")
        .set("Cookie", staffCookie);
      expect(resNegative.status).toBe(200);
      expect(resNegative.body.page).toBe(1);

      const resNonNumeric = await request(app)
        .get("/api/staff/tickets?page=invalidPage")
        .set("Cookie", staffCookie);
      expect(resNonNumeric.status).toBe(200);
      expect(resNonNumeric.body.page).toBe(1);
    });

    it("clamps pageSize within acceptable limits (1 to 50)", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const resOversize = await request(app)
        .get("/api/staff/tickets?pageSize=99999")
        .set("Cookie", staffCookie);
      expect(resOversize.status).toBe(200);
      expect(resOversize.body.pageSize).toBe(50);

      const resInvalid = await request(app)
        .get("/api/staff/tickets?pageSize=abc")
        .set("Cookie", staffCookie);
      expect(resInvalid.status).toBe(200);
      expect(resInvalid.body.pageSize).toBe(10);
    });

    it("safely handles invalid categoryId or sort options", async () => {
      const staffCookie = await getSessionCookie("somchai.jaidee@example.com");

      const response = await request(app)
        .get("/api/staff/tickets?categoryId=notANumber&sortBy=fakeColumn&sortOrder=invalidOrder")
        .set("Cookie", staffCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });
});


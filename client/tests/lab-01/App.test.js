import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
describe("App", () => {
    // WORKED EXAMPLE — provided for you.
    it("renders the TokTickIT heading", () => {
        render(_jsx(App, {}));
        expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
    });
    // Issue 4 — write these yourself.
    it("shows Online and the seeded categories on success", async () => {
        const mockCategories = [
            { id: 1, name: "Account and Access" },
            { id: 2, name: "Hardware" },
            { id: 3, name: "Software" },
            { id: 4, name: "Network" },
        ];
        vi.spyOn(api, "checkSystem").mockResolvedValue(mockCategories);
        render(_jsx(App, {}));
        const button = screen.getByText(/check system/i);
        fireEvent.click(button);
        expect(await screen.findByText(/online/i)).toBeInTheDocument();
        expect(screen.getByText(/account and access/i)).toBeInTheDocument();
        expect(screen.getByText(/hardware/i)).toBeInTheDocument();
        expect(screen.getByText(/software/i)).toBeInTheDocument();
        expect(screen.getByText(/network/i)).toBeInTheDocument();
    });
    it("shows an Offline error message when the API is unavailable", async () => {
        vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("Failed to fetch category list."));
        render(_jsx(App, {}));
        const button = screen.getByText(/check system/i);
        fireEvent.click(button);
        expect(await screen.findByText(/offline/i)).toBeInTheDocument();
    });
});

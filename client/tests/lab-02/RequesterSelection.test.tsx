import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RequesterSelection from "../../src/pages/RequesterSelection";
import { RequesterProvider } from "../../src/context/RequesterContext";

describe("Requester Selection Screen", () => {
  function mockRequesters() {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 1,
              fullName: "Narin Chaiyo",
              email: "narin.chaiyo@example.com",
              isActive: true,
            },
            {
              id: 2,
              fullName: "Pimchanok Rattanakul",
              email: "pimchanok.rattanakul@example.com",
              isActive: true,
            },
            {
              id: 3,
              fullName: "Inactive Requester",
              email: "inactive.requester@example.com",
              isActive: false,
            },
          ],
        }),
      }),
    );
  }

  it("loads active requesters and excludes inactive requesters", async () => {
    mockRequesters();

    render(
      <RequesterProvider>
        <RequesterSelection />
      </RequesterProvider>,
    );

    expect(
      await screen.findByText("Select Development Requester"),
    ).toBeInTheDocument();

    expect(screen.getByText("Narin Chaiyo")).toBeInTheDocument();

    expect(
      screen.getByText("Pimchanok Rattanakul"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Inactive Requester"),
    ).not.toBeInTheDocument();
  });

  it("selects a requester when Continue is clicked", async () => {
    mockRequesters();

    const onRequesterSelected = vi.fn();

    render(
      <RequesterProvider>
        <RequesterSelection
          onRequesterSelected={onRequesterSelected}
        />
      </RequesterProvider>,
    );

    expect(
      await screen.findByText("Select Development Requester"),
    ).toBeInTheDocument();

    const requesterSelect = screen.getByRole("combobox", {
      name: /Development Requester/,
    });


    fireEvent.change(requesterSelect, {
      target: { value: "2" },
    });

    expect(requesterSelect).toHaveValue("2");

    const continueButton = screen.getByRole("button", {
      name: "Continue",
    });

    expect(continueButton).not.toBeDisabled();

    fireEvent.click(continueButton);

    expect(onRequesterSelected).toHaveBeenCalledTimes(1);
  });

  it("keeps Continue disabled until a requester is selected", async () => {
    mockRequesters();

    render(
      <RequesterProvider>
        <RequesterSelection />
      </RequesterProvider>,
    );

    expect(
      await screen.findByText("Select Development Requester"),
    ).toBeInTheDocument();

    const continueButton = screen.getByRole("button", {
      name: "Continue",
    });

    expect(continueButton).toBeDisabled();
  });
});

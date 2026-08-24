import { createContext, useContext, useState } from "react";

type Requester = {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
};

type RequesterContextValue = {
  selectedRequester: Requester | null;
  setSelectedRequester: (requester: Requester | null) => void;
};

const RequesterContext = createContext<RequesterContextValue | undefined>(
  undefined,
);

export function RequesterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedRequester, setSelectedRequester] =
    useState<Requester | null>(null);

  return (
    <RequesterContext.Provider
      value={{ selectedRequester, setSelectedRequester }}
    >
      {children}
    </RequesterContext.Provider>
  );
}

export function useRequester() {
  const context = useContext(RequesterContext);

  if (!context) {
    throw new Error(
      "useRequester must be used inside a RequesterProvider",
    );
  }

  return context;
}
import {createContext, useContext, useState, type ReactNode} from "react";

export type Requester = {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
};

type RequesterContextValue = {
  selectedRequester: Requester | null;
  setSelectedRequester: (requester: Requester | null) => void;
  clearRequester: () => void;
};

const RequesterContext = createContext<
  RequesterContextValue | undefined
>(undefined);

export function RequesterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedRequester, setSelectedRequesterState] =
    useState<Requester | null>(() => {
      const saved = localStorage.getItem("requester");

      if (!saved) {
        return null;
      }

      try {
        return JSON.parse(saved) as Requester;
      } catch {
        localStorage.removeItem("requester");
        return null;
      }
    });

  function setSelectedRequester(requester: Requester | null) {
    setSelectedRequesterState(requester);

    if (requester) {
      localStorage.setItem("requester", JSON.stringify(requester));
    } else {
      localStorage.removeItem("requester");
    }
  }

  function clearRequester() {
    setSelectedRequester(null);
  }

  return (
    <RequesterContext.Provider
      value={{
        selectedRequester,
        setSelectedRequester,
        clearRequester,
      }}
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
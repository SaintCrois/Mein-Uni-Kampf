import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const RequesterContext = createContext(undefined);
export function RequesterProvider({ children, }) {
    const [selectedRequester, setSelectedRequester] = useState(null);
    return (_jsx(RequesterContext.Provider, { value: { selectedRequester, setSelectedRequester }, children: children }));
}
export function useRequester() {
    const context = useContext(RequesterContext);
    if (!context) {
        throw new Error("useRequester must be used inside a RequesterProvider");
    }
    return context;
}

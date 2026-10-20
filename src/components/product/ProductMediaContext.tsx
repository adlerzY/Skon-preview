"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface ProductMediaState {
  selectedImage: string | null;
  variationImages: string[];
  activeVariationImage: string | null;
}

interface ProductMediaActions {
  selectImage: (url: string | null) => void;
  registerVariationImages: (urls: string[]) => void;
  showVariationImage: (url: string | null, resetSelection: boolean) => void;
}

const INITIAL_STATE: ProductMediaState = {
  selectedImage: null,
  variationImages: [],
  activeVariationImage: null,
};

const NOOP_ACTIONS: ProductMediaActions = {
  selectImage: () => {},
  registerVariationImages: () => {},
  showVariationImage: () => {},
};

const StateContext = createContext<ProductMediaState>(INITIAL_STATE);
const ActionsContext = createContext<ProductMediaActions>(NOOP_ACTIONS);

function sameList(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function ProductMediaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProductMediaState>(INITIAL_STATE);

  const actions = useMemo<ProductMediaActions>(
    () => ({
      selectImage: (url) =>
        setState((prev) => (prev.selectedImage === url ? prev : { ...prev, selectedImage: url })),
      registerVariationImages: (urls) =>
        setState((prev) =>
          sameList(prev.variationImages, urls) ? prev : { ...prev, variationImages: urls }
        ),
      showVariationImage: (url, resetSelection) =>
        setState((prev) => {
          const nextSelected = resetSelection ? null : prev.selectedImage;
          if (prev.activeVariationImage === url && prev.selectedImage === nextSelected) return prev;
          return { ...prev, activeVariationImage: url, selectedImage: nextSelected };
        }),
    }),
    []
  );

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

export function useProductMediaState() {
  return useContext(StateContext);
}

export function useProductMediaActions() {
  return useContext(ActionsContext);
}
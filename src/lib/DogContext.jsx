import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Dog } from "@/api/entities";
import { getActiveDog } from "@/utils";
import { useAuth } from "@/lib/AuthContext";

const DogContext = createContext(null);

export function DogProvider({ children }) {
  const { user, isLoadingAuth } = useAuth();
  const [dog, setDog] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [loadingDog, setLoadingDog] = useState(true);

  const refreshDogs = useCallback(async () => {
    if (!user) return;
    try {
      const list = await Dog.filter({ owner: user.email });
      setDogs(list || []);
      const active = getActiveDog(list || []);
      setDog(active || null);
    } catch (e) {
      console.warn("DogContext: Dog.filter failed:", e);
    } finally {
      setLoadingDog(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoadingAuth && user) {
      refreshDogs();
    } else if (!isLoadingAuth && !user) {
      setLoadingDog(false);
    }
  }, [isLoadingAuth, user, refreshDogs]);

  return (
    <DogContext.Provider value={{ dog, dogs, setDog, setDogs, loadingDog, refreshDogs }}>
      {children}
    </DogContext.Provider>
  );
}

export function useDog() {
  const ctx = useContext(DogContext);
  if (!ctx) throw new Error("useDog must be used inside DogProvider");
  return ctx;
}

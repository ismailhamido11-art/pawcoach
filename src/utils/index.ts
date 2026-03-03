export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

/**
 * Returns the active dog based on localStorage activeDogId.
 * Falls back to dogs[0] if the stored ID doesn't match any dog.
 */
export function getActiveDog(dogs: any[]) {
    if (!dogs || dogs.length === 0) return null;
    const activeId = localStorage.getItem("activeDogId");
    if (activeId) {
        const found = dogs.find((d: any) => d.id === activeId);
        if (found) return found;
    }
    // Fallback: use first dog and update localStorage
    localStorage.setItem("activeDogId", dogs[0].id);
    return dogs[0];
}
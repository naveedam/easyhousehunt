// Selling is built but off by default.
// Turn it on with VITE_ENABLE_SALE=true once the legal position is settled.
export const SALE_ENABLED = import.meta.env.VITE_ENABLE_SALE === "true";

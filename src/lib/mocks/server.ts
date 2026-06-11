import { setupServer } from "msw/node";
import { sanityHandlers } from "./handlers/sanity";
import { supabaseHandlers } from "./handlers/supabase";

export const server = setupServer(...sanityHandlers, ...supabaseHandlers);

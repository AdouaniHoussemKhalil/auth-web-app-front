import { z } from "zod";
import { http } from "@/lib/http";

// Utilisateur (consumer) d'une application, tel que renvoyé par l'API, sans ses données sensibles.
export const consumerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  isActive: z.boolean(),
  isEmailVerified: z.boolean().optional(),
  isMFAActivated: z.boolean().optional(),
  isByGoogle: z.boolean().optional(),
  createdOn: z.string(),
});

export type Consumer = z.infer<typeof consumerSchema>;

const pageSchema = z.object({
  data: z.array(consumerSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

export type ConsumerPage = z.infer<typeof pageSchema>;

export interface ConsumersQuery {
  page: number;
  limit: number;
  /** Recherche partielle sur l'e-mail, insensible à la casse. */
  email?: string | undefined;
}

const base = (tenantId: string, appId: string) =>
  `/tenants/${encodeURIComponent(tenantId)}/app/${encodeURIComponent(appId)}/consumers`;

export const consumersApi = {
  list: (tenantId: string, appId: string, query: ConsumersQuery, signal?: AbortSignal) =>
    http<unknown>(base(tenantId, appId), {
      query: { page: query.page, limit: query.limit, ...(query.email && { email: query.email }) },
      signal,
    }).then((data) => pageSchema.parse(data)),

  /** Bloquer ferme aussi toutes les sessions de l'utilisateur (côté API). */
  setActive: (tenantId: string, appId: string, consumerId: string, isActive: boolean) =>
    http<unknown>(`${base(tenantId, appId)}/${encodeURIComponent(consumerId)}`, {
      method: "PATCH",
      body: { isActive },
    }).then((data) => z.object({ data: consumerSchema }).parse(data).data),

  remove: (tenantId: string, appId: string, consumerId: string) =>
    http<unknown>(`${base(tenantId, appId)}/${encodeURIComponent(consumerId)}`, {
      method: "DELETE",
    }),
};

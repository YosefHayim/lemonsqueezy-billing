import type { AffiliateManagement, Affiliate } from "../types/index.js";

export function createAffiliateManagement(): AffiliateManagement {
  return {
    listAffiliates: async (_storeId?: string): Promise<Affiliate[]> => {
      throw new Error("Not supported in this SDK version");
    },

    getAffiliate: async (_affiliateId: string): Promise<Affiliate | null> => {
      throw new Error("Not supported in this SDK version");
    },
  };
}

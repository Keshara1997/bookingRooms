export interface Branch {
    id: string;
    hotelId: string;
    name: string;
    code: string;
    description?: string | null;
    city?: string | null;
    country?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    status: string;
    createdAt: string;
  }
  
  export interface Hotel {
    id: string;
    tenantId: string;
    name: string;
    description?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    city?: string | null;
    country?: string | null;
    currency?: string | null;
    timezone?: string | null;
    status: string;
    createdAt: string;
    branches?: Branch[];
  }
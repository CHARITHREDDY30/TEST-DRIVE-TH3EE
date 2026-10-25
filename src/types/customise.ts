export type CustomDesignSource = 'have_design' | 'have_idea';

export type CustomOrderStatus =
  | 'pending_review'
  | 'under_review'
  | 'more_info_required'
  | 'quotation_sent'
  | 'awaiting_customer_approval'
  | 'awaiting_payment'
  | 'paid'
  | 'artwork_approval_pending'
  | 'in_production'
  | 'ready_for_dispatch'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'quote_expired'
  | 'rejected';

export type GarmentFitType = 'Oversized' | 'Regular Fit' | 'Boxy Fit';
export type GarmentCategoryType = 'T-Shirt' | 'Hoodie';
export type SleeveType = 'Half Sleeve' | 'Full Sleeve';
export type NeckType = 'Round Neck' | 'Polo Neck';
export type PrintSize = 'small' | 'medium' | 'large' | 'full_print' | 'custom';

export interface CustomRequestVariant {
  id?: string;
  requestId?: string;
  color: string;
  size: string;
  quantity: number;
  notes?: string;
}

export interface CustomRequestPlacement {
  id?: string;
  requestId?: string;
  placementLocation: string; // e.g. 'front_chest', 'center_chest', 'large_front', 'upper_back', 'full_back', 'left_sleeve', 'right_sleeve', 'both_sleeves', 'custom'
  printSize: PrintSize;
  customDimensions?: string;
  artworkUrl?: string;
  artworkKey?: string;
  notes?: string;
}

export interface CustomRequestFile {
  id?: string;
  requestId?: string;
  fileType: 'artwork' | 'reference' | 'proof';
  fileName: string;
  fileUrl: string;
  fileKey?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  targetPlacement?: string;
  createdAt?: string;
}

export interface CustomQuotationLineItem {
  description: string;
  amount: number;
  category?: 'garment' | 'print' | 'placement' | 'artwork' | 'discount' | 'shipping' | 'tax' | 'fee';
}

export interface CustomQuotation {
  id: string;
  requestId: string;
  version: number;
  garmentBasePrice: number;
  printingCharges: number;
  placementCharges: number;
  artworkCharges: number;
  quantityDiscount: number;
  otherFees: number;
  shippingCharges: number;
  taxCharges: number;
  subtotal: number;
  finalTotal: number;
  estimatedProductionDays: number;
  validUntil?: string;
  terms?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'revised';
  acceptedAt?: string;
  lineItems: CustomQuotationLineItem[];
  createdBy?: string;
  createdAt: string;
}

export interface CustomArtworkProof {
  id: string;
  requestId: string;
  version: number;
  proofImageUrl: string;
  proofImageKey?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'revision_requested';
  customerFeedback?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface CustomRequestTimelineEvent {
  id: string;
  requestId: string;
  status: string;
  title: string;
  description?: string;
  actor: 'customer' | 'admin' | 'system' | 'payment_gateway';
  createdAt: string;
}

export interface CustomRequest {
  id: string;
  requestNumber: string;
  trackingToken: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preferredContact: 'whatsapp' | 'email' | 'phone';
  designType: CustomDesignSource;
  designDescription?: string;
  printingInstructions?: string;
  intendedUse: string; // 'personal' | 'event' | 'group' | 'business' | 'other'
  requiredDate?: string;
  garmentCategory: string;
  fit: GarmentFitType;
  sleeve: SleeveType;
  neckType: NeckType;
  fabric: string;
  gsm: string;
  primaryColor: string;
  totalQuantity: number;
  status: CustomOrderStatus;
  currentQuotationId?: string;
  convertedOrderId?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  internalNotes?: string;
  artworkApprovalRequired: boolean;
  approvedProofId?: string;
  createdAt: string;
  updatedAt: string;

  // Joined relations when retrieved
  variants?: CustomRequestVariant[];
  placements?: CustomRequestPlacement[];
  files?: CustomRequestFile[];
  activeQuotation?: CustomQuotation;
  proofs?: CustomArtworkProof[];
  timeline?: CustomRequestTimelineEvent[];
}

export interface GarmentSizeMeasurement {
  size: string; // 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  chestCm: number;
  chestIn: number;
  lengthCm: number;
  lengthIn: number;
  shoulderCm: number;
  shoulderIn: number;
  sleeveCm: number;
  sleeveIn: number;
}

export interface GarmentFitOption {
  id: GarmentFitType;
  name: GarmentFitType;
  tagline: string;
  silhouette: string;
  shoulderStyle: string;
  bodyDrape: string;
  recommendedUse: string;
  measurements: GarmentSizeMeasurement[];
}

export interface ColorSwatch {
  name: string;
  hex: string;
  border?: string;
  badge?: string;
}

export interface FabricSpec {
  name: string;
  composition: string;
  gsm: string;
  weave: string;
  feel: string;
  description: string;
  fits: GarmentFitType[];
}

export interface PrintPlacementDefinition {
  id: string;
  label: string;
  zone: 'front' | 'back' | 'sleeve';
  description: string;
  defaultDimensions: string;
  recommendedSizes: PrintSize[];
  highlightCoordinates: {
    cx?: number;
    cy?: number;
    r?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
}

export interface CustomisationCatalogConfig {
  fits: GarmentFitOption[];
  categories: string[];
  sleeves: SleeveType[];
  neckTypes: NeckType[];
  fabrics: FabricSpec[];
  colors: ColorSwatch[];
  placements: PrintPlacementDefinition[];
  basePrices: {
    baseTshirt: number;
    baseHoodie: number;
    frontPrint: number;
    backPrint: number;
    sleevePrint: number;
    fullPrint: number;
    customPrint: number;
  };
}

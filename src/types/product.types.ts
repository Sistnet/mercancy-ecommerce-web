/**
 * Product Types - Baseado em Flutter product_model.dart
 */

export interface Product {
  id: number;
  // Canonical URL fields (Amazon/Mercado Livre style)
  publicId?: string;    // ULID - stable identifier for URLs
  slug?: string;        // SEO-friendly slug from name
  name: string;
  description: string;
  image: string[];
  price: number;
  variations: Variation[];
  tax: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  attributes: string[];
  categoryIds: CategoryId[];
  choiceOptions: ChoiceOption[];
  discount: number;
  weight: number;
  discountType: 'flat' | 'percent';
  taxType: 'included' | 'excluded';
  unit: string;
  capacity: number;
  totalStock: number;
  rating: Rating[];
  activeReviews: ActiveReview[];
  maximumOrderQuantity: number;
  categoryDiscount: CategoryDiscount | null;
}

export interface Variation {
  type: string;
  price: number;
  stock: number;
}

export interface ChoiceOption {
  name: string;
  title: string;
  options: string[];
}

export interface CategoryId {
  id: string;
  position: number;
}

export interface Rating {
  average: number;
  productId: number;
}

export interface ActiveReview {
  id: number;
  productId: number;
  customerId: number;
  comment: string;
  attachment: string[];
  rating: number;
  createdAt: string;
  updatedAt: string;
  orderId: number;
  customer: ReviewCustomer | null;
}

export interface ReviewCustomer {
  id: number;
  fName: string;
  lName: string;
  image?: string;
}

export interface CategoryDiscount {
  id: number;
  categoryId: number;
  discount: number;
  discountType: 'flat' | 'percent';
}

export interface ProductModel {
  total_size?: number;
  totalSize?: number;
  limit: number;
  offset: number;
  flash_deal?: FlashDeal | null;
  flashDeal?: FlashDeal | null;
  products: Product[];
  lowest_price?: number;
  highest_price?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface FlashDeal {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: number;
  featured: number;
  image: string;
  products: Product[];
}

export interface Category {
  id: number;
  name: string;
  image: string;
  public_id?: string; // AIDEV-NOTE: ULID for R2 image path (img/c/{public_id}/{filename})
  parent_id: number;
  position: number;
  status: number;
  created_at: string;
  updated_at: string;
  childes?: Category[];
}

export interface Banner {
  id: number;
  title: string;
  image: string;
  productId?: number;
  categoryId?: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductFilterType =
  | 'latest'
  | 'popular'
  | 'price_low_to_high'
  | 'price_high_to_low'
  | 'a_to_z'
  | 'z_to_a';

export interface ProductsState {
  products: Product[];
  featuredProducts: Product[];
  dailyNeedsProducts: Product[];
  mostReviewedProducts: Product[];
  selectedProduct: Product | null;
  totalSize: number;
  offset: number;
  isLoading: boolean;
  error: string | null;
  filterType: ProductFilterType;
  minPrice: number;
  maxPrice: number;
}

export interface CategoriesState {
  categories: Category[];
  selectedCategory: Category | null;
  subCategories: Category[];
  categoryProducts: Product[];
  isLoading: boolean;
  error: string | null;
}

export interface BannersState {
  banners: Banner[];
  isLoading: boolean;
  error: string | null;
}

export interface FlashDealsState {
  flashDeal: FlashDeal | null;
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

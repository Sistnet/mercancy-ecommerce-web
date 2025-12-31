/**
 * Config Types - Baseado em Flutter config_model.dart
 */

// AIDEV-NOTE: Storage driver configuration from API
export type StorageDriver = 'local' | 'gcs' | 'r2';

export interface StorageConfig {
  driver: StorageDriver;
  use_signed_urls: boolean;
  public_url: string | null;
  path_prefix: string;
  /** AIDEV-NOTE: Tenant's storage folder (db_schema) for image URL construction */
  storage_folder?: string | null;
}

// AIDEV-NOTE: White-label branding configuration from tenant settings
export interface BrandingConfig {
  tenant_name: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  card_background_color: string | null;
  logo_url: string | null;
  favicon_url: string | null;
}

export interface AppConfig {
  ecommerce_name: string;
  ecommerce_logo: string;
  ecommerce_address: string;
  ecommerce_phone: string;
  ecommerce_email: string;
  ecommerce_location_coverage: LocationCoverage;
  minimum_order_value: number;
  self_pickup: boolean;
  base_urls: BaseUrls;
  storage?: StorageConfig;
  currency_symbol: string;
  delivery_charge: number;
  cash_on_delivery: boolean;
  digital_payment: boolean;
  branches: Branch[];
  terms_and_conditions: string;
  privacy_policy: string;
  about_us: string;
  faq: string;
  return_page: string;
  refund_page: string;
  cancellation_page: string;
  email_verification: boolean;
  phone_verification: boolean;
  currency_symbol_position: 'left' | 'right';
  delivery_management: DeliveryManagement;
  social_login_status: SocialLoginStatus;
  loyalty_point_status: boolean;
  wallet_status: boolean;
  refer_earn_status: boolean;
  cookies_management: CookiesManagement;
  active_payment_method_list: PaymentMethod[];
  customer_login: CustomerLogin;
  maintenance_mode: MaintenanceMode;
  customer_verification: CustomerVerification;
  google_map_status: boolean;
  app_minimum_version: AppMinimumVersion;
  firebase_otp_verification: boolean;
  apple_login: boolean;
  play_store_config: StoreConfig;
  app_store_config: StoreConfig;
  order_image_status: boolean;
  max_amount_for_cod: number;
  free_delivery_over_amount: number;
  free_delivery_status: boolean;
  social_media_link: SocialMediaLink[];
  // AIDEV-NOTE: White-label branding for tenant customization
  branding?: BrandingConfig;
}

export interface LocationCoverage {
  longitude: string;
  latitude: string;
  coverage: number;
}

export interface BaseUrls {
  product_image_url: string;
  customer_image_url: string;
  banner_image_url: string;
  category_image_url: string;
  review_image_url: string;
  notification_image_url: string;
  ecommerce_image_url: string;
  delivery_man_image_url: string;
  chat_image_url: string;
  category_banner: string;
  flash_sale_image_url: string;
  gateway_image_url: string;
  order_image_url: string;
}

export interface Branch {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: string;
  longitude: string;
  coverage: number;
  status: boolean;
  preparationTime: number;
  // AIDEV-NOTE: Business hours status fields
  is_open: boolean;
  is_always_open: boolean;
  is_temporarily_closed: boolean;
  next_opening_time: string | null;
}

export interface DeliveryManagement {
  status: boolean;
  minShippingCharge: number;
  shippingPerKm: number;
}

export interface SocialLoginStatus {
  google: boolean;
  facebook: boolean;
  apple: boolean;
}

export interface CookiesManagement {
  status: boolean;
  cookiesText: string;
}

export interface PaymentMethod {
  id: number;
  gatewayTitle: string;
  gatewayImage: string;
  type: string;
}

export interface CustomerLogin {
  loginOption: 'manual' | 'otp' | 'email';
  phoneVerification: boolean;
  emailVerification: boolean;
  socialMediaLoginOptions: SocialLoginStatus;
}

export interface MaintenanceMode {
  maintenanceStatus: boolean;
  selectedMaintenanceSystem: {
    customerApp: boolean;
    webApp: boolean;
    adminApp: boolean;
  };
  maintenanceTypeAndDuration: {
    maintenanceDuration: 'customize' | 'until_change';
    startDate?: string;
    endDate?: string;
  };
  maintenanceMessages: {
    businessName: string;
    businessNumber: string;
    businessEmail: string;
    maintenanceMessage: string;
    messageBody: string;
  };
}

export interface CustomerVerification {
  status: boolean;
  phone: boolean;
  email: boolean;
  firebase: boolean;
}

export interface AppMinimumVersion {
  androidMinimumVersion: string;
  iosMinimumVersion: string;
}

export interface StoreConfig {
  status: boolean;
  link: string;
}

export interface SocialMediaLink {
  id: number;
  name: string;
  link: string;
  status: boolean;
}

export interface DeliveryInfo {
  deliveryChargeByArea: DeliveryChargeByArea[];
  deliveryChargeSetup: DeliveryChargeSetup;
}

export interface DeliveryChargeByArea {
  id: number;
  branchId: number;
  areaName: string;
  deliveryCharge: number;
}

export interface DeliveryChargeSetup {
  deliveryChargeType: 'fixed' | 'distance' | 'area';
  deliveryCharge: number;
  minimumDeliveryCharge: number;
  minimumDistanceFreeDelivery: number;
  shippingPerKm: number;
}

export interface ConfigState {
  config: AppConfig | null;
  deliveryInfo: DeliveryInfo | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

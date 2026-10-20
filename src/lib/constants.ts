export const SUPER_ADMIN_EMAIL = 'sanchezmanuel397@gmail.com';

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  COMPANY_ADMIN: 'company_admin',
  SUBSCRIBER: 'subscriber',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

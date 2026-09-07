// backend/utils/permissions.js
export const PERMISSIONS = {
  // Member management
  INVITE_MEMBERS: "invite_members",
  REMOVE_MEMBERS: "remove_members",
  UPDATE_ROLES: "update_roles",
  VIEW_MEMBERS: "view_members",

  // Workspace settings
  UPDATE_SETTINGS: "update_settings",
  VIEW_SETTINGS: "view_settings",

  // Integrations
  MANAGE_INTEGRATIONS: "manage_integrations",

  // API Keys
  MANAGE_API_KEYS: "manage_api_keys",

  // Reports
  VIEW_ALL_REPORTS: "view_all_reports",
  VIEW_OWN_REPORTS: "view_own_reports",
  DELETE_REPORTS: "delete_reports",

  // Schedules
  MANAGE_SCHEDULES: "manage_schedules",

  // Webhooks
  MANAGE_WEBHOOKS: "manage_webhooks",

  // Branding
  MANAGE_BRANDING: "manage_branding",
};

export const ROLE_PERMISSIONS = {
  owner: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.INVITE_MEMBERS,
    PERMISSIONS.REMOVE_MEMBERS,
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.UPDATE_SETTINGS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_API_KEYS,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.DELETE_REPORTS,
    PERMISSIONS.MANAGE_SCHEDULES,
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.MANAGE_BRANDING,
  ],
  member: [
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.VIEW_OWN_REPORTS,
  ],
  viewer: [
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.VIEW_OWN_REPORTS,
  ],
};
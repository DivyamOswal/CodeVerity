// backend/models/Workspace.js
import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    // ─── Basic Info ──────────────────────────────────────────
    name: {
      type: String,
      required: true,
      trim: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Members ─────────────────────────────────────────────
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["owner", "admin", "member", "viewer"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        // Optional: custom permissions override per member
        permissions: {
          type: [String],
          default: [],
        },
      },
    ],

    // ─── Invitations ─────────────────────────────────────────
    invitations: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        role: {
          type: String,
          enum: ["owner", "admin", "member", "viewer"],
          default: "member",
        },
        token: {
          type: String,
          required: true,
          unique: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "expired", "cancelled"],
          default: "pending",
        },
      },
    ],

    // ─── Settings ─────────────────────────────────────────────
    settings: {
      integrations: {
        slack: {
          enabled: { type: Boolean, default: false },
          webhookUrl: { type: String, default: "" },
          channel: { type: String, default: "" },
        },
        jira: {
          enabled: { type: Boolean, default: false },
          url: { type: String, default: "" },
          apiToken: { type: String, default: "" },
          projectKey: { type: String, default: "" },
        },
      },
      scanSettings: {
        maxFiles: { type: Number, default: 500 },
        maxFileSize: { type: Number, default: 1048576 },
        includePatterns: { type: [String], default: [] },
        excludePatterns: {
          type: [String],
          default: ["node_modules", ".git", "dist"],
        },
      },
    },

    // ─── API Keys ─────────────────────────────────────────────
    apiKeys: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        key: {
          type: String,
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
        lastUsed: { type: Date, default: null },
      },
    ],

    // ─── Webhooks ─────────────────────────────────────────────
    webhookUrl: { type: String, default: "" },
    webhookSecret: { type: String, default: "" },

    // ─── Branding ─────────────────────────────────────────────
    branding: {
      logo: { type: String, default: "" },
      primaryColor: { type: String, default: "#22d3ee" },
      secondaryColor: { type: String, default: "#0e7490" },
      brandName: { type: String, default: "CodeVerity" },
    },

    // ─── Schedules ────────────────────────────────────────────
    schedules: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        repoUrl: { type: String, required: true },
        frequency: {
          type: String,
          enum: ["daily", "weekly", "monthly"],
          required: true,
        },
        time: { type: String, required: true },
        lastRun: { type: Date, default: null },
        nextRun: { type: Date, default: null },
        enabled: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // ─── Audit Logs ───────────────────────────────────────────
    auditLogs: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        action: { type: String },
        message: { type: String },
        metadata: { type: Object, default: {} },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // ─── Usage & Limits ──────────────────────────────────────
    plan: {
      type: String,
      enum: ["starter", "pro", "team"],
      default: "starter",
    },
    tokensLimit: { type: Number, default: 50000 },
    scansLimit: { type: Number, default: 5 },

    totalScans: { type: Number, default: 0 },
    totalReports: { type: Number, default: 0 },

    // ─── Billing ──────────────────────────────────────────────
    billing: {
      customerId: { type: String, default: "" },
      subscriptionId: { type: String, default: "" },
      status: {
        type: String,
        enum: ["active", "past_due", "canceled", "incomplete"],
        default: "active",
      },
    },

    // ─── Soft Delete ──────────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    // ─── Workspace Tags (optional) ──────────────────────────
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ────────────────────────────────────────────────────────────────
// Pre-save: ensure owner is in members
// ────────────────────────────────────────────────────────────────
workspaceSchema.pre("save", async function () {
  if (this.isNew) {
    const ownerExists = this.members.some(
      (m) => m.userId.toString() === this.ownerId.toString()
    );
    if (!ownerExists) {
      this.members.push({
        userId: this.ownerId,
        role: "owner",
      });
    }
  }
});

// ────────────────────────────────────────────────────────────────
// Instance Methods
// ────────────────────────────────────────────────────────────────

// Add a member
workspaceSchema.methods.addMember = async function (userId, role = "member") {
  const existing = this.members.find(
    (m) => m.userId.toString() === userId.toString()
  );
  if (existing) {
    existing.role = role;
  } else {
    this.members.push({ userId, role });
  }
  await this.save();
  return this;
};

// Remove a member
workspaceSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter(
    (m) => m.userId.toString() !== userId.toString()
  );
  await this.save();
  return this;
};

// Check if user has a role
workspaceSchema.methods.hasRole = function (userId, roles = []) {
  const member = this.members.find(
    (m) => m.userId.toString() === userId.toString()
  );
  if (!member) return false;
  return roles.includes(member.role);
};

// Check if user has a specific permission
workspaceSchema.methods.hasPermission = function (userId, permission) {
  const member = this.members.find(
    (m) => m.userId.toString() === userId.toString()
  );
  if (!member) return false;

  // Owners have all permissions
  if (member.role === "owner") return true;

  // Check custom permissions first
  if (member.permissions && member.permissions.includes(permission)) {
    return true;
  }

  // Fallback to role-based permissions
  const ROLE_PERMISSIONS = {
    admin: [
      "invite_members",
      "remove_members",
      "update_roles",
      "view_members",
      "update_settings",
      "view_settings",
      "manage_integrations",
      "manage_api_keys",
      "view_all_reports",
      "delete_reports",
      "manage_schedules",
      "manage_webhooks",
      "manage_branding",
    ],
    member: ["view_members", "view_settings", "view_own_reports"],
    viewer: ["view_settings", "view_own_reports"],
  };

  const rolePerms = ROLE_PERMISSIONS[member.role] || [];
  return rolePerms.includes(permission);
};

// ─── Indexes ──────────────────────────────────────
workspaceSchema.index({ 'members.userId': 1 });
workspaceSchema.index({ ownerId: 1 });
workspaceSchema.index({ isDeleted: 1, deletedAt: 1 });


export default mongoose.model("Workspace", workspaceSchema);
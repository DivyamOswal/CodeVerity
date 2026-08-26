// backend/models/Workspace.js
import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // The user who created the workspace (owner)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Members of the workspace with their roles
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
      },
    ],
    // Workspace-level settings
    settings: {
      // Integration settings
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
      // Scan settings
      scanSettings: {
        maxFiles: { type: Number, default: 500 },
        maxFileSize: { type: Number, default: 1048576 }, // 1MB
        includePatterns: { type: [String], default: [] },
        excludePatterns: { type: [String], default: ["node_modules", ".git", "dist"] },
      },
    },
    // Aggregated usage
    totalScans: {
      type: Number,
      default: 0,
    },
    totalReports: {
      type: Number,
      default: 0,
    },
    // Optional: billing/subscription reference
    billing: {
      customerId: { type: String, default: "" },
      subscriptionId: { type: String, default: "" },
      status: { type: String, enum: ["active", "past_due", "canceled", "incomplete"], default: "active" },
    },
  },
  { timestamps: true }
);

// Pre-save middleware: ensure owner is in members with role "owner"
workspaceSchema.pre("save", function (next) {
  if (this.isNew) {
    // Ensure owner is in members
    const ownerExists = this.members.some(
      (m) => m.userId.toString() === this.ownerId.toString()
    );
    if (!ownerExists) {
      this.members.push({ userId: this.ownerId, role: "owner" });
    }
  }
  next();
});

// Instance method: add a member
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

// Instance method: remove a member
workspaceSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter(
    (m) => m.userId.toString() !== userId.toString()
  );
  await this.save();
  return this;
};

// Instance method: check if user has role
workspaceSchema.methods.hasRole = function (userId, roles = []) {
  const member = this.members.find(
    (m) => m.userId.toString() === userId.toString()
  );
  if (!member) return false;
  return roles.includes(member.role);
};

export default mongoose.model("Workspace", workspaceSchema);

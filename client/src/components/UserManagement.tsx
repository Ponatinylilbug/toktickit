import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  AuthUser,
  UserRole,
  PaginationMeta,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
} from "../api.js";

export default function UserManagement() {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("REQUESTER");
  const [department, setDepartment] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Reset password result modal
  const [resetResult, setResetResult] = useState<{ userEmail: string; tempPass?: string } | null>(null);

  const loadUsers = useCallback(async (page = 1) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetchAdminUsers(
        {
          search,
          role: roleFilter,
          isActive: statusFilter === "" ? undefined : statusFilter === "active",
          page,
          pageSize: 10,
        },
        token
      );
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to load users." });
    } finally {
      setIsLoading(false);
    }
  }, [token, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setRole("REQUESTER");
    setDepartment("");
    setInitialPassword("InitialPassword123!");
    setIsActive(true);
    setModalError(null);
    setShowUserModal(true);
  };

  const handleOpenEditModal = (u: AuthUser) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setDepartment(u.department || "");
    setIsActive(u.isActive !== false);
    setModalError(null);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setModalSubmitting(true);
    setModalError(null);

    try {
      if (editingUser) {
        // Safety guard: prevent self deactivation
        if (currentUser && currentUser.id === editingUser.id && !isActive) {
          throw new Error("Administrators cannot deactivate their own account.");
        }

        const updated = await updateAdminUser(
          editingUser.id,
          {
            name: name.trim(),
            role,
            department: department.trim() || undefined,
            isActive,
          },
          token
        );

        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        setFeedback({ type: "success", text: `User ${updated.name} updated successfully.` });
      } else {
        const created = await createAdminUser(
          {
            name: name.trim(),
            email: email.trim(),
            role,
            department: department.trim() || undefined,
            password: initialPassword || undefined,
          },
          token
        );

        setFeedback({
          type: "success",
          text: `User ${created.user.name} created successfully. Temporary password: ${created.temporaryPassword || initialPassword}`,
        });
        loadUsers(pagination.page);
      }

      setShowUserModal(false);
    } catch (err: any) {
      setModalError(err.message || "Failed to save user.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleResetPassword = async (u: AuthUser) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to reset password for ${u.name} (${u.email})?`)) {
      return;
    }

    try {
      const res = await resetAdminUserPassword(u.id, token);
      setResetResult({
        userEmail: u.email,
        tempPass: res.temporaryPassword,
      });
      setFeedback({ type: "success", text: `Password for ${u.name} has been reset.` });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to reset password." });
    }
  };

  return (
    <div className="zen-card p-4 mx-auto my-3" style={{ maxWidth: 1140 }} data-testid="admin-users-card">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 mb-3 border-bottom">
        <div>
          <h1 className="h4 fw-bold mb-1" style={{ color: "var(--color-primary)" }}>
            User Management
          </h1>
          <p className="text-muted small mb-0">
            Create, update roles, manage activation status, and reset passwords for system users.
          </p>
        </div>
        <button
          type="button"
          className="btn zen-btn-primary d-flex align-items-center gap-1"
          onClick={handleOpenAddModal}
          data-testid="add-user-button"
        >
          <span>+</span> Add New User
        </button>
      </div>

      {feedback && (
        <div
          className={`alert ${feedback.type === "success" ? "alert-success" : "alert-danger"} py-2 px-3 mb-3 small`}
          role="alert"
          data-testid="admin-feedback-alert"
        >
          {feedback.text}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-light p-3 rounded mb-4 border" data-testid="admin-filters">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="admin-search-input"
            />
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              data-testid="admin-role-filter"
            >
              <option value="">All Roles</option>
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-testid="admin-status-filter"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="col-12 col-md-2 d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => loadUsers(pagination.page)}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-5" data-testid="admin-loading">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading users...</span>
          </div>
          <p className="text-muted small mt-2">Loading user directory…</p>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && users.length > 0 && (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" data-testid="admin-users-table">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} data-testid={`user-row-${u.id}`}>
                  <td>
                    <strong>{u.name}</strong>
                    {currentUser?.id === u.id && (
                      <span className="badge bg-light text-primary ms-1 border">You</span>
                    )}
                  </td>
                  <td className="font-monospace small">{u.email}</td>
                  <td>
                    <span
                      className={`badge ${
                        u.role === "ADMINISTRATOR"
                          ? "bg-danger"
                          : u.role === "IT_STAFF"
                          ? "bg-primary"
                          : "bg-secondary"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="small text-muted">{u.department || "—"}</td>
                  <td>
                    {u.isActive !== false ? (
                      <span className="badge bg-success">Active</span>
                    ) : (
                      <span className="badge bg-secondary">Inactive</span>
                    )}
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => handleOpenEditModal(u)}
                        data-testid={`edit-user-button-${u.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => handleResetPassword(u)}
                        data-testid={`reset-user-button-${u.id}`}
                        title="Reset Password"
                      >
                        Reset PW
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Create/Edit Modal */}
      {showUserModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          data-testid="user-modal"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSaveUser}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {editingUser ? `Edit User: ${editingUser.name}` : "Create New User"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowUserModal(false)}
                    disabled={modalSubmitting}
                  />
                </div>

                <div className="modal-body">
                  {modalError && (
                    <div className="alert alert-danger py-2 px-3 mb-3 small" data-testid="user-modal-error">
                      {modalError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="modal-name" className="form-label fw-semibold small">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="modal-name"
                      type="text"
                      className="form-control form-control-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      data-testid="user-name-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="modal-email" className="form-label fw-semibold small">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      id="modal-email"
                      type="email"
                      className="form-control form-control-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={!!editingUser}
                      data-testid="user-email-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="modal-role" className="form-label fw-semibold small">
                      System Role <span className="text-danger">*</span>
                    </label>
                    <select
                      id="modal-role"
                      className="form-select form-select-sm"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      data-testid="user-role-select"
                    >
                      <option value="REQUESTER">REQUESTER</option>
                      <option value="IT_STAFF">IT_STAFF</option>
                      <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="modal-department" className="form-label fw-semibold small">
                      Department
                    </label>
                    <input
                      id="modal-department"
                      type="text"
                      className="form-control form-control-sm"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. IT Operations, Finance"
                      data-testid="user-department-input"
                    />
                  </div>

                  {!editingUser && (
                    <div className="mb-3">
                      <label htmlFor="modal-password" className="form-label fw-semibold small">
                        Initial Password
                      </label>
                      <input
                        id="modal-password"
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        value={initialPassword}
                        onChange={(e) => setInitialPassword(e.target.value)}
                        placeholder="InitialPassword123!"
                        data-testid="user-initial-password-input"
                      />
                      <div className="form-text text-muted" style={{ fontSize: 11 }}>
                        The user will be forced to change this password on first login.
                      </div>
                    </div>
                  )}

                  <div className="form-check form-switch mt-3">
                    <input
                      id="modal-active"
                      type="checkbox"
                      className="form-check-input"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      data-testid="user-active-checkbox"
                    />
                    <label htmlFor="modal-active" className="form-check-label small fw-semibold">
                      Active Account
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowUserModal(false)}
                    disabled={modalSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm zen-btn-primary"
                    disabled={modalSubmitting}
                    data-testid="user-save-button"
                  >
                    {modalSubmitting ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Result Modal */}
      {resetResult && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          data-testid="reset-result-modal"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-3 text-center">
              <div className="modal-header border-0 pb-0 justify-content-center">
                <h5 className="modal-title fw-bold">Password Reset Completed</h5>
              </div>
              <div className="modal-body py-3">
                <p className="small text-muted mb-2">
                  A temporary password was generated for <strong>{resetResult.userEmail}</strong>:
                </p>
                <div
                  className="p-3 bg-light rounded border font-monospace fs-5 fw-bold text-success mb-3"
                  data-testid="temp-password-display"
                >
                  {resetResult.tempPass || "InitialPassword123!"}
                </div>
                <p className="small text-muted mb-0">
                  Please securely share this temporary password with the user. They will be prompted to change it upon next sign-in.
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button
                  type="button"
                  className="btn btn-sm zen-btn-primary px-4"
                  onClick={() => setResetResult(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

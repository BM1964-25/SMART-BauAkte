const api = {
  async getState() {
    const response = await fetch("/api/state");
    if (response.status === 401) throw new Error("unauthorized");
    return response.json();
  },
  async session() {
    const response = await fetch("/api/session");
    return response.json();
  },
  async login(payload) {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("login_failed");
    return response.json();
  },
  async verifyMfa(payload) {
    const response = await fetch("/api/login/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("mfa_failed");
    return response.json();
  },
  async logout() {
    const response = await fetch("/api/logout", { method: "POST" });
    return response.json();
  },
  async logoutAll() {
    const response = await fetch("/api/session/logout-all", { method: "POST" });
    if (!response.ok) throw new Error("logout_all_failed");
    return response.json();
  },
  async createProject(payload) {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json();
  },
  async updateTenant(payload) {
    const response = await fetch("/api/tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("tenant_failed");
    return response.json();
  },
  async createDeadline(payload) {
    const response = await fetch("/api/deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json();
  },
  async uploadDocuments(projectId, files) {
    const formData = new FormData();
    formData.append("project_id", projectId);
    Array.from(files).forEach((file) => formData.append("files", file));
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    return response.json();
  },
  async ask(text) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    return response.json();
  },
  async analyze(filename) {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename })
    });
    return response.json();
  },
  async search(query) {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("search_failed");
    return response.json();
  },
  async updateDocumentStatus(payload) {
    const response = await fetch("/api/documents/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("status_failed");
    return response.json();
  },
  async runApprovalAction(payload) {
    const response = await fetch("/api/documents/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("approval_failed");
    return response.json();
  },
  async updateInvoiceFields(payload) {
    const response = await fetch("/api/invoices/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("invoice_fields_failed");
    return response.json();
  },
  async saveInvoiceRule(payload) {
    const response = await fetch("/api/invoice-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("invoice_rule_failed");
    return response.json();
  },
  async deleteInvoiceRule(id) {
    const response = await fetch("/api/invoice-rules/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error("invoice_rule_delete_failed");
    return response.json();
  },
  async batchUpdateDocuments(payload) {
    const response = await fetch("/api/documents/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("batch_failed");
    return response.json();
  },
  async addDocumentNote(payload) {
    const response = await fetch("/api/documents/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("note_failed");
    return response.json();
  },
  async addDocumentTask(payload) {
    const response = await fetch("/api/documents/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("task_failed");
    return response.json();
  },
  async updateDocumentTaskStatus(payload) {
    const response = await fetch("/api/documents/task/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("task_status_failed");
    return response.json();
  },
  async reprocessDocument(id) {
    const response = await fetch("/api/documents/reprocess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error("reprocess_failed");
    return response.json();
  },
  async archiveDocument(id) {
    const response = await fetch("/api/documents/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error("archive_failed");
    return response.json();
  },
  async restoreDocument(id) {
    const response = await fetch("/api/documents/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error("restore_failed");
    return response.json();
  },
  async markNotificationsRead(keys) {
    const response = await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys })
    });
    if (!response.ok) throw new Error("notifications_failed");
    return response.json();
  },
  async updateUserRole(payload) {
    const response = await fetch("/api/users/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("role_failed");
    return response.json();
  },
  async createUser(payload) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("user_failed");
    return response.json();
  },
  async backup() {
    const response = await fetch("/api/backup");
    if (!response.ok) throw new Error("backup_failed");
    return response.json();
  },
  async verifyBackup() {
    const response = await fetch("/api/backup/verify");
    if (!response.ok) throw new Error("backup_verify_failed");
    return response.json();
  },
  async runSystemCheck() {
    const response = await fetch("/api/system-check");
    if (!response.ok) throw new Error("system_check_failed");
    return response.json();
  },
  async repairChecksums() {
    const response = await fetch("/api/system-check/repair-checksums", { method: "POST" });
    if (!response.ok) throw new Error("checksum_repair_failed");
    return response.json();
  },
  async updateSecurityPolicy(payload) {
    const response = await fetch("/api/security/policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("security_policy_failed");
    return response.json();
  },
  async updateComplianceSettings(payload) {
    const response = await fetch("/api/compliance/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("compliance_settings_failed");
    return response.json();
  },
  async runComplianceCleanup() {
    const response = await fetch("/api/compliance/cleanup", { method: "POST" });
    if (!response.ok) throw new Error("compliance_cleanup_failed");
    return response.json();
  },
  async updateUserStatus(payload) {
    const response = await fetch("/api/users/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("user_status_failed");
    return response.json();
  },
  async updateUserMfa(payload) {
    const response = await fetch("/api/users/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("user_mfa_failed");
    return response.json();
  },
  async resetUserPassword(payload) {
    const response = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("password_reset_failed");
    return response.json();
  },
  async sendDeadlineReminders() {
    const response = await fetch("/api/deadlines/remind", { method: "POST" });
    if (!response.ok) throw new Error("deadline_reminder_failed");
    return response.json();
  },
  async sendTaskReminders() {
    const response = await fetch("/api/tasks/remind", { method: "POST" });
    if (!response.ok) throw new Error("task_reminder_failed");
    return response.json();
  },
  async runEscalations() {
    const response = await fetch("/api/escalations/run", { method: "POST" });
    if (!response.ok) throw new Error("escalation_failed");
    return response.json();
  },
  async updateEscalationRule(payload) {
    const response = await fetch("/api/escalations/rule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("escalation_rule_failed");
    return response.json();
  },
  async updateEmailTemplate(payload) {
    const response = await fetch("/api/email-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("email_template_failed");
    return response.json();
  },
  async resetEmailTemplate(kind) {
    const response = await fetch("/api/email-template/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind })
    });
    if (!response.ok) throw new Error("email_template_reset_failed");
    return response.json();
  },
  async updateOutboxMail(payload) {
    const response = await fetch("/api/outbox/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("outbox_update_failed");
    return response.json();
  },
  async deleteOutboxMail(id) {
    const response = await fetch("/api/outbox/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error("outbox_delete_failed");
    return response.json();
  },
  async sendOutboxMail(id) {
    const response = await fetch("/api/outbox/send-one", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error("outbox_send_one_failed");
    return response.json();
  },
  async updateMailSettings(payload) {
    const response = await fetch("/api/mail-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("mail_settings_failed");
    return response.json();
  },
  async sendTestMail(recipient) {
    const response = await fetch("/api/mail-settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient })
    });
    if (!response.ok) throw new Error("mail_test_failed");
    return response.json();
  },
  async createDemoInboundEmail() {
    const response = await fetch("/api/email-inbox/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!response.ok) throw new Error("email_inbox_demo_failed");
    return response.json();
  },
  async convertInboundEmail(id) {
    const response = await fetch("/api/email-inbox/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error("email_inbox_convert_failed");
    return response.json();
  },
  async sendOutbox() {
    const response = await fetch("/api/outbox/send", { method: "POST" });
    if (!response.ok) throw new Error("outbox_send_failed");
    return response.json();
  },
  async changePassword(payload) {
    const response = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "password_change_failed");
    }
    return response.json();
  }
};

const els = {
  authScreen: document.querySelector("#authScreen"),
  loginForm: document.querySelector("#loginForm"),
  mfaCodeField: document.querySelector("#mfaCodeField"),
  loginHint: document.querySelector("#loginHint"),
  viewTitle: document.querySelector("#viewTitle"),
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  tenantStats: document.querySelector("#tenantStats"),
  brandTenant: document.querySelector("#brandTenant"),
  sidebarToggle: document.querySelector("#sidebarToggle"),
  saveState: document.querySelector("#saveState"),
  notificationBtn: document.querySelector("#notificationBtn"),
  notificationCount: document.querySelector("#notificationCount"),
  notificationPopover: document.querySelector("#notificationPopover"),
  notificationList: document.querySelector("#notificationList"),
  notificationSummary: document.querySelector("#notificationSummary"),
  notificationFilters: document.querySelector("#notificationFilters"),
  notificationFilterButtons: document.querySelectorAll("[data-notification-filter]"),
  closeNotificationsBtn: document.querySelector("#closeNotificationsBtn"),
  clearNotificationsBtn: document.querySelector("#clearNotificationsBtn"),
  notifyTaskReminderBtn: document.querySelector("#notifyTaskReminderBtn"),
  notifyDeadlineReminderBtn: document.querySelector("#notifyDeadlineReminderBtn"),
  projectList: document.querySelector("#projectList"),
  projectForm: document.querySelector("#projectForm"),
  projectTitle: document.querySelector("#projectTitle"),
  projectMetrics: document.querySelector("#projectMetrics"),
  projectInsight: document.querySelector("#projectInsight"),
  projectStatusStack: document.querySelector("#projectStatusStack"),
  projectOpenTasks: document.querySelector("#projectOpenTasks"),
  projectUpcomingDeadlines: document.querySelector("#projectUpcomingDeadlines"),
  projectActivityList: document.querySelector("#projectActivityList"),
  activeProjectName: document.querySelector("#activeProjectName"),
  documentRows: document.querySelector("#documentRows"),
  documentFilterSearch: document.querySelector("#documentFilterSearch"),
  documentTypeFilter: document.querySelector("#documentTypeFilter"),
  documentRiskFilter: document.querySelector("#documentRiskFilter"),
  documentStatusFilter: document.querySelector("#documentStatusFilter"),
  clearDocumentFiltersBtn: document.querySelector("#clearDocumentFiltersBtn"),
  inboxList: document.querySelector("#inboxList"),
  uploadReviewList: document.querySelector("#uploadReviewList"),
  inboxCenterMetrics: document.querySelector("#inboxCenterMetrics"),
  inboxSearch: document.querySelector("#inboxSearch"),
  inboxTypeFilter: document.querySelector("#inboxTypeFilter"),
  clearInboxFiltersBtn: document.querySelector("#clearInboxFiltersBtn"),
  approveSelectedInboxBtn: document.querySelector("#approveSelectedInboxBtn"),
  batchProjectSelect: document.querySelector("#batchProjectSelect"),
  batchAssigneeSelect: document.querySelector("#batchAssigneeSelect"),
  batchActionSelect: document.querySelector("#batchActionSelect"),
  batchDueInput: document.querySelector("#batchDueInput"),
  applyInboxBatchBtn: document.querySelector("#applyInboxBatchBtn"),
  invoiceMetricPanel: document.querySelector("#invoiceMetricPanel"),
  invoiceSearch: document.querySelector("#invoiceSearch"),
  invoiceStatusFilter: document.querySelector("#invoiceStatusFilter"),
  invoiceProjectFilter: document.querySelector("#invoiceProjectFilter"),
  exportInvoicesBtn: document.querySelector("#exportInvoicesBtn"),
  exportDatevInvoicesBtn: document.querySelector("#exportDatevInvoicesBtn"),
  exportPaymentRunBtn: document.querySelector("#exportPaymentRunBtn"),
  invoiceRuleList: document.querySelector("#invoiceRuleList"),
  invoiceRuleForm: document.querySelector("#invoiceRuleForm"),
  resetInvoiceRuleFormBtn: document.querySelector("#resetInvoiceRuleFormBtn"),
  invoiceList: document.querySelector("#invoiceList"),
  taskList: document.querySelector("#taskList"),
  taskOverview: document.querySelector("#taskOverview"),
  assignedTaskList: document.querySelector("#assignedTaskList"),
  taskFilterButtons: document.querySelectorAll("[data-filter]"),
  taskReminderBtn: document.querySelector("#taskReminderBtn"),
  deadlineBoard: document.querySelector("#deadlineBoard"),
  deadlineForm: document.querySelector("#deadlineForm"),
  analysisBox: document.querySelector("#analysisBox"),
  fieldGrid: document.querySelector("#fieldGrid"),
  dropzone: document.querySelector("#dropzone"),
  fileInput: document.querySelector("#fileInput"),
  uploadProjectSelect: document.querySelector("#uploadProjectSelect"),
  uploadStatusList: document.querySelector("#uploadStatusList"),
  analyzeBtn: document.querySelector("#analyzeBtn"),
  acceptSuggestion: document.querySelector("#acceptSuggestion"),
  rejectSuggestion: document.querySelector("#rejectSuggestion"),
  newDocBtn: document.querySelector("#newDocBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  passwordBtn: document.querySelector("#passwordBtn"),
  passwordDialog: document.querySelector("#passwordDialog"),
  closePasswordDialogBtn: document.querySelector("#closePasswordDialogBtn"),
  passwordForm: document.querySelector("#passwordForm"),
  passwordHint: document.querySelector("#passwordHint"),
  logoutAllBtn: document.querySelector("#logoutAllBtn"),
  sessionSecurityInfo: document.querySelector("#sessionSecurityInfo"),
  globalSearch: document.querySelector("#globalSearch"),
  askBtn: document.querySelector("#askBtn"),
  askInput: document.querySelector("#askInput"),
  chatHistory: document.querySelector("#chatHistory"),
  exportBtn: document.querySelector("#exportBtn"),
  resetDemoBtn: document.querySelector("#resetDemoBtn"),
  weekFilter: document.querySelector("#weekFilter"),
  deadlineReminderBtn: document.querySelector("#deadlineReminderBtn"),
  kpiDocs: document.querySelector("#kpiDocs"),
  documentDialog: document.querySelector("#documentDialog"),
  closeDialogBtn: document.querySelector("#closeDialogBtn"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogFields: document.querySelector("#dialogFields"),
  dialogOcrText: document.querySelector("#dialogOcrText"),
  dialogCitationNav: document.querySelector("#dialogCitationNav"),
  dialogSource: document.querySelector("#dialogSource"),
  dialogPreview: document.querySelector("#dialogPreview"),
  documentStatusForm: document.querySelector("#documentStatusForm"),
  documentWorkflowPreview: document.querySelector("#documentWorkflowPreview"),
  documentApprovalPanel: document.querySelector("#documentApprovalPanel"),
  documentNoteForm: document.querySelector("#documentNoteForm"),
  documentTaskForm: document.querySelector("#documentTaskForm"),
  documentTaskSuggestion: document.querySelector("#documentTaskSuggestion"),
  createSuggestedTaskBtn: document.querySelector("#createSuggestedTaskBtn"),
  documentTaskAssignee: document.querySelector("#documentTaskAssignee"),
  documentTasks: document.querySelector("#documentTasks"),
  documentHistory: document.querySelector("#documentHistory"),
  reprocessBtn: document.querySelector("#reprocessBtn"),
  archiveBtn: document.querySelector("#archiveBtn"),
  userList: document.querySelector("#userList"),
  onboardingPanel: document.querySelector("#onboardingPanel"),
  onboardingList: document.querySelector("#onboardingList"),
  onboardingProgressPill: document.querySelector("#onboardingProgressPill"),
  onboardingProgressBar: document.querySelector("#onboardingProgressBar"),
  securityPolicyPanel: document.querySelector("#securityPolicyPanel"),
  enforceAdminMfaBtn: document.querySelector("#enforceAdminMfaBtn"),
  roleMatrix: document.querySelector("#roleMatrix"),
  userForm: document.querySelector("#userForm"),
  tenantForm: document.querySelector("#tenantForm"),
  tenantStatus: document.querySelector("#tenantStatus"),
  auditList: document.querySelector("#auditList"),
  ocrQueue: document.querySelector("#ocrQueue"),
  demoEmailImportBtn: document.querySelector("#demoEmailImportBtn"),
  emailInboxList: document.querySelector("#emailInboxList"),
  storagePanel: document.querySelector("#storagePanel"),
  systemScorePanel: document.querySelector("#systemScorePanel"),
  systemCheckPanel: document.querySelector("#systemCheckPanel"),
  runSystemCheckBtn: document.querySelector("#runSystemCheckBtn"),
  repairChecksumsBtn: document.querySelector("#repairChecksumsBtn"),
  compliancePanel: document.querySelector("#compliancePanel"),
  complianceForm: document.querySelector("#complianceForm"),
  cleanupComplianceBtn: document.querySelector("#cleanupComplianceBtn"),
  verifyBackupBtn: document.querySelector("#verifyBackupBtn"),
  backupBtn: document.querySelector("#backupBtn"),
  sendOutboxBtn: document.querySelector("#sendOutboxBtn"),
  outboxList: document.querySelector("#outboxList"),
  deliveryLogList: document.querySelector("#deliveryLogList"),
  deliveryLogSearch: document.querySelector("#deliveryLogSearch"),
  deliveryLogStatus: document.querySelector("#deliveryLogStatus"),
  exportDeliveryLogBtn: document.querySelector("#exportDeliveryLogBtn"),
  mailStatusPanel: document.querySelector("#mailStatusPanel"),
  mailSettingsForm: document.querySelector("#mailSettingsForm"),
  mailTestForm: document.querySelector("#mailTestForm"),
  templateList: document.querySelector("#templateList"),
  escalationMetrics: document.querySelector("#escalationMetrics"),
  escalationList: document.querySelector("#escalationList"),
  runEscalationsBtn: document.querySelector("#runEscalationsBtn"),
  searchResults: document.querySelector("#searchResults"),
  toast: document.querySelector("#toast")
};

const demoAnalyses = [
  "RE-2026-184_Material-Elektro.pdf",
  "Foto_Mangel_Treppenhaus_03.jpg",
  "Lieferschein_Heizkörper_4451.pdf"
];

let state = { projects: [], documents: [], deadlines: [], chat: [], audit: [] };
let activeProjectId = "lindenweg";
let analysisIndex = 0;
let currentAnalysis = null;
let activeDocumentId = null;
let activeSearchQuery = "";
let pendingMfaChallenge = null;
let taskFilter = "mine";
let notificationFilter = "all";
let deliveryLogQuery = "";
let deliveryLogStatus = "all";
let documentFilterQuery = "";
let documentTypeFilter = "all";
let documentRiskFilter = "all";
let documentStatusFilter = "all";
let uploadBatch = [];
let inboxQuery = "";
let inboxTypeFilter = "all";
let selectedInboxDocuments = new Set();
let invoiceQuery = "";
let invoiceStatusFilter = "all";
let invoiceProjectFilter = "all";
let editingInvoiceId = null;
const dismissedNotifications = new Set(JSON.parse(localStorage.getItem("bauakte_dismissed_notifications") || "[]"));

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function highlightText(text = "", query = "") {
  const safeText = escapeHtml(text);
  const terms = query.split(/\W+/).filter((term) => term.length > 2);
  if (!terms.length) return safeText;
  const pattern = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return safeText.replace(pattern, "<mark>$1</mark>");
}

function fillTemplate(text = "", values = {}) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), String(text));
}

function templatePreviewValues(kind = "") {
  const samples = {
    deadline_reminder: {
      items: "- Heute: Mangel Treppenhaus klären (Mehrfamilienhaus Lindenweg)\n- 29.05.2026: Abnahmeprotokoll prüfen (Mehrfamilienhaus Lindenweg)",
      actor: state.user?.email || "anna@schneider-sohn.example",
      recipient: state.user?.email || "anna@schneider-sohn.example",
      rule_name: "Fristen 3 Tage vorher",
      title: "Frist eskalieren: Mangel Treppenhaus klären",
      detail: "Heute · Mehrfamilienhaus Lindenweg",
      target_role: "Bauleitung"
    },
    task_reminder: {
      items: "- kritisch: Prüfen bis Morgen · Abnahmeprotokoll_Bauteil-B.pdf (Mehrfamilienhaus Lindenweg)\n- hoch: Freigeben bis 03.06.2026 · Rechnung Elektro.pdf (Sanierung Kita Nord)",
      actor: state.user?.email || "anna@schneider-sohn.example",
      recipient: "bauleitung-test@example.com",
      rule_name: "Kritische Aufgaben nach 24 Stunden",
      title: "Kritische Aufgabe eskalieren: Prüfen",
      detail: "Abnahmeprotokoll_Bauteil-B.pdf · Mehrfamilienhaus Lindenweg",
      target_role: "Geschäftsführung"
    },
    escalation: {
      items: "- Heute: Mangel Treppenhaus klären",
      actor: state.user?.email || "anna@schneider-sohn.example",
      recipient: "bauleitung-test@example.com",
      rule_name: "Fristen 3 Tage vorher",
      title: "Frist eskalieren: Mangel Treppenhaus klären",
      detail: "Heute · Mehrfamilienhaus Lindenweg",
      target_role: "Bauleitung"
    }
  };
  return samples[kind] || samples.deadline_reminder;
}

function updateTemplatePreview(form) {
  const values = templatePreviewValues(form.dataset.kind);
  const subject = fillTemplate(form.elements.subject.value, values);
  const body = fillTemplate(form.elements.body.value, values);
  const preview = form.querySelector(".template-preview");
  if (!preview) return;
  preview.innerHTML = `
    <span>Vorschau</span>
    <strong>${escapeHtml(subject)}</strong>
    <pre>${escapeHtml(body)}</pre>
  `;
}

function showLogin(show) {
  els.authScreen.hidden = !show;
  document.querySelector(".app-shell").classList.toggle("locked", show);
}

function setSaveState(text, pending = false) {
  els.saveState.textContent = text;
  els.saveState.classList.toggle("pending", pending);
}

function setSidebarCollapsed(collapsed) {
  document.querySelector(".app-shell").classList.toggle("sidebar-collapsed", collapsed);
  if (els.sidebarToggle) {
    const label = els.sidebarToggle.querySelector(".nav-label");
    if (label) label.textContent = collapsed ? "Menü ausklappen" : "Menü einklappen";
    els.sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    els.sidebarToggle.title = collapsed ? "Menü ausklappen" : "Menü einklappen";
    els.sidebarToggle.setAttribute("aria-label", collapsed ? "Menü ausklappen" : "Menü einklappen");
  }
  localStorage.setItem("bauakte_sidebar_collapsed", collapsed ? "1" : "0");
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 2600);
}

function activeProject() {
  return state.projects.find((project) => project.id === activeProjectId) || state.projects[0];
}

function documentsFor(projectId) {
  return state.documents.filter((doc) => doc.project_id === projectId);
}

function filteredProjectDocuments(projectId) {
  const query = documentFilterQuery.trim().toLowerCase();
  return documentsFor(projectId).filter((doc) => {
    const haystack = [
      doc.name,
      doc.type,
      doc.status,
      doc.due,
      doc.source,
      doc.ocr_text,
      doc.suggested_action
    ].join(" ").toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesType = documentTypeFilter === "all" || doc.type === documentTypeFilter;
    const matchesRisk = documentRiskFilter === "all"
      || doc.tone === documentRiskFilter
      || (documentRiskFilter === "ocr" && doc.ocr_status && doc.ocr_status !== "bereit");
    const matchesStatus = documentStatusFilter === "all" || doc.status === documentStatusFilter;
    return matchesQuery && matchesType && matchesRisk && matchesStatus;
  });
}

function deadlinesFor(project) {
  if (!project) return [];
  return state.deadlines.filter((deadline) => deadline.project_id === project.id || deadline.detail?.includes(project.name.split(" ")[0]));
}

function badge(statusClass, label) {
  return `<span class="badge ${statusClass}">${label}</span>`;
}

const workflow = [
  { id: "offen", label: "Eingang", action: "prüfen", tone: "warn" },
  { id: "prüfen", label: "In Prüfung", action: "fachlich prüfen", tone: "warn" },
  { id: "klären", label: "Klärung", action: "Rückfrage starten", tone: "risk" },
  { id: "geprüft", label: "Geprüft", action: "freigeben", tone: "ok" },
  { id: "freigegeben", label: "Freigegeben", action: "Zahlung vorbereiten", tone: "ok" },
  { id: "zur_zahlung", label: "Zur Zahlung", action: "bezahlen", tone: "ok" },
  { id: "bezahlt", label: "Bezahlt", action: "abschließen", tone: "ok" },
  { id: "erledigt", label: "Erledigt", action: "archivieren", tone: "ok" }
];

function workflowInfo(status = "") {
  const normalized = status.toLowerCase();
  return workflow.find((step) => step.id === normalized) || {
    id: normalized || "offen",
    label: status || "Offen",
    action: normalized === "wartet" ? "OCR abwarten" : "Status prüfen",
    tone: normalized === "geprüft" ? "ok" : "warn"
  };
}

function nextDocumentAction(doc) {
  const openTask = openDocumentTasks(doc.id)[0];
  if (openTask) return `${openTask.action}: ${openTask.assignee_name}`;
  if (doc.suggested_action) return doc.suggested_action;
  if (doc.tone === "risk") return "Klärung mit Verantwortlichem";
  if (doc.ocr_status && doc.ocr_status !== "bereit") return "OCR-Ergebnis abwarten";
  if (doc.due && doc.due !== "keine") return `Frist ${doc.due} überwachen`;
  return workflowInfo(doc.status).action;
}

function openDocumentTasks(documentId) {
  return (state.document_tasks || [])
    .filter((task) => task.document_id === documentId && task.status !== "erledigt")
    .sort(compareTasks);
}

function tasksForProject(projectId) {
  const documentIds = new Set(documentsFor(projectId).map((doc) => doc.id));
  return (state.document_tasks || []).filter((task) => documentIds.has(task.document_id) && task.status !== "erledigt").sort(compareTasks);
}

function documentById(documentId) {
  return state.documents.find((doc) => doc.id === documentId) || (state.archived_documents || []).find((doc) => doc.id === documentId);
}

function projectById(projectId) {
  return state.projects.find((project) => project.id === projectId);
}

function parseAnalysis(doc) {
  if (doc.analysis) return doc.analysis;
  try {
    return doc.analysis_json ? JSON.parse(doc.analysis_json) : {};
  } catch {
    return {};
  }
}

function riskText(doc) {
  const analysis = parseAnalysis(doc);
  if (doc.tone === "risk") return `${doc.type}: kritisch, ${doc.due || "Frist offen"}`;
  if (doc.tone === "warn") return `${doc.type}: prüfen, ${analysis.confidence || doc.confidence || 0}% Sicherheit`;
  return `${doc.type}: bereit`;
}

function renderWorkflowPreview(status) {
  if (!els.documentWorkflowPreview) return;
  els.documentWorkflowPreview.innerHTML = workflow.map((step) => `
    <span class="${step.id === status ? "active" : ""}">${step.label}</span>
  `).join("");
}

function approvalStatus(doc) {
  const fourEyesOk = Boolean(doc.reviewed_by && doc.approved_by && doc.reviewed_by !== doc.approved_by);
  return {
    reviewed: Boolean(doc.reviewed_by),
    approved: Boolean(doc.approved_by),
    payment: Boolean(doc.payment_released_by),
    fourEyesOk
  };
}

function documentHistory(documentId) {
  const notes = (state.document_notes || [])
    .filter((note) => note.document_id === documentId)
    .map((note) => ({
      type: note.kind,
      title: note.kind,
      text: note.body,
      actor: note.actor,
      created_at: note.created_at
    }));
  const versions = (state.document_versions || [])
    .filter((version) => version.document_id === documentId)
    .map((version) => ({
      type: "Version",
      title: version.event,
      text: `Version ${version.version_no}`,
      actor: version.actor,
      created_at: version.created_at
    }));
  return [...notes, ...versions].sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
}

function renderDocumentTasks(documentId) {
  if (!els.documentTasks) return;
  const tasks = (state.document_tasks || [])
    .filter((task) => task.document_id === documentId)
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  els.documentTasks.innerHTML = `
    <h3>Aufgaben</h3>
    <div class="task-card-list">
      ${tasks.length ? tasks.map((task) => `
        <article class="document-task ${task.status === "erledigt" ? "done" : "open"} ${taskUrgency(task)}">
          <div>
            <strong>${task.action} · ${task.assignee_name}</strong>
            <span>${taskPriorityLabel(task)} · ${task.due || "ohne Frist"} · ${task.note || "ohne Hinweis"}</span>
            <small>${task.status} · erstellt von ${task.created_by}${task.completed_by ? ` · erledigt von ${task.completed_by}` : ""}</small>
          </div>
          ${task.status === "erledigt" ? badge("ok", "erledigt") : `<div class="assigned-task-actions">${badge(taskTone(task), taskPriorityLabel(task))}<button class="secondary-button complete-task-btn" type="button" data-task="${task.id}">Erledigen</button></div>`}
        </article>
      `).join("") : `
        <article class="document-task">
          <div>
            <strong>Keine Aufgaben</strong>
            <span>Weisen Sie Prüfung, Freigabe oder Klärung direkt einer Person zu.</span>
          </div>
        </article>
      `}
    </div>
  `;
  els.documentTasks.querySelectorAll(".complete-task-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await refresh(await api.updateDocumentTaskStatus({ task_id: button.dataset.task, status: "erledigt" }));
        toast("Aufgabe erledigt.");
        openDocument(documentId);
      } catch {
        toast("Aufgabe konnte nicht erledigt werden.");
      }
    });
  });
}

function formatSize(bytes = 0) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  if (bytes > 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function formatDateTime(timestamp) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function csvCell(value = "") {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}

function filteredDeliveryLog() {
  const query = deliveryLogQuery.trim().toLowerCase();
  return (state.email_delivery_log || []).filter((entry) => {
    const matchesStatus = deliveryLogStatus === "all" || entry.status === deliveryLogStatus;
    const haystack = `${entry.recipient || ""} ${entry.subject || ""} ${entry.status || ""} ${entry.message || ""}`.toLowerCase();
    return matchesStatus && (!query || haystack.includes(query));
  });
}

function exportDeliveryLogCsv() {
  const rows = filteredDeliveryLog();
  const header = ["Zeitpunkt", "Status", "Empfänger", "Betreff", "Meldung"];
  const csv = [
    header.map(csvCell).join(";"),
    ...rows.map((entry) => [
      formatDateTime(entry.created_at),
      entry.status,
      entry.recipient,
      entry.subject,
      entry.message || ""
    ].map(csvCell).join(";"))
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bauakte-versandprotokoll-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function projectName(projectId) {
  return state.projects.find((project) => project.id === projectId)?.name || "Bauakte vorschlagen";
}

function suggestedDocumentAction(doc) {
  if (doc.suggested_action) return doc.suggested_action;
  if (doc.tone === "risk") return "Aufgabe kritisch an Bauleitung geben";
  if (doc.type === "Rechnung") return "Rechnung prüfen und zur Zahlung freigeben";
  if (doc.type === "Lieferschein") return "Lieferung mit Bestellung abgleichen";
  if (doc.type === "Nachtrag") return "Nachtrag entscheiden und Frist setzen";
  if (doc.status === "prüfen") return "Fachlich prüfen";
  return "Ablegen und später wiederfinden";
}

function invoiceSourceText(doc) {
  return [doc.name, doc.type, doc.source, doc.ocr_text, doc.suggested_action].filter(Boolean).join(" ");
}

function isInvoiceDocument(doc) {
  const text = invoiceSourceText(doc).toLowerCase();
  return doc.type === "Rechnung" || /\b(rechnung|zahlungsziel|iban|betrag|netto|brutto)\b/.test(text);
}

function parseInvoiceAmount(doc) {
  const text = invoiceSourceText(doc);
  return parseMoneyFromText(text, /(?:betrag|summe|gesamt|brutto|rechnungsbetrag)[^\d]{0,24}(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})|\d+(?:,\d{2}))/i);
}

function parseMoneyValue(raw = "") {
  if (!raw) return 0;
  const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

function parseMoneyFromText(text = "", preferredPattern = null) {
  const preferredMatch = preferredPattern ? text.match(preferredPattern) : null;
  const euroMatch = text.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})|\d+(?:,\d{2}))\s*(?:eur|euro|€)/i);
  return parseMoneyValue(preferredMatch?.[1] || euroMatch?.[1] || "");
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function moneyInputValue(value) {
  return value ? Number(value).toFixed(2).replace(".", ",") : "";
}

function parseGermanDate(value = "") {
  const text = String(value || "").trim();
  if (!text || text === "keine") return null;
  const match = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (!match) return null;
  const year = match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);
  const date = new Date(year, Number(match[2]) - 1, Number(match[1]), 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function invoiceDueState(doc) {
  const dueDate = parseGermanDate(doc.due);
  if (!dueDate || ["bezahlt", "erledigt"].includes(doc.status)) return "neutral";
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Math.round((dueDate - today) / 86400000);
  if (days < 0) return "risk";
  if (days <= 3) return "warn";
  return "ok";
}

function invoiceDueLabel(doc) {
  const stateLabel = { risk: "überfällig", warn: "bald fällig", ok: "im Plan", neutral: "ohne Warnung" }[invoiceDueState(doc)];
  return `${doc.due || "keine"} · ${stateLabel}`;
}

function invoiceApprovalLabel(doc) {
  const approval = approvalStatus(doc);
  if (doc.status === "bezahlt") return "bezahlt";
  if (doc.payment_released_by) return "Zahlung freigegeben";
  if (approval.fourEyesOk) return "Vier-Augen erfüllt";
  if (doc.approved_by) return "Freigabe ohne zweite Prüfung";
  if (doc.reviewed_by) return "geprüft";
  return "offen";
}

function extractInvoiceNumber(doc) {
  const text = invoiceSourceText(doc);
  const explicit = text.match(/(?:rechnungs(?:nummer|nr\.?|\s*nr\.?|\s*nummer)|rechnung\s*nr\.?|beleg(?:nummer|nr\.?))[\s:#-]*([A-ZÄÖÜ0-9][A-ZÄÖÜ0-9_\-/\.]{2,})/i);
  if (explicit?.[1]) return explicit[1].replace(/[.,;:]$/, "");
  const filename = doc.name?.match(/(?:RE|RG|R)-?\d{2,4}[-_\dA-Z]+/i);
  return filename?.[0] || doc.id?.slice(0, 8) || "";
}

function extractIban(doc) {
  const match = invoiceSourceText(doc).match(/\b[A-Z]{2}\d{2}(?:[\s-]?[A-Z0-9]){11,30}\b/i);
  return match ? match[0].replace(/[\s-]/g, "").toUpperCase() : "";
}

function extractTaxRate(doc) {
  const text = invoiceSourceText(doc);
  const match = text.match(/(?:mwst|ust|umsatzsteuer|steuer)[^\d]{0,16}(7|19)\s*%/i) || text.match(/(7|19)\s*%[^\n]{0,20}(?:mwst|ust|umsatzsteuer|steuer)/i);
  return match ? Number(match[1]) : 19;
}

function extractInvoiceDate(doc, labelPattern) {
  const text = invoiceSourceText(doc);
  const match = text.match(labelPattern);
  return match?.[1] || "";
}

function extractCreditor(doc) {
  const source = String(doc.source || "").trim();
  if (source && !source.startsWith("KI-Analyse")) return source.slice(0, 80);
  const cleanedName = String(doc.name || "Unbekannter Kreditor")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^(rechnung|re|rg)[-_\s]*/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  return cleanedName || "Unbekannter Kreditor";
}

function activeInvoiceRules() {
  return (state.invoice_booking_rules || []).filter((rule) => Number(rule.is_active) !== 0 && rule.keyword && rule.booking_account);
}

function matchedInvoiceRule(doc) {
  const haystack = invoiceSourceText(doc).toLowerCase();
  return activeInvoiceRules()
    .sort((a, b) => String(b.keyword).length - String(a.keyword).length)
    .find((rule) => haystack.includes(String(rule.keyword).toLowerCase())) || null;
}

function invoiceAccountingFields(doc) {
  const text = invoiceSourceText(doc);
  const manual = doc.invoice_fields || {};
  const rule = matchedInvoiceRule(doc);
  const gross = parseInvoiceAmount(doc);
  const explicitNet = parseMoneyFromText(text, /(?:netto|nettosumme|warenwert)[^\d]{0,24}(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})|\d+(?:,\d{2}))/i);
  const explicitTax = parseMoneyFromText(text, /(?:mwst|ust|umsatzsteuer|steuerbetrag|steuer)[^\d]{0,24}(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})|\d+(?:,\d{2}))/i);
  const taxRate = Number(manual.tax_rate) || Number(rule?.tax_rate) || extractTaxRate(doc);
  const finalGross = Number(manual.gross_amount) || gross;
  const net = Number(manual.net_amount) || explicitNet || (finalGross ? finalGross / (1 + taxRate / 100) : 0);
  const tax = Number(manual.tax_amount) || explicitTax || (finalGross && net ? finalGross - net : 0);
  const project = projectById(doc.project_id);
  const invoiceDate = extractInvoiceDate(doc, /(?:rechnungsdatum|belegdatum|datum)[^\d]{0,18}(\d{1,2}\.\d{1,2}\.\d{2,4})/i);
  const serviceDate = extractInvoiceDate(doc, /(?:leistungsdatum|lieferdatum|leistungszeitraum)[^\d]{0,18}(\d{1,2}\.\d{1,2}\.\d{2,4})/i);
  return {
    invoiceNumber: manual.invoice_number || extractInvoiceNumber(doc),
    creditor: manual.creditor || extractCreditor(doc),
    iban: manual.iban || extractIban(doc),
    taxRate,
    net,
    tax,
    gross: finalGross,
    invoiceDate: manual.invoice_date || invoiceDate,
    serviceDate: manual.service_date || serviceDate,
    bookingAccount: manual.booking_account || rule?.booking_account || "",
    costCenter: manual.cost_center || rule?.cost_center || project?.id || doc.project_id || "",
    paymentReference: manual.payment_reference || "",
    verifiedBy: manual.verified_by || "",
    verifiedAt: manual.verified_at || null,
    ruleLabel: rule ? `${rule.keyword} → ${rule.booking_account}` : "",
    projectName: project?.name || projectName(doc.project_id),
    exportReady: Boolean(finalGross && doc.due && doc.due !== "keine" && doc.project_id && (manual.invoice_number || extractInvoiceNumber(doc)))
  };
}

function invoiceRows() {
  return (state.documents || [])
    .filter(isInvoiceDocument)
    .map((doc) => ({
      doc,
      amount: parseInvoiceAmount(doc),
      accounting: invoiceAccountingFields(doc),
      dueState: invoiceDueState(doc),
      searchText: `${invoiceSourceText(doc)} ${projectName(doc.project_id)} ${workflowInfo(doc.status).label} ${invoiceApprovalLabel(doc)} ${extractInvoiceNumber(doc)} ${extractIban(doc)}`.toLowerCase()
    }))
    .sort((a, b) => {
      const dueA = parseGermanDate(a.doc.due)?.getTime() || Number.MAX_SAFE_INTEGER;
      const dueB = parseGermanDate(b.doc.due)?.getTime() || Number.MAX_SAFE_INTEGER;
      return dueA - dueB || b.doc.created_at - a.doc.created_at;
    });
}

function filteredInvoiceRows() {
  const query = invoiceQuery.trim().toLowerCase();
  return invoiceRows().filter((row) => {
    const matchesQuery = !query || row.searchText.includes(query);
    const matchesProject = invoiceProjectFilter === "all" || row.doc.project_id === invoiceProjectFilter;
    const matchesStatus = invoiceStatusFilter === "all"
      || (invoiceStatusFilter === "open" && !["bezahlt", "erledigt"].includes(row.doc.status))
      || (invoiceStatusFilter === "overdue" && row.dueState === "risk")
      || row.doc.status === invoiceStatusFilter;
    return matchesQuery && matchesProject && matchesStatus;
  });
}

function exportInvoicesCsv() {
  const rows = filteredInvoiceRows();
  downloadCsv(`bauakte-rechnungen-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["Rechnung", "Rechnungsnummer", "Kreditor", "Bauakte", "Betrag EUR", "Fälligkeit", "Status", "Freigabe", "Zahlungsfreigabe", "Quelle"],
    ...rows.map(({ doc, amount, accounting }) => [
      doc.name,
      accounting.invoiceNumber,
      accounting.creditor,
      projectName(doc.project_id),
      amount ? amount.toFixed(2).replace(".", ",") : "",
      doc.due || "",
      workflowInfo(doc.status).label,
      doc.approved_by ? `${doc.approved_by} · ${doc.approved_at ? formatDateTime(doc.approved_at) : ""}` : "",
      doc.payment_released_by ? `${doc.payment_released_by} · ${doc.payment_released_at ? formatDateTime(doc.payment_released_at) : ""}` : "",
      doc.source || ""
    ])
  ]);
}

function exportDatevInvoicesCsv() {
  const rows = filteredInvoiceRows();
  downloadCsv(`bauakte-buchhaltung-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["Belegdatum", "Rechnungsnummer", "Kreditor", "Buchungskonto", "Buchungstext", "Kostenstelle", "Bauakte", "Netto EUR", "Steuer EUR", "Brutto EUR", "Steuersatz", "Leistungsdatum", "Fälligkeit", "IBAN", "Status", "Geprüft von", "Dokument-ID"],
    ...rows.map(({ doc, accounting }) => [
      accounting.invoiceDate,
      accounting.invoiceNumber,
      accounting.creditor,
      accounting.bookingAccount,
      doc.name,
      accounting.costCenter,
      accounting.projectName,
      accounting.net ? accounting.net.toFixed(2).replace(".", ",") : "",
      accounting.tax ? accounting.tax.toFixed(2).replace(".", ",") : "",
      accounting.gross ? accounting.gross.toFixed(2).replace(".", ",") : "",
      `${accounting.taxRate}%`,
      accounting.serviceDate,
      doc.due || "",
      accounting.iban,
      workflowInfo(doc.status).label,
      accounting.verifiedBy,
      doc.id
    ])
  ]);
}

function exportPaymentRunCsv() {
  const rows = filteredInvoiceRows().filter(({ doc }) => ["zur_zahlung", "freigegeben"].includes(doc.status));
  downloadCsv(`bauakte-zahlungslauf-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["Empfänger", "IBAN", "Betrag EUR", "Verwendungszweck", "Fälligkeit", "Bauakte", "Freigegeben von", "Zahlungsfreigabe von", "Dokument-ID"],
    ...rows.map(({ doc, accounting }) => [
      accounting.creditor,
      accounting.iban,
      accounting.gross ? accounting.gross.toFixed(2).replace(".", ",") : "",
      `${accounting.invoiceNumber} ${doc.name}`.trim(),
      doc.due || "",
      accounting.projectName,
      doc.approved_by || "",
      doc.payment_released_by || "",
      doc.id
    ])
  ]);
}

function invoiceLearningKeyword(doc, accounting = {}) {
  const creditor = String(accounting.creditor || "").replace(/\b(gmbh|ug|ag|kg|ohg|e\.k\.)\b/gi, "").replace(/\s+/g, " ").trim();
  if (creditor && !creditor.toLowerCase().startsWith("quelle:") && creditor.length >= 4) return creditor;
  const source = invoiceSourceText(doc);
  const candidates = source.match(/\b[A-ZÄÖÜ][A-Za-zÄÖÜäöüß]{3,}\b/g) || [];
  return candidates.find((word) => !["Rechnung", "Dokumenttyp", "Projektbezug", "Fristen", "Betrag"].includes(word)) || doc.name.split(/[._-]/)[0] || "Neue Regel";
}

function invoiceLearningSuggestion(doc, accounting = {}) {
  const keyword = invoiceLearningKeyword(doc, accounting);
  return {
    keyword,
    bookingAccount: accounting.bookingAccount || "",
    taxRate: accounting.taxRate || 19,
    label: `${keyword} automatisch buchen`
  };
}

function invoiceEditForm(doc, accounting) {
  const learning = invoiceLearningSuggestion(doc, accounting);
  const canLearn = Boolean(learning.keyword && learning.bookingAccount);
  return `
    <form class="invoice-edit-form" data-invoice-form="${doc.id}">
      <label><span>Rechnungsnummer</span><input name="invoice_number" type="text" value="${escapeHtml(accounting.invoiceNumber)}"></label>
      <label><span>Kreditor</span><input name="creditor" type="text" value="${escapeHtml(accounting.creditor)}"></label>
      <label><span>IBAN</span><input name="iban" type="text" value="${escapeHtml(accounting.iban)}"></label>
      <label><span>Netto</span><input name="net_amount" type="text" inputmode="decimal" value="${escapeHtml(moneyInputValue(accounting.net))}"></label>
      <label><span>Steuer</span><input name="tax_amount" type="text" inputmode="decimal" value="${escapeHtml(moneyInputValue(accounting.tax))}"></label>
      <label><span>Brutto</span><input name="gross_amount" type="text" inputmode="decimal" value="${escapeHtml(moneyInputValue(accounting.gross))}"></label>
      <label><span>Steuersatz</span><input name="tax_rate" type="text" inputmode="decimal" value="${escapeHtml(String(accounting.taxRate || ""))}"></label>
      <label><span>Rechnungsdatum</span><input name="invoice_date" type="text" value="${escapeHtml(accounting.invoiceDate)}" placeholder="TT.MM.JJJJ"></label>
      <label><span>Leistungsdatum</span><input name="service_date" type="text" value="${escapeHtml(accounting.serviceDate)}" placeholder="TT.MM.JJJJ"></label>
      <label><span>Buchungskonto</span><input name="booking_account" type="text" value="${escapeHtml(accounting.bookingAccount)}" placeholder="z. B. 3400"></label>
      <label><span>Kostenstelle</span><input name="cost_center" type="text" value="${escapeHtml(accounting.costCenter)}"></label>
      <label class="wide"><span>Verwendungszweck</span><input name="payment_reference" type="text" value="${escapeHtml(accounting.paymentReference || `${accounting.invoiceNumber} ${doc.name}`.trim())}"></label>
      <div class="invoice-learning-box">
        <div>
          <strong>Regel lernen</strong>
          <span>${canLearn ? `Künftig „${escapeHtml(learning.keyword)}“ automatisch auf Konto ${escapeHtml(learning.bookingAccount)} mit ${escapeHtml(String(learning.taxRate))}% Steuer vorschlagen.` : "Erst Kreditor und Buchungskonto eintragen, dann kann die App daraus eine Regel lernen."}</span>
        </div>
        <button class="secondary-button learn-invoice-rule-btn" type="button" ${canLearn ? "" : "disabled"}>Als Regel merken</button>
      </div>
      <div class="invoice-edit-actions">
        <span>${accounting.verifiedBy ? `Geprüft von ${escapeHtml(accounting.verifiedBy)}${accounting.verifiedAt ? ` · ${formatDateTime(accounting.verifiedAt)}` : ""}` : (accounting.ruleLabel ? `Regelvorschlag: ${escapeHtml(accounting.ruleLabel)}` : "Noch nicht manuell geprüft")}</span>
        <button class="secondary-button cancel-invoice-edit-btn" type="button">Abbrechen</button>
        <button class="primary-button" type="submit">Rechnungsdaten speichern</button>
      </div>
    </form>
  `;
}

function renderInvoiceRules() {
  if (!els.invoiceRuleList) return;
  const rules = state.invoice_booking_rules || [];
  els.invoiceRuleList.innerHTML = rules.map((rule) => {
    const active = Number(rule.is_active) !== 0;
    return `
    <article class="${active ? "" : "inactive"}">
      <div>
        <strong>${escapeHtml(rule.keyword)}</strong>
        <span>${escapeHtml(rule.booking_account)} · ${escapeHtml(rule.label || "Regel")} · ${Number(rule.tax_rate || 19)}%${active ? "" : " · inaktiv"}</span>
      </div>
      <div class="invoice-rule-actions">
        <button class="secondary-button edit-invoice-rule-btn" type="button" data-rule="${rule.id}">Bearbeiten</button>
        <button class="secondary-button toggle-invoice-rule-btn" type="button" data-rule="${rule.id}">${active ? "Deaktivieren" : "Aktivieren"}</button>
        <button class="secondary-button danger delete-invoice-rule-btn" type="button" data-rule="${rule.id}">Löschen</button>
      </div>
    </article>
  `;
  }).join("") || `<article><div><strong>Noch keine Regeln</strong><span>Neue Regeln füllen Buchungskonto und Steuersatz automatisch vor.</span></div></article>`;
}

function resetInvoiceRuleForm() {
  if (!els.invoiceRuleForm) return;
  els.invoiceRuleForm.reset();
  els.invoiceRuleForm.elements.id.value = "";
  els.invoiceRuleForm.elements.tax_rate.value = "19";
  els.invoiceRuleForm.elements.is_active.checked = true;
  els.invoiceRuleForm.querySelector("button[type='submit']").textContent = "Regel speichern";
}

function preferredTaskRole(doc) {
  if (["Mangel", "Nachtrag", "Lieferschein", "Plan", "Abnahme"].includes(doc.type)) return "Bauleitung";
  if (doc.type === "Rechnung") return "Büro";
  return "Bauleitung";
}

function taskActionForDocument(doc) {
  if (doc.type === "Rechnung") return "Prüfen";
  if (doc.type === "Mangel" || doc.type === "Nachtrag") return "Klären";
  if (doc.type === "Abnahme" || doc.type === "Plan") return "Freigeben";
  return "Prüfen";
}

function suggestedTaskForDocument(doc) {
  const role = preferredTaskRole(doc);
  const assignee = (state.team || []).find((member) => member.role === role) || (state.team || [])[0];
  const priority = doc.tone === "risk" ? "kritisch" : doc.tone === "warn" ? "hoch" : "normal";
  const due = doc.due && doc.due !== "keine" ? doc.due : (doc.tone === "risk" ? "Heute" : "");
  return {
    assignee,
    role,
    action: taskActionForDocument(doc),
    priority,
    due,
    note: `${suggestedDocumentAction(doc)} · Quelle: ${doc.name}`
  };
}

function applyTaskSuggestionToForm(doc) {
  if (!els.documentTaskForm) return null;
  const suggestion = suggestedTaskForDocument(doc);
  if (suggestion.assignee && els.documentTaskForm.assignee_id) {
    els.documentTaskForm.assignee_id.value = suggestion.assignee.id;
  }
  els.documentTaskForm.action.value = suggestion.action;
  els.documentTaskForm.priority.value = suggestion.priority;
  els.documentTaskForm.due.value = suggestion.due;
  els.documentTaskForm.note.value = suggestion.note;
  return suggestion;
}

function setUploadBatch(files, status = "wartet") {
  uploadBatch = Array.from(files || []).map((file) => ({
    name: file.name,
    size: file.size,
    status,
    message: status === "läuft" ? "Upload und KI-Vorprüfung laufen" : "bereit für Upload"
  }));
  renderUploadStatus();
}

function renderUploadStatus() {
  if (!els.uploadStatusList) return;
  els.uploadStatusList.innerHTML = uploadBatch.map((item) => `
    <article class="upload-status-row ${item.status}">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${formatSize(item.size)} · ${escapeHtml(item.message)}</span>
      </div>
      ${badge(item.status === "fertig" ? "ok" : item.status === "fehler" ? "risk" : "warn", item.status)}
    </article>
  `).join("") || `<article class="upload-status-row"><div><strong>Noch kein Upload</strong><span>Dateien hier ablegen oder auswählen.</span></div></article>`;
}

async function uploadSelectedFiles(files) {
  if (!files?.length || !hasPermission("document.upload")) return;
  setUploadBatch(files, "läuft");
  setSaveState("Dokumente werden hochgeladen", true);
  try {
    const projectId = els.uploadProjectSelect?.value || activeProjectId || "auto";
    const nextState = await api.uploadDocuments(projectId, files);
    await refresh(nextState);
    uploadBatch = Array.from(files).map((file) => ({
      name: file.name,
      size: file.size,
      status: "fertig",
      message: "gespeichert, klassifiziert und in OCR-Warteschlange"
    }));
    renderUploadStatus();
    toast(`${files.length} Dokument(e) hochgeladen und zur Prüfung vorbereitet.`);
    switchView("inbox");
  } catch {
    uploadBatch = Array.from(files).map((file) => ({
      name: file.name,
      size: file.size,
      status: "fehler",
      message: "Upload fehlgeschlagen"
    }));
    renderUploadStatus();
    toast("Dokumente konnten nicht hochgeladen werden.");
  } finally {
    setSaveState("Gespeichert");
  }
}

function parseTaskDue(value = "") {
  const text = String(value).trim().toLowerCase();
  if (!text || text === "ohne frist") return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (text === "heute" || text === "sofort") return today;
  if (text === "morgen") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  const match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
  if (!match) return null;
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  return new Date(year, Number(match[2]) - 1, Number(match[1]));
}

function taskUrgency(task) {
  if (task.status === "erledigt") return "erledigt";
  const dueDate = parseTaskDue(task.due);
  if (!dueDate) return task.priority === "kritisch" ? "kritisch" : task.priority === "hoch" ? "hoch" : "normal";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDate - today) / 86400000);
  if (diffDays < 0) return "überfällig";
  if (diffDays === 0) return "heute";
  if (task.priority === "kritisch") return "kritisch";
  if (task.priority === "hoch") return "hoch";
  return "normal";
}

function taskPriorityLabel(task) {
  const urgency = taskUrgency(task);
  if (urgency === "überfällig") return "überfällig";
  if (urgency === "heute") return "heute";
  if (urgency === "kritisch") return "kritisch";
  if (urgency === "hoch") return "hoch";
  if (urgency === "erledigt") return "erledigt";
  return "normal";
}

function taskTone(task) {
  const urgency = taskUrgency(task);
  if (urgency === "überfällig" || urgency === "heute" || urgency === "kritisch") return "risk";
  if (urgency === "hoch") return "warn";
  if (urgency === "erledigt") return "ok";
  return "ok";
}

function compareTasks(a, b) {
  const order = { "überfällig": 0, heute: 1, kritisch: 2, hoch: 3, normal: 4, erledigt: 5 };
  const urgencyDiff = order[taskUrgency(a)] - order[taskUrgency(b)];
  if (urgencyDiff !== 0) return urgencyDiff;
  const aDue = parseTaskDue(a.due)?.getTime() || Number.MAX_SAFE_INTEGER;
  const bDue = parseTaskDue(b.due)?.getTime() || Number.MAX_SAFE_INTEGER;
  if (aDue !== bDue) return aDue - bDue;
  return (b.created_at || 0) - (a.created_at || 0);
}

function deadlineUrgency(deadline) {
  const dueDate = parseTaskDue(deadline.date_label);
  if (dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dueDate - today) / 86400000);
    if (diffDays < 0) return "überfällig";
    if (diffDays === 0) return "heute";
  }
  if (deadline.tone === "risk") return "kritisch";
  if (deadline.tone === "warn") return "hoch";
  return "normal";
}

function notificationKey(type, id, stamp = "") {
  return `${state.user?.tenant_id || "tenant"}:${type}:${id}:${stamp}`;
}

function saveDismissedNotifications() {
  localStorage.setItem("bauakte_dismissed_notifications", JSON.stringify([...dismissedNotifications].slice(-150)));
}

function buildNotificationPool() {
  (state.notification_reads || []).forEach((key) => dismissedNotifications.add(key));
  const taskNotices = (state.document_tasks || [])
    .filter((task) => task.status !== "erledigt" && ["überfällig", "heute", "kritisch"].includes(taskUrgency(task)))
    .sort(compareTasks)
    .slice(0, 8)
    .map((task) => {
      const doc = documentById(task.document_id);
      const urgency = taskUrgency(task);
      return {
        key: notificationKey("task", task.id, task.updated_at || task.created_at),
        category: "task",
        urgency,
        mine: task.assignee_id === state.user?.id || task.assignee_name === state.user?.name,
        tone: taskTone(task),
        title: `${taskPriorityLabel(task)}: ${task.action}`,
        text: `${task.assignee_name} · ${task.due || "ohne Frist"} · ${doc?.name || "Dokument"}`,
        action: "Aufgaben öffnen",
        viewId: "aufgaben"
      };
    });
  const deadlineNotices = (state.deadlines || [])
    .filter((deadline) => ["risk", "warn"].includes(deadline.tone) || ["überfällig", "heute"].includes(deadlineUrgency(deadline)))
    .slice(0, 8)
    .map((deadline) => {
      const urgency = deadlineUrgency(deadline);
      return {
        key: notificationKey("deadline", deadline.id, `${deadline.date_label}-${deadline.tone}`),
        category: "deadline",
        urgency,
        mine: true,
        tone: urgency === "überfällig" || urgency === "heute" || deadline.tone === "risk" ? "risk" : "warn",
        title: `${urgency === "normal" ? "Frist" : urgency}: ${deadline.title}`,
        text: `${deadline.date_label} · ${deadline.detail || "ohne Detail"}`,
        action: "Fristen öffnen",
        viewId: "fristen"
      };
    });
  const documentNotices = (state.documents || [])
    .filter((doc) => doc.tone !== "ok" || doc.ocr_status === "wartet")
    .slice(0, 6)
    .map((doc) => ({
      key: notificationKey("document", doc.id, `${doc.status}-${doc.tone}-${doc.ocr_status}`),
      category: "document",
      urgency: doc.tone === "risk" ? "kritisch" : "hoch",
      mine: true,
      tone: doc.tone === "risk" ? "risk" : "warn",
      title: doc.ocr_status === "wartet" ? "OCR wartet" : `${doc.type} prüfen`,
      text: `${doc.name} · ${doc.status}`,
      action: "Dokument öffnen",
      documentId: doc.id
    }));
  const systemNotices = [];
  if ((state.email_outbox || []).some((mail) => mail.status === "gespeichert" || mail.status === "fehler")) {
    systemNotices.push({
      key: notificationKey("system", "email_outbox", (state.email_outbox || []).map((mail) => `${mail.id}-${mail.status}-${mail.attempts}`).join("|")),
      category: "system",
      urgency: "hoch",
      mine: false,
      tone: "warn",
      title: "E-Mail-Ausgang prüfen",
      text: `${(state.email_outbox || []).filter((mail) => mail.status !== "gesendet").length} Nachricht(en) warten`,
      action: "Admin öffnen",
      viewId: "admin"
    });
  }
  const weakChecks = (state.system_check?.checks || []).filter((item) => item.status !== "ok");
  if (weakChecks.length) {
    systemNotices.push({
      key: notificationKey("system", "system_check", `${state.system_check.score}-${weakChecks.map((item) => item.key).join("-")}`),
      category: "system",
      urgency: "hoch",
      mine: false,
      tone: weakChecks.some((item) => item.status === "risk") ? "risk" : "warn",
      title: "Systemcheck offen",
      text: `${weakChecks.length} Punkt(e) für Verkaufsversion prüfen`,
      action: "Admin öffnen",
      viewId: "admin"
    });
  }
  const missingAdminMfa = state.security_policy?.admin_mfa_missing || [];
  if (state.security_policy?.admin_mfa_required && missingAdminMfa.length) {
    systemNotices.push({
      key: notificationKey("system", "admin_mfa", missingAdminMfa.map((user) => user.id).join("-")),
      category: "system",
      urgency: "hoch",
      mine: false,
      tone: "risk",
      title: "Admin-2FA fehlt",
      text: `${missingAdminMfa.length} Admin-Zugang/Zugänge ohne 2FA`,
      action: "Admin öffnen",
      viewId: "admin"
    });
  }
  return [...taskNotices, ...deadlineNotices, ...documentNotices, ...systemNotices]
    .filter((notice) => !dismissedNotifications.has(notice.key));
}

function filterNotifications(notices, filter = notificationFilter) {
  if (filter === "today") return notices.filter((notice) => notice.urgency === "heute");
  if (filter === "overdue") return notices.filter((notice) => notice.urgency === "überfällig");
  if (filter === "mine") return notices.filter((notice) => notice.category === "task" && notice.mine);
  if (filter === "deadlines") return notices.filter((notice) => notice.category === "deadline");
  if (filter === "system") return notices.filter((notice) => notice.category === "system");
  return notices;
}

function buildNotifications(filter = notificationFilter) {
  return filterNotifications(buildNotificationPool(), filter).slice(0, 12);
}

function renderNotifications() {
  if (!els.notificationList || !els.notificationCount) return;
  const allNotices = buildNotificationPool();
  const notices = filterNotifications(allNotices).slice(0, 12);
  const riskCount = allNotices.filter((notice) => notice.tone === "risk").length;
  const todayCount = allNotices.filter((notice) => notice.urgency === "heute").length;
  const overdueCount = allNotices.filter((notice) => notice.urgency === "überfällig").length;
  els.notificationCount.textContent = String(allNotices.length);
  els.notificationCount.hidden = allNotices.length === 0;
  els.notificationBtn?.classList.toggle("has-alerts", allNotices.length > 0);
  if (els.notificationSummary) {
    els.notificationSummary.innerHTML = allNotices.length ? `
      <strong>${allNotices.length} offene Hinweise</strong>
      <span>${riskCount} kritisch · ${todayCount} heute · ${overdueCount} überfällig</span>
    ` : `
      <strong>Alles ruhig</strong>
      <span>Keine kritischen Aufgaben, Fristen oder Systemmeldungen.</span>
    `;
  }
  els.notificationFilterButtons.forEach((button) => {
    const value = button.dataset.notificationFilter;
    button.classList.toggle("active", value === notificationFilter);
    button.dataset.count = String(filterNotifications(allNotices, value).length);
  });
  els.notificationList.innerHTML = notices.length ? notices.map((notice, index) => `
    <article class="notification-item ${notice.tone}">
      <button class="notification-open" type="button" data-index="${index}">
        <strong>${notice.title}</strong>
        <span>${notice.text}</span>
        <small>${notice.action}</small>
      </button>
      <button class="notification-dismiss" type="button" data-key="${notice.key}" aria-label="Hinweis als gelesen markieren" title="Als gelesen markieren">×</button>
    </article>
  `).join("") : `
    <article class="notification-empty">
      <strong>Keine akuten Hinweise</strong>
      <span>Kritische Aufgaben, neue Dokumente und Systemmeldungen erscheinen hier.</span>
    </article>
  `;
  els.notificationList.querySelectorAll(".notification-open").forEach((button) => {
    button.addEventListener("click", () => {
      const notice = notices[Number(button.dataset.index)];
      els.notificationPopover.hidden = true;
      if (notice.documentId) openDocument(notice.documentId);
      if (notice.viewId) switchView(notice.viewId);
    });
  });
  els.notificationList.querySelectorAll(".notification-dismiss").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      dismissedNotifications.add(button.dataset.key);
      saveDismissedNotifications();
      renderNotifications();
      api.markNotificationsRead([button.dataset.key]).then((nextState) => {
        state = nextState;
        renderNotifications();
      }).catch(() => toast("Hinweis nur lokal ausgeblendet."));
    });
  });
}

function switchView(viewId) {
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  els.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  const view = document.querySelector(`#${viewId}`);
  els.viewTitle.textContent = view.dataset.title;
}

function focusOnboardingTarget(target) {
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  const firstInput = target?.matches?.("input, select, textarea, button") ? target : target?.querySelector?.("input, select, textarea, button");
  firstInput?.focus?.({ preventScroll: true });
}

async function runOnboardingAction(action) {
  switch (action) {
    case "tenant":
      switchView("admin");
      focusOnboardingTarget(els.tenantForm);
      break;
    case "project":
      switchView("bauakten");
      focusOnboardingTarget(els.projectForm);
      break;
    case "users":
      switchView("admin");
      focusOnboardingTarget(els.userForm);
      break;
    case "mail":
      switchView("admin");
      focusOnboardingTarget(els.mailSettingsForm);
      break;
    case "backup":
      try {
        const result = await api.backup();
        const verification = result.verification || await api.verifyBackup();
        toast(`Backup erstellt und geprüft: ${verification.status}`);
        await refresh();
      } catch {
        toast("Backup konnte nicht erstellt werden.");
      }
      break;
    case "system":
      try {
        const result = await api.runSystemCheck();
        state.system_check = result;
        renderAll();
        toast(`Systemcheck: ${result.score}% · ${result.readiness}`);
      } catch {
        toast("Systemcheck konnte nicht ausgeführt werden.");
      }
      break;
  }
}

function hasPermission(permission) {
  return state.permissions?.includes(permission);
}

async function refresh(nextState) {
  try {
    state = nextState || await api.getState();
  } catch (error) {
    if (error.message === "unauthorized") {
      showLogin(true);
      return;
    }
    throw error;
  }
  showLogin(false);
  if (!state.projects.some((project) => project.id === activeProjectId)) {
    activeProjectId = state.projects[0]?.id;
  }
  renderAll();
  setSaveState("Gespeichert");
  const uploadAllowed = hasPermission("document.upload");
  els.newDocBtn.disabled = !uploadAllowed;
  els.dropzone.classList.toggle("disabled", !uploadAllowed);
  document.querySelector('[data-view="admin"]').hidden = !hasPermission("user.manage");
}

function renderProjectList() {
  els.projectList.innerHTML = state.projects.map((project) => {
    const docs = documentsFor(project.id).length;
    const deadlines = deadlinesFor(project).length;
    return `
      <button class="project-row ${project.id === activeProjectId ? "active" : ""}" type="button" data-project="${project.id}">
        <strong>${project.name}</strong>
        <span>${docs} Dokumente · ${deadlines || 0} Fristen</span>
      </button>
    `;
  }).join("");

  els.projectList.querySelectorAll(".project-row").forEach((row) => {
    row.addEventListener("click", () => {
      activeProjectId = row.dataset.project;
      renderAll();
    });
  });
}

function renderProjectDashboard() {
  const project = activeProject();
  const docs = project ? documentsFor(project.id) : [];
  const deadlines = project ? deadlinesFor(project) : [];
  const riskDocs = docs.filter((doc) => doc.tone === "risk");
  const warnDocs = docs.filter((doc) => doc.tone === "warn");
  const doneDocs = docs.filter((doc) => ["geprüft", "freigegeben", "bezahlt", "erledigt"].includes(doc.status));
  const readyPercent = docs.length ? Math.round((doneDocs.length / docs.length) * 100) : 0;
  const urgentDeadlines = deadlines.filter((deadline) => deadline.tone === "risk");
  const openTasks = project ? tasksForProject(project.id) : [];
  const topSignals = [
    ...openTasks.slice(0, 3).map((task) => ({ tone: taskTone(task), title: `${task.action}: ${task.assignee_name}`, text: `${taskPriorityLabel(task)} · ${task.due || "ohne Frist"} · ${task.note || "Aufgabe offen"}` })),
    ...riskDocs.map((doc) => ({ tone: "risk", title: doc.name, text: riskText(doc) })),
    ...urgentDeadlines.map((deadline) => ({ tone: deadline.tone, title: deadline.title, text: `${deadline.date_label} · ${deadline.detail || "ohne Detail"}` })),
    ...warnDocs.slice(0, 2).map((doc) => ({ tone: "warn", title: doc.name, text: riskText(doc) }))
  ].slice(0, 4);

  if (els.projectMetrics) {
    els.projectMetrics.innerHTML = [
      ["Dokumente", docs.length || 0],
      ["Kritisch", riskDocs.length + urgentDeadlines.length],
      ["Aufgaben", openTasks.length],
      ["Workflow", `${readyPercent}%`]
    ].map(([label, value]) => `
      <article>
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `).join("");
  }

  if (els.projectInsight) {
    els.projectInsight.innerHTML = `
      <div>
        <p class="eyebrow">Projektlage</p>
        <h3>${topSignals.length ? "Nächste Entscheidungen" : "Keine akuten Risiken"}</h3>
      </div>
      <div class="signal-list">
        ${topSignals.length ? topSignals.map((item) => `
          <article class="signal-item ${item.tone}">
            <strong>${item.title}</strong>
            <span>${item.text}</span>
          </article>
        `).join("") : `
          <article class="signal-item ok">
            <strong>Keine akuten Risiken</strong>
            <span>Aktuell sind keine kritischen Dokumente oder Fristen in dieser Bauakte markiert.</span>
          </article>
        `}
      </div>
    `;
  }

  if (els.projectStatusStack) {
    const statusGroups = [
      ["Kritisch", docs.filter((doc) => doc.tone === "risk").length, "risk"],
      ["Prüfen", docs.filter((doc) => doc.tone === "warn").length, "warn"],
      ["Bereit", docs.filter((doc) => doc.tone === "ok").length, "ok"],
      ["OCR offen", docs.filter((doc) => doc.ocr_status && doc.ocr_status !== "bereit").length, "warn"]
    ];
    els.projectStatusStack.innerHTML = statusGroups.map(([label, count, tone]) => {
      const width = docs.length ? Math.max(7, Math.round((count / docs.length) * 100)) : 0;
      return `
        <div class="status-line ${tone}">
          <div><span>${label}</span><strong>${count}</strong></div>
          <div class="status-track"><i style="width:${width}%"></i></div>
        </div>
      `;
    }).join("");
  }

  if (els.projectOpenTasks) {
    els.projectOpenTasks.innerHTML = openTasks.slice(0, 5).map((task) => {
      const doc = documentById(task.document_id);
      return `
        <button class="compact-row" type="button" data-document="${task.document_id}">
          <strong>${task.action}: ${task.assignee_name}</strong>
          <span>${taskPriorityLabel(task)} · ${task.due || "ohne Frist"} · ${doc?.name || "Dokument"}</span>
        </button>
      `;
    }).join("") || `<article class="compact-row empty"><strong>Keine offenen Aufgaben</strong><span>Diese Bauakte ist aktuell nicht blockiert.</span></article>`;
  }

  if (els.projectUpcomingDeadlines) {
    const sortedDeadlines = [...deadlines].sort((a, b) => (parseTaskDue(a.date_label)?.getTime() || Number.MAX_SAFE_INTEGER) - (parseTaskDue(b.date_label)?.getTime() || Number.MAX_SAFE_INTEGER));
    els.projectUpcomingDeadlines.innerHTML = sortedDeadlines.slice(0, 5).map((deadline) => `
      <article class="compact-row ${deadline.tone}">
        <strong>${deadline.title}</strong>
        <span>${deadline.date_label} · ${deadline.detail || project?.name || "ohne Detail"}</span>
      </article>
    `).join("") || `<article class="compact-row empty"><strong>Keine Fristen</strong><span>Für diese Bauakte ist aktuell nichts terminiert.</span></article>`;
  }

  if (els.projectActivityList) {
    const taskActivities = openTasks.slice(0, 4).map((task) => ({
      at: task.created_at || 0,
      title: `Aufgabe: ${task.action}`,
      text: `${task.assignee_name} · ${task.status}`
    }));
    const docActivities = docs.slice(0, 5).map((doc) => ({
      at: doc.created_at || 0,
      title: doc.name,
      text: `${doc.type} · ${workflowInfo(doc.status).label}`
    }));
    const activities = [...taskActivities, ...docActivities].sort((a, b) => b.at - a.at).slice(0, 6);
    els.projectActivityList.innerHTML = activities.map((item) => `
      <article class="compact-row">
        <strong>${item.title}</strong>
        <span>${item.text} · ${formatDateTime(item.at)}</span>
      </article>
    `).join("") || `<article class="compact-row empty"><strong>Noch keine Aktivität</strong><span>Neue Dokumente und Aufgaben erscheinen hier.</span></article>`;
  }

  document.querySelectorAll(".compact-row[data-document]").forEach((row) => {
    row.addEventListener("click", () => openDocument(row.dataset.document));
  });
}

function renderDocuments() {
  const project = activeProject();
  const allDocs = project ? documentsFor(project.id) : [];
  const docs = project ? filteredProjectDocuments(project.id) : [];
  renderDocumentFilters(allDocs, docs.length);
  els.documentRows.innerHTML = docs.map((doc) => `
    <button class="table-row document-row-button" type="button" data-document="${doc.id}" role="row">
      <span>${doc.name}</span>
      <span>${doc.type}</span>
      <span>${badge(doc.tone, workflowInfo(doc.status).label)}</span>
      <span>${doc.due || "keine"}</span>
      <span>${nextDocumentAction(doc)}</span>
    </button>
  `).join("");
  els.documentRows.querySelectorAll(".document-row-button").forEach((row) => {
    row.addEventListener("click", () => openDocument(row.dataset.document));
  });
  if (!docs.length) {
    els.documentRows.innerHTML = `
      <div class="table-empty">
        <strong>Keine passenden Dokumente</strong>
        <span>Filter anpassen oder Suchbegriff löschen.</span>
      </div>
    `;
  }
  els.projectTitle.textContent = project?.name || "Keine Bauakte";
  els.activeProjectName.textContent = project?.name || "Keine Bauakte";

  const summaryItems = document.querySelectorAll(".project-summary strong");
  if (summaryItems.length && project) {
    summaryItems[0].textContent = project.customer;
    summaryItems[1].textContent = project.address || "Adresse offen";
    summaryItems[2].textContent = project.owner || "Noch nicht zugewiesen";
  }
}

function renderDocumentFilters(allDocs, visibleCount) {
  if (!els.documentTypeFilter || !els.documentStatusFilter) return;
  const types = [...new Set(allDocs.map((doc) => doc.type).filter(Boolean))].sort();
  const statuses = [...new Set(allDocs.map((doc) => doc.status).filter(Boolean))].sort();
  const typeValue = documentTypeFilter;
  const statusValue = documentStatusFilter;
  els.documentTypeFilter.innerHTML = `<option value="all">Alle Typen</option>${types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}`;
  els.documentStatusFilter.innerHTML = `<option value="all">Alle Status</option>${statuses.map((status) => `<option value="${escapeHtml(status)}">${escapeHtml(workflowInfo(status).label)}</option>`).join("")}`;
  els.documentTypeFilter.value = types.includes(typeValue) ? typeValue : "all";
  els.documentStatusFilter.value = statuses.includes(statusValue) ? statusValue : "all";
  els.documentRiskFilter.value = documentRiskFilter;
  els.documentFilterSearch.value = documentFilterQuery;
  els.clearDocumentFiltersBtn.textContent = `${visibleCount}/${allDocs.length} anzeigen`;
}

function renderInbox() {
  const dashboardItems = state.documents.slice(0, 6);
  const markup = dashboardItems.map((doc) => `
    <article class="inbox-item ${doc.tone}">
      <div>
        <strong>${doc.name}</strong>
        <span>${projectName(doc.project_id)}${doc.project_confidence ? ` · Bauakte ${doc.project_confidence}%` : ""} · ${doc.type} · ${doc.confidence || 0}% Sicherheit · ${formatSize(doc.size)}</span>
        <small>Status: ${workflowInfo(doc.status).label} · Frist: ${doc.due || "keine"} · ${suggestedDocumentAction(doc)}</small>
      </div>
      <div class="inbox-actions">
        ${badge(doc.tone, doc.tone === "ok" ? "bereit" : doc.tone === "warn" ? "prüfen" : "klären")}
        <button class="secondary-button inbox-open-btn" type="button" data-document="${doc.id}">Prüfen</button>
      </div>
    </article>
  `).join("");
  if (els.inboxList) {
    els.inboxList.innerHTML = markup;
    els.inboxList.querySelectorAll(".inbox-open-btn").forEach((button) => {
      button.addEventListener("click", () => openDocument(button.dataset.document));
    });
  }
  renderInboxCenter();
}

function inboxCenterItems() {
  const documents = (state.documents || [])
    .filter((doc) => doc.status !== "geprüft" || doc.tone !== "ok" || doc.ocr_status === "wartet")
    .map((doc) => ({
      kind: "document",
      id: doc.id,
      title: doc.name,
      project: projectName(doc.project_id),
      meta: `${doc.type} · ${workflowInfo(doc.status).label} · ${doc.confidence || 0}% Sicherheit`,
      detail: `Frist: ${doc.due || "keine"} · ${suggestedDocumentAction(doc)}`,
      tone: doc.tone || "warn",
      created_at: doc.created_at || 0,
      document: doc
    }));
  const mails = (state.email_inbox || [])
    .filter((mail) => mail.status !== "übernommen")
    .map((mail) => ({
      kind: "email",
      id: mail.id,
      title: mail.subject,
      project: projectName(mail.suggested_project_id),
      meta: `${mail.sender} · ${mail.attachment_name || "ohne Anhang"} · Bauakte ${mail.project_confidence || 0}%`,
      detail: (mail.body || "").slice(0, 160),
      tone: mail.project_confidence >= 80 ? "warn" : "risk",
      created_at: mail.received_at || 0,
      mail
    }));
  return [...mails, ...documents].sort((a, b) => b.created_at - a.created_at);
}

function filteredInboxCenterItems() {
  const query = inboxQuery.trim().toLowerCase();
  return inboxCenterItems().filter((item) => {
    const text = `${item.title} ${item.project} ${item.meta} ${item.detail}`.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesType = inboxTypeFilter === "all"
      || item.kind === inboxTypeFilter
      || (inboxTypeFilter === "risk" && item.tone === "risk")
      || (inboxTypeFilter === "open" && item.kind === "document" && item.document.status !== "geprüft");
    return matchesQuery && matchesType;
  });
}

function renderInboxCenter() {
  if (!els.uploadReviewList) return;
  const allItems = inboxCenterItems();
  const items = filteredInboxCenterItems();
  const openDocs = allItems.filter((item) => item.kind === "document").length;
  const openMails = allItems.filter((item) => item.kind === "email").length;
  const riskItems = allItems.filter((item) => item.tone === "risk").length;
  if (els.inboxCenterMetrics) {
    els.inboxCenterMetrics.innerHTML = [
      ["Gesamt", allItems.length],
      ["Dokumente", openDocs],
      ["E-Mails", openMails],
      ["Kritisch", riskItems]
    ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("");
  }
  if (els.inboxSearch) els.inboxSearch.value = inboxQuery;
  if (els.inboxTypeFilter) els.inboxTypeFilter.value = inboxTypeFilter;
  if (els.clearInboxFiltersBtn) els.clearInboxFiltersBtn.textContent = `${items.length}/${allItems.length} anzeigen`;
  if (els.approveSelectedInboxBtn) {
    els.approveSelectedInboxBtn.disabled = !selectedInboxDocuments.size || !hasPermission("document.update");
  }
  if (els.applyInboxBatchBtn) {
    els.applyInboxBatchBtn.disabled = !selectedInboxDocuments.size || !hasPermission("document.update");
  }
  if (els.batchProjectSelect) {
    const current = els.batchProjectSelect.value || "";
    els.batchProjectSelect.innerHTML = `<option value="">Bauakte unverändert</option>${(state.projects || []).map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join("")}`;
    els.batchProjectSelect.value = (state.projects || []).some((project) => project.id === current) ? current : "";
  }
  if (els.batchAssigneeSelect) {
    const current = els.batchAssigneeSelect.value || "";
    els.batchAssigneeSelect.innerHTML = `<option value="">Verantwortung offen</option>${(state.team || []).map((member) => `<option value="${member.id}">${escapeHtml(member.name)} · ${escapeHtml(member.role)}</option>`).join("")}`;
    els.batchAssigneeSelect.value = (state.team || []).some((member) => member.id === current) ? current : "";
  }
  els.uploadReviewList.innerHTML = items.map((item) => {
    const checked = item.kind === "document" && selectedInboxDocuments.has(item.id);
    return `
      <article class="inbox-item inbox-center-item ${item.tone}">
        <label class="inbox-select">
          ${item.kind === "document" ? `<input type="checkbox" data-inbox-select="${item.id}" ${checked ? "checked" : ""}>` : `<span class="mail-dot">@</span>`}
        </label>
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.project)} · ${escapeHtml(item.meta)}</span>
          <small>${escapeHtml(item.detail)}</small>
        </div>
        <div class="inbox-actions">
          ${badge(item.tone, item.kind === "email" ? "E-Mail" : item.tone === "risk" ? "klären" : "prüfen")}
          ${item.kind === "email"
            ? `<button class="primary-button convert-inbox-mail-btn" type="button" data-mail="${item.id}">Übernehmen</button>`
            : `<button class="secondary-button inbox-open-btn" type="button" data-document="${item.id}">Prüfen</button>`}
        </div>
      </article>
    `;
  }).join("") || `<article class="inbox-item"><div><strong>Kein offener Eingang</strong><span>Neue Uploads und E-Mails erscheinen hier automatisch.</span></div></article>`;
  els.uploadReviewList.querySelectorAll(".inbox-open-btn").forEach((button) => {
    button.addEventListener("click", () => openDocument(button.dataset.document));
  });
  els.uploadReviewList.querySelectorAll(".convert-inbox-mail-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const nextState = await api.convertInboundEmail(button.dataset.mail);
        await refresh(nextState);
        toast("E-Mail als Dokument übernommen.");
        if (nextState.converted_document_id) openDocument(nextState.converted_document_id);
      } catch {
        toast("E-Mail konnte nicht übernommen werden.");
      }
    });
  });
  els.uploadReviewList.querySelectorAll("[data-inbox-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedInboxDocuments.add(checkbox.dataset.inboxSelect);
      else selectedInboxDocuments.delete(checkbox.dataset.inboxSelect);
      renderInboxCenter();
    });
  });
}

function renderInvoices() {
  if (!els.invoiceList) return;
  const allRows = invoiceRows();
  const rows = filteredInvoiceRows();
  const openAmount = allRows
    .filter((row) => !["bezahlt", "erledigt"].includes(row.doc.status))
    .reduce((sum, row) => sum + row.amount, 0);
  const paymentAmount = allRows
    .filter((row) => row.doc.status === "zur_zahlung")
    .reduce((sum, row) => sum + row.amount, 0);
  const paidAmount = allRows
    .filter((row) => row.doc.status === "bezahlt")
    .reduce((sum, row) => sum + row.amount, 0);
  const exportReadyCount = allRows.filter((row) => row.accounting.exportReady).length;

  if (els.invoiceMetricPanel) {
    els.invoiceMetricPanel.innerHTML = [
      ["Offen", formatCurrency(openAmount)],
      ["Zur Zahlung", formatCurrency(paymentAmount)],
      ["Bezahlt", formatCurrency(paidAmount)],
      ["Exportfähig", exportReadyCount]
    ].map(([label, value]) => `
      <article>
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `).join("");
  }

  if (els.invoiceSearch) els.invoiceSearch.value = invoiceQuery;
  if (els.invoiceStatusFilter) els.invoiceStatusFilter.value = invoiceStatusFilter;
  if (els.invoiceProjectFilter) {
    const current = invoiceProjectFilter;
    els.invoiceProjectFilter.innerHTML = `<option value="all">Alle Bauakten</option>${(state.projects || []).map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join("")}`;
    els.invoiceProjectFilter.value = (state.projects || []).some((project) => project.id === current) ? current : "all";
  }
  if (els.exportInvoicesBtn) {
    els.exportInvoicesBtn.disabled = !rows.length;
    els.exportInvoicesBtn.textContent = `${rows.length}/${allRows.length} Übersicht CSV`;
  }
  if (els.exportDatevInvoicesBtn) {
    els.exportDatevInvoicesBtn.disabled = !rows.length;
    els.exportDatevInvoicesBtn.textContent = `${rows.length} Buchhaltung CSV`;
  }
  if (els.exportPaymentRunBtn) {
    const paymentRows = rows.filter(({ doc }) => ["zur_zahlung", "freigegeben"].includes(doc.status)).length;
    els.exportPaymentRunBtn.disabled = !paymentRows;
    els.exportPaymentRunBtn.textContent = `${paymentRows} Zahlungslauf CSV`;
  }
  renderInvoiceRules();
  els.invoiceRuleList?.querySelectorAll(".edit-invoice-rule-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const rule = (state.invoice_booking_rules || []).find((item) => item.id === button.dataset.rule);
      if (!rule || !els.invoiceRuleForm) return;
      els.invoiceRuleForm.elements.id.value = rule.id;
      els.invoiceRuleForm.elements.keyword.value = rule.keyword || "";
      els.invoiceRuleForm.elements.booking_account.value = rule.booking_account || "";
      els.invoiceRuleForm.elements.tax_rate.value = String(rule.tax_rate || 19);
      els.invoiceRuleForm.elements.label.value = rule.label || "";
      els.invoiceRuleForm.elements.is_active.checked = Number(rule.is_active) !== 0;
      els.invoiceRuleForm.querySelector("button[type='submit']").textContent = "Regel aktualisieren";
      els.invoiceRuleForm.elements.keyword.focus();
    });
  });
  els.invoiceRuleList?.querySelectorAll(".toggle-invoice-rule-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const rule = (state.invoice_booking_rules || []).find((item) => item.id === button.dataset.rule);
      if (!rule) return;
      try {
        await refresh(await api.saveInvoiceRule({
          id: rule.id,
          keyword: rule.keyword,
          booking_account: rule.booking_account,
          tax_rate: rule.tax_rate,
          label: rule.label,
          cost_center: rule.cost_center,
          is_active: Number(rule.is_active) === 0
        }));
        toast(Number(rule.is_active) === 0 ? "Regel aktiviert." : "Regel deaktiviert.");
      } catch {
        toast("Regelstatus konnte nicht geändert werden.");
      }
    });
  });
  els.invoiceRuleList?.querySelectorAll(".delete-invoice-rule-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await refresh(await api.deleteInvoiceRule(button.dataset.rule));
        resetInvoiceRuleForm();
        toast("Regel gelöscht.");
      } catch {
        toast("Regel konnte nicht gelöscht werden.");
      }
    });
  });

  els.invoiceList.innerHTML = rows.map(({ doc, amount, accounting, dueState }) => {
    const status = workflowInfo(doc.status);
    const canApprove = hasPermission("document.update") && !doc.approved_by && doc.status !== "bezahlt";
    const canRelease = hasPermission("document.update") && ["freigegeben", "geprüft"].includes(doc.status);
    const canPay = hasPermission("document.update") && ["zur_zahlung", "freigegeben"].includes(doc.status);
    return `
      <article class="invoice-row ${dueState}">
        <button class="invoice-main" type="button" data-document="${doc.id}">
          <strong>${escapeHtml(doc.name)}</strong>
          <span>${escapeHtml(invoiceApprovalLabel(doc))} · ${escapeHtml(accounting.creditor)}</span>
          <small class="invoice-accounting">${escapeHtml(accounting.invoiceNumber)} · Konto ${escapeHtml(accounting.bookingAccount || "offen")} · ${accounting.ruleLabel ? `Regel ${escapeHtml(accounting.ruleLabel)} · ` : ""}Netto ${accounting.net ? formatCurrency(accounting.net) : "offen"} · Steuer ${accounting.tax ? formatCurrency(accounting.tax) : "offen"} · ${accounting.iban || "IBAN offen"}</small>
        </button>
        <span>${escapeHtml(projectName(doc.project_id))}</span>
        <strong>${accounting.gross ? formatCurrency(accounting.gross) : "Betrag offen"}</strong>
        <span>${escapeHtml(invoiceDueLabel(doc))}</span>
        <span>${badge(status.tone, status.label)}</span>
        <div class="invoice-actions">
          <button class="secondary-button invoice-open-btn" type="button" data-document="${doc.id}">Öffnen</button>
          <button class="secondary-button invoice-edit-btn" type="button" data-document="${doc.id}">${editingInvoiceId === doc.id ? "Schließen" : "Daten bearbeiten"}</button>
          ${canApprove ? `<button class="secondary-button invoice-action-btn" type="button" data-document="${doc.id}" data-action="approve">Freigeben</button>` : ""}
          ${canRelease ? `<button class="primary-button invoice-action-btn" type="button" data-document="${doc.id}" data-action="payment">Zur Zahlung</button>` : ""}
          ${canPay ? `<button class="secondary-button invoice-paid-btn" type="button" data-document="${doc.id}">Bezahlt</button>` : ""}
        </div>
        ${editingInvoiceId === doc.id ? invoiceEditForm(doc, accounting) : ""}
      </article>
    `;
  }).join("") || `
    <div class="table-empty">
      <strong>Keine Rechnungen gefunden</strong>
      <span>Rechnungen entstehen durch Uploads, E-Mail-Übernahme oder erkannte Rechnungsmerkmale wie Betrag, IBAN und Zahlungsziel.</span>
    </div>
  `;

  els.invoiceList.querySelectorAll(".invoice-main, .invoice-open-btn").forEach((button) => {
    button.addEventListener("click", () => openDocument(button.dataset.document));
  });
  els.invoiceList.querySelectorAll(".invoice-action-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await refresh(await api.runApprovalAction({ id: button.dataset.document, action: button.dataset.action }));
        toast(button.dataset.action === "payment" ? "Rechnung zur Zahlung freigegeben." : "Rechnung freigegeben.");
      } catch {
        toast("Rechnungsaktion konnte nicht ausgeführt werden.");
      }
    });
  });
  els.invoiceList.querySelectorAll(".invoice-paid-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const doc = documentById(button.dataset.document);
      try {
        await refresh(await api.updateDocumentStatus({ id: button.dataset.document, status: "bezahlt", tone: "ok", due: doc?.due || "keine" }));
        toast("Rechnung als bezahlt markiert.");
      } catch {
        toast("Zahlungsstatus konnte nicht gespeichert werden.");
      }
    });
  });
  els.invoiceList.querySelectorAll(".invoice-edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      editingInvoiceId = editingInvoiceId === button.dataset.document ? null : button.dataset.document;
      renderInvoices();
    });
  });
  els.invoiceList.querySelectorAll(".cancel-invoice-edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      editingInvoiceId = null;
      renderInvoices();
    });
  });
  els.invoiceList.querySelectorAll(".invoice-edit-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      try {
        await refresh(await api.updateInvoiceFields({
          id: form.dataset.invoiceForm,
          invoice_number: data.get("invoice_number"),
          creditor: data.get("creditor"),
          iban: data.get("iban"),
          net_amount: data.get("net_amount"),
          tax_amount: data.get("tax_amount"),
          gross_amount: data.get("gross_amount"),
          tax_rate: data.get("tax_rate"),
          invoice_date: data.get("invoice_date"),
          service_date: data.get("service_date"),
          booking_account: data.get("booking_account"),
          cost_center: data.get("cost_center"),
          payment_reference: data.get("payment_reference")
        }));
        editingInvoiceId = null;
        toast("Rechnungsdaten gespeichert und geprüft.");
      } catch {
        toast("Rechnungsdaten konnten nicht gespeichert werden.");
      }
    });
  });
  els.invoiceList.querySelectorAll(".learn-invoice-rule-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const form = button.closest(".invoice-edit-form");
      const doc = documentById(form?.dataset.invoiceForm);
      if (!form || !doc) return;
      const data = new FormData(form);
      const accounting = {
        creditor: data.get("creditor"),
        bookingAccount: data.get("booking_account"),
        taxRate: data.get("tax_rate") || 19
      };
      const suggestion = invoiceLearningSuggestion(doc, accounting);
      if (!suggestion.bookingAccount) {
        toast("Für eine Lernregel fehlt das Buchungskonto.");
        return;
      }
      try {
        await refresh(await api.saveInvoiceRule({
          keyword: suggestion.keyword,
          booking_account: suggestion.bookingAccount,
          tax_rate: suggestion.taxRate,
          label: suggestion.label
        }));
        toast(`Regel gespeichert: ${suggestion.keyword} → ${suggestion.bookingAccount}`);
      } catch {
        toast("Regel konnte nicht gespeichert werden.");
      }
    });
  });
}

function renderUploadControls() {
  if (!els.uploadProjectSelect) return;
  const currentValue = els.uploadProjectSelect.value || "auto";
  els.uploadProjectSelect.innerHTML = `
    <option value="auto">Automatisch vorschlagen</option>
    ${state.projects.map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join("")}
  `;
  els.uploadProjectSelect.value = state.projects.some((project) => project.id === currentValue) ? currentValue : "auto";
}

function renderTasks() {
  const deadlineItems = state.deadlines.slice(0, 3).map((deadline) => ({
    type: "Frist",
    tone: deadline.tone,
    title: deadline.title,
    detail: `${deadline.date_label} · ${deadline.detail || "ohne Detail"}`
  }));
  const taskItems = (state.document_tasks || [])
    .filter((task) => task.status !== "erledigt")
    .sort(compareTasks)
    .slice(0, 3)
    .map((task) => {
      const doc = documentById(task.document_id);
      return {
        type: "Aufgabe",
        tone: taskTone(task),
        title: `${task.action}: ${task.assignee_name}`,
        detail: `${taskPriorityLabel(task)} · ${task.due || "ohne Frist"} · ${doc?.name || "Dokument"}`
      };
    });
  const items = [...taskItems, ...deadlineItems].slice(0, 5);
  els.taskList.innerHTML = items.map((item) => `
    <article class="task-item ${item.tone}">
      <strong>${item.title}</strong>
      <span>${item.type} · ${item.detail}</span>
    </article>
  `).join("");
}

function filteredAssignedTasks() {
  const tasks = state.document_tasks || [];
  if (taskFilter === "mine") {
    return tasks.filter((task) => task.assignee_id === state.user?.id && task.status !== "erledigt");
  }
  if (taskFilter === "open") {
    return tasks.filter((task) => task.status !== "erledigt");
  }
  return tasks;
}

function renderAssignedTasks() {
  if (!els.assignedTaskList || !els.taskOverview) return;
  const allTasks = state.document_tasks || [];
  const myOpen = allTasks.filter((task) => task.assignee_id === state.user?.id && task.status !== "erledigt").length;
  const open = allTasks.filter((task) => task.status !== "erledigt").length;
  const done = allTasks.filter((task) => task.status === "erledigt").length;
  const urgent = allTasks.filter((task) => ["überfällig", "heute", "kritisch"].includes(taskUrgency(task))).length;
  els.taskOverview.innerHTML = [
    ["Meine offenen", myOpen],
    ["Offen gesamt", open],
    ["Heute kritisch", urgent],
    ["Erledigt", done]
  ].map(([label, value]) => `
    <article>
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");

  const tasks = filteredAssignedTasks().sort(compareTasks);
  els.assignedTaskList.innerHTML = tasks.map((task) => {
    const doc = documentById(task.document_id);
    const project = doc ? projectById(doc.project_id) : null;
    return `
      <article class="assigned-task ${task.status === "erledigt" ? "done" : "open"} ${taskUrgency(task)}">
        <div>
          <strong>${task.action} · ${task.assignee_name}</strong>
          <span>${doc?.name || "Dokument"} · ${project?.name || "Bauakte"} · ${task.due || "ohne Frist"}</span>
          <small>${task.note || "ohne Hinweis"} · erstellt von ${task.created_by}</small>
        </div>
        <div class="assigned-task-actions">
          ${badge(taskTone(task), taskPriorityLabel(task))}
          <button class="secondary-button open-task-document" type="button" data-document="${task.document_id}">Öffnen</button>
          ${task.status === "erledigt" ? "" : `<button class="primary-button complete-assigned-task" type="button" data-task="${task.id}">Erledigen</button>`}
        </div>
      </article>
    `;
  }).join("") || `
    <article class="assigned-task">
      <div>
        <strong>Keine Aufgaben</strong>
        <span>Für diesen Filter sind aktuell keine Aufgaben vorhanden.</span>
      </div>
    </article>
  `;

  els.assignedTaskList.querySelectorAll(".open-task-document").forEach((button) => {
    button.addEventListener("click", () => openDocument(button.dataset.document));
  });
  els.assignedTaskList.querySelectorAll(".complete-assigned-task").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await refresh(await api.updateDocumentTaskStatus({ task_id: button.dataset.task, status: "erledigt" }));
        toast("Aufgabe erledigt.");
      } catch {
        toast("Aufgabe konnte nicht erledigt werden.");
      }
    });
  });
}

function renderDeadlines(onlyWeek = els.weekFilter.classList.contains("active")) {
  const list = onlyWeek ? state.deadlines.slice(0, 4) : state.deadlines;
  els.deadlineBoard.innerHTML = list.map((deadline) => `
    <article class="deadline-item ${deadline.tone}">
      <strong>${deadline.date_label}</strong>
      <span>${deadline.title}</span>
      <span>${deadline.detail || "ohne Detail"}</span>
    </article>
  `).join("");
}

function renderAnalysis(payload) {
  const analysis = payload?.analysis || {
    type: "Rechnung",
    status: "offen",
    due: "14 Tage",
    tone: "warn",
    confidence: 92
  };
  const filename = payload?.filename || "RE-2026-184_Material-Elektro.pdf";
  currentAnalysis = { filename, analysis, source: payload?.source || `Quelle: ${filename} · simulierte Analyse` };
  const nextAction = analysis.tone === "risk"
    ? "Sofort prüfen und Frist setzen"
    : analysis.tone === "warn"
      ? "Fachlich kontrollieren"
      : "Zur Freigabe vorbereiten";
  const riskLabel = analysis.tone === "risk" ? "kritisch" : analysis.tone === "warn" ? "prüfen" : "bereit";
  els.analysisBox.innerHTML = `
    <span class="result-label">KI/OCR-Vorschlag</span>
    <h3>${analysis.type} erkannt</h3>
    <p>Status: ${analysis.status} · Frist: ${analysis.due} · Sicherheit: ${analysis.confidence}%</p>
    <div class="risk-strip">
      ${badge(analysis.tone, riskLabel)}
      <span>${nextAction}</span>
    </div>
    <div class="source-row">${currentAnalysis.source}</div>
  `;

  els.fieldGrid.innerHTML = Object.entries({
    Dokument: filename,
    Dokumenttyp: analysis.type,
    Status: analysis.status,
    Frist: analysis.due,
    Aktion: nextAction,
    Fristquelle: analysis.due_source || "Regel",
    Sicherheit: `${analysis.confidence}%`,
    Speicherung: "Backend + SQLite"
  }).map(([key, value]) => `
    <article class="field-card">
      <span>${key}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function renderChat() {
  els.chatHistory.innerHTML = state.chat.map((line) => `
    <div class="chat-line ${line.role}">${line.text}</div>
  `).join("");
  els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
}

function renderStats() {
  const projectCount = state.projects.length;
  const docCount = state.documents.length;
  const riskCount = state.deadlines.filter((deadline) => deadline.tone === "risk").length;
  els.tenantStats.textContent = `${projectCount} Baustellen · ${docCount} Dokumente`;
  if (els.brandTenant) els.brandTenant.textContent = state.tenant_profile?.name || state.user?.tenant || "Mandant";
  els.kpiDocs.textContent = String(docCount);
  document.querySelector(".kpi-card.urgent strong").textContent = String(riskCount);
  document.querySelector(".kpi-card:nth-child(3) strong").textContent = String(state.documents.filter((doc) => doc.status !== "geprüft").length);
}

function renderTenant() {
  if (!els.tenantForm || !state.tenant_profile) return;
  const tenant = state.tenant_profile;
  els.tenantForm.name.value = tenant.name || "";
  els.tenantForm.plan.value = tenant.plan || "";
  els.tenantForm.company_email.value = tenant.company_email || "";
  els.tenantForm.phone.value = tenant.phone || "";
  els.tenantForm.billing_address.value = tenant.billing_address || "";
  els.tenantForm.license_status.value = tenant.license_status || "aktiv";
  els.tenantForm.seat_limit.value = tenant.seat_limit || 10;
  els.tenantForm.data_region.value = tenant.data_region || "Deutschland";
  els.tenantForm.escalation_interval_minutes.value = tenant.escalation_interval_minutes ?? 240;
  if (els.tenantStatus) {
    els.tenantStatus.innerHTML = `
      <article class="storage-status">
        <span>Lizenz</span>
        <strong>${tenant.license_status || "aktiv"}</strong>
      </article>
      <article class="storage-status">
        <span>Plan</span>
        <strong>${tenant.plan || "Profi"}</strong>
      </article>
      <article class="storage-status">
        <span>Sitze</span>
        <strong>${(state.users || []).length}/${tenant.seat_limit || 10}</strong>
      </article>
      <article class="storage-status">
        <span>Datenregion</span>
        <strong>${tenant.data_region || "Deutschland"}</strong>
      </article>
    `;
  }
}

function onboardingSteps() {
  const tenant = state.tenant_profile || {};
  const systemScore = state.system_check?.score || 0;
  const backupOk = state.compliance?.backup?.status === "ok" || state.system_check?.checks?.some((item) => item.key === "backup" && item.status === "ok");
  const mailReady = state.mail?.configured || state.mail?.driver === "outbox";
  return [
    {
      id: "tenant",
      title: "Betrieb erfassen",
      text: `${tenant.name || "Firmenname"} · ${tenant.company_email || "Kontakt-E-Mail offen"}`,
      done: Boolean(tenant.name && tenant.company_email && tenant.data_region),
      action: "Mandant öffnen"
    },
    {
      id: "project",
      title: "Erste Bauakte anlegen",
      text: `${(state.projects || []).length} Bauakte(n) vorhanden`,
      done: (state.projects || []).length > 0,
      action: "Bauakte anlegen"
    },
    {
      id: "users",
      title: "Team und Rollen einrichten",
      text: `${(state.users || []).length} Benutzer · Admin-2FA ${state.security_policy?.admin_mfa_missing?.length ? "offen" : "bereit"}`,
      done: (state.users || []).length > 1 && !(state.security_policy?.admin_mfa_missing || []).length,
      action: "Benutzer öffnen"
    },
    {
      id: "mail",
      title: "E-Mail-Betrieb festlegen",
      text: state.mail?.configured ? "SMTP konfiguriert" : "Outbox-Demo aktiv",
      done: Boolean(mailReady),
      action: "E-Mail öffnen"
    },
    {
      id: "backup",
      title: "Backup prüfen",
      text: state.compliance?.backup?.backup || state.compliance?.backup?.message || "noch nicht geprüft",
      done: Boolean(backupOk),
      action: "Backup erstellen"
    },
    {
      id: "system",
      title: "Systemcheck ausführen",
      text: `${systemScore}% · ${state.system_check?.readiness || "noch offen"}`,
      done: systemScore > 0,
      action: "Systemcheck starten"
    }
  ];
}

function renderOnboarding() {
  if (!els.onboardingList) return;
  const steps = onboardingSteps();
  const doneCount = steps.filter((step) => step.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);
  if (els.onboardingProgressPill) els.onboardingProgressPill.textContent = `${progress}%`;
  if (els.onboardingProgressBar) els.onboardingProgressBar.style.width = `${progress}%`;
  els.onboardingList.innerHTML = steps.map((step, index) => `
    <article class="onboarding-step ${step.done ? "done" : "open"}">
      <div>
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeHtml(step.title)}</strong>
        <small>${escapeHtml(step.text)}</small>
      </div>
      <button class="${step.done ? "secondary-button" : "primary-button"}" type="button" data-onboarding-action="${step.id}">
        ${step.done ? "Prüfen" : escapeHtml(step.action)}
      </button>
    </article>
  `).join("");
  els.onboardingList.querySelectorAll("[data-onboarding-action]").forEach((button) => {
    button.addEventListener("click", () => runOnboardingAction(button.dataset.onboardingAction));
  });
}

function renderAdmin() {
  els.userList.innerHTML = (state.users || []).map((user) => `
    <article class="user-row">
      <div>
        <strong>${user.name}</strong>
        <span>${user.email} · ${user.is_active ? "aktiv" : "gesperrt"}${user.locked_until && user.locked_until > Date.now() ? " · Login gesperrt" : ""}</span>
        <small>${user.failed_login_count ? `${user.failed_login_count} Fehlversuch(e)` : "keine Fehlversuche"}${user.last_login_at ? ` · letzter Login: ${formatDateTime(user.last_login_at)}` : ""}</small>
      </div>
      <div class="user-actions">
        <select data-user="${user.id}" ${hasPermission("user.manage") ? "" : "disabled"}>
          ${["Geschäftsführung", "Büro", "Bauleitung", "Steuerberater"].map((role) => `
            <option value="${role}" ${role === user.role ? "selected" : ""}>${role}</option>
          `).join("")}
        </select>
        <button class="secondary-button user-status-btn" type="button" data-user="${user.id}" data-active="${user.is_active ? "0" : "1"}">
          ${user.is_active ? "Sperren" : "Aktivieren"}
        </button>
        <button class="secondary-button user-mfa-btn" type="button" data-user="${user.id}" data-enabled="${user.mfa_enabled ? "0" : "1"}">
          ${user.mfa_enabled ? "2FA aus" : "2FA an"}
        </button>
        <button class="secondary-button user-password-btn" type="button" data-user="${user.id}">Passwort</button>
      </div>
    </article>
  `).join("");
  els.userList.querySelectorAll("select[data-user]").forEach((select) => {
    select.addEventListener("change", async () => {
      try {
        await refresh(await api.updateUserRole({ id: select.dataset.user, role: select.value }));
        toast("Rolle aktualisiert.");
      } catch {
        toast("Rolle konnte nicht geändert werden.");
      }
    });
  });
  els.userList.querySelectorAll(".user-status-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await refresh(await api.updateUserStatus({ id: button.dataset.user, is_active: button.dataset.active === "1" }));
        toast("Benutzerstatus aktualisiert.");
      } catch {
        toast("Benutzerstatus konnte nicht geändert werden.");
      }
    });
  });
  els.userList.querySelectorAll(".user-password-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const nextState = await api.resetUserPassword({ id: button.dataset.user });
        await refresh(nextState);
        toast(`Neues Startpasswort: ${nextState.initial_password}`);
      } catch {
        toast("Passwort konnte nicht zurückgesetzt werden.");
      }
    });
  });
  els.userList.querySelectorAll(".user-mfa-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await refresh(await api.updateUserMfa({ id: button.dataset.user, mfa_enabled: button.dataset.enabled === "1" }));
        toast("Zwei-Faktor-Status aktualisiert.");
      } catch {
        toast("Zwei-Faktor-Status konnte nicht geändert werden.");
      }
    });
  });

  if (els.securityPolicyPanel && state.security_policy) {
    const policy = state.security_policy;
    const password = policy.password_policy || {};
    els.securityPolicyPanel.innerHTML = `
      <article>
        <span>Admin-2FA</span>
        <strong>${policy.admin_mfa_required ? "verpflichtend" : "optional"}</strong>
        <small>${(policy.admin_mfa_missing || []).length} Admin-Zugang/Zugänge ohne aktive 2FA</small>
      </article>
      <article>
        <span>Passwortregel</span>
        <strong>${password.min_length || 12}+ Zeichen</strong>
        <small>Großbuchstaben, Kleinbuchstaben, Zahl und Sonderzeichen · ${password.iterations || 0} PBKDF2-Iterationen</small>
      </article>
    `;
  }

  if (els.roleMatrix) {
    const roles = state.role_matrix || [];
    const permissions = roles[0]?.permissions || [];
    els.roleMatrix.innerHTML = roles.length ? `
      <div class="role-matrix-table" style="--role-columns: ${roles.length}">
        <strong>Recht</strong>
        ${roles.map((role) => `<strong>${escapeHtml(role.role)}</strong>`).join("")}
        ${permissions.map((permission) => `
          <span>${escapeHtml(permission.label)}</span>
          ${roles.map((role) => {
            const current = (role.permissions || []).find((item) => item.key === permission.key);
            return `<span class="${current?.allowed ? "allowed" : "denied"}">${current?.allowed ? "✓" : "–"}</span>`;
          }).join("")}
        `).join("")}
      </div>
    ` : `<article><strong>Keine Rollenmatrix</strong><span>Rechte werden geladen.</span></article>`;
  }

  els.auditList.innerHTML = (state.audit || []).slice(0, 8).map((entry) => `
    <article>
      <strong>${entry.action}</strong>
      <span>${entry.detail || "ohne Detail"}</span>
    </article>
  `).join("");

  if (els.ocrQueue) {
    els.ocrQueue.innerHTML = (state.ocr_jobs || []).slice(0, 6).map((job) => `
      <article class="queue-row ${job.status}">
        <div>
          <strong>${job.status}</strong>
          <span>${job.message || "OCR-Auftrag"} · ${job.engine || "wartet"}</span>
        </div>
        ${badge(job.status === "fertig" ? "ok" : job.status === "fehler" ? "risk" : "warn", job.status)}
      </article>
    `).join("") || `<article><strong>Keine OCR-Aufträge</strong><span>Neue Uploads erscheinen hier automatisch.</span></article>`;
  }

  if (els.emailInboxList) {
    els.emailInboxList.innerHTML = (state.email_inbox || []).slice(0, 8).map((mail) => `
      <article class="inbound-mail-row ${mail.status === "übernommen" ? "done" : "open"}">
        <div>
          <strong>${escapeHtml(mail.subject)}</strong>
          <span>${escapeHtml(mail.sender)} · ${escapeHtml(mail.attachment_name || "ohne Anhang")} · ${projectName(mail.suggested_project_id)} ${mail.project_confidence || 0}%</span>
          <small>${escapeHtml(mail.body || "").slice(0, 180)}</small>
        </div>
        <div class="inbound-mail-actions">
          ${badge(mail.status === "übernommen" ? "ok" : "warn", mail.status)}
          ${mail.status === "übernommen" ? `<button class="secondary-button" type="button" data-document="${mail.converted_document_id}">Dokument öffnen</button>` : `<button class="primary-button convert-email-btn" type="button" data-mail="${mail.id}">Als Dokument übernehmen</button>`}
        </div>
      </article>
    `).join("") || `<article><strong>Keine eingegangenen E-Mails</strong><span>Später befüllt eine IMAP-/Microsoft-365-Anbindung diesen Eingang automatisch.</span></article>`;
    els.emailInboxList.querySelectorAll(".convert-email-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const nextState = await api.convertInboundEmail(button.dataset.mail);
          await refresh(nextState);
          toast("E-Mail als Dokument übernommen.");
          if (nextState.converted_document_id) openDocument(nextState.converted_document_id);
        } catch {
          toast("E-Mail konnte nicht übernommen werden.");
        }
      });
    });
    els.emailInboxList.querySelectorAll("[data-document]").forEach((button) => {
      button.addEventListener("click", () => openDocument(button.dataset.document));
    });
  }

  if (els.outboxList) {
    els.outboxList.innerHTML = (state.email_outbox || []).slice(0, 12).map((mail) => `
      <details class="mail-row ${mail.status}">
        <summary>
          <span class="mail-summary">
            <strong>${escapeHtml(mail.subject)}</strong>
            <span>${escapeHtml(mail.recipient)} · ${escapeHtml(mail.kind)} · ${escapeHtml(mail.status)} · Versuche: ${mail.attempts || 0}</span>
            ${mail.error_message ? `<small>${escapeHtml(mail.error_message)}</small>` : ""}
          </span>
          ${badge(mail.status === "gesendet" ? "ok" : mail.status === "fehler" ? "risk" : "warn", mail.status)}
        </summary>
        <div class="mail-detail">
          <dl class="mail-meta">
            <div><dt>Empfänger</dt><dd>${escapeHtml(mail.recipient)}</dd></div>
            <div><dt>Betreff</dt><dd>${escapeHtml(mail.subject)}</dd></div>
            <div><dt>Art</dt><dd>${escapeHtml(mail.kind)}</dd></div>
            <div><dt>Status</dt><dd>${escapeHtml(mail.status)}</dd></div>
            <div><dt>Erstellt</dt><dd>${formatDateTime(mail.created_at)}</dd></div>
            <div><dt>Gesendet</dt><dd>${mail.sent_at ? formatDateTime(mail.sent_at) : "noch nicht"}</dd></div>
          </dl>
          <pre class="mail-body">${escapeHtml(mail.body)}</pre>
          ${mail.status === "gesendet" ? `
            <p class="mail-lock">Gesendete Nachrichten bleiben als Nachweis unverändert.</p>
          ` : `
            <form class="mail-edit-form" data-mail="${mail.id}">
              <input name="recipient" type="email" value="${escapeHtml(mail.recipient)}" placeholder="Empfänger" required>
              <input name="subject" type="text" value="${escapeHtml(mail.subject)}" placeholder="Betreff" required>
              <textarea name="body" rows="6" placeholder="Nachrichtentext" required>${escapeHtml(mail.body)}</textarea>
              <div class="action-row inline mail-actions">
                <button class="primary-button send-mail-btn" type="button" data-mail="${mail.id}">Diese E-Mail senden</button>
                <button class="secondary-button" type="submit">Bearbeitung speichern</button>
                <button class="secondary-button danger delete-mail-btn" type="button" data-mail="${mail.id}">Löschen</button>
              </div>
            </form>
          `}
        </div>
      </details>
    `).join("") || `<article><strong>Keine E-Mails</strong><span>Einladungen, 2FA-Codes und Erinnerungen erscheinen hier.</span></article>`;
    els.outboxList.querySelectorAll(".mail-edit-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        try {
          await refresh(await api.updateOutboxMail({
            id: form.dataset.mail,
            recipient: data.get("recipient"),
            subject: data.get("subject"),
            body: data.get("body")
          }));
          toast("E-Mail-Entwurf gespeichert.");
        } catch {
          toast("E-Mail-Entwurf konnte nicht gespeichert werden.");
        }
      });
    });
    els.outboxList.querySelectorAll(".delete-mail-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await refresh(await api.deleteOutboxMail(button.dataset.mail));
          toast("E-Mail aus dem Ausgang gelöscht.");
        } catch {
          toast("E-Mail konnte nicht gelöscht werden.");
        }
      });
    });
    els.outboxList.querySelectorAll(".send-mail-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const nextState = await api.sendOutboxMail(button.dataset.mail);
          await refresh(nextState);
          const result = nextState.mail_result || {};
          if (result.sent) {
            toast("E-Mail gesendet.");
          } else if (result.failed) {
            toast("E-Mail konnte nicht gesendet werden. SMTP prüfen.");
          } else {
            toast("E-Mail geprüft. Echter Versand ist noch nicht konfiguriert.");
          }
        } catch {
          toast("E-Mail konnte nicht einzeln gesendet werden.");
        }
      });
    });
  }

  if (els.deliveryLogList) {
    const deliveryRows = filteredDeliveryLog();
    els.deliveryLogList.innerHTML = deliveryRows.slice(0, 12).map((entry) => {
      const tone = entry.status === "gesendet" ? "ok" : entry.status === "fehler" ? "risk" : "warn";
      return `
        <article class="delivery-log-row ${tone}">
          <div>
            <strong>${escapeHtml(entry.subject)}</strong>
            <span>${escapeHtml(entry.recipient)} · ${formatDateTime(entry.created_at)}</span>
            ${entry.message ? `<small>${escapeHtml(entry.message)}</small>` : ""}
          </div>
          ${badge(tone, entry.status)}
        </article>
      `;
    }).join("") || `<article class="delivery-log-row"><div><strong>Keine passenden Einträge</strong><span>Filter anpassen oder eine Testmail senden.</span></div></article>`;
  }

  if (els.mailStatusPanel && state.mail) {
    els.mailStatusPanel.innerHTML = `
      <article class="storage-status">
        <span>Mail-Treiber</span>
        <strong>${state.mail.driver}</strong>
      </article>
      <article class="storage-status">
        <span>Status</span>
        <strong>${state.mail.message}</strong>
      </article>
      <article class="storage-status">
        <span>Server</span>
        <strong>${state.mail.host}:${state.mail.port}</strong>
      </article>
      <article class="storage-status">
        <span>Absender</span>
        <strong>${state.mail.from}</strong>
      </article>
      <article class="storage-status">
        <span>SMTP-Benutzer</span>
        <strong>${state.mail.username || "nicht gesetzt"}</strong>
      </article>
      <article class="storage-status">
        <span>Passwort</span>
        <strong>${state.mail.password_configured ? "gespeichert" : "nicht gesetzt"}</strong>
      </article>
    `;
  }
  if (els.mailSettingsForm && state.mail) {
    els.mailSettingsForm.driver.value = state.mail.driver || "outbox";
    els.mailSettingsForm.from_address.value = state.mail.from || "";
    els.mailSettingsForm.host.value = state.mail.host === "nicht gesetzt" ? "" : state.mail.host || "";
    els.mailSettingsForm.port.value = state.mail.port || 587;
    els.mailSettingsForm.username.value = state.mail.username || "";
    els.mailSettingsForm.password.value = "";
    els.mailSettingsForm.tls.checked = Boolean(state.mail.tls);
  }

  if (els.templateList) {
    els.templateList.innerHTML = (state.email_templates || []).map((template) => `
      <form class="template-form" data-kind="${template.kind}">
        <div class="template-copy">
          <strong>${template.label}</strong>
          <span>Platzhalter: {items}, {actor}, {recipient}, {rule_name}, {title}, {detail}, {target_role}</span>
        </div>
        <input name="subject" type="text" value="${escapeHtml(template.subject)}" placeholder="Betreff">
        <textarea name="body" rows="5" placeholder="Nachrichtentext">${escapeHtml(template.body)}</textarea>
        <div class="template-preview" aria-live="polite"></div>
        <div class="action-row inline template-actions">
          <button class="secondary-button preview-template-btn" type="button">Vorschau aktualisieren</button>
          <button class="secondary-button reset-template-btn" type="button">Werkseinstellung</button>
          <button class="secondary-button" type="submit">Vorlage speichern</button>
        </div>
      </form>
    `).join("") || `<article><strong>Keine Vorlagen</strong><span>Standardvorlagen werden beim Start automatisch angelegt.</span></article>`;
    els.templateList.querySelectorAll(".template-form").forEach((form) => {
      updateTemplatePreview(form);
      form.elements.subject.addEventListener("input", () => updateTemplatePreview(form));
      form.elements.body.addEventListener("input", () => updateTemplatePreview(form));
      form.querySelector(".preview-template-btn")?.addEventListener("click", () => updateTemplatePreview(form));
      form.querySelector(".reset-template-btn")?.addEventListener("click", async () => {
        try {
          await refresh(await api.resetEmailTemplate(form.dataset.kind));
          toast("E-Mail-Vorlage zurückgesetzt.");
        } catch {
          toast("E-Mail-Vorlage konnte nicht zurückgesetzt werden.");
        }
      });
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        try {
          await refresh(await api.updateEmailTemplate({
            kind: form.dataset.kind,
            subject: data.get("subject"),
            body: data.get("body")
          }));
          toast("E-Mail-Vorlage gespeichert.");
        } catch {
          toast("E-Mail-Vorlage konnte nicht gespeichert werden.");
        }
      });
    });
  }

  if (els.escalationMetrics) {
    const rules = state.escalation_rules || [];
    const preview = state.escalation_preview || [];
    const scheduler = state.escalation_scheduler || {};
    const activeRules = rules.filter((rule) => rule.is_active).length;
    els.escalationMetrics.innerHTML = `
      <article class="storage-status">
        <span>Aktive Regeln</span>
        <strong>${activeRules}</strong>
      </article>
      <article class="storage-status">
        <span>Akute Fälle</span>
        <strong>${preview.length}</strong>
      </article>
      <article class="storage-status">
        <span>Zielrollen</span>
        <strong>${[...new Set(rules.map((rule) => rule.target_role))].join(", ") || "keine"}</strong>
      </article>
      <article class="storage-status">
        <span>Status</span>
        <strong>${preview.length ? "prüfen" : "ruhig"}</strong>
      </article>
      <article class="storage-status">
        <span>Automatik</span>
        <strong>${scheduler.enabled ? `alle ${scheduler.interval_minutes} Min.` : "deaktiviert"}</strong>
      </article>
      <article class="storage-status">
        <span>Letzte Prüfung</span>
        <strong>${scheduler.last_run_at ? formatDateTime(scheduler.last_run_at) : "noch offen"}</strong>
      </article>
    `;
  }

  if (els.escalationList) {
    const preview = state.escalation_preview || [];
    const rules = state.escalation_rules || [];
    els.escalationList.innerHTML = `
      ${rules.map((rule) => `
        <article class="escalation-rule ${rule.is_active ? "active" : "paused"}">
          <div class="escalation-rule-copy">
            <strong>${rule.name}</strong>
            <span>${rule.trigger_type} · nach ${rule.threshold_hours} Stunden · an ${rule.target_role}</span>
          </div>
          <form class="escalation-rule-form" data-rule="${rule.id}">
            <label>
              <span>Stunden</span>
              <input name="threshold_hours" type="number" min="0" max="720" value="${rule.threshold_hours}">
            </label>
            <label>
              <span>Zielrolle</span>
              <select name="target_role">
                ${["Geschäftsführung", "Bauleitung", "Büro", "Steuerberater"].map((role) => `
                  <option value="${role}" ${role === rule.target_role ? "selected" : ""}>${role}</option>
                `).join("")}
              </select>
            </label>
            <label class="switch-label">
              <input name="is_active" type="checkbox" ${rule.is_active ? "checked" : ""}>
              <span>aktiv</span>
            </label>
            <button class="secondary-button" type="submit">Speichern</button>
          </form>
        </article>
      `).join("")}
      ${preview.length ? preview.map((item) => `
        <article class="escalation-case">
          <div>
            <strong>${item.title}</strong>
            <span>${item.detail}</span>
            <small>${item.rule_name} · Zielrolle ${item.target_role}</small>
          </div>
          ${badge("risk", item.item_type)}
        </article>
      `).join("") : `
        <article>
          <strong>Keine akuten Eskalationen</strong>
          <span>Kritische Aufgaben und Fristen werden automatisch nach den Regeln bewertet.</span>
        </article>
      `}
    `;
    els.escalationList.querySelectorAll(".escalation-rule-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        try {
          const nextState = await api.updateEscalationRule({
            id: form.dataset.rule,
            threshold_hours: data.get("threshold_hours"),
            target_role: data.get("target_role"),
            is_active: form.elements.is_active.checked
          });
          await refresh(nextState);
          toast("Eskalationsregel gespeichert.");
        } catch {
          toast("Eskalationsregel konnte nicht gespeichert werden.");
        }
      });
    });
  }

  if (els.storagePanel && state.storage) {
    const storage = state.storage;
    els.storagePanel.innerHTML = `
      <article class="storage-status">
        <span>Betriebsmodus</span>
        <strong>${storage.mode}</strong>
      </article>
      <article class="storage-status">
        <span>Datenbank</span>
        <strong>${storage.database}</strong>
      </article>
      <article class="storage-status">
        <span>Dateispeicher</span>
        <strong>${storage.files}</strong>
      </article>
      <article class="storage-status">
        <span>Adapter</span>
        <strong>${storage.file_adapter || "local"}</strong>
      </article>
      <article class="storage-status">
        <span>Verschlüsselung</span>
        <strong>${storage.encryption}</strong>
      </article>
      <div class="storage-paths">
        <span>Datenbank: ${storage.database_path}</span>
        <span>Uploads: ${storage.upload_path}</span>
      </div>
      <div class="source-list">
        ${storage.recommendations.map((item) => `
          <article class="source-card"><strong>Produktionsschritt</strong><span>${item}</span></article>
        `).join("")}
      </div>
    `;
  }

  if (els.systemScorePanel && state.system_check) {
    const check = state.system_check;
    const scoreTone = check.score >= 85 ? "ok" : check.score >= 60 ? "warn" : "risk";
    els.systemScorePanel.innerHTML = `
      <article class="system-score-card ${scoreTone}">
        <span>Reifegrad</span>
        <strong>${check.score}%</strong>
        <small>${escapeHtml(check.readiness)} · zuletzt geprüft ${formatDateTime(check.generated_at)}</small>
      </article>
    `;
  }

  if (els.systemCheckPanel && state.system_check) {
    els.systemCheckPanel.innerHTML = (state.system_check.checks || []).map((item) => `
      <article class="system-check-row ${item.status}">
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.detail)}</span>
          <small>${escapeHtml(item.value || "")}</small>
        </div>
        ${badge(item.status === "ok" ? "ok" : item.status === "risk" ? "risk" : "warn", item.status === "ok" ? "bereit" : item.status === "risk" ? "kritisch" : "prüfen")}
      </article>
    `).join("");
  }

  if (els.compliancePanel && state.compliance) {
    const compliance = state.compliance;
    const backupTone = compliance.backup?.status === "ok" ? "ok" : compliance.backup?.status === "fehler" ? "risk" : "warn";
    els.compliancePanel.innerHTML = `
      <article class="storage-status">
        <span>Backup</span>
        <strong>${compliance.backup?.status || "fehlt"}</strong>
        <small>${escapeHtml(compliance.backup?.backup || compliance.backup?.message || "noch nicht geprüft")}</small>
        ${badge(backupTone, compliance.backup?.status || "fehlt")}
      </article>
      <article class="storage-status">
        <span>Audit-Protokoll</span>
        <strong>${compliance.audit_entries || 0}</strong>
        <small>${compliance.old_audit_entries || 0} Einträge außerhalb der Frist</small>
      </article>
      <article class="storage-status">
        <span>E-Mail-Protokolle</span>
        <strong>${compliance.old_mail_entries || 0}</strong>
        <small>bereinigbare ältere Einträge</small>
      </article>
      <article class="storage-status">
        <span>Zwei-Faktor-Abdeckung</span>
        <strong>${compliance.mfa_rate || 0}%</strong>
        <small>${compliance.mfa_enabled_users || 0}/${compliance.active_users || 0} aktive Benutzer</small>
      </article>
      <article class="storage-status">
        <span>Login-Schutz</span>
        <strong>${escapeHtml(compliance.login_lock || "aktiv")}</strong>
        <small>${compliance.locked_users || 0} aktuell gesperrt</small>
      </article>
      <article class="storage-status">
        <span>Archiv</span>
        <strong>${compliance.archived_documents || 0}</strong>
        <small>Dokumente revisionsnah archiviert</small>
      </article>
    `;
  }

  if (els.complianceForm && state.compliance) {
    els.complianceForm.audit_retention_days.value = state.compliance.audit_retention_days || 1095;
    els.complianceForm.mail_retention_days.value = state.compliance.mail_retention_days || 365;
  }

  const versionHost = document.querySelector("#versionList");
  if (versionHost) {
    versionHost.innerHTML = (state.document_versions || []).slice(0, 8).map((version) => `
      <article>
        <strong>v${version.version_no} · ${version.event}</strong>
        <span>${version.document_name || version.document_id} · ${version.actor || "System"}</span>
      </article>
    `).join("") || `<article><strong>Keine Versionen</strong><span>Änderungen an Dokumenten erscheinen hier.</span></article>`;
  }

  const archiveHost = document.querySelector("#archiveList");
  if (archiveHost) {
    archiveHost.innerHTML = (state.archived_documents || []).slice(0, 6).map((doc) => `
      <article class="archive-row">
        <div>
          <strong>${doc.name}</strong>
          <span>${doc.type} · archiviert durch ${doc.archived_by || "System"}</span>
        </div>
        <button class="secondary-button restore-document-btn" type="button" data-document="${doc.id}" ${hasPermission("document.restore") ? "" : "disabled"}>Wiederherstellen</button>
      </article>
    `).join("") || `<article><strong>Archiv leer</strong><span>Gelöschte Dokumente werden geschützt archiviert.</span></article>`;
    archiveHost.querySelectorAll(".restore-document-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await refresh(await api.restoreDocument(button.dataset.document));
          toast("Dokument wiederhergestellt.");
        } catch {
          toast("Dokument konnte nicht wiederhergestellt werden.");
        }
      });
    });
  }
}

function renderSecurity() {
  if (!els.sessionSecurityInfo || !state.security) return;
  els.sessionSecurityInfo.innerHTML = `
    <article>
      <strong>${state.security.active_sessions}</strong>
      <span>aktive Sitzung(en)</span>
    </article>
    <article>
      <strong>${state.security.session_hours} h</strong>
      <span>Session-Ablauf</span>
    </article>
    <article>
      <strong>${state.security.max_login_attempts}</strong>
      <span>Fehlversuche bis Sperre</span>
    </article>
  `;
}

function renderCitations(doc, query = "") {
  const citations = doc.citations || [];
  if (!citations.length) {
    return `<article class="source-card"><strong>Keine Fundstelle</strong><span>Für dieses Dokument ist noch keine Textstelle gespeichert.</span></article>`;
  }
  return citations.map((citation) => `
    <article class="source-card">
      <strong>Seite ${citation.page || 1}</strong>
      <span>${highlightText(citation.excerpt || "", query)}</span>
    </article>
  `).join("");
}

function renderCitationNav(doc) {
  const citations = doc.citations || [];
  if (!els.dialogCitationNav) return;
  if (!citations.length) {
    els.dialogCitationNav.innerHTML = "";
    return;
  }
  els.dialogCitationNav.innerHTML = citations.map((citation, index) => `
    <button class="secondary-button citation-jump ${index === 0 ? "active" : ""}" type="button" data-page="${citation.page || 1}">
      Seite ${citation.page || 1}
    </button>
  `).join("");
  els.dialogCitationNav.querySelectorAll(".citation-jump").forEach((button) => {
    button.addEventListener("click", () => {
      els.dialogCitationNav.querySelectorAll(".citation-jump").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      if (doc.preview_url && doc.mime === "application/pdf") {
        els.dialogPreview.innerHTML = `<iframe src="${doc.preview_url}#page=${button.dataset.page}" title="Vorschau ${doc.name} Seite ${button.dataset.page}"></iframe>`;
      }
    });
  });
}

function openDocument(documentId, query = activeSearchQuery) {
  const doc = state.documents.find((item) => item.id === documentId);
  if (!doc) return;
  const analysis = parseAnalysis(doc);
  activeDocumentId = doc.id;
  els.dialogTitle.textContent = doc.name;
  els.dialogFields.innerHTML = Object.entries({
    Typ: doc.type,
    Workflow: workflowInfo(doc.status).label,
    Frist: doc.due || "keine",
    Sicherheit: `${doc.confidence || 0}%`,
    "Bauakte-Vorschlag": `${projectName(doc.project_id)}${doc.project_confidence ? ` · ${doc.project_confidence}%` : ""}`,
    Risiko: riskText(doc),
    Aktion: nextDocumentAction(doc),
    "Fristquelle": analysis.due_source || "Regel",
    "Vier-Augen": approvalStatus(doc).fourEyesOk ? "erfüllt" : doc.approved_by ? "offen" : "noch nicht relevant",
    Größe: formatSize(doc.size),
    Speicherung: doc.stored_name ? "Upload-Ordner" : "Demo-Datensatz",
    OCR: `${doc.ocr_engine || "simulation"} · ${doc.ocr_status || "bereit"}`,
    KI: analysis.engine || "simulation"
  }).map(([key, value]) => `
    <article class="field-card">
      <span>${key}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
  els.dialogOcrText.innerHTML = highlightText(doc.ocr_text || "Noch kein OCR-Text gespeichert.", query);
  els.dialogSource.innerHTML = `
    <strong>${escapeHtml(doc.source || "Keine Quelle gespeichert.")}</strong>
    <div class="source-list">${renderCitations(doc, query)}</div>
  `;
  renderCitationNav(doc);
  const statusSelect = els.documentStatusForm.status;
  const statusKnown = Array.from(statusSelect.options).some((option) => option.value === doc.status);
  statusSelect.value = statusKnown ? doc.status : "offen";
  els.documentStatusForm.due.value = doc.due || "";
  els.documentStatusForm.tone.value = doc.tone || "warn";
  renderWorkflowPreview(statusSelect.value);
  if (els.documentApprovalPanel) {
    const approval = approvalStatus(doc);
    els.documentApprovalPanel.innerHTML = `
      <h3>Freigabe und Zahlung</h3>
      <div class="approval-grid">
        <article>
          <span>Prüfung</span>
          <strong>${doc.reviewed_by || "offen"}</strong>
          <small>${doc.reviewed_at ? formatDateTime(doc.reviewed_at) : "noch nicht geprüft"}</small>
        </article>
        <article>
          <span>Freigabe</span>
          <strong>${doc.approved_by || "offen"}</strong>
          <small>${doc.approved_at ? formatDateTime(doc.approved_at) : "noch nicht freigegeben"}</small>
        </article>
        <article>
          <span>Vier-Augen-Prinzip</span>
          <strong>${approval.fourEyesOk ? "erfüllt" : approval.approved ? "offen" : "wartet"}</strong>
          <small>${approval.approved && !approval.fourEyesOk ? "Freigabe sollte durch zweite Person bestätigt werden." : "Prüfung und Freigabe werden getrennt protokolliert."}</small>
        </article>
        <article>
          <span>Zahlung</span>
          <strong>${doc.payment_released_by || "offen"}</strong>
          <small>${doc.payment_released_at ? formatDateTime(doc.payment_released_at) : (doc.type === "Rechnung" ? "Zahlungsfreigabe offen" : "nur für Rechnungen relevant")}</small>
        </article>
      </div>
      <div class="action-row inline">
        <button class="secondary-button approval-action-btn" type="button" data-approval-action="review">Als geprüft markieren</button>
        <button class="secondary-button approval-action-btn" type="button" data-approval-action="approve">Freigeben</button>
        ${doc.type === "Rechnung" ? `<button class="secondary-button approval-action-btn" type="button" data-approval-action="payment">Zur Zahlung freigeben</button>` : ""}
        <button class="secondary-button approval-action-btn" type="button" data-approval-action="complete">Erledigen</button>
      </div>
    `;
    els.documentApprovalPanel.querySelectorAll(".approval-action-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await refresh(await api.runApprovalAction({ id: doc.id, action: button.dataset.approvalAction }));
          toast("Freigabe-Workflow aktualisiert.");
          openDocument(doc.id);
        } catch {
          toast("Freigabe konnte nicht gespeichert werden.");
        }
      });
    });
  }
  els.documentStatusForm.hidden = !hasPermission("document.update");
  els.documentNoteForm.hidden = !hasPermission("document.update");
  els.documentNoteForm.reset();
  els.documentTaskForm.hidden = !hasPermission("document.update");
  els.documentTaskForm.reset();
  if (els.documentTaskAssignee) {
    els.documentTaskAssignee.innerHTML = (state.team || []).map((member) => `
      <option value="${member.id}">${member.name} · ${member.role}</option>
    `).join("");
  }
  const suggestedTask = applyTaskSuggestionToForm(doc);
  const hasOpenTask = openDocumentTasks(doc.id).length > 0;
  if (els.documentTaskSuggestion && suggestedTask) {
    els.documentTaskSuggestion.innerHTML = `
      <strong>KI-Aufgabenvorschlag</strong>
      <span>${suggestedTask.action} · ${suggestedTask.assignee?.name || "nicht zugewiesen"} (${suggestedTask.role}) · ${suggestedTask.priority}${suggestedTask.due ? ` · bis ${suggestedTask.due}` : ""}</span>
      <small>${escapeHtml(suggestedTask.note)}</small>
    `;
  }
  if (els.createSuggestedTaskBtn) {
    els.createSuggestedTaskBtn.disabled = !suggestedTask?.assignee || hasOpenTask;
    els.createSuggestedTaskBtn.textContent = hasOpenTask ? "Aufgabe existiert bereits" : "KI-Vorschlag übernehmen";
  }
  renderDocumentTasks(doc.id);
  const history = documentHistory(doc.id);
  if (els.documentHistory) {
    els.documentHistory.innerHTML = `
      <h3>Freigabehistorie</h3>
      <div class="history-list">
        ${history.length ? history.slice(0, 8).map((entry) => `
          <article class="history-item">
            <strong>${entry.title}</strong>
            <span>${entry.text}</span>
            <small>${entry.actor || "System"} · ${entry.created_at ? formatDateTime(entry.created_at) : "ohne Zeit"}</small>
          </article>
        `).join("") : `
          <article class="history-item">
            <strong>Noch keine Historie</strong>
            <span>Prüfnotizen, Freigaben und Statusänderungen erscheinen hier.</span>
          </article>
        `}
      </div>
    `;
  }
  els.reprocessBtn.hidden = !hasPermission("document.update");
  els.archiveBtn.hidden = !hasPermission("document.archive");
  if (doc.preview_url && doc.mime?.startsWith("image/")) {
    els.dialogPreview.innerHTML = `<img src="${doc.preview_url}" alt="Vorschau ${doc.name}">`;
  } else if (doc.preview_url && doc.mime === "application/pdf") {
    const firstPage = doc.citations?.[0]?.page || 1;
    els.dialogPreview.innerHTML = `<iframe src="${doc.preview_url}#page=${firstPage}" title="Vorschau ${doc.name}"></iframe>`;
  } else if (doc.preview_url) {
    els.dialogPreview.innerHTML = `<a class="primary-button" href="${doc.preview_url}" target="_blank" rel="noreferrer">Datei öffnen</a>`;
  } else {
    els.dialogPreview.innerHTML = `<div class="empty-preview">Für Demo-Datensätze ist keine Datei hinterlegt.</div>`;
  }
  els.documentDialog.showModal();
}

function renderAll() {
  renderProjectList();
  renderProjectDashboard();
  renderDocuments();
  renderInbox();
  renderInvoices();
  renderUploadControls();
  renderUploadStatus();
  renderTasks();
  renderAssignedTasks();
  renderDeadlines();
  renderChat();
  renderStats();
  renderTenant();
  renderOnboarding();
  renderAdmin();
  renderSecurity();
  renderNotifications();
}

async function nextAnalysis() {
  analysisIndex = (analysisIndex + 1) % demoAnalyses.length;
  const payload = await api.analyze(demoAnalyses[analysisIndex]);
  renderAnalysis(payload);
}

function runGlobalSearch() {
  const value = els.globalSearch.value.trim();
  activeSearchQuery = value;
  if (!value) {
    els.globalSearch.placeholder = "Beispiel: Abnahme, Lindenweg, Rechnung";
    els.searchResults.hidden = true;
    return;
  }
  api.search(value).then((payload) => {
    els.searchResults.hidden = false;
    els.searchResults.innerHTML = `
      <div class="panel-head">
        <div>
          <p class="eyebrow">Backend-Suche</p>
          <h2>${payload.results.length} Treffer für "${payload.query}"</h2>
        </div>
        <button class="secondary-button" id="closeSearchBtn" type="button">Schließen</button>
      </div>
      <div class="search-result-list">
        ${payload.results.map((doc) => `
          <button class="search-result" type="button" data-document="${doc.id}">
            <strong>${doc.name}</strong>
            <span>${doc.type} · ${doc.status} · ${doc.snippet || doc.source || "ohne Quelle"}</span>
            <small>${(doc.citations || []).map((citation) => `Seite ${citation.page}: ${citation.excerpt}`).join(" · ")}</small>
          </button>
        `).join("") || "<p class=\"auth-hint\">Keine passenden Dokumente gefunden.</p>"}
      </div>
    `;
    els.searchResults.querySelector("#closeSearchBtn").addEventListener("click", () => {
      els.searchResults.hidden = true;
    });
    els.searchResults.querySelectorAll(".search-result").forEach((button) => {
      button.addEventListener("click", () => openDocument(button.dataset.document, value));
    });
  }).catch(() => toast("Suche nicht möglich. Bitte Anmeldung prüfen."));
}

els.navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
els.sidebarToggle?.addEventListener("click", () => {
  const collapsed = !document.querySelector(".app-shell").classList.contains("sidebar-collapsed");
  setSidebarCollapsed(collapsed);
});
els.notificationBtn?.addEventListener("click", () => {
  renderNotifications();
  els.notificationPopover.hidden = !els.notificationPopover.hidden;
});
els.closeNotificationsBtn?.addEventListener("click", () => {
  els.notificationPopover.hidden = true;
});
els.clearNotificationsBtn?.addEventListener("click", () => {
  const keys = buildNotificationPool().map((notice) => notice.key);
  keys.forEach((key) => dismissedNotifications.add(key));
  saveDismissedNotifications();
  renderNotifications();
  api.markNotificationsRead(keys).then((nextState) => {
    state = nextState;
    renderNotifications();
  }).catch(() => toast("Hinweise nur lokal ausgeblendet."));
});
els.notificationFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    notificationFilter = button.dataset.notificationFilter || "all";
    renderNotifications();
  });
});
els.notifyTaskReminderBtn?.addEventListener("click", async () => {
  try {
    setSaveState("Aufgaben-Erinnerung wird vorbereitet", true);
    const nextState = await api.sendTaskReminders();
    await refresh(nextState);
    renderNotifications();
    toast(`${nextState.task_reminders || 0} Aufgaben-Erinnerungen in den E-Mail-Ausgang gelegt.`);
  } catch {
    toast("Aufgaben-Erinnerung konnte nicht erstellt werden.");
  }
});
els.notifyDeadlineReminderBtn?.addEventListener("click", async () => {
  try {
    setSaveState("Frist-Erinnerung wird vorbereitet", true);
    const nextState = await api.sendDeadlineReminders();
    await refresh(nextState);
    renderNotifications();
    toast(`${nextState.reminders || 0} Frist-Erinnerungen in den E-Mail-Ausgang gelegt.`);
  } catch {
    toast("Frist-Erinnerung konnte nicht erstellt werden.");
  }
});
document.addEventListener("click", (event) => {
  if (!els.notificationPopover || els.notificationPopover.hidden) return;
  if (!event.target.closest(".notification-center")) {
    els.notificationPopover.hidden = true;
  }
});
els.documentStatusForm?.status?.addEventListener("change", () => {
  renderWorkflowPreview(els.documentStatusForm.status.value);
});
els.taskFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    taskFilter = button.dataset.filter;
    els.taskFilterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderAssignedTasks();
  });
});
els.documentFilterSearch?.addEventListener("input", (event) => {
  documentFilterQuery = event.target.value;
  renderDocuments();
});
els.documentTypeFilter?.addEventListener("change", (event) => {
  documentTypeFilter = event.target.value;
  renderDocuments();
});
els.documentRiskFilter?.addEventListener("change", (event) => {
  documentRiskFilter = event.target.value;
  renderDocuments();
});
els.documentStatusFilter?.addEventListener("change", (event) => {
  documentStatusFilter = event.target.value;
  renderDocuments();
});
els.clearDocumentFiltersBtn?.addEventListener("click", () => {
  documentFilterQuery = "";
  documentTypeFilter = "all";
  documentRiskFilter = "all";
  documentStatusFilter = "all";
  renderDocuments();
});
els.inboxSearch?.addEventListener("input", (event) => {
  inboxQuery = event.target.value;
  renderInboxCenter();
});
els.inboxTypeFilter?.addEventListener("change", (event) => {
  inboxTypeFilter = event.target.value;
  renderInboxCenter();
});
els.clearInboxFiltersBtn?.addEventListener("click", () => {
  inboxQuery = "";
  inboxTypeFilter = "all";
  selectedInboxDocuments.clear();
  renderInboxCenter();
});
els.approveSelectedInboxBtn?.addEventListener("click", async () => {
  if (!selectedInboxDocuments.size) return;
  try {
    const ids = [...selectedInboxDocuments];
    let nextState = null;
    for (const id of ids) {
      const doc = (nextState?.documents || state.documents).find((item) => item.id === id);
      if (!doc) continue;
      nextState = await api.updateDocumentStatus({ id, status: "geprüft", tone: "ok", due: doc.due || "keine" });
    }
    selectedInboxDocuments.clear();
    await refresh(nextState);
    toast(`${ids.length} Dokument(e) freigegeben.`);
  } catch {
    toast("Auswahl konnte nicht freigegeben werden.");
  }
});
els.applyInboxBatchBtn?.addEventListener("click", async () => {
  if (!selectedInboxDocuments.size) return;
  try {
    const ids = [...selectedInboxDocuments];
    const action = els.batchActionSelect?.value || "";
    const due = els.batchDueInput?.value || "";
    const projectId = els.batchProjectSelect?.value || "";
    const assigneeId = els.batchAssigneeSelect?.value || "";
    const nextState = await api.batchUpdateDocuments({
      ids,
      project_id: projectId,
      due,
      status: "geprüft",
      tone: "ok",
      task_action: action,
      assignee_id: assigneeId,
      priority: action === "Klären" ? "hoch" : "normal"
    });
    selectedInboxDocuments.clear();
    await refresh(nextState);
    toast(`${ids.length} Dokument(e) im Stapel verarbeitet.`);
  } catch {
    toast("Stapelverarbeitung konnte nicht ausgeführt werden.");
  }
});
els.invoiceSearch?.addEventListener("input", (event) => {
  invoiceQuery = event.target.value;
  renderInvoices();
});
els.invoiceStatusFilter?.addEventListener("change", (event) => {
  invoiceStatusFilter = event.target.value;
  renderInvoices();
});
els.invoiceProjectFilter?.addEventListener("change", (event) => {
  invoiceProjectFilter = event.target.value;
  renderInvoices();
});
els.exportInvoicesBtn?.addEventListener("click", exportInvoicesCsv);
els.exportDatevInvoicesBtn?.addEventListener("click", exportDatevInvoicesCsv);
els.exportPaymentRunBtn?.addEventListener("click", exportPaymentRunCsv);
els.invoiceRuleForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(els.invoiceRuleForm);
  try {
    await refresh(await api.saveInvoiceRule({
      id: data.get("id"),
      keyword: data.get("keyword"),
      booking_account: data.get("booking_account"),
      tax_rate: data.get("tax_rate"),
      label: data.get("label"),
      is_active: data.get("is_active") === "on"
    }));
    resetInvoiceRuleForm();
    toast("Buchungsregel gespeichert.");
  } catch {
    toast("Buchungsregel konnte nicht gespeichert werden.");
  }
});
els.resetInvoiceRuleFormBtn?.addEventListener("click", resetInvoiceRuleForm);
els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(els.loginForm);
  els.loginHint.textContent = "Anmeldung läuft ...";
  try {
    if (pendingMfaChallenge) {
      await api.verifyMfa({ challenge_id: pendingMfaChallenge, code: data.get("mfa_code") });
      pendingMfaChallenge = null;
      els.mfaCodeField.hidden = true;
      els.loginForm.mfa_code.value = "";
      els.loginHint.textContent = "Angemeldet.";
      await refresh();
      return;
    }
    const result = await api.login({ email: data.get("email"), password: data.get("password") });
    if (result.requires_mfa) {
      pendingMfaChallenge = result.challenge_id;
      els.mfaCodeField.hidden = false;
      els.loginForm.mfa_code.focus();
      els.loginHint.textContent = `Zwei-Faktor-Code eingeben. Demo-Code: ${result.demo_code}`;
      return;
    }
    els.loginHint.textContent = "Angemeldet.";
    await refresh();
  } catch {
    els.loginHint.textContent = pendingMfaChallenge ? "Zwei-Faktor-Code ungültig." : "Login fehlgeschlagen. Bitte Daten prüfen.";
  }
});
els.logoutBtn.addEventListener("click", async () => {
  await api.logout();
  showLogin(true);
});
els.logoutAllBtn?.addEventListener("click", async () => {
  try {
    await api.logoutAll();
    els.passwordDialog.close();
    showLogin(true);
    toast("Alle Geräte wurden abgemeldet.");
  } catch {
    toast("Sitzungen konnten nicht abgemeldet werden.");
  }
});
els.passwordBtn?.addEventListener("click", () => {
  renderSecurity();
  els.passwordHint.textContent = "Mindestens 12 Zeichen mit Großbuchstaben, Kleinbuchstaben, Zahl und Sonderzeichen.";
  els.passwordForm.reset();
  els.passwordDialog.showModal();
});
els.closePasswordDialogBtn?.addEventListener("click", () => els.passwordDialog.close());
els.passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(els.passwordForm);
  try {
    await api.changePassword({
      current_password: data.get("current_password"),
      new_password: data.get("new_password"),
      confirm_password: data.get("confirm_password")
    });
    els.passwordDialog.close();
    els.passwordForm.reset();
    toast("Passwort geändert.");
  } catch (error) {
    els.passwordHint.textContent = error.message || "Passwort konnte nicht geändert werden.";
  }
});
els.newDocBtn.addEventListener("click", () => switchView("inbox"));
els.analyzeBtn.addEventListener("click", nextAnalysis);
els.dropzone.addEventListener("click", () => els.fileInput.click());
els.dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    els.fileInput.click();
  }
});
["dragenter", "dragover"].forEach((eventName) => {
  els.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (!hasPermission("document.upload")) return;
    els.dropzone.classList.add("drag-over");
  });
});
["dragleave", "drop"].forEach((eventName) => {
  els.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropzone.classList.remove("drag-over");
  });
});
els.dropzone.addEventListener("drop", async (event) => {
  const files = event.dataTransfer?.files;
  if (!files?.length) return;
  await uploadSelectedFiles(files);
});
els.fileInput.addEventListener("change", async () => {
  if (!els.fileInput.files.length) return;
  await uploadSelectedFiles(els.fileInput.files);
  els.fileInput.value = "";
});
els.acceptSuggestion.addEventListener("click", () => {
  els.analysisBox.querySelector(".result-label").textContent = "freigegeben";
});
els.rejectSuggestion.addEventListener("click", () => {
  els.analysisBox.querySelector(".result-label").textContent = "Korrektur offen";
});
els.globalSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runGlobalSearch();
});
els.askBtn.addEventListener("click", async () => {
  const question = els.askInput.value.trim();
  if (!question) return;
  setSaveState("KI fragt", true);
  els.askInput.value = "";
  await refresh(await api.ask(question));
  toast("KI-Antwort gespeichert.");
});
els.askInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.askBtn.click();
});
els.exportBtn.addEventListener("click", () => {
  window.location.href = "/api/export";
  els.exportBtn.textContent = "Export erstellt";
});
els.resetDemoBtn.addEventListener("click", () => {
  alert("Die Profiversion bekommt hier einen mandantenfähigen Admin-Reset. Lokal bleibt die Datenbank bewusst erhalten.");
});
els.weekFilter.addEventListener("click", () => {
  els.weekFilter.classList.toggle("active");
  renderDeadlines();
});
els.deadlineReminderBtn?.addEventListener("click", async () => {
  try {
    const nextState = await api.sendDeadlineReminders();
    await refresh(nextState);
    toast(`${nextState.reminders || 0} Frist-Erinnerungen in den E-Mail-Ausgang gelegt.`);
  } catch {
    toast("Frist-Erinnerung konnte nicht erstellt werden.");
  }
});
els.taskReminderBtn?.addEventListener("click", async () => {
  try {
    const nextState = await api.sendTaskReminders();
    await refresh(nextState);
    toast(`${nextState.task_reminders || 0} Aufgaben-Erinnerungen in den E-Mail-Ausgang gelegt.`);
  } catch {
    toast("Aufgaben-Erinnerung konnte nicht erstellt werden.");
  }
});
els.closeDialogBtn.addEventListener("click", () => els.documentDialog.close());
els.documentStatusForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeDocumentId) return;
  const data = new FormData(els.documentStatusForm);
  try {
    await refresh(await api.updateDocumentStatus({
      id: activeDocumentId,
      status: data.get("status"),
      due: data.get("due"),
      tone: data.get("tone")
    }));
    toast("Dokumentstatus gespeichert.");
    els.documentDialog.close();
  } catch {
    toast("Status konnte nicht gespeichert werden.");
  }
});
els.documentNoteForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeDocumentId) return;
  const data = new FormData(els.documentNoteForm);
  try {
    await refresh(await api.addDocumentNote({
      id: activeDocumentId,
      kind: data.get("kind"),
      body: data.get("body")
    }));
    toast("Prüfnotiz gespeichert.");
    openDocument(activeDocumentId);
  } catch {
    toast("Prüfnotiz konnte nicht gespeichert werden.");
  }
});
els.documentTaskForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeDocumentId) return;
  const data = new FormData(els.documentTaskForm);
  try {
    await refresh(await api.addDocumentTask({
      id: activeDocumentId,
      assignee_id: data.get("assignee_id"),
      action: data.get("action"),
      priority: data.get("priority"),
      due: data.get("due"),
      note: data.get("note")
    }));
    toast("Aufgabe zugewiesen.");
    openDocument(activeDocumentId);
  } catch {
    toast("Aufgabe konnte nicht angelegt werden.");
  }
});
els.createSuggestedTaskBtn?.addEventListener("click", async () => {
  if (!activeDocumentId) return;
  const doc = state.documents.find((item) => item.id === activeDocumentId);
  if (!doc) return;
  const suggestion = applyTaskSuggestionToForm(doc);
  if (!suggestion?.assignee) {
    toast("Kein passender Benutzer für den KI-Vorschlag vorhanden.");
    return;
  }
  try {
    await refresh(await api.addDocumentTask({
      id: activeDocumentId,
      assignee_id: suggestion.assignee.id,
      action: suggestion.action,
      priority: suggestion.priority,
      due: suggestion.due,
      note: suggestion.note
    }));
    toast("KI-Aufgabenvorschlag übernommen.");
    openDocument(activeDocumentId);
  } catch {
    toast("KI-Aufgabenvorschlag konnte nicht übernommen werden.");
  }
});
els.reprocessBtn.addEventListener("click", async () => {
  if (!activeDocumentId) return;
  try {
    await refresh(await api.reprocessDocument(activeDocumentId));
    toast("OCR/Analyse neu ausgeführt.");
    openDocument(activeDocumentId);
  } catch {
    toast("OCR konnte nicht neu ausgeführt werden.");
  }
});
els.archiveBtn.addEventListener("click", async () => {
  if (!activeDocumentId) return;
  const doc = state.documents.find((item) => item.id === activeDocumentId);
  if (!doc) return;
  try {
    await refresh(await api.archiveDocument(activeDocumentId));
    els.documentDialog.close();
    toast(`Archiviert: ${doc.name}`);
  } catch {
    toast("Dokument konnte nicht archiviert werden.");
  }
});
els.backupBtn.addEventListener("click", async () => {
  try {
    const result = await api.backup();
    const verification = result.verification || await api.verifyBackup();
    toast(`Backup erstellt und geprüft: ${verification.status}`);
    await refresh();
  } catch {
    toast("Backup konnte nicht erstellt werden.");
  }
});
els.verifyBackupBtn?.addEventListener("click", async () => {
  try {
    const verification = await api.verifyBackup();
    await refresh();
    toast(`Backup-Prüfung: ${verification.status}`);
  } catch {
    toast("Backup konnte nicht geprüft werden.");
  }
});
els.runSystemCheckBtn?.addEventListener("click", async () => {
  try {
    const result = await api.runSystemCheck();
    state.system_check = result;
    render();
    toast(`Systemcheck: ${result.score}% · ${result.readiness}`);
  } catch {
    toast("Systemcheck konnte nicht ausgeführt werden.");
  }
});
els.repairChecksumsBtn?.addEventListener("click", async () => {
  try {
    const nextState = await api.repairChecksums();
    await refresh(nextState);
    const result = nextState.checksum_repair || {};
    toast(`Prüfwerte ergänzt: ${result.repaired || 0}, fehlende Dateien: ${result.missing || 0}`);
  } catch {
    toast("Datei-Prüfwerte konnten nicht ergänzt werden.");
  }
});
els.enforceAdminMfaBtn?.addEventListener("click", async () => {
  try {
    await refresh(await api.updateSecurityPolicy({ admin_mfa_required: true }));
    toast("Admin-2FA ist verpflichtend aktiv.");
  } catch {
    toast("Admin-2FA konnte nicht aktiviert werden.");
  }
});
els.complianceForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(els.complianceForm);
  try {
    await refresh(await api.updateComplianceSettings({
      audit_retention_days: data.get("audit_retention_days"),
      mail_retention_days: data.get("mail_retention_days")
    }));
    toast("Aufbewahrungsfristen gespeichert.");
  } catch {
    toast("Aufbewahrungsfristen konnten nicht gespeichert werden.");
  }
});
els.cleanupComplianceBtn?.addEventListener("click", async () => {
  try {
    const nextState = await api.runComplianceCleanup();
    await refresh(nextState);
    const result = nextState.cleanup_result || {};
    toast(`Bereinigung abgeschlossen: ${result.audit || 0} Audit, ${result.mail || 0} E-Mail.`);
  } catch {
    toast("Bereinigung konnte nicht ausgeführt werden.");
  }
});
els.sendOutboxBtn?.addEventListener("click", async () => {
  try {
    const nextState = await api.sendOutbox();
    await refresh(nextState);
    const result = nextState.mail_result || {};
    if (result.sent) {
      toast(`${result.sent} E-Mail(s) gesendet.`);
    } else if (result.failed) {
      toast(`${result.failed} E-Mail(s) mit Fehler. SMTP prüfen.`);
    } else {
      toast("Outbox geprüft. Echter Versand ist noch nicht konfiguriert.");
    }
  } catch {
    toast("E-Mail-Ausgang konnte nicht gesendet werden.");
  }
});
els.mailSettingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(els.mailSettingsForm);
  try {
    await refresh(await api.updateMailSettings({
      driver: data.get("driver"),
      from_address: data.get("from_address"),
      host: data.get("host"),
      port: data.get("port"),
      username: data.get("username"),
      password: data.get("password"),
      tls: els.mailSettingsForm.tls.checked
    }));
    toast("Mail-Konfiguration gespeichert.");
  } catch {
    toast("Mail-Konfiguration konnte nicht gespeichert werden.");
  }
});
els.mailTestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(els.mailTestForm);
  try {
    const nextState = await api.sendTestMail(data.get("recipient"));
    await refresh(nextState);
    const result = nextState.mail_result || {};
    if (result.sent) {
      toast("Testmail gesendet.");
    } else if (result.failed) {
      toast("Testmail fehlgeschlagen. SMTP-Einstellungen prüfen.");
    } else {
      toast("Testmail im lokalen Outbox-Modus gespeichert.");
    }
  } catch {
    toast("Testmail konnte nicht erstellt werden.");
  }
});
els.demoEmailImportBtn?.addEventListener("click", async () => {
  try {
    await refresh(await api.createDemoInboundEmail());
    toast("Demo-E-Mail in den Eingang gelegt.");
  } catch {
    toast("Demo-E-Mail konnte nicht erstellt werden.");
  }
});
els.deliveryLogSearch?.addEventListener("input", (event) => {
  deliveryLogQuery = event.target.value;
  render();
});
els.deliveryLogStatus?.addEventListener("change", (event) => {
  deliveryLogStatus = event.target.value;
  render();
});
els.exportDeliveryLogBtn?.addEventListener("click", () => {
  const rows = filteredDeliveryLog();
  if (!rows.length) {
    toast("Kein Protokolleintrag für den Export vorhanden.");
    return;
  }
  exportDeliveryLogCsv();
  toast(`${rows.length} Protokolleintrag(e) exportiert.`);
});
els.runEscalationsBtn?.addEventListener("click", async () => {
  try {
    setSaveState("Eskalationen werden geprüft", true);
    const nextState = await api.runEscalations();
    await refresh(nextState);
    toast(`${nextState.escalations_queued || 0} Eskalationen in den E-Mail-Ausgang gelegt.`);
  } catch {
    toast("Eskalationen konnten nicht ausgelöst werden.");
  }
});
els.userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(els.userForm);
  try {
    const nextState = await api.createUser({
      name: data.get("name"),
      email: data.get("email"),
      role: data.get("role"),
      password: data.get("password")
    });
    await refresh(nextState);
    els.userForm.reset();
    toast(`Benutzer angelegt. Startpasswort: ${nextState.initial_password}`);
  } catch {
    toast("Benutzer konnte nicht angelegt werden.");
  }
});
els.tenantForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(els.tenantForm);
  try {
    await refresh(await api.updateTenant({
      name: data.get("name"),
      plan: data.get("plan"),
      company_email: data.get("company_email"),
      phone: data.get("phone"),
      billing_address: data.get("billing_address"),
      license_status: data.get("license_status"),
      seat_limit: data.get("seat_limit"),
      data_region: data.get("data_region"),
      escalation_interval_minutes: data.get("escalation_interval_minutes")
    }));
    toast("Mandant gespeichert.");
  } catch {
    toast("Mandant konnte nicht gespeichert werden.");
  }
});
els.projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(els.projectForm);
  setSaveState("Speichert", true);
  const nextState = await api.createProject({
    name: data.get("name"),
    customer: data.get("customer"),
    address: data.get("address")
  });
  activeProjectId = nextState.projects[nextState.projects.length - 1]?.id || activeProjectId;
  els.projectForm.reset();
  await refresh(nextState);
  toast("Bauakte angelegt.");
});
els.deadlineForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(els.deadlineForm);
  setSaveState("Speichert", true);
  await refresh(await api.createDeadline({
    project_id: activeProjectId,
    date_label: data.get("date"),
    title: data.get("title"),
    detail: data.get("detail"),
    tone: "warn"
  }));
  els.deadlineForm.reset();
  toast("Frist angelegt.");
});

api.session().then((session) => {
  setSidebarCollapsed(localStorage.getItem("bauakte_sidebar_collapsed") === "1");
  if (!session.authenticated) {
    showLogin(true);
    return;
  }
  refresh().then(() => nextAnalysis());
});

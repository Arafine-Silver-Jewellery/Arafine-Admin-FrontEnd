import { useEffect, useState, useRef } from "react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import "../styles/settings.css";
import "../styles/storage-explorer.css";

type StorageType = "s3" | "r2" | "gcs" | "azure" | "minio";

interface StorageProvider {
  id: string;
  name: string;
  type: StorageType;
  bucket: string;
  region: string | null;
  endpoint: string | null;
  accessKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FileItem {
  name: string;
  key: string;
  type: "file" | "folder";
  size: number;
  lastModified: string | null;
  url?: string;
  contentType?: string;
}

interface ClipboardItem {
  items: FileItem[];
  action: "copy" | "cut";
}

const storageTypes: { value: StorageType; label: string }[] = [
  { value: "s3", label: "Amazon S3" },
  { value: "r2", label: "Cloudflare R2" },
  { value: "gcs", label: "Google Cloud Storage" },
  { value: "azure", label: "Azure Blob Storage" },
  { value: "minio", label: "MinIO" },
];

export default function StorageProviders() {
  const toast = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"providers" | "explorer">("providers");
  
  // Providers state
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<StorageProvider | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "s3" as StorageType,
    bucket: "",
    region: "",
    endpoint: "",
    accessKey: "",
    secretKey: "",
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Explorer state
  const [hasActiveStorage, setHasActiveStorage] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState<FileItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [explorerSearch, setExplorerSearch] = useState("");
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [bulkOperationLoading, setBulkOperationLoading] = useState<string | null>(null); // "deleting" | "copying" | "moving" | "pasting" | null
  
  // Explorer modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item?: FileItem } | null>(null);
  
  // Explorer form state
  const [newFolderName, setNewFolderName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  
  // Upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, "pending" | "uploading" | "success" | "error">>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load providers
  async function loadProviders() {
    setLoading(true);
    try {
      const res = await api.getStorageProviders();
      const providerList = res.data || [];
      setProviders(providerList);
      setHasActiveStorage(providerList.some((p: StorageProvider) => p.isActive));
    } catch (error) {
      console.error("Failed to load storage providers:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  // Load explorer when tab changes to explorer and has active storage
  useEffect(() => {
    if (activeTab === "explorer" && hasActiveStorage) {
      loadFolder();
    }
  }, [activeTab, hasActiveStorage, currentPath]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Keyboard shortcuts for explorer (Ctrl+A to select all)
  useEffect(() => {
    if (activeTab !== "explorer" || !hasActiveStorage) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A or Cmd+A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        // Don't trigger if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        // Select all items currently in view
        const searchTerm = explorerSearch.toLowerCase();
        const itemsToSelect = searchTerm 
          ? items.filter(i => i.name.toLowerCase().includes(searchTerm))
          : items;
        setSelectedItems(new Set(itemsToSelect.map(i => i.key)));
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, hasActiveStorage, items, explorerSearch]);

  // ============================================
  // PROVIDER FUNCTIONS
  // ============================================

  function openModal(provider?: StorageProvider) {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name,
        type: provider.type,
        bucket: provider.bucket,
        region: provider.region || "",
        endpoint: provider.endpoint || "",
        accessKey: provider.accessKey,
        secretKey: "",
      });
    } else {
      setEditingProvider(null);
      setFormData({
        name: "",
        type: "s3",
        bucket: "",
        region: "",
        endpoint: "",
        accessKey: "",
        secretKey: "",
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProvider(null);
    setTestResult(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "type" && value === "s3") {
        updated.endpoint = "";
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data: any = {
      name: formData.name,
      type: formData.type,
      bucket: formData.bucket,
      accessKey: formData.accessKey,
    };

    if (formData.region) data.region = formData.region;
    if (formData.endpoint) data.endpoint = formData.endpoint;
    if (formData.secretKey) data.secretKey = formData.secretKey;

    try {
      if (editingProvider) {
        await api.updateStorageProvider(editingProvider.id, data);
      } else {
        data.secretKey = formData.secretKey;
        await api.createStorageProvider(data);
      }
      closeModal();
      loadProviders();
    } catch (error: any) {
      console.error("Failed to save storage provider:", error);
      toast.error(error.message || "Failed to save storage provider");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.deleteStorageProvider(id);
      loadProviders();
    } catch (error: any) {
      console.error("Failed to delete storage provider:", error);
      toast.error(error.message || "Failed to delete storage provider");
    }
  }

  async function handleActivate(id: string) {
    try {
      await api.activateStorageProvider(id);
      loadProviders();
    } catch (error: any) {
      console.error("Failed to activate storage provider:", error);
      toast.error(error.message || "Failed to activate storage provider");
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await api.deactivateStorageProvider(id);
      loadProviders();
    } catch (error: any) {
      console.error("Failed to deactivate storage provider:", error);
      toast.error(error.message || "Failed to deactivate storage provider");
    }
  }

  async function handleTestConnection(providerId?: string) {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testStorageConnection(providerId);
      setTestResult({ success: res.success, message: res.message });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || "Connection test failed" });
    } finally {
      setTesting(false);
    }
  }

  function getTypeLabel(type: StorageType) {
    return storageTypes.find(t => t.value === type)?.label || type;
  }

  const filteredProviders = providers.filter(provider => {
    const search = searchTerm.toLowerCase();
    return (
      provider.name.toLowerCase().includes(search) ||
      provider.type.toLowerCase().includes(search) ||
      provider.bucket.toLowerCase().includes(search)
    );
  });

  // ============================================
  // EXPLORER FUNCTIONS
  // ============================================

  async function loadFolder() {
    setExplorerLoading(true);
    try {
      const res = await api.explorerListFolder(currentPath);
      setItems(res.data?.items || []);
      setSelectedItems(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to load folder");
    } finally {
      setExplorerLoading(false);
    }
  }

  function navigateTo(path: string) {
    setCurrentPath(path);
    setExplorerSearch("");
  }

  function openFolder(item: FileItem) {
    if (item.type === "folder") {
      navigateTo(item.key);
    }
  }

  function getBreadcrumbs() {
    const parts = currentPath.split("/").filter(Boolean);
    const breadcrumbs: { name: string; path: string }[] = [{ name: "/", path: "" }];
    let pathSoFar = "";
    for (const part of parts) {
      pathSoFar += part + "/";
      breadcrumbs.push({ name: part, path: pathSoFar });
    }
    return breadcrumbs;
  }

  function toggleSelect(item: FileItem, e?: React.MouseEvent) {
    e?.stopPropagation();
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.key)) {
      newSelected.delete(item.key);
    } else {
      newSelected.add(item.key);
    }
    setSelectedItems(newSelected);
  }

  function handleSelectAll() {
    const allKeys = new Set(filteredItems.map(i => i.key));
    setSelectedItems(allKeys);
  }

  function handleDeselectAll() {
    setSelectedItems(new Set());
  }

  function isAllSelected() {
    return filteredItems.length > 0 && selectedItems.size === filteredItems.length;
  }

  function getSelectedFiles(): FileItem[] {
    return items.filter(i => selectedItems.has(i.key));
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const folderPath = currentPath + newFolderName.trim();
      await api.explorerCreateFolder(folderPath);
      toast.success("Folder created");
      setShowNewFolderModal(false);
      setNewFolderName("");
      loadFolder();
    } catch (error: any) {
      toast.error(error.message || "Failed to create folder");
    }
  }

  function startRename(item: FileItem) {
    setRenameItem(item);
    setRenameValue(item.name);
    setShowRenameModal(true);
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameItem || !renameValue.trim()) return;

    try {
      await api.explorerRename(renameItem.key, renameValue.trim(), renameItem.type === "folder");
      toast.success("Renamed successfully");
      setShowRenameModal(false);
      setRenameItem(null);
      loadFolder();
    } catch (error: any) {
      toast.error(error.message || "Failed to rename");
    }
  }

  function handleCopy() {
    const selected = getSelectedFiles();
    if (selected.length === 0) return;
    setClipboard({ items: selected, action: "copy" });
    toast.success(`${selected.length} item(s) copied`);
  }

  function handleCut() {
    const selected = getSelectedFiles();
    if (selected.length === 0) return;
    setClipboard({ items: selected, action: "cut" });
    toast.success(`${selected.length} item(s) cut`);
  }

  async function handlePaste() {
    if (!clipboard) return;

    const action = clipboard.action === "copy" ? "Copying" : "Moving";
    setBulkOperationLoading(`${action} ${clipboard.items.length} item(s)...`);

    try {
      for (const item of clipboard.items) {
        const destKey = currentPath + item.name + (item.type === "folder" ? "/" : "");
        
        if (clipboard.action === "copy") {
          await api.explorerCopy(item.key, destKey, item.type === "folder");
        } else {
          await api.explorerMove(item.key, destKey, item.type === "folder");
        }
      }
      
      toast.success(`${clipboard.items.length} item(s) ${clipboard.action === "copy" ? "copied" : "moved"}`);
      if (clipboard.action === "cut") {
        setClipboard(null);
      }
      loadFolder();
    } catch (error: any) {
      toast.error(error.message || "Paste failed");
    } finally {
      setBulkOperationLoading(null);
    }
  }

  async function handleDeleteFiles() {
    const selected = getSelectedFiles();
    if (selected.length === 0) return;

    const isInTrash = currentPath.startsWith("trash");
    setBulkOperationLoading(isInTrash ? "Permanently deleting..." : "Moving to trash...");
    setShowDeleteConfirm(false);

    try {
      const result = await api.explorerBulkDelete(selected.map(i => ({ key: i.key, isFolder: i.type === "folder" })));
      // Show appropriate message based on whether items were moved to trash or permanently deleted
      if (isInTrash) {
        toast.success(`${selected.length} item(s) permanently deleted`);
      } else {
        toast.success(`${selected.length} item(s) moved to trash`);
      }
      setSelectedItems(new Set());
      loadFolder();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    } finally {
      setBulkOperationLoading(null);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadFiles(files);
      setUploadProgress({});
      setUploadStatus(Object.fromEntries(files.map(f => [f.name, "pending" as const])));
      setShowUploadModal(true);
    }
  }

  async function handleUpload() {
    let hasErrors = false;
    
    for (const file of uploadFiles) {
      setUploadStatus(prev => ({ ...prev, [file.name]: "uploading" }));
      try {
        await api.explorerUpload(file, currentPath);
        setUploadStatus(prev => ({ ...prev, [file.name]: "success" }));
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      } catch (error) {
        setUploadStatus(prev => ({ ...prev, [file.name]: "error" }));
        hasErrors = true;
      }
    }
    
    loadFolder();
    
    // Auto-close modal after a short delay if all uploads succeeded
    if (!hasErrors) {
      toast.success(`${uploadFiles.length} file(s) uploaded successfully`);
      setTimeout(() => {
        closeUploadModal();
      }, 500);
    }
  }

  function closeUploadModal() {
    setShowUploadModal(false);
    setUploadFiles([]);
    setUploadProgress({});
    setUploadStatus({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openPreview(item: FileItem) {
    if (item.type === "file" && isImage(item.contentType || "")) {
      setPreviewItem(item);
      setShowPreviewModal(true);
    }
  }

  function handleContextMenu(e: React.MouseEvent, item?: FileItem) {
    e.preventDefault();
    e.stopPropagation();
    if (item && !selectedItems.has(item.key)) {
      setSelectedItems(new Set([item.key]));
    }
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }

  function copyUrl(item: FileItem) {
    if (item.url) {
      navigator.clipboard.writeText(item.url);
      toast.success("URL copied to clipboard");
    }
  }

  function downloadFile(item: FileItem) {
    if (item.url) {
      window.open(item.url, "_blank");
    }
  }

  function isImage(contentType: string) {
    return contentType.startsWith("image/");
  }

  function formatSize(bytes: number) {
    if (bytes === 0) return "-";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getFileIcon(item: FileItem) {
    if (item.type === "folder") {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
      );
    }

    const ct = item.contentType || "";
    if (ct.startsWith("image/")) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <path d="M13 2v7h7"/>
      </svg>
    );
  }

  function getIconClass(item: FileItem) {
    if (item.type === "folder") return "folder";
    const ct = item.contentType || "";
    if (ct.startsWith("image/")) return "image";
    return "other";
  }

  const filteredItems = explorerSearch
    ? items.filter(i => i.name.toLowerCase().includes(explorerSearch.toLowerCase()))
    : items;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="settings-container">
      {/* Tabs */}
      <div className="settings-tabs" style={{ marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "0" }}>
        <button
          className={`settings-tab ${activeTab === "providers" ? "active" : ""}`}
          onClick={() => setActiveTab("providers")}
          style={{
            padding: "0.75rem 1.5rem",
            background: activeTab === "providers" ? "#fff" : "transparent",
            border: "none",
            borderBottom: activeTab === "providers" ? "2px solid #3b82f6" : "2px solid transparent",
            color: activeTab === "providers" ? "#3b82f6" : "#64748b",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Storage Providers
        </button>
        <button
          className={`settings-tab ${activeTab === "explorer" ? "active" : ""}`}
          onClick={() => setActiveTab("explorer")}
          style={{
            padding: "0.75rem 1.5rem",
            background: activeTab === "explorer" ? "#fff" : "transparent",
            border: "none",
            borderBottom: activeTab === "explorer" ? "2px solid #3b82f6" : "2px solid transparent",
            color: activeTab === "explorer" ? "#3b82f6" : "#64748b",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          File Explorer
        </button>
      </div>

      {/* Providers Tab */}
      {activeTab === "providers" && (
        <>
          <div className="settings-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search storage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <button className="btn btn-primary" onClick={() => openModal()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Storage
            </button>
          </div>
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Bucket</th>
                    <th>Region</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="loading">Loading...</td>
                    </tr>
                  ) : filteredProviders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">{searchTerm ? "No storage providers match your search" : "No storage providers found"}</td>
                    </tr>
                  ) : (
                    filteredProviders.map(provider => (
                      <tr key={provider.id}>
                        <td>{provider.name}</td>
                        <td>
                          <span className="badge" style={{ background: "#e0e7ff", color: "#4f46e5" }}>
                            {getTypeLabel(provider.type)}
                          </span>
                        </td>
                        <td>{provider.bucket}</td>
                        <td>{provider.region || "-"}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: provider.isActive ? "#dcfce7" : "#f3f4f6",
                              color: provider.isActive ? "#22c55e" : "#6b7280",
                            }}
                          >
                            {provider.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {provider.isActive ? (
                              <button
                                className="btn-action btn-icon-suspend"
                                onClick={() => handleDeactivate(provider.id)}
                                title="Deactivate"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
                                  <line x1="15" y1="9" x2="9" y2="15" stroke="#f59e0b" strokeWidth="2"/>
                                  <line x1="9" y1="9" x2="15" y2="15" stroke="#f59e0b" strokeWidth="2"/>
                                </svg>
                              </button>
                            ) : (
                              <button
                                className="btn-action btn-icon-activate"
                                onClick={() => handleActivate(provider.id)}
                                title="Activate"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#22c55e" strokeWidth="2"/>
                                  <polyline points="22 4 12 14.01 9 11.01" stroke="#22c55e" strokeWidth="2"/>
                                </svg>
                              </button>
                            )}
                            <button
                              className="btn-action btn-icon-edit"
                              onClick={() => openModal(provider)}
                              title="Edit"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#f59e0b" strokeWidth="2"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f59e0b" strokeWidth="2"/>
                              </svg>
                            </button>
                            <button
                              className="btn-action btn-icon-delete"
                              onClick={() => handleDelete(provider.id, provider.name)}
                              title="Delete"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <polyline points="3,6 5,6 21,6" stroke="#ef4444" strokeWidth="2"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ef4444" strokeWidth="2"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Explorer Tab */}
      {activeTab === "explorer" && (
        !hasActiveStorage ? (
          <div className="no-storage-config">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z"/>
              <path d="M4 12h16"/>
              <path d="M12 4v16"/>
            </svg>
            <h2>No Active Storage Provider</h2>
            <p>Activate a storage provider to use the file explorer.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab("providers")}>
              Go to Storage Providers
            </button>
          </div>
        ) : (
          <div className="storage-explorer" style={{ height: "calc(100vh - 220px)" }}>
            {/* Explorer Header */}
            <div className="explorer-header" style={{ padding: "0.75rem 1rem" }}>
              <div className="breadcrumb">
                {getBreadcrumbs().map((crumb, idx, arr) => (
                  <span key={crumb.path} className={`breadcrumb-item ${idx === arr.length - 1 ? "current" : ""}`}>
                    <button onClick={() => navigateTo(crumb.path)}>{crumb.name}</button>
                    {idx < arr.length - 1 && <span className="breadcrumb-separator">/</span>}
                  </span>
                ))}
              </div>

              <div className="explorer-toolbar">
                <button className="toolbar-btn primary" onClick={() => fileInputRef.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                
                <button className="toolbar-btn" onClick={() => setShowNewFolderModal(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    <line x1="12" y1="11" x2="12" y2="17"/>
                    <line x1="9" y1="14" x2="15" y2="14"/>
                  </svg>
                  New Folder
                </button>

                <div className="toolbar-divider" />

                <button 
                  className="toolbar-btn" 
                  onClick={isAllSelected() ? handleDeselectAll : handleSelectAll}
                  disabled={filteredItems.length === 0}
                  title={isAllSelected() ? "Deselect All (Ctrl+A)" : "Select All (Ctrl+A)"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    {isAllSelected() ? (
                      <path d="M9 12l2 2 4-4"/>
                    ) : (
                      <path d="M9 9h6M9 12h6M9 15h6"/>
                    )}
                  </svg>
                  {isAllSelected() ? "Deselect All" : "Select All"}
                </button>
                <button className="toolbar-btn" onClick={handleCopy} disabled={selectedItems.size === 0}>
                  Copy
                </button>
                <button className="toolbar-btn" onClick={handleCut} disabled={selectedItems.size === 0}>
                  Cut
                </button>
                <button className="toolbar-btn" onClick={handlePaste} disabled={!clipboard}>
                  Paste
                </button>
                <button className="toolbar-btn danger" onClick={() => setShowDeleteConfirm(true)} disabled={selectedItems.size === 0}>
                  Delete
                </button>

                <div className="toolbar-divider" />

                <button className="toolbar-btn" onClick={loadFolder}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                </button>

                <div className="search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={explorerSearch}
                    onChange={e => setExplorerSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Explorer Content */}
            <div className="explorer-content">
              {/* Folder Tree */}
              <div className="folder-tree">
                <div className="folder-tree-header">Folders</div>
                {/* Show parent folder (..) when not at root */}
                {currentPath !== "" && (
                  <div 
                    className="tree-item"
                    onClick={() => {
                      // Navigate to parent folder
                      const parts = currentPath.replace(/\/$/, "").split("/").filter(Boolean);
                      parts.pop();
                      navigateTo(parts.length > 0 ? parts.join("/") + "/" : "");
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                    </svg>
                    <span className="tree-item-name">..</span>
                  </div>
                )}
                {/* Show root folder only when at root */}
                {currentPath === "" && (
                  <div 
                    className={`tree-item active`}
                    onClick={() => navigateTo("")}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                    </svg>
                    <span className="tree-item-name">/</span>
                  </div>
                )}
                {/* Always show trash folder at root level */}
                {currentPath === "" && !items.some(i => i.type === "folder" && i.name === "trash") && (
                  <div 
                    className="tree-item trash-folder"
                    onClick={() => navigateTo("trash/")}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <span className="tree-item-name">trash</span>
                  </div>
                )}
                {items
                  .filter(i => i.type === "folder")
                  .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                  .map(folder => (
                  <div 
                    key={folder.key}
                    className={`tree-item ${folder.name === "trash" ? "trash-folder" : ""}`}
                    onClick={() => openFolder(folder)}
                  >
                    {folder.name === "trash" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                      </svg>
                    )}
                    <span className="tree-item-name">{folder.name}</span>
                  </div>
                ))}
              </div>

              {/* File Grid */}
              <div className="file-grid-container" onContextMenu={e => handleContextMenu(e)}>
                {explorerLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <h3>{explorerSearch ? "No matches found" : "This folder is empty"}</h3>
                    <p>{explorerSearch ? "Try a different search term" : "Upload files or create a folder"}</p>
                  </div>
                ) : (
                  <div className={`file-grid ${viewMode === "list" ? "list-view" : ""}`}>
                    {filteredItems.map(item => (
                      <div
                        key={item.key}
                        className={`file-item ${selectedItems.has(item.key) ? "selected" : ""}`}
                        onClick={e => {
                          if (e.detail === 2 && item.type === "folder") {
                            openFolder(item);
                          } else if (e.detail === 2 && item.type === "file") {
                            openPreview(item);
                          }
                        }}
                        onContextMenu={e => handleContextMenu(e, item)}
                      >
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={selectedItems.has(item.key)}
                          onChange={e => toggleSelect(item, e as any)}
                          onClick={e => e.stopPropagation()}
                        />
                        <div className={`file-item-icon ${getIconClass(item)}`}>
                          {item.type === "file" && isImage(item.contentType || "") && item.url ? (
                            <img src={item.url} alt={item.name} loading="lazy" />
                          ) : (
                            getFileIcon(item)
                          )}
                        </div>
                        <div className="file-item-name">{item.name}</div>
                        <div className="file-item-size">{formatSize(item.size)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status Bar */}
            <div className="explorer-statusbar">
              <div className="statusbar-left">
                <span>{filteredItems.length} items</span>
                {selectedItems.size > 0 && <span>{selectedItems.size} selected</span>}
                {clipboard && <span>Clipboard: {clipboard.items.length} item(s)</span>}
              </div>
              <div className="statusbar-right">
                <div className="view-toggle">
                  <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} title="Grid view">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </button>
                  <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} title="List view">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6"/>
                      <line x1="8" y1="12" x2="21" y2="12"/>
                      <line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/>
                      <line x1="3" y1="12" x2="3.01" y2="12"/>
                      <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Operation Loading Overlay */}
            {bulkOperationLoading && (
              <div className="bulk-operation-overlay">
                <div className="bulk-operation-modal">
                  <div className="loading-spinner"></div>
                  <p>{bulkOperationLoading}</p>
                </div>
              </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
              <div 
                className="context-menu"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={e => e.stopPropagation()}
              >
                {contextMenu.item && (
                  <>
                    {contextMenu.item.type === "folder" && (
                      <div className="context-menu-item" onClick={() => { openFolder(contextMenu.item!); setContextMenu(null); }}>
                        Open
                      </div>
                    )}
                    {contextMenu.item.type === "file" && isImage(contextMenu.item.contentType || "") && (
                      <div className="context-menu-item" onClick={() => { openPreview(contextMenu.item!); setContextMenu(null); }}>
                        Preview
                      </div>
                    )}
                    {contextMenu.item.type === "file" && (
                      <div className="context-menu-item" onClick={() => { downloadFile(contextMenu.item!); setContextMenu(null); }}>
                        Download
                      </div>
                    )}
                    {contextMenu.item.url && (
                      <div className="context-menu-item" onClick={() => { copyUrl(contextMenu.item!); setContextMenu(null); }}>
                        Copy URL
                      </div>
                    )}
                    <div className="context-menu-divider" />
                    <div className="context-menu-item" onClick={() => { startRename(contextMenu.item!); setContextMenu(null); }}>
                      Rename
                    </div>
                  </>
                )}
                <div className="context-menu-item" onClick={() => { handleSelectAll(); setContextMenu(null); }}>
                  Select All
                </div>
                {selectedItems.size > 0 && (
                  <div className="context-menu-item" onClick={() => { handleDeselectAll(); setContextMenu(null); }}>
                    Deselect All
                  </div>
                )}
                <div className="context-menu-divider" />
                <div className="context-menu-item" onClick={() => { handleCopy(); setContextMenu(null); }}>
                  Copy
                </div>
                <div className="context-menu-item" onClick={() => { handleCut(); setContextMenu(null); }}>
                  Cut
                </div>
                {clipboard && (
                  <div className="context-menu-item" onClick={() => { handlePaste(); setContextMenu(null); }}>
                    Paste
                  </div>
                )}
                <div className="context-menu-divider" />
                <div className="context-menu-item danger" onClick={() => { setShowDeleteConfirm(true); setContextMenu(null); }}>
                  Delete
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Provider Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProvider ? "Edit Storage Provider" : "Add Storage Provider"}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Production S3" required />
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select name="type" value={formData.type} onChange={handleChange} required>
                      {storageTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Bucket *</label>
                  <input type="text" name="bucket" value={formData.bucket} onChange={handleChange} placeholder="my-bucket-name" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Region {formData.type === "s3" && "*"}</label>
                    <input type="text" name="region" value={formData.region} onChange={handleChange} placeholder={formData.type === "s3" ? "us-east-1" : "auto (optional)"} required={formData.type === "s3"} />
                  </div>
                  {formData.type !== "s3" && (
                    <div className="form-group">
                      <label>Endpoint *</label>
                      <input type="url" name="endpoint" value={formData.endpoint} onChange={handleChange} placeholder="https://..." required />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Access Key *</label>
                  <input type="text" name="accessKey" value={formData.accessKey} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>{editingProvider ? "Secret Key (leave blank to keep)" : "Secret Key *"}</label>
                  <input type="password" name="secretKey" value={formData.secretKey} onChange={handleChange} required={!editingProvider} />
                </div>
              </div>
              <div className="modal-footer">
                {editingProvider && (
                  <button type="button" className="btn btn-outline" onClick={() => handleTestConnection(editingProvider.id)} disabled={testing} style={{ marginRight: "auto" }}>
                    {testing ? "Testing..." : "Test Connection"}
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingProvider ? "Update" : "Create"}</button>
              </div>
              {testResult && (
                <div style={{ padding: "0.75rem 1.5rem", background: testResult.success ? "#dcfce7" : "#fee2e2", color: testResult.success ? "#166534" : "#991b1b", borderTop: "1px solid #e5e7eb", fontSize: "0.875rem" }}>
                  {testResult.success ? "✓ " : "✗ "}{testResult.message}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Folder</h2>
              <button className="modal-close" onClick={() => setShowNewFolderModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateFolder}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Folder Name</label>
                  <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Enter folder name" autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewFolderModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!newFolderName.trim()}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && renameItem && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rename</h2>
              <button className="modal-close" onClick={() => setShowRenameModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleRename}>
              <div className="modal-body">
                <div className="form-group">
                  <label>New Name</label>
                  <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRenameModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!renameValue.trim()}>Rename</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={closeUploadModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Files</h2>
              <button className="modal-close" onClick={closeUploadModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: "1rem", color: "#64748b", fontSize: "0.875rem" }}>
                Uploading to: <strong>{currentPath || "/"}</strong>
              </p>
              <div className="upload-list">
                {uploadFiles.map(file => (
                  <div key={file.name} className="upload-item">
                    <div className="upload-item-info">
                      <div className="upload-item-name">{file.name}</div>
                      {uploadStatus[file.name] === "uploading" && (
                        <div className="upload-item-progress">
                          <div className="upload-item-progress-bar" style={{ width: `${uploadProgress[file.name] || 0}%` }} />
                        </div>
                      )}
                    </div>
                    <div className={`upload-item-status ${uploadStatus[file.name]}`}>
                      {uploadStatus[file.name] === "pending" && "Pending"}
                      {uploadStatus[file.name] === "uploading" && "Uploading..."}
                      {uploadStatus[file.name] === "success" && "✓ Done"}
                      {uploadStatus[file.name] === "error" && "✗ Failed"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeUploadModal}>Close</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={Object.values(uploadStatus).some(s => s === "uploading")}>
                {Object.values(uploadStatus).some(s => s === "uploading") ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentPath.startsWith("trash") ? "Permanently Delete" : "Move to Trash"}</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {currentPath.startsWith("trash") ? (
                <>
                  <p>Are you sure you want to permanently delete {selectedItems.size} item(s)?</p>
                  <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.5rem" }}>This action cannot be undone.</p>
                </>
              ) : (
                <>
                  <p>Are you sure you want to move {selectedItems.size} item(s) to trash?</p>
                  <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.5rem" }}>Items will be moved to the /trash folder and can be recovered later.</p>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteFiles}>
                {currentPath.startsWith("trash") ? "Delete Permanently" : "Move to Trash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewItem && (
        <div className="modal-overlay preview-modal" onClick={() => setShowPreviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw" }}>
            <div className="modal-header">
              <h2>{previewItem.name}</h2>
              <button className="modal-close" onClick={() => setShowPreviewModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="preview-content">
              <img src={previewItem.url} alt={previewItem.name} />
            </div>
            <div className="preview-info">
              <div className="preview-info-grid">
                <div className="preview-info-item">
                  <label>Size</label>
                  <span>{formatSize(previewItem.size)}</span>
                </div>
                <div className="preview-info-item">
                  <label>Type</label>
                  <span>{previewItem.contentType}</span>
                </div>
                <div className="preview-info-item">
                  <label>Modified</label>
                  <span>{formatDate(previewItem.lastModified)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => copyUrl(previewItem)}>Copy URL</button>
              <button className="btn btn-primary" onClick={() => downloadFile(previewItem)}>Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

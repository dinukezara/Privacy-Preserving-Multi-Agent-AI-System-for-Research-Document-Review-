"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  type Paper,
  type PaperStatus,
  getPapers,
  createPaper,
  updatePaper,
  deletePaper,
} from "@/lib/api";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Calendar,
  Users,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  Sparkles,
  LayoutGrid,
  List,
  ExternalLink,
  Edit3,
  X,
  ChevronDown,
} from "lucide-react";

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [abstract, setAbstract] = useState("");
  const [status, setStatus] = useState<PaperStatus>("submitted");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Track expanded abstracts in card view
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  async function loadPapers(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await getPapers();
      setPapers(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the papers service. Please ensure the backend is running."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPapers();
  }, []);

  function handleOpenAddModal() {
    setTitle("");
    setAuthors("");
    setAbstract("");
    setStatus("submitted");
    setEditingPaper(null);
    setFormError("");
    setIsAddModalOpen(true);
  }

  function handleOpenEditModal(paper: Paper) {
    setTitle(paper.title);
    setAuthors(paper.authors.join(", "));
    setAbstract(paper.abstract || "");
    setStatus(paper.status);
    setEditingPaper(paper);
    setFormError("");
    setIsAddModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const authorsArray = authors
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      if (editingPaper) {
        await updatePaper(editingPaper._id, {
          title: title.trim(),
          authors: authorsArray,
          abstract: abstract.trim(),
          status,
        });
      } else {
        await createPaper({
          title: title.trim(),
          authors: authorsArray,
          abstract: abstract.trim(),
          status,
        });
      }

      setIsAddModalOpen(false);
      setTitle("");
      setAuthors("");
      setAbstract("");
      setStatus("submitted");
      setEditingPaper(null);
      await loadPapers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save paper.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!paperToDelete) return;
    try {
      await deletePaper(paperToDelete._id);
      setPaperToDelete(null);
      await loadPapers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete paper.");
    }
  }

  async function handleQuickStatusChange(paperId: string, newStatus: PaperStatus) {
    try {
      await updatePaper(paperId, { status: newStatus });
      setPapers((prev) =>
        prev.map((p) => (p._id === paperId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  function toggleExpandAbstract(id: string) {
    setExpandedAbstracts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      const matchesSearch =
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.authors.some((author) =>
          author.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        (paper.abstract &&
          paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || paper.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [papers, searchQuery, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = papers.length;
    const underReview = papers.filter((p) => p.status === "under_review").length;
    const accepted = papers.filter((p) => p.status === "accepted").length;
    const submitted = papers.filter((p) => p.status === "submitted").length;
    return { total, underReview, accepted, submitted };
  }, [papers]);

  const statusConfig: Record<
    PaperStatus,
    { label: string; badgeClass: string; dotClass: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    submitted: {
      label: "Submitted",
      badgeClass:
        "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      dotClass: "bg-blue-500",
      icon: Send,
    },
    under_review: {
      label: "Under Review",
      badgeClass:
        "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      dotClass: "bg-amber-500 animate-pulse",
      icon: Clock,
    },
    accepted: {
      label: "Accepted",
      badgeClass:
        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      dotClass: "bg-emerald-500",
      icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      badgeClass:
        "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      dotClass: "bg-rose-500",
      icon: XCircle,
    },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Link
              href="/dashboard"
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-white font-medium">Papers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Research Papers
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage repository papers, author metadata, and review statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadPapers(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Refresh papers"
            id="refresh-papers-button"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin text-purple-600" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
            id="add-paper-button"
          >
            <Plus className="w-4 h-4" />
            Add Paper
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300">
              Total
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {loading ? "..." : stats.total}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total papers stored</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300">
              Active
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {loading ? "..." : stats.underReview}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Under AI review</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300">
              Approved
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {loading ? "..." : stats.accepted}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Accepted papers</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Send className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
              Queue
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {loading ? "..." : stats.submitted}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Submitted & pending</p>
        </div>
      </div>

      {/* Error alert banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex items-start justify-between gap-3 text-red-700 dark:text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Connection Notice</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadPapers(true)}
            className="text-xs font-semibold underline hover:no-underline flex-shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, author, or abstract..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            id="papers-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter and view toggles */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status filter buttons */}
          {(
            [
              { key: "all", label: "All" },
              { key: "submitted", label: "Submitted" },
              { key: "under_review", label: "Under Review" },
              { key: "accepted", label: "Accepted" },
              { key: "rejected", label: "Rejected" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === item.key
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />

          {/* View mode buttons */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-300 shadow-sm"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-300 shadow-sm"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Papers Content */}
      {loading ? (
        // Loading Skeleton
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded-md" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPapers.length === 0 ? (
        // Empty State
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            No papers found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            {searchQuery || statusFilter !== "all"
              ? "No papers match your search criteria. Try adjusting the search query or status filter."
              : "Get started by adding your first academic paper to the repository."}
          </p>
          {searchQuery || statusFilter !== "all" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
            >
              <Plus className="w-4 h-4" />
              Add First Paper
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPapers.map((paper) => {
            const config = statusConfig[paper.status] || statusConfig.submitted;
            const isExpanded = expandedAbstracts[paper._id];
            const hasLongAbstract = paper.abstract && paper.abstract.length > 180;

            return (
              <div
                key={paper._id}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Status & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                      {config.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(paper)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Edit paper"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPaperToDelete(paper)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete paper"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
                    {paper.title}
                  </h2>

                  {/* Authors */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <Users className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span className="line-clamp-1">
                      {paper.authors.length > 0
                        ? paper.authors.join(", ")
                        : "No authors specified"}
                    </span>
                  </div>

                  {/* Abstract */}
                  {paper.abstract ? (
                    <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4 bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800/60">
                      <p className={!isExpanded && hasLongAbstract ? "line-clamp-3" : ""}>
                        {paper.abstract}
                      </p>
                      {hasLongAbstract && (
                        <button
                          onClick={() => toggleExpandAbstract(paper._id)}
                          className="text-[11px] text-purple-600 dark:text-purple-400 font-medium hover:underline mt-1 block"
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic mb-4">
                      No abstract provided.
                    </div>
                  )}
                </div>

                {/* Footer info & CTA */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {paper.createdAt
                        ? new Date(paper.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recently added"}
                    </span>
                  </div>

                  <Link
                    href="/review/new"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    <span>Start Review</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Table View
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Paper Title & Authors</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Added</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredPapers.map((paper) => {
                  const config = statusConfig[paper.status] || statusConfig.submitted;
                  return (
                    <tr
                      key={paper._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <td className="px-6 py-4 max-w-md">
                        <p className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {paper.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {paper.authors.join(", ") || "No authors listed"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {paper.createdAt
                          ? new Date(paper.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href="/review/new"
                            className="px-2.5 py-1 text-xs font-medium bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                          >
                            Review
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(paper)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit paper"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPaperToDelete(paper)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Delete paper"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Paper Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingPaper ? "Edit Research Paper" : "Add New Paper"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {editingPaper
                      ? "Update paper details and status."
                      : "Fill in paper metadata to store in repository."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Paper Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Self-Supervised Vision Transformers for Histology"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Authors (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson, Dr. Elena Rostova, M. Chen"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Separate multiple authors with commas.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Review Status
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PaperStatus)}
                    className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 pr-10"
                  >
                    <option value="submitted">Submitted (Pending Review)</option>
                    <option value="under_review">Under Review (Evaluating)</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Abstract
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide a concise abstract of the methodology, datasets, and primary findings..."
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 disabled:opacity-50"
                  id="modal-submit-paper"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingPaper ? (
                    "Save Changes"
                  ) : (
                    "Add Paper"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {paperToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Paper?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Are you sure you want to remove &quot;
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {paperToDelete.title}
                </span>
                &quot;? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPaperToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-red-600/20"
                id="confirm-delete-paper"
              >
                Delete Paper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
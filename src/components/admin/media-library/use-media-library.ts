"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMediaAssets, deleteAsset, uploadImage } from "@/lib/actions/media";
import {
  PER_PAGE_OPTIONS,
  SORT_OPTIONS,
  STORAGE_KEY,
  formatBytes,
  slugifyProduct,
} from "./media-library.data";
import type {
  MediaAsset,
  MediaLibraryState,
  MediaView,
  PendingFile,
  PersistedMediaState,
  PopoverKey,
  PopoverOption,
} from "./media-library.types";

interface SanityMediaAsset {
  _id?: string;
  url?: string;
  originalFilename?: string;
  _createdAt?: string;
  metadata?: { dimensions?: { width?: number; height?: number } | null } | null;
}

function toMediaAsset(raw: SanityMediaAsset): MediaAsset | null {
  if (!raw._id || !raw.url) return null;
  const filename = raw.originalFilename ?? raw._id;
  const ext = (filename.split(".").pop() ?? "").toUpperCase();
  const dims = raw.metadata?.dimensions;
  return {
    id: raw._id,
    filename,
    type: ["JPG", "PNG", "WEBP", "GIF", "AVIF"].includes(ext) ? ext : "JPG",
    dims:
      dims?.width && dims?.height
        ? `${dims.width} × ${dims.height}`
        : "—",
    url: raw.url,
    usageText: "Unused",
    used: false,
    sizeMb: 0,
    addedAt: raw._createdAt ?? new Date().toISOString(),
  };
}

function loadPersisted(): PersistedMediaState {
  const fallback: PersistedMediaState = {
    starred: [],
    view: "grid",
    sort: "Newest First",
    perPage: 20,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedMediaState>;
    return {
      starred: Array.isArray(parsed.starred) ? parsed.starred : [],
      view: parsed.view === "list" ? "list" : "grid",
      sort: SORT_OPTIONS.includes(parsed.sort ?? "") ? (parsed.sort as string) : "Newest First",
      perPage: PER_PAGE_OPTIONS.includes(String(parsed.perPage))
        ? Number(parsed.perPage)
        : 20,
    };
  } catch {
    return fallback;
  }
}

function persistState(starred: Set<string>, view: MediaView, sort: string, perPage: number) {
  try {
    const data: PersistedMediaState = {
      starred: [...starred],
      view,
      sort,
      perPage,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

const PROFILE_OPTIONS: PopoverOption[] = [
  { value: "profile", label: "Profile" },
  { value: "preferences", label: "Preferences" },
  { value: "activity", label: "Recent activity" },
  { value: "logout", label: "Sign out", dividerBefore: true },
];

export function useMediaLibrary(initialAssets: MediaAsset[]) {
  const [persisted] = useState<PersistedMediaState>(loadPersisted);

  const [state, setState] = useState<MediaLibraryState>(() => {
    const p = persisted as PersistedMediaState;
    return {
      assets: initialAssets,
      loading: false,
      loadError: null,
      query: "",
      type: "All Types",
      usage: "All Usage",
      folder: "All Folders",
      sort: p.sort,
      view: p.view,
      page: 1,
      perPage: p.perPage,
      selected: new Set<number>(),
      starred: new Set<string>(p.starred),
      activeIndex: 0,
      mobileDetailOpen: false,
      filterOpen: false,
      filters: { used: false, unused: false, jpg: false, png: false, webp: false },
      sizeFilter: "0",
      dateFilter: "all",
      popover: null,
      context: null,
      uploadOpen: false,
      replaceIndex: null,
      pendingFiles: [],
      confirm: null,
      deleteIndex: null,
      lightboxIndex: null,
      toasts: [],
    };
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const toastId = useRef(0);
  const searchTimer = useRef<number | null>(null);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    persistState(
      new Set(state.starred),
      state.view,
      state.sort,
      state.perPage,
    );
  }, [state.starred, state.view, state.sort, state.perPage]);

  const reloadAssets = useCallback(async () => {
    const result = await getMediaAssets();
    if (result.error) {
      setState((cur) => ({
        ...cur,
        loading: false,
        loadError: result.error.message,
      }));
      return;
    }
    const assets = (result.data as SanityMediaAsset[])
      .map(toMediaAsset)
      .filter((a): a is MediaAsset => a !== null);
    setState((cur) => ({ ...cur, assets, loading: false, loadError: null }));
  }, []);

  const notify = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = ++toastId.current;
    setState((cur) => ({ ...cur, toasts: [...cur.toasts, { id, message, type }] }));
    window.setTimeout(() => {
      setState((cur) => ({
        ...cur,
        toasts: cur.toasts.filter((t) => t.id !== id),
      }));
    }, 2600);
  }, []);

  const setQuery = useCallback((value: string) => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setState((cur) => ({ ...cur, query: value.trim().toLowerCase(), page: 1 }));
    }, 120);
  }, []);

  const closePopover = useCallback(() => {
    setState((cur) => (cur.popover ? { ...cur, popover: null } : cur));
  }, []);

  const closeContext = useCallback(() => {
    setState((cur) => (cur.context ? { ...cur, context: null } : cur));
  }, []);

  const openSelect = useCallback(
    (anchor: HTMLElement, key: PopoverKey, options: string[]) => {
      closeContext();
      const rect = anchor.getBoundingClientRect();
      const width = Math.max(170, rect.width);
      let left = rect.left;
      let top = rect.bottom + 6;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (top + 230 > window.innerHeight) top = rect.top - 236;
      const current = stateRef.current[key as "type" | "usage" | "folder" | "sort"];
      setState((cur) => ({
        ...cur,
        popover: {
          x: Math.max(8, left),
          y: Math.max(8, top),
          width,
          key,
          options: options.map((option) => ({
            value: option,
            label: option,
            active: option === current,
          })),
        },
      }));
    },
    [closeContext],
  );

  const openPerPageSelect = useCallback(
    (anchor: HTMLElement) => {
      openSelect(anchor, "perPage", PER_PAGE_OPTIONS);
    },
    [openSelect],
  );

  const openProfilePopover = useCallback((anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    const width = 190;
    setState((cur) => ({
      ...cur,
      popover: {
        x: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        y: Math.max(8, rect.top - 205),
        width,
        key: "profile",
        options: PROFILE_OPTIONS,
      },
    }));
  }, []);

  const pickPopoverOption = useCallback((option: PopoverOption) => {
    const popover = stateRef.current.popover;
    if (!popover) return;
    const key = popover.key;
    closePopover();

    if (key === "profile") {
      if (option.value === "logout") {
        notify("Sign out requested");
      } else {
        notify(`${option.label} opened`);
      }
      return;
    }

    if (key === "perPage") {
      setState((cur) => ({ ...cur, perPage: Number(option.value), page: 1 }));
      return;
    }

    setState((cur) => ({ ...cur, [key]: option.value, page: 1 }));
  }, [closePopover, notify]);

  const setView = useCallback((view: MediaView) => {
    setState((cur) => ({ ...cur, view }));
  }, []);

  const openFilters = useCallback(() => {
    closePopover();
    setState((cur) => ({ ...cur, filterOpen: true }));
  }, [closePopover]);

  const closeFilters = useCallback(() => {
    setState((cur) => ({ ...cur, filterOpen: false }));
  }, []);

  const toggleFilter = useCallback((key: "used" | "unused" | "jpg" | "png" | "webp") => {
    setState((cur) => ({
      ...cur,
      filters: { ...cur.filters, [key]: !cur.filters[key] },
    }));
  }, []);

  const setSizeFilter = useCallback((value: string) => {
    setState((cur) => ({ ...cur, sizeFilter: value }));
  }, []);

  const setDateFilter = useCallback((value: string) => {
    setState((cur) => ({ ...cur, dateFilter: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setState((cur) => ({
      ...cur,
      filters: { used: false, unused: false, jpg: false, png: false, webp: false },
      sizeFilter: "0",
      dateFilter: "all",
      type: "All Types",
      usage: "All Usage",
      folder: "All Folders",
    }));
  }, []);

  const applyFilters = useCallback(() => {
    setState((cur) => ({ ...cur, page: 1, filterOpen: false }));
    const cur = stateRef.current;
    const active =
      Object.values(cur.filters).some(Boolean) ||
      cur.sizeFilter !== "0" ||
      cur.dateFilter !== "all";
    notify(active ? "Filters applied" : "Filters cleared");
  }, [notify]);

  const getFilteredImages = useCallback((s: MediaLibraryState) => {
    let result = s.assets.map((asset, index) => ({ asset, index }));

    if (s.query) {
      result = result.filter((x) =>
        `${x.asset.filename} ${x.asset.usageText}`.toLowerCase().includes(s.query),
      );
    }

    if (s.type !== "All Types") {
      result = result.filter((x) => x.asset.type === s.type);
    }

    if (s.usage === "Used") result = result.filter((x) => x.asset.used);
    if (s.usage === "Unused") result = result.filter((x) => !x.asset.used);

    if (s.folder !== "All Folders") {
      const folderMap: Record<string, string[]> = {
        Products: ["product"],
        Homepage: ["homepage"],
        Blog: ["blog"],
        Unsorted: [],
      };
      const terms = folderMap[s.folder] || [];
      if (s.folder === "Unsorted") {
        result = result.filter((x) => !/product|homepage|blog/i.test(x.asset.usageText));
      } else {
        result = result.filter((x) =>
          terms.some((term) => x.asset.usageText.toLowerCase().includes(term)),
        );
      }
    }

    const f = s.filters;
    const selectedTypes = ["jpg", "png", "webp"]
      .filter((type) => f[type as "jpg" | "png" | "webp"])
      .map((type) => type.toUpperCase());
    if (selectedTypes.length) {
      result = result.filter((x) => selectedTypes.includes(x.asset.type));
    }
    if (f.used && !f.unused) result = result.filter((x) => x.asset.used);
    if (f.unused && !f.used) result = result.filter((x) => !x.asset.used);

    if (Number(s.sizeFilter) > 0) {
      result = result.filter((x) => x.asset.sizeMb >= Number(s.sizeFilter));
    }

    if (s.dateFilter !== "all") {
      const now = Date.now();
      const limit =
        s.dateFilter === "today" ? 1 : Number(s.dateFilter);
      result = result.filter((x) => {
        const days = (now - new Date(x.asset.addedAt).getTime()) / 86400000;
        return days <= limit;
      });
    }

    switch (s.sort) {
      case "Oldest First":
        result = [...result].reverse();
        break;
      case "Name A–Z":
        result = [...result].sort((a, b) => a.asset.filename.localeCompare(b.asset.filename));
        break;
      case "Name Z–A":
        result = [...result].sort((a, b) => b.asset.filename.localeCompare(a.asset.filename));
        break;
      case "Largest First":
        result = [...result].sort((a, b) => b.asset.sizeMb - a.asset.sizeMb);
        break;
      case "Smallest First":
        result = [...result].sort((a, b) => a.asset.sizeMb - b.asset.sizeMb);
        break;
      default:
        break;
    }

    return result;
  }, []);

  const filtered = useMemo(() => getFilteredImages(state), [getFilteredImages, state]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));
  const page = Math.min(state.page, totalPages);
  const start = (page - 1) * state.perPage;
  const pageItems = filtered.slice(start, start + state.perPage);

  const goToPage = useCallback(
    (target: number) => {
      const last = Math.max(1, Math.ceil(filtered.length / stateRef.current.perPage));
      setState((cur) => ({ ...cur, page: Math.max(1, Math.min(target, last)) }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [filtered.length],
  );

  const openContext = useCallback((index: number, x: number, y: number) => {
    closePopover();
    const width = 190;
    const height = 215;
    setState((cur) => ({
      ...cur,
      context: {
        x: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
        y: Math.max(8, Math.min(y, window.innerHeight - height - 8)),
        index,
      },
    }));
  }, [closePopover]);

  const toggleStar = useCallback(
    (index: number) => {
      const asset = stateRef.current.assets[index];
      if (!asset) return;
      const wasStarred = stateRef.current.starred.has(asset.id);
      setState((cur) => {
        const starred = new Set(cur.starred);
        if (starred.has(asset.id)) starred.delete(asset.id);
        else starred.add(asset.id);
        return { ...cur, starred };
      });
      notify(wasStarred ? "Removed from favorites" : "Added to favorites");
    },
    [notify],
  );

  const toggleSelection = useCallback((index: number) => {
    setState((cur) => {
      const selected = new Set(cur.selected);
      if (selected.has(index)) selected.delete(index);
      else selected.add(index);
      return { ...cur, selected };
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setState((cur) => {
      const selected = new Set(cur.selected);
      getFilteredImages(cur).forEach((x) => selected.add(x.index));
      return { ...cur, selected };
    });
  }, [getFilteredImages]);

  const bulkFavorite = useCallback(() => {
    setState((cur) => {
      const starred = new Set(cur.starred);
      cur.selected.forEach((index) => {
        const asset = cur.assets[index];
        if (asset) starred.add(asset.id);
      });
      return { ...cur, starred };
    });
    notify("Selected images added to favorites");
  }, [notify]);

  const clearSelection = useCallback(() => {
    setState((cur) => ({ ...cur, selected: new Set<number>() }));
  }, []);

  const openDetails = useCallback(
    (index: number) => {
      closeContext();
      setState((cur) => ({
        ...cur,
        activeIndex: index,
        mobileDetailOpen: window.innerWidth <= 767,
      }));
    },
    [closeContext],
  );

  const closeDrawer = useCallback(() => {
    setState((cur) => ({ ...cur, activeIndex: null, mobileDetailOpen: false }));
  }, []);

  const openLightbox = useCallback((index: number) => {
    setState((cur) => ({ ...cur, lightboxIndex: index }));
  }, []);

  const closeLightbox = useCallback(() => {
    setState((cur) => ({ ...cur, lightboxIndex: null }));
  }, []);

  const shiftActiveImage = useCallback(
    (direction: number) => {
      const cur = stateRef.current;
      const filteredList = getFilteredImages(cur);
      const currentPosition = filteredList.findIndex(
        (x) => x.index === cur.activeIndex,
      );
      if (currentPosition < 0) return;
      const nextPosition =
        (currentPosition + direction + filteredList.length) % filteredList.length;
      const next = filteredList[nextPosition];
      setState((cur) => ({
        ...cur,
        activeIndex: next.index,
        lightboxIndex: next.index,
        mobileDetailOpen: window.innerWidth <= 767,
      }));
    },
    [getFilteredImages],
  );

  const showUsages = useCallback(() => {
    // No reverse-usage index is available from storage yet.
    setState((cur) => ({
      ...cur,
      confirm: {
        kind: "usage",
        title: "Image usage",
        text: "Usage tracking across content is not available yet.",
        items: [],
      },
      deleteIndex: null,
    }));
  }, []);

  const requestDelete = useCallback((index: number) => {
    const asset = stateRef.current.assets[index];
    if (!asset) return;
    setState((cur) => ({
      ...cur,
      deleteIndex: index,
      confirm: {
        kind: "delete",
        title: `Delete ${asset.filename}?`,
        text: asset.used
          ? "This image is currently used by products. Deleting it will remove the image reference from those locations."
          : "This image is unused. This action cannot be undone.",
      },
    }));
  }, []);

  const requestBulkDelete = useCallback(() => {
    const count = stateRef.current.selected.size;
    if (!count) return;
    setState((cur) => ({
      ...cur,
      confirm: {
        kind: "bulk",
        title: `Delete ${count} selected image${count === 1 ? "" : "s"}?`,
        text: "All selected images will be removed from the current media library state. This action cannot be undone.",
      },
    }));
  }, []);

  const closeConfirm = useCallback(() => {
    setState((cur) => ({ ...cur, confirm: null, deleteIndex: null }));
  }, []);

  const performDelete = useCallback(() => {
    const index = stateRef.current.deleteIndex;
    if (index === undefined || index === null) return;
    const cur = stateRef.current;
    const asset = cur.assets[index];
    if (!asset) return;

    setState((prev) => {
      const assets = prev.assets.filter((_, i) => i !== index);

      const selected = new Set(
        [...prev.selected]
          .filter((i) => i !== index)
          .map((i) => (i > index ? i - 1 : i)),
      );
      const starred = new Set(prev.starred);
      starred.delete(asset.id);

      let activeIndex = prev.activeIndex;
      if (activeIndex === index) {
        activeIndex = assets.length ? Math.min(index, assets.length - 1) : null;
      } else if (activeIndex !== null && activeIndex > index) {
        activeIndex--;
      }

      return {
        ...prev,
        assets,
        selected,
        starred,
        activeIndex,
        mobileDetailOpen: activeIndex !== null && window.innerWidth <= 767,
        confirm: null,
        deleteIndex: null,
      };
    });

    void deleteAsset(asset.id).then(async (result) => {
      if (result.error) {
        notify(`Failed to delete ${asset.filename}`, "error");
        await reloadAssets();
        return;
      }
      notify(`${asset.filename} deleted`);
    });
  }, [notify, reloadAssets]);

  const performBulkDelete = useCallback(() => {
    const indexes = [...stateRef.current.selected].sort((a, b) => b - a);
    if (!indexes.length) return;

    const targets = indexes
      .map((index) => stateRef.current.assets[index])
      .filter((a): a is MediaAsset => Boolean(a));
    const targetIds = new Set(targets.map((t) => t.id));

    setState((prev) => {
      const assets = prev.assets.filter((a) => !targetIds.has(a.id));
      const starred = new Set(prev.starred);
      targets.forEach((asset) => starred.delete(asset.id));

      let activeIndex = prev.activeIndex;
      if (activeIndex !== null) {
        const removedBefore =
          prev.assets.slice(0, activeIndex).filter((a) => targetIds.has(a.id)).length;
        if (targetIds.has(prev.assets[activeIndex]?.id)) {
          activeIndex = assets.length
            ? Math.max(0, Math.min(activeIndex - removedBefore, assets.length - 1))
            : null;
        } else {
          activeIndex = activeIndex - removedBefore;
        }
      }

      return {
        ...prev,
        assets,
        selected: new Set<number>(),
        starred,
        activeIndex,
        mobileDetailOpen: activeIndex !== null && window.innerWidth <= 767,
        confirm: null,
        deleteIndex: null,
      };
    });

    void Promise.allSettled(targets.map((asset) => deleteAsset(asset.id))).then(
      async (results) => {
        const failed = results.filter((r) => r.status === "rejected" || r.value.error);
        if (failed.length) {
          notify(`${failed.length} of ${targets.length} deletions failed`, "error");
          await reloadAssets();
          return;
        }
        notify(`${targets.length} image${targets.length === 1 ? "" : "s"} deleted`);
      },
    );
  }, [notify, reloadAssets]);

  const openUpload = useCallback(() => {
    closePopover();
    setState((cur) => ({
      ...cur,
      pendingFiles: [],
      uploadOpen: true,
      replaceIndex: null,
    }));
  }, [closePopover]);

  const closeUpload = useCallback(() => {
    setState((cur) => {
      cur.pendingFiles.forEach((file) => URL.revokeObjectURL(file.url));
      return { ...cur, uploadOpen: false, pendingFiles: [], replaceIndex: null };
    });
  }, []);

  const openReplace = useCallback(
    (index: number) => {
      closePopover();
      setState((cur) => ({ ...cur, pendingFiles: [], uploadOpen: true, replaceIndex: index }));
    },
    [closePopover],
  );

  const addFiles = useCallback((fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const accepted = [...fileList].filter((file) =>
      /^image\/(jpeg|png|webp|gif|avif)$/.test(file.type),
    );
    if (!accepted.length) {
      notify("No supported image files were selected", "error");
      return;
    }
    setState((cur) => {
      const existing = new Set(cur.pendingFiles.map((f) => `${f.name}:${f.size}`));
      const added: PendingFile[] = [];
      accepted.forEach((file) => {
        const key = `${file.name}:${file.size}`;
        if (!existing.has(key)) {
          added.push({ name: file.name, size: file.size, url: URL.createObjectURL(file), file });
          existing.add(key);
        }
      });
      return { ...cur, pendingFiles: [...cur.pendingFiles, ...added] };
    });
  }, [notify]);

  const removePendingFile = useCallback((pendingIndex: number) => {
    setState((cur) => {
      const target = cur.pendingFiles[pendingIndex];
      if (target) URL.revokeObjectURL(target.url);
      return {
        ...cur,
        pendingFiles: cur.pendingFiles.filter((_, i) => i !== pendingIndex),
      };
    });
  }, []);

  const uploadPending = useCallback(
    async (
      files: PendingFile[],
    ): Promise<{ uploaded: MediaAsset[]; failed: string[] }> => {
      const uploaded: MediaAsset[] = [];
      const failed: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file.file, file.name);
        const result = await uploadImage(formData);
        if (result.error) {
          failed.push(file.name);
          continue;
        }
        uploaded.push({
          id: result.data._id,
          filename: result.data.originalFilename || file.name,
          type: (file.name.split(".").pop() || "JPG").toUpperCase(),
          dims: "—",
          url: result.data.url,
          usageText: "Unused",
          used: false,
          sizeMb: Math.max(0.1, file.size / 1048576),
          addedAt: new Date().toISOString(),
        });
      }
      return { uploaded, failed };
    },
    [],
  );

  const performUpload = useCallback(() => {
    const cur = stateRef.current;
    if (!cur.pendingFiles.length) {
      notify("Choose at least one image", "error");
      return;
    }
    const count = cur.pendingFiles.length;
    const pendingSnapshot = [...cur.pendingFiles];

    setState((prev) => ({
      ...prev,
      uploadOpen: false,
      pendingFiles: [],
      replaceIndex: null,
    }));
    notify(`Uploading ${count} image${count === 1 ? "" : "s"}…`);

    void uploadPending(pendingSnapshot).then(async ({ uploaded, failed }) => {
      pendingSnapshot.forEach((file) => URL.revokeObjectURL(file.url));
      if (uploaded.length) {
        setState((prev) => ({
          ...prev,
          assets: [...uploaded, ...prev.assets],
          page: 1,
        }));
      }
      if (failed.length) {
        notify(`${failed.length} upload${failed.length === 1 ? "" : "s"} failed: ${failed.join(", ")}`, "error");
      } else {
        notify(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded successfully`);
      }
    });
  }, [notify, uploadPending]);

  const performReplace = useCallback(() => {
    // Storage has no in-place replace; the file is uploaded as a new asset.
    const cur = stateRef.current;
    if (!cur.pendingFiles.length) {
      notify("Choose a replacement image", "error");
      return;
    }
    const pendingSnapshot = [cur.pendingFiles[0]];

    setState((prev) => {
      prev.pendingFiles.forEach((f) => URL.revokeObjectURL(f.url));
      return { ...prev, uploadOpen: false, pendingFiles: [], replaceIndex: null };
    });

    void uploadPending(pendingSnapshot).then(({ uploaded, failed }) => {
      if (failed.length || !uploaded.length) {
        notify("Upload failed. Please try again.", "error");
        return;
      }
      setState((prev) => ({
        ...prev,
        assets: [...uploaded, ...prev.assets],
        page: 1,
      }));
      notify("Uploaded as a new image");
    });
  }, [notify, uploadPending]);

  const handleCardAction = useCallback(
    (action: string, index: number, target: HTMLElement | null) => {
      switch (action) {
        case "select":
          toggleSelection(index);
          break;
        case "star":
          toggleStar(index);
          break;
        case "menu":
          if (target) {
            const rect = target.getBoundingClientRect();
            openContext(index, rect.right, rect.bottom);
          }
          break;
        case "preview":
          openLightbox(index);
          break;
        default:
          break;
      }
    },
    [toggleSelection, toggleStar, openContext, openLightbox],
  );

  useEffect(() => {
    document.documentElement.classList.toggle(
      "media-ui-lock",
      state.filterOpen || state.uploadOpen || state.confirm !== null || state.lightboxIndex !== null,
    );
    return () => document.documentElement.classList.remove("media-ui-lock");
  }, [state.filterOpen, state.uploadOpen, state.confirm, state.lightboxIndex]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopover();
        closeContext();
        closeFilters();
        closeUpload();
        closeConfirm();
        closeLightbox();
        return;
      }

      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".search input")?.focus();
        return;
      }

      if (
        stateRef.current.lightboxIndex !== null &&
        event.key === "ArrowRight"
      ) {
        shiftActiveImage(1);
      }
      if (
        stateRef.current.lightboxIndex !== null &&
        event.key === "ArrowLeft"
      ) {
        shiftActiveImage(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closePopover, closeContext, closeFilters, closeUpload, closeConfirm, closeLightbox, shiftActiveImage]);

  useEffect(() => {
    const onResizeOrScroll = () => {
      closePopover();
      closeContext();
    };
    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll);
    };
  }, [closePopover, closeContext]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const inPopover = target?.closest?.(".ml-popover");
      const anchor = target?.closest?.(".select, .sort, .per-page, .profile");
      if (!inPopover && !anchor) closePopover();

      const inContext = target?.closest?.(".ml-context");
      if (!inContext) closeContext();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [closePopover, closeContext]);

  useEffect(() => {
    const profile = document.querySelector<HTMLElement>(".profile");
    if (!profile) return;
    const onProfileClick = (event: MouseEvent) => {
      event.stopPropagation();
      openProfilePopover(profile);
    };
    profile.addEventListener("click", onProfileClick);
    return () => profile.removeEventListener("click", onProfileClick);
  }, [openProfilePopover]);

  const drawerAsset = state.activeIndex !== null ? state.assets[state.activeIndex] : null;

  return {
    state,
    filtered,
    totalPages,
    page,
    start,
    pageItems,
    drawerAsset,
    notify,
    setQuery,
    openSelect,
    openPerPageSelect,
    openProfilePopover,
    pickPopoverOption,
    closePopover,
    setView,
    openFilters,
    closeFilters,
    toggleFilter,
    setSizeFilter,
    setDateFilter,
    resetFilters,
    applyFilters,
    goToPage,
    openContext,
    closeContext,
    toggleStar,
    toggleSelection,
    selectAllFiltered,
    bulkFavorite,
    clearSelection,
    requestBulkDelete,
    openDetails,
    closeDrawer,
    openLightbox,
    closeLightbox,
    shiftActiveImage,
    showUsages,
    requestDelete,
    closeConfirm,
    performDelete,
    performBulkDelete,
    openUpload,
    closeUpload,
    openReplace,
    addFiles,
    removePendingFile,
    performUpload,
    performReplace,
    handleCardAction,
    dropzoneRef,
    fileInputRef,
    formatBytes,
    slugifyProduct,
  };
}

export type MediaLibraryModel = ReturnType<typeof useMediaLibrary>;
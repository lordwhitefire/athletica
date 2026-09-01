"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SECTIONS, STORAGE_KEY } from "./homepage-management.data";
import type {
  EditorTab,
  HomepageManagementState,
  HomepageSection,
  TopTab,
} from "./homepage-management.types";

function cloneDefaults(): HomepageSection[] {
  return DEFAULT_SECTIONS.map((s) => ({ ...s, spark: [...s.spark] }));
}

function loadSections(): HomepageSection[] {
  if (typeof window === "undefined") return cloneDefaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed as HomepageSection[];
    }
  } catch {
    /* corrupted storage falls back to defaults */
  }
  return cloneDefaults();
}

function persistSections(sections: HomepageSection[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  } catch {
    /* storage unavailable */
  }
}

export function useHomepageManagement() {
  const [state, setState] = useState<HomepageManagementState>(() => ({
    sections: loadSections(),
    selectedId: "section_hero_01",
    editorTab: "content",
    topTab: "sections",
    editorOpen: true,
    isMobile: false,
    reorder: false,
    dirty: false,
    pendingDelete: null,
    addType: "",
    imageIndex: "0",
    selectedImage: "0",
    heroRemoved: false,
    previewOpen: false,
    addOpen: false,
    imageOpen: false,
    contextMenu: null,
    toast: null,
    confirmCloseOpen: false,
  }));

  const stateRef = useRef(state);
  stateRef.current = state;
  const toastTimer = useRef<number | null>(null);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    const first =
      stateRef.current.sections.find((s) => s.id === "section_hero_01") ??
      stateRef.current.sections[0];
    setState((cur) => ({ ...cur, selectedId: first?.id ?? "" }));

    const mq = window.matchMedia("(max-width:900px)");
    const updateMobile = () =>
      setState((cur) => ({ ...cur, isMobile: mq.matches }));
    updateMobile();
    mq.addEventListener("change", updateMobile);
    return () => mq.removeEventListener("change", updateMobile);
  }, []);

  const notify = useCallback(
    (title: string, message: string, type: "success" | "error" = "success") => {
      setState((cur) => ({ ...cur, toast: { title, message, type } }));
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => {
        setState((cur) => (cur.toast ? { ...cur, toast: null } : cur));
      }, 2500);
    },
    [],
  );

  const markDirty = useCallback(() => {
    setState((cur) => (cur.dirty ? cur : { ...cur, dirty: true }));
  }, []);

  const saveChanges = useCallback(() => {
    setState((cur) => {
      persistSections(cur.sections);
      return { ...cur, dirty: false };
    });
    notify("Changes saved", "Homepage section changes are now saved.");
  }, [notify]);

  const selectSection = useCallback((id: string, open = true) => {
    setState((cur) => {
      const section = cur.sections.find((s) => s.id === id);
      if (!section) return cur;
      return { ...cur, selectedId: id, editorOpen: open ? true : cur.editorOpen };
    });
  }, []);

  const openEditor = useCallback(() => {
    setState((cur) => ({ ...cur, editorOpen: true }));
  }, []);

  const requestCloseEditor = useCallback(() => {
    if (stateRef.current.dirty) {
      setState((cur) => ({ ...cur, confirmCloseOpen: true }));
      return;
    }
    setState((cur) => ({ ...cur, editorOpen: false }));
  }, []);

  const discardAndClose = useCallback(() => {
    setState((cur) => ({
      ...cur,
      dirty: false,
      confirmCloseOpen: false,
      editorOpen: false,
    }));
  }, []);

  const cancelCloseConfirm = useCallback(() => {
    setState((cur) => ({ ...cur, confirmCloseOpen: false }));
  }, []);

  const setEditorTab = useCallback((tab: EditorTab) => {
    setState((cur) => ({ ...cur, editorTab: tab }));
  }, []);

  const setTopTab = useCallback((tab: TopTab) => {
    setState((cur) => ({ ...cur, topTab: tab }));
    notify(
      `${tab === "sections" ? "Sections" : "Settings"} selected`,
      `Showing the ${tab} tab.`,
    );
  }, [notify]);

  const updateSectionField = useCallback(
    <K extends keyof HomepageSection>(field: K, value: HomepageSection[K]) => {
      setState((cur) => ({
        ...cur,
        sections: cur.sections.map((s) =>
          s.id === cur.selectedId ? { ...s, [field]: value } : s,
        ),
        dirty: true,
      }));
    },
    [],
  );

  const duplicateSection = useCallback(
    (id: string) => {
      setState((cur) => {
        const index = cur.sections.findIndex((s) => s.id === id);
        if (index < 0) return cur;
        const source = cur.sections[index];
        const copy: HomepageSection = {
          ...structuredClone(source),
          id: `${source.id}_copy_${Date.now()}`,
          name: `${source.name} Copy`,
          views: "—",
          ctr: "—",
        };
        const sections = [...cur.sections];
        sections.splice(index + 1, 0, copy);
        persistSections(sections);
        return { ...cur, sections, selectedId: copy.id };
      });
      notify("Section duplicated", "A copy was inserted directly below the original.");
    },
    [notify],
  );

  const toggleSection = useCallback(
    (id: string) => {
      const before = stateRef.current.sections.find((s) => s.id === id);
      setState((cur) => {
        const section = cur.sections.find((s) => s.id === id);
        if (!section) return cur;
        const sections = cur.sections.map((s) =>
          s.id === id ? { ...s, active: !s.active } : s,
        );
        persistSections(sections);
        return { ...cur, sections, selectedId: id };
      });
      notify(
        before?.active ? "Section deactivated" : "Section activated",
        `${before?.name ?? "Section"} is now ${before?.active ? "inactive" : "active"}.`,
      );
    },
    [notify],
  );

  const askDelete = useCallback((id: string) => {
    setState((cur) => ({ ...cur, pendingDelete: id }));
  }, []);

  const closeDelete = useCallback(() => {
    setState((cur) => ({ ...cur, pendingDelete: null }));
  }, []);

  const deleteSection = useCallback(
    (id: string) => {
      const before = stateRef.current.sections.find((s) => s.id === id);
      setState((cur) => {
        const index = cur.sections.findIndex((s) => s.id === id);
        if (index < 0) return cur;

        let sections = cur.sections.filter((s) => s.id !== id);
        if (!sections.length) {
          const fresh = cloneDefaults();
          sections = [{ ...fresh[0], id: `section_${Date.now()}` }];
        }

        let selectedId = cur.selectedId;
        if (selectedId === id) {
          selectedId = sections[Math.max(0, index - 1)].id;
        }

        persistSections(sections);
        return {
          ...cur,
          sections,
          selectedId,
          pendingDelete: null,
          editorOpen: true,
        };
      });
      notify("Section deleted", `${before?.name ?? "Section"} was removed.`);
    },
    [notify],
  );

  const openAddModal = useCallback(() => {
    setState((cur) => ({ ...cur, addOpen: true, addType: "" }));
  }, []);

  const closeAddModal = useCallback(() => {
    setState((cur) => ({ ...cur, addOpen: false }));
  }, []);

  const selectAddType = useCallback((type: string) => {
    setState((cur) => ({ ...cur, addType: type }));
  }, []);

  const addSection = useCallback(() => {
    const type = stateRef.current.addType;
    if (!type) {
      notify("Choose a section", "Select a section type before adding.", "error");
      return;
    }
    setState((cur) => {
      const section: HomepageSection = {
        id: `section_${Date.now()}`,
        name: type,
        desc: "New homepage section",
        type,
        active: true,
        views: "—",
        ctr: "—",
        spark: [],
      };
      const sections = [...cur.sections, section];
      persistSections(sections);
      return { ...cur, sections, selectedId: section.id, addOpen: false, editorOpen: true };
    });
    notify("Section added", `${type} has been added to the homepage.`);
  }, [notify]);

  const openContextMenu = useCallback(
    (event: { clientX: number; clientY: number }, sectionId: string) => {
      const width = 178;
      const height = 155;
      let left = event.clientX;
      let top = event.clientY;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (top + height > window.innerHeight - 8) top = window.innerHeight - height - 8;
      setState((cur) => ({
        ...cur,
        contextMenu: {
          x: Math.max(8, left),
          y: Math.max(8, top),
          sectionId,
        },
      }));
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setState((cur) => (cur.contextMenu ? { ...cur, contextMenu: null } : cur));
  }, []);

  const setReorder = useCallback((enabled: boolean) => {
    setState((cur) => ({ ...cur, reorder: enabled }));
  }, []);

  const beginDrag = useCallback((id: string) => {
    dragId.current = id;
  }, []);

  const endDrag = useCallback(() => {
    dragId.current = null;
  }, []);

  const dropSection = useCallback((targetId: string) => {
    const fromId = dragId.current;
    dragId.current = null;
    if (!fromId || fromId === targetId) return;
    setState((cur) => {
      const from = cur.sections.findIndex((s) => s.id === fromId);
      const to = cur.sections.findIndex((s) => s.id === targetId);
      if (from < 0 || to < 0) return cur;
      const sections = [...cur.sections];
      const [moved] = sections.splice(from, 1);
      sections.splice(to, 0, moved);
      return { ...cur, sections };
    });
  }, []);

  const saveReorder = useCallback(() => {
    persistSections(stateRef.current.sections);
    setState((cur) => ({ ...cur, reorder: false }));
    notify("Order saved", "Homepage section order has been saved.");
  }, [notify]);

  const openImagePicker = useCallback(() => {
    setState((cur) => ({
      ...cur,
      imageOpen: true,
      imageIndex: cur.selectedImage,
    }));
  }, []);

  const closeImagePicker = useCallback(() => {
    setState((cur) => ({ ...cur, imageOpen: false }));
  }, []);

  const selectImageChoice = useCallback((index: string) => {
    setState((cur) => ({ ...cur, imageIndex: index }));
  }, []);

  const useSelectedImage = useCallback(() => {
    const index = stateRef.current.imageIndex;
    setState((cur) => ({
      ...cur,
      selectedImage: index,
      imageOpen: false,
      heroRemoved: false,
      dirty: true,
    }));
    notify("Image selected", "The new banner image is ready in the draft.");
  }, [notify]);

  const removeImage = useCallback(() => {
    setState((cur) => ({ ...cur, heroRemoved: true, dirty: true }));
    notify("Image removed", "The banner image is removed from the current draft.");
  }, [notify]);

  const openPreview = useCallback(() => {
    setState((cur) => ({ ...cur, previewOpen: true }));
  }, []);

  const closePreview = useCallback(() => {
    setState((cur) => ({ ...cur, previewOpen: false }));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("ap-reorder-mode", state.reorder);
    return () => document.body.classList.remove("ap-reorder-mode");
  }, [state.reorder]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const cur = stateRef.current;

      if (event.key === "Escape") {
        if (cur.confirmCloseOpen) {
          setState((s) => ({ ...s, confirmCloseOpen: false }));
          return;
        }
        if (cur.contextMenu) {
          setState((s) => ({ ...s, contextMenu: null }));
          return;
        }
        if (cur.previewOpen) {
          setState((s) => ({ ...s, previewOpen: false }));
          return;
        }
        if (cur.addOpen) {
          setState((s) => ({ ...s, addOpen: false }));
          return;
        }
        if (cur.pendingDelete) {
          setState((s) => ({ ...s, pendingDelete: null }));
          return;
        }
        if (cur.imageOpen) {
          setState((s) => ({ ...s, imageOpen: false }));
          return;
        }
        if (cur.isMobile && cur.editorOpen) {
          requestCloseEditor();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (cur.dirty) {
          saveChanges();
        } else {
          notify("No changes", "There are no unsaved homepage changes.");
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestCloseEditor, saveChanges, notify]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!stateRef.current.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest?.(".ap-context-menu") && !target?.closest?.(".more-row")) {
        setState((cur) => (cur.contextMenu ? { ...cur, contextMenu: null } : cur));
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return {
    state,
    notify,
    markDirty,
    saveChanges,
    selectSection,
    openEditor,
    requestCloseEditor,
    discardAndClose,
    cancelCloseConfirm,
    setEditorTab,
    setTopTab,
    updateSectionField,
    duplicateSection,
    toggleSection,
    askDelete,
    closeDelete,
    deleteSection,
    openAddModal,
    closeAddModal,
    selectAddType,
    addSection,
    openContextMenu,
    closeContextMenu,
    setReorder,
    beginDrag,
    endDrag,
    dropSection,
    saveReorder,
    openImagePicker,
    closeImagePicker,
    selectImageChoice,
    useSelectedImage,
    removeImage,
    openPreview,
    closePreview,
  };
}

export type HomepageManagementModel = ReturnType<typeof useHomepageManagement>;

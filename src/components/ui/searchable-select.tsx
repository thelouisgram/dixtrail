"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type UIEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
};

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  onOptionSelect?: (option: SearchableSelectOption) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** auto = dialog when inside modal, otherwise body. body = always portaled to body. */
  portalMode?: "auto" | "body";
  className?: string;
  triggerClassName?: string;
}

const LIST_MAX_HEIGHT = 240;
const VIRTUALIZE_THRESHOLD = 80;
const VIRTUAL_OVERSCAN = 6;
const PANEL_Z_INDEX = 200;

const triggerBaseClass =
  "flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const panelBaseClass =
  "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg";

type PanelStyle = {
  top: number;
  left: number;
  width: number;
  fixed: boolean;
  transform?: string;
};

function resolvePortalContainer(
  trigger: HTMLElement | null,
  portalMode: "auto" | "body"
): HTMLElement {
  if (portalMode === "body") return document.body;
  return trigger?.closest('[role="dialog"]') ?? document.body;
}

function isBodyPortal(container: HTMLElement | null): boolean {
  return container === document.body;
}

export function SearchableSelect({
  value = "",
  onValueChange,
  onOptionSelect,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches found.",
  disabled = false,
  invalid = false,
  portalMode = "auto",
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [panelStyle, setPanelStyle] = useState<PanelStyle | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);
  const itemHeight = options.some((option) => option.description) ? 44 : 36;

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.description ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [options, search]);

  const useVirtualList = filteredOptions.length >= VIRTUALIZE_THRESHOLD;

  const virtualRange = useMemo(() => {
    if (!useVirtualList) {
      return { start: 0, end: filteredOptions.length, offsetY: 0, totalHeight: 0 };
    }

    const visibleCount = Math.ceil(LIST_MAX_HEIGHT / itemHeight) + VIRTUAL_OVERSCAN;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - Math.floor(VIRTUAL_OVERSCAN / 2));
    const end = Math.min(filteredOptions.length, start + visibleCount);
    return {
      start,
      end,
      offsetY: start * itemHeight,
      totalHeight: filteredOptions.length * itemHeight,
    };
  }, [filteredOptions.length, itemHeight, scrollTop, useVirtualList]);

  const visibleOptions = useVirtualList
    ? filteredOptions.slice(virtualRange.start, virtualRange.end)
    : filteredOptions;

  function closePanel() {
    setOpen(false);
    setSearch("");
    setHighlightIndex(0);
    setScrollTop(0);
    setPanelStyle(null);
    setPortalContainer(null);
  }

  function openPanel() {
    if (disabled) return;
    setPortalContainer(resolvePortalContainer(triggerRef.current, portalMode));
    setOpen(true);
  }

  function updatePanelPosition() {
    const trigger = triggerRef.current;
    const container = portalContainer;
    if (!trigger || !container) return;

    const triggerRect = trigger.getBoundingClientRect();
    const maxHeight = LIST_MAX_HEIGHT + 52;
    const viewportPadding = 12;
    const maxWidth = window.innerWidth - viewportPadding * 2;
    const width = Math.min(Math.max(triggerRect.width, 200), maxWidth);

    if (isBodyPortal(container)) {
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const openUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;
      let left = triggerRect.left;
      if (left + width > window.innerWidth - viewportPadding) {
        left = window.innerWidth - viewportPadding - width;
      }
      left = Math.max(viewportPadding, left);

      setPanelStyle({
        fixed: true,
        top: openUpward ? triggerRect.top - 4 : triggerRect.bottom + 4,
        left,
        width,
        ...(openUpward ? { transform: "translateY(-100%)" } : {}),
      });
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const spaceBelow = containerRect.bottom - triggerRect.bottom;
    const spaceAbove = triggerRect.top - containerRect.top;
    const openUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;

    setPanelStyle({
      fixed: false,
      top: openUpward
        ? triggerRect.top - containerRect.top - 4
        : triggerRect.bottom - containerRect.top + 4,
      left: Math.max(0, triggerRect.left - containerRect.left),
      width: Math.min(width, containerRect.width),
      ...(openUpward ? { transform: "translateY(-100%)" } : {}),
    });
  }

  useLayoutEffect(() => {
    if (!open) return;

    updatePanelPosition();

    function handleReposition() {
      updatePanelPosition();
    }

    function handleScroll(event: Event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;

      if (isBodyPortal(portalContainer)) {
        updatePanelPosition();
        return;
      }

      let node: Node | null = triggerRef.current;
      while (node) {
        if (node === target) {
          updatePanelPosition();
          return;
        }
        node = node.parentNode;
      }
    }

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, portalContainer]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus({ preventScroll: true });
    });

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      closePanel();
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setHighlightIndex(0);
    setScrollTop(0);
    listRef.current?.scrollTo({ top: 0 });
  }, [search]);

  useEffect(() => {
    if (!open || !useVirtualList) return;

    const list = listRef.current;
    if (!list) return;

    const itemTop = highlightIndex * itemHeight;
    const itemBottom = itemTop + itemHeight;
    const viewTop = list.scrollTop;
    const viewBottom = viewTop + LIST_MAX_HEIGHT;

    if (itemTop < viewTop) {
      list.scrollTop = itemTop;
      setScrollTop(itemTop);
    } else if (itemBottom > viewBottom) {
      const nextTop = itemBottom - LIST_MAX_HEIGHT;
      list.scrollTop = nextTop;
      setScrollTop(nextTop);
    }
  }, [highlightIndex, itemHeight, open, useVirtualList]);

  function selectOption(option: SearchableSelectOption) {
    onValueChange(option.value);
    onOptionSelect?.(option);
    closePanel();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!filteredOptions.length) return;
      setHighlightIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!filteredOptions.length) return;
      setHighlightIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[highlightIndex];
      if (option) selectOption(option);
    }
  }

  function handleListScroll(event: UIEvent<HTMLDivElement>) {
    setScrollTop(event.currentTarget.scrollTop);
  }

  function renderOption(option: SearchableSelectOption, index: number) {
    const isSelected = option.value === value;
    const isHighlighted = index === highlightIndex;

    return (
      <button
        key={option.value}
        type="button"
        role="option"
        aria-selected={isSelected}
        className={cn(
          "relative flex w-full cursor-default select-none flex-col justify-center rounded-sm py-1.5 pl-8 pr-2 text-left text-sm outline-none",
          isHighlighted && "bg-accent text-accent-foreground",
          isSelected && !isHighlighted && "bg-accent/50"
        )}
        style={useVirtualList ? { height: itemHeight } : undefined}
        onMouseEnter={() => setHighlightIndex(index)}
        onClick={() => selectOption(option)}
      >
        <span className="absolute left-2 top-1/2 flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center">
          {isSelected && <Check className="h-4 w-4" />}
        </span>
        <span className="truncate leading-tight">{option.label}</span>
        {option.description && (
          <span className="truncate text-xs leading-tight text-muted-foreground">
            {option.description}
          </span>
        )}
      </button>
    );
  }

  const listContent =
    filteredOptions.length === 0 ? (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    ) : useVirtualList ? (
      <div style={{ height: virtualRange.totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${virtualRange.offsetY}px)` }}>
          {visibleOptions.map((option, localIndex) =>
            renderOption(option, virtualRange.start + localIndex)
          )}
        </div>
      </div>
    ) : (
      visibleOptions.map((option, index) => renderOption(option, index))
    );

  const panel =
    open && panelStyle && portalContainer ? (
      <div
        ref={panelRef}
        data-slot="radix-portal-content"
        data-state="open"
        role="listbox"
        id={listId}
        style={{
          position: panelStyle.fixed ? "fixed" : "absolute",
          top: panelStyle.top,
          left: panelStyle.left,
          width: panelStyle.width,
          zIndex: PANEL_Z_INDEX,
          transform: panelStyle.transform,
        }}
        className={cn(panelBaseClass, "max-w-[calc(100vw-1.5rem)]", className)}
      >
        <div className="p-2">
          <div className="relative flex min-w-0 items-center">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              onKeyDown={handleSearchKeyDown}
              className="h-9 w-full min-w-0 rounded-md bg-muted/50 py-0 pl-8 pr-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:cursor-pointer"
            />
          </div>
        </div>
        <div
          ref={listRef}
          className="overflow-y-auto overscroll-contain p-1"
          style={{ maxHeight: LIST_MAX_HEIGHT }}
          onScroll={handleListScroll}
        >
          {listContent}
        </div>
      </div>
    ) : null;

  return (
    <div ref={wrapperRef} className="relative w-full min-w-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid}
        aria-controls={open ? listId : undefined}
        className={cn(
          triggerBaseClass,
          open && "ring-2 ring-ring",
          invalid && "border-destructive focus:ring-destructive",
          triggerClassName
        )}
        onClick={() => {
          if (open) {
            closePanel();
          } else {
            openPanel();
          }
        }}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")}
        />
      </button>
      {panel && createPortal(panel, portalContainer!)}
    </div>
  );
}

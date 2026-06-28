/** Radix UI overlays portaled outside dialog DOM (selects, menus, etc.). */
const PORTAL_CONTENT_SELECTOR = [
  '[data-slot="radix-portal-content"]',
  "[data-radix-select-viewport]",
  "[data-radix-popper-content-wrapper]",
  "[data-radix-menu-content]",
  '[role="listbox"]',
  '[role="menu"]',
].join(",");

let nestedOverlayCount = 0;
let pendingNestedOverlayDismiss = false;
let dismissGuardInitialized = false;
let pendingDismissTimer: number | undefined;

function schedulePendingNestedDismiss() {
  pendingNestedOverlayDismiss = true;
  if (pendingDismissTimer) {
    clearTimeout(pendingDismissTimer);
  }
  pendingDismissTimer = window.setTimeout(() => {
    pendingNestedOverlayDismiss = false;
    pendingDismissTimer = undefined;
  }, 300);
}

function initNestedOverlayDismissGuard() {
  if (typeof window === "undefined" || dismissGuardInitialized) return;
  dismissGuardInitialized = true;

  // Dialog defers outside-dismiss until click; capture pointerdown while select/menu is still open.
  window.addEventListener(
    "pointerdown",
    () => {
      if (hasOpenRadixOverlay() || nestedOverlayCount > 0) {
        schedulePendingNestedDismiss();
      }
    },
    true
  );
}

export function isRadixPortalTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(PORTAL_CONTENT_SELECTOR);
}

export function hasOpenRadixOverlay(): boolean {
  if (typeof document === "undefined") return false;

  return !!(
    document.querySelector("[data-radix-select-viewport]") ||
    document.querySelector('[role="listbox"]') ||
    document.querySelector("[data-radix-menu-content][data-state='open']") ||
    document.querySelector('[data-slot="radix-portal-content"][data-state="open"]')
  );
}

export function notifyNestedOverlayOpened() {
  nestedOverlayCount += 1;
}

export function notifyNestedOverlayClosed() {
  nestedOverlayCount = Math.max(0, nestedOverlayCount - 1);
  schedulePendingNestedDismiss();
}

export function acknowledgeDialogOutsideDismissAttempt() {
  pendingNestedOverlayDismiss = false;
  if (pendingDismissTimer) {
    clearTimeout(pendingDismissTimer);
    pendingDismissTimer = undefined;
  }
}

/** Keep dialogs open when interacting with or dismissing portaled selects/menus. */
export function shouldPreventDialogOutsideDismiss(event?: {
  target: EventTarget | null;
}): boolean {
  initNestedOverlayDismissGuard();

  if (event && isRadixPortalTarget(event.target)) return true;
  if (pendingNestedOverlayDismiss) return true;
  if (nestedOverlayCount > 0) return true;
  if (hasOpenRadixOverlay()) return true;

  return false;
}

/** Pointer / interact outside — prevent dialog from closing. */
export function handleDialogPointerOutside(event: {
  preventDefault: () => void;
  target: EventTarget | null;
}) {
  if (shouldPreventDialogOutsideDismiss(event)) {
    event.preventDefault();
    acknowledgeDialogOutsideDismissAttempt();
  }
}

/** Focus outside — allow focus into portaled select search inputs. */
export function handleDialogFocusOutside(event: {
  preventDefault: () => void;
  target: EventTarget | null;
}) {
  if (isRadixPortalTarget(event.target)) {
    acknowledgeDialogOutsideDismissAttempt();
    return;
  }

  if (shouldPreventDialogOutsideDismiss(event)) {
    event.preventDefault();
    acknowledgeDialogOutsideDismissAttempt();
  }
}

/** @deprecated Use handleDialogPointerOutside or handleDialogFocusOutside */
export function handleDialogOutsideDismiss(event: {
  preventDefault: () => void;
  target?: EventTarget | null;
}) {
  handleDialogPointerOutside({
    preventDefault: event.preventDefault,
    target: event.target ?? null,
  });
}

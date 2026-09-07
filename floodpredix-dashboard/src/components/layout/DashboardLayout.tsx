import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AIChatSidebar } from "@/components/AIChatSidebar";

function LayoutContent() {
  const sidebarInsetRef = useRef<HTMLDivElement>(null);
  const { state } = useSidebar();

  // #region agent log
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sidebarElement = document.querySelector('[data-sidebar="sidebar"]')
        ?.parentElement as HTMLElement;
      const spacerElement = document.querySelector(
        '.group.peer > div[class*="w-[--sidebar-width]"]'
      ) as HTMLElement;
      const sidebarWrapper = document.querySelector(
        ".group.peer"
      ) as HTMLElement;

      if (sidebarInsetRef.current) {
        const insetRect = sidebarInsetRef.current.getBoundingClientRect();
        const sidebarRect = sidebarElement?.getBoundingClientRect();
        const spacerWidth = spacerElement?.offsetWidth || 0;
        const wrapperWidth = sidebarWrapper?.offsetWidth || 0;
        const computedStyle = window.getComputedStyle(sidebarInsetRef.current);
        const spacerStyle = spacerElement
          ? window.getComputedStyle(spacerElement)
          : null;

        fetch(
          "http://127.0.0.1:7243/ingest/25d0451b-d585-48fe-8196-1628ed24e9ff",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "DashboardLayout.tsx:useEffect",
              message: "Layout dimensions measured",
              data: {
                sidebarState: state,
                sidebarWidth: sidebarRect?.width || 0,
                sidebarLeft: sidebarRect?.left || 0,
                sidebarRight: sidebarRect?.right || 0,
                spacerWidth,
                spacerDisplay: spacerStyle?.display || "none",
                wrapperWidth,
                insetLeft: insetRect.left,
                insetRight: insetRect.right,
                insetWidth: insetRect.width,
                insetMarginLeft: computedStyle.marginLeft,
                overlap: sidebarRect
                  ? insetRect.left < sidebarRect.right
                  : false,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "A",
            }),
          }
        ).catch(() => {});
      }
    }
  }, [state]);
  // #endregion agent log

  return (
    <>
      <SidebarInset
        ref={sidebarInsetRef}
        className="flex flex-col overflow-hidden flex-1 min-w-0"
      >
        <Header />
        <main className="flex-1 overflow-auto bg-background min-w-0">
          <Outlet />
        </main>
      </SidebarInset>
      <AIChatSidebar />
    </>
  );
}

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <Sidebar />
      <LayoutContent />
    </SidebarProvider>
  );
}

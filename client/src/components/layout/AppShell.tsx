import { useState } from "react";
import { Outlet } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette, useCommandPalette } from "@/components/layout/CommandPalette";
import { TickerTape } from "@/components/layout/TickerTape";
import { AppFooter } from "@/components/layout/AppFooter";

export function AppShell() {
  const [mobileNav, setMobileNav] = useState(false);
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-dvh bg-bg">
        <div className="sticky top-0 hidden h-dvh shrink-0 lg:block">
          <Sidebar />
        </div>

        <DialogPrimitive.Root open={mobileNav} onOpenChange={setMobileNav}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" />
            <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 lg:hidden">
              <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
              <Sidebar onNavigate={() => setMobileNav(false)} />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenSidebar={() => setMobileNav(true)} onOpenCommand={() => setCmdOpen(true)} />
          <TickerTape />
          <main className="flex-1 px-3 py-5 sm:px-5 lg:px-7">
            <div className="mx-auto w-full max-w-[1400px]">
              <Outlet />
            </div>
          </main>
          <AppFooter />
        </div>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </TooltipProvider>
  );
}

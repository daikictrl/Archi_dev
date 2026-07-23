"use client"

import React, { useState } from "react"
import { UserButton } from "@clerk/nextjs"
import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles, Home, LayoutTemplate, Sun, Moon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useProjects } from "@/lib/project-context"
import { ShareDialog } from "./share-dialog"
import { useTheme } from "@/components/theme-provider"

type EditorNavbarProps = {
  isSidebarOpen: boolean
  onSidebarToggle: () => void
  className?: string
}

function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  className,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen
  const params = useParams()
  const router = useRouter()
  const roomId = params?.roomId as string | undefined
  const { projects, isAiSidebarOpen, toggleAiSidebar, setTemplatesModalOpen, canvasSaveStatus } = useProjects()
  const [isShareOpen, setIsShareOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const currentProject = roomId ? projects.find((p) => p.id === roomId) : null

  return (
    <>
      <header
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border bg-background px-3 justify-between",
          className
        )}
      >
        <div className="flex min-w-0 flex-1 items-center justify-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"}
            aria-pressed={isSidebarOpen}
            onClick={onSidebarToggle}
          >
            <SidebarIcon />
          </Button>

          <div className="flex items-center gap-2 select-none mr-2">
            <Image src="/logo.webp" alt="Archi_Dev Logo" width={24} height={24} />
            <span className="font-semibold text-sm hidden sm:inline-block">Archi_Dev</span>
          </div>

          {currentProject && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Go to editor dashboard"
                onClick={() => router.push("/editor")}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Home className="h-4 w-4" />
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="truncate text-sm font-medium text-foreground max-w-[150px] sm:max-w-xs select-none">
                {currentProject.name}
              </span>
            </div>
          )}
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-center sm:flex" />

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle color theme"
            onClick={toggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="h-4.5 w-4.5" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </Button>

          {currentProject && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={canvasSaveStatus === "saving"}
                className={cn(
                  "gap-1.5 text-xs h-8 transition-all duration-300 select-none",
                  canvasSaveStatus === "error" && "border-rose-500/50 hover:bg-rose-500/10 text-rose-400"
                )}
                onClick={() => window.dispatchEvent(new CustomEvent("trigger-canvas-save"))}
              >
                {canvasSaveStatus === "saving" && (
                  <span className="relative flex h-1.5 w-1.5 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                  </span>
                )}
                {canvasSaveStatus === "saved" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-0.5" />
                )}
                {canvasSaveStatus === "error" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse mr-0.5" />
                )}
                <span>
                  {canvasSaveStatus === "saving"
                    ? "Saving..."
                    : canvasSaveStatus === "error"
                    ? "Error (Retry)"
                    : "Saved"}
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setTemplatesModalOpen(true)}
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                <span>Templates</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setIsShareOpen(true)}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </Button>

              <Button
                type="button"
                variant={isAiSidebarOpen ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Toggle AI assistant"
                aria-pressed={isAiSidebarOpen}
                onClick={toggleAiSidebar}
                className={cn(
                  "relative h-8 w-8",
                  isAiSidebarOpen && "text-accent-ai bg-accent-ai/10 border-accent-ai/20"
                )}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </>
          )}
          {!currentProject && <UserButton />}
        </div>
      </header>
      {currentProject && (
        <ShareDialog
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          projectId={currentProject.id}
        />
      )}
    </>
  )
}

export { EditorNavbar }

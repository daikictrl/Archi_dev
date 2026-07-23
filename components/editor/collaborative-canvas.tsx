"use client"

import React, { useCallback, useRef, useEffect, useState } from "react"
import {
  ReactFlow,
  Background,
  ConnectionMode,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { useHistory, useMutation, useUpdateMyPresence, useOther } from "@liveblocks/react/suspense"
import { LiveObject } from "@liveblocks/client"
import { useProjects } from "@/lib/project-context"
import { StarterTemplatesModal } from "./starter-templates-modal"
import type { CanvasTemplate } from "./starter-templates"
import { Trash2 } from "lucide-react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"
import { CustomNode } from "./custom-node"
import { CustomEdge } from "./custom-edge"
import { useTheme } from "@/components/theme-provider"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { ControlBar } from "./control-bar"
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-flow/styles.css"

const nodeTypes = {
  customNode: CustomNode,
}

const edgeTypes = {
  customEdge: CustomEdge,
}

let nodeCounter = 0

function CustomCursor({ userId, connectionId }: { userId: string; connectionId: number }) {
  const info = useOther(connectionId, (user) => user.info)
  const thinking = useOther(connectionId, (user) => user.presence?.thinking)
  
  if (!info) return null

  const color = info.color || "#00c8d4"
  const name = info.name || "Collaborator"

  return (
    <div className="absolute pointer-events-none z-50 flex items-center gap-1 select-none">
      <svg
        className="h-3.5 w-3.5 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 1 L16 16 L9.5 16 L13 23.5 L10.5 24.5 L7 17 L3 21 Z"
          fill={color}
          stroke="#080809"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{ backgroundColor: color }}
        className="rounded px-1.5 py-0.5 text-[8.5px] font-semibold text-zinc-950 shadow border border-zinc-950/10 whitespace-nowrap animate-in fade-in duration-100 flex items-center gap-1"
      >
        <span>{name}</span>
        {thinking && (
          <svg className="animate-spin h-2.5 w-2.5 text-zinc-950 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
      </div>
    </div>
  )
}

function CanvasAutosaveComponent({ projectId, nodes, edges }: { projectId: string, nodes: CanvasNode[], edges: CanvasEdge[] }) {
  useCanvasAutosave(projectId, nodes, edges)
  return null
}

function CollaborativeCanvasInner({
  projectId,
  canvasJsonPath,
}: {
  projectId: string
  canvasJsonPath?: string | null
}) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: {
      initial: [],
    },
    edges: {
      initial: [],
    },
  })

  const [contextMenu, setContextMenu] = useState<{
    nodeId?: string
    isSelection?: boolean
    x: number
    y: number
  } | null>(null)

  const reactFlowInstance = useReactFlow()
  const { screenToFlowPosition, fitView } = reactFlowInstance
  
  const history = useHistory()
  const updateMyPresence = useUpdateMyPresence()

  const { isTemplatesModalOpen, setTemplatesModalOpen } = useProjects()

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      updateMyPresence({ cursor: position })
    },
    [screenToFlowPosition, updateMyPresence]
  )

  const onPointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const importTemplate = useMutation(
    ({ storage }, templateNodes: CanvasNode[], templateEdges: CanvasEdge[]) => {
      const flow = storage.get("flow") as any
      if (!flow) return

      const nodesMap = flow.get("nodes") as any
      const edgesMap = flow.get("edges") as any

      if (nodesMap) {
        const nodeKeys = Array.from(nodesMap.keys()) as string[]
        for (const key of nodeKeys) {
          nodesMap.delete(key)
        }
        for (const node of templateNodes) {
          nodesMap.set(node.id, new LiveObject(node as any))
        }
      }

      if (edgesMap) {
        const edgeKeys = Array.from(edgesMap.keys()) as string[]
        for (const key of edgeKeys) {
          edgesMap.delete(key)
        }
        for (const edge of templateEdges) {
          edgesMap.set(edge.id, new LiveObject(edge as any))
        }
      }
    },
    []
  )

  const loadCanvasState = useMutation(
    ({ storage }, canvasNodes: CanvasNode[], canvasEdges: CanvasEdge[]) => {
      const flow = storage.get("flow") as any
      if (!flow) return

      const nodesMap = flow.get("nodes") as any
      const edgesMap = flow.get("edges") as any

      if (nodesMap) {
        const nodeKeys = Array.from(nodesMap.keys()) as string[]
        for (const key of nodeKeys) {
          nodesMap.delete(key)
        }
        for (const node of canvasNodes) {
          nodesMap.set(node.id, new LiveObject(node as any))
        }
      }

      if (edgesMap) {
        const edgeKeys = Array.from(edgesMap.keys()) as string[]
        for (const key of edgeKeys) {
          edgesMap.delete(key)
        }
        for (const edge of canvasEdges) {
          edgesMap.set(edge.id, new LiveObject(edge as any))
        }
      }
    },
    []
  )

  const [hasLoadedSavedCanvas, setHasLoadedSavedCanvas] = useState(false)

  useEffect(() => {
    if (hasLoadedSavedCanvas) return

    // If the room is empty and the project has a saved canvas blob URL, fetch and load it
    if (nodes.length === 0 && edges.length === 0 && canvasJsonPath) {
      setHasLoadedSavedCanvas(true) // prevent multiple loads

      const loadSavedCanvas = async () => {
        try {
          const res = await fetch(`/api/projects/${projectId}/canvas`)
          if (res.ok) {
            const data = await res.json()
            if (data && (data.nodes || data.edges)) {
              loadCanvasState(data.nodes || [], data.edges || [])
              // Fit view on next frame
              requestAnimationFrame(() => {
                fitView({ padding: 0.2, maxZoom: 1 })
              })
            }
          }
        } catch (err) {
          console.error("Failed to load saved canvas:", err)
        }
      }

      loadSavedCanvas()
    } else {
      // Mark as loaded if not empty or no saved path, to stop any future checks
      setHasLoadedSavedCanvas(true)
    }
  }, [nodes.length, edges.length, canvasJsonPath, projectId, loadCanvasState, fitView, hasLoadedSavedCanvas])

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      importTemplate(template.nodes, template.edges)
      setTemplatesModalOpen(false)

      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 400, maxZoom: 1 })
      }, 100)
    },
    [importTemplate, reactFlowInstance, setTemplatesModalOpen]
  )

  const deleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected)
    const selectedEdges = edges.filter((e) => e.selected)

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id))
    const connectedEdges = edges.filter(
      (edge) => selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target)
    )

    // Combine selected edges and connected edges to avoid duplicates
    const allEdgesToDelete = Array.from(
      new Map([...selectedEdges, ...connectedEdges].map((e) => [e.id, e])).values()
    )

    if (selectedNodes.length > 0 || allEdgesToDelete.length > 0) {
      onDelete({
        nodes: selectedNodes,
        edges: allEdgesToDelete,
      })
    }
  }, [nodes, edges, onDelete])

  useKeyboardShortcuts({
    reactFlowInstance,
    undo: useCallback(() => history.undo(), [history]),
    redo: useCallback(() => history.redo(), [history]),
    canUndo: history.canUndo(),
    canRedo: history.canRedo(),
    deleteSelected,
  })

  const menuRef = useRef<HTMLDivElement>(null)

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault()
      setContextMenu({
        nodeId: node.id,
        x: event.clientX,
        y: event.clientY,
      })
    },
    []
  )

  const onSelectionContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      setContextMenu({
        isSelection: true,
        x: event.clientX,
        y: event.clientY,
      })
    },
    []
  )

  const handleDeleteFromContextMenu = useCallback(() => {
    if (!contextMenu) return

    if (contextMenu.isSelection) {
      const selectedNodes = nodes.filter((n) => n.selected)
      const selectedNodeIds = new Set(selectedNodes.map((n) => n.id))
      const connectedEdges = edges.filter(
        (edge) => selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target)
      )

      if (selectedNodes.length > 0) {
        onDelete({
          nodes: selectedNodes,
          edges: connectedEdges,
        })
      }
    } else if (contextMenu.nodeId) {
      const targetNode = nodes.find((n) => n.id === contextMenu.nodeId)
      
      // If the node we right-clicked is part of the active selection, delete the selection
      if (targetNode?.selected) {
        const selectedNodes = nodes.filter((n) => n.selected)
        const selectedNodeIds = new Set(selectedNodes.map((n) => n.id))
        const connectedEdges = edges.filter(
          (edge) => selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target)
        )
        onDelete({
          nodes: selectedNodes,
          edges: connectedEdges,
        })
      } else if (targetNode) {
        const connectedEdges = edges.filter(
          (edge) => edge.source === contextMenu.nodeId || edge.target === contextMenu.nodeId
        )
        onDelete({
          nodes: [targetNode],
          edges: connectedEdges,
        })
      }
    }

    setContextMenu(null)
  }, [contextMenu, nodes, edges, onDelete])

  const getContextMenuLabel = useCallback(() => {
    if (!contextMenu) return ""
    if (contextMenu.isSelection) {
      const selectedCount = nodes.filter((n) => n.selected).length
      return selectedCount > 1 ? `Delete Selected (${selectedCount})` : "Delete"
    }
    
    // Single node context menu
    const targetNode = nodes.find((n) => n.id === contextMenu.nodeId)
    if (targetNode?.selected) {
      const selectedCount = nodes.filter((n) => n.selected).length
      return selectedCount > 1 ? `Delete Selected (${selectedCount})` : "Delete"
    }
    
    return "Delete"
  }, [contextMenu, nodes])

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const hasFittedRef = useRef(false)
  const initialNodesLengthRef = useRef<number | null>(null)

  if (initialNodesLengthRef.current === null && nodes) {
    initialNodesLengthRef.current = nodes.length
  }

  useEffect(() => {
    if (
      initialNodesLengthRef.current !== null &&
      initialNodesLengthRef.current > 0 &&
      !hasFittedRef.current
    ) {
      hasFittedRef.current = true
      requestAnimationFrame(() => {
        fitView({ padding: 0.2, maxZoom: 1 })
      })
    }
  }, [fitView])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const dataStr = event.dataTransfer.getData("application/reactflow")
      if (!dataStr) return

      try {
        const { shape, width, height } = JSON.parse(dataStr)
        if (!shape) return

        // Project coordinate to flow space
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        nodeCounter++
        const nodeId = `${shape}-${Date.now()}-${nodeCounter}`

        const newNode: CanvasNode = {
          id: nodeId,
          type: "customNode",
          position: {
            x: position.x - width / 2,
            y: position.y - height / 2,
          },
          data: {
            label: "",
            shape,
            color: "#1F1F1F", // Default node color
          },
          width,
          height,
          style: {
            width,
            height,
          },
        }

        // Add node using the add change type
        onNodesChange([{ type: "add", item: newNode } as any])
      } catch (err) {
        console.error("Error handling shape drop:", err)
      }
    },
    [screenToFlowPosition, onNodesChange]
  )
  const { theme } = useTheme()

  return (
    <div
      ref={reactFlowWrapper}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="h-full w-full bg-background relative"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "customEdge",
        }}
        connectionMode={ConnectionMode.Loose}
        colorMode={theme}
        className="text-text-primary"
        onNodeContextMenu={onNodeContextMenu}
        onSelectionContextMenu={onSelectionContextMenu}
        onPaneClick={() => setContextMenu(null)}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="!text-[var(--border-subtle)]" />
        <ControlBar />
        <Cursors components={{ Cursor: CustomCursor }} />
        <CanvasAutosaveComponent projectId={projectId} nodes={nodes} edges={edges} />
      </ReactFlow>

      <StarterTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onImport={handleImportTemplate}
      />

      {contextMenu && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          className="z-50 bg-bg-surface/95 backdrop-blur-md border border-border-default rounded-xl shadow-xl py-1 min-w-[100px] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDeleteFromContextMenu}
            className="w-full px-3 py-1.5 text-center text-xs font-semibold text-state-error hover:bg-bg-elevated flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{getContextMenuLabel()}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export function CollaborativeCanvas({
  projectId,
  canvasJsonPath,
}: {
  projectId: string
  canvasJsonPath?: string | null
}) {
  return (
    <ReactFlowProvider>
      <CollaborativeCanvasInner projectId={projectId} canvasJsonPath={canvasJsonPath} />
    </ReactFlowProvider>
  )
}

"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates"
import { useTheme } from "@/components/theme-provider"

// Light mode color overrides (ultra-high contrast 300-level fills, bold 2.5px borders, pure black text)
const LIGHT_NODE_COLORS = {
  "#1f1f1f": { fill: "#ced4da", text: "#000000", border: "#343a40" }, // Neutral
  "#10233d": { fill: "#93c5fd", text: "#000000", border: "#1d4ed8" }, // Blue
  "#2e1938": { fill: "#d8b4fe", text: "#000000", border: "#6b21a8" }, // Purple
  "#331b00": { fill: "#fdba74", text: "#000000", border: "#c2410c" }, // Orange
  "#3c1618": { fill: "#fca5a5", text: "#000000", border: "#b91c1c" }, // Red
  "#3a1726": { fill: "#f9a8d4", text: "#000000", border: "#be185d" }, // Pink
  "#0f2e18": { fill: "#86efac", text: "#000000", border: "#15803d" }, // Green
  "#062822": { fill: "#5eead4", text: "#000000", border: "#0f766e" }, // Teal
}

interface TemplatePreviewProps {
  template: CanvasTemplate
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const { nodes, edges } = template
  const { theme } = useTheme()
  const isLight = theme === "light"

  if (!nodes || nodes.length === 0) return null

  // 1. Calculate boundaries of the nodes
  const minX = Math.min(...nodes.map((n) => n.position.x))
  const maxX = Math.max(...nodes.map((n) => n.position.x + (n.width || 100)))
  const minY = Math.min(...nodes.map((n) => n.position.y))
  const maxY = Math.max(...nodes.map((n) => n.position.y + (n.height || 50)))

  const graphW = maxX - minX
  const graphH = maxY - minY

  // Container dimensions
  const viewWidth = 280
  const viewHeight = 150
  const padding = 16

  const targetW = viewWidth - padding * 2
  const targetH = viewHeight - padding * 2

  // 2. Compute scale factor (preserve aspect ratio)
  const scaleX = graphW > 0 ? targetW / graphW : 1
  const scaleY = graphH > 0 ? targetH / graphH : 1
  // Cap the scale to avoid over-stretching very small diagrams
  const scale = Math.min(scaleX, scaleY, 0.9)

  // 3. Center offset
  const offsetX = padding + (targetW - graphW * scale) / 2
  const offsetY = padding + (targetH - graphH * scale) / 2

  // Helper to project nodes
  const getProjectedNode = (node: typeof nodes[0]) => {
    const x = offsetX + (node.position.x - minX) * scale
    const y = offsetY + (node.position.y - minY) * scale
    const w = (node.width || 100) * scale
    const h = (node.height || 50) * scale
    return { x, y, w, h }
  }

  // Project all nodes into a map for fast edge lookup
  const nodeMap = new Map<string, { x: number; y: number; w: number; h: number }>()
  nodes.forEach((n) => {
    nodeMap.set(n.id, getProjectedNode(n))
  })

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className="bg-bg-base border border-border-default/40 rounded-lg overflow-hidden select-none"
    >
      {/* 4. Render Edges */}
      {edges.map((edge) => {
        const source = nodeMap.get(edge.source)
        const target = nodeMap.get(edge.target)
        if (!source || !target) return null

        // Center points of source and target
        const sx = source.x + source.w / 2
        const sy = source.y + source.h / 2
        const tx = target.x + target.w / 2
        const ty = target.y + target.h / 2

        return (
          <line
            key={edge.id}
            x1={sx}
            y1={sy}
            x2={tx}
            y2={ty}
            stroke={isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.18)"}
            strokeWidth={1.5}
            strokeDasharray={edge.label ? "3 2" : undefined}
          />
        )
      })}

      {/* 5. Render Nodes */}
      {nodes.map((node) => {
        const proj = nodeMap.get(node.id)
        if (!proj) return null

        const { x, y, w, h } = proj
        const color = node.data.color || "#1F1F1F"
        const shape = node.data.shape || "rectangle"

        let resolvedFill = color
        let resolvedText = "#EDEDED"
        let resolvedBorder = isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)"

        if (isLight) {
          const lightColor = LIGHT_NODE_COLORS[color.toLowerCase() as keyof typeof LIGHT_NODE_COLORS]
          if (lightColor) {
            resolvedFill = lightColor.fill
            resolvedText = lightColor.text
            resolvedBorder = lightColor.border
          } else {
            resolvedFill = "#ffffff"
            resolvedText = "#18181b"
            resolvedBorder = "#8a8a93"
          }
        } else {
          if (color === "#10233D") resolvedText = "#52A8FF"
          else if (color === "#2E1938") resolvedText = "#BF7AF0"
          else if (color === "#331B00") resolvedText = "#FF990A"
          else if (color === "#3C1618") resolvedText = "#FF6166"
          else if (color === "#3A1726") resolvedText = "#F75F8F"
          else if (color === "#0F2E18") resolvedText = "#62C073"
          else if (color === "#062822") resolvedText = "#0AC7B4"
        }

        let shapeElement = null
        const strokeColor = resolvedBorder
        const strokeWidth = isLight ? 1.5 : 1

        if (shape === "diamond") {
          const points = `${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`
          shapeElement = (
            <polygon
              points={points}
              fill={resolvedFill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )
        } else if (shape === "hexagon") {
          const points = `${x + w * 0.25},${y} ${x + w * 0.75},${y} ${x + w},${y + h * 0.5} ${x + w * 0.75},${y + h} ${x + w * 0.25},${y + h} ${x},${y + h * 0.5}`
          shapeElement = (
            <polygon
              points={points}
              fill={resolvedFill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )
        } else if (shape === "cylinder") {
          const topLidH = h * 0.18
          shapeElement = (
            <g>
              <path
                d={`M ${x},${y + topLidH} L ${x},${y + h - topLidH} A ${w * 0.5},${topLidH} 0 0,0 ${x + w},${y + h - topLidH} L ${x + w},${y + topLidH} Z`}
                fill={resolvedFill}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <ellipse
                cx={x + w / 2}
                cy={y + topLidH}
                rx={w / 2}
                ry={topLidH}
                fill={resolvedFill}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </g>
          )
        } else if (shape === "pill") {
          shapeElement = (
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={h / 2}
              ry={h / 2}
              fill={resolvedFill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )
        } else if (shape === "circle") {
          shapeElement = (
            <ellipse
              cx={x + w / 2}
              cy={y + h / 2}
              rx={w / 2}
              ry={h / 2}
              fill={resolvedFill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )
        } else {
          // rectangle
          shapeElement = (
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={6}
              ry={6}
              fill={resolvedFill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )
        }

        return (
          <g key={node.id}>
            {shapeElement}
            <text
              x={x + w / 2}
              y={y + h / 2}
              fill={resolvedText}
              fontSize={Math.max(4.5, 6 * scale)}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {node.data.label ? (node.data.label.length > 10 ? `${node.data.label.slice(0, 8)}..` : node.data.label) : "Node"}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

interface StarterTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (template: CanvasTemplate) => void
}

export function StarterTemplatesModal({
  isOpen,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-6 bg-bg-surface border border-border-default rounded-2xl text-text-primary shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="gap-1 mb-4 shrink-0">
          <DialogTitle className="text-xl font-semibold tracking-tight text-text-primary flex items-center gap-2">
            Starter Templates
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            Kickstart your canvas design with one of our pre-built architectures. Selecting a template will overwrite your current canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="group flex flex-col justify-between rounded-xl bg-bg-base/40 border border-border-default hover:border-border-subtle p-4 transition-all duration-300 hover:shadow-xl hover:shadow-black/5"
              >
                <div>
                  <div className="aspect-[28/15] w-full mb-4 bg-bg-base rounded-lg overflow-hidden border border-border-default shadow-inner group-hover:border-border-subtle transition-colors duration-300">
                    <TemplatePreview template={template} />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1 group-hover:text-accent-primary transition-colors duration-200">
                    {template.name}
                  </h3>
                  <p className="text-xs text-text-secondary leading-normal mb-6 min-h-[48px]">
                    {template.description}
                  </p>
                </div>
                
                <Button
                  onClick={() => onImport(template)}
                  variant="secondary"
                  className="w-full text-xs font-semibold py-2 transition-all duration-200 rounded-lg shadow-sm"
                >
                  Import Template
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

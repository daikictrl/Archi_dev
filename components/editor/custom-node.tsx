"use client"

import React, { memo, useState, useRef, useEffect, useCallback } from "react"
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps } from "@xyflow/react"
import { type CanvasNode, NODE_COLORS } from "@/types/canvas"
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

// SVG shape renderer components
const DiamondShape = ({ fill, border, selected }: { fill: string; border: string; selected: boolean }) => (
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    className="absolute inset-0 w-full h-full pointer-events-none"
  >
    <polygon
      points="50,2 98,50 50,98 2,50"
      fill={fill}
      stroke={selected ? "var(--selection-outline)" : border}
      strokeWidth={selected ? 2.5 : 2}
      vectorEffect="non-scaling-stroke"
    />
  </svg>
)

const HexagonShape = ({ fill, border, selected }: { fill: string; border: string; selected: boolean }) => (
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    className="absolute inset-0 w-full h-full pointer-events-none"
  >
    <polygon
      points="25,2 75,2 98,50 75,98 25,98 2,50"
      fill={fill}
      stroke={selected ? "var(--selection-outline)" : border}
      strokeWidth={selected ? 2.5 : 2}
      vectorEffect="non-scaling-stroke"
    />
  </svg>
)

const CylinderShape = ({ fill, border, selected }: { fill: string; border: string; selected: boolean }) => (
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    className="absolute inset-0 w-full h-full pointer-events-none"
  >
    {/* Body / walls */}
    <path
      d="M 2,15 L 2,85 A 48,12 0 0,0 98,85 L 98,15 Z"
      fill={fill}
      stroke={selected ? "var(--selection-outline)" : border}
      strokeWidth={selected ? 2.5 : 2}
      vectorEffect="non-scaling-stroke"
    />
    {/* Top lid */}
    <ellipse
      cx="50"
      cy="15"
      rx="48"
      ry="12"
      fill={fill}
      stroke={selected ? "var(--selection-outline)" : border}
      strokeWidth={selected ? 2.5 : 2}
      vectorEffect="non-scaling-stroke"
    />
  </svg>
)

export const CustomNode = memo(({ id, data, selected }: NodeProps<CanvasNode>) => {
  const { updateNodeData } = useReactFlow()
  const shape = data.shape || "rectangle"
  const isSvg = shape === "diamond" || shape === "hexagon" || shape === "cylinder"
  const { theme } = useTheme()
  const isLight = theme === "light"

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(data.label || "")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [hoveredColorIndex, setHoveredColorIndex] = useState<number | null>(null)

  // Keep local value in sync with incoming data updates (e.g. from other users)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(data.label || "")
    }
  }, [data.label, isEditing])

  // Auto focus, select all, and adjust height on editing start
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
      textarea.focus()
      textarea.select()
    }
  }, [isEditing])

  // Adjust height on text change
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [localValue, isEditing])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setLocalValue(val)
    updateNodeData(id, { label: val })
  }, [id, updateNodeData])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setIsEditing(false)
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
    }
  }, [])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
  }, [])

  // get color config
  const colorConfig =
    NODE_COLORS.find((c) => c.fill.toLowerCase() === data.color?.toLowerCase()) ||
    NODE_COLORS[0]

  // Resolve dynamic colors based on active theme
  let resolvedFill = colorConfig.fill
  let resolvedText = colorConfig.text
  let resolvedBorder = "var(--border-default)"

  if (isLight) {
    const lightColor = LIGHT_NODE_COLORS[colorConfig.fill.toLowerCase() as keyof typeof LIGHT_NODE_COLORS]
    if (lightColor) {
      resolvedFill = lightColor.fill
      resolvedText = lightColor.text
      resolvedBorder = lightColor.border
    } else {
      resolvedFill = "#ffffff"
      resolvedText = "#18181b"
      resolvedBorder = "#8a8a93"
    }
  }

  let shapeClasses = ""
  if (isSvg) {
    shapeClasses = "bg-transparent border-transparent"
  } else {
    // CSS shapes
    if (shape === "rectangle") {
      shapeClasses = "rounded-xl border"
    } else {
      // pill or circle
      shapeClasses = "rounded-full border"
    }
  }

  const divStyle: React.CSSProperties = {
    color: resolvedText,
  }
  if (!isSvg) {
    divStyle.backgroundColor = resolvedFill
    divStyle.borderColor = selected ? "var(--selection-outline)" : resolvedBorder
    divStyle.borderWidth = selected ? "2.5px" : "2px"
    divStyle.borderStyle = "solid"
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`group relative w-full h-full flex items-center justify-center p-0.5 text-center transition-all duration-200 focus:outline-none ${shapeClasses}`}
      style={divStyle}
    >
      {/* Resizing controls */}
      <NodeResizer
        isVisible={!!selected && !isEditing}
        minWidth={1}
        minHeight={1}
        handleStyle={{
          width: 1.75,
          height: 1.75,
          background: "var(--selection-outline)",
          border: "1px solid var(--selection-outline)",
          borderRadius: "50%",
        }}
        lineStyle={{
          border: "0.5px dashed var(--text-muted)",
        }}
      />

      {/* Color picker toolbar */}
      {selected && !isEditing && (
        <div
          className="nodrag nopan absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-bg-surface border-2 border-border-default shadow-xl backdrop-blur-md rounded-full p-1.5 z-50 cursor-default select-none"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {NODE_COLORS.map((color, index) => {
            const isActive = colorConfig.fill.toLowerCase() === color.fill.toLowerCase()
            const isHovered = hoveredColorIndex === index

            // Resolve swatch preview colors based on active theme
            const resolvedSwatchFill = isLight
              ? (LIGHT_NODE_COLORS[color.fill.toLowerCase() as keyof typeof LIGHT_NODE_COLORS]?.fill || color.fill)
              : color.fill

            const resolvedSwatchText = isLight
              ? (LIGHT_NODE_COLORS[color.fill.toLowerCase() as keyof typeof LIGHT_NODE_COLORS]?.text || color.text)
              : color.text

            const resolvedSwatchBorder = isLight
              ? (LIGHT_NODE_COLORS[color.fill.toLowerCase() as keyof typeof LIGHT_NODE_COLORS]?.border || color.text)
              : color.text

            return (
              <button
                key={color.fill}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  updateNodeData(id, { color: color.fill })
                }}
                onMouseEnter={() => setHoveredColorIndex(index)}
                onMouseLeave={() => setHoveredColorIndex(null)}
                className="w-5 h-5 rounded-full cursor-pointer flex items-center justify-center transition-all duration-150 relative border"
                style={{
                  backgroundColor: resolvedSwatchFill,
                  borderColor: resolvedSwatchBorder,
                  borderWidth: isActive ? "2px" : "1.5px",
                  boxShadow: (isHovered || isActive) 
                    ? `0 0 6px 1px ${resolvedSwatchBorder}` 
                    : "0 1px 2px rgba(0, 0, 0, 0.1)",
                  transform: isHovered ? "scale(1.2)" : isActive ? "scale(1.1)" : "scale(1)",
                }}
                title={color.label}
              >
                {isActive && (
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-in fade-in zoom-in duration-100"
                    style={{ backgroundColor: resolvedSwatchText }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* SVG shape backgrounds if applicable */}
      {shape === "diamond" && <DiamondShape fill={resolvedFill} border={resolvedBorder} selected={!!selected} />}
      {shape === "hexagon" && <HexagonShape fill={resolvedFill} border={resolvedBorder} selected={!!selected} />}
      {shape === "cylinder" && <CylinderShape fill={resolvedFill} border={resolvedBorder} selected={!!selected} />}

      {/* Centered label or textarea */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="nodrag nopan absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[calc(100%-8px)] max-h-[calc(100%-8px)] bg-transparent text-center text-[16px] font-extrabold border-none outline-none resize-none focus:ring-0 focus:outline-none scrollbar-none"
          placeholder="Label"
          rows={1}
          style={{
            color: resolvedText,
            lineHeight: "20px",
          }}
        />
      ) : (
        <div 
          className="relative z-10 text-[16px] leading-[20px] font-extrabold select-none overflow-hidden text-center w-[calc(100%-8px)] max-h-[calc(100%-8px)]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {data.label || <span className="opacity-40 italic text-[16px]">Label</span>}
        </div>
      )}

      {/* Connection Handles: Top, Right, Bottom, Left */}
      {/* Each position has a target and source handle overlapping, hidden by default and shown on hover */}
      
      {/* Top handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!bg-[var(--text-primary)] !border !border-[var(--bg-base)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 animate-in fade-in"
        style={{ width: "6px", height: "6px" }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!bg-[var(--text-primary)] !border !border-[var(--bg-base)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 animate-in fade-in"
        style={{ width: "6px", height: "6px" }}
      />

      {/* Right handles */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!bg-[var(--text-primary)] !border !border-[var(--bg-base)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 animate-in fade-in"
        style={{ width: "6px", height: "6px" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!bg-[var(--text-primary)] !border !border-[var(--bg-base)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 animate-in fade-in"
        style={{ width: "6px", height: "6px" }}
      />

      {/* Bottom handles */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!bg-[var(--text-primary)] !border !border-[var(--bg-base)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 animate-in fade-in"
        style={{ width: "6px", height: "6px" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!bg-[var(--text-primary)] !border !border-[var(--bg-base)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 animate-in fade-in"
        style={{ width: "6px", height: "6px" }}
      />

      {/* Left handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!bg-[var(--text-primary)] !border !border-[var(--bg-base)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 animate-in fade-in"
        style={{ width: "6px", height: "6px" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!bg-[var(--text-primary)] !border !border-[var(--bg-base)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 animate-in fade-in"
        style={{ width: "6px", height: "6px" }}
      />
    </div>
  )
})

CustomNode.displayName = "CustomNode"

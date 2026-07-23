"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react"
import { useTheme } from "@/components/theme-provider"

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style = {},
  data = {},
  label,
}: EdgeProps) {
  const { setEdges } = useReactFlow()
  const { theme } = useTheme()
  const isLight = theme === "light"

  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState((label as string) || (data as any)?.label || "")
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto focus and select input text when editing begins
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        setIsEditing(false)
        setEdges((edges) =>
          edges.map((edge) =>
            edge.id === id
              ? {
                  ...edge,
                  label: localValue,
                  data: { ...edge.data, label: localValue },
                }
              : edge
          )
        )
      } else if (e.key === "Escape") {
        setIsEditing(false)
        setLocalValue((label as string) || (data as any)?.label || "")
      }
    },
    [id, localValue, label, data, setEdges]
  )

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === id
          ? {
              ...edge,
              label: localValue,
              data: { ...edge.data, label: localValue },
            }
          : edge
      )
    )
  }, [id, localValue, setEdges])

  // 1. Calculate path and midpoint
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  })

  // 2. Active highlight state
  const isActive = !!selected || isHovered
  const labelText = (label as string) || (data as any)?.label

  return (
    <>
      {/* Invisible wider hit region for easier mouse hover/clicks */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Visible edge line with smooth transition */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={
          isActive
            ? "var(--text-primary)"
            : "var(--text-faint)"
        }
        strokeWidth={isActive ? 2 : 1.25}
        strokeDasharray={isActive ? "none" : "5 5"}
        markerEnd={`url(#arrow-${id})`}
        style={style}
        className="transition-[stroke,stroke-width] duration-150 pointer-events-none"
      />

      {/* HTML Edge Label Renderer positioned at path midpoint */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan select-none z-30"
          onDoubleClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <div
              className={`relative inline-flex items-center min-w-[70px] max-w-[220px] h-7 border-2 border-accent-primary rounded-md px-2.5 py-0.5 shadow-lg ${
                isLight ? "bg-slate-900 text-white" : "bg-slate-800 text-slate-100"
              }`}
            >
              {/* Hidden text helper to automatically resize input container */}
              <span className="invisible whitespace-pre text-[11px] font-extrabold px-1">
                {localValue || "Add label"}
              </span>
              <input
                ref={inputRef}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder="Add label"
                className="absolute inset-0 w-full h-full bg-transparent text-[11px] font-extrabold text-center border-none outline-none focus:ring-0 focus:outline-none"
                style={{ color: "inherit" }}
              />
            </div>
          ) : labelText ? (
            <div
              onDoubleClick={handleDoubleClick}
              className={`border-1.5 text-[11px] font-extrabold tracking-wide px-3 py-0.5 rounded-full shadow-md backdrop-blur-sm cursor-pointer transition-all duration-150 hover:scale-105 ${
                isLight
                  ? "bg-slate-900 text-white border-slate-950 hover:bg-slate-800"
                  : "bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {labelText}
            </div>
          ) : (
            isActive && (
              <div
                onClick={handleDoubleClick}
                className={`border border-dashed text-[11px] font-medium italic px-2.5 py-0.5 rounded-full cursor-pointer transition-all duration-150 animate-in fade-in duration-200 ${
                  isLight
                    ? "bg-slate-900/90 text-slate-200 border-slate-700 hover:border-accent-primary hover:text-white"
                    : "bg-slate-800/90 text-slate-400 border-slate-700 hover:border-accent-primary hover:text-slate-100"
                }`}
              >
                Add label
              </div>
            )
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

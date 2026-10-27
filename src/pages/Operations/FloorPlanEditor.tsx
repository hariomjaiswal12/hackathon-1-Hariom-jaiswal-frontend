import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import { tableService } from "@/services/tableService"
import { formatApiError } from "@/lib/errors"
import type { Table, TableStatus } from "@/types/api"

const GRID = 10
const CANVAS = { width: 760, height: 460 }
const TABLE_SIZE = 76
const MIN_ZOOM = 0.6
const MAX_ZOOM = 1.8
const ZOOM_STEP = 0.2

type Draft = Table

function snap(value: number, max: number) {
  const snapped = Math.round(value / GRID) * GRID
  return Math.min(max, Math.max(0, snapped))
}

function samePosition(left: Table["position"], right: Table["position"]) {
  return left.x === right.x && left.y === right.y && left.rotation === right.rotation
}

function tileHeight(table: Draft) {
  return table.shape === "RECTANGLE" ? 52 : TABLE_SIZE
}

function overlaps(left: Draft, right: Draft) {
  const gap = 2
  const leftRight = left.position.x + TABLE_SIZE - gap
  const rightRight = right.position.x + TABLE_SIZE - gap
  const leftBottom = left.position.y + tileHeight(left) - gap
  const rightBottom = right.position.y + tileHeight(right) - gap
  return left.position.x < rightRight
    && right.position.x < leftRight
    && left.position.y < rightBottom
    && right.position.y < leftBottom
}

function statusTone(table: Draft) {
  if (!table.isActive) return "bg-stone-200 text-[var(--dark)] border-stone-500"
  if (table.status === "OUT_OF_SERVICE") return "bg-rose-100 text-rose-950 border-rose-700"
  if (table.status === "CLEANING") return "bg-amber-100 text-amber-950 border-amber-700"
  if (table.status === "OCCUPIED") return "bg-violet-100 text-violet-950 border-violet-800"
  if (table.status === "RESERVED") return "bg-sky-100 text-sky-950 border-sky-800"
  return "bg-emerald-50 text-emerald-950 border-emerald-800"
}

const controlClass = "px-3 py-2 text-[10px] uppercase font-bold tracking-wider border border-[var(--forest)] text-[var(--forest)] bg-white hover:bg-[var(--beige)] hover:text-[var(--dark)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forest)] disabled:border-[var(--dark)] disabled:text-[var(--dark)] disabled:bg-[var(--cream)] disabled:opacity-100"

export function FloorPlanEditor() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const panRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)
  const [tables, setTables] = useState<Draft[]>([])
  const [saved, setSaved] = useState<Draft[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panMode, setPanMode] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [active, inactive] = await Promise.all([
        tableService.listTables({ isActive: true }),
        tableService.listTables({ isActive: false }),
      ])
      const next = [...active, ...inactive]
      setTables(next)
      setSaved(next)
      setSelectedId((current) => (next.some((table) => table.id === current) ? current : ""))
    } catch (loadError) {
      setTables([])
      setSaved([])
      setError(formatApiError(loadError, "The floor plan could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const dirty = tables.some((table) => {
    const original = saved.find((item) => item.id === table.id)
    return original ? !samePosition(original.position, table.position) : false
  })

  const overlappingIds = useMemo(() => {
    const ids = new Set<string>()
    tables.forEach((table, index) => {
      tables.slice(index + 1).forEach((other) => {
        if (overlaps(table, other)) {
          ids.add(table.id)
          ids.add(other.id)
        }
      })
    })
    return ids
  }, [tables])

  const selected = tables.find((table) => table.id === selectedId) || null

  const canvasPoint = (event: PointerEvent<HTMLElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const bounds = canvas.getBoundingClientRect()
    const scaleX = bounds.width / CANVAS.width || 1
    const scaleY = bounds.height / CANVAS.height || 1
    return {
      x: (event.clientX - bounds.left) / scaleX,
      y: (event.clientY - bounds.top) / scaleY,
    }
  }

  const moveTable = (id: string, x: number, y: number) => {
    setTables((current) => current.map((table) => (
      table.id === id
        ? {
          ...table,
          position: {
            ...table.position,
            x: snap(x, CANVAS.width - TABLE_SIZE),
            y: snap(y, CANVAS.height - tileHeight(table)),
          },
        }
        : table
    )))
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (event.key === "Escape") {
        setSelectedId("")
        return
      }
      if (!selected || panMode) return
      const step = event.key === "ArrowLeft" ? [-GRID, 0]
        : event.key === "ArrowRight" ? [GRID, 0]
          : event.key === "ArrowUp" ? [0, -GRID]
            : event.key === "ArrowDown" ? [0, GRID]
              : null
      if (!step) return
      event.preventDefault()
      moveTable(selected.id, selected.position.x + step[0], selected.position.y + step[1])
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected, panMode])

  const setRotation = (rotation: number) => {
    if (!selected) return
    const next = Math.min(360, Math.max(0, rotation))
    setTables((current) => current.map((table) => (
      table.id === selected.id
        ? { ...table, position: { ...table.position, rotation: next } }
        : table
    )))
  }

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, table: Draft) => {
    if (panMode) {
      panRef.current = { x: pan.x, y: pan.y, originX: event.clientX, originY: event.clientY }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    const point = canvasPoint(event)
    dragRef.current = {
      id: table.id,
      dx: point.x - table.position.x,
      dy: point.y - table.position.y,
    }
    setSelectedId(table.id)
    setNotice("")
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (panRef.current) {
      setPan({
        x: panRef.current.x + event.clientX - panRef.current.originX,
        y: panRef.current.y + event.clientY - panRef.current.originY,
      })
      return
    }
    const drag = dragRef.current
    if (!drag) return
    const point = canvasPoint(event)
    moveTable(drag.id, point.x - drag.dx, point.y - drag.dy)
  }

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    dragRef.current = null
    panRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const onCanvasPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!panMode || event.target !== event.currentTarget) return
    panRef.current = { x: pan.x, y: pan.y, originX: event.clientX, originY: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onCanvasPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!panRef.current || event.currentTarget !== canvasRef.current?.parentElement) return
    setPan({
      x: panRef.current.x + event.clientX - panRef.current.originX,
      y: panRef.current.y + event.clientY - panRef.current.originY,
    })
  }

  const onCanvasPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    panRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const revert = () => {
    setTables(saved)
    setNotice("")
    setError("")
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const save = async () => {
    const changed = tables.filter((table) => {
      const original = saved.find((item) => item.id === table.id)
      return original && !samePosition(original.position, table.position)
    })
    if (changed.length === 0) return
    setSaving(true)
    setError("")
    setNotice("")
    try {
      for (const table of changed) {
        await tableService.updateTablePosition(table.id, table.position)
      }
      await load()
      setNotice("Floor layout saved.")
    } catch (saveError) {
      setError(formatApiError(saveError, "The floor layout could not be saved."))
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-8 bg-white border border-[var(--line)] p-4 md:p-5 max-w-full">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] tracking-[0.18em] uppercase text-[var(--copper)]">Layout</p>
          <h3 className="font-serif text-2xl text-[var(--forest)]">Floor plan</h3>
          <p className="text-xs text-[var(--dark)] mt-1">
            {panMode
              ? "Pan is on. Drag the floor to look around. Tables stay where they are."
              : "Drag a table to move it. Positions are saved with the existing floor coordinates."}
            {dirty ? " Unsaved changes." : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={controlClass} disabled={zoom <= MIN_ZOOM} onClick={() => setZoom((value) => Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2))))} aria-label="Zoom out">Zoom out</button>
          <button type="button" className={controlClass} disabled={zoom >= MAX_ZOOM} onClick={() => setZoom((value) => Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(2))))} aria-label="Zoom in">Zoom in</button>
          <button type="button" className={controlClass} onClick={resetView}>Reset view</button>
          <button
            type="button"
            aria-pressed={panMode}
            onClick={() => setPanMode((value) => !value)}
            className={panMode ? "px-3 py-2 text-[10px] uppercase tracking-wider bg-[var(--forest)] text-white hover:bg-[var(--dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]" : controlClass}
          >
            {panMode ? "Pan on" : "Pan"}
          </button>
          <button type="button" onClick={revert} disabled={!dirty || saving} className={controlClass}>Revert</button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider bg-[var(--forest)] text-white hover:bg-[var(--dark)] transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:bg-[var(--dark)] disabled:text-white disabled:opacity-100"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {loading ? <p className="text-xs uppercase tracking-wider text-[var(--dark)]">Loading floor plan</p> : null}
      {error ? (
        <p className="text-sm text-rose-950 mb-3" role="alert">
          {error}
          <button type="button" className="block mt-2 underline text-[var(--forest)]" onClick={load}>Retry</button>
        </p>
      ) : null}
      {notice ? <p className="text-sm text-[var(--forest)] mb-3">{notice}</p> : null}
      {overlappingIds.size > 0 ? (
        <p className="text-sm text-rose-950 bg-rose-50 border border-rose-300 px-3 py-2 mb-3" role="status">
          Layout warning: {overlappingIds.size} tables overlap on the plan. This is not a booking conflict. Saving is still allowed.
        </p>
      ) : null}

      {!loading && !error && tables.length === 0 ? (
        <p className="text-sm text-[var(--dark)]">No tables are available for the floor plan.</p>
      ) : null}

      {tables.length > 0 ? (
        <div
          className="max-w-full overflow-hidden border border-[var(--line)] bg-[var(--cream)] touch-none"
          style={{ height: 420 }}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
        >
          <div
            ref={canvasRef}
            className="relative"
            style={{
              width: CANVAS.width,
              height: CANVAS.height,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              backgroundImage: "linear-gradient(to right, rgba(23,60,50,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,60,50,0.08) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                aria-label={`Move table ${table.tableNumber}`}
                aria-pressed={selectedId === table.id}
                onPointerDown={(event) => onPointerDown(event, table)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className={`absolute flex flex-col items-center justify-center border-2 shadow-sm touch-none ${statusTone(table)} ${selectedId === table.id ? "ring-2 ring-[var(--forest)]" : ""} ${overlappingIds.has(table.id) ? "outline outline-2 outline-rose-700" : ""}`}
                style={{
                  width: TABLE_SIZE,
                  height: tileHeight(table),
                  left: table.position.x,
                  top: table.position.y,
                  transform: `rotate(${table.position.rotation}deg)`,
                  borderRadius: table.shape === "ROUND" ? "999px" : "2px",
                }}
              >
                <span className="font-serif text-lg leading-none">{table.tableNumber}</span>
                <span className="text-[10px]">{table.capacity} guests</span>
                <span className="text-[9px] uppercase tracking-wider">{table.isActive ? table.status : "INACTIVE"}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-2 text-[10px] uppercase tracking-wider text-[var(--dark)]">Zoom {Math.round(zoom * 100)}%</p>

      {selected ? (
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm text-[var(--dark)]">
          <div><dt className="text-[10px] uppercase tracking-wider">Table</dt><dd className="font-semibold">{selected.tableNumber}</dd></div>
          <div><dt className="text-[10px] uppercase tracking-wider">Capacity</dt><dd>{selected.capacity} guests</dd></div>
          <div><dt className="text-[10px] uppercase tracking-wider">Status</dt><dd>{selected.isActive ? selected.status : "INACTIVE"}</dd></div>
          <div><dt className="text-[10px] uppercase tracking-wider">Position</dt><dd>{selected.position.x}, {selected.position.y}</dd></div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-[10px] uppercase tracking-wider">Rotation</dt>
            <dd className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={360}
                step={15}
                value={selected.position.rotation}
                onChange={(event) => setRotation(Number(event.target.value))}
                aria-label="Rotate selected table"
              />
              <span>{selected.position.rotation}°</span>
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-xs text-[var(--dark)]">Select a table to see its number, capacity, status, position, and rotation. Arrow keys move the selected table by one grid step. Escape clears the selection.</p>
      )}

      <ul className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-[var(--dark)]">
        {(["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "OUT_OF_SERVICE"] as TableStatus[]).map((status) => (
          <li key={status} className={`border px-2 py-1 ${statusTone({ status, isActive: true } as Draft)}`}>{status}</li>
        ))}
        <li className="border px-2 py-1 bg-stone-200 border-stone-500">Inactive</li>
      </ul>
    </section>
  )
}

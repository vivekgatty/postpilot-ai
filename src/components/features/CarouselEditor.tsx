'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical, RefreshCw, X, Plus } from 'lucide-react'
import type { CarouselData, CarouselSlide, AuthorBranding } from '@/types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface CarouselEditorProps {
  carousel:           CarouselData
  authorBranding:     AuthorBranding
  onUpdate:           (updates: Partial<CarouselData>) => void
  onRegenerateSlide:  (slideId: string) => Promise<void>
  isRegenerating:     Record<string, boolean>
}

// ── Type badge helpers ─────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { bg: string; label: string }> = {
  title:   { bg: 'bg-teal-500',   label: 'Ti' },
  content: { bg: 'bg-blue-500',   label: 'Co' },
  summary: { bg: 'bg-purple-500', label: 'Su' },
  cta:     { bg: 'bg-coral-500',  label: 'CT' },
}

function TypeBadge({ type }: { type: CarouselSlide['type'] }) {
  const badge = TYPE_BADGE[type] ?? { bg: 'bg-gray-400', label: type.slice(0, 2) }
  return (
    <span className={`${badge.bg} text-white rounded px-1 py-0.5 text-[10px] font-semibold leading-none flex-shrink-0`}>
      {badge.label}
    </span>
  )
}

// ── Character counter ─────────────────────────────────────────────────────────

function CharCount({ n, max }: { n: number; max: number }) {
  const color = n > max * 0.9 ? 'text-red-500' : n > max * 0.7 ? 'text-amber-500' : 'text-[#1D9E75]'
  return <span className={`text-xs ${color}`}>{n}/{max}</span>
}

// ── Reorder helper ────────────────────────────────────────────────────────────

function reorder<T>(list: T[], from: number, to: number): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(from, 1)
  result.splice(to, 0, removed)
  return result
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CarouselEditor({
  carousel,
  authorBranding,
  onUpdate,
  onRegenerateSlide,
  isRegenerating,
}: CarouselEditorProps) {
  const [selectedSlideId, setSelectedSlideId] = useState<string>(
    carousel.slides[0]?.id ?? '',
  )

  // ── Add slide ───────────────────────────────────────────────────────────────

  function handleAddSlide() {
    const newSlide: CarouselSlide = {
      id:           `slide_${Date.now()}`,
      slide_number: carousel.slides.length + 1,
      type:         'content',
      heading:      'New slide',
      body:         'Add your content here.',
    }
    onUpdate({ slides: [...carousel.slides, newSlide] })
    setSelectedSlideId(newSlide.id)
  }

  // ── Drag end ────────────────────────────────────────────────────────────────

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const reordered = reorder(carousel.slides, result.source.index, result.destination.index)
    const renumbered = reordered.map((s, i) => ({ ...s, slide_number: i + 1 }))
    onUpdate({ slides: renumbered })
  }

  // ── Remove slide ────────────────────────────────────────────────────────────

  function handleRemoveSlide(slideId: string) {
    const updated = carousel.slides
      .filter(s => s.id !== slideId)
      .map((s, i) => ({ ...s, slide_number: i + 1 }))
    onUpdate({ slides: updated })
    if (selectedSlideId === slideId) {
      setSelectedSlideId(updated[0]?.id ?? '')
    }
  }

  // ── Selected slide helpers ───────────────────────────────────────────────────

  const selectedSlide = carousel.slides.find(s => s.id === selectedSlideId)

  function updateSelectedSlide(fields: Partial<CarouselSlide>) {
    const updated = carousel.slides.map(s =>
      s.id === selectedSlideId ? { ...s, ...fields } : s,
    )
    onUpdate({ slides: updated })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* ── SECTION A: Slide list ─────────────────────────────────────────── */}
      <div className="flex-shrink-0">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">
            Slides ({carousel.slides.length})
          </span>
          <button
            onClick={handleAddSlide}
            className="flex items-center gap-1 text-xs text-[#1D9E75] hover:text-[#178a65] font-medium"
          >
            <Plus size={13} />
            Add slide
          </button>
        </div>

        {/* Drag list */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="slide-list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="overflow-y-auto max-h-64"
              >
                {carousel.slides.map((slide, index) => {
                  const isSelected    = slide.id === selectedSlideId
                  const isRegen       = !!isRegenerating[slide.id]
                  const canDelete     = carousel.slides.length > 3

                  return (
                    <Draggable key={slide.id} draggableId={slide.id} index={index}>
                      {(drag) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          onClick={() => setSelectedSlideId(slide.id)}
                          className={`group flex items-center gap-2 px-3 h-14 cursor-pointer border-l-[3px] transition-colors ${
                            isSelected
                              ? 'border-[#1D9E75] bg-teal-50'
                              : 'border-transparent hover:bg-gray-50'
                          }`}
                        >
                          {/* Drag handle */}
                          <span
                            {...drag.dragHandleProps}
                            className="text-gray-300 flex-shrink-0"
                          >
                            <GripVertical size={14} />
                          </span>

                          {/* Type badge */}
                          <TypeBadge type={slide.type} />

                          {/* Heading */}
                          <span className="flex-1 text-[13px] text-gray-700 truncate">
                            {slide.heading.length > 32
                              ? slide.heading.slice(0, 32) + '…'
                              : slide.heading}
                          </span>

                          {/* Hover actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => { e.stopPropagation(); onRegenerateSlide(slide.id) }}
                              disabled={isRegen}
                              className="p-1 text-gray-400 hover:text-[#1D9E75] disabled:opacity-50"
                              title="Regenerate slide"
                            >
                              <RefreshCw
                                size={14}
                                className={isRegen ? 'animate-spin' : ''}
                              />
                            </button>

                            {canDelete && (
                              <button
                                onClick={e => { e.stopPropagation(); handleRemoveSlide(slide.id) }}
                                className="p-1 text-gray-400 hover:text-red-500"
                                title="Remove slide"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* ── SECTION B: Slide editor ───────────────────────────────────────── */}
      {selectedSlide && (
        <div className="flex-1 overflow-y-auto border-t border-gray-100 p-4 space-y-4">

          {/* Slide label + badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              Slide {selectedSlide.slide_number}
            </span>
            <TypeBadge type={selectedSlide.type} />
          </div>

          {/* ── Heading (all types) ── */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">Heading</label>
              <CharCount n={selectedSlide.heading.length} max={60} />
            </div>
            <input
              type="text"
              value={selectedSlide.heading}
              maxLength={60}
              onChange={e => updateSelectedSlide({ heading: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
            />
          </div>

          {/* ── Title slide: Sub-line ── */}
          {selectedSlide.type === 'title' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Sub-line (optional)</label>
              <input
                type="text"
                value={selectedSlide.sub_line ?? ''}
                maxLength={80}
                onChange={e => updateSelectedSlide({ sub_line: e.target.value })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
              />
            </div>
          )}

          {/* ── Content slide fields ── */}
          {selectedSlide.type === 'content' && (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Body text</label>
                  <CharCount n={selectedSlide.body.length} max={200} />
                </div>
                <textarea
                  value={selectedSlide.body}
                  maxLength={200}
                  rows={3}
                  onChange={e => updateSelectedSlide({ body: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] resize-none min-h-[72px]"
                  style={{ fieldSizing: 'content' } as React.CSSProperties}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Number badge (optional)</label>
                <input
                  type="text"
                  value={selectedSlide.number_badge ?? ''}
                  maxLength={2}
                  placeholder="01"
                  onChange={e => updateSelectedSlide({ number_badge: e.target.value })}
                  className="w-20 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
                />
                <p className="text-[11px] text-gray-400">e.g. 01, 02, A, B</p>
              </div>
            </>
          )}

          {/* ── CTA slide fields ── */}
          {selectedSlide.type === 'cta' && (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Body text</label>
                  <CharCount n={selectedSlide.body.length} max={150} />
                </div>
                <textarea
                  value={selectedSlide.body}
                  maxLength={150}
                  rows={3}
                  onChange={e => updateSelectedSlide({ body: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] resize-none min-h-[72px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Call to action text</label>
                <input
                  type="text"
                  value={selectedSlide.cta_text ?? ''}
                  maxLength={60}
                  placeholder="Follow me for more insights"
                  onChange={e => updateSelectedSlide({ cta_text: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Author name</label>
                <input
                  type="text"
                  value={selectedSlide.author_name ?? authorBranding.full_name}
                  maxLength={50}
                  onChange={e => updateSelectedSlide({ author_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Author handle</label>
                <input
                  type="text"
                  value={selectedSlide.author_handle ?? `@${authorBranding.handle}`}
                  maxLength={50}
                  onChange={e => updateSelectedSlide({ author_handle: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
                />
              </div>
            </>
          )}

          {/* ── Regenerate button ── */}
          <button
            onClick={() => onRegenerateSlide(selectedSlideId)}
            disabled={!!isRegenerating[selectedSlideId]}
            className="flex items-center gap-2 w-full justify-center border border-gray-200 rounded-md px-4 py-2 text-sm text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              size={14}
              className={isRegenerating[selectedSlideId] ? 'animate-spin' : ''}
            />
            Regenerate this slide
          </button>
        </div>
      )}
    </div>
  )
}

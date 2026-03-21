'use client'

import { useState } from 'react'
import { Draggable, Droppable, DragDropContext, DropResult } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'
import { FORMAT_ICONS } from '@/lib/plannerConfig'
import type { ContentBankItem, ContentPillar } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  items:           ContentBankItem[]
  pillars:         ContentPillar[]
  suggestions:     { title: string; topic: string; pillar_name?: string }[]
  onAddItem:       (item: { title: string; topic: string; hook: string; pillar_id: string | null; format: string }) => Promise<void>
  onMarkUsed:      (itemId: string) => void
  onDeleteItem:    (itemId: string) => void
  onDragStart:     (item: ContentBankItem) => void
  onSaveSuggestion:(title: string, topic: string) => Promise<void>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContentBankSidebar({
  items, pillars, suggestions,
  onAddItem, onMarkUsed, onDeleteItem, onDragStart, onSaveSuggestion,
}: Props) {
  const [filterPillar, setFilterPillar] = useState<string | null>(null)
  const [filterSource, setFilterSource] = useState<string | null>(null)
  const [showAddForm, setShowAddForm]   = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Add form state
  const [addTitle, setAddTitle]         = useState('')
  const [addTopic, setAddTopic]         = useState('')
  const [addHook, setAddHook]           = useState('')
  const [addPillar, setAddPillar]       = useState<string>('')
  const [addFormat, setAddFormat]       = useState('text')
  const [isAdding, setIsAdding]         = useState(false)

  const handleAdd = async () => {
    if (!addTitle.trim()) return
    setIsAdding(true)
    await onAddItem({ title: addTitle, topic: addTopic, hook: addHook, pillar_id: addPillar || null, format: addFormat })
    setAddTitle(''); setAddTopic(''); setAddHook(''); setAddPillar(''); setAddFormat('text')
    setShowAddForm(false)
    setIsAdding(false)
  }

  const filtered = items.filter((item) => {
    if (item.is_used) return false
    if (filterPillar && item.pillar_id !== filterPillar) return false
    if (filterSource && item.source !== filterSource) return false
    return true
  })

  // DnD: content bank items are draggable to the calendar
  const handleDragEnd: (result: DropResult) => void = () => {
    // Calendar handles the drop via window.__dragBankItem
  }

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#0A2540] flex items-center gap-2">
            Content Bank
            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="text-xs text-[#1D9E75] font-semibold hover:underline"
          >
            + Add idea
          </button>
        </div>

        {/* Pillar filter pills */}
        <div className="flex flex-wrap gap-1 mb-2">
          <button
            type="button"
            onClick={() => setFilterPillar(null)}
            className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium transition-all', !filterPillar ? 'bg-[#0A2540] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
          >
            All
          </button>
          {pillars.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFilterPillar(filterPillar === p.id ? null : p.id)}
              className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium transition-all text-white')}
              style={{ backgroundColor: filterPillar === p.id ? p.color : `${p.color}88` }}
            >
              {p.name.slice(0, 10)}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <div className="flex gap-1">
          {[null, 'idea_lab', 'hook_generator', 'ai_suggestion'].map((src) => {
            const labels: Record<string, string> = { idea_lab: 'Ideas', hook_generator: 'Hooks', ai_suggestion: 'AI' }
            return (
              <button
                key={String(src)}
                type="button"
                onClick={() => setFilterSource(src)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full transition-all',
                  filterSource === src ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                )}
              >
                {src === null ? 'All sources' : labels[src] ?? src}
              </button>
            )
          })}
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <input
            autoFocus
            placeholder="Title *"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 mb-2 focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
          />
          <input
            placeholder="Topic (optional)"
            value={addTopic}
            onChange={(e) => setAddTopic(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 mb-2 focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
          />
          <input
            placeholder="Hook (optional)"
            value={addHook}
            onChange={(e) => setAddHook(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 mb-2 focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
          />
          <div className="flex gap-2 mb-2">
            <select
              value={addPillar}
              onChange={(e) => setAddPillar(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="">No pillar</option>
              {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              value={addFormat}
              onChange={(e) => setAddFormat(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
            >
              {Object.entries(FORMAT_ICONS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} disabled={isAdding || !addTitle.trim()}
              className="flex-1 py-1.5 bg-[#1D9E75] text-white text-xs font-semibold rounded-lg disabled:opacity-40">
              Add to bank
            </button>
            <button type="button" onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="content-bank" isDropDisabled>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {filtered.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={`bank-${item.id}`}
                    index={index}
                  >
                    {(draggable, snapshot) => (
                      <div
                        ref={draggable.innerRef}
                        {...draggable.draggableProps}
                        {...draggable.dragHandleProps}
                        onMouseDown={() => {
                          ;(window as Window & { __dragBankItem?: ContentBankItem }).__dragBankItem = item
                          onDragStart(item)
                        }}
                        className={cn(
                          'p-3 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group',
                          snapshot.isDragging && 'shadow-lg ring-2 ring-[#1D9E75]/30',
                          item.pillar?.color && 'border-l-2',
                        )}
                        style={item.pillar?.color ? { borderLeftColor: item.pillar.color } : {}}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#0A2540] truncate">{item.title}</p>
                            {item.hook && (
                              <p className="text-[10px] text-gray-400 italic truncate mt-0.5">{item.hook}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-gray-300 uppercase tracking-wide">{FORMAT_ICONS[item.format]} {item.format}</span>
                              <span className="text-[9px] text-gray-300">·</span>
                              <span className="text-[9px] text-gray-300 capitalize">{item.source?.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              type="button"
                              onClick={() => onMarkUsed(item.id)}
                              className="text-[9px] text-gray-400 hover:text-[#1D9E75] transition-colors"
                              title="Mark as used"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item.id)}
                              className="text-[9px] text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">No ideas yet.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-xs text-[#1D9E75] hover:underline"
            >
              Add your first idea
            </button>
          </div>
        )}
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-gray-100 px-3 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 font-semibold">Suggested for you</p>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((s, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs font-medium text-[#0A2540] truncate">{s.title}</p>
                {s.topic && <p className="text-[10px] text-gray-400 truncate">{s.topic}</p>}
                <button
                  type="button"
                  onClick={() => onSaveSuggestion(s.title, s.topic ?? '')}
                  className="text-[10px] text-[#1D9E75] hover:underline mt-1"
                >
                  Save to bank →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] flex-shrink-0 border-r border-[#E5E4E0] bg-white h-full overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile toggle tab */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-20 bg-[#1D9E75] text-white text-[10px] font-bold py-6 px-1 rounded-r-lg shadow-lg writing-vertical-lr rotate-180"
        style={{ writingMode: 'vertical-lr' }}
      >
        Content Bank
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setIsMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-40 w-[280px] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <span className="text-sm font-bold text-[#0A2540]">Content Bank</span>
              <button type="button" onClick={() => setIsMobileOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="h-[calc(100%-48px)] overflow-hidden">
              {sidebarContent}
            </div>
          </aside>
        </>
      )}
    </>
  )
}

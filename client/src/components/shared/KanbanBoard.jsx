import { cn } from '@/lib/utils';

export function KanbanBoard({ columns, renderCard, onDrop, className }) {
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, columnId) => {
    const itemId = e.dataTransfer.getData('itemId');
    const fromColumn = e.dataTransfer.getData('fromColumn');
    if (itemId && onDrop) onDrop(itemId, fromColumn, columnId);
  };

  return (
    <div className={cn('kanban-board', className)}>
      {columns.map(col => (
        <div
          key={col.id}
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={e => handleDrop(e, col.id)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {col.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />}
              <h3 className="font-semibold text-sm">{col.label}</h3>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{col.items.length}</span>
            </div>
            {col.totalValue !== undefined && (
              <span className="text-xs text-muted-foreground font-medium">{col.totalValue}</span>
            )}
          </div>
          <div className="space-y-2 min-h-[100px]">
            {col.items.map(item => (
              <div
                key={item._id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('itemId', item._id);
                  e.dataTransfer.setData('fromColumn', col.id);
                }}
              >
                {renderCard(item, col)}
              </div>
            ))}
            {col.items.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-lg h-20 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Drop here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

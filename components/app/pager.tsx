import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Pager({ page, totalPages, total, onPage }: { page: number; totalPages: number; total?: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-[13px] text-muted-foreground">
      <span className="num">{total !== undefined ? `${total.toLocaleString()} total · ` : ''}page {page} of {Math.max(1, totalPages)}</span>
      <div className="flex gap-1.5">
        <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft /></Button>
        <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight /></Button>
      </div>
    </div>
  );
}

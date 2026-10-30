import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type Column<T> = { header: string; cell: (row: T) => React.ReactNode; className?: string; align?: 'right' };

export function DataTable<T>({
  columns, rows, rowKey, loading, empty = 'Nothing here yet.',
}: { columns: Column<T>[]; rows: T[] | undefined; rowKey: (row: T, i: number) => string | number; loading?: boolean; empty?: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((c) => (
            <TableHead key={c.header} className={cn(c.align === 'right' && 'text-right')}>{c.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && !rows
          ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {columns.map((c) => (
                  <TableCell key={c.header}><Skeleton className="h-4 w-full max-w-32" /></TableCell>
                ))}
              </TableRow>
            ))
          : rows?.length
            ? rows.map((row, i) => (
                <TableRow key={rowKey(row, i)}>
                  {columns.map((c) => (
                    <TableCell key={c.header} className={cn(c.align === 'right' && 'text-right', c.className)}>{c.cell(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="py-10 text-center text-[13px] text-muted-foreground">{empty}</TableCell>
                </TableRow>
              )}
      </TableBody>
    </Table>
  );
}

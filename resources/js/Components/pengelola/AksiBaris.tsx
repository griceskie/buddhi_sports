import DeleteButton from '@/Components/DeleteButton';
import { Button } from '@/Components/ui/button';
import { Pencil } from 'lucide-react';

/** Edit dan Hapus berupa ikon di ujung baris tabel panel Admin (kanvas "Redesign Dashboard Admin"). */
export default function AksiBaris({ nama, onEdit, hapus }: { nama: string; onEdit?: () => void; hapus?: string }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {onEdit && (
                <Button variant="ghost" size="icon-sm" className="size-8 text-muted-foreground" aria-label={`Edit ${nama}`} onClick={onEdit}>
                    <Pencil />
                </Button>
            )}
            {hapus && <DeleteButton href={hapus} method="delete" label={`Hapus ${nama}`} />}
        </span>
    );
}

import { Button, buttonVariants } from '@/Components/ui/button';
import {
    Sheet,
    SheetBody,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/Components/ui/sheet';
import { FormEventHandler, ReactNode, useState } from 'react';

/**
 * State for a Tambah/Edit sheet on a TampilData page. `row` is null when adding.
 * `versi` changes on every open; use it as the form's `key` so the fields start fresh.
 */
export function useFormSheet<T>() {
    const [state, setState] = useState<{ open: boolean; row: T | null; versi: number }>({
        open: false,
        row: null,
        versi: 0,
    });

    return {
        ...state,
        buka: (row: T | null = null) => setState((s) => ({ open: true, row, versi: s.versi + 1 })),
        tutup: () => setState((s) => ({ ...s, open: false })),
    };
}

/** Side sheet that holds a master-data form; stays mounted so it can animate out. */
export default function FormSheet({
    open,
    onClose,
    className,
    children,
}: {
    open: boolean;
    onClose: () => void;
    className?: string;
    children: ReactNode;
}) {
    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className={className}>{children}</SheetContent>
        </Sheet>
    );
}

/** Header, scrolling fields and a Batal / Simpan footer, inside a FormSheet. */
export function SheetForm({
    title,
    description,
    onSubmit,
    processing,
    submitLabel = 'Simpan',
    children,
}: {
    title: string;
    description?: ReactNode;
    onSubmit: FormEventHandler;
    processing: boolean;
    submitLabel?: string;
    children: ReactNode;
}) {
    return (
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetHeader>
                <SheetTitle>{title}</SheetTitle>
                {description && <SheetDescription>{description}</SheetDescription>}
            </SheetHeader>

            <SheetBody className="space-y-4 pb-4">{children}</SheetBody>

            <SheetFooter>
                <SheetClose className={buttonVariants({ variant: 'outline' })}>Batal</SheetClose>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Menyimpan…' : submitLabel}
                </Button>
            </SheetFooter>
        </form>
    );
}

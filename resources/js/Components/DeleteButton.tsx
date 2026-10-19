import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/Components/ui/alert-dialog';
import { buttonVariants } from '@/Components/ui/button';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';

/** "Hapus" button for the TampilData tables; asks before visiting `href`. */
export default function DeleteButton({
    href,
    message = 'Yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.',
}: {
    href: string;
    message?: string;
}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger
                className={buttonVariants({ variant: 'destructive', size: 'sm' })}
            >
                <Trash2 />
                Hapus
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus data?</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={() => router.get(href)}
                    >
                        Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

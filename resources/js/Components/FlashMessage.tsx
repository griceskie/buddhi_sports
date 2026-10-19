import { Alert, AlertTitle } from '@/Components/ui/alert';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheck } from 'lucide-react';

export default function FlashMessage() {
    const { flash } = usePage<PageProps>().props;

    if (!flash?.error && !flash?.success) {
        return null;
    }

    return (
        <div className="mb-4 space-y-2">
            {flash.error && (
                <Alert variant="destructive">
                    <CircleAlert />
                    <AlertTitle>{flash.error}</AlertTitle>
                </Alert>
            )}
            {flash.success && (
                <Alert variant="success">
                    <CircleCheck />
                    <AlertTitle>{flash.success}</AlertTitle>
                </Alert>
            )}
        </div>
    );
}

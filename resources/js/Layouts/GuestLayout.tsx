import Wordmark from '@/Components/Wordmark';
import { Link } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

export default function Guest({
    title,
    description,
    children,
}: PropsWithChildren<{ title?: ReactNode; description?: ReactNode }>) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-backgrounds-grouped-primary px-4 pt-6 sm:justify-center sm:pt-0">
            <Link href="/">
                <Wordmark className="text-xl" />
            </Link>

            <div className="mt-6 w-full rounded-lg border bg-card p-6 text-card-foreground shadow-sm sm:max-w-md">
                {(title || description) && (
                    <div className="mb-6 space-y-1.5">
                        {title && (
                            <h1 className="text-lg leading-none font-semibold">
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

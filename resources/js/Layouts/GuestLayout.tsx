import AuthScene from '@/Components/auth/AuthScene';
import { PropsWithChildren, ReactNode } from 'react';

/**
 * Frame for the guest pages: no card, a 360px column in the middle of the canvas and sports objects
 * around it (AuthScene). Optional `title` and `description` become the page heading.
 */
export default function Guest({
    title,
    description,
    children,
}: PropsWithChildren<{ title?: ReactNode; description?: ReactNode }>) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-canvas px-5 pt-28 pb-40 text-foreground min-[1100px]:px-6 min-[1100px]:py-12">
            <AuthScene />

            <main className="relative z-10 my-auto w-full max-w-[360px] self-center">
                {(title || description) && (
                    <div className="mb-7 space-y-1.5">
                        {title && (
                            <h1 className="text-[26px] leading-8 font-semibold tracking-[-0.01em] min-[1100px]:text-[28px] min-[1100px]:leading-[34px]">
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className="text-[15px] leading-[22px] text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                )}
                {children}
            </main>
        </div>
    );
}

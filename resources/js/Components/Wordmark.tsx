import { cn } from 'cn';

/** The product name set in type; the repository has no Buddhi Sports logo. */
export default function Wordmark({ className }: { className?: string }) {
    return (
        <span className={cn('shrink-0 font-semibold text-foreground', className)}>
            Buddhi Sports
        </span>
    );
}

import { Input } from '@/Components/ui/input';
import { cn } from 'cn';
import { Eye, EyeOff } from 'lucide-react';
import { ComponentProps, useState } from 'react';

/** Input password dengan tombol mata untuk menampilkan/menyembunyikan isinya. */
export default function PasswordInput({
    className,
    ...props
}: Omit<ComponentProps<typeof Input>, 'type'>) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <Input
                {...props}
                type={visible ? 'text' : 'password'}
                className={cn('pr-10', className)}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            >
                {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
        </div>
    );
}

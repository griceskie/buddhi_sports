import { useModeGelap } from '@/Components/pengelola/tema';
import { Button } from '@/Components/ui/button';
import { Moon, Sun } from 'lucide-react';

/** Tombol ikon pengalih mode terang/gelap panel pengelola (login dan header). */
export default function TombolTema({ className }: { className?: string }) {
    const [gelap, setGelap] = useModeGelap();

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className={className}
            aria-label={gelap ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            aria-pressed={gelap}
            onClick={() => setGelap(!gelap)}
        >
            {gelap ? <Moon /> : <Sun />}
        </Button>
    );
}

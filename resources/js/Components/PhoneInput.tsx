import { Input } from '@/Components/ui/input';
import { ComponentProps, useLayoutEffect, useRef } from 'react';

const MAX_DIGITS = 13;

/** Groups a phone number as 4-4-rest so it is easier to check: "081234567890" -> "0812 3456 7890". */
export function formatPhone(digits: string) {
    return [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8)]
        .filter(Boolean)
        .join(' ');
}

/** Phone number input: shows the digits in groups, hands back the digits only (no spaces). */
export default function PhoneInput({
    value,
    onValueChange,
    onKeyDown,
    ...props
}: Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> & {
    value: string;
    onValueChange: (digits: string) => void;
}) {
    const ref = useRef<HTMLInputElement>(null);
    // How many digits sit before the caret after an edit, so the caret survives the regrouping.
    const caret = useRef<number | null>(null);

    useLayoutEffect(() => {
        const el = ref.current;
        if (el && caret.current !== null && document.activeElement === el) {
            let pos = 0;
            for (let seen = 0; pos < el.value.length && seen < caret.current; pos++) {
                if (/\d/.test(el.value[pos])) seen++;
            }
            el.setSelectionRange(pos, pos);
        }
        caret.current = null;
    });

    const update = (raw: string, caretPos: number) => {
        caret.current = raw.slice(0, caretPos).replace(/\D/g, '').length;
        onValueChange(raw.replace(/\D/g, '').slice(0, MAX_DIGITS));
    };

    return (
        <Input
            {...props}
            ref={ref}
            type="tel"
            inputMode="numeric"
            value={formatPhone(value)}
            onChange={(e) =>
                update(e.target.value, e.target.selectionStart ?? e.target.value.length)
            }
            onKeyDown={(e) => {
                // Backspace just after a space deletes the digit before it, not only the space.
                const el = e.currentTarget;
                const pos = el.selectionStart ?? 0;
                if (e.key === 'Backspace' && pos === el.selectionEnd && el.value[pos - 1] === ' ') {
                    e.preventDefault();
                    update(el.value.slice(0, pos - 2) + el.value.slice(pos), pos - 2);
                }
                onKeyDown?.(e);
            }}
        />
    );
}

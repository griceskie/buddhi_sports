import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';

type Option = { value: string; label: string };

// Base UI uses null for "no value"; the forms use ''.
const toItem = (v: string) => (v === '' ? null : v);

/**
 * Select for the master-data forms. Works on plain strings like the old
 * <select>: an empty string means "nothing chosen" and shows `placeholder`.
 * An option with value '' (e.g. "-") lets the user clear an optional field.
 */
export default function FormSelect({
    id,
    value,
    onChange,
    options,
    placeholder = 'Pilih...',
    className,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}) {
    return (
        <Select
            items={options.map((o) => ({ ...o, value: toItem(o.value) }))}
            value={toItem(value)}
            onValueChange={(v) => onChange(v == null ? '' : String(v))}
        >
            <SelectTrigger id={id} className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((o) => (
                    <SelectItem key={o.value} value={toItem(o.value)}>
                        {o.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

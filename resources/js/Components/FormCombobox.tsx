import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/Components/ui/combobox';

type Option = { value: string; label: string };

/**
 * Searchable counterpart of FormSelect for long lists (Penyewa, Booking): type to filter.
 * Works on plain strings like FormSelect; an empty string means "nothing chosen".
 */
export default function FormCombobox({
    id,
    value,
    onChange,
    options,
    placeholder = 'Cari...',
    clearable = false,
    className,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    /** Show the × that empties the field; turn off for required fields that always have a value. */
    clearable?: boolean;
    className?: string;
}) {
    return (
        <Combobox
            items={options}
            value={options.find((o) => o.value === value) ?? null}
            onValueChange={(o) => onChange(o?.value ?? '')}
            itemToStringLabel={(o) => o.label}
            isItemEqualToValue={(a, b) => a.value === b.value}
        >
            <ComboboxInput id={id} className={className} placeholder={placeholder} showClear={clearable} />
            <ComboboxContent>
                <ComboboxEmpty />
                <ComboboxList>
                    {(o: Option) => (
                        <ComboboxItem key={o.value} value={o}>
                            {o.label}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}

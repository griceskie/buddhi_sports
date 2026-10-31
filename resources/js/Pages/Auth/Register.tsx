import InputError from '@/Components/InputError';
import PasswordInput from '@/Components/PasswordInput';
import PhoneInput from '@/Components/PhoneInput';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        namaPenyewa: '',
        noHp: '',
        email: '',
        password: '',
        password_confirmation: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout
            title="Welcome👐, mate!"
            description="You'll need an account before booking a court. It only takes a minute."
        >
            <Head title="Create an account" />

            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="namaPenyewa">Your name</Label>

                    <Input
                        id="namaPenyewa"
                        name="namaPenyewa"
                        value={data.namaPenyewa}
                        autoComplete="name"
                        placeholder="Budi Santoso"
                        autoFocus
                        onChange={(e) => setData('namaPenyewa', e.target.value)}
                        required
                    />

                    <InputError message={errors.namaPenyewa} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="noHp">Phone number</Label>

                    <PhoneInput
                        id="noHp"
                        name="noHp"
                        value={data.noHp}
                        autoComplete="tel"
                        placeholder="0812 3456 7890"
                        aria-describedby="noHp-hint"
                        onValueChange={(digits) => setData('noHp', digits)}
                        required
                    />

                    <p id="noHp-hint" className="text-[13px] leading-[18px] text-muted-foreground">
                        In case we need to reach you about a booking.
                    </p>

                    <InputError message={errors.noHp} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>

                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        placeholder="you@email.com"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>

                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        autoComplete="new-password"
                        aria-describedby="password-hint"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <p id="password-hint" className="text-[13px] leading-[18px] text-muted-foreground">
                        At least 8 characters.
                    </p>

                    <InputError message={errors.password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">Confirm password</Label>

                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError message={errors.password_confirmation} />
                </div>

                <Label className="font-normal text-foreground">
                    <Checkbox
                        name="remember"
                        className="rounded-[4px]"
                        checked={data.remember}
                        onCheckedChange={(checked) =>
                            setData('remember', checked)
                        }
                    />
                    Keep me logged in
                </Label>

                <Button
                    type="submit"
                    variant="elevated"
                    size="lg"
                    className="mt-2 w-full"
                    disabled={processing}
                >
                    Create account
                </Button>
            </form>

            <p className="mt-7 text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                    href={route('login')}
                    className="text-primary hover:underline"
                >
                    Log in
                </Link>
            </p>
        </GuestLayout>
    );
}

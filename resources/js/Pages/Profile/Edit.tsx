import { Card, CardContent } from '@/Components/ui/card';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    status,
}: PageProps<{ status?: string }>) {
    return (
        <PenyewaLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="space-y-6">
                <Card>
                    <CardContent className="sm:px-8">
                        <UpdateProfileInformationForm
                            status={status}
                            className="max-w-xl"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="sm:px-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="sm:px-8">
                        <DeleteUserForm className="max-w-xl" />
                    </CardContent>
                </Card>
            </div>
        </PenyewaLayout>
    );
}

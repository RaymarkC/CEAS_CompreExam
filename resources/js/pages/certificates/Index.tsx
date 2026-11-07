import { DefenseOutcomeEditor, type AcademicOutcome } from '@/components/defense-outcome-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
type Certificate = {
    id: number;
    status: string;
    released_at: string | null;
    email_status: string;
    emailed_at: string | null;
    download_url: string | null;
    history: { event: string; at: string }[];
};
type Item = {
    id: number;
    title: string;
    stage: string;
    student: string;
    eligible: boolean;
    outcome: AcademicOutcome | null;
    certificate: Certificate | null;
};
function CertificateItem({ item, isAA }: { item: Item; isAA: boolean }) {
    const form = useForm({ pdf: null as File | null, email: false as boolean });
    const cert = item.certificate;
    return (
        <article className="bg-card text-card-foreground space-y-3 rounded-lg border p-5">
            <h2 className="font-semibold">
                {item.student} · {item.stage}
            </h2>
            <p>{item.title}</p>
            <DefenseOutcomeEditor id={item.id} stage={item.stage} outcome={item.outcome} canEdit={false} />
            <p className="text-sm">Certificate: {cert?.status.replaceAll('-', ' ') || 'Not requested'}</p>
            {!item.eligible && (
                <p className="text-muted-foreground text-sm">
                    A current Coordinator-recorded Done + Passed outcome is required before requesting or releasing a certificate.
                </p>
            )}
            {!isAA && item.eligible && !cert && (
                <Button onClick={() => router.post(`/certificates/request/${item.id}`, {}, { preserveScroll: true })}>Request for Certificate</Button>
            )}
            {cert?.download_url && (
                <a className="inline-block underline" href={cert.download_url}>
                    Download certificate PDF
                </a>
            )}
            {cert?.released_at && (
                <p className="text-muted-foreground text-sm">
                    Released: {new Date(cert.released_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
                </p>
            )}
            {isAA && cert && item.eligible && (
                <form
                    className="space-y-3 border-t pt-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(`/certificates/${cert.id}/release`, { forceFormData: true, preserveScroll: true, onSuccess: () => form.reset() });
                    }}
                >
                    <label className="block text-sm">
                        Certificate PDF (maximum 10 MB)
                        <Input
                            required
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(e) => form.setData('pdf', e.target.files?.[0] ?? null)}
                        />
                    </label>
                    <label className="flex gap-2 text-sm">
                        <input type="checkbox" checked={form.data.email} onChange={(e) => form.setData('email', e.target.checked)} />
                        Also email the PDF to the student’s registered email
                    </label>
                    {!!Object.values(form.errors).length && (
                        <p role="alert" className="text-destructive">
                            {Object.values(form.errors).join(' ')}
                        </p>
                    )}
                    <Button disabled={form.processing}>{form.data.email ? 'Release and email PDF' : 'Release PDF to student'}</Button>
                </form>
            )}
            {isAA && cert?.download_url && (
                <div className="space-y-2">
                    <p>
                        Email status: {cert.email_status}
                        {cert.emailed_at ? ` · ${new Date(cert.emailed_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}` : ''}
                    </p>
                    <Button variant="outline" onClick={() => router.post(`/certificates/${cert.id}/email`, {}, { preserveScroll: true })}>
                        {cert.email_status === 'failed' ? 'Retry email PDF' : 'Send PDF by email'}
                    </Button>
                </div>
            )}
            {isAA && !!cert?.history.length && (
                <details>
                    <summary className="cursor-pointer text-sm">Delivery history</summary>
                    {cert.history.map((entry, i) => (
                        <p className="text-sm" key={i}>
                            {entry.event} · {entry.at}
                        </p>
                    ))}
                </details>
            )}
        </article>
    );
}
export default function Certificates({ items, isAA }: { items: Item[]; isAA: boolean }) {
    const { flash, errors } = usePage<{ flash?: { success?: string }; errors: Record<string, string> }>().props;
    return (
        <AppLayout breadcrumbs={[{ title: 'Certificates', href: '/certificates' }]}>
            <Head title="Certificates" />
            <main className="mx-auto max-w-5xl space-y-5 p-6">
                <h1 className="text-2xl font-semibold">{isAA ? 'Certificate Requests' : 'My Defense Certificates'}</h1>
                <p className="text-muted-foreground">
                    Certificates relate to a particular defense. They do not automatically establish program completion or graduation.
                </p>
                {flash?.success && (
                    <p role="status" className="rounded border p-3">
                        {flash.success}
                    </p>
                )}
                {!!Object.values(errors).length && (
                    <p role="alert" className="text-destructive">
                        {Object.values(errors).join(' ')}
                    </p>
                )}
                {items.map((item) => (
                    <CertificateItem key={`${item.id}-${item.certificate?.released_at}-${item.certificate?.email_status}`} item={item} isAA={isAA} />
                ))}
                {!items.length && <p>No {isAA ? 'certificate requests' : 'defense requests'} yet.</p>}
            </main>
        </AppLayout>
    );
}

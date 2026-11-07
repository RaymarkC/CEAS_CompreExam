import { useForm, usePage } from '@inertiajs/react';
import React from 'react';

const LinkLegacy: React.FC = () => {
    const { props } = usePage();
    const { linked, status, lastValidatedAt, lastError } = props as {
        linked?: boolean;
        status?: string;
        lastValidatedAt?: string;
        lastError?: string;
    };
    const form = useForm({ legacy_username: '', legacy_password: '' });

    return (
        <div className="mx-auto max-w-xl p-6">
            <h1 className="mb-4 text-2xl font-semibold">Link Legacy Account</h1>
            {linked ? (
                <div className="space-y-4">
                    <div className="rounded border bg-green-50 p-4">
                        <p className="font-medium">Linked status: {status}</p>
                        {lastValidatedAt && <p>Last validated: {lastValidatedAt}</p>}
                        {lastError && <p className="text-red-600">Last error: {lastError}</p>}
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.delete(route('legacy.link.unlink'));
                        }}
                    >
                        <button className="rounded bg-red-600 px-4 py-2 text-white" type="submit">
                            Unlink
                        </button>
                    </form>
                </div>
            ) : (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route('legacy.link.submit'));
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium">Legacy Username</label>
                        <input
                            className="mt-1 w-full rounded border px-3 py-2"
                            value={form.data.legacy_username}
                            onChange={(e) => form.setData('legacy_username', e.target.value)}
                            required
                        />
                        {form.errors.legacy_username && <p className="text-sm text-red-600">{form.errors.legacy_username}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Legacy Password</label>
                        <input
                            type="password"
                            className="mt-1 w-full rounded border px-3 py-2"
                            value={form.data.legacy_password}
                            onChange={(e) => form.setData('legacy_password', e.target.value)}
                            required
                        />
                        {form.errors.legacy_password && <p className="text-sm text-red-600">{form.errors.legacy_password}</p>}
                    </div>
                    <button disabled={form.processing} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50" type="submit">
                        {form.processing ? 'Linking...' : 'Link Legacy Account'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default LinkLegacy;

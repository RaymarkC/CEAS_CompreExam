import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';

interface Props {
    status?: string;
    canResetPassword?: boolean;
}

const LoginV2: React.FC<Props> = () => {
    const { data, setData, post, processing, errors } = useForm<{ identifier: string; password: string; remember: boolean }>({
        identifier: '',
        password: '',
        remember: false,
    });
    const [showPw, setShowPw] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login.v2'));
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
            <Head title="Debug Login V2" />
            <div className="w-full max-w-md space-y-6">
                <div className="rounded border border-yellow-300 bg-yellow-100 px-4 py-3 text-sm text-yellow-800">
                    <strong>Debug Login V2:</strong> OAuth bypassed. Not for production use.
                </div>
                <form onSubmit={submit} className="space-y-4 rounded bg-white px-6 py-6 shadow">
                    <h1 className="text-xl font-semibold text-gray-800">Login (V2 - No OAuth)</h1>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Identifier</label>
                        <input
                            className="w-full rounded border px-3 py-2 text-sm focus:border-blue-400 focus:ring focus:outline-none"
                            value={data.identifier}
                            onChange={(e) => setData('identifier', e.target.value)}
                            placeholder="student number or username"
                            autoComplete="username"
                            required
                        />
                        {errors.identifier && <p className="text-xs text-red-600">{errors.identifier}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="w-full rounded border px-3 py-2 pr-10 text-sm focus:border-blue-400 focus:ring focus:outline-none"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((s) => !s)}
                                className="absolute inset-y-0 right-0 px-3 text-xs text-gray-500 hover:text-gray-700"
                            >
                                {showPw ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                        <input id="remember" type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />
                        <label htmlFor="remember" className="text-sm">
                            Remember me
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Logging in...' : 'Login'}
                        </button>
                        <a href={route('login')} className="text-xs text-gray-500 underline hover:text-gray-700">
                            Standard login
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginV2;

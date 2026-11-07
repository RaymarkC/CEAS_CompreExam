import InputError from '@/components/input-error';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEventHandler } from 'react';

type LoginForm = { identifier: string; password: string; remember: boolean };
type LoginProps = { status?: string; canResetPassword: boolean; googleEnabled: boolean };

export default function Login({ status, canResetPassword, googleEnabled }: LoginProps) {
    const googleError = usePage<{ errors: { google?: string } }>().props.errors.google;
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({ identifier: '', password: '', remember: false });
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };
    const inputClass =
        'mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60';

    return (
        <main className="bg-muted/40 text-foreground flex min-h-svh items-center justify-center px-4 py-6 [color-scheme:light] dark:[color-scheme:dark]">
            <Head title="Log in" />
            <div className="border-border bg-card text-card-foreground grid w-full max-w-[800px] overflow-hidden rounded-2xl border shadow-lg md:grid-cols-2">
                <section className="px-6 py-8 sm:px-10 md:py-9" aria-labelledby="login-title">
                    <header className="text-center">
                        <h1 id="login-title" className="text-[22px] leading-7 font-semibold tracking-tight">
                            Graduate School System
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm leading-5">Login to your UIC account</p>
                    </header>
                    {status && (
                        <p role="status" className="mt-4 text-center text-sm text-green-700 dark:text-green-400">
                            {status}
                        </p>
                    )}
                    <form onSubmit={submit} className="mt-7">
                        <div>
                            <label htmlFor="identifier" className="block text-sm leading-5 font-medium">
                                Email or Student Number
                            </label>
                            <input
                                id="identifier"
                                name="identifier"
                                type="text"
                                autoComplete="username"
                                required
                                value={data.identifier}
                                onChange={(e) => setData('identifier', e.target.value)}
                                placeholder="Email or Student Number"
                                className={inputClass}
                                aria-invalid={!!errors.identifier}
                                aria-describedby={errors.identifier ? 'identifier-error' : undefined}
                            />
                            <div id="identifier-error">
                                <InputError message={errors.identifier} className="mt-1" />
                            </div>
                        </div>
                        <div className="mt-5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm leading-5">
                                <label htmlFor="password" className="font-medium">
                                    Password
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-muted-foreground decoration-border hover:text-foreground focus-visible:outline-ring whitespace-nowrap underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Password"
                                className={inputClass}
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? 'password-error' : undefined}
                            />
                            <div id="password-error">
                                <InputError message={errors.password} className="mt-1" />
                            </div>
                        </div>
                        <label htmlFor="remember" className="mt-5 flex w-fit cursor-pointer items-center gap-2 text-sm leading-5">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="border-input accent-primary focus-visible:outline-ring h-4 w-4 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2"
                            />
                            Remember me
                        </label>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait disabled:opacity-70"
                        >
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}Log in
                        </button>
                    </form>
                    <div className="text-muted-foreground mt-5 flex items-center gap-3 text-xs leading-5" aria-hidden="true">
                        <span className="bg-border h-px flex-1" />
                        OR
                        <span className="bg-border h-px flex-1" />
                    </div>
                    {googleEnabled ? (
                        <a
                            href={route('auth.google.redirect')}
                            className="border-input bg-background text-foreground hover:bg-accent focus-visible:outline-ring mt-5 flex h-11 w-full items-center justify-center rounded-lg border text-sm font-medium shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            Continue with Google
                        </a>
                    ) : (
                        <button
                            type="button"
                            disabled
                            title="Google sign-in is currently unavailable"
                            className="border-input bg-background text-muted-foreground mt-5 h-11 w-full rounded-lg border text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Continue with Google
                        </button>
                    )}
                    {googleError && (
                        <div role="alert" className="mt-2">
                            <InputError message={googleError} />
                        </div>
                    )}
                </section>
                <div className="relative hidden items-center justify-center bg-[#ff4b64] p-6 md:flex" aria-hidden="true">
                    <img src="/grad_logo.png" alt="" className="w-full max-w-[350px] object-contain" />
                    <div className="pointer-events-none absolute inset-0 bg-black/0 dark:bg-black/15" />
                </div>
            </div>
        </main>
    );
}

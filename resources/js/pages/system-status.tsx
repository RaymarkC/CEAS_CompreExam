import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Database, Users, XCircle, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'System Status',
        href: '/system-status',
    },
];

interface SystemCheck {
    name: string;
    status: 'checking' | 'success' | 'error';
    message: string;
    icon: React.ComponentType<{ className?: string }>;
}

export default function SystemStatus() {
    const [checks, setChecks] = useState<SystemCheck[]>([
        {
            name: 'Database Connection',
            status: 'checking',
            message: 'Checking database connectivity...',
            icon: Database,
        },
        {
            name: 'User Authentication',
            status: 'checking',
            message: 'Verifying authentication system...',
            icon: Users,
        },
        {
            name: 'Notification Storage',
            status: 'checking',
            message: 'Checking notification storage...',
            icon: Zap,
        },
    ]);

    const runSystemChecks = useCallback(async () => {
        setChecks((current) => current.map((check) => ({ ...check, status: 'checking' })));
        try {
            const response = await fetch('/system-status/checks', { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Unable to run server checks.');
            const result: { checks: { status: 'success' | 'error'; message: string }[] } = await response.json();
            setChecks((current) => current.map((check, index) => ({ ...check, ...result.checks[index] })));
        } catch {
            setChecks((current) =>
                current.map((check) => ({
                    ...check,
                    status: 'error',
                    message: 'Server checks could not be completed. Check your connection and sign-in.',
                })),
            );
        }
    }, []);

    useEffect(() => {
        runSystemChecks();
    }, [runSystemChecks]);
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <AlertCircle className="h-5 w-5 animate-pulse text-yellow-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return <Badge className="bg-green-100 text-green-800">Operational</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="secondary">Checking...</Badge>;
        }
    };

    const allChecksComplete = checks.every((check) => check.status !== 'checking');
    const hasErrors = checks.some((check) => check.status === 'error');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Status" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">System Status</h1>
                        <p className="text-sm text-gray-500">Real-time status of Graduate School Management System components</p>
                    </div>
                    <Button onClick={runSystemChecks} disabled={!allChecksComplete}>
                        {allChecksComplete ? 'Run Checks Again' : 'Running Checks...'}
                    </Button>
                </div>

                {/* Overall Status */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {allChecksComplete ? (
                                hasErrors ? (
                                    <XCircle className="h-8 w-8 text-red-500" />
                                ) : (
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                )
                            ) : (
                                <AlertCircle className="h-8 w-8 animate-pulse text-yellow-500" />
                            )}
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {!allChecksComplete ? 'System Check in Progress' : hasErrors ? 'System Issues Detected' : 'Server Checks Passed'}
                                </h2>
                                <p className="text-muted-foreground">
                                    {!allChecksComplete
                                        ? 'Checking the database, session, and notification storage...'
                                        : hasErrors
                                          ? 'Some system components need attention'
                                          : 'Database, session, and notification storage checks passed.'}
                                </p>
                            </div>
                        </div>
                        {getStatusBadge(!allChecksComplete ? 'checking' : hasErrors ? 'error' : 'success')}
                    </div>
                </Card>

                {/* Individual System Checks */}
                <div className="grid gap-4 md:grid-cols-2">
                    {checks.map((check, index) => {
                        const Icon = check.icon;
                        return (
                            <Card key={index} className="p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <Icon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-foreground text-sm font-medium">{check.name}</h3>
                                            {getStatusIcon(check.status)}
                                        </div>
                                        <p
                                            className={`mt-1 text-sm ${
                                                check.status === 'error'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : check.status === 'success'
                                                      ? 'text-green-700 dark:text-green-400'
                                                      : 'text-muted-foreground'
                                            }`}
                                        >
                                            {check.message}
                                        </p>
                                        <div className="mt-2">{getStatusBadge(check.status)}</div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Messaging System Details */}
                <Card className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">Messaging System Features</h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Private Conversations</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Group Messaging</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Real-time Updates</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Message History</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Unread Indicators</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">User Search</span>
                        </div>
                    </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Refresh Status
                        </Button>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}

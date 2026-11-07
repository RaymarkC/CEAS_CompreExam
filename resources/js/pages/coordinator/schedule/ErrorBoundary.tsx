import React from 'react';

type ErrorBoundaryProps = {
    children: React.ReactNode;
    fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
    hasError: boolean;
    error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // You can log errorInfo to an error reporting service here
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="p-8 text-center text-red-600">
                        <h2 className="mb-2 text-xl font-bold">Something went wrong.</h2>
                        <pre className="rounded bg-red-50 p-2">{this.state.error?.message}</pre>
                    </div>
                )
            );
        }
        return this.props.children;
    }
}

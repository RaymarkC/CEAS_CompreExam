export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
    return error instanceof Error ? error.message : fallback;
}

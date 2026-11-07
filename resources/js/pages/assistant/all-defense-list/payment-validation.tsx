import { Separator } from '@/components/ui/separator';
import { BadgeDollarSign, FileText, X } from 'lucide-react';
import { useState } from 'react';

type PaymentValidationProps = {
    details: {
        attachments?: { proof_of_payment?: string | null };
        amount?: number;
        reference_no?: string;
        expected_rate?: number | string; // <-- Add this
    };
    resolveFileUrl: (url?: string | null) => string | null;
};

export default function PaymentValidationSection({ details, resolveFileUrl }: PaymentValidationProps) {
    const [showPreview, setShowPreview] = useState(false);
    const proofUrl = details?.attachments?.proof_of_payment ? resolveFileUrl(details.attachments.proof_of_payment) : null;

    // Helper: check if file is image
    function isImage(url: string | null) {
        if (!url) return false;
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }

    // Helper to format PHP currency
    function formatPhp(val: number | string | undefined | null) {
        if (val === undefined || val === null || val === '') return '—';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return '—';
        return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }

    // Compare paid vs expected
    const paid = details?.amount ?? null;
    const expected = details?.expected_rate ?? null;
    const isMatch = paid !== null && expected !== null && Number(paid) === Number(expected);

    return (
        <div className="space-y-6 rounded-xl border bg-white p-8 dark:bg-zinc-900">
            <h2 className="text-medium mb-4 flex items-center gap-2 font-medium">
                <BadgeDollarSign className="h-5 w-5" /> Payment Validation
            </h2>
            <Separator className="mb-4" />

            {/* Proof of Payment */}
            <div>
                <div className="text-muted-foreground mb-1 text-xs">Proof of Payment</div>
                {proofUrl ? (
                    isImage(proofUrl) ? (
                        <>
                            <img
                                src={proofUrl}
                                alt="Proof of Payment"
                                className="h-32 w-32 cursor-pointer rounded border object-cover transition hover:scale-105"
                                onClick={() => setShowPreview(true)}
                                style={{ objectFit: 'cover' }}
                            />
                            {/* Fullscreen preview modal */}
                            {showPreview && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                                    onClick={() => setShowPreview(false)}
                                >
                                    <div className="relative">
                                        <img src={proofUrl} alt="Proof of Payment Full" className="max-h-[90vh] max-w-[90vw] rounded shadow-lg" />
                                        <button
                                            className="absolute top-2 right-2 rounded-full bg-white/80 p-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowPreview(false);
                                            }}
                                        >
                                            <X className="h-5 w-5 text-black" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:bg-muted flex w-fit items-center gap-2 rounded-md border bg-white px-3 py-2 transition dark:bg-zinc-900"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">Download</span>
                            <span className="text-muted-foreground ml-2 max-w-[180px] truncate text-xs">{proofUrl.split('/').pop()}</span>
                        </a>
                    )
                ) : (
                    <span className="text-muted-foreground text-sm">No file uploaded.</span>
                )}
            </div>

            {/* Amount Paid */}
            <div>
                <div className="text-muted-foreground mb-1 text-xs">Amount Paid</div>
                <div className="text-sm font-medium">{formatPhp(paid)}</div>
            </div>

            {/* Expected Amount */}
            <div>
                <div className="text-muted-foreground mb-1 text-xs">Expected Amount</div>
                <div className={`text-sm font-medium ${isMatch ? 'text-green-700' : 'text-red-600'}`}>
                    {formatPhp(expected)}
                    {paid !== null && expected !== null && !isMatch && <span className="ml-2 text-xs font-semibold text-red-600">(Mismatch)</span>}
                </div>
            </div>

            {/* Reference No. */}
            <div>
                <div className="text-muted-foreground mb-1 text-xs">Reference No.</div>
                <div className="text-sm font-medium">{details?.reference_no || '—'}</div>
            </div>
        </div>
    );
}

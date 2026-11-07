import type { User } from '@/types';

export type WorkflowHistoryEntry = {
    to_state?: string;
    from_state?: string;
    previous_state?: string;
    new_state?: string;
    event_type?: string;
    status_change?: string;
    type?: string;
    description?: string;
    details?: string;
    note?: string;
    remarks?: string;
    performed_at?: string;
    performed_by_name?: string;
    performed_by?: string;
    action?: string;
    state?: string;
    status?: string;
    label?: string;
    notes?: string;
    comment?: string;
    reason?: string;
    timestamp?: string;
    at?: string;
    date?: string;
    created_at?: string;
    updated_at?: string;
    by?: string;
    user?: { name?: string };
    user_name?: string;
    actor?: string;
    actor_name?: string;
    updated_by?: string;
    from?: string;
    to?: string;
};

export type DefenseAttachments = Partial<
    Record<
        | 'advisers_endorsement'
        | 'rec_endorsement'
        | 'proof_of_payment'
        | 'manuscript_proposal'
        | 'similarity_index'
        | 'avisee_adviser_attachment'
        | 'ai_detection_certificate'
        | 'endorsement_form',
        string | null
    >
>;

export type DefenseOverview = DefenseAttachments & {
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    school_id: string;
    program: string;
    program_level?: string;
    thesis_title: string;
    defense_type: string;
    status: string;
    normalized_status?: string;
    workflow_state?: string;
    priority: string;
    submitted_by?: number | string | { id: number };
    submitted_at?: string;
    created_at?: string;
    updated_at?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    defense_adviser?: string;
    date_of_defense: string;
    mode_defense: string;
    panelists?: { id: string | number; name?: string }[];
};

export type DocumentTemplateOption = { id: number; name: string; code: string };
export type RequestActionResponse<T> = {
    ok?: boolean;
    workflow_state?: string;
    workflow_history?: WorkflowHistoryEntry[];
    status?: string;
    success?: boolean;
    message?: string;
    error?: string;
    errors?: Record<string, string | string[]>;
    request?: T;
    defenseRequest?: T;
};
export type DirectoryUser = Partial<User> & { id: number; name: string; role: string; email: string };

export type StudentProgressSummary = {
    stage: string | null;
    status: string;
    enrollment_year: number | null;
    completion_year: number | null;
    semester?: string | null;
    subjects?: { code?: string | null; title?: string | null }[];
    updated_at?: string | null;
};
export type ProgressFilters = { stage: string; enrollment: string; completion: string; semester: string; subject: string; sort: string };
export const defaultProgressFilters: ProgressFilters = { stage: '', enrollment: '', completion: '', semester: '', subject: '', sort: 'updated-desc' };
export function filterStudentProgress<
    T extends { id: number; first_name?: string | null; last_name?: string | null; progress?: StudentProgressSummary },
>(students: T[], filters: ProgressFilters): T[] {
    const result = students.filter(({ progress: p }) => {
        if (filters.stage && (p?.stage || 'not-started') !== filters.stage) return false;
        if (filters.enrollment && (p?.enrollment_year?.toString() || 'unknown') !== filters.enrollment) return false;
        if (
            filters.completion &&
            (filters.completion === 'not-verified' ? p?.completion_year != null : p?.completion_year?.toString() !== filters.completion)
        )
            return false;
        if (filters.semester && p?.semester !== filters.semester) return false;
        const subject = filters.subject.trim().toLowerCase();
        return !subject || (p?.subjects ?? []).some((row) => `${row.code || ''} ${row.title || ''}`.toLowerCase().includes(subject));
    });
    return result.sort((a, b) => {
        if (filters.sort === 'name')
            return `${a.last_name || ''} ${a.first_name || ''}`.localeCompare(`${b.last_name || ''} ${b.first_name || ''}`) || a.id - b.id;
        const enrollment = filters.sort.startsWith('enrollment');
        const value = (student: T) =>
            enrollment ? (student.progress?.enrollment_year ?? null) : student.progress?.updated_at ? Date.parse(student.progress.updated_at) : null;
        const av = value(a),
            bv = value(b);
        const aMissing = av === null || !Number.isFinite(av),
            bMissing = bv === null || !Number.isFinite(bv);
        if (aMissing || bMissing) return aMissing === bMissing ? a.id - b.id : aMissing ? 1 : -1;
        return (filters.sort.endsWith('asc') ? av! - bv! : bv! - av!) || a.id - b.id;
    });
}

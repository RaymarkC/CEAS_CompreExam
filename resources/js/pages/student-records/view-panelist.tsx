import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React from 'react';

interface PanelRow {
    chair: string;
    member: string;
}

interface ViewPanelistProps {
    isOpen: boolean;
    onClose: () => void;
}

const panelData: PanelRow[] = [
    { chair: 'Chair Person 1', member: 'Panelist 1' },
    { chair: 'Chair Person 2', member: 'Panelist 2' },
    { chair: 'Chair Person 3', member: 'Panelist 3' },
];

const ViewPanelist: React.FC<ViewPanelistProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="relative h-[60vh] w-1/2 overflow-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                {/* Header */}
                <div className="mb-4 flex h-10 items-center justify-center rounded-t-lg bg-rose-500">
                    <h2 className="font-semibold text-white">Panelists</h2>
                </div>

                {/* Table using same interface as IndividualRecord */}
                <Table className="min-w-full text-sm">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Chair Name</TableHead>
                            <TableHead>Member Name</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {panelData.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell>{row.chair}</TableCell>
                                <TableCell>{row.member}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Close Button styled like IndividualRecord Cancel */}
                <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ViewPanelist;

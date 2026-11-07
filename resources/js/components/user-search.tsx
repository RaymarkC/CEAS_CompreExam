import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Filter, GraduationCap, Search, UserCheck, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
    id: number;
    name: string;
    role: string;
    email: string;
    school_id?: string;
    program?: string;
}

interface UserSearchProps {
    selectedUsers: number[];
    onUserSelect: (user: User) => void;
    onUserRemove: (userId: number) => void;
    conversationType: 'private' | 'group';
    className?: string;
}

export default function UserSearch({ selectedUsers, onUserSelect, onUserRemove, conversationType, className }: UserSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Debounced search
    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            // Messaging feature removed: no remote search; keep empty results
            setIsSearching(false);
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, roleFilter]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    const getRoleIcon = (role: string) => {
        switch (role.toLowerCase()) {
            case 'student':
                return <GraduationCap className="h-4 w-4" />;
            case 'dean':
            case 'coordinator':
            case 'administrative assistant':
                return <UserCheck className="h-4 w-4" />;
            default:
                return <Users className="h-4 w-4" />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role.toLowerCase()) {
            case 'student':
                return 'bg-blue-100 text-blue-800';
            case 'dean':
                return 'bg-purple-100 text-purple-800';
            case 'coordinator':
                return 'bg-green-100 text-green-800';
            case 'administrative assistant':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getSelectedUserDetails = () => {
        return selectedUsers
            .map((userId) => {
                const user = searchResults.find((u) => u.id === userId);
                return user;
            })
            .filter(Boolean);
    };

    return (
        <div className={cn('space-y-3', className)}>
            {/* Search Input */}
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, role, school ID, or program..."
                            className="pl-9"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn(showFilters && 'bg-gray-100')}>
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="space-y-2 rounded-md bg-gray-50 p-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600">Filter by Role</label>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="Student">Students</SelectItem>
                                    <SelectItem value="Coordinator">Coordinators</SelectItem>
                                    <SelectItem value="Dean">Deans</SelectItem>
                                    <SelectItem value="Administrative Assistant">Administrative Assistants</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Users Display */}
            {selectedUsers.length > 0 && (
                <div className="rounded-md bg-blue-50 p-3">
                    <div className="mb-2 text-xs font-medium text-blue-700">
                        Selected {conversationType === 'private' ? 'User' : 'Users'} ({selectedUsers.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {getSelectedUserDetails().map((user) => {
                            if (!user) return null;
                            return (
                                <div key={user.id} className="flex items-center space-x-1 rounded-md border bg-white px-2 py-1">
                                    <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium">{user.name}</span>
                                    <button onClick={() => onUserRemove(user.id)} className="ml-1 text-gray-400 hover:text-red-500">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Search Results */}
            <div className="max-h-64 overflow-y-auto rounded-md border">
                {isSearching ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                        <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                        Searching users...
                    </div>
                ) : searchQuery.length >= 2 ? (
                    searchResults.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                            <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                            No users found matching "{searchQuery}"{roleFilter !== 'all' && <div className="mt-1">with role "{roleFilter}"</div>}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    className={cn(
                                        'flex cursor-pointer items-center space-x-3 p-3 transition-colors hover:bg-gray-50',
                                        selectedUsers.includes(user.id) && 'bg-blue-50 hover:bg-blue-100',
                                    )}
                                    onClick={() => onUserSelect(user)}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="truncate text-sm font-medium text-gray-900">{user.name}</h4>
                                            {selectedUsers.includes(user.id) && (
                                                <Badge variant="default" className="text-xs">
                                                    Selected
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <div className="flex items-center space-x-1">
                                                {getRoleIcon(user.role)}
                                                <Badge className={cn('text-xs', getRoleBadgeColor(user.role))}>{user.role}</Badge>
                                            </div>
                                            {user.program && (
                                                <Badge variant="outline" className="text-xs">
                                                    {user.program}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">{user.email}</p>
                                        {user.school_id && <p className="text-xs text-gray-400">ID: {user.school_id}</p>}
                                    </div>
                                    <div className="flex-shrink-0">
                                        {selectedUsers.includes(user.id) ? (
                                            <div className="text-blue-500">✓</div>
                                        ) : (
                                            <div className="text-gray-300">+</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                        <Search className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        Type at least 2 characters to search users
                        <div className="mt-2 text-xs">You can search by name, email, role, school ID, or program</div>
                    </div>
                )}
            </div>

            {/* Search Tips */}
            {searchQuery.length === 0 && (
                <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
                    <strong>Search Tips:</strong>
                    <ul className="mt-1 space-y-1">
                        <li>• Search by first name, last name, or full name</li>
                        <li>• Use email addresses to find specific users</li>
                        <li>• Filter by role (Student, Coordinator, Dean, etc.)</li>
                        <li>• Search by school ID or academic program</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

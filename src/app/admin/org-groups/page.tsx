'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Users, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/log';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  company_name?: string;
}

interface OrganizationGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_organization: Organization;
  member_count: { count: number }[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminOrgGroupsPage() {
  const [groups, setGroups] = useState<OrganizationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Create group modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    owner_organization_id: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, [currentPage, searchTerm]);

  async function loadGroups() {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/org-groups?${params}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to load groups' }));
        throw new Error(error.error);
      }

      const data = await response.json();
      setGroups(data.data || []);
      setPagination(data.pagination);
    } catch (error: any) {
      logger.error('Failed to load organization groups', {
        component: 'admin-org-groups',
        error: error.message
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to load groups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function createGroup() {
    if (!newGroup.name || !newGroup.owner_organization_id) {
      toast({
        title: 'Validation Error',
        description: 'Name and owner organization ID are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreateLoading(true);

      const response = await fetch('/api/admin/org-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGroup)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create group' }));
        throw new Error(error.error);
      }

      const data = await response.json();
      
      // Add new group to the list
      setGroups(prev => [data.data, ...prev]);
      
      // Reset form
      setNewGroup({ name: '', description: '', owner_organization_id: '' });
      setShowCreateGroup(false);

      toast({
        title: 'Success',
        description: 'Organization group created successfully',
      });
    } catch (error: any) {
      logger.error('Failed to create organization group', {
        component: 'admin-org-groups',
        error: error.message
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to create group',
        variant: 'destructive',
      });
    } finally {
      setCreateLoading(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  }

  function getMemberCount(group: OrganizationGroup): number {
    return group.member_count?.[0]?.count || 0;
  }

  if (loading && groups.length === 0) {
    return (
      <div className=\"container mx-auto px-6 py-8\">
        <div className=\"animate-pulse\">
          <div className=\"h-8 bg-gray-200 rounded w-64 mb-6\"></div>
          <div className=\"space-y-4\">
            {[...Array(5)].map((_, i) => (
              <div key={i} className=\"h-20 bg-gray-200 rounded\"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=\"container mx-auto px-6 py-8\">
      <div className=\"flex justify-between items-center mb-6\">
        <h1 className=\"text-3xl font-bold\">Organization Groups</h1>
        
        <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
          <DialogTrigger asChild>
            <Button>
              <Plus className=\"h-4 w-4 mr-2\" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization Group</DialogTitle>
            </DialogHeader>
            <div className=\"space-y-4 mt-4\">
              <div>
                <label htmlFor=\"name\" className=\"block text-sm font-medium mb-1\">
                  Group Name *
                </label>
                <Input
                  id=\"name\"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder=\"Enter group name\"
                />
              </div>
              
              <div>
                <label htmlFor=\"description\" className=\"block text-sm font-medium mb-1\">
                  Description
                </label>
                <Textarea
                  id=\"description\"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder=\"Optional description\"
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor=\"owner_org_id\" className=\"block text-sm font-medium mb-1\">
                  Owner Organization ID *
                </label>
                <Input
                  id=\"owner_org_id\"
                  value={newGroup.owner_organization_id}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, owner_organization_id: e.target.value }))}
                  placeholder=\"UUID of the owner organization\"
                />
                <p className=\"text-sm text-gray-500 mt-1\">
                  You must be an admin of this organization to create a group
                </p>
              </div>
            </div>
            
            <div className=\"flex justify-end gap-2 mt-6\">
              <Button
                variant=\"outline\"
                onClick={() => setShowCreateGroup(false)}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button onClick={createGroup} disabled={createLoading}>
                {createLoading ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className=\"flex gap-2 mb-6\">
        <div className=\"relative flex-1\">
          <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4\" />
          <Input
            placeholder=\"Search groups...\"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className=\"pl-10\"
          />
        </div>
      </div>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center gap-2\">
            <Users className=\"h-5 w-5\" />
            Groups ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className=\"text-center py-8\">
              <Users className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />
              <p className=\"text-gray-500\">
                {searchTerm ? 'No groups found matching your search' : 'No organization groups yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Owner Organization</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div>
                        <Link 
                          href={`/admin/org-groups/${group.id}`}
                          className=\"font-medium text-blue-600 hover:text-blue-800\"
                        >
                          {group.name}
                        </Link>
                        {group.description && (
                          <p className=\"text-sm text-gray-500\">{group.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {group.owner_organization.name || 
                       group.owner_organization.company_name || 
                       group.owner_organization.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant=\"secondary\">
                        {getMemberCount(group)} members
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(group.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className=\"flex gap-2\">
                        <Button asChild variant=\"outline\" size=\"sm\">
                          <Link href={`/admin/org-groups/${group.id}`}>
                            <Eye className=\"h-4 w-4\" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className=\"flex justify-between items-center mt-6\">
              <div className=\"text-sm text-gray-500\">
                Page {pagination.page} of {pagination.pages} 
                ({pagination.total} total groups)
              </div>
              <div className=\"flex gap-2\">
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  disabled={currentPage >= pagination.pages}
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
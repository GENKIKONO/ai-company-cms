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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Edit, Trash2, Plus, Users, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/log';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  company_name?: string;
}

interface GroupMember {
  id: string;
  role: 'member' | 'admin';
  added_at: string;
  organization: Organization;
  added_by_org: Organization;
}

interface OrganizationGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_organization: Organization;
  members: GroupMember[];
}

export default function AdminOrgGroupDetailPage({ params }: { params: { groupId: string } }) {
  const [group, setGroup] = useState<OrganizationGroup | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit group modal
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editGroup, setEditGroup] = useState({ name: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);
  
  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ organization_id: '', role: 'member' as 'member' | 'admin' });
  const [addLoading, setAddLoading] = useState(false);
  
  // Delete states
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadGroupDetails();
  }, [params.groupId]);

  async function loadGroupDetails() {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/org-groups/${params.groupId}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to load group' }));
        throw new Error(error.error);
      }

      const data = await response.json();
      const groupData = data.data;
      
      setGroup(groupData);
      setEditGroup({ 
        name: groupData.name, 
        description: groupData.description || '' 
      });
    } catch (error: any) {
      logger.error('Failed to load organization group details', {
        component: 'admin-org-group-detail',
        groupId: params.groupId,
        error: error.message
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to load group details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateGroup() {
    if (!editGroup.name) {
      toast({
        title: 'Validation Error',
        description: 'Group name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEditLoading(true);

      const response = await fetch(`/api/admin/org-groups/${params.groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editGroup)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update group' }));
        throw new Error(error.error);
      }

      const data = await response.json();
      
      setGroup(prev => prev ? { ...prev, ...data.data } : null);
      setShowEditGroup(false);

      toast({
        title: 'Success',
        description: 'Group updated successfully',
      });
    } catch (error: any) {
      logger.error('Failed to update organization group', {
        component: 'admin-org-group-detail',
        groupId: params.groupId,
        error: error.message
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to update group',
        variant: 'destructive',
      });
    } finally {
      setEditLoading(false);
    }
  }

  async function addMember() {
    if (!newMember.organization_id) {
      toast({
        title: 'Validation Error',
        description: 'Organization ID is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAddLoading(true);

      const response = await fetch(`/api/admin/org-groups/${params.groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMember)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to add member' }));
        throw new Error(error.error);
      }

      const data = await response.json();
      
      // Add new member to the list
      setGroup(prev => prev ? {
        ...prev,
        members: [data.data, ...prev.members]
      } : null);
      
      // Reset form
      setNewMember({ organization_id: '', role: 'member' });
      setShowAddMember(false);

      toast({
        title: 'Success',
        description: 'Member added successfully',
      });
    } catch (error: any) {
      logger.error('Failed to add member to organization group', {
        component: 'admin-org-group-detail',
        groupId: params.groupId,
        error: error.message
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member',
        variant: 'destructive',
      });
    } finally {
      setAddLoading(false);
    }
  }

  async function removeMember(member: GroupMember) {
    try {
      const response = await fetch(`/api/admin/org-groups/${params.groupId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ organization_id: member.organization.id })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to remove member' }));
        throw new Error(error.error);
      }
      
      // Remove member from the list
      setGroup(prev => prev ? {
        ...prev,
        members: prev.members.filter(m => m.id !== member.id)
      } : null);

      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
    } catch (error: any) {
      logger.error('Failed to remove member from organization group', {
        component: 'admin-org-group-detail',
        groupId: params.groupId,
        memberId: member.id,
        error: error.message
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      });
    }
  }

  async function deleteGroup() {
    try {
      setDeleteLoading(true);

      const response = await fetch(`/api/admin/org-groups/${params.groupId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete group' }));
        throw new Error(error.error);
      }

      toast({
        title: 'Success',
        description: 'Group deleted successfully',
      });

      router.push('/admin/org-groups');
    } catch (error: any) {
      logger.error('Failed to delete organization group', {
        component: 'admin-org-group-detail',
        groupId: params.groupId,
        error: error.message
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete group',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  function getOrgDisplayName(org: Organization): string {
    return org.name || org.company_name || org.id;
  }

  if (loading) {
    return (
      <div className=\"container mx-auto px-6 py-8\">
        <div className=\"animate-pulse\">
          <div className=\"h-8 bg-gray-200 rounded w-64 mb-6\"></div>
          <div className=\"space-y-4\">
            <div className=\"h-32 bg-gray-200 rounded\"></div>
            <div className=\"h-64 bg-gray-200 rounded\"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className=\"container mx-auto px-6 py-8\">
        <div className=\"text-center py-8\">
          <Building className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />
          <p className=\"text-gray-500\">Group not found</p>
          <Button asChild className=\"mt-4\">
            <Link href=\"/admin/org-groups\">Back to Groups</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className=\"container mx-auto px-6 py-8\">
      {/* Header */}
      <div className=\"flex items-center gap-4 mb-6\">
        <Button asChild variant=\"outline\" size=\"sm\">
          <Link href=\"/admin/org-groups\">
            <ArrowLeft className=\"h-4 w-4 mr-2\" />
            Back to Groups
          </Link>
        </Button>
        <h1 className=\"text-3xl font-bold\">{group.name}</h1>
      </div>

      <div className=\"grid gap-6\">
        {/* Group Info */}
        <Card>
          <CardHeader>
            <div className=\"flex justify-between items-center\">
              <CardTitle>Group Information</CardTitle>
              <div className=\"flex gap-2\">
                <Dialog open={showEditGroup} onOpenChange={setShowEditGroup}>
                  <DialogTrigger asChild>
                    <Button variant=\"outline\" size=\"sm\">
                      <Edit className=\"h-4 w-4 mr-2\" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Group</DialogTitle>
                    </DialogHeader>
                    <div className=\"space-y-4 mt-4\">
                      <div>
                        <label htmlFor=\"edit-name\" className=\"block text-sm font-medium mb-1\">
                          Group Name *
                        </label>
                        <Input
                          id=\"edit-name\"
                          value={editGroup.name}
                          onChange={(e) => setEditGroup(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor=\"edit-description\" className=\"block text-sm font-medium mb-1\">
                          Description
                        </label>
                        <Textarea
                          id=\"edit-description\"
                          value={editGroup.description}
                          onChange={(e) => setEditGroup(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className=\"flex justify-end gap-2 mt-6\">
                      <Button
                        variant=\"outline\"
                        onClick={() => setShowEditGroup(false)}
                        disabled={editLoading}
                      >
                        Cancel
                      </Button>
                      <Button onClick={updateGroup} disabled={editLoading}>
                        {editLoading ? 'Updating...' : 'Update'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant=\"destructive\" size=\"sm\">
                      <Trash2 className=\"h-4 w-4 mr-2\" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Group</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this group? This action cannot be undone.
                        All members will be removed from the group.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={deleteGroup} 
                        disabled={deleteLoading}
                        className=\"bg-red-600 hover:bg-red-700\"
                      >
                        {deleteLoading ? 'Deleting...' : 'Delete Group'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <dl className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
              <div>
                <dt className=\"text-sm font-medium text-gray-500\">Name</dt>
                <dd className=\"text-sm\">{group.name}</dd>
              </div>
              <div>
                <dt className=\"text-sm font-medium text-gray-500\">Owner Organization</dt>
                <dd className=\"text-sm\">{getOrgDisplayName(group.owner_organization)}</dd>
              </div>
              {group.description && (
                <div className=\"md:col-span-2\">
                  <dt className=\"text-sm font-medium text-gray-500\">Description</dt>
                  <dd className=\"text-sm\">{group.description}</dd>
                </div>
              )}
              <div>
                <dt className=\"text-sm font-medium text-gray-500\">Created</dt>
                <dd className=\"text-sm\">{new Date(group.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className=\"text-sm font-medium text-gray-500\">Last Updated</dt>
                <dd className=\"text-sm\">{new Date(group.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <div className=\"flex justify-between items-center\">
              <CardTitle className=\"flex items-center gap-2\">
                <Users className=\"h-5 w-5\" />
                Members ({group.members.length})
              </CardTitle>
              
              <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className=\"h-4 w-4 mr-2\" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Organization to Group</DialogTitle>
                  </DialogHeader>
                  <div className=\"space-y-4 mt-4\">
                    <div>
                      <label htmlFor=\"org-id\" className=\"block text-sm font-medium mb-1\">
                        Organization ID *
                      </label>
                      <Input
                        id=\"org-id\"
                        value={newMember.organization_id}
                        onChange={(e) => setNewMember(prev => ({ ...prev, organization_id: e.target.value }))}
                        placeholder=\"UUID of the organization\"
                      />
                    </div>
                    <div>
                      <label htmlFor=\"role\" className=\"block text-sm font-medium mb-1\">
                        Role
                      </label>
                      <Select
                        value={newMember.role}
                        onValueChange={(value: 'member' | 'admin') => 
                          setNewMember(prev => ({ ...prev, role: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=\"member\">Member</SelectItem>
                          <SelectItem value=\"admin\">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className=\"flex justify-end gap-2 mt-6\">
                    <Button
                      variant=\"outline\"
                      onClick={() => setShowAddMember(false)}
                      disabled={addLoading}
                    >
                      Cancel
                    </Button>
                    <Button onClick={addMember} disabled={addLoading}>
                      {addLoading ? 'Adding...' : 'Add Member'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {group.members.length === 0 ? (
              <div className=\"text-center py-8\">
                <Users className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />
                <p className=\"text-gray-500\">No members in this group yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className=\"font-medium\">
                        {getOrgDisplayName(member.organization)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getOrgDisplayName(member.added_by_org)}
                      </TableCell>
                      <TableCell>
                        {new Date(member.added_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {member.organization.id !== group.owner_organization.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant=\"outline\" size=\"sm\">
                                <Trash2 className=\"h-4 w-4\" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {getOrgDisplayName(member.organization)} from this group?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => removeMember(member)}
                                  className=\"bg-red-600 hover:bg-red-700\"
                                >
                                  Remove Member
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {member.organization.id === group.owner_organization.id && (
                          <Badge variant=\"outline\">Owner</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
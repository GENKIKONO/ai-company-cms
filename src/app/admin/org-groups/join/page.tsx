'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Send, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/log';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserOrganization {
  id: string;
  name: string;
  role: string;
}

export default function AdminOrgGroupsJoinPage() {
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    inviteCode: '',
    organizationId: '',
    reason: ''
  });

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadUserOrganizations();
  }, []);

  async function loadUserOrganizations() {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/my-organizations');
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to load organizations' }));
        throw new Error(error.error);
      }

      const data = await response.json();
      setOrganizations(data.data || []);
      
      // Auto-select first organization if only one
      if (data.data && data.data.length === 1) {
        setFormData(prev => ({ ...prev, organizationId: data.data[0].id }));
      }
    } catch (error: any) {
      logger.error('Failed to load user organizations', {
        component: 'admin-org-groups-join',
        error: error.message
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to load organizations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function submitJoinRequest() {
    if (!formData.inviteCode || !formData.organizationId) {
      toast({
        title: 'Validation Error',
        description: 'Please provide an invite code and select an organization',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/admin/org-groups/join-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to submit request' }));
        throw new Error(error.error);
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: 'Join request submitted successfully. Please wait for approval.',
      });

      // Reset form
      setFormData({ inviteCode: '', organizationId: '', reason: '' });

      // Optionally redirect to groups list
      // router.push('/admin/org-groups');
    } catch (error: any) {
      logger.error('Failed to submit join request', {
        component: 'admin-org-groups-join',
        error: error.message
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit join request',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function getOrgDisplayName(org: UserOrganization): string {
    return `${org.name} (${org.role})`;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/org-groups">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Join Enterprise Group</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Join Group Request
          </CardTitle>
          <p className="text-sm text-gray-600">
            Submit a request to join an enterprise group using an invite code. 
            The group owner will review and approve your request.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {organizations.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No eligible organizations found</p>
              <p className="text-sm text-gray-400">
                You need to be an admin or owner of an organization to join groups.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="invite-code" className="block text-sm font-medium mb-2">
                  Invite Code *
                </label>
                <Input
                  id="invite-code"
                  value={formData.inviteCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, inviteCode: e.target.value }))}
                  placeholder="Enter the invite code you received"
                  className="font-mono"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This is the unique code provided by the group owner or admin.
                </p>
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-medium mb-2">
                  Organization *
                </label>
                <Select 
                  value={formData.organizationId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {getOrgDisplayName(org)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the organization you want to add to the group. You can only select organizations where you have admin or owner permissions.
                </p>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium mb-2">
                  Reason (optional)
                </label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Briefly explain why you want to join this group..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Provide context to help the group owner understand your request.
                </p>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={submitJoinRequest} 
                  disabled={submitting || !formData.inviteCode || !formData.organizationId}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Join Request
                    </>
                  )}
                </Button>
                
                <p className="text-sm text-gray-500 text-center mt-3">
                  After submitting, the group owner will review your request. 
                  You'll be notified once a decision is made.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
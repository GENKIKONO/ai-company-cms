'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-client';
import { getCurrentUser, auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserWithRole extends User {
  user_metadata: {
    full_name?: string;
    role?: string;
  };
}

export default function AuthTest() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser as UserWithRole);
      
      if (currentUser) {
        // ロール情報を取得
        const supabase = supabaseClient;
        const { data: userData } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', currentUser.id)
          .single();
        
        if (userData) {
          setUserRole(userData.role);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async (email: string, password: string) => {
    try {
      const { user: loginUser, error } = await auth.signIn(email, password);
      if (error) {
        setTestResults(prev => ({
          ...prev,
          [email]: `❌ Error: ${error.message}`
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [email]: `✅ Login successful`
        }));
        await checkAuthState();
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [email]: `❌ Exception: ${error}`
      }));
    }
  };

  const testPermissions = async () => {
    if (!user) return;
    
    const supabase = supabaseClient;
    const results: Record<string, string> = {};
    
    // Test: View organizations
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(5);
      
      results['view_organizations'] = error 
        ? `❌ ${error.message}` 
        : `✅ Can view ${data?.length || 0} organizations`;
    } catch (error) {
      results['view_organizations'] = `❌ ${error}`;
    }

    // Test: Create organization (editor/admin only)
    try {
      const { error } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Organization',
          slug: 'test-org-' + Date.now(),
          description: 'Test organization for permission testing',
          status: 'draft'
        });
      
      if (error) {
        results['create_organization'] = `❌ Cannot create: ${error.message}`;
      } else {
        results['create_organization'] = `✅ Can create organizations`;
        
        // Clean up test data
        await supabase
          .from('organizations')
          .delete()
          .eq('slug', 'test-org-' + Date.now());
      }
    } catch (error) {
      results['create_organization'] = `❌ ${error}`;
    }

    // Test: View all users (admin only)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(5);
      
      results['view_users'] = error 
        ? `❌ ${error.message}` 
        : `✅ Can view ${data?.length || 0} users`;
    } catch (error) {
      results['view_users'] = `❌ ${error}`;
    }

    setTestResults(prev => ({ ...prev, ...results }));
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    setUserRole('');
    setTestResults({});
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>認証テストパネル</CardTitle>
          <CardDescription>
            Supabase認証とRow Level Securityのテスト
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>ログイン中:</strong> {user.email}
                  <Badge className="ml-2" variant={
                    userRole === 'admin' ? 'destructive' :
                    userRole === 'editor' ? 'default' : 'secondary'
                  }>
                    {userRole || 'viewer'}
                  </Badge>
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={testPermissions}>
                  権限テスト実行
                </Button>
                <Button variant="outline" onClick={signOut}>
                  ログアウト
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">テストユーザーでログイン</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">管理者</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => testLogin('admin@luxucare.com', 'AdminPass123!')}
                      className="w-full"
                    >
                      Admin Login
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">編集者</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => testLogin('editor@luxucare.com', 'EditorPass123!')}
                      className="w-full"
                    >
                      Editor Login
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">閲覧者</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => testLogin('viewer@luxucare.com', 'ViewerPass123!')}
                      className="w-full"
                    >
                      Viewer Login
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {Object.keys(testResults).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">テスト結果:</h4>
              {Object.entries(testResults).map(([key, result]) => (
                <div key={key} className="text-sm p-2 bg-gray-50 rounded">
                  <strong>{key}:</strong> {result}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
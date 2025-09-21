'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Organization } from '@/types';
import { collaborationService, FieldEdit } from '@/lib/collaboration';
import { supabaseClient } from '@/lib/supabase-client';
import CollaborativeInput from './CollaborativeInput';
import UserPresenceIndicators from './UserPresenceIndicators';
import ConflictResolutionModal from './ConflictResolutionModal';
import { 
  SaveIcon, 
  ArrowLeftIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface CollaborativeOrganizationFormProps {
  organization: Organization;
  isEditing?: boolean;
}

export default function CollaborativeOrganizationForm({
  organization,
  isEditing = false,
}: CollaborativeOrganizationFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Organization>>(organization);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [conflicts, setConflicts] = useState<FieldEdit[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isCollaborationReady, setIsCollaborationReady] = useState(false);

  // Initialize collaboration when component mounts
  useEffect(() => {
    const initCollaboration = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Join collaboration session
        await collaborationService.joinOrganizationSession(organization.id, {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email || 'Unknown User',
          avatar_url: user.user_metadata?.avatar_url,
        });

        setIsCollaborationReady(true);

        // Set up conflict detection
        collaborationService.onConflictDetected((detectedConflicts) => {
          setConflicts(detectedConflicts);
          setShowConflictModal(true);
        });

        // Track collaboration start

      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
      }
    };

    if (isEditing) {
      initCollaboration();
    }

    return () => {
      if (isEditing) {
        collaborationService.leaveSession();
      }
    };
  }, [organization.id, organization.name, isEditing]);

  const handleFieldChange = useCallback((fieldPath: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldPath]: value,
    }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('saving');

    try {
      const { error } = await supabase
        .from('organizations')
        .update(formData)
        .eq('id', organization.id);

      if (error) throw error;

      setSaveStatus('saved');
      
      // Track save event

      // Show success briefly then reset
      setTimeout(() => setSaveStatus('idle'), 2000);

    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleConflictResolve = (resolvedEdits: FieldEdit[]) => {
    // Apply resolved edits to form data
    const updatedData = { ...formData };
    resolvedEdits.forEach(edit => {
      updatedData[edit.fieldPath as keyof Organization] = edit.value;
    });
    setFormData(updatedData);
    setConflicts([]);
  };

  const getSaveButtonState = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          text: '保存中...',
          className: 'bg-indigo-400 cursor-not-allowed',
          icon: null,
        };
      case 'saved':
        return {
          text: '保存完了',
          className: 'bg-green-600 hover:bg-green-700',
          icon: <CheckCircleIcon className="w-4 h-4" />,
        };
      case 'error':
        return {
          text: '保存エラー',
          className: 'bg-red-600 hover:bg-red-700',
          icon: <ExclamationTriangleIcon className="w-4 h-4" />,
        };
      default:
        return {
          text: '変更を保存',
          className: 'bg-indigo-600 hover:bg-indigo-700',
          icon: <SaveIcon className="w-4 h-4" />,
        };
    }
  };

  const buttonState = getSaveButtonState();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with collaboration indicators */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? '組織を編集' : '組織詳細'}
          </h1>
        </div>

        {isEditing && isCollaborationReady && (
          <UserPresenceIndicators className="hidden md:flex" />
        )}
      </div>

      {/* Collaboration status */}
      {isEditing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" />
            <span className="text-sm text-blue-700">
              {isCollaborationReady 
                ? 'リアルタイム共同編集が有効です'
                : 'リアルタイム共同編集を初期化中...'
              }
            </span>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">基本情報</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                組織名 *
              </label>
              {isEditing ? (
                <CollaborativeInput
                  fieldPath="name"
                  value={formData.name || ''}
                  onChange={(value) => handleFieldChange('name', value)}
                  placeholder="組織名を入力"
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900">{formData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ウェブサイト
              </label>
              {isEditing ? (
                <CollaborativeInput
                  fieldPath="url"
                  value={formData.url || ''}
                  onChange={(value) => handleFieldChange('url', value)}
                  placeholder="https://example.com"
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900">{formData.url || '-'}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              {isEditing ? (
                <CollaborativeInput
                  fieldPath="description"
                  value={formData.description || ''}
                  onChange={(value) => handleFieldChange('description', value)}
                  placeholder="組織の説明を入力"
                  multiline
                  rows={4}
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900">{formData.description || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">連絡先情報</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              {isEditing ? (
                <CollaborativeInput
                  fieldPath="email"
                  value={formData.email || ''}
                  onChange={(value) => handleFieldChange('email', value)}
                  placeholder="contact@example.com"
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900">{formData.email || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号
              </label>
              {isEditing ? (
                <CollaborativeInput
                  fieldPath="phone"
                  value={formData.phone || ''}
                  onChange={(value) => handleFieldChange('phone', value)}
                  placeholder="03-1234-5678"
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900">{formData.phone || '-'}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住所
              </label>
              {isEditing ? (
                <CollaborativeInput
                  fieldPath="address"
                  value={formData.address || ''}
                  onChange={(value) => handleFieldChange('address', value)}
                  placeholder="東京都渋谷区..."
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900">{formData.address || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">追加情報</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業界
              </label>
              {isEditing ? (
                <CollaborativeInput
                  fieldPath="industry"
                  value={Array.isArray(formData.industries) ? formData.industries.join(', ') : ''}
                  onChange={(value) => handleFieldChange('industries', value.split(', ').filter(Boolean))}
                  placeholder="IT, 金融, ヘルスケア"
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900">
                  {Array.isArray(formData.industries) ? formData.industries.join(', ') : '-'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                従業員数
              </label>
              {isEditing ? (
                <CollaborativeInput
                  fieldPath="employee_count"
                  value={formData.employee_count?.toString() || ''}
                  onChange={(value) => handleFieldChange('employee_count', parseInt(value) || null)}
                  placeholder="100"
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900">{formData.employee_count || '-'}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                技術スタック
              </label>
              {isEditing ? (
                <CollaborativeInput
                  fieldPath="technologies"
                  value={Array.isArray(formData.technologies) ? formData.technologies.join(', ') : ''}
                  onChange={(value) => handleFieldChange('technologies', value.split(', ').filter(Boolean))}
                  placeholder="React, Node.js, PostgreSQL"
                  multiline
                  rows={2}
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900">
                  {Array.isArray(formData.technologies) ? formData.technologies.join(', ') : '-'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                transition-colors duration-200
                ${buttonState.className}
              `}
            >
              {buttonState.icon && <span className="mr-2">{buttonState.icon}</span>}
              {buttonState.text}
            </button>
          </div>
        )}
      </div>

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        conflicts={conflicts}
        onResolve={handleConflictResolve}
      />
    </div>
  );
}
'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (message) setMessage(null);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = '現在のパスワードを入力してください';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = '新しいパスワードを入力してください';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'パスワードは8文字以上で入力してください';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード確認を入力してください';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '新しいパスワードが一致しません';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = '現在のパスワードと同じパスワードは設定できません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        onSuccess?.();
      } else {
        setMessage({ type: 'error', text: result.message });
        if (result.details) {
          const fieldErrors: Record<string, string> = {};
          result.details.forEach((detail: any) => {
            if (detail.path?.[0]) {
              fieldErrors[detail.path[0]] = detail.message;
            }
          });
          setErrors(fieldErrors);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'パスワード変更に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordInput = ({ 
    field, 
    label, 
    placeholder 
  }: { 
    field: keyof typeof formData; 
    label: string; 
    placeholder: string;
  }) => (
    <div>
      <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={field}
          type={showPasswords[field as keyof typeof showPasswords] ? 'text' : 'password'}
          value={formData[field]}
          onChange={handleInputChange(field)}
          placeholder={placeholder}
          className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors[field] ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => togglePasswordVisibility(field as keyof typeof showPasswords)}
          className="absolute inset-y-0 right-0 px-3 flex items-center"
          disabled={isLoading}
        >
          {showPasswords[field as keyof typeof showPasswords] ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>
      {errors[field] && (
        <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">パスワード変更</h3>
        <p className="text-sm text-gray-500 mt-1">
          セキュリティのため、定期的なパスワード変更をお勧めします
        </p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          field="currentPassword"
          label="現在のパスワード"
          placeholder="現在のパスワードを入力"
        />

        <PasswordInput
          field="newPassword"
          label="新しいパスワード"
          placeholder="新しいパスワードを入力（8文字以上）"
        />

        <PasswordInput
          field="confirmPassword"
          label="新しいパスワード（確認）"
          placeholder="新しいパスワードを再入力"
        />

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'パスワード変更中...' : 'パスワードを変更'}
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>パスワードの要件:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>8文字以上</li>
          <li>現在のパスワードとは異なること</li>
        </ul>
      </div>
    </div>
  );
}
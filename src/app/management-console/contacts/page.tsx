'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Calendar, User, MessageSquare, Eye, Archive, CheckCircle, Clock } from 'lucide-react';
import { HIGButton } from '@/design-system';
import { logger } from '@/lib/utils/logger';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  created_at: string;
  replied_at?: string;
  reply_message?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'replied' | 'archived'>('all');
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/admin/contacts', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setContacts(data.data || []);
      }
    } catch (error) {
      logger.error('Error fetching contacts', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (contactId: string, status: Contact['status']) => {
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchContacts();
        if (selectedContact?.id === contactId) {
          setSelectedContact(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (error) {
      logger.error('Error updating contact status', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const sendReply = async () => {
    if (!selectedContact || !replyMessage.trim()) return;

    setReplying(true);
    try {
      const response = await fetch(`/api/admin/contacts/${selectedContact.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (response.ok) {
        setReplyMessage('');
        await fetchContacts();
        await updateContactStatus(selectedContact.id, 'replied');
      }
    } catch (error) {
      logger.error('Error sending reply', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setReplying(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(contact => {
    if (filter === 'all') return true;
    return contact.status === filter;
  });

  const unreadCount = contacts.filter(c => c.status === 'unread').length;

  const getStatusBadge = (status: Contact['status']) => {
    const styles = {
      unread: 'bg-red-100 text-red-800',
      read: 'bg-blue-100 text-blue-800',
      replied: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      unread: '未読',
      read: '既読',
      replied: '返信済み',
      archived: 'アーカイブ',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600">読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link href="/management-console" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={18} />
            管理コンソールに戻る
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">お問合せ管理</h1>
              <p className="text-gray-600 mt-2">
                お問合せ・サポート依頼の管理 {unreadCount > 0 && <span className="text-red-600 font-medium">({unreadCount}件未読)</span>}
              </p>
            </div>
            <HIGButton 
              onClick={fetchContacts}
              variant="primary"
              size="md"
            >
              更新
            </HIGButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: お問合せ一覧 */}
          <div className="lg:col-span-2">
            {/* フィルター */}
            <div className="mb-6">
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all', label: `全て (${contacts.length})` },
                  { key: 'unread', label: `未読 (${contacts.filter(c => c.status === 'unread').length})` },
                  { key: 'read', label: `既読 (${contacts.filter(c => c.status === 'read').length})` },
                  { key: 'replied', label: `返信済み (${contacts.filter(c => c.status === 'replied').length})` },
                  { key: 'archived', label: `アーカイブ (${contacts.filter(c => c.status === 'archived').length})` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      filter === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* お問合せ一覧 */}
            <div className="space-y-4">
              {filteredContacts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">お問合せはありません</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact);
                      if (contact.status === 'unread') {
                        updateContactStatus(contact.id, 'read');
                      }
                    }}
                    className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-md ${
                      selectedContact?.id === contact.id ? 'ring-2 ring-blue-500' : ''
                    } ${contact.status === 'unread' ? 'border-l-4 border-red-500' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{contact.subject}</h3>
                          {getStatusBadge(contact.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {contact.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail size={14} />
                            {contact.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(contact.created_at).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm line-clamp-2">{contact.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右側: お問合せ詳細・返信 */}
          <div className="lg:col-span-1">
            {selectedContact ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">お問合せ詳細</h3>
                  {getStatusBadge(selectedContact.status)}
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">件名</label>
                    <p className="text-gray-900">{selectedContact.subject}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
                    <p className="text-gray-900">{selectedContact.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                    <p className="text-gray-900">{selectedContact.email}</p>
                  </div>
                  
                  {selectedContact.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                      <p className="text-gray-900">{selectedContact.phone}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">受信日時</label>
                    <p className="text-gray-900">
                      {new Date(selectedContact.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">お問合せ内容</label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                    </div>
                  </div>

                  {selectedContact.reply_message && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">返信内容</label>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.reply_message}</p>
                        <p className="text-xs text-gray-600 mt-2">
                          返信日時: {selectedContact.replied_at && new Date(selectedContact.replied_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 返信フォーム */}
                {selectedContact.status !== 'archived' && (
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">返信</h4>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="返信メッセージを入力してください..."
                    />
                    <div className="flex gap-2 mt-3">
                      <HIGButton
                        onClick={sendReply}
                        disabled={!replyMessage.trim() || replying}
                        variant="primary"
                        size="md"
                      >
                        {replying ? '送信中...' : '返信'}
                      </HIGButton>
                      <button
                        onClick={() => updateContactStatus(selectedContact.id, 'archived')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        アーカイブ
                      </button>
                    </div>
                  </div>
                )}

                {/* ステータス変更 */}
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ステータス変更</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: 'read', label: '既読', icon: Eye },
                      { key: 'replied', label: '返信済み', icon: CheckCircle },
                      { key: 'archived', label: 'アーカイブ', icon: Archive },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => updateContactStatus(selectedContact.id, key as Contact['status'])}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-gray-600">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>お問合せを選択してください</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
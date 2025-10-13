'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Save, X, Search, Eye, FileText } from 'lucide-react';
import type { QAEntry, QAEntryWithCategory, QACategory, QAEntryFormData } from '@/types/database';

interface QAEntryManagerProps {
  categories: QACategory[];
  onRefreshCategories?: () => void;
}

export default function QAEntryManager({ categories, onRefreshCategories }: QAEntryManagerProps) {
  const [entries, setEntries] = useState<QAEntryWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState<QAEntryFormData>({
    category_id: '',
    question: '',
    answer: '',
    tags: [],
    visibility: 'public',
    status: 'draft'
  });

  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        params.append('category_id', categoryFilter);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`/api/my/qa/entries?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [currentPage, statusFilter, categoryFilter, searchTerm]);

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/my/qa/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id || null,
          tags: formData.tags?.filter(tag => tag.trim()) || []
        })
      });

      if (response.ok) {
        await fetchEntries();
        setIsCreating(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Failed to create entry');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/my/qa/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id || null,
          tags: formData.tags?.filter(tag => tag.trim()) || []
        })
      });

      if (response.ok) {
        await fetchEntries();
        setIsEditing(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update entry');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/my/qa/entries/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchEntries();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  const startEdit = (entry: QAEntry) => {
    setFormData({
      category_id: entry.category_id || '',
      question: entry.question,
      answer: entry.answer,
      tags: entry.tags || [],
      visibility: entry.visibility,
      status: entry.status
    });
    setIsEditing(entry.id);
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      question: '',
      answer: '',
      tags: [],
      visibility: 'public',
      status: 'draft'
    });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setIsCreating(false);
    resetForm();
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">公開</Badge>;
      case 'draft':
        return <Badge variant="secondary">下書き</Badge>;
      case 'archived':
        return <Badge variant="outline">アーカイブ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    return visibility === 'public' ? 
      <Badge variant="default">パブリック</Badge> : 
      <Badge variant="secondary">プライベート</Badge>;
  };

  if (loading) {
    return <div>ナレッジベースを読み込み中...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ナレッジベース管理</CardTitle>
          <Button
            onClick={() => setIsCreating(true)}
            disabled={isCreating || isEditing !== null}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            エントリ追加
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              <SelectItem value="draft">下書き</SelectItem>
              <SelectItem value="published">公開</SelectItem>
              <SelectItem value="archived">アーカイブ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全カテゴリ</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Create Form */}
        {isCreating && (
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-category">カテゴリ</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">カテゴリなし</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-tags">タグ (カンマ区切り)</Label>
                  <Input
                    id="new-tags"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="タグ1, タグ2, タグ3"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-question">質問 *</Label>
                <Textarea
                  id="new-question"
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="質問を入力してください"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="new-answer">回答 *</Label>
                <Textarea
                  id="new-answer"
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="回答を入力してください"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-visibility">公開設定</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value: 'public' | 'private') => setFormData(prev => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">パブリック</SelectItem>
                      <SelectItem value="private">プライベート</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-status">ステータス</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published' | 'archived') => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">下書き</SelectItem>
                      <SelectItem value="published">公開</SelectItem>
                      <SelectItem value="archived">アーカイブ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={!formData.question.trim() || !formData.answer.trim()}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  作成
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="w-4 h-4" />
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entries List */}
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                {isEditing === entry.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`edit-category-${entry.id}`}>カテゴリ</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="カテゴリを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">カテゴリなし</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`edit-tags-${entry.id}`}>タグ (カンマ区切り)</Label>
                        <Input
                          id={`edit-tags-${entry.id}`}
                          value={formData.tags?.join(', ') || ''}
                          onChange={(e) => handleTagsChange(e.target.value)}
                          placeholder="タグ1, タグ2, タグ3"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`edit-question-${entry.id}`}>質問 *</Label>
                      <Textarea
                        id={`edit-question-${entry.id}`}
                        value={formData.question}
                        onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-answer-${entry.id}`}>回答 *</Label>
                      <Textarea
                        id={`edit-answer-${entry.id}`}
                        value={formData.answer}
                        onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`edit-visibility-${entry.id}`}>公開設定</Label>
                        <Select
                          value={formData.visibility}
                          onValueChange={(value: 'public' | 'private') => setFormData(prev => ({ ...prev, visibility: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">パブリック</SelectItem>
                            <SelectItem value="private">プライベート</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`edit-status-${entry.id}`}>ステータス</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: 'draft' | 'published' | 'archived') => setFormData(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">下書き</SelectItem>
                            <SelectItem value="published">公開</SelectItem>
                            <SelectItem value="archived">アーカイブ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdate(entry.id)}
                        disabled={!formData.question.trim() || !formData.answer.trim()}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        保存
                      </Button>
                      <Button variant="outline" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(entry.status)}
                          {getVisibilityBadge(entry.visibility)}
                          {entry.qa_categories && (
                            <Badge variant="outline">{entry.qa_categories.name}</Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-2">{entry.question}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {entry.answer}
                        </p>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {entry.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          最終更新: {new Date(entry.last_edited_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(entry)}
                          disabled={isEditing !== null || isCreating}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isEditing !== null || isCreating}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>エントリを削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                このナレッジベースエントリを削除します。この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
              ? 'フィルター条件に一致するエントリがありません。'
              : 'ナレッジベースエントリがありません。最初のエントリを作成してください。'
            }
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              前へ
            </Button>
            <span className="flex items-center px-4 text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              次へ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
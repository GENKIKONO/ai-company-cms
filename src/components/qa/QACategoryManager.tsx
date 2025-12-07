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
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import type { QACategory, QACategoryFormData } from '@/types/domain/qa-system';;
import { logger } from '@/lib/utils/logger';

interface QACategoryManagerProps {
  onCategoryChange?: () => void;
}

export default function QACategoryManager({ onCategoryChange }: QACategoryManagerProps) {
  const [categories, setCategories] = useState<QACategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<QACategoryFormData>({
    name: '',
    slug: '',
    description: '',
    visibility: 'org',
    sort_order: 0,
    is_active: true
  });

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/my/qa/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      logger.error('Error fetching categories', { data: error instanceof Error ? error : new Error(String(error)) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/my/qa/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCategories();
        setIsCreating(false);
        setFormData({
          name: '',
          slug: '',
          description: '',
          visibility: 'org',
          sort_order: 0,
          is_active: true
        });
        onCategoryChange?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create category');
      }
    } catch (error) {
      logger.error('Error creating category', { data: error instanceof Error ? error : new Error(String(error)) });
      alert('Failed to create category');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/my/qa/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCategories();
        setIsEditing(null);
        onCategoryChange?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update category');
      }
    } catch (error) {
      logger.error('Error updating category', { data: error instanceof Error ? error : new Error(String(error)) });
      alert('Failed to update category');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/my/qa/categories/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCategories();
        onCategoryChange?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      logger.error('Error deleting category', { data: error instanceof Error ? error : new Error(String(error)) });
      alert('Failed to delete category');
    }
  };

  const startEdit = (category: QACategory) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      visibility: category.visibility,
      sort_order: category.sort_order,
      is_active: category.is_active
    });
    setIsEditing(category.id);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setIsCreating(false);
    setFormData({
      name: '',
      slug: '',
      description: '',
      visibility: 'org',
      sort_order: 0,
      is_active: true
    });
  };

  if (loading) {
    return <div>カテゴリを読み込み中...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ナレッジベースカテゴリ管理</CardTitle>
          <Button
            onClick={() => setIsCreating(true)}
            disabled={isCreating || isEditing !== null}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            カテゴリ追加
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Form */}
        {isCreating && (
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-name">カテゴリ名 *</Label>
                  <Input
                    id="new-name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="カテゴリ名を入力"
                  />
                </div>
                <div>
                  <Label htmlFor="new-slug">スラッグ *</Label>
                  <Input
                    id="new-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="category-slug"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-description">説明</Label>
                <Textarea
                  id="new-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="カテゴリの説明を入力"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-sort">表示順</Label>
                  <Input
                    id="new-sort"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="new-status">ステータス</Label>
                  <Select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">有効</SelectItem>
                      <SelectItem value="inactive">無効</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={!formData.name.trim() || !formData.slug.trim()}
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

        {/* Categories List */}
        <div className="space-y-2">
          {categories.map((category) => (
            <Card key={category.id} className={!category.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                {isEditing === category.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`edit-name-${category.id}`}>カテゴリ名 *</Label>
                        <Input
                          id={`edit-name-${category.id}`}
                          value={formData.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-slug-${category.id}`}>スラッグ *</Label>
                        <Input
                          id={`edit-slug-${category.id}`}
                          value={formData.slug}
                          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`edit-description-${category.id}`}>説明</Label>
                      <Textarea
                        id={`edit-description-${category.id}`}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`edit-sort-${category.id}`}>表示順</Label>
                        <Input
                          id={`edit-sort-${category.id}`}
                          type="number"
                          value={formData.sort_order}
                          onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-status-${category.id}`}>ステータス</Label>
                        <Select
                          value={formData.is_active ? 'active' : 'inactive'}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">有効</SelectItem>
                            <SelectItem value="inactive">無効</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdate(category.id)}
                        disabled={!formData.name.trim() || !formData.slug.trim()}
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
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{category.name}</h4>
                        <Badge variant={category.visibility === 'global' ? 'default' : 'secondary'}>
                          {category.visibility === 'global' ? 'グローバル' : '組織'}
                        </Badge>
                        {!category.is_active && (
                          <Badge variant="outline">無効</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        スラッグ: {category.slug}
                      </p>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        表示順: {category.sort_order}
                      </p>
                    </div>
                    {category.visibility === 'org' && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(category)}
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
                              <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                カテゴリ「{category.name}」を削除します。この操作は取り消せません。
                                関連するナレッジベースエントリがある場合は削除できません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(category.id)}>
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            カテゴリがありません。最初のカテゴリを作成してください。
          </div>
        )}
      </CardContent>
    </Card>
  );
}
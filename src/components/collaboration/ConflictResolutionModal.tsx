'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  ExclamationTriangleIcon, 
  UserIcon, 
  ClockIcon,
  CheckIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { FieldEdit, collaborationService } from '@/lib/collaboration';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: FieldEdit[];
  onResolve: (resolvedEdits: FieldEdit[]) => void;
}

export default function ConflictResolutionModal({
  isOpen,
  onClose,
  conflicts,
  onResolve,
}: ConflictResolutionModalProps) {
  const [selectedEdits, setSelectedEdits] = useState<Map<string, FieldEdit>>(new Map());
  const [groupedConflicts, setGroupedConflicts] = useState<Map<string, FieldEdit[]>>(new Map());

  useEffect(() => {
    // Group conflicts by field path
    const groups = new Map<string, FieldEdit[]>();
    conflicts.forEach(edit => {
      if (!groups.has(edit.fieldPath)) {
        groups.set(edit.fieldPath, []);
      }
      groups.get(edit.fieldPath)!.push(edit);
    });

    // Sort edits by timestamp within each group
    groups.forEach(edits => {
      edits.sort((a, b) => a.timestamp - b.timestamp);
    });

    setGroupedConflicts(groups);

    // Auto-select the latest edit for each field
    const autoSelected = new Map<string, FieldEdit>();
    groups.forEach((edits, fieldPath) => {
      if (edits.length > 0) {
        autoSelected.set(fieldPath, edits[edits.length - 1]);
      }
    });
    setSelectedEdits(autoSelected);
  }, [conflicts]);

  const handleSelectEdit = (fieldPath: string, edit: FieldEdit) => {
    setSelectedEdits(prev => {
      const newMap = new Map(prev);
      newMap.set(fieldPath, edit);
      return newMap;
    });
  };

  const handleResolve = () => {
    const resolvedEdits = Array.from(selectedEdits.values());
    onResolve(resolvedEdits);
    onClose();
  };

  const handleKeepAll = () => {
    // Create a merged edit for each field with the latest timestamp
    const mergedEdits: FieldEdit[] = [];
    groupedConflicts.forEach((edits, fieldPath) => {
      if (edits.length > 0) {
        const latestEdit = edits[edits.length - 1];
        mergedEdits.push({
          ...latestEdit,
          userName: 'システム自動統合',
          timestamp: Date.now(),
          changeId: `merged-${Date.now()}-${Math.random()}`,
        });
      }
    });
    onResolve(mergedEdits);
    onClose();
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getFieldDisplayName = (fieldPath: string) => {
    const fieldNames: Record<string, string> = {
      'name': '組織名',
      'description': '説明',
      'url': 'ウェブサイト',
      'email': 'メールアドレス',
      'phone': '電話番号',
      'address': '住所',
      'industry': '業界',
      'size': '企業規模',
      'founded_year': '設立年',
      'employee_count': '従業員数',
      'technologies': '技術スタック',
      'services': 'サービス',
      'keywords': 'キーワード',
    };
    return fieldNames[fieldPath] || fieldPath;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex items-center"
                >
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 mr-2" />
                  編集の競合が検出されました
                </Dialog.Title>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    複数のユーザーが同時に同じフィールドを編集しています。どの変更を適用するか選択してください。
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  {Array.from(groupedConflicts.entries()).map(([fieldPath, edits]) => (
                    <div key={fieldPath} className="border rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 mb-4">
                        {getFieldDisplayName(fieldPath)}
                      </h4>
                      
                      <div className="space-y-2">
                        {edits.map((edit, index) => (
                          <div
                            key={edit.changeId}
                            className={`
                              border rounded-lg p-3 cursor-pointer transition-all
                              ${selectedEdits.get(fieldPath)?.changeId === edit.changeId
                                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                            onClick={() => handleSelectEdit(fieldPath, edit)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <UserIcon className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {edit.userName}
                                  </span>
                                  <ClockIcon className="w-4 h-4 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(edit.timestamp)}
                                  </span>
                                  {index === edits.length - 1 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      最新
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 font-mono">
                                  {typeof edit.value === 'string' 
                                    ? edit.value.substring(0, 200) + (edit.value.length > 200 ? '...' : '')
                                    : JSON.stringify(edit.value)
                                  }
                                </div>
                              </div>
                              
                              <div className="ml-4">
                                {selectedEdits.get(fieldPath)?.changeId === edit.changeId && (
                                  <CheckIcon className="w-5 h-5 text-indigo-600" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    キャンセル
                  </button>
                  
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    onClick={handleKeepAll}
                  >
                    すべて最新版を適用
                  </button>
                  
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleResolve}
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    選択した変更を適用
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
'use client';

import React, { useState } from 'react';

interface JsonLdModalProps {
  jsonLdData: any[];
  trigger: React.ReactNode;
  organizationName: string;
}

export function JsonLdModal({ jsonLdData, trigger, organizationName }: JsonLdModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState(0);

  if (!jsonLdData || jsonLdData.length === 0) {
    return null;
  }

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const getSchemaType = (schema: any) => {
    if (schema['@type']) {
      return Array.isArray(schema['@type']) ? schema['@type'].join(', ') : schema['@type'];
    }
    return 'Unknown';
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsOpen(false)} />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {organizationName} - JSON-LD構造化データ
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {jsonLdData.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      スキーマタイプを選択:
                    </label>
                    <select
                      value={selectedSchema}
                      onChange={(e) => setSelectedSchema(Number(e.target.value))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {jsonLdData.map((schema, index) => (
                        <option key={index} value={index}>
                          {getSchemaType(schema)} {index > 0 ? `(${index + 1})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-gray-50 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {getSchemaType(jsonLdData[selectedSchema])} スキーマ
                    </h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(formatJson(jsonLdData[selectedSchema]));
                      }}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      コピー
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded overflow-x-auto max-h-96">
                    {formatJson(jsonLdData[selectedSchema])}
                  </pre>
                </div>

                <div className="mt-4">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">検証ツール:</h5>
                  <div className="flex space-x-2">
                    <a
                      href="https://search.google.com/test/rich-results"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Google Rich Results Test
                    </a>
                    <a
                      href="https://validator.schema.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Schema.org Validator
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
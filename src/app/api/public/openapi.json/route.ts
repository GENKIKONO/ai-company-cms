/**
 * OpenAPI 3.1 スキーマ公開
 * REQ-AIO-06: APIドキュメント（READ系のみ）
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  
  const openApiSpec = {
    "openapi": "3.1.0",
    "info": {
      "title": "AIOHub Public API",
      "version": "1.0.0",
      "description": "公開API仕様書 - 企業、サービス、FAQ、導入事例の取得エンドポイント",
      "contact": {
        "name": "AIOHub",
        "url": baseUrl
      },
      "license": {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
      }
    },
    "servers": [
      {
        "url": baseUrl,
        "description": "Production server"
      }
    ],
    "paths": {
      "/api/public/services": {
        "get": {
          "summary": "公開サービス一覧取得",
          "description": "公開中のサービス一覧を取得します",
          "tags": ["Services"],
          "parameters": [
            {
              "name": "limit",
              "in": "query",
              "description": "取得件数制限",
              "required": false,
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100,
                "default": 20
              }
            },
            {
              "name": "offset",
              "in": "query", 
              "description": "オフセット",
              "required": false,
              "schema": {
                "type": "integer",
                "minimum": 0,
                "default": 0
              }
            }
          ],
          "responses": {
            "200": {
              "description": "サービス一覧",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "services": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/Service"
                        }
                      },
                      "total": {
                        "type": "integer"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/InternalServerError"
            }
          }
        }
      },
      "/api/public/faqs": {
        "get": {
          "summary": "公開FAQ一覧取得",
          "description": "公開中のFAQ一覧を取得します",
          "tags": ["FAQs"],
          "parameters": [
            {
              "name": "category",
              "in": "query",
              "description": "カテゴリによる絞り込み",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "limit",
              "in": "query",
              "description": "取得件数制限",
              "required": false,
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100,
                "default": 20
              }
            }
          ],
          "responses": {
            "200": {
              "description": "FAQ一覧",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "faqs": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/FAQ"
                        }
                      },
                      "total": {
                        "type": "integer"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/InternalServerError"
            }
          }
        }
      },
      "/api/public/case-studies": {
        "get": {
          "summary": "公開導入事例一覧取得",
          "description": "公開中の導入事例一覧を取得します",
          "tags": ["CaseStudies"],
          "parameters": [
            {
              "name": "tags",
              "in": "query",
              "description": "タグによる絞り込み（カンマ区切り）",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "limit",
              "in": "query",
              "description": "取得件数制限",
              "required": false,
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100,
                "default": 20
              }
            }
          ],
          "responses": {
            "200": {
              "description": "導入事例一覧",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "caseStudies": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/CaseStudy"
                        }
                      },
                      "total": {
                        "type": "integer"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/InternalServerError"
            }
          }
        }
      }
    },
    "components": {
      "schemas": {
        "Service": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string",
              "nullable": true
            },
            "category": {
              "type": "string",
              "nullable": true,
              "description": "サービスカテゴリ（未設定時はnull）"
            },
            "features": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "nullable": true
            },
            "price": {
              "type": "number",
              "nullable": true
            },
            "cta_url": {
              "type": "string",
              "format": "url",
              "nullable": true
            },
            "status": {
              "type": "string",
              "enum": ["draft", "published", "archived"]
            },
            "created_at": {
              "type": "string",
              "format": "date-time"
            },
            "updated_at": {
              "type": "string",
              "format": "date-time"
            }
          },
          "required": ["id", "name", "status", "created_at", "updated_at"]
        },
        "FAQ": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "question": {
              "type": "string"
            },
            "answer": {
              "type": "string"
            },
            "category": {
              "type": "string",
              "nullable": true
            },
            "sort_order": {
              "type": "integer",
              "default": 0,
              "description": "表示順序（昇順）"
            },
            "status": {
              "type": "string",
              "enum": ["draft", "published", "archived"]
            },
            "created_at": {
              "type": "string",
              "format": "date-time"
            },
            "updated_at": {
              "type": "string",
              "format": "date-time"
            }
          },
          "required": ["id", "question", "answer", "sort_order", "status", "created_at", "updated_at"]
        },
        "CaseStudy": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "title": {
              "type": "string"
            },
            "problem": {
              "type": "string",
              "nullable": true
            },
            "solution": {
              "type": "string",
              "nullable": true
            },
            "result": {
              "type": "string",
              "nullable": true,
              "description": "導入結果・効果"
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "nullable": true
            },
            "status": {
              "type": "string",
              "enum": ["draft", "published", "archived"]
            },
            "created_at": {
              "type": "string",
              "format": "date-time"
            },
            "updated_at": {
              "type": "string",
              "format": "date-time"
            }
          },
          "required": ["id", "title", "status", "created_at", "updated_at"]
        },
        "Error": {
          "type": "object",
          "properties": {
            "error": {
              "type": "string"
            },
            "message": {
              "type": "string"
            }
          },
          "required": ["error"]
        }
      },
      "responses": {
        "InternalServerError": {
          "description": "内部サーバーエラー",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        }
      }
    },
    "tags": [
      {
        "name": "Services",
        "description": "サービス関連API"
      },
      {
        "name": "FAQs", 
        "description": "FAQ関連API"
      },
      {
        "name": "CaseStudies",
        "description": "導入事例関連API"
      }
    ]
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1時間キャッシュ
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}
# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "メインコンテンツにスキップ" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "AIO Hub AI企業CMS" [ref=e7] [cursor=pointer]:
          - /url: /
        - navigation [ref=e8]:
          - link "料金プラン" [ref=e9] [cursor=pointer]:
            - /url: /pricing
          - link "ヒアリング代行" [ref=e10] [cursor=pointer]:
            - /url: /hearing-service
      - link "ログイン" [ref=e13] [cursor=pointer]:
        - /url: /auth/login
  - main [ref=e14]:
    - generic [ref=e16]:
      - heading "404" [level=1] [ref=e17]
      - heading "This page could not be found." [level=2] [ref=e19]
  - alert [ref=e20]
```
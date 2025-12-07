# React Hooks Warning 修正プラン

## 修正対象ファイル一覧（35件）

### 優先度A: Dashboard系（13件）
1. src/app/dashboard/admin/billing-links/page.tsx:57
2. src/app/dashboard/case-studies/page.tsx:47
3. src/app/dashboard/components/AIVisibilityCard.tsx:45
4. src/app/dashboard/components/TabbedDashboard.tsx:55,62
5. src/app/dashboard/embed/page.tsx:34
6. src/app/dashboard/faqs/page.tsx:49
7. src/app/dashboard/materials/[id]/page.tsx:24
8. src/app/dashboard/my-questions/page.tsx:55
9. src/app/dashboard/posts/page.tsx:49
10. src/app/dashboard/qna-stats/page.tsx:58
11. src/app/dashboard/questions/page.tsx:58
12. src/app/dashboard/services/[id]/edit/page.tsx:54
13. src/app/dashboard/services/page.tsx:48

### 優先度B: Components（8件）
14. src/components/CaseStudiesTab.tsx:53
15. src/components/FAQsTab.tsx:46
16. src/components/ServicesTab.tsx:59
17. src/components/admin/EmbedLimitCard.tsx:49
18. src/components/admin/EmbedTopSources.tsx:34
19. src/components/admin/EmbedUsageChart.tsx:32
20. src/components/admin/SecurityDashboard.tsx:170,177
21. src/components/embed/EmbedCodeGenerator.tsx:58

### 優先度C: Hooks・複雑（8件）
22. src/hooks/useQAData.ts:105,164
23. src/hooks/useSEO.ts:87,319
24. src/components/ui/toast.tsx:52
25. src/components/qa/QAEntryManager.tsx:74
26. src/components/qa/QAPublicDisplay.tsx:61
27. src/components/debug/LayoutDebugger.tsx:102

### 優先度D: その他（6件）
28. src/app/management-console/settings/page.tsx:26
29. src/app/my/faqs/[id]/edit/page.tsx:43
30. src/app/my/faqs/page.tsx:20
31. src/app/organizations/[id]/page.tsx:179
32. src/app/search/enhanced/page.tsx:170
33. src/components/admin/Enforcement/NextViolationFlagPanel.tsx:60
34. src/components/admin/error-log-viewer.tsx:78
35. src/components/PublishGate.tsx:71

## 修正作業順序

1. **Phase 1**: Dashboard系（影響範囲が明確）
2. **Phase 2**: Components（再利用コンポーネント）  
3. **Phase 3**: Hooks（他への影響大）
4. **Phase 4**: その他

## 共通修正パターン

### パターン1: fetch関数のuseCallback化
```diff
- const fetchData = async () => {
+ const fetchData = useCallback(async () => {
    // fetch処理
- };
+ }, [dependency]);

  useEffect(() => {
    fetchData();
- }, [dependency]);
+ }, [fetchData]);
```

### パターン2: 複数関数の個別useCallback化
```diff
- const func1 = () => { /* */ };
- const func2 = () => { /* */ };
+ const func1 = useCallback(() => { /* */ }, [deps]);
+ const func2 = useCallback(() => { /* */ }, [deps]);

  useEffect(() => {
    func1();
    func2();
- }, [otherDeps]);
+ }, [func1, func2]);
```

### パターン3: オブジェクトプロパティの分離
```diff
  useEffect(() => {
    // 処理
- }, [options.prop1, options.prop2]);
+ }, [options?.prop1, options?.prop2]);
```
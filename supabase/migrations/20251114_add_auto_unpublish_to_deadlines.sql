-- enforcement_deadlines に自動非公開処理を組み込み
-- warn期限到達で suspended に変更し、自動非公開を実行

BEGIN;

-- process_enforcement_deadlines() 関数を更新
CREATE OR REPLACE FUNCTION process_enforcement_deadlines()
RETURNS integer AS $$
DECLARE
    processed_count integer := 0;
    action_record record;
    new_status text;
BEGIN
    -- 期限が来た未処理のアクションを処理
    FOR action_record IN 
        SELECT id, user_id, action, deadline 
        FROM enforcement_actions 
        WHERE deadline IS NOT NULL 
        AND deadline < now() 
        AND processed_at IS NULL
        ORDER BY deadline ASC
    LOOP
        -- アクションタイプに応じて profiles.account_status を更新
        CASE action_record.action
            WHEN 'warn' THEN
                -- 警告期限が来たら一時停止に移行（従来は active に戻していたが仕様変更）
                new_status := 'suspended';
                UPDATE profiles SET account_status = 'suspended' 
                WHERE id = action_record.user_id;
                
                -- 自動非公開処理を実行
                PERFORM public.unpublish_org_public_content_for_user(action_record.user_id);
                
            WHEN 'suspend' THEN
                -- 一時停止期限が来たら凍結に移行
                new_status := 'frozen';
                UPDATE profiles SET account_status = 'frozen' 
                WHERE id = action_record.user_id;
                
                -- 自動非公開処理を実行（冪等性前提で重複実行OK）
                PERFORM public.unpublish_org_public_content_for_user(action_record.user_id);
                
            WHEN 'freeze' THEN
                -- 凍結期限が来たら削除に移行
                new_status := 'deleted';
                UPDATE profiles SET account_status = 'deleted' 
                WHERE id = action_record.user_id;
                
                -- 自動非公開処理を実行（冪等性前提で重複実行OK）
                PERFORM public.unpublish_org_public_content_for_user(action_record.user_id);
                
            ELSE
                -- その他のアクションは何もしない
                new_status := NULL;
        END CASE;
        
        -- 処理済みフラグを設定
        UPDATE enforcement_actions 
        SET processed_at = now() 
        WHERE id = action_record.id;
        
        processed_count := processed_count + 1;
        
        -- ログ出力（デバッグ用）
        IF new_status IS NOT NULL THEN
            RAISE LOG 'process_enforcement_deadlines: user_id=%, action=%, new_status=%, auto_unpublish=executed',
                action_record.user_id, action_record.action, new_status;
        END IF;
        
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- コメント更新
COMMENT ON FUNCTION process_enforcement_deadlines() IS '制裁期限処理関数 - 期限到達時にaccount_status更新+自動非公開実行';

COMMIT;

/*
変更点:
1. warn期限到達で suspended に変更（従来は active に戻していた）
2. warn → suspended 時に自動非公開実行
3. suspend → frozen 時に自動非公開実行（冪等性前提）
4. freeze → deleted 時に自動非公開実行（冪等性前提）
5. ログ出力でデバッグ可能にした

使用想定:
- cron ジョブで定期実行: SELECT process_enforcement_deadlines();
- API エンドポイント /api/enforcement/jobs/process からの呼び出し
*/
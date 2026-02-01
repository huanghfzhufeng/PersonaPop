-- PersonaPop 数据库迁移脚本
-- 在 Supabase SQL 编辑器中运行此脚本

-- ============================================
-- 1. 添加 is_favorite 字段（如果不存在）
-- ============================================
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. 添加删除策略（允许用户删除自己的记录）
-- ============================================
-- 先检查策略是否存在，如果不存在则创建
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'personas' 
        AND policyname = 'Users can delete their own personas'
    ) THEN
        CREATE POLICY "Users can delete their own personas"
            ON personas FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- 3. 添加更新策略（允许用户更新自己的记录）
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'personas' 
        AND policyname = 'Users can update their own personas'
    ) THEN
        CREATE POLICY "Users can update their own personas"
            ON personas FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- 完整的表结构（供新项目参考）
-- ============================================
/*
-- 如果是新项目，可以使用以下完整 SQL 创建表：

CREATE TABLE personas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    mbti_type TEXT NOT NULL,
    vibe TEXT NOT NULL,
    result_text TEXT,
    image_url TEXT,
    is_favorite BOOLEAN DEFAULT FALSE
);

-- 启用行级安全 (RLS)
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- 策略
CREATE POLICY "Users can insert their own personas"
    ON personas FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own personas"
    ON personas FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own personas"
    ON personas FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personas"
    ON personas FOR DELETE
    USING (auth.uid() = user_id);
*/

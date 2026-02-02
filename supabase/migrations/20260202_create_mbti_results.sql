-- MBTI 测试结果表
-- 用于存储用户的 MBTI 测试结果和详细分数

create table if not exists mbti_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- MBTI 类型结果
  mbti_type text not null check (mbti_type ~ '^[EI][SN][TF][JP]$'),
  
  -- 测试答案 (题目ID -> 答案值 1-7)
  answers jsonb not null default '{}',
  
  -- 四维度分数详情
  -- 格式: { EI: { first: 'E', second: 'I', scoreFirst: 10, scoreSecond: 5, ... }, ... }
  scores jsonb not null default '{}',
  
  -- 答案质量评估
  -- 格式: { straightLining: false, extremeResponse: false, centralTendency: false, ... }
  quality jsonb,
  
  -- 置信度评估
  -- 格式: { overall: 85, factors: { consistency: 90, ... }, qualityFlags: [] }
  confidence jsonb,
  
  -- 测试模式: quick(20题), standard(40题), full(60题)
  test_mode text default 'standard' check (test_mode in ('quick', 'standard', 'full')),
  
  -- 测试用时(秒)
  duration_seconds integer,
  
  -- 时间戳
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 索引: 按用户ID和创建时间查询
create index if not exists idx_mbti_results_user_created 
  on mbti_results(user_id, created_at desc);

-- 更新 updated_at 触发器
create or replace function update_mbti_results_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_mbti_results_updated_at on mbti_results;
create trigger trigger_mbti_results_updated_at
  before update on mbti_results
  for each row
  execute function update_mbti_results_updated_at();

-- RLS 策略
alter table mbti_results enable row level security;

-- 用户只能查看自己的结果
create policy "Users can view own mbti_results"
  on mbti_results for select
  using (auth.uid() = user_id);

-- 用户只能插入自己的结果
create policy "Users can insert own mbti_results"
  on mbti_results for insert
  with check (auth.uid() = user_id);

-- 用户只能更新自己的结果
create policy "Users can update own mbti_results"
  on mbti_results for update
  using (auth.uid() = user_id);

-- 用户只能删除自己的结果
create policy "Users can delete own mbti_results"
  on mbti_results for delete
  using (auth.uid() = user_id);

-- 添加注释
comment on table mbti_results is 'MBTI 测试结果存储表';
comment on column mbti_results.mbti_type is 'MBTI 类型，如 INFP, ENTJ 等';
comment on column mbti_results.answers is '用户答案，JSON 格式 {questionId: likertValue}';
comment on column mbti_results.scores is '四维度详细分数';
comment on column mbti_results.quality is '答案质量评估结果';
comment on column mbti_results.confidence is '结果置信度评估';
comment on column mbti_results.test_mode is '测试模式: quick/standard/full';
comment on column mbti_results.duration_seconds is '测试完成用时(秒)';

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  try {
    console.log('🔧 Supabase 테이블 생성 시작...');

    // SQL 파일 읽기
    const sqlContent = fs.readFileSync('./supabase_wave_interactions.sql', 'utf8');
    
    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ SQL 실행 오류:', error);
      return;
    }
    
    console.log('✅ 테이블 생성 완료!');
    console.log('생성된 데이터:', data);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 직접 SQL 실행 함수
async function executeSQL() {
  try {
    console.log('🔧 SQL 직접 실행...');
    
    // SQL 파일 읽기
    const sqlContent = fs.readFileSync('./supabase_wave_interactions.sql', 'utf8');
    
    // SQL을 세미콜론으로 분리
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('실행 중:', statement.substring(0, 100) + '...');
        
        const { data, error } = await supabase
          .from('_sql')
          .select('*')
          .eq('query', statement.trim());
        
        if (error) {
          console.error('❌ SQL 실행 오류:', error);
        } else {
          console.log('✅ 성공');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 테이블 존재 여부 확인
async function checkTables() {
  try {
    console.log('🔍 테이블 존재 여부 확인...');
    
    const tables = ['wave_comments', 'wave_likes', 'wave_saves', 'waves'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table} 테이블 없음:`, error.message);
      } else {
        console.log(`✅ ${table} 테이블 존재`);
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 메인 실행
async function main() {
  await checkTables();
  // await executeSQL();
}

main();

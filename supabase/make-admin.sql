-- 최초 관리자 지정
-- schema.sql 실행 후, 관리자로 쓸 계정으로 직접 회원가입을 한 다음 이 SQL을 실행하세요.
-- 이메일을 실제 관리자 계정으로 바꿔서 실행합니다.
--
-- profiles에는 UPDATE 정책이 없으므로, 관리자 지정은 이 SQL(대시보드)로만 가능합니다.

update public.profiles set is_admin = true
where email = 'aircloud09@gmail.com';

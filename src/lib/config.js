// 사이트에 표시되는 이름. 학교/축제에 맞게 이 두 값만 바꾸면 됩니다.
export const SCHOOL_NAME = '한빛고등학교'
export const FESTIVAL_NAME = '한빛제'

// 학번 형식 (명세 기준 5자리 숫자). DB의 check 제약과 반드시 같아야 합니다.
export const STUDENT_ID_LENGTH = 5
export const STUDENT_ID_PATTERN = new RegExp(`^[0-9]{${STUDENT_ID_LENGTH}}$`)

"use server";

import { createServerSupabaseClient } from "utils/supabase/server";

/**
 * 오류를 처리하는 유틸리티 함수
 * @param error 처리할 오류 객체
 * @throws 오류가 존재하는 경우 해당 오류를 던짐
 */
function handleError(error) {
  if (error) {
    console.error(error);
    throw error;
  }
}

/**
 * 업로드된 파일 정보를 위한 타입 정의
 * 파일의 경로, 전체 경로, ID 및 기타 메타데이터 포함
 */
export interface UploadedFileInfo {
  path: string;
  fullPath: string;
  id: string;
  size?: number;
  lastModified?: string;
  // 필요한 다른 정보들도 추가할 수 있습니다
}

/**
 * 여러 파일을 Supabase 스토리지에 업로드하는 함수
 * FormData에서 모든 파일을 추출하여 병렬로 업로드 처리
 * 
 * @param formData 업로드할 파일이 포함된 FormData 객체
 * @returns 각 파일 업로드 결과의 배열
 */
export async function uploadFile(formData: FormData) {
  // Supabase 클라이언트 생성
  const supabase = await createServerSupabaseClient();
  
  // FormData에서 모든 파일 항목을 추출하여 File 객체 배열로 변환
  // entries() 메서드는 폼 데이터의 모든 키-값 쌍을 반환함
  // Array.from으로 Iterator를 배열로 변환한 후, map으로 각 항목에서 File 객체 추출
  const files = Array.from(formData.entries()).map(
    ([name, file]) => file as File
  );
  
  // 모든 파일을 병렬로 업로드하기 위해 Promise.all 사용
  // 각 파일에 대해 Supabase 스토리지 업로드 작업 수행
  const results = await Promise.all(
    files.map((file) =>
      supabase.storage
        .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET)
        .upload(file.name, file, { upsert: true }) // upsert:true는 같은 이름의 파일이 있으면 덮어쓰기
    )
  );
  
  // 모든 업로드 결과 반환
  return results;
}

/**
 * 스토리지에서 파일 검색하는 함수
 * 검색어에 따라 파일 목록을 필터링하여 반환
 * 
 * @param search 검색할 파일 이름 (선택적, 기본값은 빈 문자열)
 * @returns 파일 목록과 추가 정보를 포함한 배열
 */
export async function searchFiles(search: string = "") {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET)
    .list(null, {
      search,
    });

  handleError(error);

  // 파일 목록에 대한 추가 정보를 포함하여 반환할 수 있습니다
  return data.map(item => ({
    ...item,
    fullPath: `${process.env.NEXT_PUBLIC_STORAGE_BUCKET}/${item.name}`
  }));
}

/**
 * Supabase 스토리지에서 파일을 삭제하는 함수
 * 
 * @param fileName 삭제할 파일의 이름
 * @returns 삭제 작업의 결과 데이터
 */
export async function deleteFile(fileName: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET)
    .remove([fileName]);

  handleError(error);

  return data;
}

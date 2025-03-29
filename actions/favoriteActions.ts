"use server";

import { createServerSupabaseClient } from "utils/supabase/server";
import { revalidatePath } from "next/cache";

// 즐겨찾기 추가
export async function addToFavorites(movieId: number, deviceId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 이미 즐겨찾기에 있는지 확인
    const { data: existing, error: queryError } = await supabase
      .from('favorites')
      .select('*')
      .eq('movie_id', movieId)
      .eq('device_id', deviceId)
      .maybeSingle();
      
    if (queryError) throw queryError;
      
    // 이미 있으면 추가하지 않음
    if (existing) return { success: true };
    
    // 없으면 새로 추가
    const { error } = await supabase
      .from('favorites')
      .insert({ movie_id: movieId, device_id: deviceId });
    
    if (error) throw error;
    
    // 메인 페이지 캐시 갱신
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error("즐겨찾기 추가 중 오류 발생:", error);
    return { success: false, error };
  }
}

// 즐겨찾기 제거
export async function removeFromFavorites(movieId: number, deviceId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('movie_id', movieId)
      .eq('device_id', deviceId);
    
    if (error) throw error;
    
    // 메인 페이지 캐시 갱신
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error("즐겨찾기 제거 중 오류 발생:", error);
    return { success: false, error };
  }
}

// 특정 기기의 즐겨찾기 영화 ID 목록 가져오기
export async function getFavoriteMovieIds(deviceId?: string | null): Promise<number[]> {
  try {
    if (!deviceId) return [];
    
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('favorites')
      .select('movie_id')
      .eq('device_id', deviceId);
    
    if (error) throw error;
    
    return data.map(item => item.movie_id);
  } catch (error) {
    console.error("즐겨찾기 ID 가져오기 중 오류 발생:", error);
    return [];
  }
}
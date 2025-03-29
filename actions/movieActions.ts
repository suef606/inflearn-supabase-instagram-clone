"use server";

import { createServerSupabaseClient } from "utils/supabase/server";
import { getFavoriteMovieIds } from "./favoriteActions";
import { Tables } from "types_db";

// 기본 영화 타입 가져오기
type Movie = Tables<"movies">;

// 즐겨찾기 정보가 추가된 영화 타입
interface MovieWithFavorite extends Movie {
  is_favorite: boolean;
}

// searchMovies 함수의 매개변수 타입을 정의
interface SearchMoviesParams {
  search: string;
  page: number;
  pageSize: number;
  deviceId?: string | null;
}

// searchMovies 함수 반환 타입
interface SearchMoviesResult {
  data: MovieWithFavorite[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export async function searchMovies({ search, page, pageSize, deviceId }: SearchMoviesParams): Promise<SearchMoviesResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // 영화 검색
    let query = supabase
      .from("movies")
      .select("*", { count: "exact" });
    
    if (search && search.trim() !== "") {
      query = query.ilike('title', `%${search}%`);
    }
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to);

    const { data: movies, count, error } = await query;

    if (error) throw error;
    
    // 즐겨찾기 정보 가져오기 (deviceId가 있는 경우에만)
    let favoriteIds: number[] = [];
    if (deviceId) {
      favoriteIds = await getFavoriteMovieIds(deviceId);
    }
    
    const favoriteIdsSet = new Set(favoriteIds);
    
    // 영화에 즐겨찾기 정보 추가
    const moviesWithFavorites: MovieWithFavorite[] = (movies || []).map(movie => ({
      ...movie,
      is_favorite: favoriteIdsSet.has(movie.id)
    }));
    
    // 즐겨찾기 항목을 상단으로 정렬
    moviesWithFavorites.sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return b.popularity - a.popularity;
    });

    return {
      data: moviesWithFavorites,
      page,
      pageSize,
      hasNextPage: count ? count > page * pageSize : false
    };
  } catch (error) {
    console.error("영화 검색 중 오류 발생:", error);
    return {
      data: [],
      page,
      pageSize,
      hasNextPage: false
    };
  }
}

// 영화 ID로 특정 영화 정보 가져오기
export async function getMovie(id: number, deviceId?: string | null): Promise<MovieWithFavorite | null> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: movie, error } = await supabase
      .from("movies")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!movie) return null;
    
    // 즐겨찾기 정보 추가
    let is_favorite = false;
    if (deviceId) {
      const favoriteIds = await getFavoriteMovieIds(deviceId);
      is_favorite = favoriteIds.includes(movie.id);
    }
    
    return {
      ...movie,
      is_favorite
    };
  } catch (error) {
    console.error(`ID ${id}인 영화를 가져오는 중 오류 발생:`, error);
    return null;
  }
}
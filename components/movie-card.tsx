"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getDeviceId } from "utils/deviceId";
import { addToFavorites, removeFromFavorites } from "actions/favoriteActions";
import { IconButton } from "@material-tailwind/react";

export default function MovieCard({ movie }) {
  const [isFavorite, setIsFavorite] = useState(movie.is_favorite || false);
  const [deviceId, setDeviceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 컴포넌트 마운트 시 device_id 가져오기
  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  const handleFavoriteClick = async (e) => {
    e.preventDefault(); // 링크 이동 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (isLoading || !deviceId) return;
    
    setIsLoading(true);
    
    try {
      if (isFavorite) {
        await removeFromFavorites(movie.id, deviceId);
      } else {
        await addToFavorites(movie.id, deviceId);
      }
      
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("즐겨찾기 변경 중 오류 발생:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="col-span-1 relative">
      {/* 즐겨찾기 버튼 */}
      <div className="absolute top-2 right-2 z-20">
        {/* @ts-ignore - Material Tailwind 타입 문제 해결 */}
        <IconButton
          size="sm"
          color={isFavorite ? "red" : "white"}
          variant={isFavorite ? "filled" : "text"}
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className={`rounded-full ${isFavorite ? 'bg-red-500 text-white' : 'bg-black/30 hover:bg-black/50'}`}
        >
          <i className="fas fa-heart" />
        </IconButton>
      </div>

      {/* Image 부분 */}
      <img
        src={movie.image_url}
        className="w-full"
        alt={movie.title}
      />

      {/* Title Dim */}
      <Link href={`/movies/${movie.id}`}>
        <div className="absolute flex items-center justify-center top-0 bottom-0 left-0 right-0 z-10 bg-black opacity-0 hover:opacity-80 transition-opacity duration-300">
          <p className="text-xl font-bold text-white">{movie.title}</p>
        </div>
      </Link>
    </div>
  );
}
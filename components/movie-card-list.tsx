"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import MovieCard from "./movie-card";
import { searchMovies } from "actions/movieActions";
import { Spinner } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { searchState } from "utils/recoil/atoms";
import { useInView } from "react-intersection-observer";
import { getDeviceId } from "utils/deviceId";

export default function MovieCardList() {
  const search = useRecoilValue(searchState);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  
  // 컴포넌트 마운트 시 device_id 가져오기
  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);
  
  const { data, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      initialPageParam: 1,
      queryKey: ["movie", search, deviceId],
      queryFn: ({ pageParam }) =>
        searchMovies({ 
          search, 
          page: pageParam, 
          pageSize: 12,
          deviceId 
        }),
      getNextPageParam: (lastPage) =>
        lastPage.hasNextPage ? lastPage.page + 1 : null,
      // deviceId가 로드될 때까지 쿼리 비활성화
      enabled: !!deviceId,
    });

  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="grid gap-1 md:grid-cols-4 grid-cols-3 w-full h-full">
      {(isFetching || isFetchingNextPage) && (
        <div className="col-span-full flex justify-center py-4">
          {/* @ts-ignore */}
          <Spinner className="h-10 w-10" color="blue" />
        </div>
      )}
      
      {data?.pages && (
        <>
          {data.pages
            .flatMap(page => page.data)
            .map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          <div ref={ref} className="h-20 col-span-full"></div>
        </>
      )}
      
      {data?.pages[0]?.data.length === 0 && (
        <div className="col-span-full text-center py-10">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
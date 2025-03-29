"use client";

/**
 * 기기 식별자를 가져오거나 생성합니다.
 * 브라우저의 localStorage에 저장된 값을 사용하고,
 * 없으면 새로운 값을 생성하여 저장합니다.
 * 
 * @returns {string | null} 기기 식별자 또는 서버 측에서 호출된 경우 null
 */
export const getDeviceId = (): string | null => {
  if (typeof window === 'undefined') return null; // 서버 사이드에서는 null 반환
  
  // 로컬 스토리지에서 device_id 찾기
  let deviceId = localStorage.getItem('device_id');
  
  // 없으면 새로 생성
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
};
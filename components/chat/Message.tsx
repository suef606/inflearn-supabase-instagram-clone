"use client";
import { useState } from "react";

/**
 * 메시지 컴포넌트
 * 채팅 메시지를 표시하고 삭제, 신고 기능을 제공합니다.
 */
export default function Message({ 
  isFromMe, 
  message, 
  messageId, 
  isRead = false, 
  onDelete, 
  onReport 
}) {
  // 신고 모달 표시 여부
  const [showReportModal, setShowReportModal] = useState(false);
  // 신고 사유
  const [reportReason, setReportReason] = useState("");

  // 신고 처리 함수
  const handleReport = () => {
    if (onReport) {
      onReport(messageId, reportReason);
    }
    setShowReportModal(false);
    setReportReason("");
  };

  return (
    <div
      className={`w-fit p-3 rounded-md relative group ${
        isFromMe
          ? "ml-auto bg-light-blue-600 text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      <p>{message}</p>
      
      {/* 내가 보낸 메시지인 경우 삭제 버튼 표시 */}
      {isFromMe ? (
        <button
          onClick={() => onDelete && onDelete(messageId)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      ) : (
        /* 상대방 메시지인 경우 신고 버튼 표시 */
        <button
          onClick={() => setShowReportModal(true)}
          className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          !
        </button>
      )}
      
      {/* 내가 보낸 메시지인 경우 읽음 상태 표시 */}
      {isFromMe && (
        <span className="text-xs text-gray-200 absolute bottom-0 right-1">
          {isRead ? "읽음" : "안읽음"}
        </span>
      )}

      {/* 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md w-80">
            <h3 className="text-lg font-bold mb-2">메시지 신고</h3>
            <textarea
              className="w-full border p-2 rounded-md mb-2"
              rows={4}
              placeholder="신고 사유를 입력하세요"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded-md"
                onClick={() => setShowReportModal(false)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md"
                onClick={handleReport}
                disabled={!reportReason.trim()}
              >
                신고하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
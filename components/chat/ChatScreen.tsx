"use client";

import { Button, Spinner } from "@material-tailwind/react";
import Person from "./ChatPersonItem";
import Message from "./Message";
import { useRecoilValue } from "recoil";
import {
  presenceState,
  selectedUserIdState,
  selectedUserIndexState,
} from "utils/recoil/atoms";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUserById } from "actions/chatActions";
import { createBrowserSupabaseClient } from "utils/supabase/client";

/**
 * 메시지 전송 함수
 * 사용자가 입력한 메시지를 Supabase 'message' 테이블에 저장합니다.
 * @param {string} message - 전송할 메시지 내용
 * @param {string} chatUserId - 메시지를 받을 사용자의 ID
 * @returns {Promise<any>} - 전송 결과 데이터
 */
export async function sendMessage({ message, chatUserId }) {
  const supabase = createBrowserSupabaseClient();

  // 현재 로그인한 사용자 세션 정보를 가져옵니다.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // 로그인하지 않은 사용자는 메시지를 보낼 수 없습니다.
  if (error || !session.user) {
    throw new Error("User is not authenticated");
  }

  // 메시지를 데이터베이스에 저장합니다.
  const { data, error: sendMessageError } = await supabase
    .from("message")
    .insert({
      message,
      receiver: chatUserId,
      sender: session.user.id,
    });

  if (sendMessageError) {
    throw new Error(sendMessageError.message);
  }

  return data;
}

/**
 * 모든 메시지 가져오기 함수
 * 현재 사용자와 대화 상대 사이에 오간 모든 메시지를 가져옵니다.
 * @param {string} chatUserId - 대화 상대의 ID
 * @returns {Promise<any[]>} - 메시지 목록
 */
export async function getAllMessages({ chatUserId }) {
  const supabase = createBrowserSupabaseClient();

  // 현재 로그인한 사용자 세션 정보를 가져옵니다.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // 로그인하지 않은 사용자는 메시지를 볼 수 없습니다.
  if (error || !session.user) {
    throw new Error("User is not authenticated");
  }

  // 두 사용자 간에 주고받은 모든 메시지를 가져옵니다.
  const { data, error: getMessagesError } = await supabase
    .from("message")
    .select("*")
    .or(`receiver.eq.${chatUserId},receiver.eq.${session.user.id}`)
    .or(`sender.eq.${chatUserId},sender.eq.${session.user.id}`)
    .order("created_at", { ascending: true });

  if (getMessagesError) {
    return [];
  }

  return data;
}

/**
 * 메시지 삭제 함수
 * 메시지를 완전히 삭제하지 않고 is_deleted 플래그를 true로 설정합니다.
 * @param {number} messageId - 삭제할 메시지의 ID
 * @returns {Promise<any>} - 삭제 결과 데이터
 */
export async function deleteMessage({ messageId }) {
  const supabase = createBrowserSupabaseClient();

  // 현재 로그인한 사용자 세션 정보를 가져옵니다.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // 로그인하지 않은 사용자는 메시지를 삭제할 수 없습니다.
  if (error || !session.user) {
    throw new Error("User is not authenticated");
  }

  // 메시지의 is_deleted 플래그를 true로 업데이트합니다.
  const { data, error: deleteMessageError } = await supabase
    .from("message")
    .update({ is_deleted: true })
    .eq("id", messageId);

  if (deleteMessageError) {
    throw new Error(deleteMessageError.message);
  }

  return data;
}

/**
 * 메시지 읽음 표시 함수
 * 메시지를 읽었음을 표시하는 is_read 플래그를 true로 설정합니다.
 * @param {number} messageId - 읽은 메시지의 ID
 * @returns {Promise<any>} - 업데이트 결과 데이터
 */
export async function markMessageAsRead({ messageId }) {
  const supabase = createBrowserSupabaseClient();

  // 현재 로그인한 사용자 세션 정보를 가져옵니다.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // 로그인하지 않은 사용자는 메시지 읽음 표시를 할 수 없습니다.
  if (error || !session.user) {
    throw new Error("User is not authenticated");
  }

  // 메시지의 is_read 플래그를 true로 업데이트합니다.
  const { data, error: updateError } = await supabase
    .from("message")
    .update({ is_read: true })
    .eq("id", messageId)
    .eq("receiver", session.user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return data;
}

/**
 * 사용자 차단 함수
 * 특정 사용자를 차단하여 더 이상 메시지를 주고받을 수 없게 합니다.
 * @param {string} blockedUserId - 차단할 사용자의 ID
 * @returns {Promise<any>} - 차단 결과 데이터
 */
export async function blockUser({ blockedUserId }) {
  const supabase = createBrowserSupabaseClient();

  // 현재 로그인한 사용자 세션 정보를 가져옵니다.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // 로그인하지 않은 사용자는 다른 사용자를 차단할 수 없습니다.
  if (error || !session.user) {
    throw new Error("User is not authenticated");
  }

  // blocked_users 테이블에 차단 정보를 저장합니다.
  const { data, error: blockError } = await supabase
    .from("blocked_users")
    .insert({
      blocker_id: session.user.id,
      blocked_id: blockedUserId,
    });

  if (blockError) {
    throw new Error(blockError.message);
  }

  return data;
}

/**
 * 메시지 신고 함수
 * 부적절한 메시지를 신고합니다.
 * @param {number} messageId - 신고할 메시지의 ID
 * @param {string} reason - 신고 사유
 * @param {string} reportedUserId - 신고당한 사용자의 ID
 * @returns {Promise<any>} - 신고 결과 데이터
 */
export async function reportMessage({ messageId, reason, reportedUserId }) {
  const supabase = createBrowserSupabaseClient();

  // 현재 로그인한 사용자 세션 정보를 가져옵니다.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // 로그인하지 않은 사용자는 메시지를 신고할 수 없습니다.
  if (error || !session.user) {
    throw new Error("User is not authenticated");
  }

  // reports 테이블에 신고 정보를 저장합니다.
  const { data, error: reportError } = await supabase.from("reports").insert({
    reporter_id: session.user.id,
    reported_id: reportedUserId,
    message_id: messageId,
    reason,
  });

  if (reportError) {
    throw new Error(reportError.message);
  }

  return data;
}

/**
 * 채팅 화면 컴포넌트
 * 선택한 사용자와의 대화 인터페이스를 제공합니다.
 */
export default function ChatScreen({}) {
  // Recoil 상태에서 필요한 값들을 가져옵니다.
  const selectedUserId = useRecoilValue(selectedUserIdState);
  const selectedUserIndex = useRecoilValue(selectedUserIndexState);
  const [message, setMessage] = useState(""); // 입력 메시지 상태
  const supabase = createBrowserSupabaseClient();
  const presence = useRecoilValue(presenceState);

  // 선택한 사용자의 정보를 가져오는 쿼리
  const selectedUserQuery = useQuery({
    queryKey: ["user", selectedUserId],
    queryFn: () => getUserById(selectedUserId),
    enabled: !!selectedUserId, // selectedUserId가 있을 때만 쿼리 실행
  });

  // 메시지 전송 뮤테이션
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      return sendMessage({
        message,
        chatUserId: selectedUserId,
      });
    },
    onSuccess: () => {
      setMessage(""); // 메시지 입력창 초기화
      getAllMessagesQuery.refetch(); // 메시지 목록 갱신
    },
  });

  // 모든 메시지를 가져오는 쿼리
  const getAllMessagesQuery = useQuery({
    queryKey: ["messages", selectedUserId],
    queryFn: () => getAllMessages({ chatUserId: selectedUserId }),
    enabled: !!selectedUserId, // selectedUserId가 있을 때만 쿼리 실행
    select: (data) => data.filter((message) => !message.is_deleted), // 삭제된 메시지 필터링
  });

  // 메시지 삭제 뮤테이션
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      return deleteMessage({ messageId });
    },
    onSuccess: () => {
      getAllMessagesQuery.refetch(); // 메시지 목록 갱신
    },
  });

  // 메시지 읽음 표시 뮤테이션
  const markMessageAsReadMutation = useMutation({
    mutationFn: async (messageId) => {
      return markMessageAsRead({ messageId });
    },
  });

  // 사용자 차단 뮤테이션
  const blockUserMutation = useMutation({
    mutationFn: async () => {
      return blockUser({
        blockedUserId: selectedUserId,
      });
    },
    onSuccess: () => {
      alert("사용자가 차단되었습니다.");
      // 추가: 차단 후 채팅 목록으로 이동하는 로직을 여기에 구현할 수 있습니다.
    },
  });

  // 메시지 신고 뮤테이션
  const reportMessageMutation = useMutation({
    mutationFn: (params: { messageId: number; reason: string }) => {
      return reportMessage({
        messageId: params.messageId,
        reason: params.reason,
        reportedUserId: selectedUserId,
      });
    },
    onSuccess: () => {
      alert("메시지가 신고되었습니다.");
    },
  });

  // 읽지 않은 메시지 처리 효과
  useEffect(() => {
    // 현재 채팅방에 있을 때 상대방이 보낸 메시지를 모두 읽음 처리
    if (getAllMessagesQuery.data && selectedUserId) {
      const unreadMessages = getAllMessagesQuery.data.filter(
        (message) => !message.is_read && message.sender === selectedUserId
      );

      unreadMessages.forEach((message) => {
        markMessageAsReadMutation.mutate(message.id);
      });
    }
  }, [getAllMessagesQuery.data, selectedUserId]);

// 실시간 메시지 업데이트를 위한 Supabase 채널 구독
useEffect(() => {
  if (!selectedUserId) return;
  
  const channel = supabase
    .channel("message_changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "message",
      },
      (payload) => {
        if (payload.eventType === "INSERT" && !payload.errors) {
          getAllMessagesQuery.refetch(); // 새 메시지가 생기면 목록 갱신
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE", // UPDATE 이벤트 추가
        schema: "public",
        table: "message",
      },
      (payload) => {
        if (payload.eventType === "UPDATE" && !payload.errors) {
          getAllMessagesQuery.refetch(); // 메시지가 업데이트되면 목록 갱신
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
  };
}, [selectedUserId, supabase, getAllMessagesQuery]);

  // 대화 상대가 없으면 빈 화면 표시
  if (!selectedUserQuery.data) {
    return <div className="w-full"></div>;
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 상단 부분: 대화 상대 정보 및 차단 버튼 */}
      <div className="flex items-center justify-between">
        <Person
          index={selectedUserIndex}
          isActive={false}
          name={selectedUserQuery.data?.email?.split("@")?.[0]}
          onChatScreen={true}
          onlineAt={presence?.[selectedUserId]?.[0]?.onlineAt}
          userId={selectedUserQuery.data?.id}
        />
        {/* 사용자 차단 버튼 */}
        <button
          onClick={() => {
            if (window.confirm("이 사용자를 차단하시겠습니까?")) {
              blockUserMutation.mutate();
            }
          }}
          className="p-2 bg-red-500 text-white rounded-md mr-4"
        >
          차단하기
        </button>
      </div>

      {/* 채팅 메시지 표시 영역 */}
      <div className="w-full overflow-y-scroll flex-1 flex flex-col p-4 gap-3">
        {getAllMessagesQuery.data?.map((message) => (
          <Message
            key={message.id}
            messageId={message.id}
            message={message.message}
            isFromMe={message.sender !== selectedUserId} // 수정: 내가 보낸 메시지인지 확인
            isRead={message.is_read}
            onDelete={(messageId) => deleteMessageMutation.mutate(messageId)}
            onReport={(messageId, reason) =>
              reportMessageMutation.mutate({ messageId, reason })
            }
          />
        ))}
      </div>

      {/* 메시지 입력 영역 */}
      <div className="flex">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="p-3 w-full border-2 border-light-blue-600"
          placeholder="메시지를 입력하세요."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (message.trim()) {
                sendMessageMutation.mutate();
              }
            }
          }}
        />

        {/* 메시지 전송 버튼 */}
        <button
          onClick={() => {
            if (message.trim()) {
              sendMessageMutation.mutate();
            }
          }}
          className="min-w-20 p-3 bg-light-blue-600 text-white"
          color="light-blue"
        >
          {sendMessageMutation.isPending ? <Spinner /> : <span>전송</span>}
        </button>
      </div>
    </div>
  );
}

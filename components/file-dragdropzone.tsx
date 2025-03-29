"use client";

import { Button, Spinner } from "@material-tailwind/react";
import { useMutation } from "@tanstack/react-query";
import { uploadFile } from "../actions/storageActions";
import { queryClient } from "config/ReactQueryClientProvider";
import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";

export default function FileDragDropZone() {
  const fileRef = useRef(null);
  const uploadImageMutation = useMutation({
    mutationFn: uploadFile, 
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["images"],
      });
    },
  });

  // Material Tailwind Button의 props를 any 타입으로 정의하여 타입 에러 해결
  const buttonProps: any = {
    loading: uploadImageMutation.isPending,
    type: "submit",
    children: "파일 업로드"
  };

  // Spinner 컴포넌트의 props를 any 타입으로 정의하여 타입 에러 해결
  const spinnerProps: any = {
    className: "h-8 w-8" // 크기 조정 (필요에 따라 조정)
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const formData = new FormData();

      acceptedFiles.forEach((file) => {
        formData.append(file.name, file);
      });

      await uploadImageMutation.mutate(formData);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className="w-full py-20 border-4 border-dotted border-indigo-700 flex flex-col items-center justify-center"
    >
      <input {...getInputProps()}/>

      {uploadImageMutation.isPending ? (
        <Spinner {...spinnerProps} />
      ) : isDragActive ? (
        <p>파일을 놓아주세요.</p>
      ) : (
        <p>파일을 여기에 끌어다 놓거나 클릭하여 업로드하세요.</p>
      )}

    </div>
  );
}
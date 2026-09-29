"use client";

import { AxiosError } from "axios";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/authApi";
import { useNotification } from "@/stores/notificationStore";
import { RegisterRequest } from "@/types/auth";

export function useUserRegister() {
  const router = useRouter();
  const addNotification = useNotification((state) => state.addNotification);

  const [formData, setFormData] = useState<RegisterRequest>({
    email: "",
    phone: "",
    fullName: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const updateField = useCallback((field: keyof RegisterRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const validate = useCallback((payload: RegisterRequest) => {
    const phone = payload.phone ?? "";

    if (!payload.email.trim()) {
      return "Email không được để trống.";
    }

    if (!payload.fullName.trim()) {
      return "Họ tên không được để trống.";
    }

    if (!phone.trim()) {
      return "Số điện thoại không được để trống.";
    }

    if (!payload.password.trim()) {
      return "Mật khẩu không được để trống.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return "Email không hợp lệ.";
    }

    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(phone)) {
      return "Số điện thoại không hợp lệ.";
    }

    if (payload.password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    return "";
  }, []);

  const handleRegister = useCallback(
    async (payload: RegisterRequest = formData) => {
      const validationMessage = validate(payload);
      if (validationMessage) {
        addNotification("error", validationMessage);
        return;
      }

      setLoading(true);

      try {
        await authApi.register(payload);

        addNotification("success", "Đăng ký thành công! Vui lòng đăng nhập.");
        setFormData({
          email: "",
          phone: "",
          fullName: "",
          password: "",
        });

        router.push("/login");
      } catch (error: unknown) {
        let message = "Đăng ký thất bại!";
        if (error instanceof AxiosError) {
          const responseData: unknown = error.response?.data;
          if (typeof responseData === "string" && responseData.trim()) {
            message = responseData;
          } else if (
            responseData &&
            typeof responseData === "object" &&
            "message" in responseData &&
            typeof responseData.message === "string"
          ) {
            message = responseData.message;
          } else if (error.message) {
            message = error.message;
          }
        } else if (error instanceof Error) {
          message = error.message;
        }

        addNotification("error", message);
      } finally {
        setLoading(false);
      }
    },
    [addNotification, formData, router, validate]
  );

  const resetForm = useCallback(() => {
    setFormData({
      email: "",
      phone: "",
      fullName: "",
      password: "",
    });
  }, []);

  return {
    formData,
    loading,
    updateField,
    handleRegister,
    resetForm,
  };
}

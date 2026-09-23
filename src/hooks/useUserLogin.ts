"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/authApi";
import { useAuthStore } from "@/stores/authStore";
import { useNotification } from "@/stores/notificationStore";
import { LoginRequest, UserResponse } from "@/types/auth";

export function useUserLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const addNotification = useNotification((state) => state.addNotification);

  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const updateField = useCallback((field: keyof LoginRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const validate = useCallback((payload: LoginRequest) => {
    if (!payload.email.trim()) {
      return "Email không được để trống.";
    }

    if (!payload.password.trim()) {
      return "Mật khẩu không được để trống.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return "Email không hợp lệ.";
    }

    return "";
  }, []);

  const handleLogin = useCallback(
    async (payload: LoginRequest = formData) => {
      const validationMessage = validate(payload);
      if (validationMessage) {
        addNotification("error", validationMessage);
        return;
      }

      setLoading(true);

      try {
        const response = await authApi.login(payload);

        if (response.role !== "USER") {
          addNotification("error", "Tài khoản này không có quyền truy cập người dùng!");
          return;
        }

        const user: UserResponse = {
          userId: response.userId,
          email: response.email,
          phone: response.phone ?? "",
          fullName: response.fullName,
          role: response.role,
        };

        setAuth(user, response.token);
        addNotification("success", response.message || "Đăng nhập thành công!");

        const redirectParam = typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;

        const destination = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/";
        router.push(destination);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data ||
          error?.message ||
          "Đăng nhập thất bại!";

        addNotification("error", message);
      } finally {
        setLoading(false);
      }
    },
    [addNotification, formData, router, setAuth, validate]
  );

  const resetForm = useCallback(() => {
    setFormData({ email: "", password: "" });
  }, []);

  return {
    formData,
    loading,
    updateField,
    handleLogin,
    resetForm,
  };
}

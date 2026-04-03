import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { notifyError, notifySuccess } from "../../utils/alerts";

import api from "../../api/client";
import { Button } from "../../components/Button";
import { useAuthStore } from "../../store/auth";

const schema = z.object({
  username: z.string().min(2, "Username required"),
  password: z.string().min(4, "Password required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setLoading(true);
      const tokenResponse = await api.post("/auth/login", values);
      const profileResponse = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      });
      setAuth({
        user: profileResponse.data,
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
      });
      notifySuccess("Welcome back 👋");
      navigate("/");
    } catch (error: any) {
      notifyError(error?.response?.data?.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <h2>Sign in to Smart Library</h2>
      <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>
        Please enter your staff credentials
      </p>
      <label htmlFor="username">Username</label>
      <input id="username" type="text" {...register("username")} />
      {errors.username && <small>{errors.username.message}</small>}
      <label htmlFor="password">Password</label>
      <input id="password" type="password" {...register("password")} />
      {errors.password && <small>{errors.password.message}</small>}
      <Button type="submit" style={{ width: "100%", marginTop: "1.5rem" }} disabled={loading}>
        {loading ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}

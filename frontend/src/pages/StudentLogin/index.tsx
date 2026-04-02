import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import studentApi from "../../api/studentClient";
import { Button } from "../../components/Button";
import { useStudentAuthStore } from "../../store/studentAuth";

const schema = z.object({
  member_id: z.string().min(3, "Member ID required"),
  national_id: z.string().min(4, "National ID required"),
});

type FormValues = z.infer<typeof schema>;

export function StudentLoginPage() {
  const navigate = useNavigate();
  const setSession = useStudentAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setLoading(true);
      const response = await studentApi.post("/student/login", values);
      setSession({ profile: response.data.profile, token: response.data.access_token });
      toast.success("Student session started");
      navigate("/student");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? "Unable to login");
    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <h2>Student Check-in</h2>
      <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>
        Enter your member ID and the ID used during registration.
      </p>
      <label htmlFor="member_id">Member ID</label>
      <input id="member_id" type="text" {...register("member_id")} />
      {errors.member_id && <small>{errors.member_id.message}</small>}
      <label htmlFor="national_id">National / Citizen ID</label>
      <input id="national_id" type="password" {...register("national_id")} />
      {errors.national_id && <small>{errors.national_id.message}</small>}
      <Button type="submit" style={{ width: "100%", marginTop: "1.5rem" }} disabled={loading}>
        {loading ? "Checking..." : "Login"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        style={{ width: "100%", marginTop: "0.75rem" }}
        onClick={() => navigate("/staff/login")}
      >
        Admin or staff? Login here
      </Button>
    </form>
  );
}

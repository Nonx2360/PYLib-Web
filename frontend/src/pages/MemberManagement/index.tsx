import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { notifyError, notifySuccess } from "../../utils/alerts";

import api from "../../api/client";
import { Button } from "../../components/Button";
import { Table } from "../../components/Table";
import styles from "./MemberManagement.module.css";

const schema = z
  .object({
    member_id: z.string().min(3),
    full_name: z.string().min(3),
    national_id: z.string().min(6),
    member_type: z.enum(["student", "staff"]),
    username: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.member_type === "staff") {
      if (!values.username || values.username.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["username"],
          message: "Username required for staff",
        });
      }
      if (!values.password || values.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password must be at least 6 characters",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

type Member = {
  member_id: string;
  full_name: string;
  member_type: string;
  joined_date: string;
  qr_code_path?: string | null;
  national_id?: string | null;
};

export function MemberManagementPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: members } = useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => (await api.get("/members")).data,
  });

  const { data: detail } = useQuery<Member>({
    queryKey: ["member", selected],
    queryFn: async () => (await api.get(`/members/${selected}`)).data,
    enabled: !!selected,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      member_type: "student",
      username: "",
      password: "",
    },
  });
  const memberType = form.watch("member_type");
  const usernameValue = form.watch("username");

  useEffect(() => {
    if (memberType !== "staff") return;
    const sanitized = usernameValue?.trim().replace(/\s+/g, "-") || "staff";
    const generatedId = `staff-${sanitized}`;
    const generatedName = sanitized === "staff" ? "Staff Member" : `Staff ${sanitized}`;
    const generatedNationalId = `STAFF-${sanitized.toUpperCase()}-ID`;
    if (form.getValues("member_id") !== generatedId) {
      form.setValue("member_id", generatedId, { shouldValidate: true });
    }
    if (form.getValues("full_name") !== generatedName) {
      form.setValue("full_name", generatedName, { shouldValidate: true });
    }
    if (form.getValues("national_id") !== generatedNationalId) {
      form.setValue("national_id", generatedNationalId, { shouldValidate: true });
    }
  }, [memberType, usernameValue, form]);

  const createMember = useMutation({
    mutationFn: (values: FormValues) => api.post("/members", values),
    onSuccess: async () => {
      notifySuccess("Member registered");
      form.reset({ member_type: "student", username: "", password: "" } as FormValues);
      await queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (error: any) => notifyError(error?.response?.data?.detail ?? "Failed to create member"),
  });

  const handleDownloadCard = async () => {
    if (!selected) return;
    try {
      setIsDownloading(true);
      const response = await api.get(`/members/${selected}/card.pdf`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selected}-card.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notifySuccess("Member card downloaded");
    } catch (error: any) {
      notifyError(error?.response?.data?.detail ?? "Unable to download card");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.panel}>
        <h3>Register Member</h3>
        <form style={{ marginTop: "1rem" }} onSubmit={form.handleSubmit((values) => createMember.mutate(values))}>
          <label htmlFor="member_id">Member ID</label>
          <input id="member_id" {...form.register("member_id")} disabled={memberType === "staff"} />
          {form.formState.errors.member_id && <small>{form.formState.errors.member_id.message}</small>}
          <label htmlFor="full_name">Full Name</label>
          <input id="full_name" {...form.register("full_name")} disabled={memberType === "staff"} />
          {form.formState.errors.full_name && <small>{form.formState.errors.full_name.message}</small>}
          <label htmlFor="national_id">National ID</label>
          <input id="national_id" {...form.register("national_id")} disabled={memberType === "staff"} />
          {form.formState.errors.national_id && <small>{form.formState.errors.national_id.message}</small>}
          <label htmlFor="member_type">Member Type</label>
          <select id="member_type" {...form.register("member_type")}>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
          </select>
          {memberType === "staff" && (
            <>
              <label htmlFor="username">Staff Username</label>
              <input id="username" {...form.register("username")} />
              {form.formState.errors.username && <small>{form.formState.errors.username.message}</small>}
              <label htmlFor="password">Staff Password</label>
              <input id="password" type="password" {...form.register("password")} />
              {form.formState.errors.password && <small>{form.formState.errors.password.message}</small>}
            </>
          )}
          <Button type="submit" style={{ width: "100%", marginTop: "1rem" }} disabled={createMember.isPending}>
            {createMember.isPending ? "Saving..." : "Create Member"}
          </Button>
        </form>
        {detail && (
          <div className={styles.detailBox}>
            <h4>Selected Member</h4>
            <p>{detail.full_name}</p>
            <p>National ID: {detail.national_id ?? "Hidden"}</p>
            {detail.qr_code_path && (
              <a href={detail.qr_code_path} target="_blank" rel="noreferrer">
                Download QR
              </a>
            )}
            <Button
              type="button"
              style={{ width: "100%", marginTop: "1rem" }}
              onClick={handleDownloadCard}
              disabled={isDownloading}
            >
              {isDownloading ? "Preparing card..." : "Download Member Card"}
            </Button>
          </div>
        )}
      </section>
      <section className={styles.memberList}>
        <h3>Members</h3>
        <Table
          headers={["Member ID", "Full Name", "Type", "Joined"]}
          rows={
            members && members.length > 0 ? (
              members.map((member) => (
                <tr
                  key={member.member_id}
                  onClick={() => setSelected(member.member_id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{member.member_id}</td>
                  <td>{member.full_name}</td>
                  <td>{member.member_type}</td>
                  <td>{new Date(member.joined_date).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No members yet</td>
              </tr>
            )
          }
        />
      </section>
    </div>
  );
}

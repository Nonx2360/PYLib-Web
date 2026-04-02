import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import api from "../../api/client";
import { Button } from "../../components/Button";
import { Table } from "../../components/Table";
import styles from "./MemberManagement.module.css";

const schema = z.object({
  member_id: z.string().min(3),
  full_name: z.string().min(3),
  national_id: z.string().min(6),
  member_type: z.enum(["student", "teacher"]),
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

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { member_type: "student" } });

  const createMember = useMutation({
    mutationFn: (values: FormValues) => api.post("/members", values),
    onSuccess: async () => {
      toast.success("Member registered");
      form.reset({ member_type: "student" } as FormValues);
      await queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail ?? "Failed to create member"),
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
      toast.success("Member card downloaded");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? "Unable to download card");
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
          <input id="member_id" {...form.register("member_id")} />
          {form.formState.errors.member_id && <small>{form.formState.errors.member_id.message}</small>}
          <label htmlFor="full_name">Full Name</label>
          <input id="full_name" {...form.register("full_name")} />
          {form.formState.errors.full_name && <small>{form.formState.errors.full_name.message}</small>}
          <label htmlFor="national_id">National ID</label>
          <input id="national_id" {...form.register("national_id")} />
          {form.formState.errors.national_id && <small>{form.formState.errors.national_id.message}</small>}
          <label htmlFor="member_type">Member Type</label>
          <select id="member_type" {...form.register("member_type")}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
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

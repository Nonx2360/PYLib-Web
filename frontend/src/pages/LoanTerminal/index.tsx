import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "../../api/client";
import { Button } from "../../components/Button";
import { QRScanner } from "../../components/QRScanner";
import styles from "./LoanTerminal.module.css";

const borrowSchema = z.object({
  member_id: z.string().min(3),
  book_id: z.string().min(3),
  due_date: z.string().min(1),
});

const returnSchema = z.object({
  member_id: z.string().min(3),
  book_id: z.string().min(3),
});

type BorrowValues = z.infer<typeof borrowSchema>;
type ReturnValues = z.infer<typeof returnSchema>;

type ScanTarget = "borrow_member" | "borrow_book" | "return_member" | "return_book";

export function LoanTerminalPage() {
  const queryClient = useQueryClient();
  const borrowForm = useForm<BorrowValues>({ resolver: zodResolver(borrowSchema) });
  const returnForm = useForm<ReturnValues>({ resolver: zodResolver(returnSchema) });
  const [scanTarget, setScanTarget] = useState<ScanTarget>("borrow_member");

  const borrowMutation = useMutation({
    mutationFn: (values: BorrowValues) => api.post("/loans/borrow", values),
    onSuccess: async () => {
      toast.success("Loan recorded");
      borrowForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["overdue"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail ?? "Unable to borrow"),
  });

  const returnMutation = useMutation({
    mutationFn: (values: ReturnValues) => api.post("/loans/return", values),
    onSuccess: async () => {
      toast.success("Item returned");
      returnForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["overdue"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail ?? "Unable to return"),
  });

  const handleScan = (value: string) => {
    switch (scanTarget) {
      case "borrow_member":
        borrowForm.setValue("member_id", value, { shouldValidate: true });
        break;
      case "borrow_book":
        borrowForm.setValue("book_id", value, { shouldValidate: true });
        break;
      case "return_member":
        returnForm.setValue("member_id", value, { shouldValidate: true });
        break;
      case "return_book":
        returnForm.setValue("book_id", value, { shouldValidate: true });
        break;
    }
    toast.info(`Scanned ${value}`);
  };

  return (
    <div className={styles.container}>
      <section className={styles.stack}>
        <div className={styles.panel}>
          <h3>Borrow</h3>
          <form onSubmit={borrowForm.handleSubmit((values) => borrowMutation.mutate(values))}>
            <label htmlFor="borrow_member">Member ID</label>
            <input id="borrow_member" {...borrowForm.register("member_id")} />
            {borrowForm.formState.errors.member_id && <small>{borrowForm.formState.errors.member_id.message}</small>}
            <label htmlFor="borrow_book">Book ID</label>
            <input id="borrow_book" {...borrowForm.register("book_id")} />
            {borrowForm.formState.errors.book_id && <small>{borrowForm.formState.errors.book_id.message}</small>}
            <label htmlFor="due_date">Due Date</label>
            <input id="due_date" type="date" {...borrowForm.register("due_date")} />
            {borrowForm.formState.errors.due_date && <small>{borrowForm.formState.errors.due_date.message}</small>}
            <Button style={{ width: "100%", marginTop: "1rem" }} disabled={borrowMutation.isPending}>
              {borrowMutation.isPending ? "Processing..." : "Borrow"}
            </Button>
          </form>
        </div>
        <div className={styles.panel}>
          <h3>Return</h3>
          <form onSubmit={returnForm.handleSubmit((values) => returnMutation.mutate(values))}>
            <label htmlFor="return_member">Member ID</label>
            <input id="return_member" {...returnForm.register("member_id")} />
            {returnForm.formState.errors.member_id && <small>{returnForm.formState.errors.member_id.message}</small>}
            <label htmlFor="return_book">Book ID</label>
            <input id="return_book" {...returnForm.register("book_id")} />
            {returnForm.formState.errors.book_id && <small>{returnForm.formState.errors.book_id.message}</small>}
            <Button style={{ width: "100%", marginTop: "1rem" }} disabled={returnMutation.isPending}>
              {returnMutation.isPending ? "Processing..." : "Return"}
            </Button>
          </form>
        </div>
      </section>
      <section className={styles.stack}>
        <div className={styles.buttonRow}>
          {(
            [
              { label: "Borrow Member", value: "borrow_member" },
              { label: "Borrow Book", value: "borrow_book" },
              { label: "Return Member", value: "return_member" },
              { label: "Return Book", value: "return_book" },
            ] as { label: string; value: ScanTarget }[]
          ).map((option) => (
            <Button
              key={option.value}
              variant={scanTarget === option.value ? "primary" : "secondary"}
              onClick={() => setScanTarget(option.value)}
              type="button"
            >
              {option.label}
            </Button>
          ))}
        </div>
        <QRScanner onScan={handleScan} />
        <p style={{ color: "var(--color-muted)" }}>Scanning target: {scanTarget.replace("_", " → ")}</p>
      </section>
    </div>
  );
}

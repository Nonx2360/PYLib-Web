import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import api from "../../api/client";
import { Button } from "../../components/Button";
import { Table } from "../../components/Table";
import styles from "./Inventory.module.css";

const schema = z.object({
  book_id: z.string().min(3),
  title: z.string().min(3),
  author: z.string().min(3),
  category: z.string().optional(),
  quantity: z.coerce.number().min(1),
});

type FormValues = z.infer<typeof schema>;

type Book = {
  book_id: string;
  title: string;
  author: string;
  category?: string;
  quantity: number;
  available_quantity: number;
  added_at: string;
};

export function InventoryPage() {
  const queryClient = useQueryClient();
  const { data: books } = useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: async () => (await api.get("/books")).data,
  });

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post("/books", values),
    onSuccess: async () => {
      toast.success("Book added");
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail ?? "Unable to add book"),
  });

  return (
    <div className={styles.container}>
      <section className={styles.panel}>
        <h3>Add Book</h3>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <label htmlFor="book_id">Book ID</label>
          <input id="book_id" {...form.register("book_id")} />
          {form.formState.errors.book_id && <small>{form.formState.errors.book_id.message}</small>}
          <label htmlFor="title">Title</label>
          <input id="title" {...form.register("title")} />
          {form.formState.errors.title && <small>{form.formState.errors.title.message}</small>}
          <label htmlFor="author">Author</label>
          <input id="author" {...form.register("author")} />
          {form.formState.errors.author && <small>{form.formState.errors.author.message}</small>}
          <label htmlFor="category">Category</label>
          <input id="category" {...form.register("category")} />
          <label htmlFor="quantity">Quantity</label>
          <input id="quantity" type="number" {...form.register("quantity", { valueAsNumber: true })} />
          {form.formState.errors.quantity && <small>{form.formState.errors.quantity.message}</small>}
          <Button style={{ width: "100%", marginTop: "1rem" }} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save"}
          </Button>
        </form>
      </section>
      <section>
        <h3>Inventory</h3>
        <Table
          headers={["Book ID", "Title", "Author", "Category", "Available"]}
          rows={
            books && books.length > 0 ? (
              books.map((book) => (
                <tr key={book.book_id}>
                  <td>{book.book_id}</td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.category ?? "-"}</td>
                  <td>
                    {book.available_quantity}/{book.quantity}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No books yet</td>
              </tr>
            )
          }
        />
      </section>
    </div>
  );
}

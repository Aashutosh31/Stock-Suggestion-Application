import { useState } from "react";
import { Link } from "react-router-dom";
import { NotebookPen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/ui/label";
import { useCreateNote, useDeleteNote, useNotes, useSearch } from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDateTime } from "@/lib/format";

export default function Notes() {
  const notes = useNotes();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const [symbol, setSymbol] = useState("");
  const [term, setTerm] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const debounced = useDebouncedValue(term, 220);
  const search = useSearch(debounced, 5);

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader title="Research notes" description="Capture your thesis, catalysts and risks against any instrument." />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookPen className="size-4 text-brand" /> New note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Instrument">
              <div className="relative">
                <Input
                  value={symbol || term}
                  onChange={(e) => {
                    setSymbol("");
                    setTerm(e.target.value.toUpperCase());
                  }}
                  placeholder="Search symbol…"
                />
                {term && !symbol && search.data && search.data.length > 0 ? (
                  <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-[var(--nv-shadow)]">
                    {search.data.map((s) => (
                      <li key={s.symbol}>
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs hover:bg-surface-2"
                          onClick={() => {
                            setSymbol(s.symbol);
                            setTerm("");
                          }}
                        >
                          <span className="font-medium text-ink">{s.symbol}</span>
                          <span className="truncate text-[10px] text-subtle">{s.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Field>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Breakout setup" />
            </Field>
            <Field label="Note">
              <Textarea rows={7} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Why you're watching this…" />
            </Field>
            <Button
              className="w-full"
              disabled={!symbol || !title.trim() || !content.trim()}
              loading={createNote.isPending}
              onClick={() =>
                createNote.mutate(
                  { symbol, title: title.trim(), content: content.trim() },
                  {
                    onSuccess: () => {
                      toast.success("Note saved");
                      setTitle("");
                      setContent("");
                      setSymbol("");
                    },
                    onError: () => toast.error("Could not save note"),
                  },
                )
              }
            >
              Save note
            </Button>
          </CardContent>
        </Card>

        <Async
          query={notes}
          loading={<Skeleton className="h-64" />}
          empty={(list) => list.length === 0}
          emptyTitle="No notes yet"
          emptyDescription="Create your first research note on the left."
        >
          {(list) => (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((note) => (
                <Card key={note._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/stocks/${note.symbol}`}>
                          <Badge variant="brand">{note.symbol}</Badge>
                        </Link>
                        <p className="mt-2 font-medium text-ink">{note.title}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete note"
                        onClick={() => deleteNote.mutate(note._id, { onSuccess: () => toast.success("Note deleted") })}
                      >
                        <Trash2 className="size-3.5 text-down" />
                      </Button>
                    </div>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs text-muted">{note.content}</p>
                    <p className="mt-3 text-[10px] text-subtle">{formatDateTime(note.createdAt)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Async>
      </div>
    </div>
  );
}

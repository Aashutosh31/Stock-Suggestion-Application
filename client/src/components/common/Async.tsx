import * as React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/feedback";

interface AsyncProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => React.ReactNode;
  loading?: React.ReactNode;
  empty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function Async<T>({
  query,
  children,
  loading,
  empty,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  className,
}: AsyncProps<T>) {
  if (query.isLoading) {
    return <div className={className}>{loading ?? <Skeleton className="h-40 w-full" />}</div>;
  }
  if (query.isError) {
    const err = query.error;
    const message = err instanceof ApiError ? err.message : "Unexpected error while loading data.";
    return (
      <ErrorState
        className={className}
        description={message}
        onRetry={() => void query.refetch()}
      />
    );
  }
  const data = query.data as T;
  if (data === undefined || data === null) {
    return <div className={className}>{loading ?? <Skeleton className="h-40 w-full" />}</div>;
  }
  if (empty && empty(data)) {
    return <EmptyState className={className} title={emptyTitle} description={emptyDescription} />;
  }
  return <div className={className}>{children(data)}</div>;
}

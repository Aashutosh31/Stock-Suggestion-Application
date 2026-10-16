import { Link } from "react-router-dom";
import { useAppMeta } from "@/hooks/queries";

export function AppFooter() {
  const { data } = useAppMeta();
  return (
    <footer className="mt-auto border-t border-line bg-bg-elevated px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl leading-relaxed">
          {data?.disclaimer ??
            "Nivesh Terminal is an educational research tool. It is not investment advice and provides no guarantee of returns."}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Data provider: <span className="text-muted">{data?.provider.label ?? "—"}</span>
            {data?.provider.demo ? " (simulated)" : ""}
          </span>
          <Link to="/settings" className="hover:text-muted">
            Settings
          </Link>
          <Link to="/tools" className="hover:text-muted">
            Methodology
          </Link>
        </div>
      </div>
    </footer>
  );
}

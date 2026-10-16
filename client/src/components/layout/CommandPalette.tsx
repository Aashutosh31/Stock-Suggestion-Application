import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Activity, Briefcase, Calculator, GitCompareArrows, Plus, Sparkles, Star, TrendingUp } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChangePill } from "@/components/common/values";
import { useSearch, useRecentlyViewed } from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 220);
  const navigate = useNavigate();
  const { data: results, isFetching } = useSearch(debounced, 8);
  const { data: recent } = useRecentlyViewed();

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setQuery("");
  };

  const go = (path: string) => {
    close(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={close}>
      <CommandInput placeholder="Search stocks, navigate, or run an action…" value={query} onValueChange={setQuery} />
      <CommandList>
        {query.trim().length === 0 ? (
          <>
            {recent && recent.length > 0 ? (
              <CommandGroup heading="Recently viewed">
                {recent.slice(0, 5).map((item) => (
                  <CommandItem key={item.symbol} value={`recent-${item.symbol}`} onSelect={() => go(`/stocks/${item.symbol}`)}>
                    <TrendingUp className="size-4 text-subtle" />
                    <span className="font-medium">{item.symbol}</span>
                    <span className="truncate text-xs text-subtle">{item.name}</span>
                    {item.quote ? <span className="ml-auto"><ChangePill value={item.quote.changePercent} size="sm" /></span> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            <CommandGroup heading="Quick actions">
              <CommandItem value="goto-suggestions" onSelect={() => go("/suggestions")}>
                <Sparkles className="size-4 text-subtle" /> Open suggestions engine
              </CommandItem>
              <CommandItem value="goto-screener" onSelect={() => go("/screener")}>
                <Activity className="size-4 text-subtle" /> Open screener
              </CommandItem>
              <CommandItem value="goto-compare" onSelect={() => go("/compare")}>
                <GitCompareArrows className="size-4 text-subtle" /> Compare stocks
              </CommandItem>
              <CommandItem value="goto-watchlists" onSelect={() => go("/watchlists")}>
                <Star className="size-4 text-subtle" /> Manage watchlists
              </CommandItem>
              <CommandItem value="goto-portfolio" onSelect={() => go("/portfolio")}>
                <Briefcase className="size-4 text-subtle" /> Open portfolio
              </CommandItem>
              <CommandItem value="goto-tools" onSelect={() => go("/tools")}>
                <Calculator className="size-4 text-subtle" /> Open calculators
              </CommandItem>
              <CommandItem value="action-add-alert" onSelect={() => go("/alerts")}>
                <Plus className="size-4 text-subtle" /> Create a price alert
              </CommandItem>
            </CommandGroup>
          </>
        ) : (
          <CommandGroup heading={isFetching ? "Searching…" : "Instruments"}>
            {results?.map((instrument) => (
              <CommandItem
                key={instrument.symbol}
                value={`${instrument.symbol} ${instrument.name}`}
                onSelect={() => go(`/stocks/${instrument.symbol}`)}
              >
                <TrendingUp className="size-4 text-subtle" />
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{instrument.symbol}</span>
                  <span className="truncate text-xs text-subtle">{instrument.name}</span>
                </div>
                <span className="ml-auto text-[10px] uppercase text-subtle">{instrument.exchange}</span>
              </CommandItem>
            ))}
            {results && results.length === 0 && !isFetching ? (
              <CommandEmpty>No instruments match “{query}”.</CommandEmpty>
            ) : null}
          </CommandGroup>
        )}
      </CommandList>
      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[10px] text-subtle">
        <span>Search across the NSE/BSE universe</span>
        <span className="tnum">{results?.length ? `${results.length} results` : ""}</span>
      </div>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return { open, setOpen };
}

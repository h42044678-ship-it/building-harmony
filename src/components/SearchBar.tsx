import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="mx-4 mt-5 -mb-1">
      <div className="flex items-center gap-2 bg-secondary/70 rounded-2xl px-4 py-3 border border-border">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          dir="rtl"
          placeholder="ابحث عن مستأجر بالاسم..."
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

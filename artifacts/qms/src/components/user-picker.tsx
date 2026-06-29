import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useListUsers } from "@workspace/api-client-react";

interface UserPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function UserPicker({ value, onChange, placeholder = "Select person...", disabled, className }: UserPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const { data } = useListUsers({ search: search || undefined, pageSize: 50 });
  const users = data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
        >
          <span className="truncate">{value || placeholder}</span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                className="rounded-full hover:bg-muted p-0.5"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(""); } }}
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search users..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.name}
                  onSelect={() => {
                    onChange(user.name);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === user.name ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface MultiUserPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiUserPicker({ value, onChange, placeholder = "Add team member...", disabled }: MultiUserPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const { data } = useListUsers({ search: search || undefined, pageSize: 50 });
  const users = (data?.data ?? []).filter((u) => !selected.includes(u.name));

  const add = (name: string) => {
    const updated = [...selected, name].join(", ");
    onChange(updated);
    setOpen(false);
    setSearch("");
  };

  const remove = (name: string) => {
    onChange(selected.filter((n) => n !== name).join(", "));
  };

  return (
    <div className="space-y-2">
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-normal text-muted-foreground">
              <span>{placeholder}</span>
              <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Search users..." value={search} onValueChange={setSearch} />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem key={user.id} value={user.name} onSelect={() => add(user.name)}>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/20 min-h-[44px]">
          {selected.map((name) => (
            <span key={name} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium">
              {name}
              {!disabled && (
                <button onClick={() => remove(name)} className="ml-1 text-primary/60 hover:text-primary">
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/20">No team members assigned</div>
      )}
    </div>
  );
}

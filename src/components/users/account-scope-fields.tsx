import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

interface AccountScopeFieldsProps<T extends FieldValues> {
  control: Control<T>;
}

function ScopeCheckbox({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 rounded-md border p-3">
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-4 w-4 accent-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export function AccountScopeFields<T extends FieldValues>({ control }: AccountScopeFieldsProps<T>) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Account scope</p>
      <Controller
        name={"isSixClub" as Path<T>}
        control={control}
        render={({ field }) => (
          <ScopeCheckbox
            id="user-six-club"
            label="6ixClubs"
            description="Sees only 6ixClubs venues, including the percentage, gross revenue, and their cut."
            checked={Boolean(field.value)}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        name={"isIndependent" as Path<T>}
        control={control}
        render={({ field }) => (
          <ScopeCheckbox
            id="user-independent"
            label="Independent"
            description="Sees only their own records, not other sales reps. With 6ixClubs ticked, that is only their own 6ixClubs venues."
            checked={Boolean(field.value)}
            onChange={field.onChange}
          />
        )}
      />
      <p className="text-xs text-muted-foreground">
        Leave both unticked for a Luxe Dispense sales rep. They see the full locations dashboard, not 6ixClubs, and can still be assigned to locations.
      </p>
    </div>
  );
}

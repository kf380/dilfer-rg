interface FormFieldProps {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  as?: "input" | "select" | "textarea";
  children?: React.ReactNode;
  placeholder?: string;
}

export default function FormField({ label, name, defaultValue, type = "text", required, disabled, as = "input", children, placeholder }: FormFieldProps) {
  const base = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {as === "select" ? (
        <select name={name} defaultValue={defaultValue} required={required} className={base}>
          {children}
        </select>
      ) : as === "textarea" ? (
        <textarea name={name} defaultValue={defaultValue} required={required} disabled={disabled} placeholder={placeholder} rows={3} className={base} />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} required={required} disabled={disabled} placeholder={placeholder} className={base} />
      )}
    </div>
  );
}

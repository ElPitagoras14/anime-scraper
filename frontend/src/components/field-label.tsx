import { FieldInfo } from "@/utils/interfaces";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "./ui/input";

interface FieldLabelProps {
  fieldInfo: FieldInfo;
  formContext: any;
  className?: string;
}

export default function FieldLabel({
  fieldInfo,
  formContext,
  className,
}: FieldLabelProps) {
  const { name, label, placeholder, type } = fieldInfo;
  return (
    <FormField
      control={formContext.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-muted-foreground">{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              className="w-full"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

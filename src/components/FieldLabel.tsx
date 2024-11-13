import { FieldInfo } from "@/utils/interfaces";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "./ui/label";
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
          <Label className="text-muted-foreground">{label}</Label>
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

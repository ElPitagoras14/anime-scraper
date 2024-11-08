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
}

export default function FieldLabel({
  fieldInfo,
  formContext,
}: FieldLabelProps) {
  const { name, label, placeholder, type } = fieldInfo;
  return (
    <FormField
      control={formContext.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Label>{label}</Label>
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

"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { TypographyH2, TypographyH4 } from "@/components/ui/typography";
import {
  IconBrandGithub,
  IconCup,
  IconLocationStar,
} from "@tabler/icons-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import FieldLabel from "@/components/field-label";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";

const fields = [
  {
    name: "username",
    initValue: "",
    label: "Username",
    placeholder: "funnybunny",
    type: "text",
    validation: z
      .string()
      .min(1, { message: "Username is required" })
      .regex(/^[a-zA-Z]+[a-zA-Z0-9_]*$/, { message: "Invalid username" }),
  },
  {
    name: "password",
    initValue: "",
    label: "Password",
    placeholder: "**********",
    type: "password",
    validation: z
      .string()
      .min(1, { message: "Password is required" })
      .max(32, { message: "Password is too long" }),
  },
];

const validationSchema = z.object(
  fields.reduce((acc, field) => {
    acc[field.name] = field.validation;
    return acc;
  }, {} as any)
);

const initialValues = fields.reduce((acc, field) => {
  acc[field.name] = field.initValue;
  return acc;
}, {} as any);

export default function Register() {
  const { status } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const [isLoadingLogin, setIsLoadingLogin] = useState(false);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    values: any
  ) => {
    if (event.key === "Enter") {
      handleLogin(values);
    }
  };

  const handleLogin = async (data: z.infer<typeof validationSchema>) => {
    setIsLoadingLogin(true);
    try {
      const response = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (response && !response.error) {
        router.push("/scraper");
      } else {
        toast({
          title: "Error logging in",
          description: "Please try again later",
        });
      }
    } catch (error: any) {
      if (!error.response) {
        toast({
          title: "Error logging in",
          description: "Please try again later",
        });
      }
    }
    setIsLoadingLogin(false);
  };

  if (status === "authenticated") {
    router.push("/scraper");
    return;
  }

  return (
    <div className="flex min-w-full min-h-svh">
      <div className="bg-secondary w-[50%] hidden lg:block">
        <div className="flex flex-col justify-between min-h-svh px-8 py-8">
          <div className="flex space-x-4 items-center">
            <IconLocationStar className="w-8 h-8" />
            <TypographyH4>Anime Scraper</TypographyH4>
          </div>
          <div className="flex space-x-4">
            <Link
              href={"https://github.com/ElPitagoras14"}
              className="flex items-center space-x-1 px-0"
            >
              <IconBrandGithub />
              <p className="text-sm">GitHub</p>
            </Link>
            <Link
              href={"https://www.buymeacoffee.com/jhonyg"}
              className="flex items-center space-x-1 px-0"
            >
              <IconCup />
              <p className="text-sm">Support</p>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between lg:justify-center w-[100%] lg:w-[50%] pt-8 pb-6">
        <div className="flex space-x-4 items-center w-[100%] px-6 lg:hidden">
          <IconLocationStar className="w-8 h-8" />
          <TypographyH4>Anime Scraper</TypographyH4>
        </div>
        <div className="flex flex-col items-center justify-center w-[70%]">
          <TypographyH2>Login</TypographyH2>
          <p className="text-xs md:text-base text-muted-foreground mb-4">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary">
              Register
            </Link>
          </p>
          <Form {...form}>
            <form
              className="flex flex-col space-y-2 w-[100%] lg:w-[20vw] justify-center"
              onKeyDown={(e: any) => {
                const { success } = validationSchema.safeParse(
                  form.getValues()
                );
                if (success) {
                  handleKeyDown(e, form.getValues());
                }
              }}
            >
              {fields.map((field) => (
                <FieldLabel
                  key={field.name}
                  fieldInfo={field}
                  formContext={form}
                />
              ))}
              <div className="py-2"></div>
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={() => handleLogin(form.getValues())}
                disabled={
                  isLoadingLogin ||
                  !form.formState.isDirty ||
                  !form.formState.isValid
                }
              >
                {isLoadingLogin ? (
                  <Icons.spinner className="h-6 w-6 animate-spin" />
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Form>
        </div>
        <div className="flex space-x-4 w-[100%] justify-center lg:hidden">
          <Link
            href={"https://github.com/ElPitagoras14"}
            className="flex items-center space-x-1 px-0"
          >
            <IconBrandGithub />
            <p className="text-sm">GitHub</p>
          </Link>
          <Link
            href={"https://www.buymeacoffee.com/jhonyg"}
            className="flex items-center space-x-1 px-0"
          >
            <IconCup />
            <p className="text-sm">Support</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

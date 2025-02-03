"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { TypographyH2, TypographyH4 } from "@/components/ui/typography";
import { IconLocationStar } from "@tabler/icons-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import FieldLabel from "@/components/field-label";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Icons } from "@/components/ui/icons";
import { KeyboardEventHandler, useState } from "react";
import SocialMediaInfo from "@/components/social-media-info";

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
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = form.handleSubmit(
    async (data: z.infer<typeof validationSchema>) => {
      try {
        setIsLoading(true);
        const response = await signIn("credentials", {
          username: data.username,
          password: data.password,
          redirect: false,
        });

        if (response && !response.error) {
          router.push("/");
        } else {
          if (response!.error === "Configuration") {
            toast({
              title: "Error logging in",
              description: "Please try again later",
            });
          } else if (response!.error === "CredentialsSignin") {
            toast({
              title: "Error logging in",
              description: "Invalid username or password",
            });
          }
        }
      } catch (error: any) {
        if (!error.response) {
          toast({
            title: "Error logging in",
            description: "Please try again later",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSubmit();
    }
  };

  return (
    <div className="flex min-w-full min-h-svh">
      <div className="bg-secondary w-[50%] hidden lg:block">
        <div className="flex flex-col justify-between min-h-svh px-8 py-8">
          <div className="flex space-x-4 items-center">
            <IconLocationStar className="w-8 h-8" />
            <TypographyH4>Anime Scraper</TypographyH4>
          </div>
          <div className="flex space-x-4">
            <SocialMediaInfo />
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
              onKeyDown={handleKeyDown as KeyboardEventHandler}
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
                onClick={onSubmit}
                disabled={isLoading || !form.formState.isDirty}
              >
                {isLoading ? (
                  <Icons.spinner className="h-6 w-6 animate-spin" />
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Form>
        </div>
        <div className="flex space-x-4 w-[100%] justify-center lg:hidden">
          <SocialMediaInfo />
        </div>
      </div>
    </div>
  );
}

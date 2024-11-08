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
import FieldLabel from "@/components/FieldLabel";
import Link from "next/link";

const fields = [
  {
    name: "username",
    initValue: "",
    label: "Username",
    placeholder: "funnybunny",
    type: "text",
    validation: z
      .string()
      .min(4, { message: "Username is too short" })
      .max(50, { message: "Username is too long" })
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
      .min(6, { message: "Password is too short" })
      .max(32, { message: "Password is too long" }),
  },
  {
    name: "confirmPassword",
    initValue: "",
    label: "Confirm Password",
    placeholder: "**********",
    type: "password",
    validation: z
      .string()
      .min(6, { message: "Password is too short" })
      .max(32, { message: "Password is too long" }),
  },
];

const validationSchema = z
  .object(
    fields.reduce((acc, field) => {
      acc[field.name] = field.validation;
      return acc;
    }, {} as any)
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const initialValues = fields.reduce((acc, field) => {
  acc[field.name] = field.initValue;
  return acc;
}, {} as any);

export default function Register() {
  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const onSubmit = (data: z.infer<typeof validationSchema>) => {
    console.log(data);
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
          <TypographyH2>Create an account</TypographyH2>
          <p className="text-xs md:text-base text-muted-foreground mb-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary">
              Login
            </Link>
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col space-y-2 w-[100%] lg:w-[20vw] justify-center"
            >
              {fields.map((field) => (
                <FieldLabel
                  key={field.name}
                  fieldInfo={field}
                  formContext={form}
                />
              ))}
              <div className="py-2"></div>
              <Button type="submit" size="lg" variant="secondary" className="">
                Register
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

import { cn } from "@/lib/utils";

export function TypographyH1({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-5xl font-semibold tracking-tight lg:text-6xl",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function TypographyH2({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <h2
      className={cn(
        "scroll-m-20 pb-2 text-2xl md:text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function TypographyH3({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-lg md:text-2xl font-semibold tracking-tight",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function TypographyH4({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <h4
      className={cn(
        "scroll-m-20 text-base md:text-xl font-semibold tracking-tight",
        className
      )}
    >
      {children}
    </h4>
  );
}

export function TypographyH5({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <h5
      className={cn(
        "scroll-m-20 text-base md:text-lg font-medium tracking-tight",
        className
      )}
    >
      {children}
    </h5>
  );
}

export function TypographyH6({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <h6
      className={cn(
        "scroll-m-20 text-sm md:text-base font-medium tracking-tight",
        className
      )}
    >
      {children}
    </h6>
  );
}

export function TypographyP({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <p
      className={cn("text-xs md:text-base text-muted-foreground leading-8 [&:not(:first-child)]:mt-6", className)}
    >
      {children}
    </p>
  );
}

export function TypographyList({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
      {children}
    </ul>
  );
}

export function TypographyInlineCode({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
    >
      {children}
    </code>
  );
}

export function TypographyLarge({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn("text-lg font-semibold", className)}>{children}</div>
  );
}

export function TypographySmall({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <small
      className={cn("text-xs nd:text-sm font-medium leading-6", className)}
    >
      {children}
    </small>
  );
}

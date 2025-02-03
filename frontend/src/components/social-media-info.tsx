import { IconBrandGithub, IconCup } from "@tabler/icons-react";
import Link from "next/link";

export default function SocialMediaInfo() {
  return (
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
  );
}

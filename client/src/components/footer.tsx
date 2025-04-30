import { Link } from "wouter";
import { FaXTwitter } from "react-icons/fa6";

export function Footer() {
  return (
    <footer className="border-t py-4 mt-auto bg-background">
      <div className="container flex flex-col items-center justify-center text-center mx-auto">
        <div className="text-sm text-muted-foreground">
          <span>
            vibe coded with <span className="text-red-500">♥</span> by Kuan
          </span>
        </div>
      </div>
    </footer>
  );
}

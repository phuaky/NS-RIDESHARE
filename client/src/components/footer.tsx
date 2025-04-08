import { Link } from "wouter";
import { FaXTwitter } from "react-icons/fa6";

export function Footer() {
  return (
    <footer className="border-t py-4 mt-auto bg-background">
      <div className="container flex flex-col items-center justify-center gap-2 md:flex-row md:justify-between">
        <div className="text-sm text-muted-foreground">
          <span>
            vibe coded with <span className="text-red-500">♥</span> by{" "}
            <a
              href="https://x.com/phuakuanyu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Kuan
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

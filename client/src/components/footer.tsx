import { Link } from "wouter";
import { FaXTwitter } from "react-icons/fa6";

export function Footer() {
  return (
    <footer className="border-t py-4 mt-auto bg-background">
      <div className="container flex flex-col items-center justify-center gap-2 md:flex-row md:justify-between">
        <div className="text-sm text-muted-foreground">
          <span>vibe coded with <span className="text-red-500">♥</span> by Kuan</span>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="https://x.com/phuakuanyu" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            title="Follow @phuakuanyu on X"
          >
            <FaXTwitter className="h-4 w-4" />
            <span className="text-sm">@phuakuanyu</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
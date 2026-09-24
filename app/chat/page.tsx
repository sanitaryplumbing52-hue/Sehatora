import type { Metadata } from "next";
import { ChatPanel } from "@/components/features/chat-panel";

export const metadata: Metadata = {
  title: "AI Style Chat",
  description: "Ask STYLEAI's fashion assistant for outfit ideas, color advice, and styling guidance.",
};

export default function ChatPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold">AI Style Chat</h1>
        <p className="mt-3 text-muted-foreground">Your personal fashion assistant, aware of your saved style profile.</p>
      </div>
      <ChatPanel />
    </div>
  );
}

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { AdvisorConversation, AdvisorConversationSummary, AdvisorMessage, AdvisorSource } from "@/lib/types";

// Persistence for advisor chats. Every function takes `userId` and scopes to it,
// so a user can only ever read or mutate their own conversations — there is no
// path that reaches another user's threads.

const MAX_CONVERSATIONS = 60; // most-recent, shown in the sidebar
const MAX_THREAD_MESSAGES = 200; // guard when reopening a very long thread

export interface AdvisorTurnInput {
  role: "user" | "assistant";
  content: string;
  sources?: AdvisorSource[];
}

/** Sidebar list: the user's recent conversations, most-recently-active first. */
export async function listAdvisorConversations(userId: string): Promise<AdvisorConversationSummary[]> {
  const rows = await prisma.advisorConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: MAX_CONVERSATIONS,
    select: { id: true, title: true, updatedAt: true },
  });
  return rows.map((r) => ({ id: r.id, title: r.title, updatedAt: r.updatedAt.toISOString() }));
}

function toMessages(rows: { role: string; content: string; sources: Prisma.JsonValue }[]): AdvisorMessage[] {
  return rows.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
    sources: Array.isArray(m.sources) ? (m.sources as unknown as AdvisorSource[]) : undefined,
  }));
}

/** Full thread for the client (reopening a past chat). Null if not owned/found. */
export async function getAdvisorConversation(
  userId: string,
  id: string,
): Promise<AdvisorConversation | null> {
  const convo = await prisma.advisorConversation.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: MAX_THREAD_MESSAGES,
        select: { role: true, content: true, sources: true },
      },
    },
  });
  if (!convo) return null;
  return { id: convo.id, title: convo.title, messages: toMessages(convo.messages) };
}

/** Prior turns (role + content only) for feeding the model as history. */
export async function getAdvisorHistory(
  userId: string,
  id: string,
  limit: number,
): Promise<{ role: "user" | "assistant"; content: string }[] | null> {
  const convo = await prisma.advisorConversation.findFirst({
    where: { id, userId },
    select: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true },
      },
    },
  });
  if (!convo) return null;
  const turns = convo.messages.map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));
  return turns.slice(-limit);
}

function toCreateData(userId: string, turns: AdvisorTurnInput[]) {
  return turns.map((t) => ({
    userId,
    role: t.role,
    content: t.content,
    sources: t.sources === undefined ? undefined : (t.sources as unknown as Prisma.InputJsonValue),
  }));
}

/** Start a new conversation with its first user + assistant turns. Returns id. */
export async function createAdvisorConversation(
  userId: string,
  title: string,
  turns: AdvisorTurnInput[],
): Promise<string> {
  const convo = await prisma.advisorConversation.create({
    data: { userId, title, messages: { create: toCreateData(userId, turns) } },
    select: { id: true },
  });
  return convo.id;
}

/**
 * Append turns to an existing conversation the user owns. The nested create runs
 * through `update`, which bumps the conversation's `@updatedAt` so it rises to
 * the top of the sidebar. Returns false if the conversation isn't the user's.
 */
export async function appendAdvisorTurns(
  userId: string,
  conversationId: string,
  turns: AdvisorTurnInput[],
): Promise<boolean> {
  const owned = await prisma.advisorConversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!owned) return false;
  await prisma.advisorConversation.update({
    where: { id: conversationId },
    data: { messages: { create: toCreateData(userId, turns) } },
  });
  return true;
}

/** Delete a conversation (and its messages, via cascade). Returns success. */
export async function deleteAdvisorConversation(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.advisorConversation.deleteMany({ where: { id, userId } });
  return count > 0;
}

"use client";

import { useSyncExternalStore } from "react";
import { findPlan, type PlanFilter } from "./plans";

export interface ApplicationInput { name: string; phone: string; plan_id: string; privacy_agreed: boolean }
export interface DemoReceipt extends ApplicationInput { id: string; application_no: string; created_at: string; status: "demo_complete" }
interface Session { filter: PlanFilter; receipt: DemoReceipt | null; completed: boolean; openingReceipt: boolean }
const initial: Session = { filter: "all", receipt: null, completed: false, openingReceipt: false };
let session = initial;
const listeners = new Set<() => void>();
function update(change: Partial<Session>) {
  session = { ...session, ...change };
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useDemoSession() { return useSyncExternalStore(subscribe, () => session, () => initial); }
export const chooseFilter = (filter: PlanFilter) => update({ filter });
export const beginApplication = () => update({ completed: false, receipt: null, openingReceipt: false });
export const receiptOpened = () => { if (session.openingReceipt) update({ openingReceipt: false }); };
export const clearReceipt = () => { if (session.receipt) update({ receipt: null, openingReceipt: false }); };
export const validName = (name: string) => name.trim().length >= 1 && Array.from(name).length <= 20;
export const validPhone = (phone: string) => /^010\d{8}$/.test(phone);
export const validApplication = (input: ApplicationInput) => validName(input.name) && validPhone(input.phone) && input.privacy_agreed && Boolean(findPlan(input.plan_id));

// Future persistence belongs behind this input/result boundary. No persistence
// adapter is installed; the demo result exists only in the current JS memory.
export function completeDemo(input: ApplicationInput): DemoReceipt {
  if (session.completed || !validApplication(input)) throw new Error("시연 입력을 확인해 주세요.");
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const receipt: DemoReceipt = { ...input, name: input.name.trim(), id: crypto.randomUUID(), application_no: `SUB-${String(random[0] % 1000000).padStart(6, "0")}`, created_at: new Date().toISOString(), status: "demo_complete" };
  update({ receipt, completed: true, openingReceipt: true });
  return receipt;
}
export function displayPhone(phone: string) { return phone.length === 11 ? `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}` : phone; }
export function maskedPhone(phone: string) { return `${phone.slice(0, 3)}-****-${phone.slice(7)}`; }
export function displayDate(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

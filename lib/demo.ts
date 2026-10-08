"use client";

import { useSyncExternalStore } from "react";
import { findPlan, type PlanFilter } from "./plans";

export interface ApplicationInput { name: string; phone: string; plan_id: string; privacy_agreed: boolean }
interface Session { filter: PlanFilter; receiptId: string | null; completed: boolean; openingReceipt: boolean }
const initial: Session = { filter: "all", receiptId: null, completed: false, openingReceipt: false };
let session = initial;
const listeners = new Set<() => void>();
function update(change: Partial<Session>) {
  session = { ...session, ...change };
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useDemoSession() { return useSyncExternalStore(subscribe, () => session, () => initial); }
export const chooseFilter = (filter: PlanFilter) => update({ filter });
export const beginApplication = () => update({ completed: false, receiptId: null, openingReceipt: false });
export const receiptOpened = () => { if (session.openingReceipt) update({ openingReceipt: false }); };
export const clearReceipt = () => { if (session.receiptId) update({ receiptId: null, openingReceipt: false }); };
export const validName = (name: string) => name.trim().length >= 1 && Array.from(name).length <= 20;
export const validPhone = (phone: string) => /^010\d{8}$/.test(phone);
export const validApplication = (input: ApplicationInput) => validName(input.name) && validPhone(input.phone) && input.privacy_agreed && Boolean(findPlan(input.plan_id));

// Pass only the saved row id between pages; completion reads its content afresh.
export const applicationSaved = (id: string) => update({ receiptId: id, completed: true, openingReceipt: true });
export function displayPhone(phone: string) { return phone.length === 11 ? `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}` : phone; }
export function maskedPhone(phone: string) { return `${phone.slice(0, 3)}-****-${phone.slice(7)}`; }
export function maskedName(name: string) {
  const letters = Array.from(name);
  if (letters.length <= 1) return "*";
  if (letters.length === 2) return `${letters[0]}*`;
  return `${letters[0]}${"*".repeat(letters.length - 2)}${letters[letters.length - 1]}`;
}
export function displayDate(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
